import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {
  STORE_CONFIG,
  normalizePhone,
  readDatabase,
  writeDatabase,
} from './server/db.ts';
import type { Order, OrderStatus, Product, StreakCard } from './server/types.ts';

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || (IS_PROD ? '' : 'HOOK2026');
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const ONLINE_PAYMENT_ENABLED = Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
// Customer OTP needs an SMS/email provider; until one is wired in it only works outside production.
const OTP_ENABLED = !IS_PROD;
const UPLOAD_DIR = path.resolve(process.cwd(), 'data', 'uploads');

const ADMIN_TOKEN_TTL_MS = 12 * 3600_000;
const USER_TOKEN_TTL_MS = 30 * 24 * 3600_000;

const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();
const adminTokens = new Map<string, number>();
const userTokens = new Map<string, { identifier: string; phone?: string; email?: string; expiresAt: number }>();

function bearer(req: express.Request): string {
  return (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
}

function isAdminAuthorized(req: express.Request): boolean {
  const token = bearer(req);
  const exp = token ? adminTokens.get(token) : undefined;
  if (!exp) return false;
  if (exp < Date.now()) {
    adminTokens.delete(token);
    return false;
  }
  return true;
}

function getCustomer(req: express.Request) {
  const token = bearer(req);
  const sess = token ? userTokens.get(token) : undefined;
  if (!sess) return null;
  if (sess.expiresAt < Date.now()) {
    userTokens.delete(token);
    return null;
  }
  return sess;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/** Tiny in-memory fixed-window rate limiter (per IP + bucket). */
const hits = new Map<string, { count: number; resetAt: number }>();
function rateLimit(bucket: string, max: number, windowMs: number): express.RequestHandler {
  return (req, res, next) => {
    const key = `${bucket}:${req.ip}`;
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt < now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    entry.count += 1;
    if (entry.count > max) {
      res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
      return;
    }
    next();
  };
}
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
  for (const [k, v] of adminTokens) if (v < now) adminTokens.delete(k);
  for (const [k, v] of userTokens) if (v.expiresAt < now) userTokens.delete(k);
  for (const [k, v] of otpStore) if (v.expiresAt < now) otpStore.delete(k);
}, 10 * 60_000).unref();

const clean = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

const IMAGE_SIGNATURES: Array<{ ext: string; test: (b: Buffer) => boolean }> = [
  { ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: 'webp', test: (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' },
];

function validImageRef(v: unknown): v is string {
  return (
    typeof v === 'string' &&
    v.length <= 300 &&
    (/^\/uploads\/[a-f0-9]+\.(jpg|png|webp)$/.test(v) || /^https:\/\/[^\s]+$/.test(v) || /^[a-z0-9_]+$/.test(v))
  );
}

async function razorpayRequest(method: 'GET' | 'POST', endpoint: string, body?: unknown) {
  const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
  const r = await fetch(`https://api.razorpay.com/v1${endpoint}`, {
    method,
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (!r.ok) throw new Error(String((data.error as { description?: string })?.description || 'Razorpay error'));
  return data;
}

interface PricedCart {
  items: Order['items'];
  subtotal: number;
  shipping: number;
  total: number;
}

/** Re-prices a cart from the catalog. Never trusts client-supplied prices or names. */
function priceCart(rawItems: unknown, db: ReturnType<typeof readDatabase>): PricedCart | { error: string } {
  if (!Array.isArray(rawItems) || rawItems.length === 0 || rawItems.length > 50) {
    return { error: 'Your bag is empty.' };
  }
  const qtyByLine = new Map<string, number>();
  const items: Order['items'] = [];
  for (const raw of rawItems as Array<Record<string, unknown>>) {
    const product = db.products.find((p) => p.id === raw?.productId);
    const quantity = Math.floor(Number(raw?.quantity));
    const size = clean(raw?.size, 10);
    const color = clean(raw?.color, 40);
    if (!product || !Number.isFinite(quantity) || quantity < 1 || quantity > 20) {
      return { error: 'One of the items in your bag is no longer available.' };
    }
    if (!product.sizes.includes(size) || !product.colors.includes(color)) {
      return { error: `Please re-select size and color for ${product.name}.` };
    }
    const totalForProduct = (qtyByLine.get(product.id) || 0) + quantity;
    qtyByLine.set(product.id, totalForProduct);
    if (!product.inStock || totalForProduct > product.stock) {
      return { error: `${product.name} only has ${Math.max(0, product.stock)} left in stock.` };
    }
    items.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      size,
      color,
      quantity,
      image: product.images[0] || '',
    });
  }
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal >= STORE_CONFIG.freeDeliveryThreshold ? 0 : 99;
  return { items, subtotal, shipping, total: subtotal + shipping };
}

async function createServer() {
  const app = express();
  if (IS_PROD) {
    if (!ADMIN_PASSCODE || ADMIN_PASSCODE.length < 8) {
      console.warn('WARNING: Set ADMIN_PASSCODE (8+ characters) in production or admin login stays disabled.');
    }
    app.set('trust proxy', 1);
  }
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (IS_PROD) res.setHeader('Strict-Transport-Security', 'max-age=15552000');
    next();
  });
  app.use(express.json({ limit: '100kb' }));
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true }));

  // Ensure the database file exists on boot
  readDatabase();

  // Health & Store Config
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, shop: STORE_CONFIG.shopName });
  });

  app.get('/api/config', (_req, res) => {
    res.json({
      ...STORE_CONFIG,
      onlinePaymentEnabled: ONLINE_PAYMENT_ENABLED,
      razorpayKeyId: ONLINE_PAYMENT_ENABLED ? RAZORPAY_KEY_ID : '',
      otpEnabled: OTP_ENABLED,
    });
  });

  // Admin image upload (raw binary body; type verified by magic bytes)
  app.post(
    '/api/uploads',
    express.raw({ type: () => true, limit: '8mb' }),
    (req, res) => {
      if (!isAdminAuthorized(req)) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const buf = req.body as Buffer;
      const kind = Buffer.isBuffer(buf) ? IMAGE_SIGNATURES.find((s) => s.test(buf)) : undefined;
      if (!kind) {
        res.status(400).json({ error: 'Only JPG, PNG or WebP images up to 8 MB are allowed.' });
        return;
      }
      const name = `${crypto.randomBytes(12).toString('hex')}.${kind.ext}`;
      fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
      res.status(201).json({ url: `/uploads/${name}` });
    }
  );

  // Search suggestions & products list
  app.get('/api/products', (req, res) => {
    const db = readDatabase();
    let list = [...db.products];

    const category = String(req.query.category || '').toLowerCase();
    const subcategory = String(req.query.subcategory || '').toLowerCase();
    const size = String(req.query.size || '').toUpperCase();
    const color = String(req.query.color || '').toLowerCase();
    const search = String(req.query.search || '').toLowerCase().trim();
    const featured = req.query.featured === 'true';
    const newArrival = req.query.newArrival === 'true';
    const minPrice = Number(req.query.minPrice || 0);
    const maxPrice = Number(req.query.maxPrice || 0);
    const sort = String(req.query.sort || 'newest');

    if (category === 'men' || category === 'women') {
      list = list.filter((p) => p.category === category);
    }
    if (subcategory) {
      list = list.filter((p) => p.subcategory.toLowerCase() === subcategory);
    }
    if (size) {
      list = list.filter((p) => p.sizes.includes(size));
    }
    if (color) {
      list = list.filter((p) => p.colors.some((c) => c.toLowerCase() === color));
    }
    if (featured) {
      list = list.filter((p) => p.isFeatured);
    }
    if (newArrival) {
      list = list.filter((p) => p.isNewArrival);
    }
    if (minPrice > 0) {
      list = list.filter((p) => p.price >= minPrice);
    }
    if (maxPrice > 0) {
      list = list.filter((p) => p.price <= maxPrice);
    }
    if (search) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.subcategory.toLowerCase().includes(search) ||
          p.fit.toLowerCase().includes(search) ||
          p.colors.some((c) => c.toLowerCase().includes(search))
      );
    }

    if (sort === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sort === 'featured') {
      list.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
    } else {
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    res.json({ products: list, total: list.length });
  });

  app.get('/api/products/:idOrSlug', (req, res) => {
    const db = readDatabase();
    const key = req.params.idOrSlug;
    const product = db.products.find((p) => p.id === key || p.slug === key);
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const related = db.products
      .filter((p) => p.id !== product.id && (p.subcategory === product.subcategory || p.category === product.category))
      .slice(0, 4);
    res.json({ product, related });
  });

  // Admin Products CRUD
  app.post('/api/products', (req, res) => {
    if (!isAdminAuthorized(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const db = readDatabase();
    const body = req.body as Partial<Product>;
    const price = Number(body.price);
    const images = Array.isArray(body.images) ? body.images.filter(validImageRef) : [];
    if (
      !body.name ||
      (body.category !== 'men' && body.category !== 'women') ||
      !body.subcategory ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      res.status(400).json({ error: 'Name, category, subcategory and a valid price are required.' });
      return;
    }
    if (images.length === 0) {
      res.status(400).json({ error: 'Upload at least one product photo.' });
      return;
    }
    const id = `dh-${crypto.randomBytes(3).toString('hex')}`;
    const slugBase = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const slug = `${slugBase}-${id.slice(-3)}`;
    const stock = Math.max(0, Math.floor(Number(body.stock ?? 0)) || 0);

    const newProduct: Product = {
      id,
      slug,
      name: clean(body.name, 120),
      category: body.category,
      subcategory: clean(body.subcategory, 60),
      price,
      compareAtPrice: Number(body.compareAtPrice) > price ? Number(body.compareAtPrice) : undefined,
      sizes: Array.isArray(body.sizes) && body.sizes.length ? body.sizes.map((x) => clean(x, 10)) : ['S', 'M', 'L', 'XL', 'XXL'],
      colors: Array.isArray(body.colors) && body.colors.length ? body.colors.map((x) => clean(x, 40)) : ['Black'],
      images,
      description: clean(body.description, 2000) || `${clean(body.name, 120)} from Daddy's Hook.`,
      fabric: clean(body.fabric, 120) || 'Cotton',
      fit: clean(body.fit, 120) || 'Regular Fit',
      gsm: clean(body.gsm, 30) || '',
      stock,
      inStock: body.inStock !== false && stock > 0,
      isFeatured: Boolean(body.isFeatured),
      isNewArrival: body.isNewArrival !== false,
      createdAt: new Date().toISOString(),
    };

    db.products.unshift(newProduct);
    writeDatabase(db);
    res.status(201).json({ product: newProduct });
  });

  app.patch('/api/products/:id', (req, res) => {
    if (!isAdminAuthorized(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const db = readDatabase();
    const idx = db.products.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    const u = req.body as Partial<Product>;
    const cur = db.products[idx];
    const next: Product = { ...cur };
    if (typeof u.name === 'string' && u.name.trim()) next.name = clean(u.name, 120);
    if (u.category === 'men' || u.category === 'women') next.category = u.category;
    if (typeof u.subcategory === 'string' && u.subcategory) next.subcategory = clean(u.subcategory, 60);
    if (u.price !== undefined && Number(u.price) > 0) next.price = Number(u.price);
    if (u.compareAtPrice !== undefined) {
      next.compareAtPrice = Number(u.compareAtPrice) > next.price ? Number(u.compareAtPrice) : undefined;
    }
    if (u.stock !== undefined) next.stock = Math.max(0, Math.floor(Number(u.stock)) || 0);
    if (Array.isArray(u.sizes) && u.sizes.length) next.sizes = u.sizes.map((x) => clean(x, 10));
    if (Array.isArray(u.colors) && u.colors.length) next.colors = u.colors.map((x) => clean(x, 40));
    if (Array.isArray(u.images)) {
      const imgs = u.images.filter(validImageRef);
      if (imgs.length) next.images = imgs;
    }
    if (typeof u.description === 'string') next.description = clean(u.description, 2000);
    if (typeof u.fabric === 'string') next.fabric = clean(u.fabric, 120);
    if (typeof u.fit === 'string') next.fit = clean(u.fit, 120);
    if (typeof u.gsm === 'string') next.gsm = clean(u.gsm, 30);
    if (typeof u.isFeatured === 'boolean') next.isFeatured = u.isFeatured;
    if (typeof u.isNewArrival === 'boolean') next.isNewArrival = u.isNewArrival;
    if (typeof u.inStock === 'boolean') next.inStock = u.inStock;
    if (next.stock <= 0) next.inStock = false;
    db.products[idx] = next;
    writeDatabase(db);
    res.json({ product: db.products[idx] });
  });

  app.delete('/api/products/:id', (req, res) => {
    if (!isAdminAuthorized(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const db = readDatabase();
    const before = db.products.length;
    db.products = db.products.filter((p) => p.id !== req.params.id);
    if (db.products.length === before) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    writeDatabase(db);
    res.json({ deleted: true });
  });

  // Orders & Checkout
  app.get('/api/orders', (req, res) => {
    const db = readDatabase();
    if (isAdminAuthorized(req)) {
      res.json({ orders: db.orders });
      return;
    }
    const customer = getCustomer(req);
    if (customer) {
      const mine = db.orders.filter((o) =>
        customer.phone
          ? normalizePhone(o.phone) === customer.phone
          : Boolean(customer.email && o.email && o.email.toLowerCase() === customer.email.toLowerCase())
      );
      res.json({ orders: mine });
      return;
    }
    res.status(401).json({ error: 'Unauthorized' });
  });

  // Order lookup: admin, the signed-in owner, or anyone holding BOTH the order id and its phone number.
  app.get('/api/orders/:id', rateLimit('order-lookup', 30, 10 * 60_000), (req, res) => {
    const db = readDatabase();
    const order = db.orders.find((o) => o.id.toLowerCase() === req.params.id.toLowerCase());
    const phoneQuery = req.query.phone ? normalizePhone(String(req.query.phone)) : '';
    const customer = getCustomer(req);
    const allowed =
      order &&
      (isAdminAuthorized(req) ||
        (phoneQuery.length >= 10 && normalizePhone(order.phone) === phoneQuery) ||
        (customer?.phone && normalizePhone(order.phone) === customer.phone));
    if (!order || !allowed) {
      res.status(404).json({ error: 'Order not found. Check the order ID and phone number.' });
      return;
    }
    const streakCard = db.streaks.find((s) => s.phone === normalizePhone(order.phone)) || null;
    res.json({ order, streakCard });
  });

  // Create a Razorpay order for the current cart (amount computed server-side).
  app.post('/api/payments/razorpay/order', rateLimit('rzp-order', 20, 10 * 60_000), async (req, res) => {
    if (!ONLINE_PAYMENT_ENABLED) {
      res.status(503).json({ error: 'Online payment is not available right now. Please choose Cash on Delivery.' });
      return;
    }
    const priced = priceCart(req.body?.items, readDatabase());
    if ('error' in priced) {
      res.status(400).json({ error: priced.error });
      return;
    }
    try {
      const rz = await razorpayRequest('POST', '/orders', {
        amount: priced.total * 100,
        currency: 'INR',
        receipt: `dh_${Date.now().toString(36)}`,
      });
      res.json({ razorpayOrderId: rz.id, amount: priced.total * 100, keyId: RAZORPAY_KEY_ID });
    } catch (err) {
      console.error('Razorpay order failed:', err);
      res.status(502).json({ error: 'Could not start online payment. Please try again or use Cash on Delivery.' });
    }
  });

  app.post('/api/orders', rateLimit('create-order', 15, 10 * 60_000), async (req, res) => {
    let db = readDatabase();
    const body = req.body as Record<string, unknown>;
    const customerName = clean(body.customerName, 100);
    const address = clean(body.address, 400);
    const city = clean(body.city, 80);
    const pincode = clean(body.pincode, 6);
    const email = clean(body.email, 120);
    const cleanPhone = normalizePhone(clean(body.phone, 20));
    const paymentMethod = body.paymentMethod === 'RAZORPAY_UPI' ? 'RAZORPAY_UPI' : 'COD';

    if (!customerName || !address || !city) {
      res.status(400).json({ error: 'Please provide name, address and city.' });
      return;
    }
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
      return;
    }
    if (!/^[1-9]\d{5}$/.test(pincode)) {
      res.status(400).json({ error: 'Please enter a valid 6-digit pincode.' });
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    const priced = priceCart(body.items, db);
    if ('error' in priced) {
      res.status(400).json({ error: priced.error });
      return;
    }
    const { items, subtotal, shipping, total } = priced;

    let paymentRef: string | undefined;
    if (paymentMethod === 'RAZORPAY_UPI') {
      if (!ONLINE_PAYMENT_ENABLED) {
        res.status(400).json({ error: 'Online payment is not available. Please choose Cash on Delivery.' });
        return;
      }
      const rzOrderId = clean(body.razorpayOrderId, 60);
      const rzPaymentId = clean(body.razorpayPaymentId, 60);
      const rzSignature = clean(body.razorpaySignature, 128);
      const expected = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${rzOrderId}|${rzPaymentId}`)
        .digest('hex');
      if (!rzOrderId || !rzPaymentId || !safeEqual(expected, rzSignature)) {
        res.status(400).json({ error: 'Payment could not be verified. If money was deducted, contact us on WhatsApp.' });
        return;
      }
      if (db.orders.some((o) => o.paymentRef === rzPaymentId)) {
        res.status(409).json({ error: 'This payment has already been used for an order.' });
        return;
      }
      try {
        const rz = await razorpayRequest('GET', `/orders/${encodeURIComponent(rzOrderId)}`);
        if (Number(rz.amount) !== total * 100) {
          res.status(400).json({ error: 'Cart total changed during payment. Contact us on WhatsApp with your payment ID: ' + rzPaymentId });
          return;
        }
      } catch {
        res.status(502).json({ error: 'Could not confirm payment with the bank. Contact us on WhatsApp with your payment ID: ' + rzPaymentId });
        return;
      }
      paymentRef = rzPaymentId;
    }

    // Re-read after any awaited payment check so concurrent orders can't overwrite each other,
    // then re-validate stock against the fresh data.
    db = readDatabase();
    const repriced = priceCart(body.items, db);
    if ('error' in repriced || repriced.total !== total) {
      res.status(409).json({
        error:
          ('error' in repriced ? repriced.error : 'Prices changed while you were checking out.') +
          (paymentRef ? ` Contact us on WhatsApp with payment ID ${paymentRef}.` : ''),
      });
      return;
    }

    const orderNumber = 1001 + db.orders.length;
    const orderId = `DH-${orderNumber}`;

    const newOrder: Order = {
      id: orderId,
      customerName,
      phone: cleanPhone,
      email: email || undefined,
      address,
      city,
      pincode,
      items,
      subtotal,
      shipping,
      total,
      paymentMethod,
      paymentRef,
      status: 'Pending',
      streakStampAwarded: true,
      createdAt: new Date().toISOString(),
    };

    // Decrement stock
    for (const item of items) {
      const prod = db.products.find((p) => p.id === item.productId);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
        if (prod.stock === 0) {
          prod.inStock = false;
        }
      }
    }

    // Award a streak stamp automatically for this order
    let streak = db.streaks.find((s) => s.phone === cleanPhone);
    const nowIso = new Date().toISOString();
    if (!streak) {
      streak = {
        phone: cleanPhone,
        customerName,
        stamps: 1,
        prizesClaimed: 0,
        prizeClaimedPendingReset: false,
        history: [{ date: nowIso, note: `Earned stamp from order ${orderId}`, orderId }],
        updatedAt: nowIso,
      };
      db.streaks.unshift(streak);
    } else {
      streak.customerName = streak.customerName || customerName;
      if (streak.stamps < STORE_CONFIG.streakTarget) {
        streak.stamps += 1;
      }
      streak.history.unshift({
        date: nowIso,
        note: `Earned stamp from order ${orderId}`,
        orderId,
      });
      streak.updatedAt = nowIso;
    }

    db.orders.unshift(newOrder);
    writeDatabase(db);
    res.status(201).json({ order: newOrder, streakCard: streak });
  });

  app.patch('/api/orders/:id', (req, res) => {
    if (!isAdminAuthorized(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const db = readDatabase();
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    const nextStatus = req.body.status as OrderStatus;
    if (!['Pending', 'Packed', 'Shipped', 'Delivered'].includes(nextStatus)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }
    order.status = nextStatus;
    writeDatabase(db);
    res.json({ order });
  });

  // Streak Card Endpoints
  app.get('/api/streak', (req, res) => {
    if (!isAdminAuthorized(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const db = readDatabase();
    res.json({ streaks: db.streaks });
  });

  app.get('/api/streak/:phone', rateLimit('streak-lookup', 40, 10 * 60_000), (req, res) => {
    const cleanPhone = normalizePhone(req.params.phone);
    if (cleanPhone.length < 10) {
      res.status(400).json({ error: 'Enter a valid 10-digit phone number.' });
      return;
    }
    const db = readDatabase();
    const card = db.streaks.find((s) => s.phone === cleanPhone);
    if (!card) {
      res.json({
        streakCard: {
          phone: cleanPhone,
          stamps: 0,
          prizesClaimed: 0,
          prizeClaimedPendingReset: false,
          history: [],
          updatedAt: new Date().toISOString(),
        } satisfies StreakCard,
        isNew: true,
      });
      return;
    }
    res.json({ streakCard: card, isNew: false });
  });

  app.post('/api/streak/:phone/stamp', (req, res) => {
    if (!isAdminAuthorized(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const cleanPhone = normalizePhone(req.params.phone);
    if (cleanPhone.length < 10) {
      res.status(400).json({ error: 'Valid 10-digit phone required' });
      return;
    }
    const db = readDatabase();
    const nowIso = new Date().toISOString();
    let card = db.streaks.find((s) => s.phone === cleanPhone);
    const note = String(req.body?.note || 'Added by store admin');
    const customerName = req.body?.customerName ? String(req.body.customerName).trim() : undefined;

    if (!card) {
      card = {
        phone: cleanPhone,
        customerName,
        stamps: 1,
        prizesClaimed: 0,
        prizeClaimedPendingReset: false,
        history: [{ date: nowIso, note }],
        updatedAt: nowIso,
      };
      db.streaks.unshift(card);
    } else {
      if (customerName) card.customerName = customerName;
      if (card.stamps < STORE_CONFIG.streakTarget) {
        card.stamps += 1;
      }
      card.history.unshift({ date: nowIso, note });
      card.updatedAt = nowIso;
    }

    writeDatabase(db);
    res.json({ streakCard: card });
  });

  app.post('/api/streak/:phone/claim', (req, res) => {
    if (!isAdminAuthorized(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const cleanPhone = normalizePhone(req.params.phone);
    const db = readDatabase();
    const card = db.streaks.find((s) => s.phone === cleanPhone);
    if (!card) {
      res.status(404).json({ error: 'Streak card not found' });
      return;
    }
    if (card.stamps < STORE_CONFIG.streakTarget) {
      res.status(400).json({ error: 'Customer has not reached 10 stamps yet.' });
      return;
    }
    const nowIso = new Date().toISOString();
    card.prizesClaimed += 1;
    card.stamps = 0;
    card.prizeClaimedPendingReset = false;
    card.history.unshift({
      date: nowIso,
      note: `Prize claimed (${STORE_CONFIG.streakPrizeName}) — card refreshed`,
    });
    card.updatedAt = nowIso;
    writeDatabase(db);
    res.json({ streakCard: card });
  });

  // Customer OTP Auth & Admin Login
  app.post('/api/auth/otp/request', rateLimit('otp-request', 6, 10 * 60_000), (req, res) => {
    if (!OTP_ENABLED) {
      res.status(503).json({ error: 'Sign-in codes are not available yet. Use order tracking instead.' });
      return;
    }
    const identifier = clean(req.body?.identifier, 120);
    if (!identifier) {
      res.status(400).json({ error: 'Email or phone number is required.' });
      return;
    }
    const code = String(crypto.randomInt(100000, 1000000));
    otpStore.set(identifier.toLowerCase(), { code, expiresAt: Date.now() + 5 * 60_000, attempts: 0 });
    res.json({
      sent: true,
      message: 'One-time verification code generated.',
      verificationCode: code, // development only: no SMS/email provider is connected
    });
  });

  app.post('/api/auth/otp/verify', rateLimit('otp-verify', 20, 10 * 60_000), (req, res) => {
    const identifier = clean(req.body?.identifier, 120);
    const code = clean(req.body?.code, 10);
    const key = identifier.toLowerCase();
    const entry = otpStore.get(key);
    if (entry) entry.attempts += 1;
    if (!entry || entry.expiresAt < Date.now() || entry.attempts > 5 || !safeEqual(entry.code, code)) {
      res.status(400).json({ error: 'Invalid or expired OTP code.' });
      return;
    }
    otpStore.delete(key);
    const isEmail = identifier.includes('@');
    const user = {
      identifier,
      phone: isEmail ? undefined : normalizePhone(identifier),
      email: isEmail ? identifier : undefined,
      role: 'customer' as const,
    };
    const token = crypto.randomBytes(24).toString('hex');
    userTokens.set(token, { ...user, expiresAt: Date.now() + USER_TOKEN_TTL_MS });
    res.json({ user: { ...user, token } });
  });

  app.post('/api/admin/login', rateLimit('admin-login', 8, 15 * 60_000), (req, res) => {
    const passcode = String(req.body?.passcode || '').trim();
    if (!ADMIN_PASSCODE || ADMIN_PASSCODE.length < 8 && IS_PROD) {
      res.status(503).json({ error: 'Admin login is disabled until ADMIN_PASSCODE is configured on the server.' });
      return;
    }
    if (!safeEqual(passcode, ADMIN_PASSCODE)) {
      res.status(401).json({ error: 'Incorrect admin passcode.' });
      return;
    }
    const token = crypto.randomBytes(24).toString('hex');
    adminTokens.set(token, Date.now() + ADMIN_TOKEN_TTL_MS);
    res.json({ token });
  });

  // Admin Dashboard Stats
  app.get('/api/stats', (req, res) => {
    if (!isAdminAuthorized(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const db = readDatabase();
    const totalRevenue = db.orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = db.orders.length;
    const pendingOrders = db.orders.filter((o) => o.status === 'Pending').length;
    const deliveredOrders = db.orders.filter((o) => o.status === 'Delivered').length;
    const totalProducts = db.products.length;
    const outOfStockProducts = db.products.filter((p) => !p.inStock || p.stock === 0).length;
    const activeStreaks = db.streaks.length;
    const prizesReady = db.streaks.filter((s) => s.stamps >= STORE_CONFIG.streakTarget).length;
    const prizesClaimed = db.streaks.reduce((sum, s) => sum + s.prizesClaimed, 0);

    res.json({
      totalRevenue,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalProducts,
      outOfStockProducts,
      activeStreaks,
      prizesReady,
      prizesClaimed,
    });
  });

  // Contact Inquiry
  app.get('/api/inquiries', (req, res) => {
    if (!isAdminAuthorized(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    res.json({ inquiries: readDatabase().inquiries });
  });

  app.post('/api/contact', rateLimit('contact', 5, 10 * 60_000), (req, res) => {
    const { name, phone, email, message } = req.body as {
      name?: string;
      phone?: string;
      email?: string;
      message?: string;
    };
    if (!name || !message) {
      res.status(400).json({ error: 'Name and message are required.' });
      return;
    }
    const db = readDatabase();
    const inquiry = {
      id: `inq-${crypto.randomBytes(3).toString('hex')}`,
      name: clean(name, 100),
      phone: clean(phone, 20),
      email: clean(email, 120),
      message: clean(message, 3000),
      createdAt: new Date().toISOString(),
    };
    db.inquiries.unshift(inquiry);
    writeDatabase(db);
    res.status(201).json({ inquiry });
  });

  // Dynamic SEO Sitemap
  app.get('/sitemap.xml', (req, res) => {
    const db = readDatabase();
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const staticRoutes = ['', '/shop', '/shop?category=men', '/shop?category=women', '/about', '/contact', '/wishlist', '/login'];
    const urls = [
      ...staticRoutes.map((route) => `<url><loc>${baseUrl}${route}</loc><changefreq>weekly</changefreq></url>`),
      ...db.products.map(
        (p) => `<url><loc>${baseUrl}/product/${p.slug}</loc><changefreq>weekly</changefreq></url>`
      ),
    ];
    res.type('application/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`
    );
  });

  // Vite dev middleware vs production dist static serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found. Run npm run build.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Daddy's Hook storefront running at http://localhost:${PORT}`);
  });
}

createServer();

import { useCallback, useEffect, useState } from 'react';
import { Award, Check, Lock, LogOut, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Order, OrderStatus, Product, StreakCard } from '../types';

interface Inquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  createdAt: string;
}
import {
  ALL_SIZES,
  MEN_SUBCATEGORIES,
  WOMEN_SUBCATEGORIES,
  formatINR,
} from '../lib/constants';
import { resolveMediaUrl } from '../lib/media';

interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalProducts: number;
  outOfStockProducts: number;
  activeStreaks: number;
  prizesReady: number;
  prizesClaimed: number;
}

type AdminTab = 'dashboard' | 'products' | 'orders' | 'streaks' | 'messages';

export function AdminPage() {
  const { adminToken, setAdminToken, showToast } = useStore();
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [tab, setTab] = useState<AdminTab>('dashboard');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [streaks, setStreaks] = useState<StreakCard[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Product Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pName, setPName] = useState('');
  const [pCat, setPCat] = useState<'men' | 'women'>('men');
  const [pSub, setPSub] = useState<string>(MEN_SUBCATEGORIES[0]);
  const [pPrice, setPPrice] = useState('');
  const [pStock, setPStock] = useState('');
  const [pImages, setPImages] = useState<string[]>([]);
  const [pDesc, setPDesc] = useState('');
  const [pCompare, setPCompare] = useState('');
  const [pColors, setPColors] = useState('Black, White');
  const [pSizes, setPSizes] = useState<string[]>([...ALL_SIZES]);
  const [pFeatured, setPFeatured] = useState(false);
  const [pInStock, setPInStock] = useState(true);

  // Streak Stamp Form State
  const [stampPhone, setStampPhone] = useState('');
  const [stampName, setStampName] = useState('');
  const [stampNote, setStampNote] = useState('In-store purchase stamp');

  const loadAll = useCallback(async (token: string) => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [stRes, prRes, orRes, skRes, inRes] = await Promise.all([
        fetch('/api/stats', { headers }),
        fetch('/api/products'),
        fetch('/api/orders', { headers }),
        fetch('/api/streak', { headers }),
        fetch('/api/inquiries', { headers }),
      ]);
      if (stRes.status === 401) {
        setAdminToken(null);
        return;
      }
      const [st, pr, or, sk, inq] = await Promise.all([
        stRes.json(),
        prRes.json(),
        orRes.json(),
        skRes.json(),
        inRes.json(),
      ]);
      setStats(st as AdminStats);
      setProducts((pr as { products: Product[] }).products || []);
      setOrders((or as { orders: Order[] }).orders || []);
      setStreaks((sk as { streaks: StreakCard[] }).streaks || []);
      setInquiries((inq as { inquiries?: Inquiry[] }).inquiries || []);
    } finally {
      setLoading(false);
    }
  }, [setAdminToken]);

  useEffect(() => {
    if (adminToken) {
      loadAll(adminToken);
    }
  }, [adminToken, loadAll]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode }),
    });
    const data = (await res.json()) as { token?: string; error?: string };
    if (!res.ok || !data.token) {
      setAuthError(data.error || 'Invalid passcode');
      return;
    }
    setAdminToken(data.token);
    showToast('Admin session active');
  };

  const resetProductForm = () => {
    setEditingId(null);
    setPName('');
    setPCat('men');
    setPSub(MEN_SUBCATEGORIES[0]);
    setPPrice('');
    setPStock('');
    setPImages([]);
    setPDesc('');
    setPCompare('');
    setPColors('Black, White');
    setPSizes([...ALL_SIZES]);
    setPFeatured(false);
    setPInStock(true);
  };

  const handleEditProduct = (p: Product) => {
    setEditingId(p.id);
    setPName(p.name);
    setPCat(p.category);
    setPSub(p.subcategory);
    setPPrice(String(p.price));
    setPStock(String(p.stock));
    setPImages(p.images);
    setPDesc(p.description);
    setPCompare(p.compareAtPrice ? String(p.compareAtPrice) : '');
    setPColors(p.colors.join(', '));
    setPSizes(p.sizes);
    setPFeatured(p.isFeatured);
    setPInStock(p.inStock);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    if (pImages.length === 0) {
      showToast('Upload at least one product photo');
      return;
    }
    const payload = {
      name: pName,
      category: pCat,
      subcategory: pSub,
      price: Number(pPrice),
      stock: Number(pStock),
      images: pImages,
      description: pDesc,
      compareAtPrice: pCompare ? Number(pCompare) : 0,
      colors: pColors
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      sizes: pSizes,
      isFeatured: pFeatured,
      inStock: pInStock,
    };

    const url = editingId ? `/api/products/${editingId}` : '/api/products';
    const method = editingId ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      showToast(editingId ? 'Product updated' : 'Product added');
      resetProductForm();
      loadAll(adminToken);
    } else {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      showToast(err.error || 'Could not save product');
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || !adminToken) return;
    setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, 6)) {
        const res = await fetch('/api/uploads', {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': file.type || 'application/octet-stream' },
          body: file,
        });
        const data = (await res.json()) as { url?: string; error?: string };
        if (res.ok && data.url) {
          const url = data.url;
          setPImages((prev) => [...prev, url]);
        } else {
          showToast(data.error || `Could not upload ${file.name}`);
        }
      }
    } finally {
      setUploading(false);
    }
  };

  const handleQuickToggle = async (p: Product, field: 'isFeatured' | 'inStock') => {
    if (!adminToken) return;
    const res = await fetch(`/api/products/${p.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ [field]: !p[field] }),
    });
    if (res.ok) {
      showToast('Updated product');
      loadAll(adminToken);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!adminToken) return;
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.ok) {
      showToast('Product deleted');
      loadAll(adminToken);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (!adminToken) return;
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      showToast(`Order ${orderId} marked ${status}`);
      loadAll(adminToken);
    }
  };

  const handleAddStamp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !stampPhone.trim()) return;
    const res = await fetch(`/api/streak/${encodeURIComponent(stampPhone.trim())}/stamp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ customerName: stampName, note: stampNote }),
    });
    if (res.ok) {
      showToast(`Added stamp for ${stampPhone}`);
      setStampPhone('');
      setStampName('');
      loadAll(adminToken);
    }
  };

  const handleClaimPrize = async (phone: string) => {
    if (!adminToken) return;
    const res = await fetch(`/api/streak/${encodeURIComponent(phone)}/claim`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.ok) {
      showToast(`Prize claimed for ${phone}`);
      loadAll(adminToken);
    }
  };

  if (!adminToken) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
        <div className="atelier-card p-8 sm:p-9">
          <div className="atelier-pill">
            <Lock className="w-3.5 h-3.5 text-[#0F3720] dark:text-[#D9C08A]" />
            <span className="font-ui text-[12px] tracking-[0.2em]">Atelier Backoffice</span>
          </div>
          <h1 className="font-small-caps text-3xl sm:text-4xl font-bold mt-4 text-[#0F3720] dark:text-[#F7F3EA]">
            Admin Access
          </h1>
          <div className="w-24 h-[3px] bg-[#B8934A] mt-4" />
          <p className="text-sm text-[#5E6B62] dark:text-[#D9C08A] mt-4">
            Enter your store administrator passcode to manage inventory, orders, and streak cards.
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-pass" className="block font-ui text-[12px] tracking-[0.18em] mb-1.5 text-[#0F3720] dark:text-[#D9C08A]">
                Passcode
              </label>
              <input
                id="admin-pass"
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter admin passcode"
                className="w-full min-h-[46px] rounded-[8px] px-3.5 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm"
              />
            </div>
            {authError && <p className="text-xs text-red-700 dark:text-[#D9C08A]">{authError}</p>}
            <button
              type="submit"
              className="w-full atelier-btn-primary font-ui text-[13px] tracking-[0.2em] cursor-pointer dark:bg-[#B8934A] dark:text-[#0F3720]"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  const subOptions = pCat === 'men' ? MEN_SUBCATEGORIES : WOMEN_SUBCATEGORIES;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-14 sm:py-20">
      <div className="pb-6 border-b border-[#E3DCCB] dark:border-[#B8934A]/45 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="atelier-pill">
            <span className="w-2 h-2 rounded-full bg-[#B8934A]" aria-hidden="true" />
            <span className="font-ui text-[12px] tracking-[0.2em]">Daddy&apos;s Hook Operations</span>
          </div>
          <h1 className="font-small-caps text-4xl sm:text-5xl font-bold mt-4 text-[#0F3720] dark:text-[#F7F3EA]">
            Atelier Admin
          </h1>
          <div className="w-24 h-[3px] bg-[#B8934A] mt-4" />
        </div>

        <button
          type="button"
          onClick={() => setAdminToken(null)}
          className="atelier-btn-secondary px-5 font-ui text-[12px] tracking-[0.18em] inline-flex items-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Lock Admin
        </button>
      </div>

      {/* Tab Bar */}
      <div className="mt-8 flex flex-wrap gap-2">
        {(
          [
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'products', label: `Products (${products.length})` },
            { id: 'orders', label: `Orders (${orders.length})` },
            { id: 'streaks', label: `Streak Cards (${streaks.length})` },
            { id: 'messages', label: `Messages (${inquiries.length})` },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`min-h-[44px] rounded-[8px] px-5 border font-ui text-[12px] tracking-[0.18em] transition-colors duration-500 ease-out cursor-pointer ${
              tab === item.id
                ? 'bg-[#0F3720] text-[#F7F3EA] border-[#0F3720] dark:bg-[#B8934A] dark:text-[#0F3720]'
                : 'bg-[#FFFDF8] dark:bg-[#0F3720] border-[#D7DBCB] dark:border-[#B8934A]/60 text-[#0F3720] dark:text-[#F7F3EA] hover:bg-[#EDEFE6]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && !stats && (
        <p className="mt-8 text-sm text-[#5E6B62] dark:text-[#D9C08A]">Loading atelier metrics...</p>
      )}

      {/* DASHBOARD TAB */}
      {tab === 'dashboard' && stats && (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Sales', value: formatINR(stats.totalRevenue), sub: `${stats.totalOrders} total orders` },
            { label: 'Pending Fulfillment', value: String(stats.pendingOrders), sub: `${stats.deliveredOrders} delivered` },
            { label: 'Catalog SKUs', value: String(stats.totalProducts), sub: `${stats.outOfStockProducts} out of stock` },
            { label: 'Streak Cards', value: String(stats.activeStreaks), sub: `${stats.prizesReady} ready · ${stats.prizesClaimed} claimed` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="atelier-card p-6"
            >
              <p className="font-ui text-[12px] tracking-[0.18em] text-[#5E6B62] dark:text-[#D9C08A]">
                {stat.label}
              </p>
              <p className="font-display text-3xl font-bold mt-2 tabular-nums text-[#0F3720] dark:text-[#F7F3EA]">
                {stat.value}
              </p>
              <p className="text-xs text-[#5E6B62] dark:text-[#D9C08A]/80 mt-2 tabular-nums">
                {stat.sub}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* PRODUCTS TAB */}
      {tab === 'products' && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add / Edit Form */}
          <form
            onSubmit={handleSaveProduct}
            className="lg:col-span-4 atelier-card p-6 space-y-4"
          >
            <h2 className="font-small-caps text-2xl font-bold text-[#0F3720] dark:text-[#F7F3EA]">
              {editingId ? 'Edit Product' : 'Add New Product'}
            </h2>

            <div>
              <label className="block font-ui text-[12px] tracking-[0.18em] mb-1 text-[#0F3720] dark:text-[#D9C08A]">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={pName}
                onChange={(e) => setPName(e.target.value)}
                placeholder="Product name"
                className="w-full min-h-[44px] rounded-[8px] px-3 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-ui text-[12px] tracking-[0.18em] mb-1 text-[#0F3720] dark:text-[#D9C08A]">
                  Category
                </label>
                <select
                  value={pCat}
                  onChange={(e) => {
                    const nextCat = e.target.value as 'men' | 'women';
                    setPCat(nextCat);
                    setPSub(nextCat === 'men' ? MEN_SUBCATEGORIES[0] : WOMEN_SUBCATEGORIES[0]);
                  }}
                  className="w-full min-h-[44px] rounded-[8px] px-3 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm"
                >
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                </select>
              </div>
              <div>
                <label className="block font-ui text-[12px] tracking-[0.18em] mb-1 text-[#0F3720] dark:text-[#D9C08A]">
                  Subcategory
                </label>
                <select
                  value={pSub}
                  onChange={(e) => setPSub(e.target.value)}
                  className="w-full min-h-[44px] rounded-[8px] px-3 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm"
                >
                  {subOptions.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-ui text-[12px] tracking-[0.18em] mb-1 text-[#0F3720] dark:text-[#D9C08A]">
                  Price (INR) *
                </label>
                <input
                  type="number"
                  required
                  value={pPrice}
                  onChange={(e) => setPPrice(e.target.value)}
                  className="w-full min-h-[44px] rounded-[8px] px-3 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block font-ui text-[12px] tracking-[0.18em] mb-1 text-[#0F3720] dark:text-[#D9C08A]">
                  Stock Qty *
                </label>
                <input
                  type="number"
                  required
                  value={pStock}
                  onChange={(e) => setPStock(e.target.value)}
                  className="w-full min-h-[44px] rounded-[8px] px-3 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm tabular-nums"
                />
              </div>
            </div>

            <div>
              <span className="block font-ui text-[12px] tracking-[0.18em] mb-1 text-[#0F3720] dark:text-[#D9C08A]">
                Product Photos * (first is the cover)
              </span>
              <div className="flex flex-wrap gap-2">
                {pImages.map((img, i) => (
                  <div key={img} className="relative w-16 h-16">
                    <img src={resolveMediaUrl(img)} alt={`Photo ${i + 1}`} className="w-16 h-16 rounded-[6px] object-cover border border-[#E3DCCB]" />
                    <button
                      type="button"
                      aria-label={`Remove photo ${i + 1}`}
                      onClick={() => setPImages((prev) => prev.filter((x) => x !== img))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#0F3720] text-[#F7F3EA] text-xs leading-none cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <label className="w-16 h-16 rounded-[6px] border border-dashed border-[#B8934A] flex items-center justify-center text-xs text-center cursor-pointer hover:bg-[#EDEFE6] dark:hover:bg-[#1F4A32]">
                  {uploading ? '...' : '+ Add'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      handleUpload(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
              <p className="text-[11px] text-[#5E6B62] dark:text-[#D9C08A] mt-1.5">JPG, PNG or WebP, up to 8 MB each.</p>
            </div>

            <div>
              <label className="block font-ui text-[12px] tracking-[0.18em] mb-1 text-[#0F3720] dark:text-[#D9C08A]">
                Description
              </label>
              <textarea
                rows={3}
                value={pDesc}
                onChange={(e) => setPDesc(e.target.value)}
                placeholder="Fabric, fit, care instructions..."
                className="w-full rounded-[8px] p-3 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm"
              />
            </div>

            <div>
              <label className="block font-ui text-[12px] tracking-[0.18em] mb-1 text-[#0F3720] dark:text-[#D9C08A]">
                Original Price (optional, shows strikethrough)
              </label>
              <input
                type="number"
                min="0"
                value={pCompare}
                onChange={(e) => setPCompare(e.target.value)}
                className="w-full min-h-[44px] rounded-[8px] px-3 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm tabular-nums"
              />
            </div>

            <div>
              <label className="block font-ui text-[12px] tracking-[0.18em] mb-1 text-[#0F3720] dark:text-[#D9C08A]">
                Colors (comma separated)
              </label>
              <input
                type="text"
                value={pColors}
                onChange={(e) => setPColors(e.target.value)}
                className="w-full min-h-[44px] rounded-[8px] px-3 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm"
              />
            </div>

            <div>
              <span className="block font-ui text-[12px] tracking-[0.18em] mb-1 text-[#0F3720] dark:text-[#D9C08A]">
                Sizes
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ALL_SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() =>
                      setPSizes((prev) =>
                        prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                      )
                    }
                    className={`min-w-[40px] min-h-[38px] rounded-[8px] text-xs font-semibold border cursor-pointer ${
                      pSizes.includes(s)
                        ? 'bg-[#0F3720] text-[#F7F3EA] border-[#0F3720] dark:bg-[#B8934A] dark:text-[#0F3720]'
                        : 'bg-[#F7F3EA] dark:bg-[#081E12] border-[#D7DBCB] dark:border-[#B8934A]/60'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-6 pt-1">
              <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={pFeatured}
                  onChange={(e) => setPFeatured(e.target.checked)}
                />
                Featured
              </label>
              <label className="inline-flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={pInStock}
                  onChange={(e) => setPInStock(e.target.checked)}
                />
                In Stock
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 atelier-btn-primary font-ui text-[12px] tracking-[0.18em] inline-flex items-center justify-center gap-2 cursor-pointer dark:bg-[#B8934A] dark:text-[#0F3720]"
              >
                <Plus className="w-4 h-4" />
                {editingId ? 'Save Changes' : 'Add Product'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetProductForm}
                  className="atelier-btn-secondary px-4 font-ui text-[12px] tracking-[0.18em] cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* Product Inventory Table */}
          <div className="lg:col-span-8 atelier-card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#EDEFE6] dark:bg-[#081E12] border-b border-[#E3DCCB] dark:border-[#B8934A]/60 font-ui text-[12px] tracking-[0.16em] text-[#0F3720] dark:text-[#F7F3EA]">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Featured</th>
                  <th className="p-4">Availability</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3DCCB] dark:divide-[#B8934A]/30">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveMediaUrl(p.images[0])}
                          alt={p.name}
                          className="w-11 h-11 rounded-[6px] object-cover bg-[#EDEFE6] border border-[#E3DCCB] shrink-0"
                        />
                        <div>
                          <p className="font-semibold leading-snug">{p.name}</p>
                          <p className="text-xs text-[#5E6B62] dark:text-[#D9C08A]">
                            {p.category} · {p.subcategory}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 tabular-nums font-medium">{formatINR(p.price)}</td>
                    <td className="p-4 tabular-nums">{p.stock}</td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => handleQuickToggle(p, 'isFeatured')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                          p.isFeatured
                            ? 'bg-[#B8934A] text-[#0F3720] border-[#B8934A]'
                            : 'bg-[#EDEFE6] dark:bg-[#081E12] border-[#D7DBCB]'
                        }`}
                      >
                        {p.isFeatured ? 'Featured' : 'Standard'}
                      </button>
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => handleQuickToggle(p, 'inStock')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                          p.inStock
                            ? 'bg-[#0F3720] text-[#F7F3EA] border-[#0F3720] dark:bg-[#1F4A32]'
                            : 'bg-[#2E3F34] text-[#F7F3EA] border-[#2E3F34]'
                        }`}
                      >
                        {p.inStock ? 'In Stock' : 'Out of Stock'}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditProduct(p)}
                          className="min-h-[36px] rounded-[8px] px-3 bg-[#FFFDF8] border border-[#C4CABD] text-[#0F3720] text-xs font-semibold cursor-pointer hover:bg-[#EDEFE6]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id)}
                          aria-label={`Delete ${p.name}`}
                          className="min-w-[36px] min-h-[36px] rounded-[8px] border border-[#D7DBCB] flex items-center justify-center text-[#5E6B62] hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {tab === 'orders' && (
        <div className="mt-8 atelier-card overflow-x-auto">
          {orders.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#5E6B62] dark:text-[#D9C08A]">
              No customer orders placed yet.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-[#EDEFE6] dark:bg-[#081E12] border-b border-[#E3DCCB] dark:border-[#B8934A]/60 font-ui text-[12px] tracking-[0.16em] text-[#0F3720] dark:text-[#F7F3EA]">
                <tr>
                  <th className="p-4">Order</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Items</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3DCCB] dark:divide-[#B8934A]/30">
                {orders.map((ord) => (
                  <tr key={ord.id}>
                    <td className="p-4 font-display font-bold text-[#0F3720] dark:text-[#F7F3EA]">
                      {ord.id}
                    </td>
                    <td className="p-4">
                      <p className="font-semibold">{ord.customerName}</p>
                      <p className="text-xs text-[#5E6B62] dark:text-[#D9C08A] tabular-nums">
                        {ord.phone}{ord.email ? ` · ${ord.email}` : ''}
                      </p>
                      <p className="text-xs mt-1 max-w-[220px]">
                        {ord.address}, {ord.city} {ord.pincode}
                      </p>
                      <p className="text-[11px] text-[#5E6B62] dark:text-[#D9C08A] mt-1">
                        {new Date(ord.createdAt).toLocaleString('en-IN')}
                      </p>
                      <a
                        href={`https://wa.me/91${ord.phone}?text=${encodeURIComponent(`Hi ${ord.customerName}, this is Daddy's Hook regarding order ${ord.id}.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs underline"
                      >
                        WhatsApp customer
                      </a>
                    </td>
                    <td className="p-4 text-xs">
                      {ord.items.map((i, idx) => (
                        <div key={idx}>
                          {i.name} ({i.size}) × {i.quantity}
                        </div>
                      ))}
                    </td>
                    <td className="p-4 text-xs font-medium">
                      {ord.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Paid online'}
                      {ord.paymentRef && <div className="text-[11px] opacity-70 break-all">{ord.paymentRef}</div>}
                    </td>
                    <td className="p-4 font-semibold tabular-nums">{formatINR(ord.total)}</td>
                    <td className="p-4">
                      <select
                        aria-label={`Status for order ${ord.id}`}
                        value={ord.status}
                        onChange={(e) =>
                          handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)
                        }
                        className="min-h-[40px] rounded-[8px] px-3 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A] text-xs font-semibold cursor-pointer"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Packed">Packed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* MESSAGES TAB */}
      {tab === 'messages' && (
        <div className="mt-8 space-y-4">
          {inquiries.length === 0 ? (
            <div className="atelier-card p-10 text-center text-sm text-[#5E6B62] dark:text-[#D9C08A]">
              No customer messages yet.
            </div>
          ) : (
            inquiries.map((q) => (
              <div key={q.id} className="atelier-card p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold">{q.name}</p>
                  <p className="text-xs text-[#5E6B62] dark:text-[#D9C08A]">
                    {new Date(q.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
                <p className="text-sm mt-2 whitespace-pre-wrap">{q.message}</p>
                <p className="text-xs mt-3 text-[#5E6B62] dark:text-[#D9C08A] tabular-nums">
                  {[q.phone, q.email].filter(Boolean).join(' · ') || 'No contact details given'}
                  {q.phone && (
                    <>
                      {' · '}
                      <a
                        className="underline"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://wa.me/91${q.phone.replace(/\D/g, '').slice(-10)}`}
                      >
                        WhatsApp
                      </a>
                    </>
                  )}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* STREAK CARDS TAB */}
      {tab === 'streaks' && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleAddStamp}
            className="lg:col-span-4 atelier-card p-6 space-y-4"
          >
            <h2 className="font-small-caps text-2xl font-bold text-[#0F3720] dark:text-[#F7F3EA]">
              Add Streak Stamp
            </h2>
            <div>
              <label className="block font-ui text-[12px] tracking-[0.18em] mb-1 text-[#0F3720] dark:text-[#D9C08A]">
                Customer Phone *
              </label>
              <input
                type="tel"
                required
                value={stampPhone}
                onChange={(e) => setStampPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full min-h-[44px] rounded-[8px] px-3 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block font-ui text-[12px] tracking-[0.18em] mb-1 text-[#0F3720] dark:text-[#D9C08A]">
                Customer Name (Optional)
              </label>
              <input
                type="text"
                value={stampName}
                onChange={(e) => setStampName(e.target.value)}
                placeholder="Customer name"
                className="w-full min-h-[44px] rounded-[8px] px-3 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm"
              />
            </div>
            <div>
              <label className="block font-ui text-[12px] tracking-[0.18em] mb-1 text-[#0F3720] dark:text-[#D9C08A]">
                Note
              </label>
              <input
                type="text"
                value={stampNote}
                onChange={(e) => setStampNote(e.target.value)}
                className="w-full min-h-[44px] rounded-[8px] px-3 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full atelier-btn-primary font-ui text-[13px] tracking-[0.2em] cursor-pointer dark:bg-[#B8934A] dark:text-[#0F3720]"
            >
              Add +1 Stamp
            </button>
          </form>

          <div className="lg:col-span-8 space-y-4">
            {streaks.length === 0 ? (
              <div className="atelier-card p-10 text-center text-sm text-[#5E6B62] dark:text-[#D9C08A]">
                No streak cards yet. Customer orders or manual stamps will create cards here.
              </div>
            ) : (
              streaks.map((card) => (
                <div
                  key={card.phone}
                  className="atelier-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <p className="font-display text-lg font-bold tabular-nums text-[#0F3720] dark:text-[#F7F3EA]">
                      {card.customerName ? `${card.customerName} · ${card.phone}` : card.phone}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {Array.from({ length: 10 }).map((_, idx) => {
                        const num = idx + 1;
                        const stamped = num <= card.stamps;
                        return (
                          <span
                            key={num}
                            className={`w-7 h-7 rounded-full border text-[10px] font-bold flex items-center justify-center ${
                              num === 10
                                ? 'bg-[#B8934A] text-[#0F3720] border-[#B8934A]'
                                : stamped
                                  ? 'bg-[#0F3720] text-[#D9C08A] border-[#B8934A]'
                                  : 'bg-[#EDEFE6] dark:bg-[#081E12] border-[#D7DBCB] text-[#5E6B62]'
                            }`}
                          >
                            {num === 10 ? <Award className="w-3.5 h-3.5" /> : stamped ? <Check className="w-3.5 h-3.5" /> : num}
                          </span>
                        );
                      })}
                    </div>
                    <p className="text-xs text-[#5E6B62] dark:text-[#D9C08A] mt-2 tabular-nums">
                      {card.stamps}/10 stamps · {card.prizesClaimed} prize(s) claimed
                    </p>
                  </div>

                  {card.stamps >= 10 && (
                    <button
                      type="button"
                      onClick={() => handleClaimPrize(card.phone)}
                      className="min-h-[44px] rounded-[8px] px-5 bg-[#B8934A] text-[#0F3720] font-ui text-[12px] tracking-[0.18em] shrink-0 cursor-pointer hover:bg-[#D9C08A]"
                    >
                      Mark Prize Claimed
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

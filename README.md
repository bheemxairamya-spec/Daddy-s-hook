# Daddy's Hook — Quiet-Luxury Streetwear Storefront

> **"Stay Hooked, Homies!"** — Heavyweight 240–360 GSM streetwear T-shirts, polo knits, and baggy silhouettes crafted in forest green, ivory, and champagne gold.

---

## Folder Structure

```text
├── public/
│   └── assets/
│       ├── logo.png             # Cream embroidered "D + hook" on black (use with mix-blend-mode: lighten)
│       ├── logo-green.png       # Transparent green crest for light surfaces
│       └── logo-white.png       # Transparent ivory crest for dark surfaces
├── server/
│   ├── db.ts                    # Store config, phone normalization, atomic JSON persistence
│   ├── seed.ts                  # Empty database initializer (no catalog data)
│   └── types.ts                 # Shared backend TypeScript types
├── server.ts                    # Express server + Vite middleware + /api/* routes + /sitemap.xml
├── src/
│   ├── assets/images/           # Studio product & atelier photography
│   ├── components/
│   │   ├── AnnouncementBar.tsx  # Free delivery & COD banner
│   │   ├── CartDrawer.tsx       # Slide-in shopping bag with free-shipping progress bar
│   │   ├── CustomCursor.tsx     # Desktop-only champagne gold ring cursor
│   │   ├── FloatingWhatsApp.tsx # Quick WhatsApp order button
│   │   ├── Footer.tsx           # Deep green footer with map embed & QR code
│   │   ├── Header.tsx           # Atelier ivory header with centered wordmark, live search & bouncing bag badge
│   │   ├── LocationQRCode.tsx   # Scannable QR code pointing to Google Maps
│   │   ├── ProductCard.tsx      # Ivory product card with quick add particle arc
│   │   ├── QuickViewModal.tsx   # Quick size/color modal
│   │   ├── SizeChartModal.tsx   # Garment measurements modal (S–XXL)
│   │   └── StreakCardSection.tsx# 10-stamp sequential loyalty card + gold prize pulse
│   ├── context/
│   │   └── StoreContext.tsx     # Cart, wishlist, dark/light theme, OTP user, admin token
│   ├── hooks/
│   │   └── useRevealOnScroll.ts # Lightweight IntersectionObserver reveal hook
│   ├── lib/
│   │   ├── animations.ts        # Centralized hero, hook-pull, dust, cart-arc & scroll constants
│   │   ├── constants.ts         # Categories, swatches, WhatsApp link builder, INR formatter
│   │   └── media.ts             # Bundled image registry & fallback mapping
│   ├── pages/
│   │   ├── AboutPage.tsx
│   │   ├── AdminPage.tsx        # /admin dashboard, Product CRUD, Orders, Streak Cards
│   │   ├── CheckoutPage.tsx     # COD & Razorpay/UPI checkout
│   │   ├── ContactPage.tsx      # Inquiry form + map + QR code
│   │   ├── HomePage.tsx         # 8-section luxury storefront homepage
│   │   ├── LoginPage.tsx        # Email/phone OTP customer login
│   │   ├── OrderConfirmationPage.tsx
│   │   ├── ProductDetailPage.tsx
│   │   ├── ShopPage.tsx         # Catalog with desktop sidebar & mobile filter drawer
│   │   └── WishlistPage.tsx
│   ├── index.css                # Tailwind v4 + CSS tokens + double gold frame + marquee
│   ├── main.tsx
│   └── types.ts
├── data/store.json              # Auto-created persistent store database on first boot
├── index.html                   # Cinzel & Inter Google Fonts + SEO/OpenGraph tags
├── .env.example
└── package.json
```

---

## Setup, Run & Deploy

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Configure environment** (copy `.env.example` to `.env`):
   ```bash
   cp .env.example .env
   ```
3. **Run in development**:
   ```bash
   npm run dev
   ```
   Opens on `http://localhost:3000`.
4. **Type-check & build for production**:
   ```bash
   npm run lint
   npm run build
   ```
5. **Start production server**:
   ```bash
   NODE_ENV=production npm start
   ```

---

## Brand Customization Guide

### 1. Logos, Direct Landing & Motion Constants
All three logo files live in `public/assets/`:
- `public/assets/logo.png` — Cream embroidered `"D + hook"` on pure `#000000` black, rendered with `.logo-charcoal-multiply` on light Atelier ivory surfaces (`Header.tsx`).
- `public/assets/logo-green.png` — Transparent forest-green crest used on ivory cards (e.g., Streak Card, `FOR MEN` / `FOR WOMEN` category cards, favicon).
- `public/assets/logo-white.png` — Transparent cream/white crest used on deep green surfaces and dark mode.

To swap them, simply overwrite those three PNG files keeping the exact filenames—no code changes required.

**Storefront Navigation & Non-Blocking Animations (`src/lib/animations.ts`, `src/hooks/useRevealOnScroll.ts`):**
- **Direct Entry**: Visitors land immediately on the requested route (`/`, `/shop`, `/product/:slug`, etc.) with zero blocking intro overlays. The header logo links home (`/`), and the header action bar includes a Search icon toggle alongside the Shopping Bag badge.
- **`HERO_MOTION`**: Controls the ~2s non-blocking hero choreography (`headlineDurationMs`, `headlineStaggerMs`, `stitchLineWidthPx`, `stitchDashOnPx`/`stitchDashOffPx`, `cardBorderDrawDurationMs`, `shirtFloatDurationMs`).
- **`HOOK_PLAY`**: Configures the optional hanging gold hook (`swingAngleDeg`, `swingDurationMs`, `dragTriggerPx` = `40`, `burstParticleCount` = `22`, `burstMinSizePx`–`burstMaxSizePx`, `burstDurationMs`).
- **`AMBIENT_DUST`**: Configures the `16` strictly round floating golden dust orbs around the flagship card (`particleCount`, `minSizePx`/`maxSizePx`, `minDurationMs`/`maxDurationMs`, `maxDriftXPx`).
- **`CART_FLY_PARTICLE` & `SCROLL_REVEAL`**: Controls the `750ms` Add-to-Bag parabolic gold particle + `450ms` bag badge bounce, `26px` IntersectionObserver card reveals, `95ms` sequential Streak Card stamps, and `2.4s` PRIZE gold pulse ring. All animations run on GPU-composited properties (`transform`, `opacity`, `clip-path`, `stroke-dashoffset`) and respect `prefers-reduced-motion: reduce`.

### 2. Changing the Color Tokens & Typography
Open `src/index.css` and edit the `:root` and `.dark` CSS custom properties, and check Google Fonts in `index.html`:
- `--dh-bg: #F7F3EA` (Warm Ivory background)
- `--dh-surface: #FFFDF8` (Ivory-White card surface)
- `--dh-tint: #EDEFE6` (Pale Sage pill & chip tint, 1px border `#D7DBCB`)
- `--dh-forest: #0F3720` (Deep Forest Green)
- `--dh-mid: #1F4A32` (Mid Green for awning patterns and dark surfaces)
- `--dh-hover: #0A2A19` (Primary CTA hover fill)
- `--dh-gold: #B8934A` (Antique Gold accent, focus ring, large italic subheadings)
- `--dh-light-gold: #D9C08A` (Champagne Gold for small text on dark green)
- `--dh-body: #2E3F34` (Body prose text)
- `--dh-muted: #5E6B62` (Muted metadata text)
- `--dh-border: #E3DCCB` (Card 1px border)
- **Fonts**: `Cormorant Garamond` (500/600/700 + italic 500/600) & `Cormorant SC` for display small-caps and tracked UI labels; `Inter` (400/500) at 18px (`line-height: 1.6`) for body copy.

### 3. Adding Products
1. Visit `/admin` and unlock with your `ADMIN_PASSCODE` environment secret.
2. Open the **Products** tab, fill out the **Add New Product** form (select Men/Women, subcategory, price, stock, sizes, colors, and Featured/In-Stock toggles), and click **Add Product**.
3. Alternatively, remove `data/store.json` to re-initialize an empty database.

### 4. Storefront Environment Configuration
- **Streak Prize Name**: Edit `streakPrizeName` in `server/db.ts` (`STORE_CONFIG`).
- **Free Delivery Threshold**: Set `VITE_FREE_DELIVERY_THRESHOLD` in `.env` (defaults to `1999`).
- **WhatsApp Number**: Set `VITE_WHATSAPP_NUMBER` in `.env`.
- **Admin Passcode**: Set `ADMIN_PASSCODE` in `.env`.

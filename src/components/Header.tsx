import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Moon,
  Search,
  ShoppingBag,
  Sun,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Product } from '../types';
import { resolveMediaUrl } from '../lib/media';
import { formatINR } from '../lib/constants';
import { CART_FLY_PARTICLE } from '../lib/animations';

const LEFT_NAV_LINKS = [
  { label: 'New Drops', to: '/shop?newArrival=true' },
  { label: 'Men / Women', to: '/shop' },
  { label: 'About', to: '/about' },
];

export function Header() {
  const {
    theme,
    toggleTheme,
    cartCount,
    setCartOpen,
    wishlist,
    user,
  } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [badgeBounceKey, setBadgeBounceKey] = useState(0);
  const prevCount = useRef(cartCount);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (cartCount > prevCount.current) {
      setBadgeBounceKey((k) => k + 1);
    }
    prevCount.current = cartCount;
  }, [cartCount]);

  useEffect(() => {
    if (searchOpen) {
      window.setTimeout(() => searchInputRef.current?.focus(), 60);
    }
  }, [searchOpen]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSuggestions([]);
      return;
    }
    const timer = window.setTimeout(() => {
      fetch(`/api/products?search=${encodeURIComponent(trimmed)}`)
        .then((r) => r.json())
        .then((data: { products?: Product[] }) => {
          setSuggestions((data.products || []).slice(0, 5));
        })
        .catch(() => setSuggestions([]));
    }, 180);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F7F3EA] dark:bg-[#0F3720] text-[#0F3720] dark:text-[#F7F3EA] shadow-[0_12px_24px_rgba(15,55,32,0.12)] transition-colors duration-500 ease-out">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-4">
        {/* Zone 1 (Left): 3 uppercase tracked links + mobile menu button */}
        <div className="flex-1 flex items-center gap-6">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            className="lg:hidden min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center text-[#0F3720] dark:text-[#F7F3EA] hover:text-[#1F4A32] dark:hover:text-[#D9C08A] cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-7"
          >
            {LEFT_NAV_LINKS.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="font-ui text-[13px] tracking-[0.2em] text-[#0F3720] dark:text-[#F7F3EA] hover:text-[#1F4A32] dark:hover:text-[#D9C08A] py-1 border-b border-transparent hover:border-[#B8934A] transition-colors duration-500 ease-out whitespace-nowrap shrink-0"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Zone 2 (Center): Brand Logo + Stacked DADDY'S / HOOK Wordmark */}
        <div className="shrink-0 flex justify-center">
          <Link
            to="/"
            aria-label="Daddy's Hook Home"
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group no-underline hover:no-underline py-1"
          >
            <img
              src="/assets/logo.png"
              alt="Daddy's Hook embroidered logo"
              className="w-10 h-10 object-contain logo-charcoal-multiply"
            />
            <span className="flex flex-col items-center leading-none">
              <span className="font-display text-lg sm:text-[21px] font-bold tracking-[0.2em] text-[#0F3720] dark:text-[#F7F3EA] group-hover:text-[#1F4A32] dark:group-hover:text-[#D9C08A] transition-colors duration-500">
                DADDY&apos;S
              </span>
              <span className="font-ui text-[10px] tracking-[0.34em] text-[#B8934A] dark:text-[#D9C08A] mt-0.5">
                HOOK
              </span>
            </span>
          </Link>
        </div>

        {/* Zone 3 (Right): Search Icon Button + Deep-Green Bag Button with Bouncing Gold Count Badge */}
        <div className="flex-1 flex items-center justify-end gap-2.5 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Search products"
            aria-expanded={searchOpen}
            className="min-w-[44px] min-h-[42px] px-3 rounded-[8px] bg-[#FFFDF8] dark:bg-[#1F4A32] border border-[#C4CABD] dark:border-[#B8934A]/65 text-[#0F3720] dark:text-[#F7F3EA] hover:bg-[#EDEFE6] dark:hover:bg-[#0A2A19] hover:-translate-y-0.5 transition-all duration-450 ease-out inline-flex items-center justify-center cursor-pointer"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            data-cart-bag-target="true"
            onClick={() => setCartOpen(true)}
            aria-label={`Shopping bag (${cartCount} items)`}
            className="min-h-[42px] px-4 rounded-[8px] bg-[#0F3720] text-[#F7F3EA] hover:bg-[#0A2A19] dark:bg-[#B8934A] dark:text-[#0F3720] dark:hover:bg-[#D9C08A] shadow-[0_6px_16px_rgba(15,55,32,0.18)] hover:-translate-y-0.5 transition-all duration-450 ease-out flex items-center gap-2.5 font-ui text-[13px] tracking-[0.2em] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 hidden sm:inline" />
            <span>Bag</span>
            <span
              key={badgeBounceKey}
              style={
                badgeBounceKey > 0
                  ? { animationDuration: `${CART_FLY_PARTICLE.badgeBounceDurationMs}ms` }
                  : undefined
              }
              className={`min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#B8934A] text-[#0F3720] dark:bg-[#0F3720] dark:text-[#F7F3EA] font-sans text-[11px] font-bold tabular-nums flex items-center justify-center ${
                badgeBounceKey > 0 ? 'animate-dh-bag-bounce' : ''
              }`}
            >
              {cartCount}
            </span>
          </button>
        </div>
      </div>

      {/* Expandable Search Bar with Live Suggestions */}
      {searchOpen && (
        <div className="border-t border-[#E3DCCB] dark:border-[#B8934A]/45 bg-[#FFFDF8] dark:bg-[#081E12] px-4 sm:px-8 py-4">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#0F3720] dark:text-[#D9C08A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search acid wash, polo, oversized, baggy..."
                  className="w-full min-h-[44px] rounded-[8px] pl-10 pr-4 bg-[#F7F3EA] dark:bg-[#0F3720] border border-[#D7DBCB] dark:border-[#B8934A]/70 text-sm text-[#2E3F34] dark:text-[#F7F3EA] placeholder:text-[#5E6B62] dark:placeholder:text-[#C2CCC2]"
                />
              </div>
              <button
                type="submit"
                className="min-h-[44px] rounded-[8px] px-5 bg-[#0F3720] text-[#F7F3EA] dark:bg-[#B8934A] dark:text-[#0F3720] font-ui text-[12px] tracking-[0.18em] hover:bg-[#0A2A19] transition-colors cursor-pointer"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                className="min-w-[44px] min-h-[44px] rounded-[8px] flex items-center justify-center text-[#0F3720] dark:text-[#F7F3EA] hover:bg-[#EDEFE6] dark:hover:bg-[#0F3720] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </form>

            {suggestions.length > 0 && (
              <div className="mt-2 rounded-[10px] border border-[#E3DCCB] dark:border-[#B8934A]/60 bg-[#FFFDF8] dark:bg-[#0F3720] text-[#2E3F34] dark:text-[#F7F3EA] divide-y divide-[#E3DCCB] dark:divide-[#B8934A]/25 overflow-hidden">
                {suggestions.map((p) => (
                  <Link
                    key={p.id}
                    to={`/product/${p.slug}`}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center gap-3 p-3 hover:bg-[#EDEFE6] dark:hover:bg-[#1F4A32] transition-colors"
                  >
                    <img
                      src={resolveMediaUrl(p.images[0])}
                      alt={p.name}
                      className="w-12 h-10 rounded-[6px] object-cover border border-[#E3DCCB] bg-[#EDEFE6] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-[#5E6B62] dark:text-[#D9C08A]">
                        {p.category === 'men' ? 'Men' : 'Women'} · {p.subcategory}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-[#0F3720] dark:text-[#D9C08A] shrink-0">
                      {formatINR(p.price)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Thin Awning Strip */}
      <div className="w-full border-t border-[#0F3720]/20 dark:border-[#B8934A]/35 bg-[#F7F3EA] dark:bg-[#081E12]">
        <div className="h-4 w-full atelier-awning-strip" aria-hidden="true" />
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-80 max-w-[85vw] h-full bg-[#F7F3EA] dark:bg-[#081E12] text-[#2E3F34] dark:text-[#F7F3EA] border-r border-[#E3DCCB] dark:border-[#B8934A] p-6 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-[#E3DCCB] dark:border-[#B8934A]/45">
                <span className="font-display text-lg font-bold tracking-[0.18em] text-[#0F3720] dark:text-[#D9C08A]">
                  DADDY&apos;S HOOK
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#0F3720] dark:text-[#F7F3EA] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-6 flex flex-col gap-1">
                {[
                  ...LEFT_NAV_LINKS,
                  { label: "Men's Tees", to: '/shop?category=men' },
                  { label: "Women's Tees", to: '/shop?category=women' },
                  { label: 'Contact & Visit', to: '/contact' },
                ].map((item) => (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="min-h-[44px] flex items-center font-ui text-[13px] tracking-[0.18em] text-[#0F3720] dark:text-[#F7F3EA] border-b border-[#E3DCCB] dark:border-[#B8934A]/25"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  to="/wishlist"
                  className="min-h-[44px] flex items-center justify-between font-ui text-[13px] tracking-[0.18em] text-[#0F3720] dark:text-[#F7F3EA] border-b border-[#E3DCCB] dark:border-[#B8934A]/25"
                >
                  <span>Wishlist</span>
                  <span className="font-sans text-xs tabular-nums">{wishlist.length}</span>
                </Link>
                <Link
                  to="/login"
                  className="min-h-[44px] flex items-center font-ui text-[13px] tracking-[0.18em] text-[#0F3720] dark:text-[#F7F3EA] border-b border-[#E3DCCB] dark:border-[#B8934A]/25"
                >
                  {user ? 'My Account' : 'Customer Login'}
                </Link>
              </nav>
            </div>

            <div className="pt-4 border-t border-[#E3DCCB] dark:border-[#B8934A]/45 flex items-center justify-between">
              <span className="font-ui text-[12px] tracking-[0.18em] text-[#5E6B62] dark:text-[#D9C08A]">
                Theme
              </span>
              <button
                type="button"
                onClick={toggleTheme}
                className="min-h-[40px] px-4 rounded-[8px] border border-[#C4CABD] dark:border-[#B8934A] bg-[#FFFDF8] dark:bg-[#0F3720] text-[#0F3720] dark:text-[#F7F3EA] font-ui text-[12px] tracking-[0.16em] flex items-center gap-2 cursor-pointer"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === 'dark' ? 'Atelier Ivory' : 'Deep Forest'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

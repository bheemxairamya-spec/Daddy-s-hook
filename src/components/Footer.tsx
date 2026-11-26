import { Link } from 'react-router-dom';
import { Instagram, MapPin, MessageCircle, Moon, Phone, Sun } from 'lucide-react';
import { STORE_INFO, buildWhatsAppUrl } from '../lib/constants';
import { useStore } from '../context/StoreContext';
import { LocationQRCode } from './LocationQRCode';

export function Footer() {
  const { theme, toggleTheme } = useStore();

  return (
    <footer className="bg-[#0E321E] text-[#F7F3E8] border-t-2 border-[#B99651]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Column — Plain image, NOT a link */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/assets/logo-white.png"
                alt="Daddy's Hook Crest"
                className="w-12 h-12 object-contain"
              />
              <div>
                <h2 className="font-display text-lg font-bold tracking-[0.12em] text-[#F7F3E8]">
                  DADDY&apos;S HOOK
                </h2>
                <p className="text-xs font-semibold tracking-[0.16em] uppercase text-[#D9C08A]">
                  {STORE_INFO.tagline}
                </p>
              </div>
            </div>
            <p className="text-sm text-[#F7F3E8]/80 leading-relaxed mb-5">
              Quiet-luxury streetwear tees engineered in heavyweight combed cotton. Small-batch drops, timeless cuts, and zero compromise on fabric.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className="min-h-[44px] px-4 bg-[#144228] border border-[#B99651]/70 text-xs font-semibold tracking-[0.14em] uppercase text-[#F7F3E8] hover:bg-[#B99651] hover:text-[#0E321E] transition-colors inline-flex items-center gap-2 cursor-pointer"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === 'dark' ? 'Warm Ivory' : 'Deep Forest'}
              </button>
            </div>
          </div>

          {/* Shop & Info Links */}
          <div>
            <h3 className="font-display text-sm font-bold tracking-[0.18em] uppercase text-[#D9C08A] mb-4">
              Boutique
            </h3>
            <ul className="space-y-2.5 text-sm text-[#F7F3E8]/90">
              <li>
                <Link to="/shop?category=men" className="hover:text-[#D9C08A] hover:underline">
                  Men&apos;s Collection
                </Link>
              </li>
              <li>
                <Link to="/shop?category=women" className="hover:text-[#D9C08A] hover:underline">
                  Women&apos;s Collection
                </Link>
              </li>
              <li>
                <Link to="/shop?newArrival=true" className="hover:text-[#D9C08A] hover:underline">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#D9C08A] hover:underline">
                  Our Craft &amp; Story
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#D9C08A] hover:underline">
                  Visit &amp; Contact
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-[#D9C08A] hover:underline">
                  Atelier Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Flagship Details & Social */}
          <div>
            <h3 className="font-display text-sm font-bold tracking-[0.18em] uppercase text-[#D9C08A] mb-4">
              Flagship &amp; Direct
            </h3>
            <div className="space-y-3 text-sm text-[#F7F3E8]/90">
              <p className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#D9C08A] shrink-0 mt-1" />
                <span>{STORE_INFO.address}</span>
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#D9C08A] shrink-0" />
                <a
                  href={`tel:${STORE_INFO.phone}`}
                  className="text-[#F7F3E8] hover:text-[#D9C08A] hover:underline tabular-nums"
                >
                  {STORE_INFO.phone}
                </a>
              </p>
              <p className="text-xs text-[#D9C08A]">{STORE_INFO.hours}</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={STORE_INFO.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="min-h-[44px] px-4 bg-[#144228] border border-[#B99651] text-xs font-semibold tracking-[0.12em] uppercase text-[#F7F3E8] hover:bg-[#B99651] hover:text-[#0E321E] transition-colors inline-flex items-center gap-2"
              >
                <Instagram className="w-4 h-4" />
                {STORE_INFO.instagram}
              </a>
              <a
                href={buildWhatsAppUrl("Hey Daddy's Hook! I'd like to inquire about a drop.")}
                target="_blank"
                rel="noreferrer"
                className="min-h-[44px] px-4 bg-[#F7F3E8] text-[#0E321E] text-xs font-semibold tracking-[0.12em] uppercase hover:bg-[#D9C08A] hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
            </div>
          </div>

          {/* Map & Location QR Code */}
          <div>
            <h3 className="font-display text-sm font-bold tracking-[0.18em] uppercase text-[#D9C08A] mb-4">
              Find the Store
            </h3>
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-4 items-start">
              <div className="w-full sm:flex-1 h-32 border border-[#B99651]/70 overflow-hidden bg-[#144228]">
                <iframe
                  title="Daddy's Hook Boutique Location Map"
                  src={STORE_INFO.mapEmbedUrl}
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>
              <div className="shrink-0">
                <LocationQRCode size={94} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#B99651]/35 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#C0C8B1]">
          <p>© {new Date().getFullYear()} Daddy&apos;s Hook. All rights reserved.</p>
          <p className="tracking-[0.14em] uppercase text-[#D9C08A] font-medium">
            Crafted in Heavyweight Cotton · Stay Hooked
          </p>
        </div>
      </div>
    </footer>
  );
}

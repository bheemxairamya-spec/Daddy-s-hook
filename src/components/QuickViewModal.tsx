import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { resolveMediaUrl } from '../lib/media';
import { COLOR_SWATCHES, buildWhatsAppUrl, formatINR } from '../lib/constants';

export function QuickViewModal() {
  const { quickViewProduct, setQuickViewProduct, addToCart } = useStore();
  const [size, setSize] = useState('L');
  const [color, setColor] = useState('Obsidian');

  useEffect(() => {
    if (quickViewProduct) {
      setSize(quickViewProduct.sizes.includes('L') ? 'L' : quickViewProduct.sizes[0] || 'M');
      setColor(quickViewProduct.colors[0] || 'Obsidian');
    }
  }, [quickViewProduct]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && quickViewProduct) setQuickViewProduct(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [quickViewProduct, setQuickViewProduct]);

  if (!quickViewProduct) return null;

  const waUrl = buildWhatsAppUrl(
    `Hey Daddy's Hook! I'd like to order:\n• Product: ${quickViewProduct.name}\n• Size: ${size}\n• Color: ${color}\n• Qty: 1`
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55"
      role="dialog"
      aria-modal="true"
      aria-label={`Quick view ${quickViewProduct.name}`}
      onClick={() => setQuickViewProduct(null)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-[16px] bg-[#FFFDF8] dark:bg-[#081E12] text-[#2E3F34] dark:text-[#F7F3EA] border border-[#E3DCCB] dark:border-[#B8934A] grid grid-cols-1 md:grid-cols-2 overflow-hidden max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="aspect-[4/3] md:aspect-auto bg-[#EDEFE6] dark:bg-[#0F3720] border-b md:border-b-0 md:border-r border-[#E3DCCB] dark:border-[#B8934A]/50">
          <img
            src={resolveMediaUrl(quickViewProduct.images[0])}
            alt={quickViewProduct.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-6 sm:p-8 flex flex-col justify-between relative">
          <button
            type="button"
            onClick={() => setQuickViewProduct(null)}
            aria-label="Close quick view"
            className="absolute top-3 right-3 min-w-[44px] min-h-[44px] rounded-[8px] flex items-center justify-center text-[#0F3720] dark:text-[#F7F3EA] hover:bg-[#EDEFE6] dark:hover:bg-[#0F3720] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div>
            <p className="font-ui text-[12px] tracking-[0.18em] text-[#5E6B62] dark:text-[#D9C08A]">
              {quickViewProduct.category === 'men' ? 'Men' : 'Women'} · {quickViewProduct.subcategory}
            </p>
            <h2 className="font-small-caps text-3xl font-bold text-[#0F3720] dark:text-[#F7F3EA] mt-2 pr-8">
              {quickViewProduct.name}
            </h2>
            <p className="text-xl font-semibold tabular-nums mt-2 text-[#0F3720] dark:text-[#D9C08A]">
              {formatINR(quickViewProduct.price)}
            </p>
            <p className="text-base text-[#5E6B62] dark:text-[#C2CCC2] mt-3 leading-relaxed">
              {quickViewProduct.description}
            </p>

            {/* Size Selector */}
            <div className="mt-5">
              <span className="block font-ui text-[12px] tracking-[0.18em] text-[#0F3720] dark:text-[#F7F3EA] mb-2">
                Size
              </span>
              <div className="flex flex-wrap gap-2">
                {quickViewProduct.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`min-w-[44px] min-h-[44px] rounded-[8px] px-3 text-xs font-semibold transition-colors cursor-pointer ${
                      size === s
                        ? 'bg-[#0F3720] text-[#F7F3EA] border border-[#0F3720] dark:bg-[#B8934A] dark:text-[#0F3720] dark:border-[#B8934A]'
                        : 'bg-[#F7F3EA] dark:bg-[#0F3720] border border-[#D7DBCB] dark:border-[#B8934A]/50 hover:border-[#0F3720]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selector */}
            <div className="mt-4">
              <span className="block font-ui text-[12px] tracking-[0.18em] text-[#0F3720] dark:text-[#F7F3EA] mb-2">
                Color: {color}
              </span>
              <div className="flex flex-wrap gap-2.5">
                {quickViewProduct.colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Select color ${c}`}
                    className={`min-w-[40px] min-h-[40px] rounded-[8px] px-3 text-xs font-medium flex items-center gap-2 cursor-pointer ${
                      color === c
                        ? 'border-2 border-[#0F3720] dark:border-[#D9C08A] bg-[#EDEFE6] dark:bg-[#0F3720] font-semibold'
                        : 'border border-[#D7DBCB] dark:border-[#B8934A]/50 bg-[#F7F3EA] dark:bg-[#0F3720]'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-[#B8934A]"
                      style={{ backgroundColor: COLOR_SWATCHES[c] || '#17140F' }}
                    />
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2.5">
            <button
              type="button"
              disabled={!quickViewProduct.inStock || quickViewProduct.stock <= 0}
              onClick={(e) => {
                addToCart(quickViewProduct, size, color, 1, e.currentTarget);
                setQuickViewProduct(null);
              }}
              className="w-full atelier-btn-primary font-ui text-[13px] tracking-[0.2em] cursor-pointer disabled:opacity-50 dark:bg-[#B8934A] dark:text-[#0F3720]"
            >
              Add to Bag
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="atelier-btn-secondary font-ui text-[12px] tracking-[0.18em] flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
              <Link
                to={`/product/${quickViewProduct.slug}`}
                onClick={() => setQuickViewProduct(null)}
                className="atelier-btn-secondary font-ui text-[12px] tracking-[0.18em] flex items-center justify-center"
              >
                Full Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

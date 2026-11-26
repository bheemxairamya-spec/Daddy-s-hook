import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Heart, ShoppingBag } from 'lucide-react';
import type { Product } from '../types';
import { resolveMediaUrl } from '../lib/media';
import { formatINR } from '../lib/constants';
import { useStore } from '../context/StoreContext';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, toggleWishlist, isWishlisted, setQuickViewProduct } = useStore();
  const [imgError, setImgError] = useState(false);
  const wished = isWishlisted(product.id);

  const badgeLabel = !product.inStock || product.stock <= 0
    ? 'SOLD OUT'
    : product.isNewArrival
      ? 'NEW'
      : product.isFeatured
        ? 'FEATURED'
        : null;

  const defaultSize = product.sizes.includes('L') ? 'L' : product.sizes[0] || 'M';
  const defaultColor = product.colors[0] || 'Obsidian';

  return (
    <article className="group atelier-card atelier-hover-lift flex flex-col overflow-hidden">
      {/* 4:3 Image Frame */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EDEFE6] dark:bg-[#081E12] border-b border-[#E3DCCB] dark:border-[#B8934A]/35">
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          {!imgError ? (
            <img
              src={resolveMediaUrl(product.images[0])}
              alt={`${product.name} — ${product.subcategory}`}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover animate-dh-img-in transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-[#EDEFE6] dark:bg-[#081E12]">
              <ShoppingBag className="w-8 h-8 text-[#0F3720] dark:text-[#D9C08A] mb-2" />
              <span className="font-display text-sm uppercase tracking-widest text-[#0F3720] dark:text-[#F7F3EA]">
                {product.name}
              </span>
            </div>
          )}
        </Link>

        {/* Single Deep-Green Pill Badge with Ivory Text */}
        {badgeLabel && (
          <span
            className={`absolute top-3 left-3 px-3 py-1 rounded-full font-ui text-[12px] tracking-[0.18em] ${
              badgeLabel === 'SOLD OUT'
                ? 'bg-[#2E3F34] text-[#F7F3EA]'
                : 'bg-[#0F3720] text-[#F7F3EA]'
            }`}
          >
            {badgeLabel}
          </span>
        )}

        {/* Quick Actions Top Right */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => toggleWishlist(product.id)}
            aria-label={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
            className="min-w-[40px] min-h-[40px] rounded-[8px] bg-[#FFFDF8]/95 dark:bg-[#0F3720]/95 border border-[#E3DCCB] dark:border-[#B8934A]/65 flex items-center justify-center text-[#0F3720] dark:text-[#F7F3EA] hover:bg-[#EDEFE6] dark:hover:bg-[#1F4A32] transition-colors duration-500 ease-out cursor-pointer"
          >
            <Heart
              key={String(wished)}
              className={`w-4 h-4 ${
                wished ? 'fill-[#B8934A] text-[#B8934A] animate-dh-heart-pop' : ''
              }`}
            />
          </button>
          <button
            type="button"
            onClick={() => setQuickViewProduct(product)}
            aria-label={`Quick view ${product.name}`}
            className="min-w-[40px] min-h-[40px] rounded-[8px] bg-[#FFFDF8]/95 dark:bg-[#0F3720]/95 border border-[#E3DCCB] dark:border-[#B8934A]/65 flex items-center justify-center text-[#0F3720] dark:text-[#F7F3EA] hover:bg-[#EDEFE6] dark:hover:bg-[#1F4A32] transition-colors duration-500 ease-out cursor-pointer"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
        <div>
          <p className="font-ui text-[12px] tracking-[0.18em] text-[#5E6B62] dark:text-[#D9C08A]">
            {product.category === 'men' ? 'Men' : 'Women'} · {product.subcategory} · {product.gsm}
          </p>

          <Link to={`/product/${product.slug}`} className="block mt-1.5">
            <h3 className="font-display text-xl font-semibold text-[#0F3720] dark:text-[#F7F3EA] leading-snug group-hover:underline">
              {product.name}
            </h3>
          </Link>

          <div className="mt-2 flex items-baseline gap-2.5">
            <span className="text-base font-semibold tabular-nums text-[#0F3720] dark:text-[#D9C08A]">
              {formatINR(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-sm line-through tabular-nums text-[#5E6B62] dark:text-[#C2CCC2]">
                {formatINR(product.compareAtPrice)}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={!product.inStock || product.stock <= 0}
          onClick={(e) => addToCart(product, defaultSize, defaultColor, 1, e.currentTarget)}
          className="w-full atelier-btn-primary px-4 font-ui text-[13px] tracking-[0.2em] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed dark:bg-[#B8934A] dark:text-[#0F3720] dark:hover:bg-[#D9C08A]"
        >
          {!product.inStock || product.stock <= 0 ? 'Out of Stock' : 'Add to Bag'}
        </button>
      </div>
    </article>
  );
}

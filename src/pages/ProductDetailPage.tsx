import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Heart, MessageCircle, Minus, Plus, Ruler } from 'lucide-react';
import type { Product } from '../types';
import { resolveMediaUrl } from '../lib/media';
import { COLOR_SWATCHES, buildWhatsAppUrl, formatINR } from '../lib/constants';
import { useStore } from '../context/StoreContext';
import { SizeChartModal } from '../components/SizeChartModal';
import { ProductCard } from '../components/ProductCard';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addToCart, toggleWishlist, isWishlisted } = useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [size, setSize] = useState('L');
  const [color, setColor] = useState('Obsidian');
  const [quantity, setQuantity] = useState(1);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true);
    setSelectedImageIdx(0);
    setQuantity(1);

    fetch(`/api/products/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Not found'))))
      .then((data: { product: Product; related: Product[] }) => {
        if (!active) return;
        setProduct(data.product);
        setRelated(data.related || []);
        setSize(data.product.sizes.includes('L') ? 'L' : data.product.sizes[0] || 'M');
        setColor(data.product.colors[0] || 'Obsidian');
      })
      .catch(() => {
        if (active) setProduct(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-16 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 aspect-[4/3] dh-skeleton" />
        <div className="lg:col-span-5 h-96 dh-skeleton" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h1 className="font-small-caps text-4xl font-bold text-[#0F3720] dark:text-[#F7F3EA]">
          Piece Not Found
        </h1>
        <p className="text-base text-[#5E6B62] dark:text-[#D9C08A] mt-3 mb-6">
          This drop may have been archived or moved.
        </p>
        <Link
          to="/shop"
          className="atelier-btn-primary px-7 font-ui text-[13px] tracking-[0.2em] inline-flex items-center dark:bg-[#B8934A] dark:text-[#0F3720]"
        >
          Back to Catalog
        </Link>
      </div>
    );
  }

  const wished = isWishlisted(product.id);
  const images = product.images.length ? product.images : ['tee_acid_wash_obsidian'];
  const waMessage = `Hey Daddy's Hook! I'd like to order:\n• Product: ${product.name}\n• Size: ${size}\n• Color: ${color}\n• Quantity: ${quantity}\n• Price: ${formatINR(product.price * quantity)}`;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-14 sm:py-20">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-sm text-[#5E6B62] dark:text-[#D9C08A] mb-7 flex items-center gap-2">
        <Link to="/" className="text-[#0F3720] dark:text-[#F7F3EA] hover:underline">Home</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/shop?category=${product.category}`} className="text-[#0F3720] dark:text-[#F7F3EA] hover:underline capitalize">
          {product.category}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-[#2E3F34] dark:text-[#F7F3EA] font-medium">{product.name}</span>
      </nav>

      {/* Main Gallery + Contiguous Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* Left Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[4/3] w-full rounded-[12px] bg-[#EDEFE6] dark:bg-[#0F3720] border border-[#E3DCCB] dark:border-[#B8934A]/65 overflow-hidden">
            <img
              src={resolveMediaUrl(images[selectedImageIdx] || images[0])}
              alt={`${product.name} view ${selectedImageIdx + 1}`}
              className="w-full h-full object-cover"
            />
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`aspect-[4/3] rounded-[8px] bg-[#EDEFE6] dark:bg-[#0F3720] overflow-hidden cursor-pointer transition-opacity ${
                    selectedImageIdx === idx
                      ? 'border-2 border-[#0F3720] dark:border-[#D9C08A]'
                      : 'border border-[#E3DCCB] opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={resolveMediaUrl(img)}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Sticky Purchase Module */}
        <div className="lg:col-span-5 lg:sticky lg:top-28 atelier-card p-7 sm:p-9">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="atelier-pill">
                <span className="w-2 h-2 rounded-full bg-[#B8934A]" aria-hidden="true" />
                <span className="font-ui text-[11px] tracking-[0.18em]">
                  {product.category === 'men' ? 'Men' : 'Women'} · {product.subcategory}
                </span>
              </span>
              <h1 className="font-small-caps text-3xl sm:text-4xl font-bold mt-3 text-[#0F3720] dark:text-[#F7F3EA]">
                {product.name}
              </h1>
            </div>

            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              aria-label={wished ? 'Remove from wishlist' : 'Save to wishlist'}
              className="min-w-[44px] min-h-[44px] rounded-[8px] bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A] text-[#0F3720] dark:text-[#F7F3EA] flex items-center justify-center shrink-0 cursor-pointer hover:bg-[#EDEFE6] dark:hover:bg-[#1F4A32]"
            >
              <Heart className={`w-5 h-5 ${wished ? 'fill-[#B8934A] text-[#B8934A]' : ''}`} />
            </button>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-3xl font-bold tabular-nums text-[#0F3720] dark:text-[#D9C08A]">
              {formatINR(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-sm line-through tabular-nums text-[#5E6B62] dark:text-[#C2CCC2]">
                {formatINR(product.compareAtPrice)}
              </span>
            )}
            <span className="text-xs font-semibold text-[#0F3720] dark:text-[#D9C08A]">
              {product.inStock && product.stock > 0
                ? `${product.stock} in stock`
                : 'Sold Out'}
            </span>
          </div>

          <p className="mt-4 text-base text-[#2E3F34] dark:text-[#F7F3EA]/85 leading-[1.6]">
            {product.description}
          </p>

          {/* Size Selector */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-ui text-[12px] tracking-[0.18em] text-[#0F3720] dark:text-[#F7F3EA]">
                Select Size: {size}
              </span>
              <button
                type="button"
                onClick={() => setSizeChartOpen(true)}
                className="font-ui text-[12px] tracking-[0.16em] text-[#0F3720] dark:text-[#D9C08A] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Ruler className="w-3.5 h-3.5" />
                Size Chart
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`min-h-[44px] rounded-[8px] border text-xs font-semibold transition-colors duration-500 ease-out cursor-pointer ${
                    size === s
                      ? 'bg-[#0F3720] text-[#F7F3EA] border-[#0F3720] dark:bg-[#B8934A] dark:text-[#0F3720] dark:border-[#B8934A]'
                      : 'bg-[#F7F3EA] dark:bg-[#081E12] border-[#D7DBCB] dark:border-[#B8934A]/60 hover:border-[#0F3720]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div className="mt-5">
            <span className="block font-ui text-[12px] tracking-[0.18em] mb-2.5 text-[#0F3720] dark:text-[#F7F3EA]">
              Color: {color}
            </span>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`min-h-[44px] rounded-[8px] px-3.5 text-xs font-medium inline-flex items-center gap-2 cursor-pointer ${
                    color === c
                      ? 'border-2 border-[#0F3720] dark:border-[#D9C08A] bg-[#EDEFE6] dark:bg-[#081E12] font-semibold'
                      : 'border border-[#D7DBCB] dark:border-[#B8934A]/50 bg-[#F7F3EA] dark:bg-[#081E12]'
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

          {/* Quantity + CTAs */}
          <div className="mt-6 flex items-center gap-3">
            <div className="inline-flex items-center rounded-[8px] border border-[#D7DBCB] dark:border-[#B8934A] bg-[#F7F3EA] dark:bg-[#081E12]">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="min-w-[44px] min-h-[52px] flex items-center justify-center text-[#0F3720] dark:text-[#F7F3EA] cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm font-semibold tabular-nums">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                aria-label="Increase quantity"
                className="min-w-[44px] min-h-[52px] flex items-center justify-center text-[#0F3720] dark:text-[#F7F3EA] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              disabled={!product.inStock || product.stock <= 0}
              onClick={(e) => addToCart(product, size, color, quantity, e.currentTarget)}
              className="flex-1 atelier-btn-primary font-ui text-[13px] tracking-[0.2em] cursor-pointer disabled:opacity-50 dark:bg-[#B8934A] dark:text-[#0F3720]"
            >
              {product.inStock && product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>

          <a
            href={buildWhatsAppUrl(waMessage)}
            target="_blank"
            rel="noreferrer"
            className="mt-3 w-full atelier-btn-secondary font-ui text-[13px] tracking-[0.2em] flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Buy on WhatsApp
          </a>

          {/* Fabric & Fit Specs */}
          <dl className="mt-7 pt-5 border-t border-[#E3DCCB] dark:border-[#B8934A]/45 space-y-2.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[#5E6B62] dark:text-[#D9C08A]">Fabric</dt>
              <dd className="font-medium text-right">{product.fabric}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#5E6B62] dark:text-[#D9C08A]">Weight</dt>
              <dd className="font-medium tabular-nums text-right">{product.gsm}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#5E6B62] dark:text-[#D9C08A]">Silhouette</dt>
              <dd className="font-medium text-right">{product.fit}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#5E6B62] dark:text-[#D9C08A]">Loyalty</dt>
              <dd className="font-semibold text-right text-[#0F3720] dark:text-[#D9C08A]">
                Earns +1 Streak Stamp
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-24">
          <div className="pb-6 border-b border-[#E3DCCB] dark:border-[#B8934A]/45">
            <div className="atelier-pill">
              <span className="w-2 h-2 rounded-full bg-[#B8934A]" aria-hidden="true" />
              <span className="font-ui text-[12px] tracking-[0.2em]">Pair It With</span>
            </div>
            <h2 className="font-small-caps text-4xl font-bold mt-4 text-[#0F3720] dark:text-[#F7F3EA]">
              Related Drops
            </h2>
            <div className="w-24 h-[3px] bg-[#B8934A] mt-4" />
          </div>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <SizeChartModal open={sizeChartOpen} onClose={() => setSizeChartOpen(false)} />
    </div>
  );
}

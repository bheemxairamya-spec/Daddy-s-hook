import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import type { Product } from '../types';
import { ProductCard } from '../components/ProductCard';

export function WishlistPage() {
  const { wishlist } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data: { products?: Product[] }) => {
        const saved = (data.products || []).filter((p) => wishlist.includes(p.id));
        setProducts(saved);
      })
      .finally(() => setLoading(false));
  }, [wishlist]);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-16 sm:py-24">
      <div className="pb-6 border-b border-[#E3DCCB] dark:border-[#B8934A]/45">
        <div className="atelier-pill">
          <span className="w-2 h-2 rounded-full bg-[#B8934A]" aria-hidden="true" />
          <span className="font-ui text-[12px] tracking-[0.2em]">Saved Pieces</span>
        </div>
        <h1 className="font-small-caps text-4xl sm:text-5xl font-bold mt-4 text-[#0F3720] dark:text-[#F7F3EA]">
          Your Wishlist
        </h1>
        <div className="w-24 h-[3px] bg-[#B8934A] mt-4" />
      </div>

      {loading ? (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-96 dh-skeleton" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="mt-10 atelier-card p-12 text-center">
          <h2 className="font-small-caps text-3xl font-bold text-[#0F3720] dark:text-[#F7F3EA]">
            No Saved Pieces Yet
          </h2>
          <p className="text-base text-[#5E6B62] dark:text-[#D9C08A] mt-2 mb-6">
            Tap the heart icon on any piece to keep track of your favourites.
          </p>
          <Link
            to="/shop"
            className="atelier-btn-primary px-7 font-ui text-[13px] tracking-[0.2em] inline-flex items-center dark:bg-[#B8934A] dark:text-[#0F3720]"
          >
            Browse Drops
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

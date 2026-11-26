import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { Product } from '../types';
import {
  ALL_SIZES,
  COLOR_SWATCHES,
  MEN_SUBCATEGORIES,
  WOMEN_SUBCATEGORIES,
} from '../lib/constants';
import { ProductCard } from '../components/ProductCard';

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const category = searchParams.get('category') || '';
  const subcategory = searchParams.get('subcategory') || '';
  const size = searchParams.get('size') || '';
  const color = searchParams.get('color') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sort = searchParams.get('sort') || 'newest';
  const search = searchParams.get('search') || '';
  const newArrival = searchParams.get('newArrival') || '';

  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const availableSubcategories = useMemo(() => {
    if (category === 'men') return [...MEN_SUBCATEGORIES];
    if (category === 'women') return [...WOMEN_SUBCATEGORIES];
    return [...MEN_SUBCATEGORIES, ...WOMEN_SUBCATEGORIES];
  }, [category]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (subcategory) params.set('subcategory', subcategory);
    if (size) params.set('size', size);
    if (color) params.set('color', color);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (sort) params.set('sort', sort);
    if (search) params.set('search', search);
    if (newArrival) params.set('newArrival', newArrival);

    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((data: { products?: Product[] }) => {
        if (active) setProducts(data.products || []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [category, subcategory, size, color, maxPrice, sort, search, newArrival]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    if (key === 'category') {
      next.delete('subcategory');
    }
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('search', localSearch.trim());
  };

  const resetFilters = () => {
    setLocalSearch('');
    setSearchParams(new URLSearchParams());
  };

  const hasFilters = searchParams.toString().length > 0;

  const filterPanel = (
    <div className="space-y-6">
      {/* Search */}
      <form onSubmit={handleSearchSubmit}>
        <label
          htmlFor="shop-search-input"
          className="block font-ui text-[12px] tracking-[0.2em] text-[#0F3720] dark:text-[#D9C08A] mb-2.5"
        >
          Search Drops
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-[#5E6B62] dark:text-[#D9C08A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="shop-search-input"
            type="search"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Acid wash, polo, oversized..."
            className="w-full min-h-[44px] rounded-[8px] pl-10 pr-3 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm text-[#2E3F34] dark:text-[#F7F3EA] placeholder:text-[#5E6B62] dark:placeholder:text-[#C2CCC2]"
          />
        </div>
      </form>

      {/* Category */}
      <div>
        <h3 className="font-ui text-[12px] tracking-[0.2em] text-[#0F3720] dark:text-[#D9C08A] mb-3">
          Collection
        </h3>
        <div className="flex flex-col gap-1.5">
          {[
            { label: 'All Drops', val: '' },
            { label: 'For Men', val: 'men' },
            { label: 'For Women', val: 'women' },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => updateParam('category', opt.val)}
              className={`min-h-[44px] rounded-[8px] px-3.5 text-left text-sm border transition-colors duration-500 ease-out cursor-pointer ${
                category === opt.val
                  ? 'bg-[#0F3720] text-[#F7F3EA] border-[#0F3720] dark:bg-[#B8934A] dark:text-[#0F3720] dark:border-[#B8934A] font-semibold'
                  : 'bg-[#F7F3EA] dark:bg-[#081E12] border-[#D7DBCB] dark:border-[#B8934A]/40 hover:bg-[#EDEFE6]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Subcategory */}
      <div>
        <h3 className="font-ui text-[12px] tracking-[0.2em] text-[#0F3720] dark:text-[#D9C08A] mb-3">
          Silhouette
        </h3>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => updateParam('subcategory', '')}
            className={`min-h-[38px] rounded-[8px] px-3 text-xs border transition-colors duration-500 ease-out cursor-pointer ${
              !subcategory
                ? 'bg-[#0F3720] text-[#F7F3EA] border-[#0F3720] dark:bg-[#B8934A] dark:text-[#0F3720]'
                : 'bg-[#EDEFE6] dark:bg-[#081E12] border-[#D7DBCB] dark:border-[#B8934A]/50 hover:border-[#0F3720]'
            }`}
          >
            All Fits
          </button>
          {availableSubcategories.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => updateParam('subcategory', subcategory === sub ? '' : sub)}
              className={`min-h-[38px] rounded-[8px] px-3 text-xs border transition-colors duration-500 ease-out cursor-pointer ${
                subcategory === sub
                  ? 'bg-[#0F3720] text-[#F7F3EA] border-[#0F3720] dark:bg-[#B8934A] dark:text-[#0F3720]'
                  : 'bg-[#EDEFE6] dark:bg-[#081E12] border-[#D7DBCB] dark:border-[#B8934A]/50 hover:border-[#0F3720]'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div>
        <h3 className="font-ui text-[12px] tracking-[0.2em] text-[#0F3720] dark:text-[#D9C08A] mb-3">
          Size
        </h3>
        <div className="grid grid-cols-5 gap-1.5">
          {ALL_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => updateParam('size', size === s ? '' : s)}
              className={`min-h-[44px] rounded-[8px] text-xs font-semibold border transition-colors duration-500 ease-out cursor-pointer ${
                size === s
                  ? 'bg-[#0F3720] text-[#F7F3EA] border-[#0F3720] dark:bg-[#B8934A] dark:text-[#0F3720]'
                  : 'bg-[#F7F3EA] dark:bg-[#081E12] border-[#D7DBCB] dark:border-[#B8934A]/50 hover:border-[#0F3720]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div>
        <h3 className="font-ui text-[12px] tracking-[0.2em] text-[#0F3720] dark:text-[#D9C08A] mb-3">
          Color
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(COLOR_SWATCHES).map(([cName, hex]) => (
            <button
              key={cName}
              type="button"
              onClick={() => updateParam('color', color === cName ? '' : cName)}
              className={`min-h-[40px] rounded-[8px] px-3 border text-xs flex items-center gap-2 cursor-pointer ${
                color === cName
                  ? 'border-2 border-[#0F3720] dark:border-[#D9C08A] bg-[#EDEFE6] dark:bg-[#1F4A32] font-semibold'
                  : 'border-[#D7DBCB] dark:border-[#B8934A]/50 bg-[#F7F3EA] dark:bg-[#081E12]'
              }`}
            >
              <span
                className="w-3 h-3 rounded-full border border-[#B8934A]"
                style={{ backgroundColor: hex }}
              />
              {cName}
            </button>
          ))}
        </div>
      </div>

      {/* Price Cap */}
      <div>
        <h3 className="font-ui text-[12px] tracking-[0.2em] text-[#0F3720] dark:text-[#D9C08A] mb-3">
          Price Ceiling
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'All Prices', val: '' },
            { label: 'Under Rs 1,500', val: '1500' },
            { label: 'Under Rs 1,800', val: '1800' },
            { label: 'Under Rs 2,500', val: '2500' },
          ].map((pOpt) => (
            <button
              key={pOpt.label}
              type="button"
              onClick={() => updateParam('maxPrice', pOpt.val)}
              className={`min-h-[40px] rounded-[8px] px-3 border text-xs cursor-pointer ${
                maxPrice === pOpt.val
                  ? 'bg-[#0F3720] text-[#F7F3EA] border-[#0F3720] dark:bg-[#B8934A] dark:text-[#0F3720]'
                  : 'bg-[#EDEFE6] dark:bg-[#081E12] border-[#D7DBCB] dark:border-[#B8934A]/50'
              }`}
            >
              {pOpt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={resetFilters}
        className="w-full atelier-btn-secondary font-ui text-[12px] tracking-[0.18em] cursor-pointer"
      >
        Reset All Filters
      </button>
    </div>
  );

  const pageTitle = subcategory
    ? subcategory
    : category === 'men'
      ? "Men's Collection"
      : category === 'women'
        ? "Women's Collection"
        : newArrival === 'true'
          ? 'New Arrivals'
          : 'All Drops';

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-14 sm:py-20">
      {/* Header Row */}
      <div className="pb-6 border-b border-[#E3DCCB] dark:border-[#B8934A]/45 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="atelier-pill">
            <span className="w-2 h-2 rounded-full bg-[#B8934A]" aria-hidden="true" />
            <span className="font-ui text-[12px] tracking-[0.2em]">Daddy&apos;s Hook Catalog</span>
          </div>
          <h1 className="font-small-caps text-4xl sm:text-5xl font-bold mt-4 text-[#0F3720] dark:text-[#F7F3EA]">
            {pageTitle}
          </h1>
          <div className="w-24 h-[3px] bg-[#B8934A] mt-4" />
          {search && (
            <p className="text-sm text-[#5E6B62] dark:text-[#D9C08A] mt-3">
              Showing results for &ldquo;{search}&rdquo;
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden min-h-[44px] rounded-[8px] px-4 bg-[#FFFDF8] dark:bg-[#0F3720] border border-[#C4CABD] dark:border-[#B8934A] text-[#0F3720] dark:text-[#F7F3EA] font-ui text-[12px] tracking-[0.18em] inline-flex items-center gap-2 cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>

          <label htmlFor="catalog-sort" className="sr-only">
            Sort products
          </label>
          <select
            id="catalog-sort"
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="min-h-[44px] rounded-[8px] px-4 bg-[#FFFDF8] dark:bg-[#0F3720] border border-[#C4CABD] dark:border-[#B8934A] text-[#0F3720] dark:text-[#F7F3EA] font-ui text-[12px] tracking-[0.16em] cursor-pointer"
          >
            <option value="newest">Sort: Newest Drops</option>
            <option value="featured">Sort: Featured</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>

          <span className="text-sm font-medium text-[#5E6B62] dark:text-[#D9C08A] tabular-nums">
            {products.length} {products.length === 1 ? 'Piece' : 'Pieces'}
          </span>
        </div>
      </div>

      {/* Main Layout: Sidebar + Product Grid */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-28 atelier-card p-6">
            {filterPanel}
          </div>
        </aside>

        {/* Product Grid */}
        <div className="lg:col-span-9">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-[390px] dh-skeleton"
                />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="atelier-card p-12 text-center">
              <h2 className="font-small-caps text-3xl font-bold text-[#0F3720] dark:text-[#F7F3EA]">
                {hasFilters ? 'No Pieces Match Those Filters' : 'New Drop Landing Soon'}
              </h2>
              <p className="text-base text-[#5E6B62] dark:text-[#D9C08A] mt-2 mb-6">
                {hasFilters ? 'Try clearing a size or color filter to explore the full collection.' : 'Fresh pieces are on the way. Check back soon.'}
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="atelier-btn-primary px-6 font-ui text-[13px] tracking-[0.2em] cursor-pointer dark:bg-[#B8934A] dark:text-[#0F3720]"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product, idx) => (
                <div
                  key={product.id}
                  className="animate-dh-fade-up [&>article]:h-full"
                  style={{ animationDelay: `${Math.min(idx, 8) * 60}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 lg:hidden flex justify-start"
          onClick={() => setMobileFiltersOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-80 max-w-[85vw] h-full bg-[#F7F3EA] dark:bg-[#081E12] border-r border-[#E3DCCB] dark:border-[#B8934A] p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#E3DCCB] dark:border-[#B8934A]/50 mb-5">
              <h2 className="font-small-caps text-2xl font-bold text-[#0F3720] dark:text-[#F7F3EA]">
                Filters
              </h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="min-w-[44px] min-h-[44px] rounded-[8px] flex items-center justify-center text-[#0F3720] dark:text-[#F7F3EA] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {filterPanel}
          </div>
        </div>
      )}
    </div>
  );
}

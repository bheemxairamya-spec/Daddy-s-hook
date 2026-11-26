import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { FREE_DELIVERY_THRESHOLD, formatINR } from '../lib/constants';
import { resolveMediaUrl } from '../lib/media';

export function CartDrawer() {
  const {
    cart,
    cartSubtotal,
    isCartOpen,
    setCartOpen,
    updateCartQuantity,
    removeFromCart,
  } = useStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) setCartOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isCartOpen, setCartOpen]);

  if (!isCartOpen) return null;

  const remainingForFreeShipping = Math.max(0, FREE_DELIVERY_THRESHOLD - cartSubtotal);
  const progressPct = Math.min(100, (cartSubtotal / FREE_DELIVERY_THRESHOLD) * 100);
  const estimatedShipping = cartSubtotal === 0 || remainingForFreeShipping === 0 ? 0 : 99;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
    >
      {/* Backdrop */}
      <div
        onClick={() => setCartOpen(false)}
        className="fixed inset-0 bg-black/50 transition-opacity duration-300"
      />

      {/* Slide-in Panel */}
      <aside className="relative z-10 w-full max-w-md h-full bg-[#F7F3EA] dark:bg-[#081E12] text-[#2E3F34] dark:text-[#F7F3EA] border-l border-[#E3DCCB] dark:border-[#B8934A] flex flex-col animate-dh-page-enter">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E3DCCB] dark:border-[#B8934A]/45 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#0F3720] dark:text-[#D9C08A]" />
            <h2 className="font-small-caps text-2xl font-bold text-[#0F3720] dark:text-[#F7F3EA]">
              Your Bag
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            aria-label="Close shopping bag"
            className="min-w-[44px] min-h-[44px] rounded-[8px] flex items-center justify-center text-[#0F3720] dark:text-[#F7F3EA] hover:bg-[#EDEFE6] dark:hover:bg-[#0F3720] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Progress */}
        <div className="px-6 py-3.5 bg-[#EDEFE6] dark:bg-[#0F3720] border-b border-[#D7DBCB] dark:border-[#B8934A]/40">
          <p className="text-sm font-medium text-[#2E3F34] dark:text-[#F7F3EA]">
            {remainingForFreeShipping === 0 && cart.length > 0
              ? 'You unlocked complimentary express delivery.'
              : `Add ${formatINR(remainingForFreeShipping)} more for complimentary delivery.`}
          </p>
          <div className="mt-2 h-1.5 w-full rounded-full bg-[#FFFDF8] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/40 overflow-hidden">
            <div
              className="h-full bg-[#0F3720] dark:bg-[#B8934A] transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="w-10 h-10 text-[#0F3720] dark:text-[#D9C08A] mb-3" />
              <p className="font-display text-2xl font-semibold text-[#0F3720] dark:text-[#F7F3EA]">
                Your bag is empty
              </p>
              <p className="text-base text-[#5E6B62] dark:text-[#C2CCC2] mt-1 mb-6 max-w-xs">
                Explore our heavyweight acid-wash tees, polos, and relaxed baggy fits.
              </p>
              <Link
                to="/shop"
                onClick={() => setCartOpen(false)}
                className="atelier-btn-primary px-6 font-ui text-[13px] tracking-[0.2em] inline-flex items-center dark:bg-[#B8934A] dark:text-[#0F3720]"
              >
                Browse Drops
              </Link>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.key}
                className="flex gap-4 p-3.5 rounded-[12px] bg-[#FFFDF8] dark:bg-[#0F3720] border border-[#E3DCCB] dark:border-[#B8934A]/50"
              >
                <Link
                  to={`/product/${item.slug}`}
                  onClick={() => setCartOpen(false)}
                  className="w-20 h-20 rounded-[8px] shrink-0 border border-[#E3DCCB] dark:border-[#B8934A]/50 overflow-hidden bg-[#EDEFE6]"
                >
                  <img
                    src={resolveMediaUrl(item.image)}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        to={`/product/${item.slug}`}
                        onClick={() => setCartOpen(false)}
                        className="font-display text-base font-semibold text-[#0F3720] dark:text-[#F7F3EA] leading-snug hover:underline block"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-[#5E6B62] dark:text-[#D9C08A] mt-0.5">
                        Size {item.size} · {item.color}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.key)}
                      aria-label={`Remove ${item.name}`}
                      className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[#5E6B62] hover:text-[#0F3720] dark:text-[#D9C08A] dark:hover:text-[#F7F3EA] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center rounded-[8px] border border-[#D7DBCB] dark:border-[#B8934A]/60 bg-[#F7F3EA] dark:bg-[#081E12]">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.key, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[#0F3720] dark:text-[#F7F3EA] hover:bg-[#EDEFE6] dark:hover:bg-[#1F4A32] cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-sm font-semibold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.key, item.quantity + 1)}
                        aria-label="Increase quantity"
                        className="min-w-[36px] min-h-[36px] flex items-center justify-center text-[#0F3720] dark:text-[#F7F3EA] hover:bg-[#EDEFE6] dark:hover:bg-[#1F4A32] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-sm font-semibold tabular-nums text-[#0F3720] dark:text-[#D9C08A]">
                      {formatINR(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-[#E3DCCB] dark:border-[#B8934A]/50 bg-[#FFFDF8] dark:bg-[#0F3720] space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[#5E6B62] dark:text-[#D9C08A]">Subtotal</span>
                <span className="font-semibold tabular-nums">{formatINR(cartSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5E6B62] dark:text-[#D9C08A]">Shipping</span>
                <span className="font-medium tabular-nums">
                  {estimatedShipping === 0 ? 'Complimentary' : formatINR(estimatedShipping)}
                </span>
              </div>
              <div className="pt-2 border-t border-[#E3DCCB] dark:border-[#B8934A]/40 flex justify-between text-base font-bold text-[#0F3720] dark:text-[#F7F3EA]">
                <span>Total</span>
                <span className="tabular-nums">{formatINR(cartSubtotal + estimatedShipping)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              onClick={() => setCartOpen(false)}
              className="w-full atelier-btn-primary px-6 font-ui text-[13px] tracking-[0.2em] flex items-center justify-center dark:bg-[#B8934A] dark:text-[#0F3720]"
            >
              Proceed to Checkout
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}

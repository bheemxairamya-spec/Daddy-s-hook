import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, ShieldCheck, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { FREE_DELIVERY_THRESHOLD, STORE_INFO, formatINR } from '../lib/constants';
import { useStoreConfig } from '../lib/config';
import { resolveMediaUrl } from '../lib/media';
import type { Order, PaymentMethod, StreakCard } from '../types';

type RazorpayCtor = new (opts: Record<string, unknown>) => { open: () => void };

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) return resolve();
    const el = document.createElement('script');
    el.src = 'https://checkout.razorpay.com/v1/checkout.js';
    el.onload = () => resolve();
    el.onerror = () => reject(new Error('Could not load Razorpay'));
    document.body.appendChild(el);
  });
}

export function CheckoutPage() {
  const config = useStoreConfig();
  const onlineEnabled = Boolean(config?.onlinePaymentEnabled);
  const { cart, cartSubtotal, clearCart, user, showToast } = useStore();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const shipping = cartSubtotal >= FREE_DELIVERY_THRESHOLD || cartSubtotal === 0 ? 0 : 99;
  const total = cartSubtotal + shipping;

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h1 className="font-small-caps text-4xl font-bold text-[#0F3720] dark:text-[#F7F3EA]">
          Your Bag Is Empty
        </h1>
        <p className="text-base text-[#5E6B62] dark:text-[#D9C08A] mt-3 mb-7">
          Add pieces from our drop before heading to checkout.
        </p>
        <Link
          to="/shop"
          className="atelier-btn-primary px-8 font-ui text-[13px] tracking-[0.2em] inline-flex items-center dark:bg-[#B8934A] dark:text-[#0F3720]"
        >
          Browse Collection
        </Link>
      </div>
    );
  }

  const payload = {
    customerName,
    phone,
    email: email || undefined,
    address,
    city,
    pincode,
    items: cart.map((item) => ({
      productId: item.productId,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
    })),
  };

  const placeOrder = async (extra: Record<string, string> = {}) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, paymentMethod, ...extra }),
    });
    const data = (await res.json()) as {
      order?: Order;
      streakCard?: StreakCard;
      error?: string;
    };
    if (!res.ok || !data.order) {
      setError(data.error || 'Could not place your order. Please verify details.');
      setSubmitting(false);
      return;
    }
    clearCart();
    try {
      sessionStorage.setItem(`dh_order_phone_${data.order.id}`, data.order.phone);
    } catch {
      /* ignore */
    }
    showToast(`Order ${data.order.id} confirmed`);
    navigate(`/order-confirmation/${data.order.id}`, {
      state: { order: data.order, streakCard: data.streakCard },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (paymentMethod === 'COD') {
        await placeOrder();
        return;
      }

      // Online payment: server creates a Razorpay order for the verified cart total.
      const orderRes = await fetch('/api/payments/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payload.items }),
      });
      const rz = (await orderRes.json()) as {
        razorpayOrderId?: string;
        amount?: number;
        keyId?: string;
        error?: string;
      };
      if (!orderRes.ok || !rz.razorpayOrderId) {
        setError(rz.error || 'Could not start online payment.');
        setSubmitting(false);
        return;
      }
      await loadRazorpayScript();
      const Razorpay = (window as unknown as { Razorpay?: RazorpayCtor }).Razorpay;
      if (!Razorpay) throw new Error('Razorpay unavailable');
      const instance = new Razorpay({
        key: rz.keyId,
        amount: rz.amount,
        currency: 'INR',
        name: STORE_INFO.name,
        description: 'Order payment',
        order_id: rz.razorpayOrderId,
        prefill: { name: customerName, contact: phone, email },
        theme: { color: '#0F3720' },
        modal: { ondismiss: () => setSubmitting(false) },
        handler: (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          placeOrder({
            razorpayOrderId: r.razorpay_order_id,
            razorpayPaymentId: r.razorpay_payment_id,
            razorpaySignature: r.razorpay_signature,
          }).catch(() => {
            setError(`Payment received (ID ${r.razorpay_payment_id}) but the order could not be saved. Please WhatsApp us this ID.`);
            setSubmitting(false);
          });
        },
      });
      instance.open();
    } catch {
      setError('Network error while submitting your order.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-14 sm:py-20">
      <div className="pb-6 border-b border-[#E3DCCB] dark:border-[#B8934A]/45">
        <div className="atelier-pill">
          <span className="w-2 h-2 rounded-full bg-[#B8934A]" aria-hidden="true" />
          <span className="font-ui text-[12px] tracking-[0.2em]">Secure Checkout</span>
        </div>
        <h1 className="font-small-caps text-4xl sm:text-5xl font-bold mt-4 text-[#0F3720] dark:text-[#F7F3EA]">
          Complete Your Order
        </h1>
        <div className="w-24 h-[3px] bg-[#B8934A] mt-4" />
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start"
      >
        {/* Left Shipping & Payment Form */}
        <div className="lg:col-span-7 space-y-8">
          <section className="atelier-card p-7 sm:p-8 space-y-5">
            <h2 className="font-small-caps text-2xl font-bold text-[#0F3720] dark:text-[#F7F3EA]">
              1. Delivery Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="chk-name" className="block font-ui text-[12px] tracking-[0.18em] mb-1.5 text-[#0F3720] dark:text-[#D9C08A]">
                  Full Name *
                </label>
                <input
                  id="chk-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full min-h-[46px] rounded-[8px] px-3.5 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm text-[#2E3F34] dark:text-[#F7F3EA]"
                />
              </div>
              <div>
                <label htmlFor="chk-phone" className="block font-ui text-[12px] tracking-[0.18em] mb-1.5 text-[#0F3720] dark:text-[#D9C08A]">
                  Phone Number (Streak Stamp) *
                </label>
                <input
                  id="chk-phone"
                  type="tel"
                  required
                  inputMode="numeric"
                  pattern="[6-9][0-9]{9}"
                  title="10-digit Indian mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full min-h-[46px] rounded-[8px] px-3.5 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm tabular-nums text-[#2E3F34] dark:text-[#F7F3EA]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="chk-email" className="block font-ui text-[12px] tracking-[0.18em] mb-1.5 text-[#0F3720] dark:text-[#D9C08A]">
                Email (Optional)
              </label>
              <input
                id="chk-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full min-h-[46px] rounded-[8px] px-3.5 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm text-[#2E3F34] dark:text-[#F7F3EA]"
              />
            </div>

            <div>
              <label htmlFor="chk-address" className="block font-ui text-[12px] tracking-[0.18em] mb-1.5 text-[#0F3720] dark:text-[#D9C08A]">
                Full Street Address *
              </label>
              <textarea
                id="chk-address"
                required
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Apartment, building, street, landmark"
                className="w-full rounded-[8px] p-3.5 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm text-[#2E3F34] dark:text-[#F7F3EA]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="chk-city" className="block font-ui text-[12px] tracking-[0.18em] mb-1.5 text-[#0F3720] dark:text-[#D9C08A]">
                  City *
                </label>
                <input
                  id="chk-city"
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="w-full min-h-[46px] rounded-[8px] px-3.5 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm text-[#2E3F34] dark:text-[#F7F3EA]"
                />
              </div>
              <div>
                <label htmlFor="chk-pin" className="block font-ui text-[12px] tracking-[0.18em] mb-1.5 text-[#0F3720] dark:text-[#D9C08A]">
                  Pincode *
                </label>
                <input
                  id="chk-pin"
                  type="text"
                  required
                  inputMode="numeric"
                  pattern="[1-9][0-9]{5}"
                  maxLength={6}
                  title="6-digit pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="6-digit pincode"
                  className="w-full min-h-[46px] rounded-[8px] px-3.5 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm tabular-nums text-[#2E3F34] dark:text-[#F7F3EA]"
                />
              </div>
            </div>
          </section>

          {/* Payment Method */}
          <section className="atelier-card p-7 sm:p-8 space-y-4">
            <h2 className="font-small-caps text-2xl font-bold text-[#0F3720] dark:text-[#F7F3EA]">
              2. Payment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`p-4 rounded-[8px] border text-left transition-colors duration-500 ease-out cursor-pointer ${
                  paymentMethod === 'COD'
                    ? 'bg-[#0F3720] text-[#F7F3EA] border-[#0F3720] dark:bg-[#B8934A] dark:text-[#0F3720]'
                    : 'bg-[#F7F3EA] dark:bg-[#081E12] border-[#D7DBCB] dark:border-[#B8934A]/60'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Truck className="w-4 h-4" />
                  Cash on Delivery
                </div>
                <p className="text-xs opacity-80 mt-1">
                  Pay in cash or UPI upon doorstep arrival.
                </p>
              </button>

              <button
                type="button"
                disabled={!onlineEnabled}
                onClick={() => setPaymentMethod('RAZORPAY_UPI')}
                className={`p-4 rounded-[8px] border text-left transition-colors duration-500 ease-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  paymentMethod === 'RAZORPAY_UPI'
                    ? 'bg-[#0F3720] text-[#F7F3EA] border-[#0F3720] dark:bg-[#B8934A] dark:text-[#0F3720]'
                    : 'bg-[#F7F3EA] dark:bg-[#081E12] border-[#D7DBCB] dark:border-[#B8934A]/60'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <CreditCard className="w-4 h-4" />
                  UPI / Card / Netbanking
                </div>
                <p className="text-xs opacity-80 mt-1">
                  {onlineEnabled
                    ? 'Pay securely online via Razorpay.'
                    : 'Online payment is currently unavailable.'}
                </p>
              </button>
            </div>
          </section>

          {error && (
            <div className="p-4 rounded-[8px] border border-[#B8934A] bg-[#EDEFE6] dark:bg-[#0F3720] text-sm font-medium text-[#2E3F34] dark:text-[#F7F3EA]">
              {error}
            </div>
          )}
        </div>

        {/* Right Summary */}
        <aside className="lg:col-span-5 atelier-card p-7 sm:p-8 lg:sticky lg:top-28">
          <h2 className="font-small-caps text-2xl font-bold pb-4 border-b border-[#E3DCCB] dark:border-[#B8934A]/45 text-[#0F3720] dark:text-[#F7F3EA]">
            Order Summary
          </h2>

          <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.key} className="flex items-center gap-3">
                <img
                  src={resolveMediaUrl(item.image)}
                  alt={item.name}
                  className="w-14 h-14 rounded-[8px] object-cover bg-[#EDEFE6] border border-[#E3DCCB] shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate text-[#0F3720] dark:text-[#F7F3EA]">{item.name}</p>
                  <p className="text-xs text-[#5E6B62] dark:text-[#D9C08A]">
                    {item.size} · {item.color} · Qty {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums shrink-0 text-[#0F3720] dark:text-[#D9C08A]">
                  {formatINR(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-[#E3DCCB] dark:border-[#B8934A]/45 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#5E6B62] dark:text-[#D9C08A]">Subtotal</span>
              <span className="font-medium tabular-nums">{formatINR(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5E6B62] dark:text-[#D9C08A]">Delivery</span>
              <span className="font-medium tabular-nums">
                {shipping === 0 ? 'Complimentary' : formatINR(shipping)}
              </span>
            </div>
            <div className="pt-2 border-t border-[#E3DCCB] dark:border-[#B8934A]/40 flex justify-between text-base font-bold text-[#0F3720] dark:text-[#F7F3EA]">
              <span>Total</span>
              <span className="tabular-nums">{formatINR(total)}</span>
            </div>
          </div>

          <div className="mt-5 p-3.5 rounded-[8px] bg-[#EDEFE6] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/60 text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#0F3720] dark:text-[#D9C08A] shrink-0 mt-0.5" />
            <span>
              Placing this order automatically adds <strong>+1 Streak Stamp</strong> to your phone number.
            </span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full atelier-btn-primary font-ui text-[13px] tracking-[0.2em] cursor-pointer disabled:opacity-60 dark:bg-[#B8934A] dark:text-[#0F3720]"
          >
            {submitting
              ? 'Processing...'
              : paymentMethod === 'RAZORPAY_UPI'
                ? `Pay ${formatINR(total)}`
                : `Place Order · ${formatINR(total)}`}
          </button>
        </aside>
      </form>
    </div>
  );
}

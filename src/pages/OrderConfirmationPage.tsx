import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Award, CheckCircle2, MessageCircle } from 'lucide-react';
import type { Order, StreakCard } from '../types';
import { buildWhatsAppUrl, formatINR } from '../lib/constants';

export function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const state = (location.state as { order?: Order; streakCard?: StreakCard } | null) || null;

  const [order, setOrder] = useState<Order | null>(state?.order || null);
  const [streakCard, setStreakCard] = useState<StreakCard | null>(state?.streakCard || null);
  const [loading, setLoading] = useState(!state?.order);

  useEffect(() => {
    if (order || !id) return;
    let phone = new URLSearchParams(location.search).get('phone') || '';
    try {
      phone = phone || sessionStorage.getItem(`dh_order_phone_${id}`) || '';
    } catch {
      /* ignore */
    }
    const headers: Record<string, string> = {};
    try {
      const u = JSON.parse(localStorage.getItem('dh_user') || 'null') as { token?: string } | null;
      if (u?.token) headers.Authorization = `Bearer ${u.token}`;
    } catch {
      /* ignore */
    }
    fetch(`/api/orders/${encodeURIComponent(id)}?phone=${encodeURIComponent(phone)}`, { headers })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Not found'))))
      .then((data: { order: Order; streakCard: StreakCard | null }) => {
        setOrder(data.order);
        setStreakCard(data.streakCard);
      })
      .finally(() => setLoading(false));
  }, [id, order, location.search]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-base text-[#5E6B62] dark:text-[#D9C08A]">Loading receipt...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <h1 className="font-small-caps text-4xl font-bold text-[#0F3720] dark:text-[#F7F3EA]">
          Order Not Found
        </h1>
        <Link
          to="/shop"
          className="mt-6 atelier-btn-primary px-7 font-ui text-[13px] tracking-[0.2em] inline-flex items-center dark:bg-[#B8934A] dark:text-[#0F3720]"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
      <div className="atelier-card p-8 sm:p-11">
        <div className="atelier-pill">
          <CheckCircle2 className="w-4 h-4 text-[#0F3720] dark:text-[#D9C08A]" />
          <span className="font-ui text-[12px] tracking-[0.2em]">Order Confirmed</span>
        </div>

        <h1 className="font-small-caps text-4xl sm:text-5xl font-bold mt-4 text-[#0F3720] dark:text-[#F7F3EA]">
          Thank You, {order.customerName}
        </h1>
        <div className="w-24 h-[3px] bg-[#B8934A] mt-4" />

        <p className="text-sm text-[#5E6B62] dark:text-[#D9C08A] mt-4 tabular-nums">
          Order ID: <strong className="text-[#0F3720] dark:text-[#F7F3EA]">{order.id}</strong> · Status: {order.status}
        </p>

        {/* Streak Stamp Earned Notice */}
        <div className="mt-7 relative bg-[#0F3720] text-[#F7F3EA] rounded-[16px] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden">
          <div
            className="pointer-events-none absolute inset-3 rounded-[10px] border border-[#B8934A]/65"
            aria-hidden="true"
          />
          <div className="relative z-10 flex items-start gap-3">
            <Award className="w-6 h-6 text-[#D9C08A] shrink-0 mt-0.5" />
            <div>
              <p className="font-ui text-[13px] tracking-[0.2em] text-[#D9C08A]">
                Streak Stamp Earned (+1)
              </p>
              <p className="text-sm text-[#F7F3EA]/85 mt-1">
                This order earned a streak stamp on card{' '}
                <strong className="tabular-nums">{order.phone}</strong>.
                {streakCard ? ` You now have ${streakCard.stamps}/10 stamps.` : ''}
              </p>
            </div>
          </div>
          {streakCard && (
            <span className="relative z-10 font-display text-2xl font-bold text-[#D9C08A] tabular-nums shrink-0">
              {streakCard.stamps}/10
            </span>
          )}
        </div>

        {/* Receipt Items */}
        <div className="mt-8 pt-6 border-t border-[#E3DCCB] dark:border-[#B8934A]/45 space-y-3">
          <h2 className="font-ui text-[13px] tracking-[0.2em] text-[#0F3720] dark:text-[#F7F3EA]">
            Items Ordered
          </h2>
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm py-2 border-b border-[#E3DCCB]/60 dark:border-[#B8934A]/25">
              <span>
                {item.name} ({item.size}, {item.color}) × {item.quantity}
              </span>
              <span className="font-semibold tabular-nums">
                {formatINR(item.price * item.quantity)}
              </span>
            </div>
          ))}
          <div className="pt-2 space-y-1 text-sm">
            <div className="flex justify-between text-[#5E6B62] dark:text-[#D9C08A]">
              <span>Shipping</span>
              <span className="tabular-nums">
                {order.shipping === 0 ? 'Complimentary' : formatINR(order.shipping)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-[#0F3720] dark:text-[#F7F3EA]">
              <span>Total ({order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Paid Online'})</span>
              <span className="tabular-nums">{formatINR(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-[#E3DCCB] dark:border-[#B8934A]/45 text-sm">
          <p className="font-semibold text-[#0F3720] dark:text-[#F7F3EA]">Shipping To</p>
          <p className="text-[#5E6B62] dark:text-[#D9C08A] mt-1">
            {order.address}, {order.city} — {order.pincode} · {order.phone}
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/shop"
            className="atelier-btn-primary px-7 font-ui text-[13px] tracking-[0.2em] inline-flex items-center dark:bg-[#B8934A] dark:text-[#0F3720]"
          >
            Continue Shopping
          </Link>
          <a
            href={buildWhatsAppUrl(
              `Hey Daddy's Hook! Tracking check for Order ${order.id} (${order.phone}).`
            )}
            target="_blank"
            rel="noreferrer"
            className="atelier-btn-secondary px-6 font-ui text-[13px] tracking-[0.2em] inline-flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp Support
          </a>
        </div>
      </div>
    </div>
  );
}

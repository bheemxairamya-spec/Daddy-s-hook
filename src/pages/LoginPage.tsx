import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Award, LogOut } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Order, StreakCard, UserSession } from '../types';
import { formatINR } from '../lib/constants';
import { useStoreConfig } from '../lib/config';

export function LoginPage() {
  const { user, setUser, showToast } = useStore();
  const config = useStoreConfig();
  const navigate = useNavigate();
  const [trackId, setTrackId] = useState('');
  const [trackPhone, setTrackPhone] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [streakCard, setStreakCard] = useState<StreakCard | null>(null);

  useEffect(() => {
    if (!user?.phone && !user?.email) return;
    Promise.all([
      fetch('/api/orders', {
        headers: user.token ? { Authorization: `Bearer ${user.token}` } : {},
      }).then((r) => r.json()),
      user.phone
        ? fetch(`/api/streak/${encodeURIComponent(user.phone)}`).then((r) => r.json())
        : Promise.resolve({}),
    ])
      .then(([ordData, strData]: [{ orders?: Order[] }, { streakCard?: StreakCard }]) => {
        setOrders(ordData.orders || []);
        setStreakCard(strData.streakCard || null);
      })
      .catch(() => {});
  }, [user]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = (await res.json()) as {
        sent?: boolean;
        verificationCode?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || 'Could not send OTP.');
      } else {
        setOtpSent(true);
        setVerificationCode(data.verificationCode || '');
        showToast('Verification code ready');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, code }),
      });
      const data = (await res.json()) as { user?: UserSession; error?: string };
      if (!res.ok || !data.user) {
        setError(data.error || 'Invalid OTP.');
      } else {
        setUser(data.user);
        showToast("Signed in to Daddy's Hook");
      }
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-16 sm:py-24 space-y-8">
        <div className="atelier-card p-7 sm:p-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="atelier-pill">
              <span className="w-2 h-2 rounded-full bg-[#B8934A]" aria-hidden="true" />
              <span className="font-ui text-[12px] tracking-[0.2em]">Member Account</span>
            </div>
            <h1 className="font-small-caps text-3xl sm:text-4xl font-bold mt-3 text-[#0F3720] dark:text-[#F7F3EA]">
              {user.identifier}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setUser(null)}
            className="atelier-btn-secondary px-5 font-ui text-[12px] tracking-[0.18em] inline-flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {streakCard && (
          <div className="relative bg-[#0F3720] text-[#F7F3EA] rounded-[16px] p-7 flex items-center justify-between gap-4 overflow-hidden">
            <div
              className="pointer-events-none absolute inset-3 rounded-[10px] border border-[#B8934A]/65"
              aria-hidden="true"
            />
            <div className="relative z-10 flex items-center gap-3">
              <Award className="w-6 h-6 text-[#D9C08A]" />
              <div>
                <p className="font-ui text-[13px] tracking-[0.2em] text-[#D9C08A]">
                  Streak Card Progress
                </p>
                <p className="text-sm text-[#F7F3EA]/85 mt-0.5">
                  {streakCard.stamps >= 10
                    ? 'Prize ready to claim!'
                    : `${10 - streakCard.stamps} more stamps for a complimentary tee.`}
                </p>
              </div>
            </div>
            <span className="relative z-10 font-display text-3xl font-bold text-[#D9C08A] tabular-nums">
              {streakCard.stamps} / 10
            </span>
          </div>
        )}

        <div className="atelier-card p-7 sm:p-8">
          <h2 className="font-small-caps text-2xl font-bold mb-4 text-[#0F3720] dark:text-[#F7F3EA]">
            Order History
          </h2>
          {orders.length === 0 ? (
            <p className="text-base text-[#5E6B62] dark:text-[#D9C08A]">
              No orders found for this account yet.{' '}
              <Link to="/shop" className="underline font-semibold text-[#0F3720] dark:text-[#F7F3EA]">
                Explore drops
              </Link>
            </p>
          ) : (
            <div className="divide-y divide-[#E3DCCB] dark:divide-[#B8934A]/35">
              {orders.map((ord) => (
                <div key={ord.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <Link
                      to={`/order-confirmation/${ord.id}`}
                      className="font-display text-lg font-bold text-[#0F3720] dark:text-[#F7F3EA] hover:underline"
                    >
                      {ord.id}
                    </Link>
                    <p className="text-xs text-[#5E6B62] dark:text-[#D9C08A] mt-0.5">
                      {ord.items.length} item(s) · {ord.status} · {ord.paymentMethod}
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums">{formatINR(ord.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24">
      {config?.otpEnabled !== false && (
      <div className="atelier-card p-8 sm:p-9">
        <div className="atelier-pill">
          <span className="w-2 h-2 rounded-full bg-[#B8934A]" aria-hidden="true" />
          <span className="font-ui text-[12px] tracking-[0.2em]">Customer Access</span>
        </div>
        <h1 className="font-small-caps text-3xl sm:text-4xl font-bold mt-4 text-[#0F3720] dark:text-[#F7F3EA]">
          Sign In with OTP
        </h1>
        <div className="w-24 h-[3px] bg-[#B8934A] mt-4" />
        <p className="text-base text-[#5E6B62] dark:text-[#D9C08A] mt-4">
          Enter your phone number or email to view orders and your streak card.
        </p>

        {!otpSent ? (
          <form onSubmit={handleRequestOtp} className="mt-6 space-y-4">
            <div>
              <label htmlFor="otp-id" className="block font-ui text-[12px] tracking-[0.18em] mb-1.5 text-[#0F3720] dark:text-[#D9C08A]">
                Phone or Email
              </label>
              <input
                id="otp-id"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="10-digit phone or name@domain.com"
                className="w-full min-h-[46px] rounded-[8px] px-3.5 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm"
              />
            </div>
            {error && <p className="text-xs text-red-700 dark:text-[#D9C08A]">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full atelier-btn-primary font-ui text-[13px] tracking-[0.2em] cursor-pointer dark:bg-[#B8934A] dark:text-[#0F3720]"
            >
              {loading ? 'Sending...' : 'Send One-Time Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
            {verificationCode && (
              <div className="p-3 rounded-[8px] bg-[#EDEFE6] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A] text-xs">
                Verification code: <strong className="tabular-nums text-sm">{verificationCode}</strong>
              </div>
            )}
            <div>
              <label htmlFor="otp-code" className="block font-ui text-[12px] tracking-[0.18em] mb-1.5 text-[#0F3720] dark:text-[#D9C08A]">
                Enter 6-Digit Code
              </label>
              <input
                id="otp-code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6-digit OTP"
                className="w-full min-h-[46px] rounded-[8px] px-3.5 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm tabular-nums"
              />
            </div>
            {error && <p className="text-xs text-red-700 dark:text-[#D9C08A]">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full atelier-btn-primary font-ui text-[13px] tracking-[0.2em] cursor-pointer dark:bg-[#B8934A] dark:text-[#0F3720]"
            >
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setCode('');
              }}
              className="w-full text-xs underline text-[#5E6B62] dark:text-[#D9C08A] cursor-pointer"
            >
              Use a different phone or email
            </button>
          </form>
        )}
      </div>
      )}
      <div className="atelier-card p-8 sm:p-9 mt-8">
        <div className="atelier-pill">
          <span className="w-2 h-2 rounded-full bg-[#B8934A]" aria-hidden="true" />
          <span className="font-ui text-[12px] tracking-[0.2em]">Order Tracking</span>
        </div>
        <h2 className="font-small-caps text-2xl sm:text-3xl font-bold mt-4 text-[#0F3720] dark:text-[#F7F3EA]">
          Track Your Order
        </h2>
        <div className="w-16 h-[3px] bg-[#B8934A] mt-3" />
        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            navigate(
              `/order-confirmation/${encodeURIComponent(trackId.trim().toUpperCase())}?phone=${encodeURIComponent(trackPhone.trim())}`
            );
          }}
        >
          <input
            type="text"
            required
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            placeholder="Order ID (e.g. DH-1001)"
            aria-label="Order ID"
            className="w-full min-h-[46px] rounded-[8px] px-3.5 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm"
          />
          <input
            type="tel"
            required
            value={trackPhone}
            onChange={(e) => setTrackPhone(e.target.value)}
            placeholder="Phone number used at checkout"
            aria-label="Phone number"
            className="w-full min-h-[46px] rounded-[8px] px-3.5 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm tabular-nums"
          />
          <button
            type="submit"
            className="w-full atelier-btn-primary font-ui text-[13px] tracking-[0.2em] cursor-pointer dark:bg-[#B8934A] dark:text-[#0F3720]"
          >
            Track Order
          </button>
        </form>
      </div>
    </div>
  );
}

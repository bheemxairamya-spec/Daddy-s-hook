import { useState } from 'react';
import { Instagram, MapPin, MessageCircle, Phone } from 'lucide-react';
import { STORE_INFO, buildWhatsAppUrl } from '../lib/constants';
import { LocationQRCode } from '../components/LocationQRCode';
import { useStore } from '../context/StoreContext';

export function ContactPage() {
  const { showToast } = useStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, message }),
      });
      if (res.ok) {
        setSent(true);
        setName('');
        setPhone('');
        setEmail('');
        setMessage('');
        showToast('Message sent to the atelier');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-16 sm:py-24">
      <div className="pb-6 border-b border-[#E3DCCB] dark:border-[#B8934A]/45">
        <div className="atelier-pill">
          <span className="w-2 h-2 rounded-full bg-[#B8934A]" aria-hidden="true" />
          <span className="font-ui text-[12px] tracking-[0.2em]">Visit or Write</span>
        </div>
        <h1 className="font-small-caps text-4xl sm:text-5xl font-bold mt-4 text-[#0F3720] dark:text-[#F7F3EA]">
          Contact the Atelier
        </h1>
        <div className="w-24 h-[3px] bg-[#B8934A] mt-4" />
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Form */}
        <div className="lg:col-span-6 atelier-card p-7 sm:p-8">
          <h2 className="font-small-caps text-2xl font-bold mb-5 text-[#0F3720] dark:text-[#F7F3EA]">
            Send an Inquiry
          </h2>
          {sent ? (
            <div className="p-6 rounded-[12px] bg-[#EDEFE6] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]">
              <p className="font-display text-2xl font-bold text-[#0F3720] dark:text-[#D9C08A]">
                Received — Thank You
              </p>
              <p className="text-base mt-2 text-[#2E3F34] dark:text-[#F7F3EA]/85">
                Our Bandra studio team will reply on WhatsApp or email within business hours.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-5 atelier-btn-secondary px-5 font-ui text-[12px] tracking-[0.18em] cursor-pointer"
              >
                Send Another Note
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="c-name" className="block font-ui text-[12px] tracking-[0.18em] mb-1.5 text-[#0F3720] dark:text-[#D9C08A]">
                  Name *
                </label>
                <input
                  id="c-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full min-h-[46px] rounded-[8px] px-3.5 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="c-phone" className="block font-ui text-[12px] tracking-[0.18em] mb-1.5 text-[#0F3720] dark:text-[#D9C08A]">
                    Phone / WhatsApp
                  </label>
                  <input
                    id="c-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full min-h-[46px] rounded-[8px] px-3.5 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="c-email" className="block font-ui text-[12px] tracking-[0.18em] mb-1.5 text-[#0F3720] dark:text-[#D9C08A]">
                    Email
                  </label>
                  <input
                    id="c-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full min-h-[46px] rounded-[8px] px-3.5 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="c-msg" className="block font-ui text-[12px] tracking-[0.18em] mb-1.5 text-[#0F3720] dark:text-[#D9C08A]">
                  Message *
                </label>
                <textarea
                  id="c-msg"
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Sizing question, custom drop inquiry, or streak card support..."
                  className="w-full rounded-[8px] p-3.5 bg-[#F7F3EA] dark:bg-[#081E12] border border-[#D7DBCB] dark:border-[#B8934A]/65 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full atelier-btn-primary font-ui text-[13px] tracking-[0.2em] cursor-pointer dark:bg-[#B8934A] dark:text-[#0F3720]"
              >
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>

        {/* Store Details + Map + QR */}
        <div className="lg:col-span-6 space-y-6">
          <div className="relative bg-[#0F3720] text-[#F7F3EA] rounded-[16px] p-8 flex flex-col sm:flex-row justify-between gap-6 items-start overflow-hidden shadow-[0_18px_40px_rgba(15,55,32,0.16)]">
            <div
              className="pointer-events-none absolute inset-4 rounded-[10px] border border-[#B8934A]/65"
              aria-hidden="true"
            />
            <div className="relative z-10 space-y-3">
              <h2 className="font-small-caps text-2xl font-bold text-[#F7F3EA]">
                Flagship Boutique
              </h2>
              <p className="flex items-start gap-2.5 text-sm text-[#F7F3EA]/90">
                <MapPin className="w-4 h-4 text-[#D9C08A] shrink-0 mt-1" />
                <span>{STORE_INFO.address}</span>
              </p>
              <p className="flex items-center gap-2.5 text-sm text-[#F7F3EA]/90 tabular-nums">
                <Phone className="w-4 h-4 text-[#D9C08A] shrink-0" />
                <span>{STORE_INFO.phone}</span>
              </p>
              <p className="text-xs text-[#D9C08A]">
                {STORE_INFO.hours}
              </p>

              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href={buildWhatsAppUrl("Hey Daddy's Hook! Reaching out from Contact page.")}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[44px] rounded-[8px] px-4 bg-[#B8934A] text-[#0F3720] hover:bg-[#D9C08A] hover:-translate-y-0.5 transition-all duration-500 ease-out font-ui text-[12px] tracking-[0.18em] inline-flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
                <a
                  href={STORE_INFO.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[44px] rounded-[8px] px-4 bg-[#1F4A32] border border-[#B8934A] text-[#D9C08A] font-ui text-[12px] tracking-[0.18em] inline-flex items-center gap-2 hover:bg-[#B8934A] hover:text-[#0F3720] transition-colors duration-500 ease-out"
                >
                  <Instagram className="w-4 h-4" />
                  {STORE_INFO.instagram}
                </a>
              </div>
            </div>

            <div className="relative z-10 shrink-0">
              <LocationQRCode size={108} />
            </div>
          </div>

          <div className="h-72 rounded-[12px] border border-[#E3DCCB] dark:border-[#B8934A] overflow-hidden bg-[#EDEFE6]">
            <iframe
              title="Daddy's Hook Bandra Boutique Map"
              src={STORE_INFO.mapEmbedUrl}
              className="w-full h-full border-0"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

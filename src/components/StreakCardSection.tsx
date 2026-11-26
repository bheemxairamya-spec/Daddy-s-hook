import { useState } from 'react';
import { Award, Check, Search } from 'lucide-react';
import type { StreakCard } from '../types';
import { buildWhatsAppUrl } from '../lib/constants';
import { SCROLL_REVEAL } from '../lib/animations';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll';

export function StreakCardSection() {
  const [phone, setPhone] = useState('');
  const [card, setCard] = useState<StreakCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkedNew, setCheckedNew] = useState(false);
  const { ref: sectionRef, visible: inView } = useRevealOnScroll<HTMLElement>(0.2);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setCheckedNew(false);
    try {
      const res = await fetch(`/api/streak/${encodeURIComponent(phone.trim())}`);
      const data = (await res.json()) as {
        streakCard?: StreakCard;
        isNew?: boolean;
        error?: string;
      };
      if (!res.ok || !data.streakCard) {
        setError(data.error || 'Could not look up that phone number.');
        setCard(null);
      } else {
        setCard(data.streakCard);
        setCheckedNew(Boolean(data.isNew));
      }
    } catch {
      setError('Network error while checking streak card.');
    } finally {
      setLoading(false);
    }
  };

  const activeStamps = card ? card.stamps : 0;

  return (
    <section
      id="streak-card"
      ref={sectionRef}
      className="bg-[#0F3720] text-[#F7F3EA] py-24 lg:py-[112px] px-4 sm:px-8 border-y border-[#B8934A]/60"
    >
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Copy & Phone Lookup */}
        <div className="lg:col-span-5">
          <span className="inline-flex items-center gap-2.5 rounded-full bg-[#1F4A32] border border-[#B8934A]/55 px-4 py-1.5 font-ui text-[13px] tracking-[0.22em] text-[#D9C08A]">
            <span className="w-2 h-2 rounded-full bg-[#B8934A]" aria-hidden="true" />
            Member Loyalty
          </span>

          <h2 className="font-small-caps text-4xl sm:text-5xl font-bold text-[#F7F3EA] mt-5 text-balance">
            Complete the Streak. The Prize Is Waiting.
          </h2>
          <div className="w-24 h-[3px] bg-[#B8934A] my-6" />
          <p className="text-base sm:text-[18px] text-[#F7F3EA]/85 leading-[1.6]">
            Every drop order or boutique pickup stamps your card. Collect 9 stamps and unlock a complimentary heavyweight tee on the 10th seal.
          </p>

          <form onSubmit={handleLookup} className="mt-7 flex flex-col sm:flex-row gap-3">
            <label htmlFor="streak-phone-input" className="sr-only">
              Enter 10-digit phone number
            </label>
            <input
              id="streak-phone-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter 10-digit mobile number"
              className="flex-1 min-h-[52px] rounded-[8px] px-4 bg-[#1F4A32] border border-[#B8934A]/70 text-base text-[#F7F3EA] placeholder:text-[#C2CCC2] tabular-nums"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="min-h-[52px] rounded-[8px] px-6 bg-[#B8934A] text-[#0F3720] hover:bg-[#D9C08A] hover:-translate-y-0.5 font-ui text-[13px] tracking-[0.2em] transition-all duration-500 ease-out inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Checking' : 'Check Stamps'}
            </button>
          </form>

          {error && <p className="mt-3 text-sm text-[#D9C08A] font-medium">{error}</p>}
          {card && (
            <p className="mt-3 text-sm text-[#D9C08A] font-medium tabular-nums">
              {checkedNew
                ? `No stamps yet for ${card.phone} — your first order automatically earns Stamp #1.`
                : `${card.customerName || card.phone}: ${card.stamps}/10 stamps active${
                    card.prizesClaimed > 0 ? ` · ${card.prizesClaimed} prize claimed` : ''
                  }.`}
            </p>
          )}

          <div className="mt-6">
            <a
              href={buildWhatsAppUrl(
                `Hey Daddy's Hook! Please set up my Streak Card${
                  phone ? ` for phone ${phone}` : ''
                }.`
              )}
              target="_blank"
              rel="noreferrer"
              className="min-h-[52px] rounded-[8px] px-7 bg-transparent border border-[#B8934A] text-[#F7F3EA] hover:bg-[#1F4A32] hover:-translate-y-0.5 font-ui text-[13px] tracking-[0.2em] inline-flex items-center justify-center transition-all duration-500 ease-out"
            >
              Ask for your streak card
            </a>
          </div>
        </div>

        {/* Right Ivory Stamp Card with Inner Gold Hairline Frame */}
        <div className="lg:col-span-7">
          <div className="relative bg-[#FFFDF8] text-[#2E3F34] rounded-[16px] shadow-[0_24px_48px_rgba(0,0,0,0.22)] p-8 sm:p-11">
            <div
              className="pointer-events-none absolute inset-4 rounded-[10px] border border-[#B8934A]/65"
              aria-hidden="true"
            />

            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#E3DCCB]">
                <div className="flex items-center gap-3">
                  <img
                    src="/assets/logo-green.png"
                    alt="Daddy's Hook Emblem"
                    className="w-11 h-11 object-contain"
                  />
                  <div>
                    <p className="font-display text-lg font-bold tracking-[0.1em] text-[#0F3720]">
                      DADDY&apos;S HOOK STREAK CARD
                    </p>
                    <p className="font-ui text-[12px] tracking-[0.18em] text-[#5E6B62]">
                      Stay Hooked, Homies!
                    </p>
                  </div>
                </div>
                <span className="font-ui text-[13px] tracking-[0.18em] text-[#0F3720] tabular-nums">
                  {activeStamps} / 10 Stamps
                </span>
              </div>

              {/* 10 Stamp Circles — sequential deep-green scroll fill + 2.4s gold PRIZE pulse */}
              <div className="grid grid-cols-5 gap-3 sm:gap-5 my-8">
                {Array.from({ length: 10 }).map((_, index) => {
                  const stampNum = index + 1;
                  const isPrizeSlot = stampNum === 10;
                  const isUserEarned = card ? stampNum <= activeStamps : false;
                  const isCascadeFilled = inView && !isPrizeSlot;

                  const circleColors = isPrizeSlot
                    ? 'bg-[#B8934A] border border-[#0F3720]/25 text-[#0F3720]'
                    : isCascadeFilled || isUserEarned
                      ? 'bg-[#0F3720] border border-[#B8934A] text-[#D9C08A]'
                      : 'bg-[#EDEFE6] border border-[#D7DBCB] text-[#5E6B62]';

                  return (
                    <div
                      key={stampNum}
                      style={{
                        transitionDelay: `${index * SCROLL_REVEAL.streakStampStepDelayMs}ms`,
                      }}
                      className={`relative aspect-square rounded-full flex flex-col items-center justify-center transition-[background-color,border-color,color,transform] duration-500 ease-out ${
                        inView ? 'scale-100' : 'scale-95'
                      } ${circleColors}`}
                      aria-label={
                        isPrizeSlot
                          ? `Stamp 10: Prize ${isUserEarned ? 'Unlocked' : 'Waiting'}`
                          : `Stamp ${stampNum}: ${isUserEarned ? 'Earned' : 'Ready'}`
                      }
                    >
                      {isPrizeSlot && inView && (
                        <span
                          aria-hidden="true"
                          style={{
                            animationDuration: `${SCROLL_REVEAL.prizePulseDurationMs}ms`,
                            animationDelay: `${9 * SCROLL_REVEAL.streakStampStepDelayMs}ms`,
                          }}
                          className="pointer-events-none absolute -inset-1.5 rounded-full border-2 border-[#B8934A] animate-dh-prize-ring"
                        />
                      )}

                      {isPrizeSlot ? (
                        <>
                          <Award className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5" />
                          <span className="font-ui text-[11px] sm:text-xs font-bold tracking-[0.16em]">
                            PRIZE
                          </span>
                        </>
                      ) : isUserEarned ? (
                        <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                      ) : (
                        <span className="font-display text-sm sm:text-base font-semibold tabular-nums">
                          {String(stampNum).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-[#E3DCCB] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-[#5E6B62]">
                <span>10th Stamp Prize: Complimentary Heavyweight Drop Tee</span>
                <span className="font-semibold text-[#0F3720]">
                  {activeStamps >= 10
                    ? 'Prize Ready — Redeem at Checkout or In-Store'
                    : 'Every order earns +1 automatic stamp'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

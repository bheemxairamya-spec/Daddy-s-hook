import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Instagram,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import type { CSSProperties, KeyboardEvent, PointerEvent, ReactNode } from 'react';
import type { Product } from '../types';
import {
  MEN_SUBCATEGORIES,
  WOMEN_SUBCATEGORIES,
  buildWhatsAppUrl,
  formatINR,
} from '../lib/constants';
import {
  AMBIENT_DUST,
  HERO_MOTION,
  HOOK_PLAY,
  PARTICLE_COLORS,
} from '../lib/animations';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll';
import { ProductCard } from '../components/ProductCard';
import { StreakCardSection } from '../components/StreakCardSection';
import { useStore } from '../context/StoreContext';

interface BurstParticle {
  id: number;
  size: number;
  tx: number;
  ty: number;
  delayMs: number;
}

interface AmbientDustSpec {
  id: number;
  leftPct: number;
  topPct: number;
  sizePx: number;
  durationMs: number;
  delayMs: number;
  driftXPx: number;
}

function deterministicUnit(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function createBurstParticles(batchSeed: number): BurstParticle[] {
  const count = HOOK_PLAY.burstParticleCount;
  return Array.from({ length: count }, (_, idx) => {
    const angle =
      (idx / count) * Math.PI * 2 + (deterministicUnit(batchSeed + idx * 3) - 0.5) * 0.45;
    const radius =
      HOOK_PLAY.burstMinRadiusPx +
      deterministicUnit(batchSeed + idx * 7 + 1) *
        (HOOK_PLAY.burstMaxRadiusPx - HOOK_PLAY.burstMinRadiusPx);
    const size =
      HOOK_PLAY.burstMinSizePx +
      deterministicUnit(batchSeed + idx * 11 + 2) *
        (HOOK_PLAY.burstMaxSizePx - HOOK_PLAY.burstMinSizePx);
    const delayMs =
      HOOK_PLAY.burstMinDelayMs +
      deterministicUnit(batchSeed + idx * 13 + 3) *
        (HOOK_PLAY.burstMaxDelayMs - HOOK_PLAY.burstMinDelayMs);

    return {
      id: idx,
      size: Number(size.toFixed(1)),
      tx: Number((Math.cos(angle) * radius).toFixed(1)),
      ty: Number((Math.sin(angle) * radius).toFixed(1)),
      delayMs: Math.round(delayMs),
    };
  });
}

function RevealBlock({
  children,
  className = '',
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const { ref, visible } = useRevealOnScroll<HTMLDivElement>(0.12);
  return (
    <div
      ref={ref}
      data-visible={visible ? 'true' : 'false'}
      style={delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={`dh-scroll-reveal ${className}`}
    >
      {children}
    </div>
  );
}

export function HomePage() {
  const { addToCart } = useStore();
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Interactive Hanging Gold Hook state
  const hookButtonRef = useRef<HTMLButtonElement>(null);
  const pointerStateRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startClientY: number;
    scaleY: number;
    didDrag: boolean;
    triggeredOnDrag: boolean;
  }>({
    active: false,
    pointerId: null,
    startClientY: 0,
    scaleY: 1,
    didDrag: false,
    triggeredOnDrag: false,
  });
  const burstTimeoutRef = useRef<number | null>(null);

  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isDraggingHook, setIsDraggingHook] = useState(false);
  const [isSpringingBack, setIsSpringingBack] = useState(false);
  const [burstActive, setBurstActive] = useState(false);
  const [burstBatchId, setBurstBatchId] = useState(0);
  const [burstParticles, setBurstParticles] = useState<BurstParticle[]>([]);

  const ambientDust = useMemo<AmbientDustSpec[]>(() => {
    return Array.from({ length: AMBIENT_DUST.particleCount }, (_, idx) => {
      const size =
        AMBIENT_DUST.minSizePx +
        deterministicUnit(idx * 5 + 1) *
          (AMBIENT_DUST.maxSizePx - AMBIENT_DUST.minSizePx);
      const durationMs =
        AMBIENT_DUST.minDurationMs +
        deterministicUnit(idx * 9 + 2) *
          (AMBIENT_DUST.maxDurationMs - AMBIENT_DUST.minDurationMs);
      const driftXPx =
        (deterministicUnit(idx * 15 + 3) * 2 - 1) * AMBIENT_DUST.maxDriftXPx;
      const delayMs = -Math.round(deterministicUnit(idx * 19 + 4) * durationMs);
      const leftPct = 4 + deterministicUnit(idx * 23 + 5) * 92;
      const topPct = 14 + deterministicUnit(idx * 29 + 6) * 76;

      return {
        id: idx,
        leftPct: Number(leftPct.toFixed(1)),
        topPct: Number(topPct.toFixed(1)),
        sizePx: Number(size.toFixed(1)),
        durationMs: Math.round(durationMs),
        delayMs,
        driftXPx: Number(driftXPx.toFixed(1)),
      };
    });
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch('/api/products?newArrival=true').then((r) => r.json()),
      fetch('/api/products?featured=true').then((r) => r.json()),
    ])
      .then(([newRes, featRes]: [{ products?: Product[] }, { products?: Product[] }]) => {
        if (!active) return;
        setNewArrivals((newRes.products || []).slice(0, 8));
        setFeatured((featRes.products || []).slice(0, 6));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (burstTimeoutRef.current !== null) {
        window.clearTimeout(burstTimeoutRef.current);
      }
    };
  }, []);

  const triggerHookMagic = () => {
    if (burstActive) return;

    const nextBatch = burstBatchId + 1;
    setBurstBatchId(nextBatch);
    setBurstParticles(createBurstParticles(nextBatch * 31));
    setBurstActive(true);

    if (burstTimeoutRef.current !== null) {
      window.clearTimeout(burstTimeoutRef.current);
    }
    const totalMs = HOOK_PLAY.burstDurationMs + HOOK_PLAY.burstMaxDelayMs + 80;
    burstTimeoutRef.current = window.setTimeout(() => {
      setBurstActive(false);
      setBurstParticles([]);
      burstTimeoutRef.current = null;
    }, totalMs);
  };

  const releaseHookWithSpring = () => {
    setIsDraggingHook(false);
    setIsSpringingBack(true);
    setDragOffsetPx(0);
    window.setTimeout(() => {
      setIsSpringingBack(false);
    }, HOOK_PLAY.springBackDurationMs);
  };

  const handleHookPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const el = hookButtonRef.current;
    let scaleY = 1;
    if (el && el.offsetHeight > 0) {
      const rect = el.getBoundingClientRect();
      scaleY = rect.height / el.offsetHeight || 1;
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture is unavailable
    }

    pointerStateRef.current = {
      active: true,
      pointerId: e.pointerId,
      startClientY: e.clientY,
      scaleY,
      didDrag: false,
      triggeredOnDrag: false,
    };

    setIsSpringingBack(false);
    setIsDraggingHook(true);
  };

  const handleHookPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const state = pointerStateRef.current;
    if (!state.active || state.pointerId !== e.pointerId) return;

    const rawDelta = (e.clientY - state.startClientY) / state.scaleY;
    if (Math.abs(rawDelta) > 6) {
      state.didDrag = true;
    }

    const clamped = Math.max(0, Math.min(HOOK_PLAY.maxDragPx, rawDelta));
    setDragOffsetPx(clamped);

    if (clamped >= HOOK_PLAY.dragTriggerPx && !state.triggeredOnDrag) {
      state.triggeredOnDrag = true;
      triggerHookMagic();
    }
  };

  const handleHookPointerEnd = (e: PointerEvent<HTMLButtonElement>) => {
    const state = pointerStateRef.current;
    if (!state.active || state.pointerId !== e.pointerId) return;

    state.active = false;
    state.pointerId = null;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore release errors
    }

    releaseHookWithSpring();
  };

  const handleHookClick = () => {
    // Prevent click from double-firing right after a pointer drag gesture
    if (pointerStateRef.current.didDrag) {
      pointerStateRef.current.didDrag = false;
      return;
    }
    triggerHookMagic();
  };

  const handleHookKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      triggerHookMagic();
    }
  };

  const scrollCarousel = (dir: -1 | 1) => {
    if (!carouselRef.current) return;
    carouselRef.current.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  const flagshipProduct = featured[0] || newArrivals[0] || null;
  const flagshipTitle = flagshipProduct?.name || "Daddy's Hook";
  const flagshipPrice = flagshipProduct?.price ?? null;

  const handleQuickAddFlagship = (sourceEl: HTMLElement) => {
    if (!flagshipProduct) return;
    const size = flagshipProduct.sizes.includes('L')
      ? 'L'
      : flagshipProduct.sizes[0] || 'L';
    const color = flagshipProduct.colors[0] || 'Forest Green';
    addToCart(flagshipProduct, size, color, 1, sourceEl);
  };

  const marqueeItems = [
    'NEW DROPS',
    'ACID WASH',
    'OVERSIZED',
    'BAGGY FIT',
    'OPTIC WASH',
    'HEAVYWEIGHT 280 GSM',
  ];

  const baseCordHeightPx = 92;
  const currentCordHeightPx = baseCordHeightPx + dragOffsetPx;

  return (
    <div className="bg-[#F7F3EA] dark:bg-[#081E12]">
      {/* 1. HOME HERO (55/45 Two Columns — Zero Blocking, Overflow Visible for Hook & Dust) */}
      <section className="relative overflow-visible py-16 sm:py-24 lg:py-[104px] px-4 sm:px-8 bg-[#F7F3EA] dark:bg-[#081E12]">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-12 lg:gap-14 items-center">
          {/* Left Typography & CTAs — Coordinated ~2s Page-Load Sequence */}
          <div>
            <div
              className="atelier-pill animate-dh-fade-up"
              style={{ animationDuration: `${HERO_MOTION.sequenceDurationMs}ms`, animationDelay: '0ms' }}
            >
              <span className="w-2 h-2 rounded-full bg-[#B8934A]" aria-hidden="true" />
              <span className="font-ui text-[13px] tracking-[0.22em]">
                Stay Hooked, Homies!
              </span>
            </div>

            <h1 className="font-small-caps text-[56px] sm:text-[76px] xl:text-[96px] font-bold leading-[0.95] text-[#0F3720] dark:text-[#F7F3EA] mt-6">
              <span className="block overflow-hidden">
                <span
                  className="block animate-dh-line-rise"
                  style={{
                    animationDuration: `${HERO_MOTION.headlineDurationMs}ms`,
                    animationDelay: '0ms',
                  }}
                >
                  Hooked on
                </span>
              </span>
              <span className="block overflow-hidden">
                <span
                  className="block animate-dh-line-rise"
                  style={{
                    animationDuration: `${HERO_MOTION.headlineDurationMs}ms`,
                    animationDelay: `${HERO_MOTION.headlineStaggerMs}ms`,
                  }}
                >
                  Style.
                </span>
              </span>
            </h1>

            <p
              className="font-display italic font-medium text-[46px] sm:text-[66px] xl:text-[84px] leading-[0.98] text-[#B8934A] dark:text-[#D9C08A] mt-3 animate-dh-fade-up"
              style={{
                animationDuration: `${HERO_MOTION.sequenceDurationMs}ms`,
                animationDelay: '450ms',
              }}
            >
              Stay hooked, homies.
            </p>

            {/* Animated Stitched Gold Thread Line (150px wide, 3px tall, 10px on / 6px off) */}
            <div className="mt-5 animate-dh-stitch-draw" aria-hidden="true">
              <svg
                width={HERO_MOTION.stitchLineWidthPx}
                height={HERO_MOTION.stitchLineHeightPx}
                viewBox={`0 0 ${HERO_MOTION.stitchLineWidthPx} ${HERO_MOTION.stitchLineHeightPx}`}
                fill="none"
              >
                <line
                  x1="0"
                  y1={HERO_MOTION.stitchLineHeightPx / 2}
                  x2={HERO_MOTION.stitchLineWidthPx}
                  y2={HERO_MOTION.stitchLineHeightPx / 2}
                  stroke="#B8934A"
                  strokeWidth={HERO_MOTION.stitchLineHeightPx}
                  strokeDasharray={`${HERO_MOTION.stitchDashOnPx} ${HERO_MOTION.stitchDashOffPx}`}
                  strokeLinecap="butt"
                />
              </svg>
            </div>

            <p
              className="text-[18px] leading-[1.6] text-[#2E3F34] dark:text-[#F7F3EA]/85 max-w-xl mt-6 animate-dh-fade-up"
              style={{
                animationDuration: `${HERO_MOTION.sequenceDurationMs}ms`,
                animationDelay: '750ms',
              }}
            >
              Complete the streak. The prize is waiting. Cut from 280 GSM long-staple organic combed cotton with tailored drop shoulders and small-batch mineral washes.
            </p>

            <div
              className="mt-9 flex flex-wrap items-center gap-4 animate-dh-fade-up"
              style={{
                animationDuration: `${HERO_MOTION.sequenceDurationMs}ms`,
                animationDelay: '1050ms',
              }}
            >
              <Link
                to="/shop"
                className="atelier-btn-primary px-8 font-ui text-[13px] tracking-[0.2em] inline-flex items-center gap-2.5 dark:bg-[#B8934A] dark:text-[#0F3720] dark:hover:bg-[#D9C08A]"
              >
                Shop the Collection
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/shop?newArrival=true"
                className="atelier-btn-secondary px-7 font-ui text-[13px] tracking-[0.2em] inline-flex items-center gap-2.5"
              >
                <Sparkles className="w-4 h-4 text-[#B8934A]" />
                Explore New Drops
              </Link>
            </div>
          </div>

          {/* Right Flagship Product Card (NO overflow-hidden so hanging hook and dust never clip!) */}
          <div className="relative overflow-visible">
            {/* Ambient Hero Dust — ~16 strictly round golden orbs drifting upward */}
            <div
              className="pointer-events-none absolute -inset-6 z-0 overflow-visible"
              aria-hidden="true"
            >
              {ambientDust.map((orb) => (
                <span
                  key={orb.id}
                  style={
                    {
                      left: `${orb.leftPct}%`,
                      top: `${orb.topPct}%`,
                      width: `${orb.sizePx}px`,
                      height: `${orb.sizePx}px`,
                      background: `radial-gradient(circle, ${PARTICLE_COLORS.ivoryCore} 0%, ${PARTICLE_COLORS.goldMid} 65%, transparent 100%)`,
                      boxShadow: PARTICLE_COLORS.glowShadow,
                      '--dust-dx': `${orb.driftXPx}px`,
                      '--dust-dur': `${orb.durationMs}ms`,
                      '--dust-delay': `${orb.delayMs}ms`,
                    } as CSSProperties
                  }
                  className="absolute rounded-full animate-dh-ambient-dust"
                />
              ))}
            </div>

            {/* Interactive Hanging Gold Fish Hook (drops from above right side toward awning) */}
            <div
              className="pointer-events-none absolute -top-14 sm:-top-20 right-7 sm:right-10 z-30 flex flex-col items-center"
            >
              <div
                className={isDraggingHook ? '' : 'animate-dh-hook-swing'}
                style={{ transformOrigin: 'top center' }}
              >
                {/* Thin Gold Suspension Cord */}
                <div
                  className="mx-auto w-[1.5px] bg-gradient-to-b from-[#B8934A] via-[#D9C08A] to-[#FFF6DE]"
                  style={{
                    height: `${currentCordHeightPx}px`,
                    transition: isSpringingBack
                      ? `height ${HOOK_PLAY.springBackDurationMs}ms ${HOOK_PLAY.springBackEasing}`
                      : undefined,
                  }}
                  aria-hidden="true"
                />

                {/* Accessible Gold Fish Hook Trigger */}
                <button
                  ref={hookButtonRef}
                  type="button"
                  onPointerDown={handleHookPointerDown}
                  onPointerMove={handleHookPointerMove}
                  onPointerUp={handleHookPointerEnd}
                  onPointerCancel={handleHookPointerEnd}
                  onClick={handleHookClick}
                  onKeyDown={handleHookKeyDown}
                  aria-label="Pull the gold hook for a little magic"
                  title="Pull or click the gold hook"
                  style={{ touchAction: 'none' }}
                  className="pointer-events-auto relative -mt-1 flex flex-col items-center justify-center w-12 h-14 rounded-full cursor-grab active:cursor-grabbing focus-visible:outline-[3px] focus-visible:outline-[#B8934A] focus-visible:outline-offset-2 group/hook"
                >
                  <svg
                    width="34"
                    height="46"
                    viewBox="0 0 34 46"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-[0_6px_12px_rgba(184,147,74,0.55)] transition-transform duration-300 group-hover/hook:scale-110"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="dh-gold-hook-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FFF6DE" />
                        <stop offset="50%" stopColor="#D9C08A" />
                        <stop offset="100%" stopColor="#B8934A" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="19"
                      cy="6"
                      r="3.8"
                      stroke="url(#dh-gold-hook-grad)"
                      strokeWidth="2.2"
                      fill="#0F3720"
                    />
                    <path
                      d="M19 10 V31 C19 37.8 10 40.5 6 35.5 C3.5 32.2 4 27 8.5 23 L12.5 26.5"
                      stroke="url(#dh-gold-hook-grad)"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Deep Forest Green Flagship Card */}
            <div className="group relative bg-[#0F3720] text-[#F7F3EA] rounded-[16px] shadow-[0_24px_56px_rgba(15,55,32,0.24)] p-8 sm:p-11 flex flex-col items-center justify-between min-h-[500px] sm:min-h-[540px] overflow-visible transition-transform duration-700 ease-out hover:-translate-y-1">
              {/* Clipped subtle grain backdrop inside rounded corners */}
              <div
                className="pointer-events-none absolute inset-0 rounded-[16px] overflow-hidden"
                aria-hidden="true"
              >
                <div className="fabric-grain absolute inset-0" />
              </div>

              {/* Animated Inner 1px Gold Hairline Border (pathLength=1 SVG stroke-dashoffset, 2.2s) */}
              <svg
                className="pointer-events-none absolute inset-4 w-[calc(100%-32px)] h-[calc(100%-32px)] overflow-visible"
                aria-hidden="true"
              >
                <rect
                  x="0.5"
                  y="0.5"
                  width="99.6%"
                  height="99.6%"
                  rx="10"
                  pathLength={1}
                  stroke="#B8934A"
                  strokeOpacity="0.72"
                  strokeWidth="1"
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                  className="animate-dh-border-draw"
                />
              </svg>

              {/* Top Label */}
              <div className="relative z-10 w-full flex flex-col items-center gap-1.5 pr-8 sm:pr-0">
                <p className="font-ui text-[12px] tracking-[0.24em] text-[#D9C08A] text-center">
                  Signature Flagship Piece
                </p>
                <p className="font-ui text-[11px] tracking-[0.2em] text-[#FFF6DE]/80 text-center">
                  TIP: PULL THE GOLD HOOK
                </p>
              </div>

              {/* Centered Floating Deep-Green T-Shirt Illustration + Magic Burst Overlay */}
              <div className="relative z-20 flex flex-col items-center my-6 overflow-visible">
                {/* Soft Radial Gold Halo on Hook Pull */}
                {burstActive && (
                  <div
                    key={`halo-${burstBatchId}`}
                    aria-hidden="true"
                    style={{
                      background: `radial-gradient(circle, ${PARTICLE_COLORS.haloGlow} 0%, rgba(217,192,138,0.16) 45%, transparent 72%)`,
                    }}
                    className="pointer-events-none absolute -inset-12 rounded-full animate-dh-magic-glow"
                  />
                )}

                {/* ~22 Round Glowing Golden Particles Shooting Outward */}
                {burstActive && (
                  <div
                    key={`burst-${burstBatchId}`}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 overflow-visible"
                  >
                    {burstParticles.map((p) => (
                      <span
                        key={p.id}
                        style={
                          {
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            marginLeft: `${-p.size / 2}px`,
                            marginTop: `${-p.size / 2}px`,
                            background: `radial-gradient(circle, ${PARTICLE_COLORS.ivoryCore} 0%, ${PARTICLE_COLORS.goldMid} 60%, transparent 100%)`,
                            boxShadow: PARTICLE_COLORS.glowShadow,
                            '--burst-tx': `${p.tx}px`,
                            '--burst-ty': `${p.ty}px`,
                            '--burst-delay': `${p.delayMs}ms`,
                          } as CSSProperties
                        }
                        className="absolute top-0 left-0 rounded-full animate-dh-magic-burst"
                      />
                    ))}
                  </div>
                )}

                <div className="w-56 sm:w-64 animate-dh-shirt-float">
                  <svg
                    viewBox="0 0 260 235"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-auto drop-shadow-[0_14px_24px_rgba(0,0,0,0.35)]"
                    role="img"
                    aria-label="Signature heavyweight forest green tee illustration with embroidered gold hook crest"
                  >
                    {/* Main Heavyweight Tee Silhouette */}
                    <path
                      d="M92 22 C104 34 156 34 168 22 L202 32 L248 76 L220 112 L195 94 L195 214 L65 214 L65 94 L40 112 L12 76 L58 32 L92 22 Z"
                      fill="#15472A"
                      stroke="#B8934A"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    {/* Ribbed Crew Collar */}
                    <path
                      d="M92 22 C106 43 154 43 168 22"
                      stroke="#B8934A"
                      strokeWidth="1.4"
                      fill="none"
                    />
                    <path
                      d="M98 25 C110 38 150 38 162 25"
                      stroke="#D9C08A"
                      strokeWidth="0.7"
                      strokeOpacity="0.65"
                      fill="none"
                    />
                    {/* Subtle Shoulder & Sleeve Seam Lines */}
                    <line
                      x1="65"
                      y1="94"
                      x2="70"
                      y2="35"
                      stroke="#B8934A"
                      strokeWidth="0.8"
                      strokeOpacity="0.55"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="195"
                      y1="94"
                      x2="190"
                      y2="35"
                      stroke="#B8934A"
                      strokeWidth="0.8"
                      strokeOpacity="0.55"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1="65"
                      y1="204"
                      x2="195"
                      y2="204"
                      stroke="#B8934A"
                      strokeWidth="0.8"
                      strokeOpacity="0.5"
                      strokeDasharray="3 3"
                    />
                    {/* Left Chest Embroidered Hook Crest */}
                    <g transform="translate(152, 74)">
                      <path
                        d="M11 2 C14.5 2 16 5.5 13 8 L11 10 L11 23 C11 27.5 6 29.5 3 26.5 C1.5 25 1.5 22.5 3 20.5 L5.5 22"
                        stroke="#D9C08A"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                      <circle cx="11" cy="4.5" r="2" stroke="#D9C08A" strokeWidth="1.2" fill="none" />
                    </g>
                  </svg>
                </div>

                {/* Soft Ground Shadow */}
                <div
                  className="mt-2 w-44 h-4 rounded-full bg-black/40 blur-md"
                  aria-hidden="true"
                />
              </div>

              {/* Bottom Product Name, Italic Subtitle, Price & Quick Add */}
              <div className="relative z-10 w-full text-center space-y-2">
                <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-[0.16em] uppercase text-[#F7F3EA]">
                  {flagshipTitle}
                </h2>
                <p className="font-display italic text-base sm:text-lg text-[#D9C08A]">
                  {flagshipProduct
                    ? `${flagshipProduct.subcategory} · ${flagshipProduct.colors.slice(0, 2).join(' / ')}`
                    : 'New drop landing soon'}
                </p>

                <div className="pt-4 mt-4 border-t border-[#B8934A]/35 flex flex-wrap items-center justify-center sm:justify-between gap-4">
                  {flagshipProduct && flagshipPrice !== null ? (
                    <>
                      <span className="font-display text-2xl sm:text-3xl font-semibold tabular-nums text-[#D9C08A]">
                        {formatINR(flagshipPrice)}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => handleQuickAddFlagship(e.currentTarget)}
                        className="min-h-[44px] px-5 rounded-[8px] bg-[#FFFDF8] text-[#0F3720] hover:bg-[#EDEFE6] hover:-translate-y-0.5 transition-all duration-450 ease-out font-ui text-[12px] tracking-[0.18em] cursor-pointer"
                      >
                        + Quick Add
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/shop"
                      className="min-h-[44px] px-5 rounded-[8px] bg-[#FFFDF8] text-[#0F3720] inline-flex items-center font-ui text-[12px] tracking-[0.18em]"
                    >
                      Visit The Shop
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MARQUEE STRIP */}
      <div className="bg-[#0F3720] text-[#F7F3EA] border-y border-[#B8934A]/55 py-4 overflow-hidden select-none">
        <div className="animate-dh-marquee">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center gap-8 pr-8">
              {marqueeItems.map((label, idx) => (
                <span
                  key={`${dup}-${idx}`}
                  className="inline-flex items-center gap-8 font-ui text-[13px] tracking-[0.24em] whitespace-nowrap text-[#F7F3EA]"
                >
                  <span>{label}</span>
                  <span aria-hidden="true" className="text-[#B8934A]">
                    •
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 3. TWO BIG CATEGORY PANELS: FOR MEN & FOR WOMEN */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-8 py-24 lg:py-[112px]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* FOR MEN — Deep Forest Green Panel with Inner Gold Hairline Frame */}
          <RevealBlock>
            <div className="atelier-hover-lift group relative h-full bg-[#0F3720] text-[#F7F3EA] rounded-[16px] shadow-[0_18px_40px_rgba(15,55,32,0.16)] p-8 sm:p-11 flex flex-col justify-between overflow-hidden">
              <div
                className="pointer-events-none absolute inset-4 rounded-[10px] border border-[#B8934A]/65"
                aria-hidden="true"
              />
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-ui text-[13px] tracking-[0.22em] text-[#D9C08A]">
                    Menswear Atelier
                  </span>
                  <img
                    src="/assets/logo-white.png"
                    alt=""
                    aria-hidden="true"
                    className="w-8 h-8 object-contain opacity-85"
                  />
                </div>

                <h2 className="font-small-caps text-4xl sm:text-5xl font-bold mt-4 text-[#F7F3EA]">
                  For Men
                </h2>
                <div className="w-24 h-[3px] bg-[#B8934A] my-4" />
                <p className="text-base text-[#F7F3EA]/80 max-w-md leading-[1.6]">
                  Acid wash, optic wash, structured pique polos, 5-sleeve silhouettes, and tailored baggy track trousers.
                </p>

                {/* Subcategory Interactive Filter Links */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {MEN_SUBCATEGORIES.map((sub) => (
                    <Link
                      key={sub}
                      to={`/shop?category=men&subcategory=${encodeURIComponent(sub)}`}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-[8px] border border-[#B8934A]/55 bg-[#1F4A32]/75 text-sm font-medium text-[#F7F3EA] hover:bg-[#B8934A] hover:text-[#0F3720] hover:border-[#B8934A] transition-colors duration-450 ease-out inline-flex items-center"
                    >
                      {sub}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="relative z-10 mt-8 pt-6 border-t border-[#B8934A]/35 flex items-center justify-between">
                <Link
                  to="/shop?category=men"
                  className="min-h-[44px] inline-flex items-center gap-2 font-ui text-[13px] tracking-[0.2em] text-[#D9C08A] hover:text-[#F7F3EA] transition-colors duration-450"
                >
                  Browse Men&apos;s Drop
                  <ArrowRight className="w-4 h-4 transition-transform duration-450 group-hover:translate-x-1" />
                </Link>
                <span className="font-ui text-[12px] tracking-[0.18em] text-[#D9C08A]/85 tabular-nums">
                  7 Fits
                </span>
              </div>
            </div>
          </RevealBlock>

          {/* FOR WOMEN — Ivory Card with Green Border */}
          <RevealBlock delayMs={120}>
            <div className="atelier-hover-lift group h-full bg-[#FFFDF8] dark:bg-[#0F3720] text-[#0F3720] dark:text-[#F7F3EA] rounded-[16px] border-2 border-[#0F3720] dark:border-[#B8934A] p-8 sm:p-11 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <span className="atelier-pill">
                    <span className="w-2 h-2 rounded-full bg-[#B8934A]" aria-hidden="true" />
                    <span className="font-ui text-[12px] tracking-[0.2em]">Womenswear Studio</span>
                  </span>
                  <img
                    src="/assets/logo-green.png"
                    alt=""
                    aria-hidden="true"
                    className="w-8 h-8 object-contain opacity-85 dark:hidden"
                  />
                  <img
                    src="/assets/logo-white.png"
                    alt=""
                    aria-hidden="true"
                    className="w-8 h-8 object-contain opacity-85 hidden dark:block"
                  />
                </div>

                <h2 className="font-small-caps text-4xl sm:text-5xl font-bold mt-4 text-[#0F3720] dark:text-[#F7F3EA]">
                  For Women
                </h2>
                <div className="w-24 h-[3px] bg-[#B8934A] my-4" />
                <p className="text-base text-[#2E3F34] dark:text-[#F7F3EA]/85 max-w-md leading-[1.6]">
                  Sculpted ribbed tanks, cropped box tees, generous oversized drapes, and high-rise bottom baggy cuts.
                </p>

                {/* Subcategory Interactive Filter Links */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {WOMEN_SUBCATEGORIES.map((sub) => (
                    <Link
                      key={sub}
                      to={`/shop?category=women&subcategory=${encodeURIComponent(sub)}`}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-[8px] border border-[#D7DBCB] dark:border-[#B8934A]/65 bg-[#EDEFE6] dark:bg-[#1F4A32] text-sm font-medium text-[#0F3720] dark:text-[#F7F3EA] hover:bg-[#0F3720] hover:text-[#F7F3EA] dark:hover:bg-[#B8934A] dark:hover:text-[#0F3720] transition-colors duration-450 ease-out inline-flex items-center"
                    >
                      {sub}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#E3DCCB] dark:border-[#B8934A]/40 flex items-center justify-between">
                <Link
                  to="/shop?category=women"
                  className="min-h-[44px] inline-flex items-center gap-2 font-ui text-[13px] tracking-[0.2em] text-[#0F3720] dark:text-[#D9C08A] hover:underline"
                >
                  Browse Women&apos;s Drop
                  <ArrowRight className="w-4 h-4 transition-transform duration-450 group-hover:translate-x-1" />
                </Link>
                <span className="font-ui text-[12px] tracking-[0.18em] text-[#5E6B62] dark:text-[#D9C08A]/85 tabular-nums">
                  6 Fits
                </span>
              </div>
            </div>
          </RevealBlock>
        </div>
      </section>

      {/* 4. NEW ARRIVALS CAROUSEL & FEATURED PRODUCTS */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-8 pb-24 lg:pb-[112px]">
        {/* New Arrivals Carousel Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-[#E3DCCB] dark:border-[#B8934A]/40">
          <div>
            <div className="atelier-pill">
              <span className="w-2 h-2 rounded-full bg-[#B8934A]" aria-hidden="true" />
              <span className="font-ui text-[12px] tracking-[0.2em]">Fresh Off The Press</span>
            </div>
            <h2 className="font-small-caps text-4xl sm:text-5xl font-bold mt-4 text-[#0F3720] dark:text-[#F7F3EA]">
              New Arrivals
            </h2>
            <div className="w-24 h-[3px] bg-[#B8934A] mt-4" />
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => scrollCarousel(-1)}
              aria-label="Scroll new arrivals left"
              className="min-w-[44px] min-h-[44px] rounded-[8px] bg-[#FFFDF8] dark:bg-[#0F3720] border border-[#C4CABD] dark:border-[#B8934A] text-[#0F3720] dark:text-[#F7F3EA] flex items-center justify-center hover:bg-[#EDEFE6] dark:hover:bg-[#1F4A32] transition-colors duration-450 ease-out cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel(1)}
              aria-label="Scroll new arrivals right"
              className="min-w-[44px] min-h-[44px] rounded-[8px] bg-[#FFFDF8] dark:bg-[#0F3720] border border-[#C4CABD] dark:border-[#B8934A] text-[#0F3720] dark:text-[#F7F3EA] flex items-center justify-center hover:bg-[#EDEFE6] dark:hover:bg-[#1F4A32] transition-colors duration-450 ease-out cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Carousel */}
        <div
          ref={carouselRef}
          className="mt-10 flex gap-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scroll-smooth"
        >
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="min-w-[280px] sm:min-w-[310px] h-[390px] dh-skeleton"
                />
              ))
            : newArrivals.map((product, idx) => (
                <RevealBlock
                  key={product.id}
                  delayMs={Math.min(idx, 3) * 80}
                  className="min-w-[280px] sm:min-w-[310px] max-w-[320px] snap-start shrink-0"
                >
                  <ProductCard product={product} />
                </RevealBlock>
              ))}
        </div>

        {/* Featured Products Grid */}
        <div className="mt-24 lg:mt-[112px]">
          <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-[#E3DCCB] dark:border-[#B8934A]/40">
            <div>
              <div className="atelier-pill">
                <span className="w-2 h-2 rounded-full bg-[#B8934A]" aria-hidden="true" />
                <span className="font-ui text-[12px] tracking-[0.2em]">Curated Selection</span>
              </div>
              <h2 className="font-small-caps text-4xl sm:text-5xl font-bold mt-4 text-[#0F3720] dark:text-[#F7F3EA]">
                Featured Pieces
              </h2>
              <div className="w-24 h-[3px] bg-[#B8934A] mt-4" />
            </div>
            <Link
              to="/shop"
              className="min-h-[44px] inline-flex items-center gap-2 font-ui text-[13px] tracking-[0.2em] text-[#0F3720] dark:text-[#D9C08A] hover:underline"
            >
              View Full Catalog
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[400px] dh-skeleton"
                  />
                ))
              : featured.map((product, idx) => (
                  <RevealBlock key={product.id} delayMs={(idx % 3) * 90}>
                    <ProductCard product={product} />
                  </RevealBlock>
                ))}
          </div>
        </div>
      </section>

      {/* 5. WHY CHOOSE US — Quality, Fit, Fabric */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-8 pb-24 lg:pb-[112px]">
        <div className="pb-6 border-b border-[#E3DCCB] dark:border-[#B8934A]/40 mb-10">
          <div className="atelier-pill">
            <span className="w-2 h-2 rounded-full bg-[#B8934A]" aria-hidden="true" />
            <span className="font-ui text-[12px] tracking-[0.2em]">The Atelier Standard</span>
          </div>
          <h2 className="font-small-caps text-4xl sm:text-5xl font-bold mt-4 text-[#0F3720] dark:text-[#F7F3EA]">
            Why Choose Daddy&apos;s Hook
          </h2>
          <div className="w-24 h-[3px] bg-[#B8934A] mt-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {[
            {
              num: '01',
              title: 'Quality',
              body: 'Every tee passes a 14-point seam inspection with double-needle cover-stitching and high-recovery ribbed collars that never bacon or sag.',
            },
            {
              num: '02',
              title: 'Fit',
              body: 'Engineered in-house across 13 distinct men’s and women’s silhouettes—from architectural 5-sleeve drop shoulders to clean cropped ribs.',
            },
            {
              num: '03',
              title: 'Fabric',
              body: 'Long-staple 240 to 360 GSM combed organic cotton treated with enzyme and mineral washes for a soft, broken-in handfeel from day one.',
            },
          ].map((pillar, idx) => (
            <RevealBlock key={pillar.title} delayMs={idx * 100}>
              <div className="atelier-card atelier-hover-lift h-full p-8 flex flex-col justify-between">
                <div>
                  <span className="font-display text-3xl font-bold text-[#B8934A] dark:text-[#D9C08A] tabular-nums">
                    {pillar.num}
                  </span>
                  <h3 className="font-small-caps text-2xl font-bold mt-3 text-[#0F3720] dark:text-[#F7F3EA]">
                    {pillar.title}
                  </h3>
                  <div className="w-12 h-[2px] bg-[#B8934A] my-4" />
                  <p className="text-base text-[#2E3F34] dark:text-[#F7F3EA]/85 leading-[1.6]">
                    {pillar.body}
                  </p>
                </div>
              </div>
            </RevealBlock>
          ))}
        </div>
      </section>

      {/* 6. STREAK CARD SECTION */}
      <StreakCardSection />

      {/* 7. COMMUNITY & WHATSAPP / INSTAGRAM CTA */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-8 py-24 lg:py-[112px]">
        <RevealBlock>
          <div className="atelier-card p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="atelier-pill">
                <span className="w-2 h-2 rounded-full bg-[#B8934A]" aria-hidden="true" />
                <span className="font-ui text-[12px] tracking-[0.2em]">Bandra Studio &amp; Community</span>
              </div>
              <h2 className="font-small-caps text-4xl sm:text-5xl font-bold mt-4 text-[#0F3720] dark:text-[#F7F3EA]">
                Stay Hooked, Homies
              </h2>
              <div className="w-24 h-[3px] bg-[#B8934A] my-4" />
              <p className="text-base sm:text-[18px] text-[#2E3F34] dark:text-[#F7F3EA]/85 leading-[1.6]">
                Follow drop dispatches on Instagram or message our Bandra West atelier directly on WhatsApp for sizing help, boutique pickups, and Streak Card inquiries.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <a
                href="https://instagram.com/daddyshook"
                target="_blank"
                rel="noreferrer"
                className="atelier-btn-secondary px-6 font-ui text-[13px] tracking-[0.18em] inline-flex items-center gap-2"
              >
                <Instagram className="w-4 h-4 text-[#0F3720] dark:text-[#D9C08A]" />
                @daddyshook
              </a>
              <a
                href={buildWhatsAppUrl("Hey Daddy's Hook! Reaching out from the website.")}
                target="_blank"
                rel="noreferrer"
                className="atelier-btn-primary px-6 font-ui text-[13px] tracking-[0.18em] inline-flex items-center gap-2 dark:bg-[#B8934A] dark:text-[#0F3720] dark:hover:bg-[#D9C08A]"
              >
                <MessageCircle className="w-4 h-4" />
                Message Us
              </a>
            </div>
          </div>
        </RevealBlock>
      </section>
    </div>
  );
}

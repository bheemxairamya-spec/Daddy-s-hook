/**
 * Central motion and particle configuration for Daddy's Hook Atelier.
 * Adjust durations, particle counts, distances, and gold glow colors here.
 */

export const PARTICLE_COLORS = {
  ivoryCore: '#FFF6DE',
  goldMid: '#E8D29A',
  antiqueGold: '#B8934A',
  glowShadow: '0 0 10px rgba(217, 192, 138, 0.8)',
  haloGlow: 'rgba(217, 192, 138, 0.42)',
} as const;

export const HERO_MOTION = {
  headlineDurationMs: 900,
  headlineStaggerMs: 200,
  headlineEasing: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
  sequenceDurationMs: 800,
  stitchLineWidthPx: 150,
  stitchLineHeightPx: 3,
  stitchDashOnPx: 10,
  stitchDashOffPx: 6,
  stitchDrawDurationMs: 1200,
  stitchDrawDelayMs: 1200,
  cardBorderDrawDurationMs: 2200,
  shirtFloatDistancePx: 6,
  shirtFloatDurationMs: 5000,
} as const;

export const HOOK_PLAY = {
  swingAngleDeg: 2,
  swingDurationMs: 2200,
  dragTriggerPx: 40,
  maxDragPx: 88,
  springBackDurationMs: 650,
  springBackEasing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  burstParticleCount: 22,
  burstMinSizePx: 4,
  burstMaxSizePx: 10,
  burstDurationMs: 1800,
  burstMinDelayMs: 50,
  burstMaxDelayMs: 400,
  burstMinRadiusPx: 120,
  burstMaxRadiusPx: 270,
  burstGlowDurationMs: 1800,
} as const;

export const AMBIENT_DUST = {
  particleCount: 16,
  minSizePx: 3,
  maxSizePx: 6,
  minDurationMs: 6000,
  maxDurationMs: 11000,
  maxDriftXPx: 40,
} as const;

export const CART_FLY_PARTICLE = {
  durationMs: 750,
  sizePx: 12,
  arcLiftPx: 90,
  badgeBounceDurationMs: 450,
  badgeBouncePeakScale: 1.6,
} as const;

export const SCROLL_REVEAL = {
  offsetYPx: 26,
  durationMs: 650,
  easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
  streakStampStepDelayMs: 95,
  prizePulseDurationMs: 2400,
} as const;

/**
 * Spawns a glowing golden particle that arcs from the clicked button to the
 * header Bag icon over 0.75s, then removes itself from the DOM.
 */
export function spawnFlyToBagParticle(sourceEl?: HTMLElement | null): void {
  if (typeof window === 'undefined' || !sourceEl) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const bagTarget = document.querySelector<HTMLElement>('[data-cart-bag-target="true"]');
  if (!bagTarget) return;

  const startRect = sourceEl.getBoundingClientRect();
  const endRect = bagTarget.getBoundingClientRect();

  const startX = startRect.left + startRect.width / 2;
  const startY = startRect.top + startRect.height / 2;
  const endX = endRect.left + endRect.width / 2;
  const endY = endRect.top + endRect.height / 2;

  const midX = (startX + endX) / 2;
  const ctrlY = Math.min(startY, endY) - CART_FLY_PARTICLE.arcLiftPx;

  const particle = document.createElement('div');
  particle.setAttribute('aria-hidden', 'true');
  const size = CART_FLY_PARTICLE.sizePx;
  Object.assign(particle.style, {
    position: 'fixed',
    top: '0px',
    left: '0px',
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '9999px',
    pointerEvents: 'none',
    zIndex: '120',
    background: `radial-gradient(circle, ${PARTICLE_COLORS.ivoryCore} 0%, ${PARTICLE_COLORS.goldMid} 60%, transparent 100%)`,
    boxShadow: PARTICLE_COLORS.glowShadow,
    willChange: 'transform, opacity',
  });

  document.body.appendChild(particle);

  const steps = 10;
  const keyframes: Keyframe[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const inv = 1 - t;
    const x = inv * inv * startX + 2 * inv * t * midX + t * t * endX - size / 2;
    const y = inv * inv * startY + 2 * inv * t * ctrlY + t * t * endY - size / 2;
    const scale = 1 - 0.35 * t;
    const opacity = t > 0.85 ? (1 - t) / 0.15 : 1;
    keyframes.push({
      transform: `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(2)})`,
      opacity,
    });
  }

  let cleaned = false;
  const cleanup = () => {
    if (!cleaned) {
      cleaned = true;
      particle.remove();
    }
  };

  if (typeof particle.animate === 'function') {
    const anim = particle.animate(keyframes, {
      duration: CART_FLY_PARTICLE.durationMs,
      easing: 'cubic-bezier(0.22, 0.8, 0.25, 1)',
      fill: 'forwards',
    });
    anim.finished.then(cleanup).catch(cleanup);
  } else {
    cleanup();
  }

  window.setTimeout(cleanup, CART_FLY_PARTICLE.durationMs + 120);
}

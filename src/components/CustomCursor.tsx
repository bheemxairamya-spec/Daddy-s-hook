import { useEffect, useState } from 'react';

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [active, setActive] = useState(false);

  useEffect(() => {
    const isDesktopFine =
      window.matchMedia('(pointer: fine)').matches &&
      window.innerWidth >= 1024 &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!isDesktopFine) return;
    setEnabled(true);

    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      const target = e.target as HTMLElement | null;
      const isInteractive = Boolean(
        target?.closest('a, button, input, select, textarea, [role="button"]')
      );
      setActive(isInteractive);
    };

    const onLeave = () => setPos({ x: -100, y: -100 });

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  if (!enabled || pos.x < 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[100] hidden lg:block transition-transform duration-75 ease-out"
      style={{
        transform: `translate3d(${pos.x - (active ? 18 : 12)}px, ${pos.y - (active ? 18 : 12)}px, 0)`,
      }}
    >
      <div
        className={`rounded-full border border-[#B8934A] transition-all duration-150 flex items-center justify-center ${
          active ? 'w-9 h-9 bg-[#B8934A]/15' : 'w-6 h-6 bg-transparent'
        }`}
      >
        <div className="w-1 h-1 rounded-full bg-[#B8934A]" />
      </div>
    </div>
  );
}

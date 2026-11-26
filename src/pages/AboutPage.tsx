import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '../lib/media';

export function AboutPage() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-16 sm:py-24 space-y-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6">
          <div className="atelier-pill">
            <span className="w-2 h-2 rounded-full bg-[#B8934A]" aria-hidden="true" />
            <span className="font-ui text-[12px] tracking-[0.2em]">The Atelier Story</span>
          </div>
          <h1 className="font-small-caps text-5xl sm:text-6xl font-bold mt-5 text-[#0F3720] dark:text-[#F7F3EA]">
            Quiet Luxury Meets the Street.
          </h1>
          <div className="w-24 h-[3px] bg-[#B8934A] my-6" />
          <p className="text-[18px] text-[#2E3F34] dark:text-[#F7F3EA]/85 leading-[1.6]">
            Daddy&apos;s Hook started on Chapel Lane in Bandra with a single obsession: build the T-shirt you reach for every morning without thinking twice—heavy enough to drape cleanly, tailored at the collar, and finished with an understated embroidered crest.
          </p>
          <p className="text-[18px] text-[#2E3F34] dark:text-[#F7F3EA]/85 leading-[1.6] mt-4">
            We reject loud seasonal billboards in favour of tactile 240–360 GSM organic cottons, mineral acid washes, and numbered small-batch drops. Stay Hooked, Homies.
          </p>
          <div className="mt-8">
            <Link
              to="/shop"
              className="atelier-btn-primary px-8 font-ui text-[13px] tracking-[0.2em] inline-flex items-center dark:bg-[#B8934A] dark:text-[#0F3720]"
            >
              Explore Current Drop
            </Link>
          </div>
        </div>

        <div className="lg:col-span-6 atelier-card p-3">
          <img
            src={resolveMediaUrl('hero_streetwear_atelier')}
            alt="Daddy's Hook Flagship Boutique Interior"
            className="w-full aspect-video object-cover rounded-[8px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
        {[
          {
            num: '01',
            label: 'Weight',
            title: '280 GSM Standard',
            copy: 'Milled in small batches with long-staple combed yarns that soften with wear while holding boxy structure.',
          },
          {
            num: '02',
            label: 'Washes',
            title: 'Acid & Optic Finishes',
            copy: 'Every garment undergoes enzyme bio-polishing and mineral pigment baths so no two washes are identical.',
          },
          {
            num: '03',
            label: 'Reward',
            title: 'The 10-Stamp Streak',
            copy: 'Loyalty stays simple: ten orders or boutique pickups earn a complimentary heavyweight drop piece.',
          },
        ].map((card) => (
          <div
            key={card.title}
            className="atelier-card p-8"
          >
            <span className="font-display text-3xl font-bold text-[#B8934A] dark:text-[#D9C08A] tabular-nums">
              {card.num}
            </span>
            <p className="font-ui text-[12px] tracking-[0.2em] text-[#5E6B62] dark:text-[#D9C08A] mt-2">
              {card.label}
            </p>
            <h2 className="font-small-caps text-2xl font-bold mt-2 text-[#0F3720] dark:text-[#F7F3EA]">
              {card.title}
            </h2>
            <div className="w-12 h-[2px] bg-[#B8934A] my-4" />
            <p className="text-base text-[#2E3F34] dark:text-[#F7F3EA]/85 leading-[1.6]">
              {card.copy}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

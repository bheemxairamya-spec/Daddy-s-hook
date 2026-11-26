import { FREE_DELIVERY_THRESHOLD, formatINR } from '../lib/constants';

export function AnnouncementBar() {
  return (
    <div className="w-full bg-[#0E321E] text-[#F7F3E8] border-b border-[#B99651]/45 py-2 px-4 text-center">
      <p className="text-[11px] sm:text-xs font-medium tracking-[0.2em] uppercase">
        Free delivery above {formatINR(FREE_DELIVERY_THRESHOLD)}{' '}
        <span aria-hidden="true" className="text-[#D9C08A]">•</span>{' '}
        Cash on Delivery available
      </p>
    </div>
  );
}

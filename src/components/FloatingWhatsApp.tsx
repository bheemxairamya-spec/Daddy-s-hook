import { MessageCircle } from 'lucide-react';
import { buildWhatsAppUrl } from '../lib/constants';

export function FloatingWhatsApp() {
  return (
    <a
      href={buildWhatsAppUrl("Hey Daddy's Hook! I want to order a T-shirt.")}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat and order on WhatsApp"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 min-h-[48px] px-4 sm:px-5 rounded-[8px] bg-[#0F3720] text-[#F7F3EA] border border-[#B8934A]/65 shadow-[0_8px_20px_rgba(15,55,32,0.22)] hover:bg-[#0A2A19] hover:-translate-y-0.5 transition-all duration-500 ease-out flex items-center gap-2.5"
    >
      <MessageCircle className="w-5 h-5 text-[#D9C08A]" />
      <span className="hidden sm:inline font-ui text-[12px] tracking-[0.18em]">
        WhatsApp Order
      </span>
    </a>
  );
}

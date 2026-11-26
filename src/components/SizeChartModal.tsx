import { useEffect } from 'react';
import { X } from 'lucide-react';
import { SIZE_CHART_ROWS } from '../lib/constants';

interface SizeChartModalProps {
  open: boolean;
  onClose: () => void;
}

export function SizeChartModal({ open, onClose }: SizeChartModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55"
      role="dialog"
      aria-modal="true"
      aria-label="Daddy's Hook Size Chart"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-[16px] bg-[#FFFDF8] dark:bg-[#081E12] text-[#2E3F34] dark:text-[#F7F3EA] border border-[#E3DCCB] dark:border-[#B8934A] p-6 sm:p-8 shadow-2xl"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#E3DCCB] dark:border-[#B8934A]/50">
          <div>
            <p className="font-ui text-[12px] tracking-[0.2em] text-[#5E6B62] dark:text-[#D9C08A]">
              Garment Measurements
            </p>
            <h2 className="font-small-caps text-2xl sm:text-3xl font-bold text-[#0F3720] dark:text-[#F7F3EA] mt-1">
              Size &amp; Drape Guide
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close size chart"
            className="min-w-[44px] min-h-[44px] rounded-[8px] flex items-center justify-center text-[#0F3720] dark:text-[#F7F3EA] hover:bg-[#EDEFE6] dark:hover:bg-[#0F3720] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-base text-[#5E6B62] dark:text-[#C2CCC2] mt-4">
          Measurements are in inches taken flat across the garment. For a looser street drape on Regular Fit tees, take one size up.
        </p>

        <div className="mt-5 overflow-x-auto rounded-[12px] border border-[#E3DCCB] dark:border-[#B8934A]/60">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#EDEFE6] dark:bg-[#0F3720] border-b border-[#E3DCCB] dark:border-[#B8934A]/60 font-ui text-[12px] tracking-[0.16em] text-[#0F3720] dark:text-[#D9C08A]">
              <tr>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Chest</th>
                <th className="py-3 px-4">Length</th>
                <th className="py-3 px-4">Shoulder</th>
                <th className="py-3 px-4">Fit Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3DCCB] dark:divide-[#B8934A]/30 tabular-nums">
              {SIZE_CHART_ROWS.map((row) => (
                <tr key={row.size}>
                  <td className="py-3 px-4 font-bold text-[#0F3720] dark:text-[#D9C08A]">{row.size}</td>
                  <td className="py-3 px-4">{row.chest}</td>
                  <td className="py-3 px-4">{row.length}</td>
                  <td className="py-3 px-4">{row.shoulder}</td>
                  <td className="py-3 px-4 text-[#5E6B62] dark:text-[#C2CCC2]">{row.fitNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

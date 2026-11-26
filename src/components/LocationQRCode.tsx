import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { STORE_INFO } from '../lib/constants';

interface LocationQRCodeProps {
  size?: number;
  darkColor?: string;
  lightColor?: string;
}

export function LocationQRCode({
  size = 112,
  darkColor = '#0F3720',
  lightColor = '#FFFDF8',
}: LocationQRCodeProps) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(STORE_INFO.mapUrl, {
      width: size * 2,
      margin: 1,
      color: {
        dark: darkColor,
        light: lightColor,
      },
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        // Silent fallback if canvas unavailable
      });
    return () => {
      active = false;
    };
  }, [size, darkColor, lightColor]);

  return (
    <a
      href={STORE_INFO.mapUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex flex-col items-center p-2.5 rounded-[12px] bg-[#FFFDF8] border border-[#E3DCCB] hover:bg-[#EDEFE6] transition-colors duration-500 ease-out"
      aria-label="Scan QR code to open Daddy's Hook location on Google Maps"
    >
      {dataUrl ? (
        <img
          src={dataUrl}
          alt="Google Maps Location QR Code for Daddy's Hook"
          width={size}
          height={size}
          className="block rounded-[4px]"
        />
      ) : (
        <div
          style={{ width: size, height: size }}
          className="flex items-center justify-center bg-[#EDEFE6] text-[#0F3720] text-[10px] font-medium text-center p-2"
        >
          Maps QR
        </div>
      )}
      <span className="mt-1.5 font-ui text-[10px] tracking-[0.16em] text-[#0F3720]">
        Scan for Maps
      </span>
    </a>
  );
}

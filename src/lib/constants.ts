export const MEN_SUBCATEGORIES = [
  'Acid Wash',
  'Optic Wash',
  'Regular Fit',
  'Polo Fit',
  '5-Sleeve',
  'Down Shoulder',
  'Baggy Bottom Track Pants',
] as const;

export const WOMEN_SUBCATEGORIES = [
  "Women's T-shirts",
  'Crop Top',
  'Tank Top',
  'Baggy',
  'Oversized',
  'Bottom Baggy',
] as const;

export const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const;

export const COLOR_SWATCHES: Record<string, string> = {
  Obsidian: '#17140F',
  Charcoal: '#33312D',
  'Forest Green': '#0F3D24',
  Ivory: '#FAF7F0',
  Parchment: '#E6DEC8',
  Espresso: '#3D2F28',
  Olive: '#5E684D',
};

export const DEFAULT_WHATSAPP_NUMBER =
  import.meta.env.VITE_WHATSAPP_NUMBER || '919820411999';

export const FREE_DELIVERY_THRESHOLD = Number(
  import.meta.env.VITE_FREE_DELIVERY_THRESHOLD || 1999
);

export const STORE_INFO = {
  name: "Daddy's Hook",
  tagline: 'Stay Hooked, Homies!',
  instagram: '@daddyshook',
  instagramUrl: 'https://instagram.com/daddyshook',
  address: '14th Road, Chapel Lane, Bandra West, Mumbai 400050',
  phone: '+91 98204 11999',
  hours: 'Daily 11:00 AM — 9:30 PM IST',
  mapUrl: 'https://maps.google.com/?q=19.0607,72.8362',
  mapEmbedUrl:
    'https://www.openstreetmap.org/export/embed.html?bbox=72.828%2C19.054%2C72.845%2C19.068&layer=mapnik&marker=19.0607%2C72.8362',
};

export function formatINR(amount: number): string {
  return `Rs ${amount.toLocaleString('en-IN')}`;
}

export function buildWhatsAppUrl(message: string, phone = DEFAULT_WHATSAPP_NUMBER): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export const SIZE_CHART_ROWS = [
  { size: 'S', chest: '40"', length: '27.5"', shoulder: '19.5"', fitNote: 'Relaxed S' },
  { size: 'M', chest: '42"', length: '28.5"', shoulder: '20.5"', fitNote: 'Standard Boxy' },
  { size: 'L', chest: '44"', length: '29.5"', shoulder: '21.5"', fitNote: 'Signature Drop' },
  { size: 'XL', chest: '46"', length: '30.5"', shoulder: '22.5"', fitNote: 'Oversized' },
  { size: 'XXL', chest: '48"', length: '31.5"', shoulder: '23.5"', fitNote: 'Generous Drape' },
];

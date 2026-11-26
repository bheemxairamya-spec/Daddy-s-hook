import fs from 'node:fs';
import path from 'node:path';
import type { DatabaseSchema, StoreConfig } from './types.ts';
import { createInitialSeed } from './seed.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

export const STORE_CONFIG: StoreConfig = {
  shopName: "Daddy's Hook",
  tagline: 'Stay Hooked, Homies!',
  freeDeliveryThreshold: Number(process.env.VITE_FREE_DELIVERY_THRESHOLD || 1999),
  streakTarget: 10,
  streakPrizeName: 'Complimentary Heavyweight Drop Tee',
  whatsappNumber: process.env.VITE_WHATSAPP_NUMBER || '919820411999',
  instagramHandle: '@daddyshook',
  storeAddress: '14th Road, Chapel Lane, Bandra West, Mumbai 400050',
  storePhone: '+91 98204 11999',
  mapUrl: 'https://maps.google.com/?q=19.0607,72.8362',
};

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length > 10 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  return digits.slice(-10) || digits;
}

export function readDatabase(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const seed = createInitialSeed();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    if (!Array.isArray(parsed.products)) {
      const seed = createInitialSeed();
      fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
      return seed;
    }
    return parsed;
  } catch {
    const seed = createInitialSeed();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
}

export function writeDatabase(data: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
}

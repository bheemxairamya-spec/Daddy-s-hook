import { useEffect, useState } from 'react';
import type { StoreConfig } from '../types';

let cached: StoreConfig | null = null;
let inflight: Promise<StoreConfig | null> | null = null;

function loadConfig(): Promise<StoreConfig | null> {
  if (cached) return Promise.resolve(cached);
  inflight ??= fetch('/api/config')
    .then((r) => (r.ok ? (r.json() as Promise<StoreConfig>) : null))
    .then((c) => {
      cached = c;
      return c;
    })
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Server-driven store settings (payment availability, sign-in availability, etc). */
export function useStoreConfig(): StoreConfig | null {
  const [config, setConfig] = useState<StoreConfig | null>(cached);
  useEffect(() => {
    let alive = true;
    loadConfig().then((c) => alive && setConfig(c));
    return () => {
      alive = false;
    };
  }, []);
  return config;
}

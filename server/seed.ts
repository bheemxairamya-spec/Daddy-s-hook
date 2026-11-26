import type { DatabaseSchema } from './types.ts';

export function createInitialSeed(): DatabaseSchema {
  return {
    products: [],
    orders: [],
    streaks: [],
    inquiries: [],
  };
}

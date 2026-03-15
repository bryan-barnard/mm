export const STARTING_BANK_BALANCE = 1000;

export const SEED_PRICES: Record<number, number> = {
  1: 500, 2: 420, 3: 360, 4: 300, 5: 250, 6: 210, 7: 180, 8: 150,
  9: 125, 10: 100, 11: 80, 12: 65, 13: 50, 14: 35, 15: 20, 16: 10
};

export const SEED_PAYOUTS: Record<number, number> = {
  1: 40, 2: 55, 3: 70, 4: 90, 5: 110, 6: 130, 7: 155, 8: 180,
  9: 210, 10: 245, 11: 285, 12: 330, 13: 380, 14: 435, 15: 500, 16: 600
};

export const ROUND_ORDER = [
  'ROUND_OF_64',
  'ROUND_OF_32',
  'SWEET_16',
  'ELITE_8',
  'FINAL_FOUR',
  'CHAMPIONSHIP'
] as const;

export type Round = (typeof ROUND_ORDER)[number];

export const ROUND_PRICE_MULTIPLIERS: Record<Round, number> = {
  ROUND_OF_64: 1.2,
  ROUND_OF_32: 1.25,
  SWEET_16: 1.3,
  ELITE_8: 1.4,
  FINAL_FOUR: 1.5,
  CHAMPIONSHIP: 1.75
};

export const REGIONS = ['East', 'West', 'South', 'Midwest'] as const;

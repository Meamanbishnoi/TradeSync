// Point multipliers (dollars per point) for known futures instruments
export const POINT_MULTIPLIERS: Record<string, number> = {
  ES: 50,
  MES: 5,
  NQ: 20,
  MNQ: 2,
  YM: 5,
  MYM: 0.5,
  RTY: 50,
  M2K: 5,
  GC: 100,
  MGC: 10,
  CL: 1000,
  QM: 500,
  NG: 10000,
};

export const DEFAULT_SESSIONS = ["London", "New York", "Asia"];

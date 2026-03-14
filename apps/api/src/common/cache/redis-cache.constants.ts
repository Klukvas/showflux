export const CACHE_KEY_PREFIX = {
  BLACKLIST: 'blacklist',
  DASHBOARD_SUMMARY: 'dashboard:summary',
  LISTING: 'listing',
  USER: 'user',
} as const;

export const CACHE_TTL = {
  /** Dashboard summary — 30 seconds */
  DASHBOARD: 30,
  /** Entity-level cache — 5 minutes */
  ENTITY: 300,
  /** Default fallback — 60 seconds */
  DEFAULT: 60,
} as const;

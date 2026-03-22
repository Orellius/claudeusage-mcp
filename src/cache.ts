import type { CachedUsage, UsageResponse } from "./types.js";

const DEFAULT_TTL_MS = 60_000;

let cached: CachedUsage | null = null;

export function getCached(ttlMs: number = DEFAULT_TTL_MS): UsageResponse | null {
  if (!cached) return null;

  const age = Date.now() - cached.fetchedAt;
  if (age < ttlMs) {
    return cached.data;
  }

  return null;
}

export function getStaleCached(): UsageResponse | null {
  return cached?.data ?? null;
}

export function setCache(data: UsageResponse): void {
  cached = { data, fetchedAt: Date.now() };
}

export function getCacheAge(): number | null {
  if (!cached) return null;
  return Math.round((Date.now() - cached.fetchedAt) / 1000);
}

export function clearCache(): void {
  cached = null;
}

import Conf from "conf";
import os from "os";
import path from "path";
import dayjs from "dayjs";
import type { CacheData, CacheEntry } from "../types/index.js";

const configDir = path.join(os.homedir(), ".app-version");

const cacheStore = new Conf<CacheData>({
  cwd: configDir,
  configName: "cache",
  defaults: {},
});

// 缓存有效期: 1 小时
const CACHE_TTL = 60 * 60 * 1000;

export function getCache(key: string): CacheEntry | null {
  const entry = cacheStore.get(key);
  if (!entry) {
    return null;
  }
  return entry;
}

export function isCacheValid(key: string): boolean {
  const entry = getCache(key);
  if (!entry) {
    return false;
  }
  const cachedAt = dayjs(entry.cachedAt);
  return dayjs().diff(cachedAt, "millisecond") < CACHE_TTL;
}

export function setCache(key: string, version: string, date: string): void {
  const entry: CacheEntry = {
    version,
    date,
    cachedAt: dayjs().format("YYYY-MM-DD HH:mm:ss"),
  };
  cacheStore.set(key, entry);
}

export function clearCache(): void {
  cacheStore.clear();
}

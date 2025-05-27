import cache from 'memory-cache';

const CACHE_DURATION_SECONDS = 60 * 10; // Default 10 minutes

export function setToCache<T>(key: string, data: T, durationSeconds: number = CACHE_DURATION_SECONDS): void {
    cache.put(key, data, durationSeconds * 1000);
}

export function getFromCache<T>(key: string): T | null {
    return cache.get(key) as T | null;
}

export function clearCache(): void {
    cache.clear();
}

export function deleteFromCache(key: string): void {
    cache.del(key);
}
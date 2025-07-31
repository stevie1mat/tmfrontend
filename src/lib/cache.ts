// Comprehensive caching utility for TradeMinutes dashboard
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: string;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  version: string; // Cache version for invalidation
  backgroundRefresh?: boolean; // Whether to refresh in background
}

class DashboardCache {
  private memoryCache = new Map<string, CacheItem<any>>();
  private readonly CACHE_VERSION = '1.0.0';
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  // Cache keys for different data types
  private readonly CACHE_KEYS = {
    PROFILE: 'dashboard_profile',
    SERVICES: 'dashboard_services',
    TASKS: 'dashboard_tasks',
    ACTIVITIES: 'dashboard_activities',
    MARKETPLACE_STATS: 'dashboard_marketplace_stats',
    USER_STATS: 'dashboard_user_stats'
  } as const;

  constructor() {
    // Initialize cache from localStorage on startup
    this.initializeFromStorage();
    
    // Set up background refresh
    this.setupBackgroundRefresh();
  }

  private initializeFromStorage() {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      Object.values(this.CACHE_KEYS).forEach(key => {
        const stored = localStorage.getItem(key);
        if (stored) {
          const item: CacheItem<any> = JSON.parse(stored);
          if (this.isValid(item)) {
            this.memoryCache.set(key, item);
          } else {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Failed to initialize cache from storage:', error);
    }
  }

  private setupBackgroundRefresh() {
    // Refresh cache every 2 minutes in background
    setInterval(() => {
      this.refreshExpiredItems();
    }, 2 * 60 * 1000);
  }

  private isValid(item: CacheItem<any>): boolean {
    return (
      item &&
      typeof item.timestamp === 'number' &&
      typeof item.expiresAt === 'number' &&
      item.version === this.CACHE_VERSION &&
      Date.now() < item.expiresAt
    );
  }

  private async refreshExpiredItems() {
    const expiredKeys: string[] = [];
    
    this.memoryCache.forEach((item, key) => {
      if (!this.isValid(item)) {
        expiredKeys.push(key);
      }
    });

    // Remove expired items
    expiredKeys.forEach(key => {
      this.memoryCache.delete(key);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    });
  }

  set<T>(key: string, data: T, config: Partial<CacheConfig> = {}): void {
    const ttl = config.ttl || this.DEFAULT_TTL;
    const timestamp = Date.now();
    const expiresAt = timestamp + ttl;

    const cacheItem: CacheItem<T> = {
      data,
      timestamp,
      expiresAt,
      version: this.CACHE_VERSION
    };

    // Store in memory
    this.memoryCache.set(key, cacheItem);

    // Store in localStorage for persistence (browser only)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(cacheItem));
      } catch (error) {
        console.warn('Failed to store cache in localStorage:', error);
      }
    }
  }

  get<T>(key: string): T | null {
    const item = this.memoryCache.get(key);
    
    if (!item || !this.isValid(item)) {
      // Remove invalid item
      this.memoryCache.delete(key);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
      return null;
    }

    return item.data;
  }

  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    config: Partial<CacheConfig> = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      // If background refresh is enabled and cache is getting stale, refresh in background
      if (config.backgroundRefresh && this.isStale(key)) {
        this.backgroundFetch(key, fetchFn, config);
      }
      return cached;
    }

    // Fetch fresh data
    try {
      const data = await fetchFn();
      this.set(key, data, config);
      return data;
    } catch (error) {
      console.error(`Failed to fetch data for key ${key}:`, error);
      throw error;
    }
  }

  private isStale(key: string): boolean {
    const item = this.memoryCache.get(key);
    if (!item) return true;
    
    // Consider stale if more than 80% of TTL has passed
    const age = Date.now() - item.timestamp;
    const ttl = item.expiresAt - item.timestamp;
    return age > (ttl * 0.8);
  }

  private async backgroundFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    config: Partial<CacheConfig> = {}
  ) {
    try {
      const data = await fetchFn();
      this.set(key, data, config);
    } catch (error) {
      console.warn(`Background refresh failed for key ${key}:`, error);
    }
  }

  invalidate(key: string): void {
    this.memoryCache.delete(key);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }

  invalidateAll(): void {
    this.memoryCache.clear();
    if (typeof window !== 'undefined') {
      Object.values(this.CACHE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    }
  }

  // Predefined cache configurations
  getCacheConfig(type: 'profile' | 'services' | 'tasks' | 'activities' | 'stats'): CacheConfig {
    const configs = {
      profile: { ttl: 10 * 60 * 1000, version: this.CACHE_VERSION, backgroundRefresh: true }, // 10 minutes
      services: { ttl: 5 * 60 * 1000, version: this.CACHE_VERSION, backgroundRefresh: true }, // 5 minutes
      tasks: { ttl: 5 * 60 * 1000, version: this.CACHE_VERSION, backgroundRefresh: true }, // 5 minutes
      activities: { ttl: 2 * 60 * 1000, version: this.CACHE_VERSION, backgroundRefresh: true }, // 2 minutes
      stats: { ttl: 15 * 60 * 1000, version: this.CACHE_VERSION, backgroundRefresh: false } // 15 minutes
    };
    return configs[type];
  }

  // Cache keys getter
  get keys() {
    return this.CACHE_KEYS;
  }
}

// Create singleton instance
export const dashboardCache = new DashboardCache();

// Utility functions for common API patterns
export const cacheUtils = {
  // Optimistic update helper
  optimisticUpdate<T>(
    key: string,
    updateFn: (current: T) => T,
    rollbackFn?: () => void
  ) {
    const current = dashboardCache.get<T>(key);
    if (current) {
      const updated = updateFn(current);
      dashboardCache.set(key, updated);
      
      if (rollbackFn) {
        // Rollback after 5 seconds if no confirmation
        setTimeout(() => {
          rollbackFn();
        }, 5000);
      }
    }
  },

  // Batch cache operations
  batchSet(items: Array<{ key: string; data: any; config?: Partial<CacheConfig> }>) {
    items.forEach(({ key, data, config }) => {
      dashboardCache.set(key, data, config);
    });
  },

  // Cache warming (preload data)
  async warmCache(warmItems: Array<{ key: string; fetchFn: () => Promise<any>; config?: Partial<CacheConfig> }>) {
    const promises = warmItems.map(({ key, fetchFn, config }) =>
      dashboardCache.getOrFetch(key, fetchFn, config)
    );
    
    await Promise.allSettled(promises);
  }
};

export default dashboardCache; 
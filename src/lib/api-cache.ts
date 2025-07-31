// API Cache Utility to reduce duplicate requests
class APICache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  async fetch<T>(
    url: string, 
    options?: RequestInit, 
    ttl: number = 300000 // 5 minutes default
  ): Promise<T> {
    const cacheKey = `${url}-${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }

    // Fetch fresh data
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache the result
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    });

    return data;
  }

  // Clear cache for specific URL pattern
  clearCache(pattern?: string) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Get cache size for debugging
  getCacheSize(): number {
    return this.cache.size;
  }
}

// Global instance
export const apiCache = new APICache();

// Debounced fetch utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
} 
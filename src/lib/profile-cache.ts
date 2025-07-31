// Profile cache utility to prevent duplicate profile fetches
class ProfileCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_TTL = 300000; // 5 minutes

  async getProfile(userId: string, ttl: number = this.DEFAULT_TTL): Promise<any | null> {
    const cached = this.cache.get(userId);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    
    return null;
  }

  setProfile(userId: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(userId, { data, timestamp: Date.now(), ttl });
  }

  clearCache(userId?: string): void {
    if (userId) {
      this.cache.delete(userId);
    } else {
      this.cache.clear();
    }
  }

  getCacheSize(): number {
    return this.cache.size;
  }
}

// Global instance
export const profileCache = new ProfileCache();

// Helper function for profile fetching with caching
export const fetchProfileWithCache = async (userId: string, fetchFn: () => Promise<any>): Promise<any> => {
  // Check cache first
  const cached = await profileCache.getProfile(userId);
  if (cached) {
    return cached;
  }

  // Fetch and cache
  const data = await fetchFn();
  profileCache.setProfile(userId, data);
  return data;
}; 
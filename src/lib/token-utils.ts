// Token utility to reduce localStorage access
class TokenManager {
  private cachedToken: string | null = null;
  private lastCheck: number = 0;
  private readonly CACHE_DURATION = 5000; // 5 seconds

  getToken(): string | null {
    const now = Date.now();
    
    // Return cached token if still valid
    if (this.cachedToken && (now - this.lastCheck) < this.CACHE_DURATION) {
      return this.cachedToken;
    }

    // Check localStorage
    if (typeof window !== 'undefined') {
      this.cachedToken = localStorage.getItem('token');
      this.lastCheck = now;
      return this.cachedToken;
    }

    return null;
  }

  setToken(token: string): void {
    this.cachedToken = token;
    this.lastCheck = Date.now();
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  removeToken(): void {
    this.cachedToken = null;
    this.lastCheck = 0;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  clearCache(): void {
    this.cachedToken = null;
    this.lastCheck = 0;
  }
}

// Global instance
export const tokenManager = new TokenManager();

// Helper function for components
export const getAuthHeaders = (): Record<string, string> => {
  const token = tokenManager.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}; 
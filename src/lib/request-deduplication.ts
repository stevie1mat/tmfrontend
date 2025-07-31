// Request deduplication utility to prevent duplicate API calls
class RequestDeduplication {
  private pendingRequests = new Map<string, Promise<any>>();

  async deduplicate<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number = 5000 // 5 seconds
  ): Promise<T> {
    // Check if there's already a pending request
    const existingRequest = this.pendingRequests.get(key);
    if (existingRequest) {
      return existingRequest as Promise<T>;
    }

    // Create new request
    const request = requestFn().finally(() => {
      // Clean up after request completes
      setTimeout(() => {
        this.pendingRequests.delete(key);
      }, ttl);
    });

    // Store the request
    this.pendingRequests.set(key, request);
    return request;
  }

  clearPendingRequests(): void {
    this.pendingRequests.clear();
  }

  getPendingCount(): number {
    return this.pendingRequests.size;
  }
}

// Global instance
export const requestDeduplication = new RequestDeduplication();

// Helper function for deduplicated requests
export const deduplicatedFetch = async <T>(
  url: string,
  options?: RequestInit,
  key?: string
): Promise<T> => {
  const requestKey = key || `${url}-${JSON.stringify(options)}`;
  
  return requestDeduplication.deduplicate(requestKey, async () => {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  });
}; 
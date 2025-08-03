// Dashboard API service with caching
import { dashboardCache, cacheUtils } from './cache';

// API base URLs
const API_BASE_URLS = {
  USER: process.env.NEXT_PUBLIC_USER_API_URL || 'http://localhost:8080', // Unified user service
  TASK: process.env.NEXT_PUBLIC_TASK_API_URL || 'http://localhost:8084',
  MESSAGING: process.env.NEXT_PUBLIC_MESSAGING_API_URL || 'http://localhost:8085'
};

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('token');
};

// Helper function for authenticated API calls
const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Handle authentication errors
  if (response.status === 401 || response.status === 403) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw new Error('Authentication failed');
  }

  return response;
};

// Profile API
export const profileAPI = {
  async getProfile() {
    return dashboardCache.getOrFetch(
      dashboardCache.keys.PROFILE,
      async () => {
        try {
          const response = await authenticatedFetch(`${API_BASE_URLS.USER}/api/profile/get`);
          
          if (!response.ok) {
            console.warn(`Profile API returned ${response.status}: ${response.statusText}`);
            // Return fallback data instead of throwing error
            return {
              Name: "User",
              Email: "",
              university: "",
              program: "",
              yearOfStudy: "",
              skills: [],
              Credits: 0,
              isProvider: false,
              rating: 0,
              completedServices: 0,
              totalEarnings: 0,
              ProfilePictureURL: "",
            };
          }

          const data = await response.json();
          
          // Transform data to consistent format
          return {
            Name: data.Name || data.name || "User",
            Email: data.Email || data.email || "",
            university: data.university || data.University || data.college || data.College || "",
            program: data.program || data.Program || data.major || data.Major || "",
            yearOfStudy: data.yearOfStudy || data.YearOfStudy || data.year || data.Year || "",
            skills: Array.isArray(data.skills) ? data.skills : Array.isArray(data.Skills) ? data.Skills : [],
            Credits: data.Credits || data.credits || 0,
            isProvider: data.isProvider || false,
            rating: data.rating || data.Rating || 0,
            completedServices: data.completedServices || 0,
            totalEarnings: data.totalEarnings || 0,
            ProfilePictureURL: data.ProfilePictureURL || data.profilePictureURL || "",
          };
        } catch (error) {
          console.warn('Profile API error:', error);
          // Return fallback data on any error
          return {
            Name: "User",
            Email: "",
            university: "",
            program: "",
            yearOfStudy: "",
            skills: [],
            Credits: 0,
            isProvider: false,
            rating: 0,
            completedServices: 0,
            totalEarnings: 0,
            ProfilePictureURL: "",
          };
        }
      },
      dashboardCache.getCacheConfig('profile')
    );
  },

  async updateProfile(profileData: any) {
    const response = await authenticatedFetch(`${API_BASE_URLS.USER}/api/profile/update-info`, {
      method: 'POST',
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      throw new Error('Failed to update profile');
    }

    // Invalidate profile cache and fetch fresh data
    dashboardCache.invalidate(dashboardCache.keys.PROFILE);
    return this.getProfile();
  }
};

// Services API
export const servicesAPI = {
  async getUserServices(limit: number = 3) {
    return dashboardCache.getOrFetch(
      dashboardCache.keys.SERVICES,
      async () => {
        const response = await authenticatedFetch(
          `${API_BASE_URLS.TASK}/api/tasks/get/user?limit=${limit}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }

        const data = await response.json();
        // The API returns an array directly, not wrapped in a data property
        const services = Array.isArray(data) ? data : [];
        
        return {
          total: services.length,
          earnings: services.reduce((sum: number, service: any) => sum + (service.Credits || 0), 0),
          recent: services.slice(0, limit).map((service: any) => ({
            id: service.ID || service.id,
            ID: service.ID || service.id,
            Title: service.Title || service.title,
            Price: service.Credits || service.credits || service.Price || service.price,
            Category: service.Category || service.category || 'General',
            rating: service.rating || service.Rating || 4.5,
            reviewCount: service.reviewCount || service.ReviewCount || service.reviews || service.Reviews || Math.floor(Math.random() * 20) + 5,
            Images: service.Images || [],
            Tiers: service.Tiers || service.tiers || [],
            Author: service.Author || service.author || {
              Name: 'Provider',
              ProfilePictureURL: service.Author?.Avatar || service.author?.avatar || ""
            }
          }))
        };
      },
      dashboardCache.getCacheConfig('services')
    );
  }
};

// Tasks API
export const tasksAPI = {
  async getUserTasks(limit: number = 5) {
    return dashboardCache.getOrFetch(
      dashboardCache.keys.TASKS,
      async () => {
        const response = await authenticatedFetch(
          `${API_BASE_URLS.TASK}/api/tasks/get/user?limit=${limit}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }

        const data = await response.json();
        // The API returns an array directly, not wrapped in a data property
        const tasks = Array.isArray(data) ? data : [];
        
        return {
          total: tasks.length,
          credits: tasks.reduce((sum: number, task: any) => sum + (task.Credits || 0), 0),
          recent: tasks.slice(0, limit),
        };
      },
      dashboardCache.getCacheConfig('tasks')
    );
  }
};

// Activities API
export const activitiesAPI = {
  async getRecentActivities() {
    return dashboardCache.getOrFetch(
      dashboardCache.keys.ACTIVITIES,
      async () => {
        const allActivities: any[] = [];
        
        try {
          // Get user profile for ID
          const profileData = await authenticatedFetch(`${API_BASE_URLS.USER}/api/auth/profile`);
          const profile = await profileData.json();
          const userId = profile.ID || profile.id;

          // Parallel fetch of all activity sources
          const activityPromises = [];

          // Recent services created
          activityPromises.push(
            authenticatedFetch(`${API_BASE_URLS.TASK}/api/tasks/get/user?limit=3`)
              .then(res => res.json())
              .then(data => {
                // The API returns an array directly, not wrapped in a data property
                const services = Array.isArray(data) ? data : [];
                return services.map((service: any, index: number) => ({
                  id: `service-${service.ID || service.id || index}`,
                  type: "service_created",
                  title: "New service listed",
                  description: `You created "${service.Title || service.title || 'service'}" listing`,
                  timestamp: service.CreatedAt || service.createdAt || new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
                  icon: "📝",
                  credits: service.Credits || service.credits || 0
                }));
              })
              .catch(() => [])
          );

          // Recent bookings received (as service provider)
          if (userId) {
            activityPromises.push(
              authenticatedFetch(`${API_BASE_URLS.TASK}/api/bookings?role=owner&id=${userId}&limit=3`)
                .then(res => res.json())
                .then(data => {
                  const bookings = data?.data || data || [];
                  return bookings.map((booking: any, index: number) => ({
                    id: `booking-received-${booking.ID || booking.id || index}`,
                    type: "service_booked",
                    title: "Service booked",
                    description: `${booking.BookerName || 'Someone'} booked "${booking.TaskTitle || 'your service'}"`,
                    timestamp: booking.CreatedAt || booking.createdAt || new Date(Date.now() - (index + 1) * 12 * 60 * 60 * 1000).toISOString(),
                    icon: "💼",
                    credits: booking.Credits || booking.credits || 0
                  }));
                })
                .catch(() => [])
            );

            // Recent bookings made (as customer)
            activityPromises.push(
              authenticatedFetch(`${API_BASE_URLS.TASK}/api/bookings?role=booker&id=${userId}&limit=2`)
                .then(res => res.json())
                .then(data => {
                  const bookings = data?.data || data || [];
                  return bookings.map((booking: any, index: number) => ({
                    id: `booking-made-${booking.ID || booking.id || index}`,
                    type: "service_purchased",
                    title: "Service purchased",
                    description: `You booked "${booking.TaskTitle || 'service'}" from ${booking.TaskOwnerName || 'provider'}`,
                    timestamp: booking.CreatedAt || booking.createdAt || new Date(Date.now() - (index + 2) * 6 * 60 * 60 * 1000).toISOString(),
                    icon: "🛒",
                    credits: -(booking.Credits || booking.credits || 0)
                  }));
                })
                .catch(() => [])
            );
          }

          // Wait for all activity data
          const activityResults = await Promise.allSettled(activityPromises);
          
          // Combine all activities
          activityResults.forEach(result => {
            if (result.status === 'fulfilled' && Array.isArray(result.value)) {
              allActivities.push(...result.value);
            }
          });

          // Sort by timestamp and take top 5
          allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          const recentActivities = allActivities.slice(0, 5);

          // Add welcome activity if no real data
          if (recentActivities.length === 0) {
            recentActivities.push({
              id: 'welcome',
              type: "account_created",
              title: "Welcome to TradeMinutes!",
              description: "Your account is ready. Start by creating your first service.",
              timestamp: new Date().toISOString(),
              icon: "🎉"
            });
          }

          return recentActivities;

        } catch (error) {
          console.error('Error fetching activities:', error);
          // Return fallback activity
          return [{
            id: 'fallback',
            type: "profile_updated",
            title: "Profile updated",
            description: "Welcome back!",
            timestamp: new Date().toISOString(),
            icon: "👤"
          }];
        }
      },
      dashboardCache.getCacheConfig('activities')
    );
  }
};

// Stats API
export const statsAPI = {
  async getMarketplaceStats() {
    return dashboardCache.getOrFetch(
      dashboardCache.keys.MARKETPLACE_STATS,
      async () => {
        // For now, return static stats (can be replaced with real API call)
        return {
          totalServices: 1247,
          activeProviders: 89,
          totalBookings: 3421,
          averageRating: 4.5
        };
      },
      dashboardCache.getCacheConfig('stats')
    );
  },

  async getUserStats() {
    return dashboardCache.getOrFetch(
      dashboardCache.keys.USER_STATS,
      async () => {
        // Combine data from multiple sources
        const [profile, services, tasks] = await Promise.allSettled([
          profileAPI.getProfile(),
          servicesAPI.getUserServices(),
          tasksAPI.getUserTasks()
        ]);

        return {
          monthlyEarnings: profile.status === 'fulfilled' ? profile.value.totalEarnings || 0 : 0,
          servicesCompleted: profile.status === 'fulfilled' ? profile.value.completedServices || 0 : 0,
          averageRating: profile.status === 'fulfilled' ? profile.value.rating || 4.5 : 4.5,
          activeBookings: 0, // This would need a separate API call
          totalServices: services.status === 'fulfilled' ? services.value.total : 0,
          totalTasks: tasks.status === 'fulfilled' ? tasks.value.total : 0
        };
      },
      dashboardCache.getCacheConfig('stats')
    );
  }
};

// Cache management
export const cacheManagement = {
  // Warm up cache with all dashboard data
  async warmDashboardCache() {
    const warmItems = [
      { key: dashboardCache.keys.PROFILE, fetchFn: () => profileAPI.getProfile(), config: dashboardCache.getCacheConfig('profile') },
      { key: dashboardCache.keys.SERVICES, fetchFn: () => servicesAPI.getUserServices(), config: dashboardCache.getCacheConfig('services') },
      { key: dashboardCache.keys.TASKS, fetchFn: () => tasksAPI.getUserTasks(), config: dashboardCache.getCacheConfig('tasks') },
      { key: dashboardCache.keys.ACTIVITIES, fetchFn: () => activitiesAPI.getRecentActivities(), config: dashboardCache.getCacheConfig('activities') },
      { key: dashboardCache.keys.MARKETPLACE_STATS, fetchFn: () => statsAPI.getMarketplaceStats(), config: dashboardCache.getCacheConfig('stats') },
      { key: dashboardCache.keys.USER_STATS, fetchFn: () => statsAPI.getUserStats(), config: dashboardCache.getCacheConfig('stats') }
    ];

    await cacheUtils.warmCache(warmItems);
  },

  // Invalidate specific cache types
  invalidateProfile() {
    dashboardCache.invalidate(dashboardCache.keys.PROFILE);
  },

  invalidateServices() {
    dashboardCache.invalidate(dashboardCache.keys.SERVICES);
  },

  invalidateTasks() {
    dashboardCache.invalidate(dashboardCache.keys.TASKS);
  },

  invalidateActivities() {
    dashboardCache.invalidate(dashboardCache.keys.ACTIVITIES);
  },

  // Invalidate all dashboard cache
  invalidateAll() {
    dashboardCache.invalidateAll();
  },

  // Clear all cache and force fresh data fetch
  clearAllCache() {
    dashboardCache.invalidateAll();
    // Also clear localStorage cache
    if (typeof window !== 'undefined') {
      Object.values(dashboardCache.keys).forEach(key => {
        localStorage.removeItem(key);
      });
    }
  }
};

export default {
  profileAPI,
  servicesAPI,
  tasksAPI,
  activitiesAPI,
  statsAPI,
  cacheManagement
}; 
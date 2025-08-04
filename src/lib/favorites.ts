const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || "https://trademinutes-task-core.onrender.com";

export interface FavoriteService {
  ID?: string;
  id?: string;
  Title?: string;
  title?: string;
  Description?: string;
  description?: string;
  Credits?: number;
  credits?: number;
  Category?: string;
  category?: string;
  Location?: string;
  location?: string;
  LocationType?: string;
  locationType?: string;
  Availability?: any[];
  availability?: any[];
  Author?: {
    Name?: string;
    name?: string;
    Avatar?: string;
    avatar?: string;
  };
  author?: {
    name?: string;
    avatar?: string;
  };
  Images?: string[];
  rating?: number;
  reviewCount?: number;
  CreatedAt?: number;
  createdAt?: number;
  FavoriteID?: string;
}

export const favoritesService = {
  // Add a service to favorites
  async addToFavorites(taskId: string): Promise<{ id: string; message: string }> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/api/favorites/add`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to add to favorites');
    }

    return response.json();
  },

  // Remove a service from favorites
  async removeFromFavorites(taskId: string): Promise<{ message: string }> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/api/favorites/remove`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to remove from favorites');
    }

    return response.json();
  },

  // Get user's favorites
  async getFavorites(): Promise<{ data: FavoriteService[] }> {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/api/favorites`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch favorites');
    }

    return response.json();
  },

  // Check if a service is favorited
  async checkFavoriteStatus(taskId: string): Promise<{ isFavorited: boolean; favoriteId?: string }> {
    const token = localStorage.getItem('token');
    if (!token) {
      return { isFavorited: false };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/favorites/check/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { isFavorited: false };
      }

      return response.json();
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return { isFavorited: false };
    }
  },
}; 
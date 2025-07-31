'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaHeart, FaMapMarkerAlt, FaClock, FaCoins, FaStar, FaTrash } from 'react-icons/fa';
import Image from 'next/image';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ProtectedLayout from '@/components/Layout/ProtectedLayout';

type Availability = {
  Date: string;
  TimeFrom: string;
  TimeTo: string;
};

type Service = {
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
  Availability?: Availability[];
  availability?: Availability[];
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
  Tiers?: Array<{ name: string; credits: number; title: string; description: string; features: string[]; availableTimeSlot: string; maxDays: number }>;
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || "http://localhost:8084";
      const response = await fetch(`${API_BASE_URL}/api/favorites`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }

      const data = await response.json();
      setFavorites(data.data || []);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const removeFromFavorites = async (taskId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || "http://localhost:8084";
      const response = await fetch(`${API_BASE_URL}/api/favorites/remove`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove from favorites');
      }

      // Remove from local state
      setFavorites(prev => prev.filter(fav => fav.ID !== taskId && fav.id !== taskId));
    } catch (err) {
      console.error('Error removing from favorites:', err);
      alert('Failed to remove from favorites');
    }
  };

  const handleServiceClick = (service: Service) => {
    const serviceId = service.ID || service.id;
    if (serviceId) {
      router.push(`/tasks/view/${serviceId}`);
    }
  };

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" text="Loading favorites..." />
        </div>
      </ProtectedLayout>
    );
  }

  if (error) {
    return (
      <ProtectedLayout>
        <div className="text-center py-16">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Favorites</h1>
          <p className="text-gray-600">
            {favorites.length} favorite{favorites.length !== 1 ? 's' : ''} saved
          </p>
        </div>

        {/* Favorites Grid */}
        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-500 text-lg mb-4">
              You haven't saved any favorites yet.
            </div>
            <p className="text-gray-400 mb-6">
              Start exploring services and save your favorites for easy access.
            </p>
            <button 
              onClick={() => router.push('/services/all')}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Browse Services
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((service, index) => {
              const gradients = [
                'from-blue-400 to-blue-600',
                'from-purple-400 to-purple-600', 
                'from-green-400 to-green-600',
                'from-pink-400 to-pink-600',
                'from-yellow-400 to-yellow-600',
                'from-indigo-400 to-indigo-600'
              ];
              const colors = [
                { bg: 'bg-blue-100', text: 'text-blue-600' },
                { bg: 'bg-purple-100', text: 'text-purple-600' },
                { bg: 'bg-green-100', text: 'text-green-600' },
                { bg: 'bg-pink-100', text: 'text-pink-600' },
                { bg: 'bg-yellow-100', text: 'text-yellow-600' },
                { bg: 'bg-indigo-100', text: 'text-indigo-600' }
              ];
              
              // Handle both mock and real data structures
              const serviceId = service.ID || service.id;
              const title = service.Title || service.title;
              const category = service.Category || service.category;
              const rating = service.rating || 4.5;
              const reviews = service.reviewCount || Math.floor(Math.random() * 50) + 10;
              const user = service.Author?.Name || service.Author?.name || service.author?.name || 'Provider';
              const avatar = service.Author?.Avatar || service.author?.avatar;
              const price = service.Tiers && service.Tiers.length > 0 
                ? service.Tiers.find((tier: any) => tier.name === 'Basic')?.credits || service.Tiers[0].credits
                : service.Credits || service.credits || 0;
              const location = service.Location || service.location || 'Online';
              const locationType = service.LocationType || service.locationType || 'Online';
              const availability = service.Availability || service.availability || [];
              
              // Enhanced image handling for different formats
              let image = service.Images?.[0];
              
              // If no image found, try alternative image fields
              if (!image && service.Images && service.Images.length > 0) {
                // Try to find first valid image
                for (let i = 0; i < service.Images.length; i++) {
                  if (service.Images[i] && typeof service.Images[i] === 'string') {
                    image = service.Images[i];
                    break;
                  }
                }
              }
              
              return (
                <div
                  key={serviceId || index}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                >
                  {/* Image */}
                  <div className="h-32 relative">
                    {image ? (
                      <Image
                        src={image}
                        alt={title || 'Service'}
                        width={300}
                        height={128}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => handleServiceClick(service)}
                      />
                    ) : (
                      <div 
                        className={`w-full h-full bg-gradient-to-br ${gradients[index % gradients.length]} cursor-pointer`}
                        onClick={() => handleServiceClick(service)}
                      ></div>
                    )}
                    <div className="absolute inset-0 bg-black/20"></div>
                    
                    {/* Remove from favorites button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromFavorites(serviceId || '');
                      }}
                      className="absolute top-2 right-2 bg-white rounded-full p-2 shadow hover:bg-red-50 transition-colors"
                      title="Remove from favorites"
                    >
                      <FaTrash className="text-red-500 hover:text-red-600" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-block px-2 py-1 ${colors[index % colors.length].bg} ${colors[index % colors.length].text} text-xs font-semibold rounded`}>
                        {category || 'GENERAL'}
                      </span>
                      <div className="flex items-center gap-1 text-sm font-bold text-green-600">
                        <FaCoins className="w-4 h-4" />
                        <span>{price}</span>
                      </div>
                    </div>
                    <h3 
                      className="font-semibold text-gray-900 mb-3 cursor-pointer hover:text-green-600"
                      onClick={() => handleServiceClick(service)}
                    >
                      {title || 'Service Title'}
                    </h3>
                    
                    {/* Location and Time Details */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <FaMapMarkerAlt className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate max-w-[200px]">{location}</span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded flex-shrink-0">
                          {locationType}
                        </span>
                      </div>
                      
                      {availability.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <FaClock className="w-4 h-4 text-gray-400" />
                          <span>{availability[0].TimeFrom} - {availability[0].TimeTo}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FaStar className="w-4 h-4 text-yellow-400" />
                      <span>{rating} ({reviews} reviews)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
} 
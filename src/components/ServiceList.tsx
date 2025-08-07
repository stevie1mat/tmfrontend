'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { FiStar } from 'react-icons/fi';
import { FaStar, FaArrowLeft, FaArrowRight, FaMapMarkerAlt, FaClock, FaCoins } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import LazyImage from '@/components/common/LazyImage';
import { useAuth } from '@/contexts/AuthContext';

// Custom hook to load images on-demand with caching
const useTaskImages = (taskId: string) => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageCache, setImageCache] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!taskId) return;

    // Check cache first
    if (imageCache[taskId]) {
      setImages(imageCache[taskId]);
      return;
    }

    const loadImages = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use very low quality thumbnails for faster loading: 30% quality, 200px max width
        const response = await fetch(`http://localhost:8084/api/tasks/images?taskId=${taskId}&quality=30&width=200`);
        if (!response.ok) {
          throw new Error('Failed to load images');
        }
        const data = await response.json();
        const imageArray = data.images || [];
        setImages(imageArray);
        // Cache the result
        setImageCache(prev => ({ ...prev, [taskId]: imageArray }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load images');
        console.error('Error loading images:', err);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [taskId, imageCache]);

  return { images, loading, error };
};

// Custom hook to load author avatar on-demand with caching
const useAuthorAvatar = (authorId: string) => {
  const [avatar, setAvatar] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarCache, setAvatarCache] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authorId) return;

    // Check cache first
    if (avatarCache[authorId]) {
      setAvatar(avatarCache[authorId]);
      return;
    }

    const loadAvatar = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use maximum compression for avatars: 50% quality, 64px max width
        const response = await fetch(`http://localhost:8084/api/tasks/avatar?authorId=${authorId}&quality=50&width=64`);
        if (!response.ok) {
          throw new Error('Failed to load avatar');
        }
        const data = await response.json();
        const avatarUrl = data.avatar || '';
        setAvatar(avatarUrl);
        // Cache the result
        setAvatarCache(prev => ({ ...prev, [authorId]: avatarUrl }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load avatar');
        console.error('Error loading avatar:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAvatar();
  }, [authorId, avatarCache]);

  return { avatar, loading, error };
};

// Service list item component
const ServiceListItem = ({ service, idx }: { service: Service; idx: number }) => {
  const router = useRouter();
  const { user } = useAuth();
  
  const serviceId = service.ID || service.id;
  const authorId = service.Author?.ID || service.Author?.id || service.author?.id;
  
  // Load images and avatar on-demand (fallback only)
  const { images, loading: imagesLoading } = useTaskImages(serviceId || '');
  const { avatar: loadedAvatar, loading: avatarLoading } = useAuthorAvatar(authorId || '');
  
  // Use service's own avatar first, then fallback to loaded avatar
  const avatar = service.Author?.Avatar || service.author?.avatar || loadedAvatar;

  // Handle real Service data structure
  const title = service.Title || service.title;
  const description = service.Description || service.description;
  const category = service.Category || service.category;
  const location = service.Location || service.location;
  const rating = service.rating || 4.0;
  const reviews = service.reviewCount || 1;
  const userName = service.Author?.Name || service.Author?.name || service.author?.name || 'Provider';
  const price = service.Tiers && service.Tiers.length > 0 
    ? service.Tiers.find((tier: any) => tier.name === 'Basic')?.credits || service.Tiers[0].credits
    : service.Credits || service.credits || 0;
  
  // Use service's own images first, then fallback to loaded images from API
  const image = service.Images?.[0] || images[0] || '';
  
  const handleCardClick = () => {
    if (serviceId) {
      router.push(`/services/view/${serviceId}`);
    }
  };

  // Generate gradient background for image placeholder
  const gradients = [
    'from-pink-400 to-purple-500',
    'from-blue-400 to-cyan-500', 
    'from-green-400 to-teal-500',
    'from-yellow-400 to-orange-500',
    'from-purple-400 to-pink-500',
    'from-indigo-400 to-purple-500'
  ];

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 mb-4"
      onClick={handleCardClick}
    >
      <div className="flex">
        {/* Image Area */}
        <div className="relative w-48 h-32 bg-gradient-to-br from-pink-100 to-purple-100 flex-shrink-0">
          {image ? (
            <div className="w-full h-full">
              <LazyImage
                src={image}
                alt={title || 'Service image'}
                className="w-full h-full object-cover"
                fill={true}
              />
            </div>
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradients[idx % gradients.length]} flex items-center justify-center`}>
              <div className="text-white text-2xl font-bold opacity-20">
                {title?.charAt(1) || 'S'}
              </div>
            </div>
          )}
          
          {/* Arrow icon in top right */}
          <div className="absolute top-2 right-2 w-6 h-6 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-gray-600 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            {/* Category and Title */}
            <div className="mb-2">
              <span className="text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded-full">
                {category || 'Design & Creative'}
              </span>
            </div>
            
            <h4 className="font-bold text-gray-700 text-lg mb-2 line-clamp-2">
              {title || 'Service Title'}
            </h4>
            
            {/* Description */}
            {description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {description}
              </p>
            )}
            
            {/* Rating and Location */}
            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1">
                <FaStar className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-semibold text-gray-900">{rating}</span>
                <span className="text-xs text-gray-500">({reviews} Review)</span>
              </div>
              
              {location && (
                <div className="flex items-center gap-1">
                  <FaMapMarkerAlt className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{location}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Provider and Price */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {avatar ? (
                <LazyImage
                  src={avatar}
                  alt={userName || 'User avatar'}
                  className="w-8 h-8 rounded-full object-cover"
                  width={32}
                  height={32}
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-600">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm text-gray-700 font-medium">{userName}</span>
            </div>
            
            <div className="text-sm text-gray-600">
              <FaCoins className="w-4 h-4 text-gray-400 inline mr-1 -mt-1" /> 
              <span className="text-lg font-bold text-gray-900">{price}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface Availability {
  Date: string;
  TimeFrom: string;
  TimeTo: string;
}

interface Service {
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
    ID?: string;
    id?: string;
    Name?: string;
    name?: string;
    Avatar?: string;
    avatar?: string;
  };
  author?: {
    id?: string;
    name?: string;
    avatar?: string;
  };
  Images?: string[];
  rating?: number;
  reviewCount?: number;
  CreatedAt?: number;
  createdAt?: number;
  Tiers?: Array<{ name: string; credits: number; title: string; description: string; features: string[]; availableTimeSlot: string; maxDays: number }>;
}

export default function ServiceList({ items = [] }: { items?: Service[] }) {
  const [page, setPage] = useState(1);
  const router = useRouter();
  const { user } = useAuth();

  // Helper function to check if service belongs to current user
  const isOwnService = (service: Service) => {
    if (!user) return false;
    
    // Handle real service type
    const serviceAuthorId = service.Author?.ID || service.Author?.id || service.author?.id;
    const currentUserId = user.ID || user.id;
    return serviceAuthorId === currentUserId;
  };

  // Use passed items directly
  const displayItems = items || [];
  console.log("ServiceList displayItems:", displayItems);
  
  const totalPages = Math.ceil(displayItems.length / 10); // Show 10 items per page for list view
  const paginated = displayItems.slice((page - 1) * 10, page * 10);

  const goTo = (p: number) => setPage(Math.min(Math.max(p, 1), totalPages));

  const handleCardClick = (serviceId: string | number) => {
    router.push(`/services/view/${String(serviceId)}`);
  };

  return (
    <>
      {/* Navigation controls */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">All Services ({displayItems.length})</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => goTo(page - 1)}
            disabled={page === 1}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-40"
          >
            <FaArrowLeft className="w-4 h-4" />
          </button>
          
          <span className="text-sm text-gray-600 font-medium">
            Page {page} of {totalPages}
          </span>
          
          <button 
            onClick={() => goTo(page + 1)}
            disabled={page === totalPages}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-40"
          >
            <FaArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {paginated.map((s, idx) => (
          <ServiceListItem key={`${s.ID || s.id}-${idx}`} service={s} idx={idx} />
        ))}
      </div>
    </>
  );
}

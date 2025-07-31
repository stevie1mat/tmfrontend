'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { FiStar } from 'react-icons/fi';
import { FaStar, FaArrowLeft, FaArrowRight, FaMapMarkerAlt, FaClock, FaCoins } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import LazyImage from '@/components/common/LazyImage';
import { useAuth } from '@/contexts/AuthContext';

// Custom hook to load images on-demand
const useTaskImages = (taskId: string) => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;

    const loadImages = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use low quality thumbnails for better performance: 40% quality, 300px max width
        const response = await fetch(`http://localhost:8084/api/tasks/images?taskId=${taskId}&quality=40&width=300`);
        if (!response.ok) {
          throw new Error('Failed to load images');
        }
        const data = await response.json();
        setImages(data.images || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load images');
        console.error('Error loading images:', err);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, [taskId]);

  return { images, loading, error };
};

// Custom hook to load author avatar on-demand
const useAuthorAvatar = (authorId: string) => {
  const [avatar, setAvatar] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authorId) return;

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
        setAvatar(data.avatar || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load avatar');
        console.error('Error loading avatar:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAvatar();
  }, [authorId]);

  return { avatar, loading, error };
};

// Service card component with image loading
const ServiceCard = ({ service, idx }: { service: Service; idx: number }) => {
  const router = useRouter();
  const { user } = useAuth();
  
  const serviceId = service.ID || service.id;
  const authorId = service.Author?.ID || service.Author?.id || service.author?.id;
  
  // Load images and avatar on-demand (fallback only)
  const { images, loading: imagesLoading } = useTaskImages(serviceId || '');
  const { avatar: loadedAvatar, loading: avatarLoading } = useAuthorAvatar(authorId || '');
  
  // Use service's own avatar first, then fallback to loaded avatar
  const avatar = service.Author?.Avatar || service.author?.avatar || loadedAvatar;

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
  
  // Handle real Service data structure
  const title = service.Title || service.title;
  const category = service.Category || service.category;
  const rating = service.rating || 4.5;
  const reviews = service.reviewCount || 0;
  const userName = service.Author?.Name || service.Author?.name || service.author?.name || 'Provider';
  const price = service.Tiers && service.Tiers.length > 0 
    ? service.Tiers.find((tier: any) => tier.name === 'Basic')?.credits || service.Tiers[0].credits
    : service.Credits || service.credits || 0;
  const location = service.Location || service.location || 'Online';
  const locationType = service.LocationType || service.locationType || 'Online';
  const availability = service.Availability || service.availability || [];
  
  // Use service's own images first, then fallback to loaded images from API
  const image = service.Images?.[0] || images[0] || '';
  
  const handleCardClick = () => {
    if (serviceId) {
      router.push(`/services/view/${serviceId}`);
    }
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
      onClick={handleCardClick}
    >
      <div className="h-32 relative">
        {image ? (
          <LazyImage
            src={image}
            alt={title || 'Service image'}
            className="w-full h-full object-cover"
            fill={true}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 rounded-md overflow-hidden">
            <div className="w-full h-full relative">
              {/* Shimmer effect */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                style={{
                  animation: 'shimmer 2s infinite',
                  transform: 'translateX(-100%)'
                }}
              ></div>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`inline-block px-2 py-1 ${colors[idx % colors.length].bg} ${colors[idx % colors.length].text} text-xs font-semibold rounded`}>
            {category || 'GENERAL'}
          </span>
          <div className="flex items-center gap-1 text-sm font-bold text-green-600">
            <FaCoins className="w-4 h-4" />
            <span>{price}</span>
            {service.Tiers && service.Tiers.length > 0 && (
              <span className="text-xs text-gray-500 font-normal">(Basic)</span>
            )}
          </div>
        </div>
        <h4 className="font-semibold text-gray-900 mb-3">
          {title || 'Service Title'}
        </h4>
        
        <div className="flex items-center justify-between mb-3">
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
          
          <div className="flex items-center gap-1">
            <FaStar className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-gray-900">{rating}</span>
            <span className="text-xs text-gray-500">({reviews})</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <FaMapMarkerAlt className="w-4 h-4" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-1">
            <FaClock className="w-4 h-4" />
            <span>{locationType}</span>
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

export default function ServiceGrid({ items = [] }: { items?: Service[] }) {
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
  console.log("ServiceGrid displayItems:", displayItems);
  
  const totalPages = Math.ceil(displayItems.length / 8); // Assuming PER_PAGE is 8
  const paginated = displayItems.slice((page - 1) * 8, page * 8);

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

      {/* grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {paginated.map((s, idx) => (
          <ServiceCard key={`${s.ID || s.id}-${idx}`} service={s} idx={idx} />
        ))}
      </div>



    </>
  );
}
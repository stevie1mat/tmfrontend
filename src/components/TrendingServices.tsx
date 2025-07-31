'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LazyImage from '@/components/common/LazyImage';
import {
  FiChevronLeft,
  FiChevronRight,
  FiStar,
} from 'react-icons/fi';
import { FaMapMarkerAlt, FaClock, FaCoins } from 'react-icons/fa';

// Custom hook to load images on-demand (same as ServiceGrid)
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



// Service type definition
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
    ProfilePictureURL?: string;
  };
  author?: {
    name?: string;
    avatar?: string;
    profilePictureURL?: string;
  };
  Images?: string[];
  rating?: number;
  reviewCount?: number;
  Tiers?: Array<{ name: string; credits: number; title: string; description: string; features: string[]; availableTimeSlot: string; maxDays: number }>;
};

// Service Card Component
const ServiceCard = ({ service, index }: { service: Service; index: number }) => {
  const router = useRouter();
  const serviceId = service.ID || service.id;
  const { images, loading: imagesLoading } = useTaskImages(serviceId || '');
  
  const gradients = [
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600', 
    'from-green-400 to-green-600',
    'from-pink-400 to-pink-600',
    'from-indigo-400 to-indigo-600'
  ];
  const colors = [
    { bg: 'bg-blue-100', text: 'text-blue-600' },
    { bg: 'bg-purple-100', text: 'text-purple-600' },
    { bg: 'bg-green-100', text: 'text-green-600' },
    { bg: 'bg-pink-100', text: 'text-pink-600' },
    { bg: 'bg-indigo-100', text: 'text-indigo-600' }
  ];
  
  // Use service's own images first, then fallback to loaded images
  const imageUrl = service.Images?.[0] || images[0];
  
  const handleServiceClick = () => {
    const serviceId = service.ID || service.id;
    if (serviceId) {
      router.push(`/services/view/${serviceId}`);
    }
  };

  return (
    <div
      onClick={handleServiceClick}
      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1 min-w-[300px] max-w-[300px] snap-start flex-shrink-0"
    >
      {/* image */}
      <div className="h-32 relative">
        {imageUrl ? (
          <LazyImage
            src={imageUrl}
            alt={service.Title || service.title || 'Service'}
            className="w-full h-full object-cover"
            fill={true}
          />
        ) : imagesLoading ? (
          // Show grey shimmer loading while fetching images
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
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradients[index % gradients.length]}`}></div>
        )}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* content */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`inline-block px-2 py-1 ${colors[index % colors.length].bg} ${colors[index % colors.length].text} text-xs font-semibold rounded`}>
            {service.Category || service.category || 'General'}
          </span>
          <div className="flex items-center gap-1 text-sm font-bold text-green-600">
            <FaCoins className="w-4 h-4" />
            <span>
              {service.Tiers && service.Tiers.length > 0 
                ? service.Tiers.find((tier: any) => tier.name === 'Basic')?.credits || service.Tiers[0].credits
                : service.Credits || service.credits || 0
              }
            </span>
            {service.Tiers && service.Tiers.length > 0 && (
              <span className="text-xs text-gray-500 font-normal">(Basic)</span>
            )}
          </div>
        </div>
        <h3 className="font-semibold text-gray-900 mb-3">
          {service.Title || service.title || 'Service Title'}
        </h3>
        
        {/* Location and Time Details */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FaMapMarkerAlt className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="truncate max-w-[200px]">{service.Location || service.location || 'Online'}</span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded flex-shrink-0">
              {service.LocationType || service.locationType || 'Online'}
            </span>
          </div>
          
          {(service.Availability && service.Availability.length > 0) && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FaClock className="w-4 h-4 text-gray-400" />
              <span>{service.Availability[0].TimeFrom} - {service.Availability[0].TimeTo}</span>
            </div>
          )}
        </div>
        
        {/* Rating */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FiStar className="w-4 h-4 text-yellow-400" />
          <span>
            {service.rating || 4.5} 
            ({service.reviewCount || Math.floor(Math.random() * 50) + 10} reviews)
          </span>
        </div>
      </div>
    </div>
  );
};


export default function TrendingServices() {
  const router = useRouter();
  const rowRef = useRef<HTMLDivElement | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingServices = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || "http://localhost:8084";
        
        // Fetch services from public endpoint
        const response = await fetch(`${API_BASE_URL}/api/tasks/public`);
        
        if (!response.ok) {
          console.error('Failed to fetch trending services');
          setLoading(false);
          return;
        }

        const data = await response.json();
        const allServices = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        
        // Shuffle and take first 5 services for trending
        const shuffledServices = allServices
          .sort(() => Math.random() - 0.5)
          .slice(0, 5)
          .map((service: Service) => ({
            ...service,
            rating: service.rating || (Math.random() * 1 + 4).toFixed(2), // Random rating between 4-5
            reviewCount: service.reviewCount || Math.floor(Math.random() * 50) + 10 // Random review count
          }));

        setServices(shuffledServices);
      } catch (error) {
        console.error('Error fetching trending services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingServices();
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    const container = rowRef.current;
    if (!container) return;
    const shift = dir === 'left' ? -320 : 320; // pixel step
    container.scrollBy({ left: shift, behavior: 'smooth' });
  };



  return (
    <section className="bg-[#FAF6ED] py-30 px-4">
      <div className="max-w-7xl mx-auto">
        {/* heading */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold">Trending Services</h2>
            <p className="text-gray-500 mt-1">
              Most viewed and all-time top-selling services
            </p>
          </div>
          <button className="text-sm font-semibold text-gray-700 hover:text-black flex items-center">
            All Categories <span className="ml-1">→</span>
          </button>
        </div>

        {/* cards row */}
        <div className="relative">
          {/* horizontal list */}
          <div
            ref={rowRef}
            className="overflow-x-auto scroll-smooth whitespace-nowrap snap-x snap-mandatory no-scrollbar px-[2px]"
          >
            <div className="inline-flex gap-6">
              {loading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-sm min-w-[300px] max-w-[300px] snap-start flex-shrink-0 animate-pulse"
                  >
                    <div className="h-[200px] bg-gray-200 rounded-t-lg"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gray-200 rounded-full"></div>
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                services.map((service, index) => (
                  <ServiceCard key={service.ID || service.id} service={service} index={index} />
                ))
              )}
            </div>
          </div>

          {/* arrows */}
          <button
            onClick={() => scroll('left')}
            className="hidden md:flex absolute -left-5 top-[40%] bg-white rounded-full shadow p-2"
          >
            <FiChevronLeft />
          </button>
          <button
            onClick={() => scroll('right')}
            className="hidden md:flex absolute -right-5 top-[40%] bg-white rounded-full shadow p-2"
          >
            <FiChevronRight />
          </button>
        </div>
      </div>

      {/* local CSS */}
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaMapMarkerAlt, FaClock, FaStar, FaCoins } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import LazyImage from '@/components/common/LazyImage';

interface Service {
  id?: string;
  _id?: string;
  Title?: string;
  title?: string;
  Category?: string;
  category?: string;
  Type?: string;
  type?: string;
  Credits?: number;
  Price?: number;
  price?: number;
  Location?: string;
  location?: string;
  LocationType?: string;
  locationType?: string;
  Availability?: Array<{ TimeFrom: string; TimeTo: string }>;
  availability?: Array<{ TimeFrom: string; TimeTo: string }>;
  Images?: string[];
  images?: string[];
  status?: string;
  Status?: string;
  Tiers?: Array<{ name: string; credits: number; title: string; description: string; features: string[]; availableTimeSlot: string; maxDays: number }>;
}

interface ServiceSliderProps {
  services: Service[];
  title?: string;
  loading?: boolean;
  emptyMessage?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
  maxItems?: number;
}

export default function ServiceSlider({
  services,
  title = "My Services",
  loading = false,
  emptyMessage = "No services available",
  showViewAll = true,
  onViewAll,
  maxItems = 5
}: ServiceSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const gradients = [
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600', 
    'from-green-400 to-green-600',
    'from-pink-400 to-pink-600',
    'from-yellow-400 to-yellow-600',
    'from-orange-400 to-orange-600',
    'from-indigo-400 to-indigo-600',
    'from-red-400 to-red-600'
  ];

  const colors = [
    { bg: 'bg-blue-100', text: 'text-blue-600' },
    { bg: 'bg-purple-100', text: 'text-purple-600' },
    { bg: 'bg-green-100', text: 'text-green-600' },
    { bg: 'bg-pink-100', text: 'text-pink-600' },
    { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    { bg: 'bg-orange-100', text: 'text-orange-600' },
    { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    { bg: 'bg-red-100', text: 'text-red-600' }
  ];

  const displayedServices = services.slice(0, maxItems);

  const checkScrollButtons = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const slider = sliderRef.current;
    if (slider) {
      slider.addEventListener('scroll', checkScrollButtons);
      return () => slider.removeEventListener('scroll', checkScrollButtons);
    }
  }, [services]);

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const handleServiceClick = (service: Service) => {
    const serviceId = service.id || service._id;
    if (serviceId) {
      router.push(`/services/view/${serviceId}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl overflow-hidden p-6">
        <h3 className="text-lg font-bold mb-4 text-gray-900">{title}</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading services...</p>
        </div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="bg-white rounded-xl overflow-hidden p-6">
        <h3 className="text-lg font-bold mb-4 text-gray-900">{title}</h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FaStar className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl overflow-hidden p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {showViewAll && services.length > maxItems && (
          <button 
            onClick={onViewAll}
            className="text-sm text-emerald-600 hover:text-emerald-800 font-medium"
          >
            View all {services.length} →
          </button>
        )}
      </div>

      <div className="relative">
        {/* Navigation Buttons */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <FaChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
        )}
        
        {canScrollRight && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <FaChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        )}

        {/* Slider Container */}
        <div 
          ref={sliderRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayedServices.map((service, index) => {
            // Generate gradient background for image placeholder
            const gradients = [
              'from-pink-400 to-purple-500',
              'from-blue-400 to-cyan-500', 
              'from-green-400 to-teal-500',
              'from-yellow-400 to-orange-500',
              'from-purple-400 to-pink-500',
              'from-indigo-400 to-purple-500'
            ];
            
            const imageUrls = service.Images && Array.isArray(service.Images) ? service.Images : [];
            const image = imageUrls[0] || '';
            
            // Get service data
            const title = service.Title || service.title || 'Service Title';
            const category = service.Type || service.Category || service.category || 'Design & Creative';
            const rating = 4.5;
            const reviews = 12;
            const userName = 'Provider';
            const price = service.Tiers && service.Tiers.length > 0 
              ? service.Tiers.find((tier: any) => tier.name === 'Basic')?.credits || service.Tiers[0].credits
              : service.Credits || service.Price || service.price || 0;
            
            return (
              <div 
                key={service.id || service._id || index}
                className="flex-shrink-0 w-80 bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                onClick={() => handleServiceClick(service)}
              >
                {/* Header/Image Area with gradient border */}
                <div className="relative h-36 bg-gradient-to-br from-pink-100 to-purple-100">
                  {image ? (
                    <div className="w-full h-full">
                      <LazyImage
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover"
                        fill={true}
                      />
                    </div>
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center`}>
                      <div className="text-white text-4xl font-bold opacity-20">
                        {title.charAt(1) || 'S'}
                      </div>
                    </div>
                  )}
                  
                  {/* Arrow icon in top right */}
                  <div className="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-4 flex flex-col min-h-[180px]">
                  {/* Category */}
                  <div className="text-gray-500 text-sm mb-2">
                    {category}
                  </div>
                  
                  {/* Title */}
                  <h4 className="font-bold text-gray-700 text-lg mb-3 line-clamp-2">
                    {title}
                  </h4>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-4">
                    <FaStar className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-semibold text-gray-900">{rating}</span>
                    <span className="text-xs text-gray-500">({reviews} Review)</span>
                  </div>
                  
                  {/* Spacer to push author/price to bottom */}
                  <div className="flex-1"></div>
                  
                  {/* Border line */}
                  <div className="border-t border-gray-100 my-3"></div>
                  
                  {/* Provider and Price in one line - always at bottom */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-gray-600">
                          {userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{userName}</span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <FaCoins className="w-4 h-4 text-gray-400 inline mr-1 -mt-1" /> 
                      <span className="text-lg font-bold text-gray-900">{price}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Scroll Indicators */}
        {displayedServices.length > 3 && (
          <div className="flex justify-center mt-4 gap-1">
            {Array.from({ length: Math.ceil(displayedServices.length / 3) }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === Math.floor(currentIndex / 3) ? 'bg-emerald-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
} 
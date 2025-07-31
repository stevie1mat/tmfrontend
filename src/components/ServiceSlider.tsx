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
            const imageUrls = service.Images && Array.isArray(service.Images) ? service.Images : [];
            
            return (
              <div 
                key={service.id || service._id || index}
                className="flex-shrink-0 w-80 bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1 border border-gray-200"
                onClick={() => handleServiceClick(service)}
              >
                {/* Service Image */}
                <div className="h-32 relative">
                  {imageUrls.length > 0 ? (
                    <LazyImage
                      src={imageUrls[0]}
                      alt={service.Title || service.title || 'Service'}
                      className="w-full h-full object-cover"
                      fill={true}
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradients[index % gradients.length]}`}></div>
                  )}
                  <div className="absolute inset-0 bg-black/10"></div>
                </div>

                {/* Service Content */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-block px-2 py-1 ${colors[index % colors.length].bg} ${colors[index % colors.length].text} text-xs font-semibold rounded`}>
                      {service.Type || service.Category || service.category || 'SERVICE'}
                    </span>
                    <div className="flex items-center gap-1 text-sm font-bold text-green-600">
                      <FaCoins className="w-4 h-4" />
                      <span>
                        {service.Tiers && service.Tiers.length > 0 
                          ? service.Tiers.find((tier: any) => tier.name === 'Basic')?.credits || service.Tiers[0].credits
                          : service.Credits || service.Price || service.price || 0
                        }
                      </span>
                      {service.Tiers && service.Tiers.length > 0 && (
                        <span className="text-xs text-gray-500 font-normal">(Basic)</span>
                      )}
                    </div>
                  </div>

                  <h4 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                    {service.Title || service.title || 'Untitled Service'}
                  </h4>
                  
                  {/* Location and Time Details */}
                  <div className="space-y-1 mb-3">
                    {service.Location && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FaMapMarkerAlt className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate max-w-[180px]">{service.Location}</span>
                        {service.LocationType && (
                          <span className="text-xs bg-gray-100 px-1 py-0.5 rounded flex-shrink-0">
                            {service.LocationType}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {service.Availability && service.Availability.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FaClock className="w-3 h-3 text-gray-400" />
                        <span>{service.Availability[0].TimeFrom} - {service.Availability[0].TimeTo}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Status and Rating */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      service.status === 'completed' || service.status === 'Completed' 
                        ? 'bg-green-100 text-green-800' 
                        : service.status === 'in_progress' || service.status === 'In Progress'
                        ? 'bg-blue-100 text-blue-800'
                        : service.status === 'pending' || service.status === 'Pending'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {service.status === 'completed' || service.status === 'Completed' ? 'Completed' :
                       service.status === 'in_progress' || service.status === 'In Progress' ? 'In Progress' :
                       service.status === 'pending' || service.status === 'Pending' ? 'Pending' :
                       service.status || 'Active'}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <FaStar className="w-3 h-3 text-yellow-400" />
                      <span>4.5 (12)</span>
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
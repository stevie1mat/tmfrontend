'use client';

import { useState, useEffect, useCallback } from 'react';
import CategoryBanner from '@/components/CategoryBanner';
import ServiceFilters from '@/components/ServiceFilters';
import ServiceGrid from '@/components/ServiceGrid';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CategoryTabsWithBreadcrumb from '@/components/CategoriesWithBreadcrumbs';
import ProductBanner from '@/components/ProductBanner';
import ServicesBanner from '@/components/ServicesBanner';
import { FaArrowRight, FaBriefcase, FaUsers, FaLock, FaQuestionCircle } from 'react-icons/fa';
import { FiBriefcase, FiUsers, FiLock, FiHelpCircle } from 'react-icons/fi';
import ChatBotWithAuth from '@/components/ChatBotWithAuth';

interface FilterState {
  serviceOptions: string[];
  sellerDetails: string[];
  budget: string;
  deliveryTime: string;
  sortBy: string;
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
  Tiers?: Array<{ name: string; credits: number; title: string; description: string; features: string[]; availableTimeSlot: string; maxDays: number }>;
}

interface ApiResponse {
  data: Service[];
  total: number;
  limit: number;
  skip: number;
  hasMore: boolean;
  message: string;
}

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    serviceOptions: [],
    sellerDetails: [],
    budget: '',
    deliveryTime: '',
    sortBy: 'Best selling'
  });

  // Simplified API parameters - only essential filters
  const buildApiParams = useCallback((page: number = 0) => {
    const params = new URLSearchParams();
    const limit = 20;
    const skip = page * limit;
    
    params.append('limit', limit.toString());
    params.append('skip', skip.toString());

    // Only add category if selected
    if (filters.serviceOptions.length > 0) {
      params.append('category', filters.serviceOptions[0]);
    }

    // Only add sort if not default
    if (filters.sortBy !== 'Best selling') {
      const sortMap: Record<string, string> = {
        'Newest arrivals': 'newest',
        'Price: Low to High': 'price_asc',
        'Price: High to Low': 'price_desc',
        'Oldest': 'oldest'
      };
      params.append('sortBy', sortMap[filters.sortBy] || 'newest');
    }

    return params;
  }, [filters]);

  // Fetch services from backend with server-side filtering
  const fetchServices = useCallback(async (page: number = 0, reset: boolean = true) => {
    try {
      setLoading(true);
      const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || "http://localhost:8084";
      const params = buildApiParams(page);
      const response = await fetch(`${API_BASE_URL}/api/tasks/public?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      
      const data: ApiResponse = await response.json();
      
      if (reset) {
        setServices(data.data);
        setCurrentPage(0);
      } else {
        setServices(prev => [...prev, ...data.data]);
      }
      
      setTotalCount(data.total || 0);
      setHasMore(data.hasMore || false);
      setCurrentPage(page);
      
      console.log(`Fetched ${data.data?.length || 0} services (page ${page + 1})`);
    } catch (error) {
      console.error('Error fetching services:', error);
      if (reset) {
        setServices([]);
        setTotalCount(0);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  }, [buildApiParams]);

  // Initial load
  useEffect(() => {
    fetchServices(0, true);
  }, [fetchServices]);

  // Load more function for pagination
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchServices(currentPage + 1, false);
    }
  }, [loading, hasMore, currentPage, fetchServices]);

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    // Refetch with new filters
    fetchServices(0, true);
  };

  const handleSortChange = (sortBy: string) => {
    setFilters(prev => ({ ...prev, sortBy }));
    // Refetch with new sort
    fetchServices(0, true);
  };

  const features = [
    {
      icon: <FiBriefcase size={24} />,
      title: "Step 1: Post a task",
      desc: "Quickly describe the help you need. It's fast, free, and easy.",
    },
    {
      icon: <FiUsers size={24} />,
      title: "Step 2: Choose helpers",
      desc: "Browse trusted community members who are ready to help.",
    },
    {
      icon: <FiLock size={24} />,
      title: "Step 3: Swap securely",
      desc: "Earn and spend time credits — no payments, just fair trades.",
    },
    {
      icon: <FiHelpCircle size={24} />,
      title: "Support: We're here to help",
      desc: "Need support? Our team is here for you anytime.",
    },
  ];

  return (
    <main className="bg-white min-h-screen" style={{ color: '#111' }}>
      <Navbar />
      <br/>
      <CategoryTabsWithBreadcrumb />
      <ServicesBanner/>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-6">
            {/* Service Filters Skeleton */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                  <div className="h-6 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-10 bg-gray-200 rounded w-32"></div>
                  <div className="h-10 bg-gray-200 rounded w-40"></div>
                </div>
              </div>
            </div>

            {/* Service Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                  {/* Image Skeleton */}
                  <div className="h-48 bg-gray-200"></div>
                  
                  {/* Content Skeleton */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-5 bg-gray-200 rounded w-20"></div>
                      <div className="h-5 bg-gray-200 rounded w-16"></div>
                    </div>
                    
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-8"></div>
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                    
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Skeleton */}
            <div className="mt-8">
              <div className="text-center mb-6">
                <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
              </div>
              
              <div className="flex justify-center items-center gap-2">
                <div className="h-10 bg-gray-200 rounded w-20"></div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-10 bg-gray-200 rounded w-10"></div>
                  ))}
                </div>
                <div className="h-10 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <ServiceFilters 
              onFiltersChange={handleFiltersChange}
              totalResults={totalCount}
              onSortChange={handleSortChange}
            />
            <ServiceGrid items={services} />
          </>
        )}
        
        {/* Enhanced Pagination */}
        {services && services.length > 0 && (
          <div className="mt-8">
            {/* Results Summary */}
            <div className="text-center mb-6 text-gray-600">
              Showing {services.length} of {totalCount} services
            </div>
            
            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-2">
              {/* Previous Button */}
              <button
                onClick={() => fetchServices(Math.max(0, currentPage - 1), true)}
                disabled={currentPage === 0 || loading}
                className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, Math.ceil(totalCount / 20)) }, (_, i) => {
                  const pageNum = i + 1;
                  const isActive = currentPage === i;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => fetchServices(i, true)}
                      disabled={loading}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-emerald-600 text-white'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              {/* Next Button */}
              <button
                onClick={() => fetchServices(currentPage + 1, true)}
                disabled={!hasMore || loading}
                className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            
            {/* Load More Button (Alternative) */}
            {hasMore && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More
                      <FaArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* How TradeMinutes Works Section - Full Width */}
      <section className="py-36 bg-[#FAF6ED] w-full mt-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How TradeMinutes Works
            </h2>
                          <p className="text-gray-600 mb-6 max-w-md">
                Get help from trusted community members — no money involved. 
                Simply post what you need, choose your helper, and swap skills securely.
              </p>
          </div>

          {/* Right icons list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {features.map(({ icon, title, desc }, index) => (
              <div key={index} className="flex flex-col items-start space-y-2">
                <div className="bg-grey-600 text-emerald-700 p-3 rounded-full">
                  {icon}
                </div>
                <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
      <ChatBotWithAuth />
    </main>
  );
}

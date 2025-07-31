"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { FaSearch, FaFilter, FaTimes, FaStar, FaMapMarkerAlt, FaClock, FaCoins, FaBrain } from 'react-icons/fa';
// Removed: import LoadingSpinner from '@/components/common/LoadingSpinner';
import LazyImage from '@/components/common/LazyImage';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import SearchBanner from '@/components/SearchBanner';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';

// Real service type based on API response
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
};

// AI Agent type
type AIAgent = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  features: string[];
  demoUrl: string;
  isFavorite: boolean;
  type: 'ai-agent';
};

// Demo AI Agents Data
const demoAgents: AIAgent[] = [
  {
    id: 'ai-1',
    name: 'Content Writer Pro',
    description: 'AI-powered content creation assistant that writes engaging blog posts, articles, and marketing copy.',
    category: 'Content Creation',
    price: 29,
    rating: 4.8,
    reviews: 1247,
    image: 'https://images.stockcake.com/public/1/1/f/11fc6018-f8a9-4eb4-bf60-0700a6a8f677_large/pathway-to-possibility-stockcake.jpg',
    features: ['SEO Optimization', 'Multiple Languages', 'Tone Adjustment', 'Plagiarism Check'],
    demoUrl: '/demo/content-writer',
    isFavorite: false,
    type: 'ai-agent',
  },
  {
    id: 'ai-2',
    name: 'Data Analyst Bot',
    description: 'Intelligent data analysis and visualization agent that processes complex datasets and generates insights.',
    category: 'Data Analysis',
    price: 49,
    rating: 4.9,
    reviews: 892,
    image: 'https://images.stockcake.com/public/1/b/1/1b13d39c-4efb-459d-8100-0eb827c4be00_large/digital-market-waves-stockcake.jpg',
    features: ['Excel Integration', 'Chart Generation', 'Statistical Analysis', 'Report Creation'],
    demoUrl: '/demo/data-analyst',
    isFavorite: true,
    type: 'ai-agent',
  },
  {
    id: 'ai-3',
    name: 'Customer Support AI',
    description: '24/7 customer service agent that handles inquiries, resolves issues, and provides instant support.',
    category: 'Customer Service',
    price: 39,
    rating: 4.7,
    reviews: 2156,
    image: 'https://images.stockcake.com/public/b/9/9/b9904d56-b224-4b54-a297-5dc45c8483f5_large/digital-message-glow-stockcake.jpg',
    features: ['Multi-language Support', 'Ticket Management', 'FAQ Integration', 'Escalation Logic'],
    demoUrl: '/demo/customer-support',
    isFavorite: false,
    type: 'ai-agent',
  },
  {
    id: 'ai-4',
    name: 'Code Assistant',
    description: 'Programming companion that helps with code review, debugging, and generating code snippets.',
    category: 'Development',
    price: 59,
    rating: 4.9,
    reviews: 1567,
    image: 'https://images.stockcake.com/public/b/a/e/bae96ed6-0e0f-4e3b-a42e-a9d21c5e0db7_large/digital-dream-weaver-stockcake.jpg',
    features: ['Multiple Languages', 'Code Review', 'Bug Detection', 'Documentation'],
    demoUrl: '/demo/code-assistant',
    isFavorite: false,
    type: 'ai-agent',
  },
];

// Custom hook for batch image loading
const useBatchImages = (services: Service[]) => {
  const [images, setImages] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (services.length === 0) return;

    const loadBatchImages = async () => {
      setLoading(true);
      try {
        const taskIds = services
          .map(s => s.ID || s.id)
          .filter(id => id)
          .join(',');

        if (!taskIds) return;

        const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || "http://localhost:8084";
        // Use compression for better performance: 70% quality, 600px max width
        const response = await fetch(`${API_BASE_URL}/api/tasks/images/batch?taskIds=${taskIds}&quality=70&width=600`);
        
        if (response.ok) {
          const data = await response.json();
          setImages(data.images || {});
        }
      } catch (error) {
        console.error('Error loading batch images:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBatchImages();
  }, [services]);

  return { images, loading };
};

// Custom hook for batch avatar loading
const useBatchAvatars = (services: Service[]) => {
  const [avatars, setAvatars] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (services.length === 0) return;

    const loadBatchAvatars = async () => {
      setLoading(true);
      try {
        // Get unique author IDs that don't already have avatars in the service data
        const authorIds = services
          .filter(s => {
            const hasAvatar = s.Author?.Avatar || s.author?.avatar;
            return !hasAvatar && (s.Author?.ID || s.Author?.id || s.author?.id);
          })
          .map(s => s.Author?.ID || s.Author?.id || s.author?.id)
          .filter((id, index, arr) => arr.indexOf(id) === index) // Remove duplicates
          .join(',');

        if (!authorIds) {
          setLoading(false);
          return;
        }

        const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || "http://localhost:8084";
        // Use maximum compression for avatars: 50% quality, 64px max width
        const response = await fetch(`${API_BASE_URL}/api/tasks/avatar/batch?authorIds=${authorIds}&quality=50&width=64`);
        
        if (response.ok) {
          const data = await response.json();
          setAvatars(data.avatars || {});
        }
      } catch (error) {
        console.error('Error loading batch avatars:', error);
      } finally {
        setLoading(false);
      }
    };

    // Start loading immediately
    loadBatchAvatars();
  }, [services]);

  return { avatars, loading };
};

export default function SearchResultsPageWrapper() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white text-gray-900 font-sans">
        <Navbar />
        
        {/* Search Banner Skeleton */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center">
              <div className="h-8 bg-white/20 rounded animate-pulse w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-white/20 rounded animate-pulse w-96 mx-auto mb-6"></div>
              <div className="h-12 bg-white/20 rounded-lg animate-pulse w-full max-w-2xl mx-auto"></div>
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar Skeleton */}
            <div className="lg:w-1/4">
              <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-16 mb-4"></div>
                
                {/* Type Filter Skeleton */}
                <div className="mb-6">
                  <div className="h-4 bg-gray-200 rounded w-12 mb-2"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                
                {/* Category Filter Skeleton */}
                <div className="mb-6">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                </div>
                
                {/* Price Range Filter Skeleton */}
                <div className="mb-6">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded w-28"></div>
                    ))}
                  </div>
                </div>
                
                {/* Rating Filter Skeleton */}
                <div className="mb-6">
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded w-24"></div>
                    ))}
                  </div>
                </div>
                
                {/* Clear Filters Button Skeleton */}
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            </div>

            {/* Results Section Skeleton */}
            <div className="lg:w-3/4">
              {/* Results Header Skeleton */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-8 bg-gray-200 rounded w-32"></div>
                </div>
              </div>

              {/* Results Grid Skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                    {/* Image Skeleton */}
                    <div className="h-32 bg-gray-200"></div>
                    
                    {/* Content Skeleton */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </div>
                      
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                      
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <Footer />
      </main>
    }>
      <SearchResultsPage />
    </Suspense>
  );
}

function SearchResultsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const query = searchParams?.get('q') || '';
  const category = searchParams?.get('category') || '';
  const [results, setResults] = useState<Service[]>([]);
  const [aiAgentResults, setAiAgentResults] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Filter state management
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(['services', 'ai-agents']));
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<Set<string>>(new Set(['0-25', '26-50', '51-100', '100+']));
  const [selectedRatings, setSelectedRatings] = useState<Set<string>>(new Set(['4.5+', '4.0+', '3.5+']));

  // Use batch loading hooks for images and avatars
  const { images, loading: imagesLoading } = useBatchImages(results);
  const { avatars, loading: avatarsLoading } = useBatchAvatars(results);

  // Helper function to check if service belongs to current user
  const isOwnService = (service: Service) => {
    if (!user) return false;
    const serviceAuthorId = service.Author?.ID || service.Author?.id || service.author?.id;
    const currentUserId = user.ID || user.id;
    return serviceAuthorId === currentUserId;
  };

  // Helper function to get service price
  const getServicePrice = (service: Service) => {
    if (service.Tiers && service.Tiers.length > 0) {
      return service.Tiers.find((tier: any) => tier.name === 'Basic')?.credits || service.Tiers[0].credits;
    }
    return service.Credits || service.credits || 0;
  };

  // Helper function to check if price matches selected ranges
  const matchesPriceRange = (price: number) => {
    const ranges = Array.from(selectedPriceRanges);
    return ranges.some(range => {
      switch (range) {
        case '0-25': return price >= 0 && price <= 25;
        case '26-50': return price >= 26 && price <= 50;
        case '51-100': return price >= 51 && price <= 100;
        case '100+': return price >= 100;
        default: return true;
      }
    });
  };

  // Helper function to check if rating matches selected ratings
  const matchesRating = (rating: number) => {
    const ratings = Array.from(selectedRatings);
    return ratings.some(r => {
      switch (r) {
        case '4.5+': return rating >= 4.5;
        case '4.0+': return rating >= 4.0;
        case '3.5+': return rating >= 3.5;
        default: return true;
      }
    });
  };

  // Filter results based on selected filters
  const getFilteredResults = () => {
    let filteredServices = results;
    let filteredAgents = aiAgentResults;

    // Filter by type
    if (!selectedTypes.has('services')) {
      filteredServices = [];
    }
    if (!selectedTypes.has('ai-agents')) {
      filteredAgents = [];
    }

    // Filter services by price and rating
    if (selectedTypes.has('services')) {
      filteredServices = results.filter(service => {
        const price = getServicePrice(service);
        const rating = service.rating || 4.5;
        return matchesPriceRange(price) && matchesRating(rating);
      });
    }

    // Filter AI agents by price and rating
    if (selectedTypes.has('ai-agents')) {
      filteredAgents = aiAgentResults.filter(agent => {
        return matchesPriceRange(agent.price) && matchesRating(agent.rating);
      });
    }

    return { filteredServices, filteredAgents };
  };

  // Handle type filter changes
  const handleTypeChange = (type: string, checked: boolean) => {
    const newTypes = new Set(selectedTypes);
    if (checked) {
      newTypes.add(type);
    } else {
      newTypes.delete(type);
    }
    setSelectedTypes(newTypes);
  };

  // Handle price range filter changes
  const handlePriceRangeChange = (range: string, checked: boolean) => {
    const newRanges = new Set(selectedPriceRanges);
    if (checked) {
      newRanges.add(range);
    } else {
      newRanges.delete(range);
    }
    setSelectedPriceRanges(newRanges);
  };

  // Handle rating filter changes
  const handleRatingChange = (rating: string, checked: boolean) => {
    const newRatings = new Set(selectedRatings);
    if (checked) {
      newRatings.add(rating);
    } else {
      newRatings.delete(rating);
    }
    setSelectedRatings(newRatings);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedTypes(new Set(['services', 'ai-agents']));
    setSelectedPriceRanges(new Set(['0-25', '26-50', '51-100', '100+']));
    setSelectedRatings(new Set(['4.5+', '4.0+', '3.5+']));
  };

  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      setError('');

      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || "http://localhost:8084";
        
        let response;
        
        // If no query and no category, fetch all services
        if (!query.trim() && !category) {
          response = await fetch(`${API_BASE_URL}/api/tasks/public?limit=50`);
        } else {
          // Build search URL with parameters
          const searchParams = new URLSearchParams();
          if (query.trim()) searchParams.append('q', query.trim());
          if (category) searchParams.append('category', category);
          searchParams.append('limit', '50'); // Get more results for search
          
          // Use the new optimized search endpoint
          response = await fetch(`${API_BASE_URL}/api/tasks/search?${searchParams.toString()}`);
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch search results');
        }

        const data = await response.json();
        console.log('Search API response:', data);
        
        const services = data && Array.isArray(data.data) ? data.data : [];
        console.log('Services from search:', services);

        setResults(services);

        // Filter AI agents based on search query and category
        const filteredAgents = demoAgents.filter(agent => {
          const matchesQuery = !query.trim() || 
            agent.name.toLowerCase().includes(query.toLowerCase()) ||
            agent.description.toLowerCase().includes(query.toLowerCase()) ||
            agent.category.toLowerCase().includes(query.toLowerCase());
          
          const matchesCategory = !category || agent.category === category;
          
          return matchesQuery && matchesCategory;
        });

        setAiAgentResults(filteredAgents);
      } catch (err) {
        console.error('Error fetching search results:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch search results');
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, category]);

  const handleServiceClick = (service: Service) => {
    const serviceId = service.ID || service.id;
    if (serviceId) {
      router.push(`/services/view/${serviceId}`);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };

  // Get filtered results
  const { filteredServices, filteredAgents } = getFilteredResults();

  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Navbar */}
      <Navbar />

      {/* Search Banner */}
      <SearchBanner 
        query={query} 
        category={category} 
        resultCount={filteredServices.length + filteredAgents.length} 
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters and Results */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
              <h3 className="text-lg font-semibold mb-4">Filters</h3>
              
              {/* Type Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={selectedTypes.has('services')}
                      onChange={(e) => handleTypeChange('services', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm">Services</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={selectedTypes.has('ai-agents')}
                      onChange={(e) => handleTypeChange('ai-agents', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm flex items-center">
                      <FaBrain className="w-4 h-4 mr-1 text-purple-500" />
                      AI Agents
                    </span>
                  </label>
                </div>
              </div>
              
              {/* Category Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select 
                  value={category} 
                  onChange={(e) => {
                    const params = new URLSearchParams();
                    params.append('q', query);
                    if (e.target.value) params.append('category', e.target.value);
                    router.push(`/services/search?${params.toString()}`);
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {/* Service Categories */}
                  <optgroup label="Services">
                    <option value="Academic Help">Academic Help</option>
                    <option value="Tech & Digital Skills">Tech & Digital Skills</option>
                    <option value="Creative & Arts">Creative & Arts</option>
                    <option value="Personal Development">Personal Development</option>
                    <option value="Language & Culture">Language & Culture</option>
                    <option value="Health & Wellness">Health & Wellness</option>
                    <option value="Handy Skills & Repair">Handy Skills & Repair</option>
                    <option value="Everyday Help">Everyday Help</option>
                    <option value="Administrative & Misc Help">Administrative & Misc Help</option>
                    <option value="Social & Community">Social & Community</option>
                    <option value="Entrepreneurship & Business">Entrepreneurship & Business</option>
                    <option value="Specialized Skills">Specialized Skills</option>
                    <option value="Other">Other</option>
                  </optgroup>
                  {/* AI Agent Categories */}
                  <optgroup label="AI Agents">
                    <option value="Content Creation">Content Creation</option>
                    <option value="Data Analysis">Data Analysis</option>
                    <option value="Customer Service">Customer Service</option>
                    <option value="Development">Development</option>
                  </optgroup>
                </select>
              </div>

              {/* Price Range Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range (Credits)</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={selectedPriceRanges.has('0-25')}
                      onChange={(e) => handlePriceRangeChange('0-25', e.target.checked)}
                      className="mr-2" 
                    />
                    <span className="text-sm">0 - 25 credits</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={selectedPriceRanges.has('26-50')}
                      onChange={(e) => handlePriceRangeChange('26-50', e.target.checked)}
                      className="mr-2" 
                    />
                    <span className="text-sm">26 - 50 credits</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={selectedPriceRanges.has('51-100')}
                      onChange={(e) => handlePriceRangeChange('51-100', e.target.checked)}
                      className="mr-2" 
                    />
                    <span className="text-sm">51 - 100 credits</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={selectedPriceRanges.has('100+')}
                      onChange={(e) => handlePriceRangeChange('100+', e.target.checked)}
                      className="mr-2" 
                    />
                    <span className="text-sm">100+ credits</span>
                  </label>
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={selectedRatings.has('4.5+')}
                      onChange={(e) => handleRatingChange('4.5+', e.target.checked)}
                      className="mr-2" 
                    />
                    <span className="text-sm flex items-center">
                      <FaStar className="text-yellow-400 mr-1" />
                      4.5+ stars
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={selectedRatings.has('4.0+')}
                      onChange={(e) => handleRatingChange('4.0+', e.target.checked)}
                      className="mr-2" 
                    />
                    <span className="text-sm flex items-center">
                      <FaStar className="text-yellow-400 mr-1" />
                      4.0+ stars
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={selectedRatings.has('3.5+')}
                      onChange={(e) => handleRatingChange('3.5+', e.target.checked)}
                      className="mr-2" 
                    />
                    <span className="text-sm flex items-center">
                      <FaStar className="text-yellow-400 mr-1" />
                      3.5+ stars
                    </span>
                  </label>
                </div>
              </div>

              {/* Clear Filters */}
              <button 
                onClick={clearAllFilters}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md text-sm hover:bg-gray-200 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:w-3/4">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredServices.length + filteredAgents.length} result{(filteredServices.length + filteredAgents.length) !== 1 ? 's' : ''} found
                  {filteredServices.length > 0 && filteredAgents.length > 0 && (
                    <span className="ml-2">
                      ({filteredServices.length} services, {filteredAgents.length} AI agents)
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Sort by:</span>
                <select className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Relevance</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Rating</option>
                  <option>Newest</option>
                </select>
              </div>
            </div>

            {/* Results */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
                    {/* Image Skeleton */}
                    <div className="h-32 bg-gray-200"></div>
                    
                    {/* Content Skeleton */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                      </div>
                      
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                      
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
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="text-red-500 text-lg mb-4">{error}</div>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (filteredServices.length === 0 && filteredAgents.length === 0) ? (
              <div className="text-center py-16">
                <div className="text-gray-500 text-lg mb-4">
                  No services or AI agents found matching your filters.
                </div>
                <p className="text-gray-400 mb-6">
                  Try adjusting your search terms or filters.
                </p>
                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => router.push('/')}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Browse All Services
                  </button>
                  <button 
                    onClick={() => router.push('/ai-agents')}
                    className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Browse AI Agents
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map((service, index) => {
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
                  const userName = service.Author?.Name || service.Author?.name || service.author?.name || 'Provider';
                  const authorId = service.Author?.ID || service.Author?.id || service.author?.id;
                  const price = getServicePrice(service);
                  const location = service.Location || service.location || 'Online';
                  const locationType = service.LocationType || service.locationType || 'Online';
                  const availability = service.Availability || service.availability || [];
                  
                  // Use batch-loaded images and avatars
                  const serviceImages = serviceId ? images[serviceId] || [] : [];
                  const image = service.Images?.[0] || serviceImages[0] || '';
                  
                  // Prioritize service's own avatar, then batch-loaded avatar
                  const serviceAvatar = service.Author?.Avatar || service.author?.avatar;
                  const batchAvatar = authorId ? avatars[authorId] || '' : '';
                  const avatar = serviceAvatar || batchAvatar;
                  
                  return (
                    <div
                      key={serviceId || index}
                      onClick={() => handleServiceClick(service)}
                      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
                    >
                      {/* Image */}
                      <div className="h-32 relative">
                        {image ? (
                          <LazyImage
                            src={image}
                            alt={title || 'Service'}
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
                      
                      {/* Content */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`inline-block px-2 py-1 ${colors[index % colors.length].bg} ${colors[index % colors.length].text} text-xs font-semibold rounded`}>
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
                                alt={userName}
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
                      </div>
                    </div>
                  );
                })}
                
                {/* AI Agent Cards */}
                {filteredAgents.map((agent, index) => (
                  <div
                    key={`ai-${agent.id}`}
                    onClick={() => router.push(agent.demoUrl)}
                    className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
                  >
                    {/* Image */}
                    <div className="h-32 relative">
                      <LazyImage
                        src={agent.image}
                        alt={agent.name}
                        className="w-full h-full object-cover"
                        fill={true}
                      />
                      <div className="absolute inset-0 bg-black/20"></div>
                      {/* AI Agent Badge */}
                      <div className="absolute top-2 left-2 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <FaBrain className="w-3 h-3" />
                        AI Agent
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="inline-block px-2 py-1 bg-purple-100 text-purple-600 text-xs font-semibold rounded">
                          {agent.category}
                        </span>
                        <div className="flex items-center gap-1 text-sm font-bold text-green-600">
                          <FaCoins className="w-4 h-4" />
                          <span>{agent.price}</span>
                        </div>
                      </div>
                      
                      <h4 className="font-semibold text-gray-900 mb-3">
                        {agent.name}
                      </h4>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {agent.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <FaStar className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm font-semibold text-gray-900">{agent.rating}</span>
                          <span className="text-xs text-gray-500">({agent.reviews})</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle favorite
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <FaStar className={`w-4 h-4 ${agent.isFavorite ? 'text-red-500 fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(agent.demoUrl);
                            }}
                            className="bg-purple-500 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-purple-600 transition-colors"
                          >
                            Demo
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
        onAuthSuccess={() => {
          // After successful login, redirect to the service details
          // The user can now book appointments
          console.log('User authenticated successfully');
        }}
      />
    </main>
  );
} 
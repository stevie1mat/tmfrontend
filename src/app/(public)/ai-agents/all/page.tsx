'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AIAgentsBanner from '@/components/AIAgentsBanner';
import CategoryTabsWithBreadcrumb from '@/components/CategoriesWithBreadcrumbs';
import ChatBotWithAuth from '@/components/ChatBotWithAuth';
import AIAgentCard from '@/components/AIAgentCard';
import { getOptimizedImageUrl } from '@/lib/cloudinary';
import { FaArrowRight, FaCoins, FaTimes } from 'react-icons/fa';
import { FiCpu, FiZap, FiUsers, FiTrendingUp } from 'react-icons/fi';
import AuthModal from '@/components/AuthModal';

interface FilterState {
  agentTypes: string[];
  complexity: string;
  sortBy: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  credits: number;
  coverImage: string;
  nodes: any[];
  edges: any[];
  createdAt: number;
  userId: string;
}

interface ApiResponse {
  data: Workflow[];
  total: number;
  limit: number;
  skip: number;
  hasMore: boolean;
  message: string;
}

// Credit Warning Dialog Component
function CreditWarningDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  workflow 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  workflow: Workflow | null; 
}) {
  if (!isOpen || !workflow) return null;

  const isFree = !workflow.credits || workflow.credits === 0;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {isFree ? '🆓 Free AI Agent' : '💳 Credit Required'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {isFree ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <FaCoins className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                {workflow.name}
              </h4>
              <p className="text-gray-600 mb-4">
                This AI agent is completely free to use!
              </p>
              <p className="text-sm text-gray-500">
                You can chat without any credit cost.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <FaCoins className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                {workflow.name}
              </h4>
              <p className="text-gray-600 mb-4">
                This AI agent costs <span className="font-semibold text-blue-600">{workflow.credits} credits</span> per chat session.
              </p>
              <p className="text-sm text-gray-500">
                Credits will be deducted from your account when you send your first message.
              </p>
            </div>
          )}
        </div>
        
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition ${
              isFree 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isFree ? 'Start Chatting' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AIAgents() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>({
    agentTypes: [],
    complexity: '',
    sortBy: 'Most Popular'
  });

  const API_BASE_URL = process.env.NEXT_PUBLIC_AGENTIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8002';
  const WORKFLOW_API_URL = `${API_BASE_URL}/api/workflows/public`;



  // Simplified API parameters - moved inside fetchWorkflows to avoid dependency issues

  // Fetch public workflows from API
  const fetchWorkflows = useCallback(async (page: number = 0, reset: boolean = true) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build API parameters
      const params = new URLSearchParams();
      const limit = 20;
      const skip = page * limit;
      
      params.append('limit', limit.toString());
      params.append('skip', skip.toString());

      if (filters.agentTypes.length > 0) {
        params.append('type', filters.agentTypes[0]);
      }

      if (filters.complexity && filters.complexity !== 'Any Complexity') {
        params.append('complexity', filters.complexity);
      }

      if (filters.sortBy !== 'Most Popular') {
        const sortMap: Record<string, string> = {
          'Newest': 'newest',
          'Highest Rated': 'rating_desc',
          'Most Used': 'usage_desc',
          'Oldest': 'oldest'
        };
        params.append('sortBy', sortMap[filters.sortBy] || 'newest');
      }
      
      const response = await fetch(`${WORKFLOW_API_URL}?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch workflows');
      }
      
      const data = await response.json();
      const workflowsData = Array.isArray(data) ? data : (data.data || []);
      
      if (reset) {
        setWorkflows(workflowsData);
        setCurrentPage(0);
      } else {
        setWorkflows(prev => [...prev, ...workflowsData]);
      }
      
      setTotalCount(workflowsData.length);
      setHasMore(workflowsData.length >= 20); // Assume more if we got full page
      setCurrentPage(page);
      
      console.log(`Fetched ${workflowsData.length} workflows (page ${page + 1})`);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      setError('Failed to load AI agents. Please try again.');
      if (reset) {
        setWorkflows([]);
        setTotalCount(0);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  }, [filters, WORKFLOW_API_URL]);

  // Initial load
  useEffect(() => {
    fetchWorkflows(0, true);
  }, [fetchWorkflows]);

  // Load more function for pagination
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchWorkflows(currentPage + 1, false);
    }
  }, [loading, hasMore, currentPage, fetchWorkflows]);

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    fetchWorkflows(0, true);
  };

  const handleSortChange = (sortBy: string) => {
    setFilters(prev => ({ ...prev, sortBy }));
    fetchWorkflows(0, true);
  };

  // Handle workflow actions for public marketplace
  function handleTryWorkflow(workflowId: string) {
    const workflow = workflows.find(wf => wf.id === workflowId);
    if (!workflow) return;

    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      // Show auth modal if not authenticated
      setSelectedWorkflow(workflow);
      setShowAuthModal(true);
      return;
    }

    // Show credit warning dialog for all workflows
    setSelectedWorkflow(workflow);
    setShowCreditDialog(true);
  }

  // Handle dialog confirmation
  function handleDialogConfirm() {
    if (!selectedWorkflow) return;
    
    setShowCreditDialog(false);
    // Navigate to chat interface with public parameter
    router.push(`/ai-agents/workflow-chat/${selectedWorkflow.id}?public=true`);
  }

  function handleEditWorkflow(workflowId: string) {
    const workflow = workflows.find(wf => wf.id === workflowId);
    if (workflow) {
      // Save to localStorage for the create-workflow page to pick up
      localStorage.setItem('tm-loaded-workflow', JSON.stringify({ 
        nodes: workflow.nodes, 
        edges: workflow.edges, 
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        credits: workflow.credits,
        coverImage: workflow.coverImage
      }));
      router.push('/ai-agents/create-workflow');
    }
  }

  const features = [
    {
      icon: <FiCpu size={24} />,
      title: "Step 1: Choose an AI Agent",
      desc: "Browse our collection of specialized AI agents for different tasks.",
    },
    {
      icon: <FiZap size={24} />,
      title: "Step 2: Customize & Configure",
      desc: "Adjust settings and prompts to match your specific needs.",
    },
    {
      icon: <FiUsers size={24} />,
      title: "Step 3: Generate Results",
      desc: "Get high-quality AI-generated content in seconds.",
    },
    {
      icon: <FiTrendingUp size={24} />,
      title: "Support: Continuous Improvement",
      desc: "Our agents learn and improve with every interaction.",
    },
  ];

  return (
    <main className="bg-white min-h-screen" style={{ color: '#111' }}>
      <Navbar />
      <br/>
      <CategoryTabsWithBreadcrumb />
      <AIAgentsBanner />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-6">
            {/* AI Agent Filters Skeleton */}
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

            {/* AI Agent Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse border border-gray-100">
                  {/* Header Skeleton */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                      <div>
                        <div className="h-5 bg-gray-200 rounded w-24 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  
                  {/* Content Skeleton */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-8"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      <div className="h-5 bg-gray-200 rounded w-16"></div>
                      <div className="h-5 bg-gray-200 rounded w-20"></div>
                      <div className="h-5 bg-gray-200 rounded w-14"></div>
                    </div>
                    
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* AI Agent Filters */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-gray-700 font-medium">
                    {totalCount} AI Agents
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-500 text-sm">
                    Powered by Mistral AI
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Complexity Filter */}
                  <select
                    value={filters.complexity}
                    onChange={(e) => handleFiltersChange({ ...filters, complexity: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Any Complexity</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                  
                  {/* Sort Filter */}
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Most Popular">Most Popular</option>
                    <option value="Newest">Newest</option>
                    <option value="Highest Rated">Highest Rated</option>
                    <option value="Most Used">Most Used</option>
                    <option value="Oldest">Oldest</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && workflows.length === 0 && !error && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <FiCpu className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Agents Found</h3>
                <p className="text-gray-500">There are no public AI agents available at the moment.</p>
              </div>
            )}

            {/* AI Agent Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {workflows.map(workflow => {
                // Map workflow to AIAgentCard props (same as my-workflows page)
                const agent = {
                  id: workflow.id,
                  name: workflow.name,
                  description: workflow.description || workflow.nodes?.map((n: any) => n.data?.description).find((desc: string) => desc && desc.trim()) || 'No description',
                  category: 'AI Agent',
                  price: workflow.credits || 0,
                  rating: 5,
                  reviews: 0,
                  image: workflow.coverImage && workflow.coverImage.trim() !== '' && workflow.coverImage !== 'undefined'
                    ? getOptimizedImageUrl(workflow.coverImage, { width: 400, height: 300, quality: 80 })
                    : 'https://images.stockcake.com/public/1/1/f/11fc6018-f8a9-4eb4-bf60-0700a6a8f677_large/pathway-to-possibility-stockcake.jpg',
                  features: workflow.nodes?.map((n: any) => n.data?.label).filter(Boolean) || [],
                  isFavorite: false,
                };
                
                return (
                  <AIAgentCard
                    key={workflow.id}
                    agent={agent}
                    onDemo={() => handleTryWorkflow(workflow.id)}
                    isPublicMarketplace={true}
                  />
                );
              })}
            </div>
          </>
        )}
        
        {/* Enhanced Pagination */}
        {workflows && workflows.length > 0 && (
          <div className="mt-8">
            {/* Results Summary */}
            <div className="text-center mb-6 text-gray-600">
              Showing {workflows.length} of {totalCount} AI agents
            </div>
            
            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-8 rounded-lg transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      Load More AI Agents
                      <FaArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* How AI Agents Work Section */}
      <section className="py-36 bg-gradient-to-br from-blue-50 to-purple-50 w-full mt-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How AI Agents Work
            </h2>
            <p className="text-gray-600 mb-6 max-w-md">
              Harness the power of specialized AI agents designed for specific tasks. 
              Each agent is optimized with custom prompts and settings for maximum effectiveness.
            </p>
          </div>

          {/* Right icons list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {features.map(({ icon, title, desc }, index) => (
              <div key={index} className="flex flex-col items-start space-y-2">
                <div className="bg-white text-blue-600 p-3 rounded-full shadow-sm">
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
      <CreditWarningDialog
        isOpen={showCreditDialog}
        onClose={() => setShowCreditDialog(false)}
        onConfirm={handleDialogConfirm}
        workflow={selectedWorkflow}
      />
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={() => {
          setShowAuthModal(false);
          // After successful login, show the credit dialog for the selected workflow
          if (selectedWorkflow) {
            setShowCreditDialog(true);
          }
        }}
        defaultMode="login"
      />
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";

import LoadingSpinner from "@/components/common/LoadingSpinner";
import { 
  FaStar, 
  FaFilter, 
  FaSort, 
  FaSearch, 
  FaCalendar, 
  FaUser, 
  FaThumbsUp, 
  FaThumbsDown,
  FaReply,
  FaFlag,
  FaHeart,
  FaShare,
  FaBookmark,
  FaChartBar,
  FaList,
  FaList as FaGrid,
  FaEye,
  FaDownload,
  FaRedo,
  FaCheckCircle,
  FaClock,
  FaDollarSign,
  FaTag,
  FaMapMarkerAlt,
  FaGlobe,
  FaArrowUp,
  FaArrowDown,
  FaStarHalfAlt,
  FaRegStar,
  FaStarHalfAlt as FaRegStarHalfAlt
} from "react-icons/fa";

interface Review {
  id: string;
  reviewerId: string;
  revieweeId: string;
  taskId: string;
  taskTitle: string;
  taskCategory: string;
  taskPrice: number;
  rating: number;
  comment: string;
  createdAt: number;
  reviewerName: string;
  reviewerAvatar?: string;
  reviewerLocation?: string;
  isVerified: boolean;
  helpfulCount: number;
  replyCount: number;
  status: 'published' | 'pending' | 'flagged';
  tags: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: { [key: number]: number };
  totalRating: number;
  recentReviews: number;
  topRatedServices: { title: string; rating: number; reviews: number }[];
  categoryBreakdown: { category: string; count: number; avgRating: number }[];
}

interface TaskReviewGroup {
  taskId: string;
  taskTitle: string;
  taskCategory: string;
  taskPrice: number;
  taskImage?: string;
  totalReviews: number;
  averageRating: number;
  totalRevenue: number;
  reviews: Review[];
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [taskGroups, setTaskGroups] = useState<TaskReviewGroup[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'tasks' | 'all'>('tasks');
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'helpful'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {

    const fetchReviews = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        // Get current user ID from auth service
        const authResponse = await fetch(`${process.env.NEXT_PUBLIC_USER_API_URL || 'https://tmuserservice.onrender.com'}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!authResponse.ok) {
          throw new Error("Failed to get user profile");
        }

        const userProfile = await authResponse.json();
        const userId = userProfile.ID || userProfile.id;

        if (!userId) {
          throw new Error("User ID not found");
        }

        // Fetch reviews for the current user (as reviewee - reviews received)
        const reviewsReceivedResponse = await fetch(`${process.env.NEXT_PUBLIC_REVIEW_API_URL || 'http://localhost:8086'}/api/reviews?userId=${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Fetch reviews given by the current user (as reviewer - reviews given)
        const reviewsGivenResponse = await fetch(`${process.env.NEXT_PUBLIC_REVIEW_API_URL || 'http://localhost:8086'}/api/reviews?reviewerId=${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!reviewsReceivedResponse.ok) {
          throw new Error("Failed to fetch reviews received");
        }

        if (!reviewsGivenResponse.ok) {
          throw new Error("Failed to fetch reviews given");
        }

        const reviewsReceivedData = await reviewsReceivedResponse.json();
        const reviewsGivenData = await reviewsGivenResponse.json();
        
        console.log("🔵 Reviews received:", reviewsReceivedData);
        console.log("🔵 Reviews given:", reviewsGivenData);
        console.log("🔵 User ID being searched:", userId);
        
        // Combine both sets of reviews
        const allReviewsData = [...reviewsReceivedData, ...reviewsGivenData];
        console.log("🔵 All reviews combined:", allReviewsData);
        console.log("🔵 Total reviews found:", allReviewsData.length);
        
        // Transform the API data to match our interface
        const transformedReviews: Review[] = await Promise.all(
          allReviewsData.map(async (review: any) => {
            console.log("🔵 Processing review:", review);
            console.log("🔵 Review taskId:", review.taskId, "Type:", typeof review.taskId);
            console.log("🔵 Review taskId length:", review.taskId?.length);
            console.log("🔵 Review taskId value (quoted):", JSON.stringify(review.taskId));
            console.log("🔵 Is taskId valid ObjectID format?", /^[0-9a-fA-F]{24}$/.test(review.taskId || ""));
            console.log("🔵 TaskId characters:", review.taskId?.split('').map((c: string) => `${c}(${c.charCodeAt(0)})`).join(' '));
            // Fetch task details to get title, category, and price
            let taskTitle = "Unknown Task";
            let taskCategory = "General";
            let taskPrice = 0;

            console.log("🔵 Fetching task details for taskId:", review.taskId);
            
            // Try different task ID formats
            const taskIdVariations = [
              review.taskId,
              review.taskId?.toString(),
              review.taskId?.toString().replace(/['"]/g, ''), // Remove quotes
              review.taskId?.toString().trim(), // Remove whitespace
            ].filter(Boolean);
            
            console.log("🔵 Task ID variations to try:", taskIdVariations);
            console.log("🔵 Original taskId from review:", JSON.stringify(review.taskId));
            console.log("🔵 Review object keys:", Object.keys(review));
            
            // Check if taskId might be under a different field name
            const possibleTaskIdFields = ['taskId', 'task_id', 'taskID', 'TaskID', 'task', 'taskId'];
            for (const field of possibleTaskIdFields) {
              if (review[field] && review[field] !== review.taskId) {
                console.log(`🔵 Found alternative taskId field '${field}':`, review[field]);
              }
            }
            
            let taskFound = false;
            
            for (const taskId of taskIdVariations) {
              if (taskFound) break;
              
              try {
                const taskUrl = `${process.env.NEXT_PUBLIC_TASK_API_URL || 'http://localhost:8084'}/api/tasks/get/${taskId}`;
                console.log("🔵 Trying task API URL:", taskUrl);
                
                const taskResponse = await fetch(taskUrl, {
                  headers: { Authorization: `Bearer ${token}` }
                });

                console.log("🔵 Task response status:", taskResponse.status);
                console.log("🔵 Task response ok:", taskResponse.ok);

                if (taskResponse.ok) {
                  const taskData = await taskResponse.json();
                  console.log("🔵 Task data received:", taskData);
                  
                  taskTitle = taskData.Title || taskData.title || taskData.data?.Title || taskData.data?.title || "Unknown Task";
                  taskCategory = taskData.Category || taskData.category || taskData.data?.Category || taskData.data?.category || "General";
                  taskPrice = taskData.Credits || taskData.credits || taskData.Price || taskData.price || taskData.data?.Credits || taskData.data?.credits || 0;
                  
                  console.log("🔵 Extracted task info:", { taskTitle, taskCategory, taskPrice });
                  taskFound = true;
                } else if (taskResponse.status !== 404) {
                  const errorText = await taskResponse.text();
                  console.error("❌ Task fetch failed for taskId:", taskId, taskResponse.status, errorText);
                }
              } catch (error) {
                console.error("❌ Task fetch error for taskId:", taskId, error);
              }
            }
            
            if (!taskFound) {
              // Comment out or remove the noisy error log for missing tasks
              // console.error("❌ All task ID variations failed for review:", review);
              
              // Try to get a list of valid task IDs to compare
              try {
                const tasksResponse = await fetch(`${process.env.NEXT_PUBLIC_TASK_API_URL || 'http://localhost:8084'}/api/tasks/get/all`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                
                if (tasksResponse.ok) {
                  const tasksData = await tasksResponse.json();
                  const taskIds = Array.isArray(tasksData) ? tasksData.map((task: any) => task.id || task._id || task.ID) : [];
                  console.log("🔵 Available task IDs in system:", taskIds);
                  console.log("🔵 Does our taskId exist in available tasks?", taskIds.includes(review.taskId));
                }
              } catch (error) {
                console.error("❌ Failed to fetch available tasks:", error);
              }
            }

            // Determine sentiment based on rating
            let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
            if (review.rating >= 4) sentiment = 'positive';
            else if (review.rating <= 2) sentiment = 'negative';

            // Generate tags based on comment content
            const tags: string[] = [];
            const comment = review.comment?.toLowerCase() || '';
            if (comment.includes('professional') || comment.includes('excellent') || comment.includes('great')) tags.push('professional');
            if (comment.includes('communication') || comment.includes('responsive')) tags.push('communication');
            if (comment.includes('quality') || comment.includes('good') || comment.includes('satisfactory')) tags.push('quality');
            if (comment.includes('on time') || comment.includes('deadline')) tags.push('on-time');
            if (comment.includes('creative') || comment.includes('design')) tags.push('creative');

            return {
              id: review.id || review._id,
              reviewerId: review.reviewerId,
              revieweeId: review.revieweeId,
              taskId: review.taskId,
              taskTitle,
              taskCategory,
              taskPrice,
              rating: review.rating,
              comment: review.comment || "",
              createdAt: review.createdAt * 1000, // Convert to milliseconds
              reviewerName: review.reviewerName || "Anonymous",
              reviewerAvatar: undefined, // API doesn't provide avatar
              reviewerLocation: undefined, // API doesn't provide location
              isVerified: true, // Assume verified for now
              helpfulCount: Math.floor(Math.random() * 20) + 1, // Mock data
              replyCount: Math.floor(Math.random() * 5), // Mock data
              status: 'published' as const,
              tags,
              sentiment
            };
          })
        );

        setReviews(transformedReviews);

        // Generate stats from real data
        const generateStats = (reviews: Review[]): ReviewStats => {
          const ratingDistribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          const categoryBreakdown: { [key: string]: { count: number; totalRating: number } } = {};
          
          reviews.forEach(review => {
            ratingDistribution[review.rating]++;
            
            if (!categoryBreakdown[review.taskCategory]) {
              categoryBreakdown[review.taskCategory] = { count: 0, totalRating: 0 };
            }
            categoryBreakdown[review.taskCategory].count++;
            categoryBreakdown[review.taskCategory].totalRating += review.rating;
          });

          const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
          const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
          
          const recentReviews = reviews.filter(review => 
            review.createdAt > Date.now() - 86400000 * 7
          ).length;

          const topRatedServices = Array.from(
            new Set(reviews.map(r => r.taskTitle))
          ).map(title => {
            const serviceReviews = reviews.filter(r => r.taskTitle === title);
            const avgRating = serviceReviews.reduce((sum, r) => sum + r.rating, 0) / serviceReviews.length;
            return { title, rating: avgRating, reviews: serviceReviews.length };
          }).sort((a, b) => b.rating - a.rating).slice(0, 3);

          const categoryStats = Object.entries(categoryBreakdown).map(([category, data]) => ({
            category,
            count: data.count,
            avgRating: data.totalRating / data.count
          }));

          return {
            totalReviews: reviews.length,
            averageRating,
            ratingDistribution,
            totalRating,
            recentReviews,
            topRatedServices,
            categoryBreakdown: categoryStats
          };
        };

        const groupReviewsByTask = (reviews: Review[]): TaskReviewGroup[] => {
          const groups: { [key: string]: TaskReviewGroup } = {};
          
          reviews.forEach(review => {
            if (!groups[review.taskId]) {
              groups[review.taskId] = {
                taskId: review.taskId,
                taskTitle: review.taskTitle,
                taskCategory: review.taskCategory,
                taskPrice: review.taskPrice,
                totalReviews: 0,
                averageRating: 0,
                totalRevenue: 0,
                reviews: []
              };
            }
            
            groups[review.taskId].reviews.push(review);
            groups[review.taskId].totalReviews++;
            groups[review.taskId].totalRevenue += review.taskPrice;
          });

          // Calculate average ratings
          Object.values(groups).forEach(group => {
            const totalRating = group.reviews.reduce((sum, review) => sum + review.rating, 0);
            group.averageRating = totalRating / group.reviews.length;
          });

          return Object.values(groups).sort((a, b) => b.averageRating - a.averageRating);
        };

        const stats = generateStats(transformedReviews);
        setStats(stats);
        
        const filteredReviewsForGrouping = transformedReviews.filter(r => r.taskTitle !== 'Unknown Task');
        const taskGroups = groupReviewsByTask(filteredReviewsForGrouping);
        setTaskGroups(taskGroups);
        
        setError(null);
      } catch (err: any) {
        console.error("Error fetching reviews:", err);
        setError(err.message || "Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const formatCurrency = (amount: number) => {
    return `TM ${amount.toFixed(2)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} className="w-4 h-4 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<FaRegStarHalfAlt key="half" className="w-4 h-4 text-yellow-400" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }
    
    return stars;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesRating = selectedRating === null || review.rating === selectedRating;
    const matchesCategory = selectedCategory === 'all' || review.taskCategory === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.reviewerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesRating && matchesCategory && matchesSearch;
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'date':
        comparison = b.createdAt - a.createdAt;
        break;
      case 'rating':
        comparison = b.rating - a.rating;
        break;
      case 'helpful':
        comparison = b.helpfulCount - a.helpfulCount;
        break;
    }
    return sortOrder === 'asc' ? -comparison : comparison;
  });

  if (loading) {
    return (
      <div className="flex h-screen bg-white items-center justify-center">
        <LoadingSpinner size="lg" text="Loading reviews..." />
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-white p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
              <p className="text-gray-600 mt-1">Manage and analyze your service reviews</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FaRedo className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-[#FAF6ED] rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Reviews</span>
                  <FaStar className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{stats.totalReviews}</div>
                <div className="text-sm text-gray-600 mt-1">Across all services</div>
              </div>

              <div className="bg-[#FAF6ED] rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Average Rating</span>
                  <FaChartBar className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</div>
                <div className="flex items-center gap-1 mt-1">
                  {renderStars(stats.averageRating)}
                </div>
              </div>

              <div className="bg-[#FAF6ED] rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Recent Reviews</span>
                  <FaCalendar className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{stats.recentReviews}</div>
                <div className="text-sm text-gray-600 mt-1">Last 7 days</div>
              </div>

              <div className="bg-[#FAF6ED] rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Top Service</span>
                  <FaThumbsUp className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="text-lg font-bold text-gray-900">{stats.topRatedServices[0]?.title || 'N/A'}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {stats.topRatedServices[0]?.rating.toFixed(1)} ★ ({stats.topRatedServices[0]?.reviews} reviews)
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* View Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedView("tasks")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedView === "tasks"
                      ? "bg-emerald-700 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <FaList className="w-4 h-4 inline mr-2" />
                  By Task
                </button>
                <button
                  onClick={() => setSelectedView("all")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedView === "all"
                      ? "bg-emerald-700 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <FaGrid className="w-4 h-4 inline mr-2" />
                  All Reviews
                </button>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <FaSearch className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search reviews..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                                 <select
                   value={selectedRating || ""}
                   onChange={(e) => setSelectedRating(e.target.value ? Number(e.target.value) : null)}
                   className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                 >
                   <option value="">All Ratings</option>
                   <option value="5">5 Stars</option>
                   <option value="4">4 Stars</option>
                   <option value="3">3 Stars</option>
                   <option value="2">2 Stars</option>
                   <option value="1">1 Star</option>
                 </select>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Categories</option>
                  <option value="Technology">Technology</option>
                  <option value="Design">Design</option>
                  <option value="Writing">Writing</option>
                  <option value="Consulting">Consulting</option>
                </select>

                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [sort, order] = e.target.value.split('-');
                    setSortBy(sort as 'date' | 'rating' | 'helpful');
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="rating-desc">Highest Rating</option>
                  <option value="rating-asc">Lowest Rating</option>
                  <option value="helpful-desc">Most Helpful</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          {selectedView === "tasks" ? (
            <div className="space-y-6">
              {taskGroups.map((taskGroup) => (
                <div key={taskGroup.taskId} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {/* Task Header */}
                  <div className="bg-[#FAF6ED] p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{taskGroup.taskTitle}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <FaTag className="w-4 h-4" />
                            {taskGroup.taskCategory}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaDollarSign className="w-4 h-4" />
                            {formatCurrency(taskGroup.taskPrice)}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaStar className="w-4 h-4 text-yellow-400" />
                            {taskGroup.averageRating.toFixed(1)} ({taskGroup.totalReviews} reviews)
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-700">{formatCurrency(taskGroup.totalRevenue)}</div>
                        <div className="text-sm text-gray-600">Total Revenue</div>
                      </div>
                    </div>
                  </div>

                  {/* Reviews */}
                  <div className="p-6">
                    <div className="space-y-4">
                      {taskGroup.reviews.map((review) => (
                        <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start gap-4">
                            {/* Reviewer Avatar */}
                            <div className="flex-shrink-0">
                              {review.reviewerAvatar ? (
                                <img
                                  src={review.reviewerAvatar}
                                  alt={review.reviewerName}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-emerald-700 rounded-full flex items-center justify-center text-white font-semibold">
                                  {review.reviewerName.charAt(0)}
                                </div>
                              )}
                            </div>

                            {/* Review Content */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900">{review.reviewerName}</h4>
                                {review.isVerified && (
                                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Verified</span>
                                )}
                                <span className={`text-xs px-2 py-1 rounded-full ${getSentimentColor(review.sentiment)}`}>
                                  {review.sentiment}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 mb-3">
                                <div className="flex items-center gap-1">
                                  {renderStars(review.rating)}
                                </div>
                                <span className="text-sm text-gray-600">{formatDate(review.createdAt)}</span>
                                {review.reviewerLocation && (
                                  <span className="text-sm text-gray-500 flex items-center gap-1">
                                    <FaMapMarkerAlt className="w-3 h-3" />
                                    {review.reviewerLocation}
                                  </span>
                                )}
                              </div>

                              <p className="text-gray-700 mb-3 leading-relaxed">{review.comment}</p>

                              {/* Tags */}
                              {review.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {review.tags.map((tag, index) => (
                                    <span
                                      key={index}
                                      className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <button className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
                                  <FaThumbsUp className="w-4 h-4" />
                                  <span>{review.helpfulCount} helpful</span>
                                </button>
                                <button className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
                                  <FaReply className="w-4 h-4" />
                                  <span>Reply</span>
                                </button>
                                <button className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
                                  <FaShare className="w-4 h-4" />
                                  <span>Share</span>
                                </button>
                                <button className="flex items-center gap-1 hover:text-red-600 transition-colors">
                                  <FaFlag className="w-4 h-4" />
                                  <span>Report</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="space-y-4">
                  {sortedReviews.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-4">
                        {/* Reviewer Avatar */}
                        <div className="flex-shrink-0">
                          {review.reviewerAvatar ? (
                            <img
                              src={review.reviewerAvatar}
                              alt={review.reviewerName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-emerald-700 rounded-full flex items-center justify-center text-white font-semibold">
                              {review.reviewerName.charAt(0)}
                            </div>
                          )}
                        </div>

                        {/* Review Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900">{review.reviewerName}</h4>
                            {review.isVerified && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Verified</span>
                            )}
                            <span className={`text-xs px-2 py-1 rounded-full ${getSentimentColor(review.sentiment)}`}>
                              {review.sentiment}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-1">
                              {renderStars(review.rating)}
                            </div>
                            <span className="text-sm text-gray-600">{formatDate(review.createdAt)}</span>
                            <span className="text-sm text-emerald-600 font-medium">{review.taskTitle}</span>
                            {review.reviewerLocation && (
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <FaMapMarkerAlt className="w-3 h-3" />
                                {review.reviewerLocation}
                              </span>
                            )}
                          </div>

                          <p className="text-gray-700 mb-3 leading-relaxed">{review.comment}</p>

                          {/* Tags */}
                          {review.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {review.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <button className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
                              <FaThumbsUp className="w-4 h-4" />
                              <span>{review.helpfulCount} helpful</span>
                            </button>
                            <button className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
                              <FaReply className="w-4 h-4" />
                              <span>Reply</span>
                            </button>
                            <button className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
                              <FaShare className="w-4 h-4" />
                              <span>Share</span>
                            </button>
                            <button className="flex items-center gap-1 hover:text-red-600 transition-colors">
                              <FaFlag className="w-4 h-4" />
                              <span>Report</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  );
} 
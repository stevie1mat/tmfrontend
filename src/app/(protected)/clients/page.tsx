"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { 
  FaUser, 
  FaSearch, 
  FaFilter, 
  FaSort, 
  FaCalendar, 
  FaDollarSign, 
  FaStar, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaGlobe, 
  FaHeart, 
  FaThumbsUp, 
  FaThumbsDown,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
  FaDownload,
  FaRedo,
  FaChartBar,
  FaList,
  FaTh,
  FaBookmark,
  FaShare,
  FaFlag,
  FaCheckCircle,
  FaClock,
  FaTag,
  FaArrowUp,
  FaArrowDown,
  FaRegStar,
  FaStarHalfAlt,
  FaCrown,
  FaMedal,
  FaTrophy,
  FaUserTie,
  FaUserFriends,
  FaBuilding,
  FaBriefcase,
  FaGraduationCap,
  FaLaptop,
  FaPalette,
  FaPen,
  FaLightbulb
} from "react-icons/fa";

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  location?: string;
  company?: string;
  jobTitle?: string;
  industry?: string;
  isVerified: boolean;
  joinDate: number;
  lastActive: number;
  totalSpent: number;
  totalOrders: number;
  averageRating: number;
  totalReviews: number;
  status: 'active' | 'inactive' | 'vip' | 'new';
  tags: string[];
  notes?: string;
  preferences: {
    preferredCategories: string[];
    budgetRange: string;
    communicationStyle: string;
    timezone: string;
  };
  recentActivity: {
    type: 'booking' | 'review' | 'message' | 'inquiry';
    description: string;
    date: number;
    amount?: number;
  }[];
  services: {
    id: string;
    title: string;
    category: string;
    amount: number;
    date: number;
    status: 'completed' | 'ongoing' | 'cancelled';
    rating?: number;
  }[];
}

interface ClientStats {
  totalClients: number;
  activeClients: number;
  vipClients: number;
  newClients: number;
  totalRevenue: number;
  averageOrderValue: number;
  topSpendingClient: { name: string; amount: number };
  clientRetentionRate: number;
  categoryBreakdown: { category: string; count: number; revenue: number }[];
  topIndustries: { industry: string; count: number }[];
}

export default function ClientDirectoryPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'grid' | 'list'>('grid');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'spent' | 'orders'>('recent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        // Get user ID first
        const profileRes = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://tmuserservice.onrender.com'}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!profileRes.ok) {
          throw new Error("Failed to fetch user profile");
        }
        
        const profileData = await profileRes.json();
        const userId = profileData.ID || profileData.id;
        
        if (!userId) {
          throw new Error("User ID not found");
        }

        // Fetch bookings where current user is the service provider (owner)
        const TASK_API_BASE = process.env.NEXT_PUBLIC_TASK_API_URL || 'http://localhost:8084';
        const bookingsRes = await fetch(`${TASK_API_BASE}/api/bookings?role=owner&id=${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!bookingsRes.ok) {
          throw new Error("Failed to fetch bookings");
        }

        const bookingsData = await bookingsRes.json();
        const bookings = (bookingsData && bookingsData.data) || bookingsData || [];

        // Transform bookings into client data
        const clientMap = new Map<string, Client>();
        
        for (const booking of bookings) {
          const bookerId = booking.BookerID || booking.bookerID || booking.Booker?.ID || booking.booker?.id;
          
          if (!bookerId) continue;

          // Get booker details from auth service
          let bookerDetails = null;
          try {
            const bookerRes = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://tmuserservice.onrender.com'}/api/auth/user/${bookerId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            
            if (bookerRes.ok) {
              const bookerData = await bookerRes.json();
              bookerDetails = bookerData.data || bookerData;
            }
          } catch (err) {
            console.log(`Failed to fetch booker details for ${bookerId}:`, err);
          }

          // Get booker profile details
          let bookerProfile = null;
          try {
            const profileRes = await fetch(`${process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:8081'}/api/profile/${bookerId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            
            if (profileRes.ok) {
              const profileData = await profileRes.json();
              bookerProfile = profileData;
            }
          } catch (err) {
            console.log(`Failed to fetch booker profile for ${bookerId}:`, err);
          }

          // Get task details for the booking
          let taskDetails = null;
          const taskId = booking.TaskID || booking.taskID || booking.task?.ID || booking.task?.id;
          if (taskId) {
            try {
              const taskRes = await fetch(`${TASK_API_BASE}/api/tasks/get/${taskId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              
              if (taskRes.ok) {
                const taskData = await taskRes.json();
                taskDetails = taskData.data || taskData;
              }
            } catch (err) {
              console.log(`Failed to fetch task details for ${taskId}:`, err);
            }
          }

          // Create or update client data
          if (!clientMap.has(bookerId)) {
            const client: Client = {
              id: bookerId,
              name: bookerDetails?.Name || bookerDetails?.name || booking.BookerName || booking.bookerName || "Unknown Client",
              email: bookerDetails?.Email || bookerDetails?.email || booking.BookerEmail || booking.bookerEmail || "",
              phone: bookerDetails?.Phone || bookerDetails?.phone || booking.BookerPhone || booking.bookerPhone || "",
              avatar: bookerProfile?.ProfilePictureURL || bookerProfile?.profilePictureURL || bookerDetails?.Avatar || bookerDetails?.avatar || "",
              location: bookerProfile?.location || bookerProfile?.Location || "Location not specified",
              company: bookerProfile?.company || bookerProfile?.Company || "",
              jobTitle: bookerProfile?.jobTitle || bookerProfile?.JobTitle || "",
              industry: bookerProfile?.industry || bookerProfile?.Industry || "General",
              isVerified: bookerDetails?.isVerified || false,
              joinDate: new Date(bookerDetails?.CreatedAt || bookerDetails?.createdAt || Date.now()).getTime(),
              lastActive: new Date(booking.CreatedAt || booking.createdAt || Date.now()).getTime(),
              totalSpent: 0,
              totalOrders: 0,
              averageRating: 0,
              totalReviews: 0,
              status: 'active',
              tags: [],
              notes: "",
              preferences: {
                preferredCategories: [],
                budgetRange: "",
                communicationStyle: "",
                timezone: ""
              },
              recentActivity: [],
              services: []
            };
            clientMap.set(bookerId, client);
          }

          const client = clientMap.get(bookerId)!;
          
          // Update client data with booking information
          client.totalSpent += booking.Credits || booking.credits || 0;
          client.totalOrders += 1;
          client.lastActive = Math.max(client.lastActive, new Date(booking.CreatedAt || booking.createdAt || Date.now()).getTime());

          // Add service to client's services
          if (taskDetails) {
            client.services.push({
              id: taskId,
              title: taskDetails.Title || taskDetails.title || booking.TaskTitle || booking.taskTitle || "Service",
              category: taskDetails.Category || taskDetails.category || "General",
              amount: booking.Credits || booking.credits || 0,
              date: new Date(booking.CreatedAt || booking.createdAt || Date.now()).getTime(),
              status: booking.Status || booking.status || 'completed',
              rating: 0 // Will be updated if reviews are available
            });
          }

          // Add recent activity
          client.recentActivity.push({
            type: 'booking',
            description: `Booked ${taskDetails?.Title || taskDetails?.title || booking.TaskTitle || booking.taskTitle || "service"}`,
            date: new Date(booking.CreatedAt || booking.createdAt || Date.now()).getTime(),
            amount: booking.Credits || booking.credits || 0
          });

          // Update status based on spending
          if (client.totalSpent >= 2000) {
            client.status = 'vip';
          } else if (client.totalSpent >= 500) {
            client.status = 'active';
          } else {
            client.status = 'new';
          }
        }

        // Convert map to array
        const realClients = Array.from(clientMap.values());

        // Generate stats from real data
        const generateStats = (clients: Client[]): ClientStats => {
          const activeClients = clients.filter(c => c.status === 'active' || c.status === 'vip').length;
          const vipClients = clients.filter(c => c.status === 'vip').length;
          const newClients = clients.filter(c => c.status === 'new').length;
          const totalRevenue = clients.reduce((sum, c) => sum + c.totalSpent, 0);
          
          const categoryBreakdown: { [key: string]: { count: number; revenue: number } } = {};
          const industryBreakdown: { [key: string]: number } = {};
          
          clients.forEach(client => {
            // Category breakdown from services
            client.services.forEach(service => {
              const category = service.category;
              if (!categoryBreakdown[category]) {
                categoryBreakdown[category] = { count: 0, revenue: 0 };
              }
              categoryBreakdown[category].count++;
              categoryBreakdown[category].revenue += service.amount;
            });
            
            // Industry breakdown
            if (client.industry) {
              if (!industryBreakdown[client.industry]) {
                industryBreakdown[client.industry] = 0;
              }
              industryBreakdown[client.industry]++;
            }
          });

          const topSpendingClient = clients.length > 0 ? clients.reduce((top, client) => 
            client.totalSpent > top.totalSpent ? client : top
          ) : { name: "No clients", totalSpent: 0 };

          return {
            totalClients: clients.length,
            activeClients,
            vipClients,
            newClients,
            totalRevenue,
            averageOrderValue: clients.length > 0 ? totalRevenue / clients.reduce((sum, c) => sum + c.totalOrders, 0) : 0,
            topSpendingClient: { name: topSpendingClient.name, amount: topSpendingClient.totalSpent },
            clientRetentionRate: 85.5, // This would need to be calculated from historical data
            categoryBreakdown: Object.entries(categoryBreakdown).map(([category, data]) => ({
              category,
              count: data.count,
              revenue: data.revenue
            })),
            topIndustries: Object.entries(industryBreakdown)
              .map(([industry, count]) => ({ industry, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 5)
          };
        };

        setClients(realClients);
        setStats(generateStats(realClients));
        setError(null);
        
      } catch (err: any) {
        console.error("Error fetching clients:", err);
        setError(err.message || "Failed to load clients");
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
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
      stars.push(<FaStarHalfAlt key="half" className="w-4 h-4 text-yellow-400" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }
    
    return stars;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip': return 'bg-purple-100 text-purple-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIndustryIcon = (industry?: string) => {
    switch (industry) {
      case 'Technology': return <FaLaptop className="w-4 h-4" />;
      case 'Design': return <FaPalette className="w-4 h-4" />;
      case 'Marketing': return <FaGlobe className="w-4 h-4" />;
      case 'Consulting': return <FaBriefcase className="w-4 h-4" />;
      default: return <FaBuilding className="w-4 h-4" />;
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesStatus = selectedStatus === 'all' || client.status === selectedStatus;
    const matchesIndustry = selectedIndustry === 'all' || client.industry === selectedIndustry;
    const matchesSearch = searchTerm === '' || 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesIndustry && matchesSearch;
  });

  const sortedClients = [...filteredClients].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'recent':
        comparison = b.lastActive - a.lastActive;
        break;
      case 'spent':
        comparison = b.totalSpent - a.totalSpent;
        break;
      case 'orders':
        comparison = b.totalOrders - a.totalOrders;
        break;
    }
    return sortOrder === 'asc' ? -comparison : comparison;
  });

  if (loading) {
    return (
      <div className="flex h-screen bg-white items-center justify-center">
        <LoadingSpinner size="lg" text="Loading client directory..." />
      </div>
    );
  }

  return (
    <>
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Client Directory</h1>
              <p className="text-gray-600 mt-1">Manage and track your client relationships</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FaRedo className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
              </div>
              <button className="bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 transition-colors flex items-center gap-2">
                <FaPlus className="w-4 h-4" />
                Add Client
              </button>
            </div>
          </div>
        </div>

        <div>
          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-[#FAF6ED] rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Clients</span>
                  <FaUser className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{stats.totalClients}</div>
                <div className="text-sm text-gray-600 mt-1">{stats.activeClients} active</div>
              </div>

              <div className="bg-[#FAF6ED] rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Revenue</span>
                  <FaDollarSign className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</div>
                <div className="text-sm text-gray-600 mt-1">from all clients</div>
              </div>

              <div className="bg-[#FAF6ED] rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">VIP Clients</span>
                  <FaCrown className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{stats.vipClients}</div>
                <div className="text-sm text-gray-600 mt-1">high-value clients</div>
              </div>

              <div className="bg-[#FAF6ED] rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Retention Rate</span>
                  <FaChartBar className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{stats.clientRetentionRate}%</div>
                <div className="text-sm text-gray-600 mt-1">client satisfaction</div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* View Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedView("grid")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedView === "grid"
                      ? "bg-emerald-700 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <FaTh className="w-4 h-4 inline mr-2" />
                  Grid
                </button>
                <button
                  onClick={() => setSelectedView("list")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedView === "list"
                      ? "bg-emerald-700 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <FaList className="w-4 h-4 inline mr-2" />
                  List
                </button>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <FaSearch className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Status</option>
                  <option value="vip">VIP</option>
                  <option value="active">Active</option>
                  <option value="new">New</option>
                  <option value="inactive">Inactive</option>
                </select>

                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Industries</option>
                  <option value="Technology">Technology</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Consulting">Consulting</option>
                </select>

                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [sort, order] = e.target.value.split('-');
                    setSortBy(sort as 'name' | 'recent' | 'spent' | 'orders');
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="recent-desc">Recently Active</option>
                  <option value="recent-asc">Least Active</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="spent-desc">Highest Spent</option>
                  <option value="spent-asc">Lowest Spent</option>
                  <option value="orders-desc">Most Orders</option>
                  <option value="orders-asc">Least Orders</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          {selectedView === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedClients.map((client) => (
                <div key={client.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Client Header */}
                  <div className="bg-[#FAF6ED] p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {client.avatar ? (
                          <img
                            src={client.avatar}
                            alt={client.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-emerald-700 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                            {client.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{client.name}</h3>
                          {client.isVerified && (
                            <FaCheckCircle className="w-4 h-4 text-blue-500" />
                          )}
                          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getStatusColor(client.status)}`}>
                            {client.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{client.jobTitle}</p>
                        <p className="text-sm text-gray-500">{client.company}</p>
                      </div>
                    </div>
                  </div>

                  {/* Client Details */}
                  <div className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaEnvelope className="w-4 h-4" />
                        <span className="truncate">{client.email}</span>
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FaPhone className="w-4 h-4" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                      {client.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FaMapMarkerAlt className="w-4 h-4" />
                          <span>{client.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {getIndustryIcon(client.industry)}
                        <span>{client.industry}</span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{formatCurrency(client.totalSpent)}</div>
                        <div className="text-xs text-gray-500">Total Spent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{client.totalOrders}</div>
                        <div className="text-xs text-gray-500">Orders</div>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-1">
                        {renderStars(client.averageRating)}
                        <span className="text-sm text-gray-600 ml-1">({client.totalReviews})</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Last active: {formatDate(client.lastActive)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                      <button className="flex-1 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm hover:bg-emerald-100 transition-colors">
                        <FaEye className="w-4 h-4 inline mr-1" />
                        View
                      </button>
                      <button className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-100 transition-colors">
                        <FaEnvelope className="w-4 h-4 inline mr-1" />
                        Message
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Client</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Company</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Industry</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Total Spent</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Orders</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Rating</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Last Active</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedClients.map((client) => (
                      <tr key={client.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {client.avatar ? (
                              <img
                                src={client.avatar}
                                alt={client.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-emerald-700 rounded-full flex items-center justify-center text-white font-semibold">
                                {client.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900">{client.name}</p>
                                {client.isVerified && (
                                  <FaCheckCircle className="w-4 h-4 text-blue-500" />
                                )}
                              </div>
                              <p className="text-sm text-gray-500">{client.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-medium text-gray-900">{client.company}</p>
                          <p className="text-sm text-gray-500">{client.jobTitle}</p>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {getIndustryIcon(client.industry)}
                            <span className="text-sm text-gray-600">{client.industry}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-semibold text-gray-900">{formatCurrency(client.totalSpent)}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-medium text-gray-900">{client.totalOrders}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1">
                            {renderStars(client.averageRating)}
                            <span className="text-sm text-gray-500">({client.totalReviews})</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getStatusColor(client.status)}`}>
                            {client.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-500">{formatDate(client.lastActive)}</span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
                              <FaEye className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                              <FaEnvelope className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
                              <FaEdit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
    </>
  );
} 
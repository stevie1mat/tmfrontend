"use client";

import { useEffect, useState } from "react";
import ProtectedLayout from "@/components/Layout/ProtectedLayout";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { 
  FaDollarSign, 
  FaChartLine, 
  FaCalendar, 
  FaUsers, 
  FaStar, 
  FaClock, 
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaHeart,
  FaCheckCircle,
  FaExclamationTriangle,
  FaClock as FaClockIcon,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaGlobe,
  FaTrophy,
  FaMedal,
  FaCrown,
  FaGift,
  FaCoins,
  FaWallet,
  FaCreditCard,
  FaPiggyBank,
  FaChartBar,
  FaChartPie,
  FaChartArea
} from "react-icons/fa";

interface EarningsData {
  totalEarnings: number;
  monthlyEarnings: number;
  weeklyEarnings: number;
  totalServices: number;
  completedServices: number;
  pendingServices: number;
  averageRating: number;
  totalReviews: number;
  totalClients: number;
  repeatClients: number;
  averageServicePrice: number;
  topEarningMonth: string;
  topEarningDay: string;
  conversionRate: number;
  responseTime: number;
  completionRate: number;
}

interface ServiceEarning {
  id: string;
  title: string;
  category: string;
  earnings: number;
  date: string;
  client: string;
  rating: number;
  status: string;
}

interface MonthlyData {
  month: string;
  earnings: number;
  services: number;
  clients: number;
}

interface CategoryEarnings {
  category: string;
  earnings: number;
  services: number;
  percentage: number;
}

export default function EarningsDashboardPage() {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [recentServices, setRecentServices] = useState<ServiceEarning[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryEarnings, setCategoryEarnings] = useState<CategoryEarnings[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Mock data generation for demonstration
  const generateMockData = () => {
    const mockEarningsData: EarningsData = {
      totalEarnings: 2847.50,
      monthlyEarnings: 847.25,
      weeklyEarnings: 234.80,
      totalServices: 47,
      completedServices: 42,
      pendingServices: 5,
      averageRating: 4.8,
      totalReviews: 38,
      totalClients: 31,
      repeatClients: 12,
      averageServicePrice: 67.80,
      topEarningMonth: "December 2024",
      topEarningDay: "Wednesday",
      conversionRate: 89.4,
      responseTime: 2.3,
      completionRate: 94.7
    };

    const mockRecentServices: ServiceEarning[] = [
      {
        id: "1",
        title: "Web Development Consultation",
        category: "Technology",
        earnings: 150.00,
        date: "2024-12-15",
        client: "Sarah Johnson",
        rating: 5,
        status: "completed"
      },
      {
        id: "2",
        title: "Logo Design Package",
        category: "Design",
        earnings: 85.00,
        date: "2024-12-14",
        client: "Mike Chen",
        rating: 4,
        status: "completed"
      },
      {
        id: "3",
        title: "Content Writing - Blog Posts",
        category: "Writing",
        earnings: 120.00,
        date: "2024-12-13",
        client: "Emily Davis",
        rating: 5,
        status: "completed"
      },
      {
        id: "4",
        title: "Social Media Management",
        category: "Marketing",
        earnings: 95.00,
        date: "2024-12-12",
        client: "David Wilson",
        rating: 4,
        status: "pending"
      },
      {
        id: "5",
        title: "Photography Session",
        category: "Photography",
        earnings: 200.00,
        date: "2024-12-11",
        client: "Lisa Brown",
        rating: 5,
        status: "completed"
      }
    ];

    const mockMonthlyData: MonthlyData[] = [
      { month: "Aug", earnings: 650, services: 8, clients: 7 },
      { month: "Sep", earnings: 720, services: 9, clients: 8 },
      { month: "Oct", earnings: 890, services: 11, clients: 9 },
      { month: "Nov", earnings: 1020, services: 12, clients: 10 },
      { month: "Dec", earnings: 847, services: 10, clients: 8 }
    ];

    const mockCategoryEarnings: CategoryEarnings[] = [
      { category: "Technology", earnings: 850, services: 12, percentage: 35 },
      { category: "Design", earnings: 620, services: 8, percentage: 25 },
      { category: "Writing", earnings: 480, services: 6, percentage: 20 },
      { category: "Marketing", earnings: 320, services: 4, percentage: 13 },
      { category: "Photography", earnings: 200, services: 2, percentage: 7 }
    ];

    return { mockEarningsData, mockRecentServices, mockMonthlyData, mockCategoryEarnings };
  };

  useEffect(() => {
    const fetchEarningsData = async () => {
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { mockEarningsData, mockRecentServices, mockMonthlyData, mockCategoryEarnings } = generateMockData();
        
        setEarningsData(mockEarningsData);
        setRecentServices(mockRecentServices);
        setMonthlyData(mockMonthlyData);
        setCategoryEarnings(mockCategoryEarnings);
        setLastUpdate(new Date());
      } catch (error) {
        console.error("Error fetching earnings data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEarningsData();

    // Set up polling for live updates
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return `TM ${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down') => {
    return trend === 'up' ? <FaArrowUp className="text-green-500" /> : <FaArrowDown className="text-red-500" />;
  };

  if (loading) {
    return (
      <ProtectedLayout>
        <div className="flex h-screen bg-white items-center justify-center">
          <LoadingSpinner size="lg" text="Loading earnings dashboard..." />
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="bg-white">
        {/* Header */}
        <div className="bg-white p-6 border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Earnings Dashboard</h1>
              <p className="text-gray-600 mt-1">Track your income, performance, and growth</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-sm text-gray-500">
                  {isLive ? 'Live' : 'Offline'} • Last updated: {lastUpdate.toLocaleTimeString()}
                </span>
              </div>
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 pb-20">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#FAF6ED] rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Earnings</span>
                <FaDollarSign className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                <span className="text-sm font-normal">TM</span> {(earningsData?.totalEarnings || 0).toFixed(2)}
              </div>
              <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                <FaArrowUp className="w-3 h-3" />
                <span>+12.5% from last month</span>
              </div>
            </div>

            <div className="bg-[#FAF6ED] rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Monthly Earnings</span>
                <FaChartLine className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="text-3xl font-bold text-gray-900">
                <span className="text-sm font-normal">TM</span> {(earningsData?.monthlyEarnings || 0).toFixed(2)}
              </div>
              <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                <FaArrowUp className="w-3 h-3" />
                <span>+8.3% from last month</span>
              </div>
            </div>

            <div className="bg-[#FAF6ED] rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Completed Services</span>
                <FaCheckCircle className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{earningsData?.completedServices || 0}</div>
              <div className="text-sm text-gray-600 mt-1">of {earningsData?.totalServices || 0} total</div>
            </div>

            <div className="bg-[#FAF6ED] rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Average Rating</span>
                <FaStar className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{earningsData?.averageRating || 0}</div>
              <div className="text-sm text-gray-600 mt-1">from {earningsData?.totalReviews || 0} reviews</div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Conversion Rate</span>
                  <span className="text-lg font-semibold text-gray-900">{earningsData?.conversionRate || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Response Time</span>
                  <span className="text-lg font-semibold text-gray-900">{earningsData?.responseTime || 0}h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="text-lg font-semibold text-gray-900">{earningsData?.completionRate || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Repeat Clients</span>
                  <span className="text-lg font-semibold text-gray-900">{earningsData?.repeatClients || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Insights</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Clients</span>
                  <span className="text-lg font-semibold text-gray-900">{earningsData?.totalClients || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Average Service Price</span>
                  <span className="text-lg font-semibold text-gray-900">
                    <span className="text-xs font-normal">TM</span> {(earningsData?.averageServicePrice || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Top Earning Month</span>
                  <span className="text-lg font-semibold text-gray-900">{earningsData?.topEarningMonth || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Best Day</span>
                  <span className="text-lg font-semibold text-gray-900">{earningsData?.topEarningDay || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending Services</span>
                  <span className="text-lg font-semibold text-yellow-600">{earningsData?.pendingServices || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Weekly Earnings</span>
                  <span className="text-lg font-semibold text-gray-900">
                    <span className="text-xs font-normal">TM</span> {(earningsData?.weeklyEarnings || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Services</span>
                  <span className="text-lg font-semibold text-gray-900">{earningsData?.totalServices || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Reviews</span>
                  <span className="text-lg font-semibold text-gray-900">{earningsData?.totalReviews || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Services and Category Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Services</h3>
              <div className="space-y-3">
                {recentServices.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{service.title}</h4>
                      <p className="text-xs text-gray-500">{service.client} • {service.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatCurrency(service.earnings)}</div>
                      <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getStatusColor(service.status)}`}>
                        {service.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Earnings by Category</h3>
              <div className="space-y-3">
                {categoryEarnings.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      <span className="text-sm font-medium text-gray-900">{category.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{formatCurrency(category.earnings)}</div>
                      <div className="text-xs text-gray-500">{category.services} services</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>


        </div>
      </div>
    </ProtectedLayout>
  );
} 
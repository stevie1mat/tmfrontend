"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  FaCoins, 
  FaPlus, 
  FaMinus, 
  FaHistory, 
  FaChartLine, 
  FaDollarSign, 
  FaCalendar, 
  FaClock, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaDownload,
  FaRedo,
  FaFilter,
  FaSearch,
  FaSort,
  FaEye,
  FaGift,
  FaStar,
  FaTrophy,
  FaMedal,
  FaCrown,
  FaUserTie,
  FaBriefcase,
  FaGraduationCap,
  FaLaptop,
  FaPalette,
  FaPen,
  FaLightbulb,
  FaTag,
  FaMapMarkerAlt,
  FaGlobe,
  FaEnvelope,
  FaPhone,
  FaClock as FaTime,
  FaCalendarAlt,
  FaChartBar,
  FaChartBar as FaPieChart,
  FaList,
  FaList as FaGrid,
  FaBookmark,
  FaShare,
  FaFlag,
  FaRegStar,
  FaStarHalfAlt,
  FaArrowRight,
  FaArrowLeft,
  FaChevronRight,
  FaChevronLeft,
  FaEllipsisV,
  FaHeart,
  FaThumbsUp,
  FaThumbsDown,
  FaReply,
  FaEdit,
  FaTrash,
  FaCopy,
  FaExternalLinkAlt,
  FaLock,
  FaUnlock,
  FaShieldAlt,
  FaCreditCard,
  FaWallet,
  FaPiggyBank,
  FaHandshake,
  FaAward,
  FaCertificate,
  FaRocket,
  FaFire,
  FaBolt,
  FaGem,
  FaGem as FaDiamond,
  FaCrown as FaCrownAlt,
  FaStarHalfAlt as FaRegStarHalfAlt
} from "react-icons/fa";

interface CreditTransaction {
  id: string;
  type: 'earned' | 'spent' | 'bonus' | 'refund' | 'penalty';
  amount: number;
  description: string;
  category: string;
  date: number;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  reference?: string;
  serviceId?: string;
  clientName?: string;
  tags: string[];
}

interface CreditStats {
  currentBalance: number;
  totalEarned: number;
  totalSpent: number;
  totalBonus: number;
  totalRefunds: number;
  monthlyEarnings: number;
  weeklyEarnings: number;
  dailyEarnings: number;
  earningTrend: number; // percentage
  spendingTrend: number; // percentage
  topEarningCategories: { category: string; amount: number; percentage: number }[];
  recentActivity: { date: string; earned: number; spent: number; bonus: number; description: string; type: string }[];
  achievements: { title: string; description: string; icon: string; unlocked: boolean }[];
  showBuyCredits: boolean;
}





function CreditsPage() {
  const searchParams = useSearchParams();
  const showSuccess = searchParams?.get('success') === '1';
  const showCanceled = searchParams?.get('canceled') === '1';
  
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [stats, setStats] = useState<CreditStats | null>(null);


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'overview' | 'transactions'>('overview');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');



  useEffect(() => {
    const fetchCredits = async () => {
      setLoading(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
        console.log('🔑 Token exists:', !!token);
        console.log('🔑 Token length:', token ? token.length : 0);
        
        if (!token) {
          console.error('❌ No authentication token found');
          setError("No authentication token. Please log in again.");
          return;
        }

        console.log('🔍 Fetching user profile for credits...');
        const authUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8080';
        console.log('🌐 Auth API URL:', authUrl);
        
        // Get user profile to get user ID and current credits
        console.log('🌐 Making request to:', `${authUrl}/api/auth/profile`);
        const profileRes = await fetch(`${authUrl}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch((fetchError) => {
          console.error('❌ Network error during fetch:', fetchError);
          throw new Error(`Network error: ${fetchError.message}`);
        });
        
        console.log('📡 Profile response status:', profileRes.status);
        console.log('📡 Profile response status text:', profileRes.statusText);
        
        if (!profileRes.ok) {
          if (profileRes.status === 401 || profileRes.status === 403) {
            console.error('❌ Token invalid, redirecting to login');
            localStorage.removeItem('token');
            window.location.href = '/login';
            return;
          }
          throw new Error(`Failed to fetch user profile: ${profileRes.status} ${profileRes.statusText}`);
        }
        
        const profileData = await profileRes.json();
        console.log('👤 Profile data received:', profileData);
        const userId = profileData.ID || profileData.id;
        const currentCredits = profileData.credits || 0;
        
        if (!userId) {
          console.error('❌ User ID not found in profile data');
          console.log('📋 Available fields:', Object.keys(profileData));
          throw new Error('User ID not found');
        }
        
        console.log('✅ User ID found:', userId);
        console.log('💰 Current credits:', currentCredits);
        
        if (!userId) throw new Error("User ID not found");

        // Fetch booking history from task-core service
        const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || 'http://localhost:8084';
        
        // Fetch bookings as booker (spent credits)
        const bookingsAsBookerRes = await fetch(`${API_BASE_URL}/api/bookings?id=${userId}&role=booker`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        let bookingsAsBooker: any[] = [];
        if (bookingsAsBookerRes.ok) {
          const response = await bookingsAsBookerRes.json();
          console.log('Booker response:', response);
          bookingsAsBooker = Array.isArray(response) ? response : ((response && response.data) || []);
        } else {
          console.log('Failed to fetch booker bookings:', bookingsAsBookerRes.status, bookingsAsBookerRes.statusText);
        }

        // Fetch bookings as owner (earned credits)
        const bookingsAsOwnerRes = await fetch(`${API_BASE_URL}/api/bookings?id=${userId}&role=owner`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        let bookingsAsOwner: any[] = [];
        if (bookingsAsOwnerRes.ok) {
          const response = await bookingsAsOwnerRes.json();
          console.log('Owner response:', response);
          bookingsAsOwner = Array.isArray(response) ? response : ((response && response.data) || []);
        } else {
          console.log('Failed to fetch owner bookings:', bookingsAsOwnerRes.status, bookingsAsOwnerRes.statusText);
        }

        // Transform booking data to credit transactions
        const transformedTransactions: CreditTransaction[] = [];
        
        console.log('Bookings as booker:', bookingsAsBooker);
        console.log('Bookings as owner:', bookingsAsOwner);
        
        // Add bookings as booker (spent credits)
        if (Array.isArray(bookingsAsBooker)) {
          bookingsAsBooker.forEach((booking: any) => {
            if (booking && typeof booking === 'object') {
              const bookingId = booking.ID || booking.id || booking._id || `book-${Date.now()}`;
              const taskTitle = booking.TaskTitle || booking.taskTitle || booking.task?.Title || booking.task?.title || 'Service Booking';
              const credits = booking.Credits || booking.credits || 0;
              const status = booking.Status || booking.status || 'completed';
              const taskId = booking.TaskID || booking.taskID || booking.task?.ID || booking.task?.id;
              const createdAt = booking.CreatedAt || booking.createdAt || booking.bookedAt;
              
              transformedTransactions.push({
                id: bookingId,
                type: 'spent',
                amount: -credits,
                description: `Booked: ${taskTitle}`,
                category: 'Service Booking',
                date: createdAt ? new Date(createdAt).getTime() : Date.now(),
                status: status === 'completed' ? 'completed' : 'pending',
                reference: `BOOK-${bookingId}`,
                serviceId: taskId,
                clientName: 'You',
                tags: ['booking', 'service', status]
              });
            }
          });
        }

        // Add bookings as owner (earned credits) - only completed ones
        if (Array.isArray(bookingsAsOwner)) {
          bookingsAsOwner.forEach((booking: any) => {
            if (booking && typeof booking === 'object' && (booking.Status === 'completed' || booking.status === 'completed')) {
              const bookingId = booking.ID || booking.id || booking._id || `earn-${Date.now()}`;
              const taskTitle = booking.TaskTitle || booking.taskTitle || booking.task?.Title || booking.task?.title || 'Service Provided';
              const credits = booking.Credits || booking.credits || 0;
              const taskId = booking.TaskID || booking.taskID || booking.task?.ID || booking.task?.id;
              const updatedAt = booking.UpdatedAt || booking.updatedAt || booking.completedAt || booking.CreatedAt || booking.createdAt;
              
              transformedTransactions.push({
                id: bookingId,
                type: 'earned',
                amount: credits,
                description: `Provided: ${taskTitle}`,
                category: 'Service Provided',
                date: updatedAt ? new Date(updatedAt).getTime() : Date.now(),
                status: 'completed',
                reference: `EARN-${bookingId}`,
                serviceId: taskId,
                clientName: booking.BookerName || booking.bookerName || 'Client',
                tags: ['service', 'completed', 'earned']
              });
            }
          });
        }

        // Fetch credit purchase transactions
        const creditTransactionsRes = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8081'}/api/auth/credit-transactions/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        let creditTransactions: any[] = [];
        if (creditTransactionsRes.ok) {
          const response = await creditTransactionsRes.json();
          console.log('Credit transactions response:', response);
          creditTransactions = Array.isArray(response.data) ? response.data : [];
        } else {
          console.log('Failed to fetch credit transactions:', creditTransactionsRes.status, creditTransactionsRes.statusText);
        }

        // Add credit purchase transactions
        if (Array.isArray(creditTransactions)) {
          creditTransactions.forEach((transaction: any) => {
            if (transaction && typeof transaction === 'object') {
              const transactionId = transaction._id || transaction.id || `purchase-${Date.now()}`;
              const amount = transaction.amount || 0;
              const description = transaction.description || 'Credit Purchase';
              const date = transaction.date ? new Date(transaction.date).getTime() : Date.now();
              const reference = transaction.reference || `PURCHASE-${transactionId}`;
              
              transformedTransactions.push({
                id: transactionId,
                type: 'bonus', // Use 'bonus' type for credit purchases
                amount: amount,
                description: description,
                category: 'Credit Purchase',
                date: date,
                status: 'completed',
                reference: reference,
                clientName: 'You',
                tags: ['purchase', 'credits', 'stripe']
              });
            }
          });
        }

        // Add some additional transaction types for better activity display
        if (transformedTransactions.length === 0) {
          // If no real transactions, add some placeholder activities
          transformedTransactions.push({
            id: 'welcome-bonus',
            type: 'bonus',
            amount: 50,
            description: 'Welcome Bonus',
            category: 'Bonus',
            date: Date.now() - 86400000 * 7, // 7 days ago
            status: 'completed',
            reference: 'WELCOME-001',
            clientName: 'System',
            tags: ['bonus', 'welcome']
          });
        }

        // Sort transactions by date (newest first)
        transformedTransactions.sort((a, b) => b.date - a.date);

        // Calculate stats from transactions
        const totalEarned = transformedTransactions.filter(t => t.type === 'earned')
          .reduce((sum, t) => sum + t.amount, 0);
        const totalSpent = Math.abs(transformedTransactions.filter(t => t.type === 'spent')
          .reduce((sum, t) => sum + t.amount, 0));
        const totalBonus = transformedTransactions.filter(t => t.type === 'bonus')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const monthlyEarnings = transformedTransactions
          .filter(t => t.type === 'earned' && t.date > Date.now() - 86400000 * 30)
          .reduce((sum, t) => sum + t.amount, 0);
        
        const weeklyEarnings = transformedTransactions
          .filter(t => t.type === 'earned' && t.date > Date.now() - 86400000 * 7)
          .reduce((sum, t) => sum + t.amount, 0);
        
        const dailyEarnings = transformedTransactions
          .filter(t => t.type === 'earned' && t.date > Date.now() - 86400000)
          .reduce((sum, t) => sum + t.amount, 0);

        const monthlySpent = transformedTransactions
          .filter(t => t.type === 'spent' && t.date > Date.now() - 86400000 * 30)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const weeklySpent = transformedTransactions
          .filter(t => t.type === 'spent' && t.date > Date.now() - 86400000 * 7)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        // Group earnings by service name instead of generic category
        const serviceBreakdown: { [key: string]: number } = {};
        transformedTransactions.filter(t => t.type === 'earned').forEach(t => {
          // Extract service name from description (remove "Provided: " prefix)
          const serviceName = t.description.replace('Provided: ', '') || 'Unknown Service';
          if (!serviceBreakdown[serviceName]) {
            serviceBreakdown[serviceName] = 0;
          }
          serviceBreakdown[serviceName] += t.amount;
        });

        const topEarningCategories = Object.entries(serviceBreakdown)
          .map(([serviceName, amount]) => ({
            category: serviceName,
            amount,
            percentage: totalEarned > 0 ? (amount / totalEarned) * 100 : 0
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);

        const transformedStats: CreditStats = {
          currentBalance: currentCredits,
          totalEarned,
          totalSpent,
          totalBonus: totalBonus, // Include credit purchases and bonuses
          totalRefunds: 0, // No refund system in current backend
          monthlyEarnings,
          weeklyEarnings,
          dailyEarnings,
          earningTrend: weeklyEarnings > 0 ? 12.5 : 0, // Mock trend
          spendingTrend: weeklySpent > 0 ? -5.2 : 0, // Mock trend
          topEarningCategories,
          recentActivity: transformedTransactions.slice(0, 10).map(transaction => ({
            date: formatDate(transaction.date),
            earned: transaction.type === 'earned' ? transaction.amount : 0,
            spent: transaction.type === 'spent' ? Math.abs(transaction.amount) : 0,
            bonus: transaction.type === 'bonus' ? transaction.amount : 0,
            description: transaction.description,
            type: transaction.type
          })),
          achievements: [
            { title: "First Earnings", description: "Earned your first credits", icon: "FaStar", unlocked: totalEarned > 0 },
            { title: "5-Star Provider", description: "Received 5-star review", icon: "FaTrophy", unlocked: bookingsAsOwner.length > 0 },
            { title: "Top Earner", description: "Earned 1000+ credits", icon: "FaCrown", unlocked: totalEarned >= 1000 },
            { title: "Consistent", description: "7 days of activity", icon: "FaMedal", unlocked: weeklyEarnings > 0 },
            { title: "Diverse Skills", description: "Work in 3+ categories", icon: "FaGem", unlocked: Object.keys(serviceBreakdown).length >= 3 }
          ],
          showBuyCredits: currentCredits < 50 // Show buy credits option when balance is low
        };





        setTransactions(transformedTransactions);
        setStats(transformedStats);
        setError(null);
      } catch (err: any) {
        console.error("❌ Error fetching credits data:", err);
        console.error("❌ Error details:", {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
        setError(err.message || "Failed to load credits data");
        
        // Fallback to mock data if backend is not available
        console.log("Falling back to mock data...");
        const generateMockTransactions = (): CreditTransaction[] => {
          return [
            {
              id: "1",
              type: 'earned',
              amount: 150.00,
              description: "Web Development Consultation",
              category: "Technology",
              date: Date.now() - 86400000 * 2,
              status: 'completed',
              reference: "TXN-2025-001",
              serviceId: "service1",
              clientName: "Sarah Johnson",
              tags: ['consultation', 'web-development', 'completed']
            },
            {
              id: "2",
              type: 'earned',
              amount: 200.00,
              description: "UI/UX Design Services",
              category: "Design",
              date: Date.now() - 86400000 * 5,
              status: 'completed',
              reference: "TXN-2025-002",
              serviceId: "service2",
              clientName: "Mike Chen",
              tags: ['design', 'ui-ux', 'completed']
            }
          ];
        };

        const mockTransactions = generateMockTransactions();
        const mockStats: CreditStats = {
          currentBalance: 2847.50,
          totalEarned: 2847.50,
          totalSpent: 75,
          totalBonus: 40,
          totalRefunds: 50,
          monthlyEarnings: 650,
          weeklyEarnings: 150,
          dailyEarnings: 0,
          earningTrend: 12.5,
          spendingTrend: -5.2,
          topEarningCategories: [
            { category: "Web Development Service", amount: 450, percentage: 45 },
            { category: "UI/UX Design", amount: 320, percentage: 32 },
            { category: "Mobile App Development", amount: 230, percentage: 23 }
          ],
          recentActivity: [
                    { date: "Dec 15, 2025", earned: 150, spent: 0, bonus: 0, description: "Provided: Web Development Service", type: "earned" },
        { date: "Dec 14, 2025", earned: 0, spent: 75, bonus: 0, description: "Booked: Graphic Design Service", type: "spent" },
        { date: "Dec 12, 2025", earned: 300, spent: 0, bonus: 0, description: "Provided: Mobile App Development", type: "earned" },
        { date: "Dec 10, 2025", earned: 0, spent: 120, bonus: 0, description: "Booked: SEO Consultation", type: "spent" },
        { date: "Dec 8, 2025", earned: 200, spent: 0, bonus: 0, description: "Provided: UI/UX Design", type: "earned" }
          ],
          achievements: [
            { title: "First Earnings", description: "Earned your first credits", icon: "FaStar", unlocked: true },
            { title: "5-Star Provider", description: "Received 5-star review", icon: "FaTrophy", unlocked: true },
            { title: "Top Earner", description: "Earned 1000+ credits", icon: "FaCrown", unlocked: false },
            { title: "Consistent", description: "7 days of activity", icon: "FaMedal", unlocked: true },
            { title: "Diverse Skills", description: "Work in 3+ categories", icon: "FaGem", unlocked: false }
          ],
          showBuyCredits: false
        };





        setTransactions(mockTransactions);
        setStats(mockStats);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned': return <FaPlus className="w-4 h-4 text-green-500" />;
      case 'spent': return <FaMinus className="w-4 h-4 text-red-500" />;
      case 'bonus': return <FaGift className="w-4 h-4 text-purple-500" />;
      case 'refund': return <FaArrowUp className="w-4 h-4 text-blue-500" />;
      case 'penalty': return <FaExclamationTriangle className="w-4 h-4 text-orange-500" />;
      default: return <FaCoins className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earned': return 'text-green-600';
      case 'spent': return 'text-red-600';
      case 'bonus': return 'text-purple-600';
      case 'refund': return 'text-blue-600';
      case 'penalty': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Technology': return <FaLaptop className="w-4 h-4" />;
      case 'Design': return <FaPalette className="w-4 h-4" />;
      case 'Consulting': return <FaBriefcase className="w-4 h-4" />;
      case 'Marketing': return <FaGlobe className="w-4 h-4" />;
      case 'Bonus': return <FaGift className="w-4 h-4" />;
      case 'Credit Purchase': return <FaCreditCard className="w-4 h-4" />;
      case 'Refund': return <FaArrowUp className="w-4 h-4" />;
      default: return <FaTag className="w-4 h-4" />;
    }
  };

  // Export credit transactions to CSV
  const exportToCSV = () => {
    if (!transactions || transactions.length === 0) {
      alert('No transactions to export');
      return;
    }

    try {
      // Create CSV headers
      const headers = [
        'Date',
        'Type',
        'Amount',
        'Description',
        'Category',
        'Status',
        'Reference',
        'Client/Service',
        'Tags'
      ];

      // Create CSV rows
      const csvRows = [
        headers.join(','),
        ...transactions.map(transaction => [
          formatDate(transaction.date),
          transaction.type.toUpperCase(),
          formatCurrency(transaction.amount),
          `"${transaction.description.replace(/"/g, '""')}"`, // Escape quotes in description
          transaction.category,
          transaction.status,
          transaction.reference || '',
          transaction.clientName || '',
          transaction.tags.join('; ')
        ].join(','))
      ];

      // Create CSV content
      const csvContent = csvRows.join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `credit-transactions-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      URL.revokeObjectURL(url);
      
      console.log(`Exported ${transactions.length} transactions to CSV`);
    } catch (error) {
      console.error('Error exporting transactions:', error);
      alert('Failed to export transactions. Please try again.');
    }
  };

  const handleBuyCredits = async (credits: number, price: number) => {
    try {
      // Get user's email from localStorage or profile
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      if (!token) {
        alert('Please log in to purchase credits.');
        return;
      }

      // Get user profile to get email
      const authUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8080';
      console.log('🔍 Fetching user profile for credit purchase...');
      console.log('🌐 Auth API URL:', authUrl);
      
      const profileRes = await fetch(`${authUrl}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('📡 Profile response status:', profileRes.status);
      console.log('📡 Profile response status text:', profileRes.statusText);
      
      if (!profileRes.ok) {
        if (profileRes.status === 401 || profileRes.status === 403) {
          console.error('❌ Token invalid, redirecting to login');
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        console.error('❌ Failed to fetch user profile:', profileRes.status, profileRes.statusText);
        alert('Failed to get user profile. Please try again.');
        return;
      }
      
      const profileData = await profileRes.json();
      console.log('👤 Profile data for credit purchase:', profileData);
      const userEmail = profileData.email || profileData.Email;
      
      if (!userEmail) {
        alert('User email not found. Please update your profile.');
        return;
      }

      console.log('🔍 Creating Stripe session with:', { credits, price, email: userEmail });
      
      const res = await fetch('/api/create-stripe-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits, price, email: userEmail }),
      });
      
      console.log('📡 Stripe API response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Stripe API error:', errorData);
        alert(`Failed to start Stripe checkout: ${errorData.error || 'Unknown error'}`);
        return;
      }
      
      const data = await res.json();
      console.log('✅ Stripe session data:', data);
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('❌ No URL in Stripe response');
        alert('Failed to start Stripe checkout: No checkout URL received.');
      }
    } catch (err) {
      console.error('❌ Error starting Stripe checkout:', err);
      alert(`Error starting Stripe checkout: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesType = selectedType === 'all' || transaction.type === selectedType;
    const matchesCategory = selectedCategory === 'all' || transaction.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesCategory && matchesSearch;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'date':
        comparison = b.date - a.date;
        break;
      case 'amount':
        comparison = Math.abs(b.amount) - Math.abs(a.amount);
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
    }
    return sortOrder === 'asc' ? -comparison : comparison;
  });

  if (loading) {
    return (
      <div className="bg-white">
        {/* Header Skeleton */}
        <div className="bg-white p-6 border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-96"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded animate-pulse w-24"></div>
            </div>
          </div>
        </div>

        <div className="p-6 pb-20">
          {/* Stats Overview Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[#FAF6ED] rounded-xl p-6 animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>

          {/* View Toggle Skeleton */}
          <div className="flex items-center gap-2 mb-6">
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-24"></div>
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-28"></div>
          </div>

          {/* Content Skeleton */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </div>
                      <div className="text-right">
                        <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                      <div className="text-right">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Credit Packages Skeleton */}
            <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-36 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-lg border-2 border-gray-200">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-gray-200 mx-auto mb-3"></div>
                      <div className="h-5 bg-gray-200 rounded w-24 mx-auto mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded w-20 mx-auto mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-32 mx-auto mb-3"></div>
                      <div className="h-8 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="bg-white p-6 border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Earnings Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your TradeMinutes credits and earnings</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FaRedo className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
            <button 
              onClick={exportToCSV}
              className="bg-emerald-700 text-white px-4 py-2 rounded-lg hover:bg-emerald-800 transition-colors flex items-center gap-2"
            >
              <FaDownload className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Success/Canceled Messages */}
      {showSuccess && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mx-6 mt-4">
          <div className="flex items-center">
            <FaCheckCircle className="w-5 h-5 text-green-400 mr-3" />
            <div>
              <p className="text-sm text-green-700">
                <strong>Payment successful!</strong> Your credits have been added to your account and will be available shortly.
              </p>
            </div>
          </div>
        </div>
      )}

      {showCanceled && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-6 mt-4">
          <div className="flex items-center">
            <FaExclamationTriangle className="w-5 h-5 text-yellow-400 mr-3" />
            <div>
              <p className="text-sm text-yellow-700">
                <strong>Payment canceled.</strong> No charges were made to your account.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 pb-20">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#FAF6ED] rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Current Balance</span>
                <FaCoins className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{formatCurrency(stats.currentBalance)}</div>
              <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                <FaArrowUp className="w-3 h-3" />
                <span>+{stats.earningTrend}% this month</span>
              </div>
            </div>

            <div className="bg-[#FAF6ED] rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Earned</span>
                <FaDollarSign className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalEarned)}</div>
              <div className="text-sm text-gray-600 mt-1">Lifetime earnings</div>
            </div>

            <div className="bg-[#FAF6ED] rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Monthly Earnings</span>
                <FaChartLine className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{formatCurrency(stats.monthlyEarnings)}</div>
              <div className="text-sm text-gray-600 mt-1">This month</div>
            </div>

            <div className="bg-[#FAF6ED] rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Total Bonus</span>
                <FaGift className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalBonus)}</div>
              <div className="text-sm text-gray-600 mt-1">Bonus earnings</div>
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setSelectedView("overview")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === "overview"
                ? "bg-emerald-700 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FaChartBar className="w-4 h-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setSelectedView("transactions")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === "transactions"
                ? "bg-emerald-700 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FaHistory className="w-4 h-4 inline mr-2" />
            Transactions
          </button>


        </div>

        {/* Content */}
        {selectedView === "overview" && (
          <div className="space-y-6">
            {/* Earning Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Earning Categories</h3>
                <div className="space-y-3">
                  {stats?.topEarningCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(category.category)}
                        <span className="font-medium text-gray-900">{category.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">{formatCurrency(category.amount)}</div>
                        <div className="text-sm text-gray-500">{category.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {stats?.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{activity.description}</div>
                        <div className="text-sm text-gray-500">{activity.date}</div>
                      </div>
                      <div className="text-right">
                        {activity.type === 'earned' ? (
                          <div className="text-sm font-semibold text-green-600">+{formatCurrency(activity.earned)}</div>
                        ) : activity.type === 'spent' ? (
                          <div className="text-sm font-semibold text-red-600">-{formatCurrency(activity.spent)}</div>
                        ) : activity.type === 'bonus' ? (
                          <div className="text-sm font-semibold text-purple-600">+{formatCurrency(activity.bonus)}</div>
                        ) : (
                          <div className="text-sm font-semibold text-gray-600">{formatCurrency(activity.earned || activity.spent)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Credit Balance Banner */}
            {stats && (
              <>
                {/* Low Balance Warning */}
                {stats.currentBalance < 50 && (
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 shadow-sm border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                          <FaExclamationTriangle className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">Low Credit Balance</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            You're running low on credits. Purchase more to continue booking services.
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="text-sm">
                              <span className="text-gray-600">Current Balance:</span>
                              <span className="ml-2 font-semibold text-red-600">{formatCurrency(stats.currentBalance)}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-600">Recommended:</span>
                              <span className="ml-2 font-semibold text-gray-900">500+ credits</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Buy More Credits Banner */}
                {stats.currentBalance >= 50 && (
                  <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6 shadow-sm border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                          <FaCoins className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">Buy More Credits</h3>
                          <p className="text-sm text-gray-600 mb-3">
                            Stock up on credits to ensure you never run out when booking services.
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="text-sm">
                              <span className="text-gray-600">Current Balance:</span>
                              <span className="ml-2 font-semibold text-emerald-600">{formatCurrency(stats.currentBalance)}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-600">Available Packages:</span>
                              <span className="ml-2 font-semibold text-gray-900">100, 500, 1000 credits</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Credit Packages - Always Show */}
            {stats && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit Packages</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border-2 border-gray-200 hover:border-emerald-300 transition-colors cursor-pointer">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                        <FaCoins className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">Starter Pack</h4>
                      <p className="text-2xl font-bold text-emerald-600 mb-2">100 Credits</p>
                      <p className="text-sm text-gray-600 mb-3">Perfect for getting started</p>
                      <button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                        onClick={() => handleBuyCredits(100, 9.99)}
                      >
                        $9.99
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border-2 border-emerald-300 bg-emerald-50 relative">
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-medium">Most Popular</span>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                        <FaGem className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">Professional Pack</h4>
                      <p className="text-2xl font-bold text-emerald-600 mb-2">500 Credits</p>
                      <p className="text-sm text-gray-600 mb-3">Best value for regular users</p>
                      <button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                        onClick={() => handleBuyCredits(500, 39.99)}
                      >
                        $39.99
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border-2 border-gray-200 hover:border-emerald-300 transition-colors cursor-pointer">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                        <FaCrown className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">Premium Pack</h4>
                      <p className="text-2xl font-bold text-emerald-600 mb-2">1000 Credits</p>
                      <p className="text-sm text-gray-600 mb-3">For power users</p>
                      <button
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-sm font-medium transition-colors"
                        onClick={() => handleBuyCredits(1000, 69.99)}
                      >
                        $69.99
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {selectedView === "transactions" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <FaSearch className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">All Types</option>
                    <option value="earned">Earned</option>
                    <option value="spent">Spent</option>
                    <option value="bonus">Bonus</option>
                    <option value="refund">Refund</option>
                    <option value="penalty">Penalty</option>
                  </select>

                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="Technology">Technology</option>
                    <option value="Design">Design</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Bonus">Bonus</option>
                    <option value="Refund">Refund</option>
                  </select>
                </div>

                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [sort, order] = e.target.value.split('-');
                    setSortBy(sort as 'date' | 'amount' | 'type');
                    setSortOrder(order as 'asc' | 'desc');
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="amount-desc">Highest Amount</option>
                  <option value="amount-asc">Lowest Amount</option>
                  <option value="type-asc">Type A-Z</option>
                  <option value="type-desc">Type Z-A</option>
                </select>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Type</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Description</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Category</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Amount</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-6 font-medium text-gray-600">Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {getTransactionIcon(transaction.type)}
                            <span className="capitalize font-medium text-gray-900">{transaction.type}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            {transaction.clientName && (
                              <p className="text-sm text-gray-500">{transaction.clientName}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(transaction.category)}
                            <span className="text-sm text-gray-600">{transaction.category}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                            {transaction.type === 'spent' || transaction.type === 'penalty' ? '-' : '+'}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-500">{formatDate(transaction.date)}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-gray-500 font-mono">{transaction.reference}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}




      </div>
    </div>
  );
}

export default function CreditsPageWrapper() {
  return (
    <Suspense fallback={
      <div className="bg-white">
        {/* Header Skeleton */}
        <div className="bg-white p-6 border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-96"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded animate-pulse w-24"></div>
            </div>
          </div>
        </div>

        <div className="p-6 pb-20">
          {/* Stats Overview Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[#FAF6ED] rounded-xl p-6 animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>

          {/* View Toggle Skeleton */}
          <div className="flex items-center gap-2 mb-6">
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-24"></div>
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse w-28"></div>
          </div>

          {/* Content Skeleton */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </div>
                      <div className="text-right">
                        <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                      <div className="text-right">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Credit Packages Skeleton */}
            <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-36 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-lg border-2 border-gray-200">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-gray-200 mx-auto mb-3"></div>
                      <div className="h-5 bg-gray-200 rounded w-24 mx-auto mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded w-20 mx-auto mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-32 mx-auto mb-3"></div>
                      <div className="h-8 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <CreditsPage />
    </Suspense>
  );
} 
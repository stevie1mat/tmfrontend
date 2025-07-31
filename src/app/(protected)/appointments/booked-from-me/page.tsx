"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { 
  FaCalendarAlt, 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaHourglassHalf, 
  FaUserTie,
  FaCheck,
  FaPlay,
  FaExclamationTriangle,
  FaEye,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaStar,
  FaCoins,
  FaDollarSign,
  FaTimes
} from "react-icons/fa";
import { FaCheckDouble } from "react-icons/fa6";
import { useAuth } from '@/contexts/AuthContext';
// Removed: import LoadingSpinner from '@/components/common/LoadingSpinner';

interface Booking {
  id: string;
  taskTitle: string;
  date: string;
  timeFrom: string;
  timeTo: string;
  status: string;
  taskId?: string;
  bookerName?: string;
  bookerEmail?: string;
  bookerPhone?: string;
  bookerProfilePicture?: string;
  bookerId?: string;
  location?: string;
  credits?: number;
  notes?: string;
  coverImage?: string;
  taskImages?: string[];
  totalAmount?: number;
}

export default function BookedFromMePage() {
  const { refreshUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dialog, setDialog] = useState<{ open: boolean; message: string; isError: boolean }>({ open: false, message: '', isError: false });

  // Confirm booking handler
  const handleConfirm = async (bookingId: string) => {
    setConfirmingId(bookingId);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || 'http://localhost:8084';
      const res = await fetch(`${API_BASE_URL}/api/bookings/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ bookingId }),
      });
      if (!res.ok) throw new Error("Failed to confirm booking");
      // Update UI
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: "confirmed" } : b));
    } catch (err) {
      alert("Failed to confirm booking. Please try again.");
    } finally {
      setConfirmingId(null);
    }
  };

  // Complete booking handler
  const handleComplete = async (bookingId: string) => {
    setCompletingId(bookingId);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || 'http://localhost:8084';
      const res = await fetch(`${API_BASE_URL}/api/bookings/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ bookingId }),
      });
      if (!res.ok) throw new Error("Failed to mark as completed");
      
      // Update local booking status
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: "completed" } : b));
      
      // Refresh user data to update credits in real-time
      await refreshUser();
      
      setDialog({ open: true, message: "Booking and task marked as completed. Client will be notified. Credits have been transferred to your account.", isError: false });
    } catch (err) {
      setDialog({ open: true, message: "Failed to mark as completed. Please try again.", isError: true });
    } finally {
      setCompletingId(null);
    }
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
        let userId = null;
        if (token) {
          const profileRes = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8080'}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            userId = profileData.ID || profileData.id;
          }
        }
        if (!userId) throw new Error("User ID not found");
        const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || 'http://localhost:8084';
        const res = await fetch(`${API_BASE_URL}/api/bookings?role=owner&id=${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Failed to fetch bookings");
        const data = await res.json();
        console.log("🔵 Raw bookings response:", data);
        
        // Handle different response structures safely
        let bookingsArray = [];
        if (data && typeof data === 'object') {
          if (Array.isArray(data)) {
            bookingsArray = data;
          } else if (data.data && Array.isArray(data.data)) {
            bookingsArray = data.data;
          } else if (data.bookings && Array.isArray(data.bookings)) {
            bookingsArray = data.bookings;
          } else {
            console.warn("Unexpected data structure:", data);
            bookingsArray = [];
          }
        }
        
        console.log("🔵 Processed bookings array:", bookingsArray);
        
        const bookingsPromises = bookingsArray.map(async (b: any) => {
          // Get task ID from booking
          const taskId = b.TaskID || b.taskID || b.task?.ID || b.task?.id || b.taskId;
          console.log(`Booking ${b.ID || b.id}: Task ID = ${taskId}`);
          
          // Get booker ID from booking
          const bookerId = b.BookerID || b.bookerID || b.Booker?.ID || b.booker?.id || b.bookerId;
          console.log(`Booking ${b.ID || b.id}: Booker ID = ${bookerId}`);
          console.log(`Raw booking booker fields:`, {
            BookerID: b.BookerID,
            bookerID: b.bookerID,
            Booker: b.Booker,
            booker: b.booker,
            bookerId: b.bookerId
          });
          
          let taskImages = [];
          let bookerName = b.BookerName || b.bookerName || "Client";
          let bookerEmail = b.BookerEmail || b.bookerEmail || "";
          let bookerPhone = b.BookerPhone || b.bookerPhone || "";
          let bookerProfilePicture = b.BookerProfilePicture || b.bookerProfilePicture || b.Booker?.ProfilePictureURL || b.booker?.profilePictureURL || b.Booker?.Avatar || b.booker?.avatar || "";
          
          // Fetch task details to get images only (not booker details)
          if (taskId) {
            try {
              const taskRes = await fetch(`${API_BASE_URL}/api/tasks/get/${taskId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              if (taskRes.ok) {
                const taskData = await taskRes.json();
                const task = taskData.data || taskData;
                taskImages = task.Images || task.images || [];
                console.log(`Fetched task ${taskId} images:`, taskImages);
                
                // Note: We don't use task.Author here because that's the task owner (you),
                // not the booker (client who booked your service)
              }
            } catch (err) {
              console.log(`Failed to fetch task ${taskId} details:`, err);
            }
          }
          
          // Always try to fetch booker details from auth service if we have bookerId
          if (bookerId) {
            try {
              const bookerRes = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8080'}/api/auth/user/${bookerId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              if (bookerRes.ok) {
                const bookerData = await bookerRes.json();
                const booker = bookerData.data || bookerData;
                bookerName = booker.Name || booker.name || bookerName;
                bookerEmail = booker.Email || booker.email || bookerEmail;
                bookerPhone = booker.Phone || booker.phone || bookerPhone;
                // Only set profile picture if we don't already have one
                if (!bookerProfilePicture) {
                  bookerProfilePicture = booker.ProfilePictureURL || booker.profilePictureURL || booker.Avatar || booker.avatar || booker.ProfilePicture || booker.profilePicture || "";
                }
                console.log(`✅ Fetched booker ${bookerId} details from auth service:`, { 
                  name: bookerName, 
                  email: bookerEmail, 
                  phone: bookerPhone, 
                  profilePicture: bookerProfilePicture,
                  rawBookerData: booker
                });
                
                // If no profile picture from auth service, try profile service for this specific user
                if (!bookerProfilePicture) {
                  try {
                    const profileRes = await fetch(`${process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:8081'}/api/profile/${bookerId}`, {
                      headers: token ? { Authorization: `Bearer ${token}` } : {},
                    });
                    if (profileRes.ok) {
                      const profileData = await profileRes.json();
                      bookerProfilePicture = profileData.ProfilePictureURL || profileData.profilePictureURL || "";
                      console.log(`✅ Fetched profile picture from profile service for user ${bookerId}:`, bookerProfilePicture);
                    } else {
                      console.log(`❌ Profile service returned:`, profileRes.status, profileRes.statusText);
                    }
                  } catch (profileErr) {
                    console.log(`❌ Error fetching profile picture from profile service:`, profileErr);
                  }
                }
              } else {
                console.log(`❌ Failed to fetch booker ${bookerId} details:`, bookerRes.status, bookerRes.statusText);
                const errorText = await bookerRes.text();
                console.log(`❌ Error response:`, errorText);
              }
            } catch (err) {
              console.log(`❌ Error fetching booker ${bookerId} details:`, err);
            }
          } else if (!bookerId) {
            console.log(`⚠️ No booker ID found for booking ${b.ID || b.id}`);
          }
          
          const booking = {
            id: b.ID || b.id || b._id,
            taskTitle: b.TaskTitle || b.taskTitle || b.task?.Title || b.task?.title || "",
            date: b.Timeslot?.Date || b.timeslot?.date || "",
            timeFrom: b.Timeslot?.TimeFrom || b.timeslot?.timeFrom || "",
            timeTo: b.Timeslot?.TimeTo || b.timeslot?.timeTo || "",
            status: b.Status || b.status || "",
            taskId: taskId,
            bookerName: bookerName,
            bookerEmail: bookerEmail,
            bookerPhone: bookerPhone,
            bookerProfilePicture: bookerProfilePicture,
            bookerId: bookerId,
            location: b.Location || b.location || "Location TBD",
            credits: b.Credits || b.credits || 0,
            notes: b.Notes || b.notes || "",
            coverImage: b.CoverImage || b.coverImage || b.task?.CoverImage || b.task?.coverImage || "",
            taskImages: taskImages
          };
          
          // Debug logging to see what data we're getting
          console.log('=== RAW BOOKING DATA ===');
          console.log('Raw booking object:', b);
          console.log('Task object:', b.task);
          console.log('Client info from booking:');
          console.log('  - BookerName:', b.BookerName);
          console.log('  - bookerName:', b.bookerName);
          console.log('  - BookerEmail:', b.BookerEmail);
          console.log('  - bookerEmail:', b.bookerEmail);
          console.log('  - BookerPhone:', b.BookerPhone);
          console.log('  - bookerPhone:', b.bookerPhone);
          console.log('  - BookerID:', b.BookerID);
          console.log('  - bookerID:', b.bookerID);
          console.log('  - Booker:', b.Booker);
          console.log('  - booker:', b.booker);
          console.log('TaskImages from booking:', b.TaskImages);
          console.log('taskImages from booking:', b.taskImages);
          console.log('Images from task:', b.task?.Images);
          console.log('images from task:', b.task?.images);
          console.log('=== PROCESSED BOOKING DATA ===');
          console.log('Booking data:', {
            id: booking.id,
            taskTitle: booking.taskTitle,
            bookerName: booking.bookerName,
            bookerEmail: booking.bookerEmail,
            bookerPhone: booking.bookerPhone,
            coverImage: booking.coverImage,
            taskImages: booking.taskImages,
            hasTaskImages: booking.taskImages && booking.taskImages.length > 0
          });
          
          return booking;
        });
        const bookings = await Promise.all(bookingsPromises);
        setBookings(bookings);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  // Sort bookings: completed > confirmed > pending > cancelled
  const statusOrder = { completed: 0, confirmed: 1, pending: 2, cancelled: 3 };
  const sortedBookings = [...bookings].sort((a, b) => {
    const aStatus = a.status ? a.status.toLowerCase() : '';
    const bStatus = b.status ? b.status.toLowerCase() : '';
    return (statusOrder[aStatus as keyof typeof statusOrder] ?? 99) - (statusOrder[bStatus as keyof typeof statusOrder] ?? 99);
  });

  // Filter bookings based on selected status
  const filteredBookings = selectedStatus === 'all' 
    ? sortedBookings 
    : sortedBookings.filter(b => b.status.toLowerCase() === selectedStatus);

  // Group bookings by status for stats
  const completedBookings = bookings.filter(booking => booking.status === 'completed');
  const confirmedBookings = bookings.filter(b => b.status && b.status.toLowerCase() === 'confirmed');
  const pendingBookings = bookings.filter(b => b.status && b.status.toLowerCase() === 'pending');
  const cancelledBookings = bookings.filter(b => b.status && b.status.toLowerCase() === 'cancelled');
  const totalRevenue = completedBookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <FaCheckDouble className="w-5 h-5 text-green-600" />;
      case 'confirmed':
        return <FaCheck className="w-5 h-5 text-blue-600" />;
      case 'pending':
        return <FaHourglassHalf className="w-5 h-5 text-yellow-600" />;
      case 'cancelled':
        return <FaTimesCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FaExclamationTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200';
      case 'confirmed':
        return 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200';
      case 'pending':
        return 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200';
      case 'cancelled':
        return 'bg-gradient-to-br from-red-50 to-pink-50 border-red-200';
      default:
        return 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="mx-auto">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-96"></div>
          </div>

          {/* Statistics Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-amber-50 p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="w-6 h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Filter Tabs Skeleton */}
          <div className="p-4 mb-8">
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded-lg animate-pulse w-24"></div>
              ))}
            </div>
          </div>

          {/* Bookings Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                {/* Cover Image Skeleton */}
                <div className="h-48 bg-gray-200"></div>
                
                {/* Content Skeleton */}
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                  
                  {/* Client Details Skeleton */}
                  <div className="border-t border-gray-100 pt-4 mb-4">
                    <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Credits and Location Skeleton */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                  
                  {/* Action Buttons Skeleton */}
                  <div className="space-y-2">
                    <div className="h-10 bg-gray-200 rounded-lg"></div>
                    <div className="h-10 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booked from Me</h1>
          <p className="text-gray-600">Manage your service bookings and track their progress</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-amber-50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
              </div>
              <div>
                <FaCalendarAlt className="w-6 h-6 text-emerald-700" />
              </div>
            </div>
          </div>

          <div className="bg-amber-50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedBookings.length}</p>
              </div>
              <div>
                <FaCheckDouble className="w-6 h-6 text-emerald-700" />
              </div>
            </div>
          </div>

          <div className="bg-amber-50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Confirmed</p>
                <p className="text-2xl font-bold text-gray-900">{confirmedBookings.length}</p>
              </div>
              <div>
                <FaCheck className="w-6 h-6 text-emerald-700" />
              </div>
            </div>
          </div>

          <div className="bg-amber-50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{pendingBookings.length}</p>
              </div>
              <div>
                <FaHourglassHalf className="w-6 h-6 text-emerald-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="p-4 mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === 'all'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({bookings.length})
            </button>
            <button
              onClick={() => setSelectedStatus('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === 'completed'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed ({completedBookings.length})
            </button>
            <button
              onClick={() => setSelectedStatus('confirmed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === 'confirmed'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Confirmed ({confirmedBookings.length})
            </button>
            <button
              onClick={() => setSelectedStatus('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === 'pending'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({pendingBookings.length})
            </button>
            <button
              onClick={() => setSelectedStatus('cancelled')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedStatus === 'cancelled'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancelled ({cancelledBookings.length})
            </button>
          </div>
        </div>

        {/* Bookings Grid */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCalendarAlt className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600">
              {selectedStatus === 'all' 
                ? "You haven't received any bookings yet."
                : `No ${selectedStatus} bookings found.`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.map((booking) => {
              const hasTaskImages = booking.taskImages && booking.taskImages.length > 0;
              const coverImage = hasTaskImages ? booking.taskImages![0] : null;
             
              return (
                <div key={booking.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Cover Image */}
                  <div className="relative h-48 bg-gradient-to-br from-blue-400 to-blue-600">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={booking.taskTitle}
                        className="w-full h-full object-cover"
                        style={{ zIndex: 1 }}
                        onLoad={() => console.log(`✅ Cover image loaded successfully for booking ${booking.id}:`, coverImage)}
                        onError={() => console.log(`❌ Cover image failed to load for booking ${booking.id}:`, coverImage)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white text-lg font-medium">Service Image</span>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-4 right-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1">{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {booking.taskTitle}
                    </h3>

                    {/* Date and Time */}
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <FaCalendarAlt className="w-4 h-4 mr-2" />
                      <span>{dayjs(booking.date).format('MMM DD, YYYY')}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600 mb-4">
                      <FaClock className="w-4 h-4 mr-2" />
                      <span>{booking.timeFrom} - {booking.timeTo}</span>
                    </div>

                    {/* Client Details */}
                    <div className="border-t border-gray-100 pt-4 mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Client</h4>
                      <div className="flex items-center space-x-3">
                        {booking.bookerProfilePicture ? (
                          <img
                            src={booking.bookerProfilePicture}
                            alt={booking.bookerName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 text-sm font-medium">
                              {booking.bookerName?.charAt(0)?.toUpperCase() || 'C'}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {booking.bookerName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {booking.bookerEmail}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Credits */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <FaCoins className="w-4 h-4 mr-2" />
                        <span>{booking.credits} Credits</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FaMapMarkerAlt className="w-4 h-4 mr-2" />
                        <span>{booking.location}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {booking.status.toLowerCase() === 'pending' && (
                        <button
                          onClick={() => handleConfirm(booking.id)}
                          disabled={confirmingId === booking.id}
                          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                        >
                          {confirmingId === booking.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Confirming...
                            </>
                          ) : (
                            <>
                              <FaCheck className="w-4 h-4 mr-2" />
                              Confirm Booking
                            </>
                          )}
                        </button>
                      )}

                      {booking.status.toLowerCase() === 'confirmed' && (
                        <button
                          onClick={() => handleComplete(booking.id)}
                          disabled={completingId === booking.id}
                          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                        >
                          {completingId === booking.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Completing...
                            </>
                          ) : (
                            <>
                              <FaCheckDouble className="w-4 h-4 mr-2" />
                              Mark as Completed
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => window.open(`/services/view/${booking.taskId}`, '_blank')}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
                      >
                        <FaEye className="w-4 h-4 mr-2" />
                        View Service
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Success/Error Dialog */}
      {dialog.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center">
              <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
                dialog.isError ? 'bg-red-100' : 'bg-green-100'
              }`}>
                {dialog.isError ? (
                  <FaTimes className="w-6 h-6 text-red-600" />
                ) : (
                  <FaCheck className="w-6 h-6 text-green-600" />
                )}
              </div>
              <h3 className={`text-lg font-medium mb-2 ${
                dialog.isError ? 'text-red-900' : 'text-green-900'
              }`}>
                {dialog.isError ? 'Error' : 'Success'}
              </h3>
              <p className="text-gray-600 mb-6">{dialog.message}</p>
              <button
                onClick={() => setDialog({ open: false, message: '', isError: false })} 
                className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                  dialog.isError 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
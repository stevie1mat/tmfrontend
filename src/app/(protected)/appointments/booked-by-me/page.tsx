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
  FaCheckDouble
} from "react-icons/fa";
import { FaCheckDouble as FaCheckDoubleIcon } from "react-icons/fa6";
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
  providerName?: string;
  providerEmail?: string;
  providerPhone?: string;
  providerProfilePicture?: string;
  providerId?: string;
  location?: string;
  credits?: number;
  notes?: string;
  coverImage?: string;
  taskImages?: string[];
}

export default function BookedByMePage() {
  const { refreshUser } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dialog, setDialog] = useState<{ open: boolean; message: string; isError: boolean }>({ open: false, message: '', isError: false });
  const [showReviewModal, setShowReviewModal] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmittedId, setReviewSubmittedId] = useState<string | null>(null);
  const [reviewedTaskIds, setReviewedTaskIds] = useState<string[]>([]);

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
        const res = await fetch(`${API_BASE_URL}/api/bookings?role=booker&id=${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Failed to fetch bookings");
        const data = await res.json();
        console.log("Raw bookings response:", data);
        
        // Handle different response structures
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
        
        const bookingsPromises = bookingsArray.map(async (b: any) => {
          // Get task ID from booking
          const taskId = b.TaskID || b.taskID || b.task?.ID || b.task?.id || b.taskId;
          console.log(`Booking ${b.ID || b.id}: Task ID = ${taskId}`);
          
          // Get provider ID from booking
          const providerId = b.TaskOwnerID || b.taskOwnerID || b.TaskOwner?.ID || b.taskOwner?.id || b.providerId;
          console.log(`Booking ${b.ID || b.id}: Provider ID = ${providerId}`);
          
          let taskImages = [];
          let providerName = b.TaskOwnerName || b.taskOwnerName || "Provider";
          let providerEmail = b.TaskOwnerEmail || b.taskOwnerEmail || "";
          let providerPhone = b.TaskOwnerPhone || b.taskOwnerPhone || "";
          let providerProfilePicture = "";
          
          // Fetch task details to get images and provider info
          if (taskId) {
            try {
              const taskRes = await fetch(`${API_BASE_URL}/api/tasks/get/${taskId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              if (taskRes.ok) {
                const taskData = await taskRes.json();
                console.log(`Task ${taskId} response:`, taskData);
                
                // Handle different task response structures
                let task = null;
                if (taskData && typeof taskData === 'object') {
                  if (taskData.data && typeof taskData.data === 'object') {
                    task = taskData.data;
                  } else if (taskData.task && typeof taskData.task === 'object') {
                    task = taskData.task;
                  } else {
                    task = taskData;
                  }
                }
                
                if (task) {
                  taskImages = task.Images || task.images || [];
                  console.log(`Fetched task ${taskId} images:`, taskImages);
                
                  // Get provider details from the task's Author field (which contains the profile picture)
                  if (task.Author) {
                    providerName = task.Author.Name || task.Author.name || providerName;
                    providerEmail = task.Author.Email || task.Author.email || providerEmail;
                    providerProfilePicture = task.Author.Avatar || task.Author.avatar || "";
                    console.log(`✅ Using provider details from task Author:`, { 
                      name: providerName, 
                      email: providerEmail, 
                      profilePicture: providerProfilePicture,
                      taskAuthor: task.Author
                    });
                  }
                }
              }
            } catch (err) {
              console.log(`Failed to fetch task ${taskId} details:`, err);
            }
          }
          
          // If we still don't have the profile picture, try fetching from auth service as fallback
          if (!providerProfilePicture && providerId) {
            try {
              const providerRes = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8080'}/api/auth/user/${providerId}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              if (providerRes.ok) {
                const providerData = await providerRes.json();
                const provider = providerData.data || providerData;
                providerName = provider.Name || provider.name || providerName;
                providerEmail = provider.Email || provider.email || providerEmail;
                providerPhone = provider.Phone || provider.phone || providerPhone;
                providerProfilePicture = provider.ProfilePictureURL || provider.profilePictureURL || provider.Avatar || provider.avatar || provider.ProfilePicture || provider.profilePicture || "";
                console.log(`✅ Fetched provider ${providerId} details from auth service:`, { 
                  name: providerName, 
                  email: providerEmail, 
                  phone: providerPhone, 
                  profilePicture: providerProfilePicture,
                  rawProviderData: provider
                });
                
                // If no profile picture from auth service, try profile service for this specific user
                if (!providerProfilePicture) {
                  try {
                    const profileRes = await fetch(`${process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:8081'}/api/profile/${providerId}`, {
                      headers: token ? { Authorization: `Bearer ${token}` } : {},
                    });
                    if (profileRes.ok) {
                      const profileData = await profileRes.json();
                      providerProfilePicture = profileData.ProfilePictureURL || profileData.profilePictureURL || "";
                      console.log(`✅ Fetched profile picture from profile service for user ${providerId}:`, providerProfilePicture);
                    } else {
                      console.log(`❌ Profile service returned:`, profileRes.status, profileRes.statusText);
                    }
                  } catch (profileErr) {
                    console.log(`❌ Error fetching profile picture from profile service:`, profileErr);
                  }
                }
              } else {
                console.log(`❌ Failed to fetch provider ${providerId} details:`, providerRes.status, providerRes.statusText);
                const errorText = await providerRes.text();
                console.log(`❌ Error response:`, errorText);
              }
            } catch (err) {
              console.log(`❌ Error fetching provider ${providerId} details:`, err);
            }
          } else if (!providerId) {
            console.log(`⚠️ No provider ID found for booking ${b.ID || b.id}`);
          }
          
          const booking = {
            id: b.ID || b.id || b._id,
            taskTitle: b.TaskTitle || b.taskTitle || b.task?.Title || b.task?.title || "",
            date: b.Timeslot?.Date || b.timeslot?.date || "",
            timeFrom: b.Timeslot?.TimeFrom || b.timeslot?.timeFrom || "",
            timeTo: b.Timeslot?.TimeTo || b.timeslot?.timeTo || "",
            status: b.Status || b.status || "",
            taskId: taskId, // Add the missing taskId!
            providerName: providerName,
            providerEmail: providerEmail,
            providerPhone: providerPhone,
            providerProfilePicture: providerProfilePicture,
            providerId: providerId,
            location: b.Location || b.location || "Location TBD",
            credits: b.Credits || b.credits || 0,
            notes: b.Notes || b.notes || "",
            coverImage: b.CoverImage || b.coverImage || b.task?.CoverImage || b.task?.coverImage || "",
            taskImages: taskImages
          };
          
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

  useEffect(() => {
    const fetchReviewed = async () => {
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
      if (!userId) return;
      const API_BASE_URL = process.env.NEXT_PUBLIC_REVIEW_API_URL || 'http://localhost:8086';
      try {
        const res = await fetch(`${API_BASE_URL}/api/reviews?reviewerId=${userId}`);
        if (!res.ok) return;
        const data = await res.json();
        setReviewedTaskIds(Array.isArray(data) ? data.map((r: any) => r.taskId) : []);
      } catch (err) {
        // ignore
      }
    };
    fetchReviewed();
  }, []);

  useEffect(() => {
    console.log("🔵 showReviewModal changed to:", showReviewModal);
  }, [showReviewModal]);

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
  const completedBookings = bookings.filter(b => b.status && b.status.toLowerCase() === 'completed');
  const confirmedBookings = bookings.filter(b => b.status && b.status.toLowerCase() === 'confirmed');
  const pendingBookings = bookings.filter(b => b.status && b.status.toLowerCase() === 'pending');
  const cancelledBookings = bookings.filter(b => b.status && b.status.toLowerCase() === 'cancelled');

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <FaCheckDoubleIcon className="w-5 h-5 text-green-600" />;
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
        return 'bg-green-50';
      case 'confirmed':
        return 'bg-blue-50';
      case 'pending':
        return 'bg-yellow-50';
      case 'cancelled':
        return 'bg-red-50';
      default:
        return 'bg-gray-50';
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
                  
                  {/* Provider Details Skeleton */}
                  <div className="border-t border-gray-100 pt-4 mb-4">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booked by Me</h1>
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
                <FaCheckDoubleIcon className="w-6 h-6 text-emerald-700" />
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
                ? "You haven't made any bookings yet."
                : `No ${selectedStatus} bookings found.`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBookings.map((booking) => {
              const hasReviewed = reviewedTaskIds.includes(booking.taskId || "");
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

                    {/* Provider Details */}
                    <div className="border-t border-gray-100 pt-4 mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Service Provider</h4>
                      <div className="flex items-center space-x-3">
                        {booking.providerProfilePicture ? (
                          <img
                            src={booking.providerProfilePicture}
                            alt={booking.providerName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 text-sm font-medium">
                              {booking.providerName?.charAt(0)?.toUpperCase() || 'P'}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {booking.providerName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {booking.providerEmail}
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
                      {booking.status.toLowerCase() === 'completed' && !hasReviewed && (
                        <button
                          onClick={() => {
                            console.log("🔵 Leave a Review button clicked for booking:", booking.id);
                            console.log("🔵 Setting showReviewModal to:", booking.id);
                            setShowReviewModal(booking.id);
                          }}
                          className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          Leave a Review
                        </button>
                      )}
                      
                      {booking.status.toLowerCase() === 'completed' && hasReviewed && (
                        <button
                          disabled
                          className="w-full bg-gray-300 text-gray-500 font-medium py-2 px-4 rounded-lg cursor-not-allowed"
                        >
                          Review Submitted
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

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="bg-white rounded-xl p-8 shadow-xl w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Leave a Review</h2>
            <div className="mb-4">
              <label className="block mb-2 font-medium">Rating:</label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={star <= reviewRating ? "text-yellow-400 text-2xl" : "text-gray-300 text-2xl"}
                    onClick={() => setReviewRating(star)}
                    style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                    tabIndex={0}
                    aria-label={`Set rating to ${star}`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium">Comment:</label>
              <textarea
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                rows={3}
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="Share your experience with this service..."
              />
            </div>
            <div className="flex gap-4 justify-end">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
                onClick={() => setShowReviewModal(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                onClick={async () => {
                  console.log("🔵 Submit Review button clicked!");
                  console.log("🔵 showReviewModal:", showReviewModal);
                  console.log("🔵 bookings:", bookings);
                  
                  const booking = bookings.find(b => b.id === showReviewModal);
                  console.log("🔵 Found booking:", booking);
                  
                  if (!booking?.taskId) {
                    console.error("❌ No booking or taskId found!");
                    console.log("❌ booking:", booking);
                    console.log("❌ booking?.taskId:", booking?.taskId);
                    return;
                  }
                  
                  console.log("🔵 Getting token from localStorage...");
                  const token = localStorage.getItem("token");
                  console.log("🔵 Token:", token ? "Found" : "Not found");
                  
                  let userId = null;
                  if (token) {
                    console.log("🔵 Fetching user profile from auth API...");
                    const authUrl = `${process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8081'}/api/auth/profile`;
                    console.log("🔵 Auth URL:", authUrl);
                    
                    try {
                      const profileRes = await fetch(authUrl, {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      console.log("🔵 Profile response status:", profileRes.status);
                      console.log("🔵 Profile response ok:", profileRes.ok);
                      
                      if (profileRes.ok) {
                        const profileData = await profileRes.json();
                        console.log("🔵 Profile data:", profileData);
                        userId = profileData.ID || profileData.id;
                        console.log("🔵 Extracted userId:", userId);
                      } else {
                        const errorText = await profileRes.text();
                        console.error("❌ Profile fetch failed:", errorText);
                      }
                    } catch (error) {
                      console.error("❌ Profile fetch error:", error);
                    }
                  }
                  
                  if (!userId) {
                    console.error("❌ No userId found! Cannot submit review.");
                    setDialog({ open: true, message: "Failed to get user information. Please try logging in again.", isError: true });
                    return;
                  }
                  
                  console.log("🔵 Preparing review data...");
                  const API_BASE_URL = process.env.NEXT_PUBLIC_REVIEW_API_URL || 'http://localhost:8086';
                  console.log("🔵 Review API URL:", API_BASE_URL);
                  
                  const reviewData = {
                    reviewerId: userId,
                    revieweeId: booking.providerId,
                    taskId: booking.taskId,
                    rating: reviewRating,
                    comment: reviewComment,
                  };
                  
                  console.log("🔵 Review data to submit:", reviewData);
                  console.log("🔵 reviewRating:", reviewRating);
                  console.log("🔵 reviewComment:", reviewComment);
                  console.log("🔵 booking.taskId:", booking.taskId, "Type:", typeof booking.taskId);
                  console.log("🔵 Is booking.taskId valid ObjectID?", /^[0-9a-fA-F]{24}$/.test(booking.taskId || ""));
                  
                  try {
                    console.log("🔵 Submitting review to API...");
                    const res = await fetch(`${API_BASE_URL}/api/reviews`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(reviewData),
                    });
                    
                    console.log("🔵 Review submission response status:", res.status);
                    console.log("🔵 Review submission response ok:", res.ok);
                    console.log("🔵 Review submission response statusText:", res.statusText);
                    
                    if (res.ok) {
                      const result = await res.json();
                      console.log("✅ Review submitted successfully:", result);
                      setReviewedTaskIds(prev => [...prev, booking.taskId!]);
                      setShowReviewModal(null);
                      setReviewRating(0);
                      setReviewComment("");
                      setReviewSubmittedId(booking.id);
                      setDialog({ open: true, message: "Review submitted successfully!", isError: false });
                    } else {
                      const errorText = await res.text();
                      console.error("❌ Review submission failed:", errorText);
                      setDialog({ open: true, message: `Failed to submit review: ${errorText}`, isError: true });
                    }
                  } catch (error) {
                    console.error("❌ Review submission error:", error);
                    setDialog({ open: true, message: `Network error: ${error}`, isError: true });
                  }
                }}
                disabled={reviewRating === 0}
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {dialog.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-md mx-4">
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                dialog.isError ? 'bg-red-100' : 'bg-green-100'
              }`}>
                {dialog.isError ? (
                  <FaTimesCircle className="w-6 h-6 text-red-600" />
                ) : (
                  <FaCheck className="w-6 h-6 text-green-600" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {dialog.isError ? 'Error' : 'Success'}
              </h3>
              <p className="text-gray-600 mb-6">{dialog.message}</p>
              <button
                onClick={() => setDialog({ open: false, message: '', isError: false })}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
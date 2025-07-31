"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiBell, FiCheck, FiX, FiFilter, FiEye, FiEyeOff, FiClock, FiUser, FiCalendar } from "react-icons/fi";
import { FaBell, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaUserTie, FaCheck, FaPlay, FaExclamationTriangle, FaEye, FaPhone, FaEnvelope, FaMapMarkerAlt, FaStar, FaCoins, FaCalendarAlt } from "react-icons/fa";
import { FaCheckDouble } from "react-icons/fa6";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  taskTitle?: string;
  taskId?: string;
  senderId?: string;
  senderName?: string;
}

interface TaskOwner {
  id: string;
}

type FilterType = 'all' | 'unread' | 'read' | 'booking' | 'booking_accepted' | 'review' | 'message';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskTitles, setTaskTitles] = useState<Record<string, string>>({});
  const [taskOwners, setTaskOwners] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showRead, setShowRead] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    booking: 0,
    booking_accepted: 0,
    review: 0,
    message: 0
  });
  const [deletingNotifications, setDeletingNotifications] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchCurrentUserId = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      if (!token) return;
      try {
        const profileRes = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8080'}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setCurrentUserId(profileData.ID || profileData.id);
        }
      } catch {}
    };
    fetchCurrentUserId();
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
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
        const res = await fetch(`${API_BASE_URL}/api/notifications?userId=${userId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Failed to fetch notifications");
        const data = await res.json();
        const notificationsData = Array.isArray(data) ? data : [];
        // Sort notifications by timestamp (newest first)
        const sortedNotifications = notificationsData.sort((a: Notification, b: Notification) => b.timestamp - a.timestamp);
        setNotifications(sortedNotifications);
        setError(null);
        
        // Calculate stats
        const newStats = {
          total: notificationsData.length,
          unread: notificationsData.filter((n: Notification) => !n.read).length,
          read: notificationsData.filter((n: Notification) => n.read).length,
          booking: notificationsData.filter((n: Notification) => n.type === 'booking').length,
          booking_accepted: notificationsData.filter((n: Notification) => n.type === 'booking_accepted').length,
          review: notificationsData.filter((n: Notification) => n.type === 'review').length,
          message: notificationsData.filter((n: Notification) => n.type === 'message').length
        };
        setStats(newStats);
        
        // Fetch task titles and owners for notifications that have a taskId
        const taskIdToFetch = notificationsData
          .filter((n: Notification) => n.taskId)
          .map((n: Notification) => n.taskId);
        if (taskIdToFetch.length > 0) {
          const token = localStorage.getItem("token");
          const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || 'http://localhost:8084';
          const fetchTitlesAndOwners = async () => {
            const titles: Record<string, string> = {};
            const owners: Record<string, string> = {};
            console.log('Fetching task details for:', taskIdToFetch);
            
            await Promise.all(taskIdToFetch.filter((taskId): taskId is string => taskId !== undefined).map(async (taskId: string) => {
              try {
                console.log('Fetching task:', taskId);
                const res = await fetch(`${API_BASE_URL}/api/tasks/get/${taskId}`, {
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (res.ok) {
                  const task = await res.json();
                  const taskData = task.data || task;
                  titles[taskId] = taskData.Title || taskData.title || "(No title)";
                  owners[taskId] = taskData.Author?.ID || taskData.Author?.id || taskData.author?.id || "";
                  console.log('Task fetched:', taskId, titles[taskId]);
                } else {
                  console.log('Failed to fetch task:', taskId, res.status);
                }
              } catch (error) {
                console.error('Error fetching task:', taskId, error);
              }
            }));
            console.log('Setting task titles:', titles);
            setTaskTitles(titles);
            setTaskOwners(owners);
          };
          fetchTitlesAndOwners();
        }
      } catch (err: any) {
        setError(err.message || "Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  // Filter notifications based on current filter
  useEffect(() => {
    let filtered = notifications;
    
    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.read);
    } else if (filter !== 'all') {
      filtered = filtered.filter(n => n.type === filter);
    }
    
    if (!showRead) {
      filtered = filtered.filter(n => !n.read);
    }
    
    setFilteredNotifications(filtered);
  }, [notifications, filter, showRead]);

  // Helper to get taskId as string
  const getTaskIdString = (taskId: any) => {
    if (!taskId) return undefined;
    if (typeof taskId === "string") return taskId;
    if (typeof taskId === "object" && "$oid" in taskId) return taskId["$oid"];
    return undefined;
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token");
      const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || 'http://localhost:8084';
      
      console.log('Marking notification as read:', notificationId);
      
      const res = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      console.log('Mark as read response status:', res.status);
      
      if (res.ok) {
        console.log('Successfully marked notification as read');
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        ));
        // Also update filtered notifications
        setFilteredNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        ));
        // Update stats
        setStats(prev => ({
          ...prev,
          unread: prev.unread - 1,
          read: prev.read + 1
        }));
      } else {
        const errorText = await res.text();
        console.error('Failed to mark as read:', res.status, errorText);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      // Add to deleting set
      setDeletingNotifications(prev => new Set(prev).add(notificationId));
      
      const token = localStorage.getItem("token");
      const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || 'http://localhost:8084';
      
      console.log('Deleting notification:', notificationId);
      
      // First, mark as read if not already read
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        try {
          const markReadRes = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          
          if (markReadRes.ok) {
            console.log('Marked notification as read before deletion');
          }
        } catch (markError) {
          console.error('Error marking notification as read:', markError);
        }
      }
      
      // Then delete the notification
      const res = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      console.log('Delete notification response status:', res.status);
      
      if (res.ok) {
        console.log('Successfully deleted notification');
        // Remove from both arrays
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setFilteredNotifications(prev => prev.filter(n => n.id !== notificationId));
        // Update stats
        setStats(prev => ({
          ...prev,
          total: prev.total - 1,
          unread: prev.unread - (notification?.read ? 0 : 1),
          read: prev.read - (notification?.read ? 1 : 0)
        }));
      } else {
        const errorText = await res.text();
        console.error('Failed to delete notification:', res.status, errorText);
        alert(`Failed to delete notification: ${errorText}`);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Error deleting notification. Please try again.');
    } finally {
      // Remove from deleting set
      setDeletingNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || 'http://localhost:8084';
      
      console.log('Marking all notifications as read');
      
      const res = await fetch(`${API_BASE_URL}/api/notifications/mark-all-read?userId=${currentUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      console.log('Mark all as read response status:', res.status);
      
      if (res.ok) {
        console.log('Successfully marked all notifications as read');
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setFilteredNotifications(prev => prev.map(n => ({ ...n, read: true })));
        // Update stats
        setStats(prev => ({
          ...prev,
          unread: 0,
          read: prev.total
        }));
      } else {
        const errorText = await res.text();
        console.error('Failed to mark all as read:', res.status, errorText);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <FaCalendarAlt className="w-5 h-5 text-green-600" />;
      case 'booking_accepted':
        return <FaCheck className="w-5 h-5 text-blue-600" />;
      case 'review':
        return <FaUserTie className="w-5 h-5 text-purple-600" />;
      case 'message':
        return <FaBell className="w-5 h-5 text-orange-600" />;
      default:
        return <FaBell className="w-5 h-5 text-gray-600" />;
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'booking_accepted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'review':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'message':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format relative time
  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    
    // Handle different timestamp formats
    let timestampMs: number;
    if (timestamp > 1000000000000) {
      // Timestamp is already in milliseconds
      timestampMs = timestamp;
    } else {
      // Timestamp is in seconds, convert to milliseconds
      timestampMs = timestamp * 1000;
    }
    
    const diff = now - timestampMs;
    
    // Handle negative or invalid timestamps
    if (diff < 0 || isNaN(diff)) {
      return 'Recently';
    }
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (days < 365) return `${days}d ago`;
    
    // For very old dates, show the actual date
    return new Date(timestampMs).toLocaleDateString();
  };

  // Handle notification click navigation
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'message':
        router.push('/messages');
        break;
      case 'booking':
      case 'booking_accepted':
        // For booking notifications, determine if user is task owner or booker
        const taskIdStr = getTaskIdString(notification.taskId);
        const isOwner = currentUserId && taskIdStr && taskOwners[taskIdStr] && currentUserId === taskOwners[taskIdStr];
        
        if (isOwner) {
          // User is the task owner, go to booked-from-me
          router.push('/appointments/booked-from-me');
        } else {
          // User is the booker, go to booked-by-me
          router.push('/appointments/booked-by-me');
        }
        break;
      case 'review':
        router.push('/reviews');
        break;
      default:
        // For other types, stay on notifications page
        break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Notifications</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
        <div className="w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-600">Stay updated with all your activity and interactions</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-amber-50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div>
                  <FaBell className="w-6 h-6 text-emerald-700" />
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unread</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.unread}</p>
                </div>
                <div>
                  <FaExclamationTriangle className="w-6 h-6 text-emerald-700" />
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.booking + stats.booking_accepted}</p>
                </div>
                <div>
                  <FaCalendarAlt className="w-6 h-6 text-emerald-700" />
                </div>
              </div>
            </div>

            <div className="bg-amber-50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.review}</p>
                </div>
                <div>
                  <FaUserTie className="w-6 h-6 text-emerald-700" />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="p-4 mb-8">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <FiFilter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filter:</span>
              </div>
              
              {(['all', 'unread', 'read', 'booking', 'booking_accepted', 'review', 'message'] as FilterType[]).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === filterType
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1).replace('_', ' ')}
                </button>
              ))}
              
              <div className="flex items-center gap-2 ml-auto">
                {stats.unread > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                  >
                    Mark all as read
                  </button>
                )}
                <button
                  onClick={() => setShowRead(!showRead)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  {showRead ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  {showRead ? 'Hide Read' : 'Show Read'}
                </button>
              </div>
            </div>
          </div>

          {/* Notifications Grid */}
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBell className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? "You're all caught up! No notifications to show." 
                  : `No ${filter} notifications found.`
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotifications.map((notification, idx) => {
                const taskIdStr = getTaskIdString(notification.taskId);
                const isOwner = currentUserId && taskIdStr && taskOwners[taskIdStr] && currentUserId === taskOwners[taskIdStr];
                
                return (
                  <div
                    key={notification.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Header */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getNotificationIcon(notification.type)}
                            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                              {notification.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium border border-blue-200">
                                NEW
                              </span>
                            )}
                            <span className={`px-2 py-1 text-xs rounded-full font-medium border ${getNotificationColor(notification.type)}`}>
                              {notification.type.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          disabled={deletingNotifications.has(notification.id)}
                          className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                            deletingNotifications.has(notification.id)
                              ? 'text-red-500 bg-red-50 cursor-not-allowed'
                              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                          }`}
                          title={deletingNotifications.has(notification.id) ? "Deleting..." : "Delete notification"}
                        >
                          {deletingNotifications.has(notification.id) ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <FaTimesCircle className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Message */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <FaBell className="w-4 h-4 text-emerald-600" />
                          Message
                        </h4>
                        <p className="text-gray-700 leading-relaxed">{notification.message}</p>
                      </div>
                      
                      {/* Task information */}
                      {taskIdStr && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <FaCalendarAlt className="w-4 h-4 text-emerald-600" />
                            Related Task
                          </h4>
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" 
                               onClick={() => {
                                 window.open(notification.type === "booking" ? "/appointments/booked-from-me" : "/appointments/booked-by-me", '_blank');
                               }}>
                            {/* Task Icon */}
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold">
                                <FaCalendarAlt className="w-6 h-6" />
                              </div>
                            </div>
                            
                            {/* Task Info */}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {taskTitles[taskIdStr] || "Loading..."}
                              </div>
                              <div className="text-xs text-gray-600 truncate">
                                Click to view details
                              </div>
                            </div>
                            
                            {/* Click Indicator */}
                            <div className="flex-shrink-0">
                              <FaEye className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                          {isOwner && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-700">
                              <FaUserTie className="w-3 h-3 text-gray-500" />
                              <span className="font-medium">You own this task</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Sender information */}
                      {notification.senderName && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <FaUserTie className="w-4 h-4 text-emerald-600" />
                            From
                          </h4>
                          <div className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                            {/* Profile Picture */}
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold text-lg">
                                {notification.senderName.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            
                            {/* Sender Info */}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">
                                {notification.senderName}
                              </div>
                              <div className="text-xs text-gray-600 truncate">
                                Notification sender
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Notification Details */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <FaCalendarAlt className="w-4 h-4 text-emerald-600" />
                          <span>{formatRelativeTime(notification.timestamp)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <FiClock className="w-4 h-4 text-blue-600" />
                          <span>{new Date(notification.timestamp * 1000).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-6">
                      {!notification.read ? (
                        <button
                          className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <FaCheck className="w-4 h-4" />
                          Mark as Read
                        </button>
                      ) : (
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
                            <FaCheckCircle className="w-5 h-5" />
                            Notification Read
                          </div>
                          <p className="text-sm text-gray-500 mt-1">You've already read this notification.</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
  );
} 
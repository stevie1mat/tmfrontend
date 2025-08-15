"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MdDashboard, MdTask, MdExplore, MdMessage } from "react-icons/md";
import { FiLogOut, FiSettings, FiHome, FiSearch, FiList, FiCalendar, FiMessageCircle, FiBell, FiUser, FiDollarSign, FiTrendingUp, FiUsers, FiHelpCircle, FiFileText, FiAward, FiBookOpen, FiPlus, FiShield, FiHeart, FiCpu } from "react-icons/fi";
import { FaCoins } from "react-icons/fa";
import { BiBrain } from "react-icons/bi";
import { FaBrain } from "react-icons/fa";
import { FaRegCalendarAlt, FaUserAlt } from "react-icons/fa";
import Link from "next/link";
import { BellIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthHeaders } from "@/lib/token-utils";

interface Notification {
  id: string;
  type: "booking" | "booking_accepted" | "message" | "review";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  taskId?: string;
}

export function NotificationBell({ userId }: { userId?: string }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskOwners, setTaskOwners] = useState<Record<string, string>>({});

  // Sort notifications by timestamp (newest first) and limit to 10 for dropdown
  const sortedNotifications = notifications
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || 'http://localhost:8084';

  useEffect(() => {
    if (!userId) return;
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/notifications?userId=${userId}`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch notifications");
        const data = await res.json();
        const notificationsData = Array.isArray(data) ? data : [];
        setNotifications(notificationsData);
        setError(null);
        
        // Fetch task owners for booking notifications
        await fetchTaskOwners(notificationsData);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setError("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };
    
    // Initial fetch
    fetchNotifications();
    
    // Poll every 2 minutes instead of 30 seconds to reduce requests
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, [userId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showDropdown && !target.closest('.notification-dropdown')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/notifications/mark-all-read?userId=${userId}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );
      if (!res.ok) throw new Error("Failed to mark all as read");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      alert("Failed to mark all as read");
    }
  };

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
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to mark as read");
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Fetch task owners for booking notifications
  const fetchTaskOwners = async (notifications: Notification[]) => {
    const bookingNotifications = notifications.filter(n => 
      (n.type === 'booking' || n.type === 'booking_accepted') && n.taskId
    );
    
    if (bookingNotifications.length === 0) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    const owners: Record<string, string> = {};

    await Promise.all(bookingNotifications.map(async (notification) => {
      if (notification.taskId) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/tasks/get/${notification.taskId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (res.ok) {
            const task = await res.json();
            const taskData = task.data || task;
            owners[notification.taskId] = taskData.Author?.ID || taskData.Author?.id || taskData.author?.id || "";
          }
        } catch (error) {
          console.error('Error fetching task owner:', error);
        }
      }
    }));

    setTaskOwners(owners);
  };

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
        if (notification.taskId && userId) {
          const taskOwnerId = taskOwners[notification.taskId];
          if (taskOwnerId && userId === taskOwnerId) {
            // User is the task owner, go to booked-from-me
            router.push('/appointments/booked-from-me');
          } else {
            // User is the booker, go to booked-by-me
            router.push('/appointments/booked-by-me');
          }
        } else {
          // Fallback to appointments page if we can't determine role
          router.push('/appointments');
        }
        break;
      case 'review':
        router.push('/reviews');
        break;
      default:
        // For other types, go to notifications page
        router.push('/notifications');
        break;
    }
    
    // Close the dropdown
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="notification-dropdown relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-105"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 animate-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-violet-50 to-purple-50 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 rounded-lg">
                <BellIcon className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-600">{unreadCount} unread</p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-violet-600 hover:text-violet-800 font-medium px-3 py-1 rounded-lg hover:bg-violet-100 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-2"></div>
                <p className="text-gray-500">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-500">
                <div className="text-red-400 mb-2">⚠️</div>
                {error}
              </div>
            ) : sortedNotifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-gray-400 mb-2 text-2xl">🔔</div>
                <p className="text-gray-500 font-medium">No notifications</p>
                <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
              </div>
            ) : (
              sortedNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !n.read ? "bg-gradient-to-r from-violet-50 to-purple-50 border-l-4 border-l-violet-500" : ""
                  }`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="flex items-start gap-3">
                    {/* Notification Icon */}
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      n.type === "booking" ? "bg-green-100" :
                      n.type === "message" ? "bg-blue-100" :
                      n.type === "review" ? "bg-yellow-100" :
                      "bg-gray-100"
                    }`}>
                      {n.type === "booking" ? (
                        <div className="w-4 h-4 text-green-600">📅</div>
                      ) : n.type === "message" ? (
                        <div className="w-4 h-4 text-blue-600">💬</div>
                      ) : n.type === "review" ? (
                        <div className="w-4 h-4 text-yellow-600">⭐</div>
                      ) : (
                        <div className="w-4 h-4 text-gray-600">🔔</div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm text-gray-900 truncate">{n.title}</p>
                        {!n.read && (
                          <span className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">{n.message}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          {formatRelativeTime(new Date(n.timestamp).getTime())}
                        </p>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          n.type === "booking" ? "bg-green-100 text-green-700" :
                          n.type === "message" ? "bg-blue-100 text-blue-700" :
                          n.type === "review" ? "bg-yellow-100 text-yellow-700" :
                          "bg-gray-100 text-gray-700"
                        }`}>
                          {n.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
            <Link
              href="/notifications"
              className="block text-center text-sm text-violet-600 hover:text-violet-800 font-medium py-2 px-4 rounded-lg hover:bg-violet-100 transition-colors"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ isCollapsed = false, onToggle }: { isCollapsed?: boolean; onToggle?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user } = useAuth();
  const credits = user?.Credits ?? user?.credits ?? null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const [appointmentsOpen, setAppointmentsOpen] = useState(false);

  return (
    <aside
      className={`${isCollapsed ? 'w-16' : 'w-64'} min-h-screen p-0 flex flex-col items-stretch bg-white/70 backdrop-blur-lg shadow-xl shadow-gray-200 border-r border-gray-200 transition-all duration-300`}
    >
        <div className={`${isCollapsed ? 'px-2' : 'px-6'} py-8 flex flex-col items-center gap-4 border-b border-gray-100 relative`}>
          {!isCollapsed && <h1 className="text-2xl font-extrabold tracking-tight text-gray-800">TradeMinutes.</h1>}
          {isCollapsed && <h1 className="text-xl font-extrabold tracking-tight text-gray-800">TM</h1>}
          
          {/* Credits Display */}
          {credits !== null && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 ${
              isCollapsed ? 'justify-center' : 'w-full'
            }`}>
              <FaCoins className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-medium text-emerald-700">{credits} credits</span>
              )}
            </div>
          )}
          
          {onToggle && (
            <button
              onClick={onToggle}
              className="absolute -right-3 top-8 p-1.5 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              {isCollapsed ? (
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              )}
            </button>
          )}
        </div>
        <nav className={`flex-1 flex flex-col gap-2 ${isCollapsed ? 'px-2' : 'px-4'} py-8`}>
          {/* Main Section */}
          <div className="mb-4">
            {!isCollapsed && <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4">Main</h4>}
            <div className="flex flex-col gap-2">
              <SidebarButton
                href="/dashboard"
                label="Dashboard"
                pathname={pathname}
                icon={<FiHome size={22} />}
                isCollapsed={isCollapsed}
              />
              <SidebarButton
                href="/ai-agents/my-workflows"
                label="My AI Agents"
                pathname={pathname}
                icon={<BiBrain size={22} />}
                isCollapsed={isCollapsed}
              />
              <SidebarButton
                href="/tasks/list"
                label="My Listings"
                pathname={pathname}
                icon={<FiList size={22} />}
                isCollapsed={isCollapsed}
              />
              {/* Collapsible My Bookings Menu */}
              {!isCollapsed && (
                <div>
                  <button
                    className={`flex items-center gap-3 w-full py-2 px-4 rounded-full font-medium transition-colors text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 bg-white/80 ${pathname?.startsWith('/appointments') ? 'font-bold' : ''}`}
                    style={{ minHeight: 44 }}
                    onClick={() => setAppointmentsOpen((open) => !open)}
                    aria-expanded={appointmentsOpen}
                  >
                    <FiCalendar size={20} />
                    <span className="truncate">My Bookings</span>
                    {appointmentsOpen ? <ChevronUpIcon className="w-4 h-4 ml-auto" /> : <ChevronDownIcon className="w-4 h-4 ml-auto" />}
                  </button>
                  {appointmentsOpen && (
                    <div className="ml-8 flex flex-col gap-1 mt-1">
                      <SidebarButton
                        href="/appointments/booked-from-me"
                        label="New Bookings"
                        pathname={pathname}
                        icon={<span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />}
                        isCollapsed={isCollapsed}
                      />
                      <SidebarButton
                        href="/appointments/booked-by-me"
                        label="Booked by Me"
                        pathname={pathname}
                        icon={<span className="w-2 h-2 bg-blue-500 rounded-full inline-block" />}
                        isCollapsed={isCollapsed}
                      />
                    </div>
                  )}
                </div>
              )}
              {isCollapsed && (
                <SidebarButton
                  href="/appointments"
                  label="Bookings"
                  pathname={pathname}
                  icon={<FiCalendar size={22} />}
                  isCollapsed={isCollapsed}
                />
              )}
            </div>
          </div>

          {/* Business Section */}
          <div className="mb-4">
            {!isCollapsed && <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4">Business</h4>}
            <div className="flex flex-col gap-2">
              <SidebarButton
                href="/credits"
                label="Earnings Dashboard"
                pathname={pathname}
                icon={<FiDollarSign size={22} />}
                isCollapsed={isCollapsed}
              />
              <SidebarButton
                href="/reviews"
                label="My Reviews"
                pathname={pathname}
                icon={<FiAward size={22} />}
                isCollapsed={isCollapsed}
              />
              <SidebarButton
                href="/clients"
                label="Client Directory"
                pathname={pathname}
                icon={<FiUsers size={22} />}
                isCollapsed={isCollapsed}
              />
            </div>
          </div>

          {/* Communication Section */}
          <div className="mb-4">
            {!isCollapsed && <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-4">Communication</h4>}
            <div className="flex flex-col gap-2">
              <SidebarButton
                href="/messages"
                label="Messages"
                pathname={pathname}
                icon={<FiMessageCircle size={22} />}
                isCollapsed={isCollapsed}
              />
              <SidebarButton
                href="/notifications"
                label="Notifications"
                pathname={pathname}
                icon={<FiBell size={22} />}
                isCollapsed={isCollapsed}
              />
            </div>
          </div>
        </nav>
      </aside>
  );
}

function SidebarButton({
  href,
  label,
  pathname,
  icon,
  isCollapsed = false,
}: {
  href: string;
  label: string;
  pathname: string | null;
  icon: React.ReactNode;
  isCollapsed?: boolean;
}) {
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} w-full py-2 ${isCollapsed ? 'px-2' : 'px-4'} rounded-full font-medium transition-colors text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 ${
        isActive
          ? "bg-emerald-700 text-white shadow-md"
          : "bg-white/80"
      }`}
      style={{ minHeight: 44 }}
      title={isCollapsed ? label : undefined}
    >
      {icon}
      {!isCollapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

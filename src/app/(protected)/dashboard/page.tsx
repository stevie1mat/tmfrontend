"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import { FaTasks, FaListAlt, FaBook, FaHashtag } from "react-icons/fa";
import { profileAPI, servicesAPI, tasksAPI, activitiesAPI, statsAPI, cacheManagement } from "@/lib/dashboard-api";
import { useAuth } from "@/contexts/AuthContext";
import { 
  FaHome, 
  FaMoon, 
  FaBolt, 
  FaCog,
  FaPlus,
  FaSearch,
  FaBell,
  FaCalendar,
  FaChartLine,
  FaInfo,
  FaChevronDown,
  FaUsers,
  FaCheck,
  FaClipboard,
  FaPlay,
  FaTrophy,
  FaMedal,
  FaStar,
  FaEnvelope,
  FaBookOpen,
  FaClipboardList,
  FaUserFriends,
  FaSignOutAlt,
  FaHeart,
  FaArrowRight,
  FaArrowLeft,
  FaEllipsisV,
  FaMailBulk,
  FaChartBar,
  FaDollarSign,
  FaHandshake,
  FaTools,
  FaShoppingCart,
  FaUserTie,
  FaClock,
  FaMapMarkerAlt,
  FaPhone,
  FaGlobe,
  FaCoins,
  FaCircle
} from "react-icons/fa";

import ServiceSlider from "@/components/ServiceSlider";
import ChatBotWithAuth from "@/components/ChatBotWithAuth";
import Link from "next/link";
import CreateTaskModal from "../tasks/CreateTaskModal";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Map = dynamic(() => import("@/components/OpenStreetMap"), { ssr: false });

// ─── added modal-related helper component ──────────────────────────────────────
function SkillTagInput({
  tags,
  setTags,
}: {
  tags: string[];
  setTags: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setInput("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <div>
      <label className="text-sm font-medium block mb-1">
        Skills & Services
      </label>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="bg-violet-100 text-violet-800 px-2 py-1 rounded-full text-xs flex items-center gap-1"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="text-red-500 font-bold leading-none"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
          placeholder="e.g. #WebDevelopment"
          className="flex-1 px-3 py-2 border rounded bg-white text-black"
        />
        <button
          onClick={addTag}
          className="bg-violet-600 text-white px-3 py-2 rounded"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────

// Define Service type for marketplace stats
type Service = {
  id?: string;
  ID?: string;
  Title?: string;
  title?: string;
  Price?: number;
  price?: number;
  Category?: string;
  category?: string;
  rating?: number;
  Rating?: number;
  reviewCount?: number;
  ReviewCount?: number;
  reviews?: number;
  Reviews?: number;
  Images?: string[]; // Add Images field for cover images
  Tiers?: Array<{ name: string; credits: number; title: string; description: string; features: string[]; availableTimeSlot: string; maxDays: number }>;
  tiers?: Array<{ name: string; credits: number; title: string; description: string; features: string[]; availableTimeSlot: string; maxDays: number }>;
  Author?: {
    Name?: string;
    ProfilePictureURL?: string;
    Avatar?: string;
  };
  author?: {
    name?: string;
    profilePictureURL?: string;
    avatar?: string;
  };
};

// Define Task type for taskStats
type Task = {
  Title?: string;
  title?: string;
  Credits?: number;
  credits?: number;
};

export default function ProfileDashboardPage() {
  const { refreshUser, user: authUser } = useAuth();
  const [profile, setProfile] = useState<{
    Name: string;
    Email: string;
    university?: string;
    program?: string;
    yearOfStudy?: string;
    skills?: string[];
    Credits?: number;
    isProvider?: boolean;
    rating?: number;
    completedServices?: number;
    totalEarnings?: number;
    ProfilePictureURL?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // ─── new state for modal steps ──────────────────────────────────────────────
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [profileStep, setProfileStep] = useState(1);
  const [formError, setFormError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  const [formData, setFormData] = useState({
    university: "",
    program: "",
    yearOfStudy: "",
    skills: [] as string[],
  });
  const [skillInput, setSkillInput] = useState("");

  const [showCreditsDialog, setShowCreditsDialog] = useState(false);
  const [showBonusDialog, setShowBonusDialog] = useState(false);
  const [creditsBefore, setCreditsBefore] = useState<number | null>(null);
  const [creditsAfter, setCreditsAfter] = useState<number | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const API_BASE =
    process.env.NEXT_PUBLIC_PROFILE_API_URL || "http://localhost:8081";

  const updateProfile = async () => {
    try {
      await profileAPI.updateProfile({
        college: formData.university,
        program: formData.program,
        yearOfStudy: formData.yearOfStudy,
        skills: formData.skills,
      });
    } catch (error) {
      console.error("Profile update failed:", error);
      throw error;
    }
  };

  // ────────────────────────────────────────────────────────────────────────────

  const router = useRouter();

  // Handle service card click to navigate to task view
  const handleServiceClick = (service: Service) => {
    const serviceId = service.id || service.ID;
    if (serviceId) {
      router.push(`/tasks/view/${serviceId}`);
    }
  };

  // --- Analytics state ---
  const [taskStats, setTaskStats] = useState<{ total: number; credits: number; recent: Task[] }>({ total: 0, credits: 0, recent: [] });
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  
  // --- Marketplace Analytics state ---
  const [serviceStats, setServiceStats] = useState<{ total: number; earnings: number; recent: Service[] }>({ total: 0, earnings: 0, recent: [] });
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [marketplaceStats, setMarketplaceStats] = useState({
    totalServices: 0,
    activeProviders: 0,
    totalBookings: 0,
    averageRating: 4.5
  });

  // --- Loading states for individual sections ---
  const [servicesLoading, setServicesLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [performanceMetricsLoaded, setPerformanceMetricsLoaded] = useState(false);
  const [quickActionsLoaded, setQuickActionsLoaded] = useState(false);

  // --- Recent activities state ---
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // --- Real-time updates state (kept for compatibility) ---
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLive, setIsLive] = useState(true);

  // Cache is now handled by the dedicated caching system

  // --- Main data fetching effect (optimized with caching) ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("❌ No token found — redirecting to login");
      router.push("/login");
      return;
    }

    // Optimized data fetching with caching - independent loading
    const fetchAllData = async () => {
      try {
        console.log('🚀 Fetching dashboard data with independent loading...');
        
        // Start fetching all data in parallel
        const [profileData, marketplaceData, userStatsData, servicesData, tasksData, activitiesData] = await Promise.allSettled([
          profileAPI.getProfile(),
          statsAPI.getMarketplaceStats(),
          statsAPI.getUserStats(),
          servicesAPI.getUserServices(3),
          tasksAPI.getUserTasks(5),
          activitiesAPI.getRecentActivities()
        ]);

        // Handle profile data (needed for Performance Metrics)
        if (profileData.status === 'fulfilled') {
          setProfile(profileData.value);
          
          // Store profile data in localStorage for top bar access
          try {
            localStorage.setItem("userProfile", JSON.stringify(profileData.value));
            console.log("✅ Profile data stored in localStorage for top bar access");
          } catch (error) {
            console.log("Could not store profile in localStorage");
          }
          
          // Check for missing profile fields
          const hasUniversity = profileData.value.university && profileData.value.university.trim() !== "";
          const hasProgram = profileData.value.program && profileData.value.program.trim() !== "";
          const hasYearOfStudy = profileData.value.yearOfStudy && profileData.value.yearOfStudy.trim() !== "";

          if (!hasUniversity || !hasProgram || !hasYearOfStudy) {
            console.log("⚠️ Profile modal will show - missing fields detected");
            setShowProfileDialog(true);
            setFormData((prev) => ({
              ...prev,
              university: profileData.value.university.trim(),
              program: profileData.value.program.trim(),
              yearOfStudy: profileData.value.yearOfStudy.trim(),
              skills: profileData.value.skills,
            }));
          } else {
            console.log("✅ Profile complete - modal will NOT show");
            setShowProfileDialog(false);
          }
        } else {
          console.error("Failed to fetch profile:", profileData.reason);
        }

        // Handle marketplace stats (needed for Performance Metrics)
        if (marketplaceData.status === 'fulfilled') {
          setMarketplaceStats(marketplaceData.value);
        } else {
          console.error("Failed to fetch marketplace stats:", marketplaceData.reason);
        }

        // Handle user stats (needed for Performance Metrics)
        if (userStatsData.status === 'fulfilled') {
          // Update profile with user stats if needed
          if (profileData.status === 'fulfilled' && profileData.value) {
            setProfile(prev => prev ? {
              ...prev,
              ...userStatsData.value
            } : profileData.value);
          }
        } else {
          console.error("Failed to fetch user stats:", userStatsData.reason);
        }

        // Mark Performance Metrics and Quick Actions as loaded immediately
        setPerformanceMetricsLoaded(true);
        setQuickActionsLoaded(true);
        setProfileLoading(false);

        // Handle services data (Recent Services section)
        if (servicesData.status === 'fulfilled') {
          console.log("✅ Services data fetched successfully:", servicesData.value);
          setServiceStats(servicesData.value);
        } else {
          console.error("❌ Failed to fetch services:", servicesData.reason);
          // Set empty services data to show the empty state
          setServiceStats({ total: 0, earnings: 0, recent: [] });
        }

        // Handle tasks data
        if (tasksData.status === 'fulfilled') {
          console.log("✅ Tasks data fetched successfully:", tasksData.value);
          setTaskStats(tasksData.value);
        } else {
          console.error("❌ Failed to fetch tasks:", tasksData.reason);
          // Set empty tasks data
          setTaskStats({ total: 0, credits: 0, recent: [] });
        }

        // Handle activities data
        if (activitiesData.status === 'fulfilled') {
          console.log("✅ Activities data fetched successfully:", activitiesData.value);
          setRecentActivities(activitiesData.value);
        } else {
          console.error("❌ Failed to fetch activities:", activitiesData.reason);
          // Set empty activities data
          setRecentActivities([]);
        }

              } catch (error) {
          console.error("Error in dashboard data fetching:", error);
        } finally {
          setLoading(false);
          setServicesLoading(false);
          setTasksLoading(false);
          setActivitiesLoading(false);
        }
    };

    // Clear cache to ensure fresh data
    cacheManagement.clearAllCache();
    
    // Start fetching immediately
    fetchAllData();

    // Warm up cache for better performance on subsequent visits
    cacheManagement.warmDashboardCache();

  }, [router]);

  // Activities are now handled by the cached API in the main useEffect

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // When profile modal opens, show credits dialog
  useEffect(() => {
    if (showProfileDialog && profile?.Credits !== undefined) {
      setCreditsBefore(profile.Credits);
      setShowCreditsDialog(true);
    }
  }, [showProfileDialog, profile]);

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      setFormData({ ...formData, skills: [...formData.skills, trimmed] });
    }
    setSkillInput("");
  };

  const handleProfileSaved = async () => {
    setProfileSaved(true);
    setTimeout(async () => {
      // Close the profile dialog and reset states
      setShowProfileDialog(false);
      setProfileSaved(false);
      setFormError("");
      setProfileStep(1);
      setFormData({
        university: "",
        program: "",
        yearOfStudy: "",
        skills: [],
      });
      setSkillInput("");
      
      try {
        console.log("🔄 Refreshing dashboard data after profile update...");
        
        // Invalidate all caches to ensure fresh data
        cacheManagement.invalidateAll();
        
        // Fetch fresh profile data
        const updatedProfile = await profileAPI.getProfile();
        console.log("✅ Updated profile:", updatedProfile);
        
        setCreditsAfter(updatedProfile.Credits);
        setProfile(updatedProfile);
        
        // Refresh other dashboard data
        const [servicesData, tasksData, activitiesData] = await Promise.allSettled([
          servicesAPI.getUserServices(3),
          tasksAPI.getUserTasks(5),
          activitiesAPI.getRecentActivities()
        ]);
        
        // Update service stats if successful
        if (servicesData.status === 'fulfilled') {
          setServiceStats(servicesData.value);
        }
        
        // Update task stats if successful
        if (tasksData.status === 'fulfilled') {
          setTaskStats(tasksData.value);
        }
        
        // Update activities if successful
        if (activitiesData.status === 'fulfilled') {
          setRecentActivities(activitiesData.value);
        }
        
        // Show bonus dialog
        setShowBonusDialog(true);
        setTimeout(() => setShowBonusDialog(false), 3000);
        
        console.log("✅ Dashboard data refreshed successfully");
        
        // Refresh AuthContext to update topbar
        await refreshUser();
        console.log("✅ AuthContext refreshed");
        console.log("🔍 AuthContext user data after refresh:", authUser);
        
        // Reset loading states to ensure components render
        setProfileLoading(false);
        setServicesLoading(false);
        setTasksLoading(false);
        setActivitiesLoading(false);
      } catch (error) {
        console.error("❌ Error refreshing dashboard data:", error);
      }
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-white">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            
            {/* User Greeting Section Skeleton */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-2">
                  <div className="h-8 bg-gray-200 rounded animate-pulse w-64"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-96"></div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Performance Metrics Skeleton */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-48"></div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32"></div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-[#FAF6ED] rounded-xl p-6 animate-pulse">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="w-5 h-5 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions Skeleton */}
            <div className="mb-8">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-32 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4 bg-[#FAF6ED] rounded-xl animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity Skeleton */}
            <div className="mb-8">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-40 mb-4"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-gray-200 animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-48"></div>
                        <div className="h-3 bg-gray-200 rounded w-32"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Services Section Skeleton */}
            <div className="mb-8">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-32 mb-4"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="flex items-center justify-between">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map Section Skeleton */}
            <div className="mb-8">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-24 mb-4"></div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="flex h-screen bg-white">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">

            {/* User Greeting Section */}


            {/* Performance Metrics */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-xs text-gray-500">
                    {isLive ? 'Live' : 'Offline'} • Last updated: {lastUpdate.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            {!performanceMetricsLoaded ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-[#FAF6ED] rounded-xl p-6 animate-pulse">
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="w-5 h-5 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#FAF6ED] rounded-xl p-6 text-gray-900">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Monthly Earnings</span>
                    {/* Replace icon with TM */}
                    <span className="text-xs font-bold text-emerald-700 align-super">TM</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    <span className="text-xs font-normal align-super">TM</span>{profile?.totalEarnings || serviceStats.earnings || 0}
                  </div>
                  <div className="text-sm text-gray-600">
                    {profile?.totalEarnings && profile.totalEarnings > 0 ? '+12% from last month' : 'Start earning today'}
                  </div>
                </div>
                
                <div className="bg-[#FAF6ED] rounded-xl p-6 text-gray-900">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Services Completed</span>
                    <FaCheck className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{profile?.completedServices || serviceStats.total || 0}</div>
                  <div className="text-sm text-gray-600">This month</div>
                </div>
                
                <div className="bg-[#FAF6ED] rounded-xl p-6 text-gray-900">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Average Rating</span>
                    <FaStar className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{profile?.rating || marketplaceStats.averageRating}</div>
                  <div className="text-sm text-gray-600">
                    {profile?.rating ? `${Math.floor(Math.random() * 50) + 10} reviews` : 'No reviews yet'}
                  </div>
                </div>
                
                <div className="bg-[#FAF6ED] rounded-xl p-6 text-gray-900">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Active Bookings</span>
                    <FaCalendar className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{upcomingAppointments.length || upcomingBookings.length || 0}</div>
                  <div className="text-sm text-gray-600">Upcoming</div>
                </div>
              </div>
            )}
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              {!quickActionsLoaded ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 bg-[#FAF6ED] rounded-xl animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-3 p-4 bg-[#FAF6ED] hover:bg-[#F5F0E0] rounded-xl transition-colors w-full text-left"
                >
                  <div className="w-10 h-10 bg-emerald-700 rounded-lg flex items-center justify-center">
                    <FaPlus className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Create Service</p>
                    <p className="text-sm text-gray-600">List your skills</p>
                  </div>
                </button>
                
                <Link href="/services/all" className="flex items-center gap-3 p-4 bg-[#FAF6ED] hover:bg-[#F5F0E0] rounded-xl transition-colors">
                  <div className="w-10 h-10 bg-emerald-700 rounded-lg flex items-center justify-center">
                    <FaCalendar className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Book Service</p>
                    <p className="text-sm text-gray-600">Find providers</p>
                  </div>
                </Link>
                
                <Link href="/messages" className="flex items-center gap-3 p-4 bg-[#FAF6ED] hover:bg-[#F5F0E0] rounded-xl transition-colors">
                  <div className="w-10 h-10 bg-emerald-700 rounded-lg flex items-center justify-center">
                    <FaEnvelope className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">View conversations</p>
                    <p className="text-sm text-gray-600">View conversations</p>
                  </div>
                </Link>
                
                <Link href="/reviews" className="flex items-center gap-3 p-4 bg-[#FAF6ED] hover:bg-[#F5F0E0] rounded-xl transition-colors">
                  <div className="w-10 h-10 bg-emerald-700 rounded-lg flex items-center justify-center">
                    <FaStar className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">Reviews</p>
                    <p className="text-sm text-gray-600">Rate services</p>
                  </div>
                </Link>
              </div>
            )}
            </div>

            {/* Recent Services */}
            <div className="mb-8">
            {servicesLoading ? (
              <div className="bg-white rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                      <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <div className="inline-flex items-center gap-2 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                    <span className="text-sm">Loading your services...</span>
                  </div>
                </div>
              </div>
            ) : (
              <ServiceSlider
                services={serviceStats.recent}
                title="Recent Services"
                loading={false}
                emptyMessage="No services created yet. Create your first service to get started."
                showViewAll={serviceStats.recent.length > 5}
                onViewAll={() => router.push('/my-listings')}
                maxItems={5}
                noPadding={true}
              />
            )}
            </div>

            {/* Upcoming Bookings */}
            {/* The Upcoming Bookings section has been removed from the dashboard page. */}

          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-72 bg-white shadow-sm p-4 overflow-y-auto flex-shrink-0">
          {/* Profile & Stats Section */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <div className="relative inline-block">
                {profile?.ProfilePictureURL ? (
                  <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden border-4 border-blue-200">
                    <Image
                      src={profile.ProfilePictureURL}
                      alt={`${profile.Name}'s profile picture`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-blue-200">
                    <span className="text-white font-bold text-lg">
                      {profile?.Name?.charAt(0) || "J"}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">{profile?.completedServices || 0} services completed</p>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Good Morning {profile?.Name?.split(' ')[0] || 'Jason'} 🔥</h4>
              <p className="text-sm text-gray-600">Keep growing your business!</p>
            </div>
          </div>

          {/* Recent Activity Section (enhanced) */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <div className="flex items-center gap-2">
                <FaClock className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">{recentActivities.length} activities</span>
              </div>
            </div>
            
            {/* Quick Stats Bar */}
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-3 mb-4 border border-emerald-100">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FaStar className="w-3 h-3 text-yellow-500" />
                  <span className="text-gray-700 font-medium">This Week</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">{recentActivities.filter(a => a.type === 'service_completed').length} completed</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">{recentActivities.filter(a => a.type === 'service_provided').length} provided</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {activitiesLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading activities...</p>
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaClock className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500">No recent activity</p>
                  <p className="text-xs text-gray-400 mt-1">Start creating services to see activity</p>
                </div>
              ) : (
                recentActivities.slice(0, 5).map((activity: any, idx: number) => {
                  const getActivityIcon = (type: string) => {
                    switch(type) {
                      case 'service_completed': return <FaCheck className="w-3 h-3 text-green-600" />;
                      case 'service_provided': return <FaHandshake className="w-3 h-3 text-blue-600" />;
                      case 'service_booked': return <FaCalendar className="w-3 h-3 text-purple-600" />;
                      case 'review_received': return <FaStar className="w-3 h-3 text-yellow-600" />;
                      case 'credits_earned': return <FaCoins className="w-3 h-3 text-emerald-600" />;
                      default: return <FaCircle className="w-3 h-3 text-gray-400" />;
                    }
                  };
                  
                  const getActivityColor = (type: string) => {
                    switch(type) {
                      case 'service_completed': return 'bg-green-100 border-green-200';
                      case 'service_provided': return 'bg-blue-100 border-blue-200';
                      case 'service_booked': return 'bg-purple-100 border-purple-200';
                      case 'review_received': return 'bg-yellow-100 border-yellow-200';
                      case 'credits_earned': return 'bg-emerald-100 border-emerald-200';
                      default: return 'bg-gray-100 border-gray-200';
                    }
                  };
                  
                  const getTimeAgo = (timestamp: string) => {
                    const now = new Date();
                    const activityTime = new Date(timestamp);
                    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
                    
                    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
                    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
                    return `${Math.floor(diffInMinutes / 1440)}d ago`;
                  };
                  
                  return (
                    <div key={activity.id || idx} className={`p-3 rounded-lg border ${getActivityColor(activity.type)} hover:shadow-sm transition-all duration-200`}>
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">{activity.title}</p>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{getTimeAgo(activity.timestamp)}</span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{activity.description}</p>
                          {activity.credits && (
                            <div className="flex items-center gap-1">
                              <FaCoins className="w-3 h-3 text-emerald-500" />
                              <span className="text-xs font-medium text-emerald-700">+{activity.credits} credits</span>
                            </div>
                          )}
                          {activity.rating && (
                            <div className="flex items-center gap-1 mt-1">
                              <FaStar className="w-3 h-3 text-yellow-500" />
                              <span className="text-xs text-gray-600">{activity.rating} stars</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* View All Activities Button */}
            {recentActivities.length > 5 && (
              <div className="mt-4 text-center">
                <button className="text-xs text-emerald-600 hover:text-emerald-800 font-medium">
                  View all {recentActivities.length} activities →
                </button>
              </div>
            )}
          </div>
      </div>

      {/* ─── new profile-completion dialog (2-step) ───────────────────────────── */}
      {showProfileDialog && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gradient-to-br from-[#e0fce6] via-white to-[#bbf7d0] p-8 rounded-2xl shadow-2xl w-full max-w-xl space-y-6 text-[#1a1446] border border-[#22c55e]/20">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-10 h-10 bg-[#22c55e] rounded-full">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="block">
                  <path d="M6 12.5l4 4 8-8" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              Complete Your Profile
            </h2>
            {/* Step 1: Basic academic info */}
            {profileStep === 1 && (
              <div className="space-y-4">
                <div className="text-green-700 bg-green-50 border border-green-200 rounded-full px-4 py-2 font-medium text-center">
                  Complete your profile to get <span className="font-bold">200 bonus credits!</span>
                </div>
                {formError && (
                  <div className="text-red-600 text-sm mb-2 font-medium">{formError}</div>
                )}
                <input
                  type="text"
                  placeholder="College/University"
                  value={formData.university}
                  onChange={e => {
                    setFormData({ ...formData, university: e.target.value });
                    if (formError) setFormError("");
                  }}
                  className="w-full px-5 py-3 border border-gray-200 rounded-full bg-white text-[#1a1446] placeholder-gray-400 text-base focus:border-[#22c55e] outline-none"
                />
                <input
                  type="text"
                  placeholder="Program/Major"
                  value={formData.program}
                  onChange={e => {
                    setFormData({ ...formData, program: e.target.value });
                    if (formError) setFormError("");
                  }}
                  className="w-full px-5 py-3 border border-gray-200 rounded-full bg-white text-[#1a1446] placeholder-gray-400 text-base focus:border-[#22c55e] outline-none"
                />
                <input
                  type="text"
                  placeholder="Year of Study (e.g. 2nd Year BSc)"
                  value={formData.yearOfStudy}
                  onChange={e => {
                    setFormData({ ...formData, yearOfStudy: e.target.value });
                    if (formError) setFormError("");
                  }}
                  className="w-full px-5 py-3 border border-gray-200 rounded-full bg-white text-[#1a1446] placeholder-gray-400 text-base focus:border-[#22c55e] outline-none"
                />
                <div className="text-right">
                  <button
                    onClick={() => {
                      if (!formData.university || !formData.program || !formData.yearOfStudy) {
                        setFormError("All fields are required.");
                        return;
                      }
                      setFormError("");
                      setProfileStep(2);
                    }}
                    className="bg-[#22c55e] hover:bg-[#16a34a] text-white px-6 py-2 rounded-full font-semibold shadow-sm transition"
                  >
                    Next ➝
                  </button>
                </div>
              </div>
            )}
            {/* Step 2: Skills & interests */}
            {profileStep === 2 && (
              <div className="space-y-6">
                {formError && (
                  <div className="text-red-600 text-sm mb-2 font-medium">{formError}</div>
                )}
                <div>
                  <label className="text-sm font-medium block mb-1 text-[#15803d]">Skills & Services</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.skills.map((tag) => (
                      <span
                        key={tag}
                        className="bg-[#e0fce6] text-[#15803d] px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border border-[#22c55e]/30"
                      >
                        {tag}
                        <button
                          onClick={() => setFormData({ ...formData, skills: formData.skills.filter((t) => t !== tag) })}
                          className="text-[#22c55e] font-bold leading-none ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={skillInput}
                      onChange={e => setSkillInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      placeholder="e.g. #WebDevelopment"
                      className="flex-1 px-5 py-3 border border-gray-200 rounded-full bg-white text-[#1a1446] placeholder-gray-400 text-base focus:border-[#22c55e] outline-none"
                    />
                    <button
                      onClick={handleAddSkill}
                      className="bg-[#22c55e] hover:bg-[#16a34a] text-white px-6 py-2 rounded-full font-semibold shadow-sm transition"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => {
                      setFormError("");
                      setProfileStep(1);
                    }}
                    className="text-sm text-[#22c55e] hover:underline font-medium px-4 py-2 rounded-full bg-[#f0fdf4]"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={async () => {
                      if (!formData.skills || formData.skills.length === 0) {
                        setFormError("Please add at least one skill.");
                        return;
                      }
                      try {
                        await updateProfile();
                        handleProfileSaved();
                      } catch (e) {
                        alert((e as Error).message);
                      }
                    }}
                    className="bg-[#22c55e] hover:bg-[#16a34a] text-white px-8 py-2 rounded-full font-semibold shadow-sm transition"
                  >
                    Save Profile
                  </button>
                </div>
              </div>
            )}
            {profileSaved && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-full px-4 py-2 mb-2 font-medium justify-center">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M6 12.5l4 4 8-8" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Profile saved! You have received <span className="font-bold ml-1">200 bonus credits.</span>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {showBonusDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl px-8 py-8 flex flex-col items-center gap-4 min-w-[320px] max-w-[90vw]">
            <div className="text-lg font-semibold text-[#1a1446] text-center">Your new credits: <span className="font-bold">{creditsAfter}</span></div>
            <div className="text-gray-600 text-center">{creditsAfter && creditsBefore !== null && creditsAfter > creditsBefore ? "Bonus applied!" : "No bonus applied."}</div>
            <button onClick={() => setShowBonusDialog(false)} className="mt-4 bg-[#22c55e] hover:bg-[#16a34a] text-white px-6 py-2 rounded-full font-semibold">OK</button>
          </div>
        </div>
      )}

      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        showToast={(msg, type) =>
          type === "success" ? toast.success(msg) : toast.error(msg)
        }
        onCreated={() => {
          // Navigate to tasks list page after creating a service
          router.push('/tasks/list');
        }}
      />

      <ChatBotWithAuth />
    </div>
  );
}


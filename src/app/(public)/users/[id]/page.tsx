"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { 
  FaUser, 
  FaEnvelope, 
  FaGraduationCap, 
  FaMapMarkerAlt, 
  FaTag, 
  FaStar, 
  FaCheck, 
  FaCalendar, 
  FaDollarSign, 
  FaTrophy,
  FaEdit,
  FaClock,
  FaUsers,
  FaChartLine,
  FaSave,
  FaTimes,
  FaPlus,
  FaTrash
} from "react-icons/fa";
import { 
  FiUser, 
  FiMail, 
  FiAward, 
  FiMapPin, 
  FiTag, 
  FiStar, 
  FiCheck, 
  FiCalendar, 
  FiDollarSign, 
  FiEdit,
  FiClock,
  FiUsers,
  FiTrendingUp,
  FiSave,
  FiX,
  FiPlus,
  FiTrash2
} from "react-icons/fi";

interface UserProfile {
  ID: string;
  Name: string;
  Email: string;
  College?: string;
  Program?: string;
  YearOfStudy?: string;
  Skills?: string[];
  Credits?: number;
  Phone?: string;
  Address?: string;
  ProfilePictureURL?: string;
  CoverImageURL?: string;
  Bio?: string;
}

interface Review {
  id: string;
  _id?: string;
  reviewerId: string;
  reviewer_id?: string;
  userId?: string;
  user_id?: string;
  rating: number;
  Rating?: number;
  comment: string;
  Comment?: string;
  text?: string;
  Text?: string;
  createdAt: string;
  created_at?: string;
  CreatedAt?: string;
  date?: string;
  reviewerName?: string;
  reviewerProfilePicture?: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params?.id as string;
  const router = useRouter();
  const { user: currentUser } = useAuth();
  
  // Check if current user is viewing their own profile
  const isOwnProfile = currentUser && (currentUser.ID === userId || currentUser.id === userId);
  
  // Track profile view
  const trackProfileView = async (viewedUserId: string) => {
    try {
      // Only track if not viewing own profile
      if (isOwnProfile) return;
      
      const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
      const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || 'http://localhost:8084';
      
      // Send view tracking request
      await fetch(`${API_BASE_URL}/api/views`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          viewedUserId: viewedUserId,
          viewerId: currentUser?.ID || currentUser?.id || 'anonymous',
          type: 'profile',
          timestamp: new Date().toISOString()
        })
      });
      
      console.log('Profile view tracked for user:', viewedUserId);
    } catch (error) {
      console.error('Error tracking profile view:', error);
      // Don't throw error - view tracking shouldn't break the page
    }
  };
  
  // Helper function for safe fetching with timeout
  const safeFetch = async (url: string, timeout: number = 5000) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      console.warn(`Safe fetch warning for ${url}:`, error);
      return null;
    }
  };
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewerNames, setReviewerNames] = useState<{ [id: string]: string }>({});
  const [reviewerProfiles, setReviewerProfiles] = useState<{ [id: string]: any }>({});
  const [stats, setStats] = useState({
    totalReviews: 0,
    responseRate: 0,
    avgResponseTime: 0,
    memberSince: ''
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [profileStats, setProfileStats] = useState({
    credits: 0,
    tasksCompleted: 0,
    rating: 0
  });
  const [profileStatsLoading, setProfileStatsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for public profile (same as protected profile)
  const [editData, setEditData] = useState({
    description: "Welcome to TradeMinutes! TradeMinutes is a modern service marketplace where you can offer, discover, and book a wide range of services—from tutoring and tech help to pet care and more. Earn credits by completing tasks, grow your reputation, and connect with a vibrant community of users.",
    education: [
      "Bachelor's in Computer Science - University of Technology",
      "Web Development Bootcamp - CodeAcademy",
      "Data Science Certification - Coursera"
    ],
    workExperience: [
      "Senior Software Engineer at TechCorp (2020-2023)",
      "Full Stack Developer at StartupXYZ (2018-2020)",
      "Freelance Web Developer (2016-2018)"
    ],
    skills: [] as string[],
    program: "",
    yearOfStudy: ""
  });

  const fetchProfileStats = async (userId: string) => {
    try {
      setProfileStatsLoading(true);
      const TASK_API_BASE = process.env.NEXT_PUBLIC_TASK_API_URL || 'http://localhost:8084';
      const REVIEW_API_BASE = process.env.NEXT_PUBLIC_REVIEW_API_URL || 'http://localhost:8086';
      const AUTH_API_BASE = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8080';
      
      // Initialize default values
      let tasksCompleted = 0;
      let totalRating = 0;
      let reviewCount = 0;
      
      // Fetch user's tasks to calculate completed tasks
      try {
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const tasksRes = await fetch(`${TASK_API_BASE}/api/tasks/get/user/${userId}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          const tasks = tasksData.data || tasksData || [];
          
          // Count completed tasks
          tasksCompleted = tasks.filter((task: any) => 
            task.status === 'completed' || task.status === 'Completed'
          ).length;
        }
      } catch (taskErr) {
        console.error("Error fetching tasks for profile stats:", taskErr);
        // Ensure we have fallback values
        tasksCompleted = 0;
      }
      
      // Fetch reviews to calculate average rating
      const reviewsRes = await safeFetch(`${REVIEW_API_BASE}/api/reviews/user/${userId}`);
      if (reviewsRes && reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        const reviews = Array.isArray(reviewsData) ? reviewsData : (reviewsData.data || []);
        reviews.forEach((review: any) => {
          const rating = review.rating || review.Rating || 0;
          if (rating > 0) {
            totalRating += rating;
            reviewCount++;
          }
        });
      } else {
        console.warn("Warning: Could not fetch reviews for profile stats, using 0 as fallback.");
        totalRating = 0;
        reviewCount = 0;
      }
      
      const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;
      
      setProfileStats({
        credits: profile?.Credits || 0,
        tasksCompleted,
        rating: Math.round(averageRating * 10) / 10
      });
      
    } catch (error) {
      console.error("Error fetching profile stats:", error);
      // Set default values if everything fails
      setProfileStats({
        credits: profile?.Credits || 0,
        tasksCompleted: 0,
        rating: 0
      });
    } finally {
      setProfileStatsLoading(false);
    }
  };

  const fetchUserStats = async (userId: string) => {
    try {
      setStatsLoading(true);
      const TASK_API_BASE = process.env.NEXT_PUBLIC_TASK_API_URL || 'http://localhost:8084';
      const REVIEW_API_BASE = process.env.NEXT_PUBLIC_REVIEW_API_URL || 'http://localhost:8086';
      const AUTH_API_BASE = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8080';
      
      // Initialize default values
      let totalTasks = 0;
      let respondedTasks = 0;
      let totalReviews = 0;
      let memberSince = '2025';
      
      // Fetch user's tasks with error handling
      try {
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const tasksRes = await fetch(`${TASK_API_BASE}/api/tasks/get/user/${userId}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          const tasks = tasksData.data || tasksData || [];
          totalTasks = tasks.length;
          
          tasks.forEach((task: any) => {
            if (task.status === 'completed' || task.status === 'in_progress') {
              respondedTasks++;
            }
          });
        }
      } catch (taskErr) {
        console.error("Error fetching tasks for stats:", taskErr);
        // Ensure we have fallback values
        totalTasks = 0;
        respondedTasks = 0;
      }
      
      // Fetch reviews with error handling
      const reviewsRes = await safeFetch(`${REVIEW_API_BASE}/api/reviews/user/${userId}`);
      if (reviewsRes && reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        const reviews = Array.isArray(reviewsData) ? reviewsData : (reviewsData.data || []);
        totalReviews = reviews.length;
      } else {
        console.warn("Warning: Could not fetch reviews for stats, using 0 as fallback.");
        totalReviews = 0;
      }
      
      // Fetch user creation date with error handling
      try {
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const userRes = await fetch(`${AUTH_API_BASE}/api/auth/user/${userId}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.createdAt) {
            memberSince = new Date(userData.createdAt).getFullYear().toString();
          }
        }
      } catch (userErr) {
        console.error("Error fetching user data for stats:", userErr);
      }
      
      // Calculate statistics
      const responseRate = totalTasks > 0 ? Math.round((respondedTasks / totalTasks) * 100) : 0;
      
      setStats({
        totalReviews,
        responseRate,
        avgResponseTime: 2, // Default value
        memberSince: memberSince
      });
      
    } catch (error) {
      console.error("Error fetching user stats:", error);
      // Set default stats if everything fails
      setStats({
        totalReviews: 0,
        responseRate: 0,
        avgResponseTime: 2,
        memberSince: '2025'
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchReviewsForUser = async (userId: string) => {
    try {
      setReviewsLoading(true);
      const REVIEW_API_BASE = process.env.NEXT_PUBLIC_REVIEW_API_URL || 'http://localhost:8086';
      const AUTH_API_BASE = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8080';
      
      let allReviews: Review[] = [];
      
      // Fetch reviews for this user with error handling
      const reviewsRes = await safeFetch(`${REVIEW_API_BASE}/api/reviews/user/${userId}`);
      
      if (reviewsRes && reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        const reviews = Array.isArray(reviewsData) ? reviewsData : (reviewsData.data || []);
        
        // Fetch reviewer names and profile pictures
        for (const review of reviews) {
          try {
            const reviewerRes = await safeFetch(`${AUTH_API_BASE}/api/auth/user/${review.reviewerId}`, 3000);
            
            if (reviewerRes && reviewerRes.ok) {
              const reviewerData = await reviewerRes.json();
              review.reviewerName = reviewerData.Name || reviewerData.name || 'Unknown User';
            } else {
              review.reviewerName = 'Unknown User';
            }
          } catch (err) {
            review.reviewerName = 'Unknown User';
          }
        }
        
        allReviews = reviews;
      } else {
        // Set empty reviews array if API fails
        allReviews = [];
      }
      
      setReviews(allReviews);
      
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchReviewerProfile = async (reviewerId: string) => {
    if (reviewerProfiles[reviewerId]) return;
    
    try {
      const AUTH_API_BASE = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8080';
      const PROFILE_API_BASE = process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:8083';
      
      let reviewerData: any = {};
      
      // Fetch from auth service with timeout
      try {
        const authController = new AbortController();
        const authTimeoutId = setTimeout(() => authController.abort(), 5000);
        
        const authRes = await fetch(`${AUTH_API_BASE}/api/auth/user/${reviewerId}`, {
          signal: authController.signal
        });
        
        clearTimeout(authTimeoutId);
        
        if (authRes.ok) {
          const authData = await authRes.json();
          reviewerData = { ...reviewerData, ...authData };
        }
      } catch (authErr) {
        console.error("Error fetching auth data for reviewer:", authErr);
      }
      
      // Fetch from profile service with timeout
      try {
        const profileController = new AbortController();
        const profileTimeoutId = setTimeout(() => profileController.abort(), 5000);
        
        const profileRes = await fetch(`${PROFILE_API_BASE}/api/profile/${reviewerId}`, {
          signal: profileController.signal
        });
        
        clearTimeout(profileTimeoutId);
        
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          reviewerData = { ...reviewerData, ...profileData };
        }
      } catch (profileErr) {
        console.error("Error fetching profile data for reviewer:", profileErr);
      }
      
      setReviewerProfiles(prev => ({
        ...prev,
        [reviewerId]: {
          name: reviewerData.Name || reviewerData.name || 'Unknown User',
          profilePicture: reviewerData.ProfilePictureURL || reviewerData.profilePictureURL
        }
      }));
      
    } catch (error) {
      console.error("Error fetching reviewer profile:", error);
    }
  };

  const navigateToUserProfile = (userId: string) => {
    router.push(`/users/${userId}`);
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user profile
        const PROFILE_API_BASE = process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:8083';
        const AUTH_API_BASE = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8080';
        
        let profileData: any = {};
        
        // Try to get profile from profile service with timeout
        try {
          const profileController = new AbortController();
          const profileTimeoutId = setTimeout(() => profileController.abort(), 5000);
          
          const profileRes = await fetch(`${PROFILE_API_BASE}/api/profile/${userId}`, {
            signal: profileController.signal
          });
          
          clearTimeout(profileTimeoutId);
          
          if (profileRes.ok) {
            profileData = await profileRes.json();
          }
        } catch (profileErr) {
          console.error("Error fetching profile data:", profileErr);
        }
        
        // Try to get additional user info from auth service with timeout
        try {
          const authController = new AbortController();
          const authTimeoutId = setTimeout(() => authController.abort(), 5000);
          
          const authRes = await fetch(`${AUTH_API_BASE}/api/auth/user/${userId}`, {
            signal: authController.signal
          });
          
          clearTimeout(authTimeoutId);
          
          if (authRes.ok) {
            const authData = await authRes.json();
            profileData = { ...profileData, ...authData };
          }
        } catch (authErr) {
          console.error("Error fetching auth data:", authErr);
        }
        
        if (!profileData.Name && !profileData.name) {
          throw new Error('User not found');
        }
        
        const userProfile = {
          ID: userId,
          Name: profileData.Name || profileData.name || 'Unknown User',
          Email: profileData.Email || profileData.email || '',
          College: profileData.College || profileData.college,
          Program: profileData.Program || profileData.program,
          YearOfStudy: profileData.YearOfStudy || profileData.yearOfStudy,
          Skills: profileData.Skills || profileData.skills || [],
          Credits: profileData.Credits || profileData.credits || 0,
          Phone: profileData.Phone || profileData.phone,
          Address: profileData.Address || profileData.address,
          ProfilePictureURL: profileData.ProfilePictureURL || profileData.profilePictureURL,
          CoverImageURL: profileData.CoverImageURL || profileData.coverImageURL,
          Bio: profileData.Bio || profileData.bio
        };
        
        setProfile(userProfile);
        
        // Update editData with user's actual data
        setEditData(prev => ({
          ...prev,
          description: userProfile.Bio || prev.description,
          skills: userProfile.Skills || [],
          program: userProfile.Program || '',
          yearOfStudy: userProfile.YearOfStudy || ''
        }));
        
        // Track profile view (only if not own profile)
        await trackProfileView(userId);
        
        // Fetch user stats and reviews
        await fetchUserStats(userId);
        await fetchProfileStats(userId);
        await fetchReviewsForUser(userId);
        
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('User not found or profile unavailable');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The user profile you are looking for does not exist.'}</p>
          <a 
            href="/" 
            className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />
      <div className="flex flex-col gap-6 p-6">
        <div className="w-full max-w-[1400px] mx-auto">
        {/* Cover Image Section */}
        <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden mb-6">
          <Image 
            src={profile.CoverImageURL || "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80"} 
            alt="Cover" 
            fill
            className="object-cover" 
          />
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Left: Profile Card */}
          <div className="w-full md:w-1/4 bg-white rounded-xl shadow-sm overflow-hidden p-4 flex flex-col gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                {(() => {
                  // Robustly check both fields
                  const pic = (profile.ProfilePictureURL && profile.ProfilePictureURL.trim() !== '')
                    ? profile.ProfilePictureURL
                    : ((profile as any).profilePictureURL && typeof (profile as any).profilePictureURL === 'string' && (profile as any).profilePictureURL.trim() !== '')
                      ? (profile as any).profilePictureURL
                      : "/categories-banner.png";
                  console.log('User profile picture used:', pic);
                  return (
                    <Image
                      src={pic}
                      alt="User"
                      width={80}
                      height={80}
                      className="rounded-full border-4 border-white shadow-lg object-cover w-20 h-20"
                    />
                  );
                })()}
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-gray-900">{profile.Name || 'TradeMinutes User'}</h2>
                <p className="text-xs text-gray-500">Marketplace Member</p>
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <FiMail className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-xs font-medium text-gray-900">{profile.Email}</p>
                </div>
              </div>
              {profile.College && (
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <FiAward className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">College</p>
                    <p className="text-xs font-medium text-gray-900">{profile.College}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <FiUser className="w-4 h-4 text-gray-500" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Program</p>
                  <p className="text-xs font-medium text-gray-900">{editData.program || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <FaClock className="w-4 h-4 text-gray-500" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Year of Study</p>
                  <p className="text-xs font-medium text-gray-900">{editData.yearOfStudy || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Quick Stats (moved from right column) */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden p-4 mt-2">
              <h3 className="text-base font-bold mb-3 text-gray-900 flex items-center gap-2">
                <FiTrendingUp className="w-5 h-5 text-gray-600" />
                Quick Stats
              </h3>
              {statsLoading ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Total Reviews</span>
                    <div className="animate-pulse bg-gray-200 h-4 w-8 rounded"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Response Rate</span>
                    <div className="animate-pulse bg-gray-200 h-4 w-8 rounded"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Avg. Response Time</span>
                    <div className="animate-pulse bg-gray-200 h-4 w-8 rounded"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Member Since</span>
                    <div className="animate-pulse bg-gray-200 h-4 w-8 rounded"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Total Reviews</span>
                    <span className="font-semibold text-gray-900 text-xs">{stats.totalReviews}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Response Rate</span>
                    <span className="font-semibold text-gray-900 text-xs">{stats.responseRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Avg. Response Time</span>
                    <span className="font-semibold text-gray-900 text-xs">{stats.avgResponseTime}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600">Member Since</span>
                    <span className="font-semibold text-gray-900 text-xs">{stats.memberSince}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Stats + About + Experience */}
          <div className="w-full md:w-2/4 flex flex-col gap-6">
            {/* About/Description */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FiUser className="w-5 h-5 text-gray-600" />
                  About
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700 leading-relaxed">
                    {editData.description}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Education</h4>
                  <ul className="list-disc ml-6 text-sm text-gray-700 space-y-1">
                    {editData.education.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Work Experience</h4>
                  <ul className="list-disc ml-6 text-sm text-gray-700 space-y-1">
                    {editData.workExperience.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {editData.skills.map((skill, idx) => {
                      const colors = [
                        'bg-blue-100 text-blue-800',
                        'bg-green-100 text-green-800',
                        'bg-purple-100 text-purple-800',
                        'bg-orange-100 text-orange-800',
                        'bg-pink-100 text-pink-800',
                        'bg-indigo-100 text-indigo-800',
                        'bg-teal-100 text-teal-800',
                        'bg-red-100 text-red-800'
                      ];
                      const colorClass = colors[idx % colors.length];
                      
                      return (
                        <span key={idx} className={`${colorClass} px-3 py-1 rounded-full text-xs font-semibold`}>
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Schedule - Only show for own profile */}
            {isOwnProfile && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden p-6">
                <h3 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
                  <FiCalendar className="w-5 h-5 text-gray-600" />
                  Today's Tasks
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-green-800">10:00 AM - 11:00 AM</span>
                      <span className="text-xs text-green-600">John Doe</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-green-800">Dog Walking</span>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-200 text-green-800">Completed</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-orange-800">11:30 AM - 12:30 PM</span>
                      <span className="text-xs text-orange-600">Jane Smith</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-orange-800">Math Tutoring</span>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-orange-200 text-orange-800">Pending</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-blue-800">2:00 PM - 3:00 PM</span>
                      <span className="text-xs text-blue-600">Alex Lee</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-blue-800">PC Setup</span>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-200 text-blue-800">Ongoing</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Reviews/Feedback */}
          <div className="w-full md:w-1/4 flex flex-col gap-6">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden p-6">
              <h3 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
                <FiStar className="w-5 h-5 text-gray-600" />
                User Reviews
              </h3>
              <div className="flex flex-col gap-4">
                {reviewsLoading ? (
                  <div className="text-center text-gray-500 py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    Loading reviews...
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <FaStar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No reviews yet</p>
                    <p className="text-xs">Start providing services to get reviews</p>
                    {/* Show sample reviews for demonstration */}
                    <div className="mt-6 space-y-4">
                      <div className="flex gap-3 items-start border-b border-gray-100 pb-3">
                        <Image 
                          src="https://randomuser.me/api/portraits/women/44.jpg" 
                          alt="Sample Reviewer" 
                          width={36} 
                          height={36} 
                          className="rounded-full w-9 h-9 object-cover" 
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-900">Emma Wilson</span>
                            <span className="text-xs text-gray-400">2 days ago</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className={star <= 5 ? "text-yellow-400" : "text-gray-300"}>
                                ★
                              </span>
                            ))}
                          </div>
                          <p className="text-sm text-gray-700 mt-2">Excellent service! Very professional and helpful.</p>
                        </div>
                      </div>
                      <div className="flex gap-3 items-start">
                        <Image 
                          src="https://randomuser.me/api/portraits/men/32.jpg" 
                          alt="Sample Reviewer" 
                          width={36} 
                          height={36} 
                          className="rounded-full w-9 h-9 object-cover" 
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-900">John Smith</span>
                            <span className="text-xs text-gray-400">1 week ago</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className={star <= 4 ? "text-yellow-400" : "text-gray-300"}>
                                ★
                              </span>
                            ))}
                          </div>
                          <p className="text-sm text-gray-700 mt-2">Great work, would recommend!</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  reviews.map((review, index) => {
                    // Handle different possible field names
                    const reviewerId = review.reviewerId || review.reviewer_id || review.userId || review.user_id;
                    const rating = review.rating || review.Rating || 0;
                    const comment = review.comment || review.Comment || review.text || review.Text || 'No comment';
                    const createdAt = review.createdAt || review.created_at || review.CreatedAt || review.date;
                    
                                         const reviewerProfile = reviewerId ? reviewerProfiles[reviewerId] : undefined;
                     const profilePicture = reviewerProfile?.profilePicture;
                     const reviewerName = reviewerProfile?.name || (reviewerId ? reviewerNames[reviewerId] : undefined) || 'Reviewer';
                     
                     return (
                       <div key={review.id || review._id || index} className="flex gap-3 items-start border-b border-gray-100 pb-3 last:border-b-0">
                         <button 
                           onClick={() => reviewerId && navigateToUserProfile(reviewerId)}
                           className="flex-shrink-0 hover:opacity-80 transition-opacity"
                         >
                          <Image 
                            src={profilePicture || "/categories-banner.png"} 
                            alt={reviewerName} 
                            width={36} 
                            height={36} 
                            className="rounded-full w-9 h-9 object-cover border-2 border-gray-200 hover:border-blue-300 transition-colors" 
                          />
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                                                         <button 
                               onClick={() => reviewerId && navigateToUserProfile(reviewerId)}
                               className="font-semibold text-sm text-gray-900 hover:text-blue-600 transition-colors cursor-pointer"
                             >
                              {reviewerName}
                            </button>
                            <span className="text-xs text-gray-400">
                              {createdAt ? 
                                (typeof createdAt === 'number' ? 
                                  new Date(createdAt * 1000).toLocaleDateString() : 
                                  new Date(createdAt).toLocaleDateString()
                                ) : 'Unknown date'
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className={star <= rating ? "text-yellow-400" : "text-gray-300"}>
                                ★
                              </span>
                            ))}
                          </div>
                          <p className="text-sm text-gray-700 mt-2">{comment}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
} 
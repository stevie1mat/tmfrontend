"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ProtectedLayout from "@/components/Layout/ProtectedLayout";
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
  FaTrash,
  FaClipboardList,
  FaCoins
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
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import CoverImageUpload from "@/components/CoverImageUpload";
import ServiceSlider from "@/components/ServiceSlider";

const MOCK_STATS = [
  { label: "Total Patients", value: 520 },
  { label: "Recovery Rate", value: "87%" },
  { label: "Review", value: "4.8 /5" },
  { label: "Today's Counselling", value: 5 },
  { label: "Completed Counselling", value: 350 },
  { label: "Upcoming Counselling", value: 15 },
];

const MOCK_SCHEDULE = [
  { time: "09:00 AM - 10:00 AM", title: "Emma Wilson", type: "Family Counseling", status: "Completed" },
  { time: "10:30 AM - 11:30 AM", title: "Ethan James", type: "Individual Therapy", status: "Ongoing" },
  { time: "12:00 PM - 01:00 PM", title: "Sophia Davis", type: "Family Counseling", status: "Pending" },
  { time: "01:45 PM - 02:45 PM", title: "Liam Thompson", type: "Family Counseling", status: "Pending" },
];

const MOCK_REVIEWS = [
  {
    name: "Emma Wilson",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    rating: 5,
    date: "2 days ago",
    text: "Dr. Blake is very patient and helped my child feel comfortable during therapy. We saw noticeable improvements. He really listens to concerns and provides thoughtful solutions. My child feels more confident after each session."
  },
  {
    name: "Sophia Davis",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    rating: 4,
    date: "3 days ago",
    text: "Dr. Blake helped my family communicate better. Highly recommend him for family therapy. His approach is gentle yet effective, which made a difference. We are now resolving conflicts more constructively."
  },
  {
    name: "Liam Thompson",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    rating: 5,
    date: "5 days ago",
    text: "The sessions are great. My family feels more connected, and my son is improving. Dr. Blake understands the underlying issues and addresses them thoughtfully. We're seeing positive changes in our family dynamic."
  },
  {
    name: "Ethan James",
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    rating: 4,
    date: "1 week ago",
    text: "Excellent therapist. Dr. Blake provided great insight and strategies to manage anxiety. He takes time to listen and support."
  }
];

export default function UserProfileSummaryPage() {
  const [profile, setProfile] = useState<{
    Name: string;
    Email: string;
    College?: string;
    Program?: string;
    YearOfStudy?: string;
    Skills?: string[];
    Credits?: number;
    Phone?: string;
    Address?: string;
    ID?: string;
    ProfilePictureURL?: string;
    CoverImageURL?: string;
    Bio?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
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
  const [userTasks, setUserTasks] = useState<any[]>([]);
  const [userTasksLoading, setUserTasksLoading] = useState(true);
  const router = useRouter();

  // Editing states
  const [editingSection, setEditingSection] = useState<string | null>(null);
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
  const [newSkill, setNewSkill] = useState("");

  const [newEducation, setNewEducation] = useState("");
  const [newWorkExperience, setNewWorkExperience] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingProfilePicture, setEditingProfilePicture] = useState(false);
  const [editingCoverImage, setEditingCoverImage] = useState(false);

  const fetchUserTasks = async (userId: string) => {
    try {
      setUserTasksLoading(true);
      const TASK_API_BASE = process.env.NEXT_PUBLIC_TASK_API_URL || 'http://localhost:8084';
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${TASK_API_BASE}/api/tasks/get/user`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (res.ok) {
        const data = await res.json();
        const tasks = data.data || data || [];
        setUserTasks(tasks);
      } else {
        console.log("Failed to fetch user tasks:", res.status);
        setUserTasks([]);
      }
    } catch (error) {
      console.error("Error fetching user tasks:", error);
      setUserTasks([]);
    } finally {
      setUserTasksLoading(false);
    }
  };

  const fetchProfileStats = async (userId: string) => {
    try {
      setProfileStatsLoading(true);
      const TASK_API_BASE = process.env.NEXT_PUBLIC_TASK_API_URL || 'http://localhost:8084';
      const REVIEW_API_BASE = process.env.NEXT_PUBLIC_REVIEW_API_URL || 'http://localhost:8086';
      const token = localStorage.getItem("token");
      
      // Fetch user's tasks to calculate completed tasks
      const tasksRes = await fetch(`${TASK_API_BASE}/api/tasks/get/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let tasksCompleted = 0;
      let totalRating = 0;
      let reviewCount = 0;
      
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        const tasks = tasksData.data || tasksData || [];
        
        // Count completed tasks
        tasksCompleted = tasks.filter((task: any) => 
          task.status === 'completed' || task.status === 'Completed'
        ).length;
      }
      
      // Fetch reviews to calculate average rating - make this completely optional
      try {
        // First, get user's tasks
        const tasksRes = await fetch(`${TASK_API_BASE}/api/tasks/get/user`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          const tasks = tasksData.data || tasksData || [];
          const myTaskIds = tasks.map((task: any) => task.id || task._id || task.ID);
          
          let allReviews: any[] = [];
          
          // Fetch reviews for each task
          for (const taskId of myTaskIds) {
            if (!taskId) continue;
            
            try {
              const reviewRes = await fetch(`${REVIEW_API_BASE}/api/reviews?taskId=${taskId}`, {
                signal: AbortSignal.timeout(3000) // 3 second timeout
              });
              if (reviewRes.ok) {
                const reviews = await reviewRes.json();
                if (Array.isArray(reviews)) {
                  allReviews = allReviews.concat(reviews);
                } else if (reviews.data && Array.isArray(reviews.data)) {
                  allReviews = allReviews.concat(reviews.data);
                }
              }
            } catch (taskErr) {
              console.log(`Error fetching reviews for task ${taskId}:`, taskErr);
            }
          }
          
          // If no reviews found via tasks, try direct user reviews
          if (allReviews.length === 0) {
            try {
              // Try the correct endpoint format
              const userReviewsRes = await fetch(`${REVIEW_API_BASE}/api/reviews?userId=${userId}`, {
                signal: AbortSignal.timeout(3000)
              });
              if (userReviewsRes.ok) {
                const userReviews = await userReviewsRes.json();
                if (Array.isArray(userReviews)) {
                  allReviews = userReviews;
                } else if (userReviews.data && Array.isArray(userReviews.data)) {
                  allReviews = userReviews.data;
                }
              } else {
                // Try alternative endpoint
                const altUserReviewsRes = await fetch(`${REVIEW_API_BASE}/api/reviews?revieweeId=${userId}`, {
                  signal: AbortSignal.timeout(3000)
                });
                if (altUserReviewsRes.ok) {
                  const userReviews = await altUserReviewsRes.json();
                  if (Array.isArray(userReviews)) {
                    allReviews = userReviews;
                  } else if (userReviews.data && Array.isArray(userReviews.data)) {
                    allReviews = userReviews.data;
                  }
                }
              }
            } catch (userErr) {
              console.log("Error fetching user reviews:", userErr);
            }
          }
          
          // Calculate rating from all reviews
          allReviews.forEach((review: any) => {
            const rating = review.rating || review.Rating || 0;
            if (rating > 0) {
              totalRating += rating;
              reviewCount++;
            }
          });
          
          console.log("Profile stats - Total reviews found:", allReviews.length);
          console.log("Profile stats - Reviews with ratings:", reviewCount);
          console.log("Profile stats - Total rating:", totalRating);
        }
      } catch (reviewErr) {
        console.log("Review API not available, continuing with default values");
        // Continue with default values (totalRating = 0, reviewCount = 0)
      }
      
      // Calculate average rating
      const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;
      
      setProfileStats({
        credits: profile?.Credits || 0,
        tasksCompleted,
        rating: Math.round(averageRating * 10) / 10 // Round to 1 decimal place
      });
      
    } catch (error) {
      console.error("Error fetching profile stats:", error);
      // Set fallback values
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
      const token = localStorage.getItem("token");
      
      // Fetch user's tasks to calculate response rate and response time
      const tasksRes = await fetch(`${TASK_API_BASE}/api/tasks/get/user`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      let totalTasks = 0;
      let respondedTasks = 0;
      let totalResponseTime = 0;
      
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        const tasks = tasksData.data || tasksData || [];
        totalTasks = tasks.length;
        
        // Calculate response rate and average response time
        tasks.forEach((task: any) => {
          if (task.status === 'completed' || task.status === 'in_progress') {
            respondedTasks++;
          }
          
          // Calculate response time if task has timestamps
          if (task.createdAt && task.updatedAt) {
            const created = new Date(task.createdAt).getTime();
            const updated = new Date(task.updatedAt).getTime();
            const responseTime = updated - created;
            if (responseTime > 0) {
              totalResponseTime += responseTime;
            }
          }
        });
      } else {
        console.log("Tasks API returned status:", tasksRes.status);
      }
      
      // Fetch total reviews - make this completely optional
      let totalReviews = 0;
      try {
        // Try the correct endpoint format
        const reviewsRes = await fetch(`${REVIEW_API_BASE}/api/reviews?userId=${userId}`, {
          signal: AbortSignal.timeout(3000) // 3 second timeout
        });
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          const reviews = Array.isArray(reviewsData) ? reviewsData : (reviewsData.data || []);
          totalReviews = reviews.length;
        } else {
          // Try alternative endpoint
          const altReviewsRes = await fetch(`${REVIEW_API_BASE}/api/reviews?revieweeId=${userId}`, {
            signal: AbortSignal.timeout(3000) // 3 second timeout
          });
          if (altReviewsRes.ok) {
            const reviewsData = await altReviewsRes.json();
            const reviews = Array.isArray(reviewsData) ? reviewsData : (reviewsData.data || []);
            totalReviews = reviews.length;
          } else {
            console.log("Review API endpoints returned status:", reviewsRes.status, altReviewsRes.status);
          }
        }
      } catch (reviewErr) {
        console.log("Review API not available, continuing with totalReviews = 0");
        // Continue with totalReviews = 0
      }
      
      // Fetch user creation date
      let memberSince = '';
      try {
        const userRes = await fetch(`${AUTH_API_BASE}/api/auth/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.createdAt) {
            memberSince = new Date(userData.createdAt).getFullYear().toString();
          }
        } else {
          console.log("User API returned status:", userRes.status);
        }
      } catch (userErr) {
        console.error("Error fetching user data for stats:", userErr);
        // Continue with memberSince = ''
      }
      
      // Calculate statistics
      const responseRate = totalTasks > 0 ? Math.round((respondedTasks / totalTasks) * 100) : 0;
      const avgResponseTime = respondedTasks > 0 ? Math.round(totalResponseTime / respondedTasks / (1000 * 60 * 60)) : 0; // Convert to hours
      
      setStats({
        totalReviews,
        responseRate,
        avgResponseTime,
        memberSince: memberSince || '2024'
      });
      
    } catch (error) {
      console.error("Error fetching user stats:", error);
      // Set fallback values
      setStats({
        totalReviews: 0,
        responseRate: 0,
        avgResponseTime: 0,
        memberSince: '2024'
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchReviewsForMyTasks = async (userId: string) => {
    try {
      console.log("Fetching reviews for user:", userId);
      const TASK_API_BASE = process.env.NEXT_PUBLIC_TASK_API_URL || 'http://localhost:8084';
      const REVIEW_API_BASE = process.env.NEXT_PUBLIC_REVIEW_API_URL || 'http://localhost:8086';
      const token = localStorage.getItem("token");
      
      // First, get user's tasks
      const res = await fetch(`${TASK_API_BASE}/api/tasks/get/user`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!res.ok) {
        console.error("Failed to fetch tasks:", res.status, res.statusText);
        setReviewsLoading(false);
        return;
      }
      
      const tasksData = await res.json();
      console.log("Tasks data:", tasksData);
      
      const tasks = tasksData.data || tasksData || [];
      const myTaskIds = tasks.map((task: any) => task.id || task._id || task.ID);
      console.log("Task IDs:", myTaskIds);
      
      let allReviews: any[] = [];
      
      // Fetch reviews for each task
      for (const taskId of myTaskIds) {
        if (!taskId) continue;
        
        try {
          const reviewRes = await fetch(`${REVIEW_API_BASE}/api/reviews?taskId=${taskId}`, {
            signal: AbortSignal.timeout(5000) // 5 second timeout
          });
          console.log(`Review response for task ${taskId}:`, reviewRes.status);
          
          if (reviewRes.ok) {
            const reviews = await reviewRes.json();
            console.log(`Reviews for task ${taskId}:`, reviews);
            if (Array.isArray(reviews)) {
              allReviews = allReviews.concat(reviews);
            } else if (reviews.data && Array.isArray(reviews.data)) {
              allReviews = allReviews.concat(reviews.data);
            }
          }
        } catch (taskErr) {
          console.error(`Error fetching reviews for task ${taskId}:`, taskErr);
        }
      }
      
      console.log("All reviews collected:", allReviews);
      setReviews(allReviews);
      
      // If no reviews found, try alternative approach - fetch all reviews for the user
      if (allReviews.length === 0) {
        console.log("No reviews found via tasks, trying direct user reviews...");
        try {
          // Try different possible endpoints for user reviews
          const possibleEndpoints = [
            `${REVIEW_API_BASE}/api/reviews?userId=${userId}`,
            `${REVIEW_API_BASE}/api/reviews?revieweeId=${userId}`,
            `${REVIEW_API_BASE}/api/reviews?reviewerId=${userId}`
          ];
          
          for (const endpoint of possibleEndpoints) {
            try {
              console.log(`Trying endpoint: ${endpoint}`);
              const userReviewsRes = await fetch(endpoint, {
                signal: AbortSignal.timeout(5000) // 5 second timeout
              });
              if (userReviewsRes.ok) {
                const userReviews = await userReviewsRes.json();
                console.log("User reviews:", userReviews);
                if (Array.isArray(userReviews)) {
                  setReviews(userReviews);
                  break; // Found reviews, exit loop
                } else if (userReviews.data && Array.isArray(userReviews.data)) {
                  setReviews(userReviews.data);
                  break; // Found reviews, exit loop
                }
              } else {
                console.log(`Endpoint ${endpoint} returned:`, userReviewsRes.status, userReviewsRes.statusText);
              }
            } catch (endpointErr) {
              console.log(`Error with endpoint ${endpoint}:`, endpointErr);
            }
          }
        } catch (userErr) {
          console.error("Error fetching user reviews:", userErr);
        }
      }
      
    } catch (err) {
      console.error("Failed to fetch reviews for my tasks:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    const fetchProfile = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:8081'}/api/profile/get`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) throw new Error("Invalid response format");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch profile");
        setProfile(data);
        
        // Initialize edit data with profile data
        setEditData(prev => ({
          ...prev,
          skills: data.Skills || [],
          program: data.Program || "",
          yearOfStudy: data.YearOfStudy || "",
          description: data.Bio || prev.description
        }));
        
        // Fetch reviews for this user's tasks
        if (data.ID) {
          fetchReviewsForMyTasks(data.ID);
          fetchUserStats(data.ID);
          fetchProfileStats(data.ID);
          fetchUserTasks(data.ID);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  const fetchReviewerProfile = async (reviewerId: string) => {
    if (reviewerProfiles[reviewerId]) return reviewerProfiles[reviewerId];
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8080';
      const PROFILE_API_BASE = process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:8083';
      
      // First try to get user info from auth service
      const authRes = await fetch(`${API_BASE_URL}/api/auth/user/${reviewerId}`);
      let name = 'Unknown';
      if (authRes.ok) {
        const authData = await authRes.json();
        name = authData.Name || authData.name || authData.fullName || 'Unknown';
      }
      
      // Then try to get profile picture from profile service
      let profilePicture = null;
      try {
        const profileRes = await fetch(`${PROFILE_API_BASE}/api/profile/${reviewerId}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          profilePicture = profileData.ProfilePictureURL || profileData.profilePictureURL || null;
        }
      } catch (profileErr) {
        console.error('Failed to fetch profile picture:', profileErr);
      }
      
      const profileData = { name, profilePicture, id: reviewerId };
      setReviewerProfiles(prev => ({ ...prev, [reviewerId]: profileData }));
      setReviewerNames(prev => ({ ...prev, [reviewerId]: name }));
      return profileData;
    } catch (err) {
      console.error('Failed to fetch reviewer profile:', err);
      const fallbackData = { name: 'Unknown', profilePicture: null, id: reviewerId };
      setReviewerProfiles(prev => ({ ...prev, [reviewerId]: fallbackData }));
      setReviewerNames(prev => ({ ...prev, [reviewerId]: 'Unknown' }));
      return fallbackData;
    }
  };

  const fetchReviewerName = async (reviewerId: string) => {
    // Keep this for backward compatibility
    const profile = await fetchReviewerProfile(reviewerId);
    return profile.name;
  };

  useEffect(() => {
    if (reviews.length > 0) {
      reviews.forEach((review) => {
        const reviewerId = review.reviewerId || review.reviewer_id || review.userId || review.user_id;
        if (reviewerId && !reviewerProfiles[reviewerId]) {
          fetchReviewerProfile(reviewerId);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviews]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const API_BASE = process.env.NEXT_PUBLIC_PROFILE_API_URL || "http://localhost:8081";
      
      const res = await fetch(`${API_BASE}/api/profile/update-info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          college: profile?.College,
          program: editData.program,
          yearOfStudy: editData.yearOfStudy,
          skills: editData.skills,
          bio: editData.description,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update profile");
      }

      // Update local profile state
      setProfile(prev => prev ? {
        ...prev,
        Program: editData.program,
        YearOfStudy: editData.yearOfStudy,
        Skills: editData.skills,
        Bio: editData.description
      } : null);

      setEditingSection(null);
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingSection(null);
    // Reset edit data to original values
    setEditData(prev => ({
      ...prev,
      skills: profile?.Skills || [],
      program: profile?.Program || "",
      yearOfStudy: profile?.YearOfStudy || "",
      description: profile?.Bio || prev.description
    }));
  };

  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !editData.skills.includes(trimmed)) {
      setEditData(prev => ({
        ...prev,
        skills: [...prev.skills, trimmed]
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setEditData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };



  const addEducation = () => {
    const trimmed = newEducation.trim();
    if (trimmed && !editData.education.includes(trimmed)) {
      setEditData(prev => ({
        ...prev,
        education: [...prev.education, trimmed]
      }));
      setNewEducation("");
    }
  };

  const removeEducation = (item: string) => {
    setEditData(prev => ({
      ...prev,
      education: prev.education.filter(e => e !== item)
    }));
  };

  const addWorkExperience = () => {
    const trimmed = newWorkExperience.trim();
    if (trimmed && !editData.workExperience.includes(trimmed)) {
      setEditData(prev => ({
        ...prev,
        workExperience: [...prev.workExperience, trimmed]
      }));
      setNewWorkExperience("");
    }
  };

  const removeWorkExperience = (item: string) => {
    setEditData(prev => ({
      ...prev,
      workExperience: prev.workExperience.filter(w => w !== item)
    }));
  };

  const handleProfilePictureUpload = (imageUrl: string) => {
    setProfile(prev => prev ? { ...prev, ProfilePictureURL: imageUrl } : null);
    setEditingProfilePicture(false);
  };

  const handleProfilePictureRemove = () => {
    setProfile(prev => prev ? { ...prev, ProfilePictureURL: "" } : null);
    setEditingProfilePicture(false);
  };

  const handleCoverImageUpload = (imageUrl: string) => {
    setProfile(prev => prev ? { ...prev, CoverImageURL: imageUrl } : null);
    setEditingCoverImage(false);
  };

  const handleCoverImageRemove = () => {
    setProfile(prev => prev ? { ...prev, CoverImageURL: "" } : null);
    setEditingCoverImage(false);
  };

  const navigateToUserProfile = (userId: string) => {
    router.push(`/users/${userId}`);
  };

  if (loading || !profile) return null;

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-white text-black flex flex-col gap-6 p-6">
        <div className="w-full max-w-[1400px] mx-auto">
          {/* Cover Image Section */}
          <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden mb-6">
            {editingCoverImage ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <CoverImageUpload
                  currentImageUrl={profile.CoverImageURL}
                  onImageUpload={handleCoverImageUpload}
                  onImageRemove={handleCoverImageRemove}
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => setEditingCoverImage(false)}
                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <Image 
                  src={profile.CoverImageURL || "/services-banner.png"} 
                  alt="Cover" 
                  fill
                  className="object-cover" 
                />
                <button
                  onClick={() => setEditingCoverImage(true)}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/80 text-gray-700 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg z-10"
                >
                  <FiEdit className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Left: Profile Card */}
            <div className="w-full md:w-1/4 bg-white rounded-xl shadow-sm overflow-hidden p-6 flex flex-col gap-6">
            <div className="flex flex-col items-center gap-4">
              {editingProfilePicture ? (
                <div className="w-full">
                  <ProfilePictureUpload
                    currentImageUrl={profile.ProfilePictureURL}
                    onImageUpload={handleProfilePictureUpload}
                    onImageRemove={handleProfilePictureRemove}
                  />
                  <div className="flex justify-center gap-2 mt-2">
                    <button
                      onClick={() => setEditingProfilePicture(false)}
                      className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Image 
                      src={profile.ProfilePictureURL || "/categories-banner.png"} 
                      alt="User" 
                      width={96} 
                      height={96} 
                      className="rounded-full border-4 border-white shadow-lg object-cover w-24 h-24" 
                    />
                    <button
                      onClick={() => setEditingProfilePicture(true)}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-gray-500 text-white rounded-full border-2 border-white flex items-center justify-center hover:bg-gray-600 transition-colors"
                    >
                      <FiEdit className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900">{profile.Name || 'TradeMinutes User'}</h2>
                    <p className="text-sm text-gray-500">Marketplace Member</p>
                    <p className="text-xs text-gray-400 mt-1">(Click the edit icons to update your profile)</p>
                  </div>
                </>
              )}
            </div>

            {/* Profile Stats */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FiDollarSign className="w-5 h-5 text-emerald-700" />
                  <div>
                    <p className="text-sm text-gray-600">Credits</p>
                    {profileStatsLoading ? (
                      <div className="animate-pulse bg-gray-200 h-6 w-12 rounded"></div>
                    ) : (
                      <p className="text-xl font-bold text-gray-900">{profileStats.credits}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FiCheck className="w-5 h-5 text-emerald-700" />
                  <div>
                    <p className="text-sm text-gray-600">Tasks Completed</p>
                    {profileStatsLoading ? (
                      <div className="animate-pulse bg-gray-200 h-6 w-12 rounded"></div>
                    ) : (
                      <p className="text-xl font-bold text-gray-900">{profileStats.tasksCompleted}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FiStar className="w-5 h-5 text-emerald-700" />
                  <div>
                    <p className="text-sm text-gray-600">Rating</p>
                    {profileStatsLoading ? (
                      <div className="animate-pulse bg-gray-200 h-6 w-12 rounded"></div>
                    ) : (
                      <p className="text-xl font-bold text-gray-900">{profileStats.rating > 0 ? `${profileStats.rating}/5` : 'No ratings'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FiMail className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{profile.Email}</p>
                </div>
              </div>
              
              {profile.College && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FiAward className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">College</p>
                    <p className="text-sm font-medium text-gray-900">{profile.College}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FiUser className="w-4 h-4 text-gray-500" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Program</p>
                  {editingSection === 'program' ? (
                    <input
                      type="text"
                      value={editData.program}
                      onChange={(e) => setEditData(prev => ({ ...prev, program: e.target.value }))}
                      className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{editData.program || 'Not specified'}</p>
                  )}
                </div>
                {editingSection === 'program' ? (
                  <div className="flex gap-1">
                    <button onClick={handleSave} className="text-gray-600 hover:text-gray-800">
                      <FiSave className="w-3 h-3" />
                    </button>
                    <button onClick={handleCancel} className="text-gray-600 hover:text-gray-800">
                      <FiX className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditingSection('program')} className="text-gray-600 hover:text-gray-800">
                    <FiEdit className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FaClock className="w-4 h-4 text-gray-500" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Year of Study</p>
                  {editingSection === 'yearOfStudy' ? (
                    <select
                      value={editData.yearOfStudy}
                      onChange={(e) => setEditData(prev => ({ ...prev, yearOfStudy: e.target.value }))}
                      className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select year</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Graduate">Graduate</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-gray-900">{editData.yearOfStudy || 'Not specified'}</p>
                  )}
                </div>
                {editingSection === 'yearOfStudy' ? (
                  <div className="flex gap-1">
                    <button onClick={handleSave} className="text-gray-600 hover:text-gray-800">
                      <FiSave className="w-3 h-3" />
                    </button>
                    <button onClick={handleCancel} className="text-gray-600 hover:text-gray-800">
                      <FiX className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditingSection('yearOfStudy')} className="text-gray-600 hover:text-gray-800">
                    <FiEdit className="w-3 h-3" />
                  </button>
                )}
              </div>
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
                {editingSection === 'about' ? (
                  <div className="flex gap-2">
                    <button onClick={handleSave} className="text-gray-600 hover:text-gray-800">
                      <FiSave className="w-4 h-4" />
                    </button>
                    <button onClick={handleCancel} className="text-gray-600 hover:text-gray-800">
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditingSection('about')} className="text-gray-600 hover:text-gray-800">
                    <FiEdit className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  {editingSection === 'about' ? (
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-700 leading-relaxed">
                      {editData.description}
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Education</h4>
                  {editingSection === 'about' ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newEducation}
                          onChange={(e) => setNewEducation(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEducation())}
                          placeholder="Add education"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button onClick={addEducation} className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                          <FiPlus className="w-4 h-4" />
                        </button>
                      </div>
                      <ul className="list-disc ml-6 text-sm text-gray-700 space-y-1">
                        {editData.education.map((item, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="flex-1">{item}</span>
                            <button onClick={() => removeEducation(item)} className="text-gray-600 hover:text-gray-800">
                              <FiTrash2 className="w-3 h-3" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <ul className="list-disc ml-6 text-sm text-gray-700 space-y-1">
                      {editData.education.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Work Experience</h4>
                  {editingSection === 'about' ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newWorkExperience}
                          onChange={(e) => setNewWorkExperience(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addWorkExperience())}
                          placeholder="Add work experience"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button onClick={addWorkExperience} className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                          <FiPlus className="w-4 h-4" />
                        </button>
                      </div>
                      <ul className="list-disc ml-6 text-sm text-gray-700 space-y-1">
                        {editData.workExperience.map((item, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="flex-1">{item}</span>
                            <button onClick={() => removeWorkExperience(item)} className="text-gray-600 hover:text-gray-800">
                              <FiTrash2 className="w-3 h-3" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <ul className="list-disc ml-6 text-sm text-gray-700 space-y-1">
                      {editData.workExperience.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Skills</h4>
                  {editingSection === 'about' ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                          placeholder="Add skill"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button onClick={addSkill} className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                          <FiPlus className="w-4 h-4" />
                        </button>
                      </div>
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
                            <span key={idx} className={`${colorClass} px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
                              {skill}
                              <button onClick={() => removeSkill(skill)} className="text-gray-600 hover:text-gray-800">
                                <FiX className="w-2 h-2" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
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
                  )}
                </div>
              </div>
            </div>

            {/* User's Services */}
            <ServiceSlider
              services={userTasks}
              title="My Services"
              loading={userTasksLoading}
              emptyMessage="No services created yet. Create your first service to get started."
              showViewAll={userTasks.length > 5}
              onViewAll={() => router.push('/my-listings')}
              maxItems={5}
            />
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
                    
                    const reviewerProfile = reviewerProfiles[reviewerId];
                    const profilePicture = reviewerProfile?.profilePicture;
                    const reviewerName = reviewerProfile?.name || reviewerNames[reviewerId] || 'Reviewer';
                    
                    return (
                      <div key={review.id || review._id || index} className="flex gap-3 items-start border-b border-gray-100 pb-3 last:border-b-0">
                        <button 
                          onClick={() => navigateToUserProfile(reviewerId)}
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
                              onClick={() => navigateToUserProfile(reviewerId)}
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

            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden p-6">
              <h3 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
                <FiTrendingUp className="w-5 h-5 text-gray-600" />
                Quick Stats
              </h3>
              {statsLoading ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Reviews</span>
                    <div className="animate-pulse bg-gray-200 h-4 w-8 rounded"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Response Rate</span>
                    <div className="animate-pulse bg-gray-200 h-4 w-8 rounded"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg. Response Time</span>
                    <div className="animate-pulse bg-gray-200 h-4 w-8 rounded"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Member Since</span>
                    <div className="animate-pulse bg-gray-200 h-4 w-8 rounded"></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Reviews</span>
                    <span className="font-semibold text-gray-900">{stats.totalReviews}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Response Rate</span>
                    <span className="font-semibold text-gray-900">{stats.responseRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg. Response Time</span>
                    <span className="font-semibold text-gray-900">{stats.avgResponseTime}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Member Since</span>
                    <span className="font-semibold text-gray-900">{stats.memberSince}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}

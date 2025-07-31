"use client";

import { useEffect, useState, ReactNode, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "../common/Sidebar";
import { NotificationBell } from "../common/Sidebar";

import { FiPlusCircle } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
  headerName?: string;
  hideTopBar?: boolean;
  hideTopBarOnly?: boolean;
}

interface RealTimeActivity {
  user: string;
  title: string;
  category: string;
  avatar: string;
  id?: string; // Added id for clickability
}

// Optimized TopBar component - loads instantly with AuthContext
function TopBar({ realTimeActivities, loadingActivities }: { realTimeActivities: RealTimeActivity[], loadingActivities: boolean }) {
  const { user, logout } = useAuth(); // Use AuthContext for instant data
  const userImage: string | undefined = user?.ProfilePictureURL || user?.profilePictureURL;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<RealTimeActivity[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const handleLogout = () => {
    console.log("🔄 TopBar logout triggered");
    try {
      // Clear AuthContext and redirect
      logout();
    } catch (error) {
      console.error("❌ Logout error:", error);
      // Fallback: force redirect
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    }
    if (dropdownOpen || showSearchResults) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen, showSearchResults]);

  // Real-time search functionality
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = realTimeActivities.filter(activity => 
      activity.title.toLowerCase().includes(query) ||
      activity.user.toLowerCase().includes(query) ||
      activity.category.toLowerCase().includes(query)
    );

    setSearchResults(filtered.slice(0, 5)); // Limit to 5 results
    setShowSearchResults(true);
  }, [searchQuery, realTimeActivities]);

  const handleSearchResultClick = (activity: RealTimeActivity) => {
    // Navigate to the task/service page
    if (activity.id) {
      router.push(`/tasks/view/${activity.id}`);
    }
    setShowSearchResults(false);
    setSearchQuery("");
  };

  // Use AuthContext data for instant loading - no API calls needed!
  const profileUserId = user?.ID || user?.id || null;
  const credits = user?.Credits ?? user?.credits ?? null;
  const profilePicture = user?.ProfilePictureURL || user?.profilePictureURL || null;
  const userName = user?.Name || user?.name || "User";

  const userId = user?.ID || user?.id;

  return (
    <div className="flex items-center p-6 gap-8 w-full bg-white border-b border-gray-200">
      {/* Enhanced Search Bar */}
      <div className="flex-1 max-w-2xl" ref={searchRef}>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() !== "" && setShowSearchResults(true)}
            placeholder="Search tasks, services, users, or categories..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
          />
          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  onClick={() => handleSearchResultClick(result)}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <img 
                    src={result.avatar} 
                    alt={result.user} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{result.title}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{result.user}</span>
                      <span>•</span>
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                        {result.category}
                      </span>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>
          )}
          {/* No Results Message */}
          {showSearchResults && searchQuery.trim() !== "" && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
              <p className="text-gray-500 text-center">No results found for "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
      {/* Right controls: Notification, profile */}
      <div className="flex items-center gap-4 ml-auto">
        {credits !== null && (
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-sm border border-green-300">
            Credits: {credits}
          </span>
        )}
        <NotificationBell userId={profileUserId || undefined} />
        {/* Profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-gray-200 shadow-sm hover:bg-emerald-50 transition-colors"
            onClick={() => setDropdownOpen((open) => !open)}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white font-semibold text-sm">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500">Signed in</p>
              </div>
              <a href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-emerald-50">Profile</a>
              <a href="/settings" className="block px-4 py-2 text-gray-700 hover:bg-emerald-50">Settings</a>
              <button type="button" onClick={handleLogout} className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50">Logout</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProtectedLayout({ children, headerName, hideTopBar, hideTopBarOnly }: LayoutProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [realTimeActivities, setRealTimeActivities] = useState<RealTimeActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();



  useEffect(() => {
    const saved = localStorage.getItem("theme");
    setIsDarkMode(saved === "dark");
  }, [isDarkMode]);

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

  // Fetch real-time activities
  useEffect(() => {
    // Set static activities immediately for instant loading
    setRealTimeActivities([
      { user: "Sarah Kim", title: "Dog Walking", category: "Pet Care", avatar: "https://images.pexels.com/photos/277576/pexels-photo-277576.jpeg?auto=compress&fit=facearea&w=64&h=64&facepad=2", id: "1" },
      { user: "Daniel Ortiz", title: "Math Tutoring", category: "Tutoring", avatar: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&fit=facearea&w=64&h=64&facepad=2", id: "2" },
      { user: "Michael Chen", title: "PC Setup", category: "Tech Help", avatar: "https://images.pexels.com/photos/573570/pexels-photo-573570.jpeg?auto=compress&fit=facearea&w=64&h=64&facepad=2", id: "3" },
    ]);
    setLoadingActivities(false);

    const fetchRealTimeActivities = async () => {
      const token = localStorage.getItem("token");
      if (!token) return; // Don't set loading false, we already have static data

      try {
        // Optional background fetch with timeout for speed
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

        const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || "http://localhost:8084";
        const res = await fetch(`${API_BASE_URL}/api/tasks/get/all?limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        if (!res.ok) return; // Silently fail, keep static data

        const json = await res.json();
        
        // Handle different response structures and null values
        if (!json) {
          console.warn("Empty response from API, using fallback data");
          setRealTimeActivities([
            { user: "Sarah Kim", title: "Dog Walking", category: "Pet Care", avatar: "https://images.pexels.com/photos/277576/pexels-photo-277576.jpeg?auto=compress&fit=facearea&w=64&h=64&facepad=2", id: "1" },
            { user: "Daniel Ortiz", title: "Math Tutoring", category: "Tutoring", avatar: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&fit=facearea&w=64&h=64&facepad=2", id: "2" },
            { user: "Ayesha Patel", title: "Yoga Session", category: "Fitness", avatar: "https://images.pexels.com/photos/721979/pexels-photo-721979.jpeg?auto=compress&fit=facearea&w=64&h=64&facepad=2", id: "3" },
            { user: "Michael Chen", title: "PC Setup", category: "Tech Help", avatar: "https://images.pexels.com/photos/573570/pexels-photo-573570.jpeg?auto=compress&fit=facearea&w=64&h=64&facepad=2", id: "4" },
            { user: "Emma Davis", title: "House Cleaning", category: "Household Help", avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&fit=facearea&w=64&h=64&facepad=2", id: "5" },
          ]);
          return;
        }
        
        const tasks = json.data || json;
        
        // Handle empty or invalid tasks array gracefully
        if (!Array.isArray(tasks) || tasks.length === 0) {
          console.warn("No tasks available or invalid response format, using fallback data");
          setRealTimeActivities([
            { user: "Sarah Kim", title: "Dog Walking", category: "Pet Care", avatar: "https://images.pexels.com/photos/277576/pexels-photo-277576.jpeg?auto=compress&fit=facearea&w=64&h=64&facepad=2", id: "1" },
            { user: "Daniel Ortiz", title: "Math Tutoring", category: "Tutoring", avatar: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&fit=facearea&w=64&h=64&facepad=2", id: "2" },
            { user: "Ayesha Patel", title: "Yoga Session", category: "Fitness", avatar: "https://images.pexels.com/photos/721979/pexels-photo-721979.jpeg?auto=compress&fit=facearea&w=64&h=64&facepad=2", id: "3" },
            { user: "Michael Chen", title: "PC Setup", category: "Tech Help", avatar: "https://images.pexels.com/photos/573570/pexels-photo-573570.jpeg?auto=compress&fit=facearea&w=64&h=64&facepad=2", id: "4" },
            { user: "Emma Davis", title: "House Cleaning", category: "Household Help", avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&fit=facearea&w=64&h=64&facepad=2", id: "5" },
          ]);
          return;
        }
        
        // Transform tasks to activity format with error handling
        const activities: RealTimeActivity[] = tasks.slice(0, 10).map((task: any) => {
          // Ensure task is a valid object
          if (!task || typeof task !== 'object') {
            return {
              user: 'Anonymous',
              title: 'Untitled Task',
              category: 'General',
              avatar: 'https://images.pexels.com/photos/277576/pexels-photo-277576.jpeg?auto=compress&fit=facearea&w=64&h=64&facepad=2',
              id: 'unknown'
            };
          }
          
          return {
            user: task.Author?.Name || task.author?.name || 'Anonymous',
            title: task.Title || task.title || 'Untitled Task',
            category: task.Category || task.category || 'General',
            avatar: task.Author?.Avatar || task.author?.avatar || 'https://images.pexels.com/photos/277576/pexels-photo-277576.jpeg?auto=compress&fit=facearea&w=64&h=64&facepad=2',
            id: task.ID || task.id || task._id || 'unknown' // Ensure correct ID is used
          };
        }).filter(Boolean); // Remove any undefined entries
        setRealTimeActivities(activities);
      } catch (err) {
        console.warn("Failed to fetch real-time activities, using fallback data:", err);
        // Only set fallback data if not already set
        setRealTimeActivities(prev => {
          if (prev.length === 0) {
            return [
              { user: "Sarah Kim", title: "Dog Walking", category: "Pet Care", avatar: "https://images.pexels.com/photos/277576/pexels-photo-277576.jpeg?auto=compress&fit=facearea&w=64&h=64&facepad=2", id: "1" },
              { user: "Daniel Ortiz", title: "Math Tutoring", category: "Tutoring", avatar: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&fit=facearea&w=64&h=64&facepad=2", id: "2" },
              { user: "Ayesha Patel", title: "Yoga Session", category: "Fitness", avatar: "https://images.pexels.com/photos/721979/pexels-photo-721979.jpeg?auto=compress&fit=facearea&w=64&h=64&facepad=2", id: "3" },
              { user: "Michael Chen", title: "PC Setup", category: "Tech Help", avatar: "https://images.pexels.com/photos/573570/pexels-photo-573570.jpeg?auto=compress&fit=facearea&w=64&h=64&facepad=2", id: "4" },
              { user: "Emma Davis", title: "House Cleaning", category: "Household Help", avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&fit=facearea&w=64&h=64&facepad=2", id: "5" },
            ];
          }
          return prev;
        });
      } finally {
        setLoadingActivities(false);
      }
    };

    // Fetch activities in the background after a delay (don't block initial render)
    const timer = setTimeout(fetchRealTimeActivities, 500);
    
    // Refresh activities every 10 minutes instead of 5 minutes to reduce requests
    const interval = setInterval(fetchRealTimeActivities, 10 * 60 * 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="bg-white text-black min-h-screen flex">
      {/* Sidebar */}
      {!hideTopBar && (
        <Sidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
      )}

      {/* Main content */}
      <main className={`overflow-y-auto ${hideTopBar ? 'flex-1' : 'flex-1'}`}>
        {!hideTopBar && !hideTopBarOnly && pathname !== '/ai-agents/create-workflow' && (
          <TopBar realTimeActivities={realTimeActivities} loadingActivities={loadingActivities} />
        )}
        <div className={`${hideTopBar ? 'px-0 py-0' : 'px-6 py-4'}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

interface Task {
  id: string;
  title: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  credits: number;
  images?: string[];
  author: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    college?: string;
    program?: string;
    skills?: string[];
  };
  category?: string;
  createdAt?: number;
  rating?: number;
  reviewCount?: number;
}

// User-focused filter options
const filterOptions = [
  { key: 'rating', label: 'Rating', options: ['4.5+', '4.0+', '3.5+', 'Any'] },
  { key: 'credits', label: 'Credits', options: ['0-50', '51-100', '101-200', '200+'] },
  { key: 'distance', label: 'Distance', options: ['< 5km', '< 10km', '< 20km', 'Any'] },
  { key: 'availability', label: 'Availability', options: ['Online', 'In-person', 'Both'] },
  { key: 'experience', label: 'Experience', options: ['New', 'Experienced', 'Expert'] }
];

// 🎯 Helper: task icon for marker with enhanced styling
const createTaskIcon = (images: string[] = []) => {
  if (typeof window === 'undefined') return null;
  
  const L = require('leaflet');
  const imageUrl = images.length > 0 ? images[0] : 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  
  return L.divIcon({
    html: `<div style="
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: url('${imageUrl}') center/cover no-repeat;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 0 0 3px white;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
    ">
      <div style="
        position: absolute;
        bottom: -5px;
        right: -5px;
        background: #3b82f6;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
      ">📋</div>
    </div>`,
    className: "custom-task-marker",
    iconSize: [60, 60],
    iconAnchor: [30, 30],
  });
};

export default function UsersNearby() {
  // Custom CSS to override Leaflet popup styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-popup .leaflet-popup-content-wrapper {
        padding: 0 !important;
        margin: 0 !important;
      }
      .custom-popup .leaflet-popup-content {
        margin: 0 !important;
        padding: 0 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [center, setCenter] = useState<[number, number]>([43.6532, -79.3832]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState({
    rating: 'Any',
    credits: 'Any',
    distance: 'Any',
    availability: 'Any',
    experience: 'Any'
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
        () => null,
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [isClient]);

  // Helper function to fetch user ratings
  const fetchUserRating = async (userId: string) => {
    try {
      const REVIEW_API_BASE = process.env.NEXT_PUBLIC_REVIEW_API_URL || 'http://localhost:8086';
      const response = await fetch(`${REVIEW_API_BASE}/api/reviews?revieweeId=${userId}`);
      
      if (response.ok) {
        const reviews = await response.json();
        const reviewsArray = Array.isArray(reviews) ? reviews : (reviews.data || []);
        
        if (reviewsArray.length > 0) {
          const totalRating = reviewsArray.reduce((sum: number, review: any) => {
            const rating = review.rating || review.Rating || 0;
            return sum + rating;
          }, 0);
          
          return {
            rating: Math.round((totalRating / reviewsArray.length) * 10) / 10, // Round to 1 decimal
            reviewCount: reviewsArray.length
          };
        }
      }
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
    
    return { rating: 0, reviewCount: 0 };
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || "http://localhost:8084";
        
        // Fetch tasks from the task service
        const response = await fetch(`${API_BASE_URL}/api/tasks/public`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        
        const data = await response.json();
        const allTasks = data.data || data || [];
        
        // Filter tasks with valid coordinates and transform to Task interface
        const tasksWithLocation = allTasks
          .filter((task: any) => 
            task.Latitude && 
            task.Longitude && 
            !isNaN(task.Latitude) && 
            !isNaN(task.Longitude) &&
            task.Latitude !== 0 &&
            task.Longitude !== 0
          )
          .map((task: any) => ({
            id: task.ID || task.id || task._id,
            title: task.Title || task.title || 'Untitled Task',
            description: task.Description || task.description || '',
            location: task.Location || task.location || 'Unknown Location',
            latitude: task.Latitude || task.latitude,
            longitude: task.Longitude || task.longitude,
            credits: task.Tiers && task.Tiers.length > 0 
              ? task.Tiers.find((tier: any) => tier.name === 'Basic')?.credits || task.Tiers[0].credits
              : task.Credits || task.credits || 0,
            images: task.Images || task.images || [],
            category: task.Category || task.category,
            createdAt: task.CreatedAt || task.createdAt,
            author: {
              id: task.Author?.ID || task.Author?.id || 'unknown',
              name: task.Author?.Name || task.Author?.name || 'Unknown User',
              email: task.Author?.Email || task.Author?.email || '',
              avatar: task.Author?.Avatar || task.Author?.avatar || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
              college: task.Author?.College || task.Author?.college,
              program: task.Author?.Program || task.Author?.program,
              skills: task.Author?.Skills || task.Author?.skills || []
            }
          }));
        
        // Fetch ratings for each task's author
        const tasksWithRatings = await Promise.all(
          tasksWithLocation.map(async (task: any) => {
            const { rating, reviewCount } = await fetchUserRating(task.author.id);
            return {
              ...task,
              rating,
              reviewCount
            };
          })
        );
        
        setTasks(tasksWithRatings);
        setFilteredTasks(tasksWithRatings);
        
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Apply filters when filters or tasks change
  useEffect(() => {
    let filtered = [...tasks];

    // Apply rating filter (simulated - would need real rating data)
    if (filters.rating !== 'Any') {
      const minRating = parseFloat(filters.rating.replace('+', ''));
      // For now, we'll simulate ratings based on credits
      filtered = filtered.filter(task => task.credits >= minRating * 20);
    }

    // Apply credits filter
    if (filters.credits !== 'Any') {
      const [min, max] = filters.credits.split('-').map(Number);
      if (filters.credits === '200+') {
        filtered = filtered.filter(task => task.credits >= 200);
      } else {
        filtered = filtered.filter(task => task.credits >= min && task.credits <= max);
      }
    }

    // Apply distance filter (simulated - would need real distance calculation)
    if (filters.distance !== 'Any') {
      const maxDistance = parseInt(filters.distance.match(/\d+/)?.[0] || '20');
      // For now, we'll show all tasks since we don't have real distance calculation
      // In a real implementation, you'd calculate distance from user's location
    }

    // Apply availability filter (simulated - would need real availability data)
    if (filters.availability !== 'Any') {
      // For now, we'll show all tasks since we don't have real availability data
    }

    // Apply experience filter (simulated - would need real experience data)
    if (filters.experience !== 'Any') {
      // For now, we'll simulate experience based on credits
      if (filters.experience === 'New') {
        filtered = filtered.filter(task => task.credits < 50);
      } else if (filters.experience === 'Experienced') {
        filtered = filtered.filter(task => task.credits >= 50 && task.credits < 150);
      } else if (filters.experience === 'Expert') {
        filtered = filtered.filter(task => task.credits >= 150);
      }
    }

    setFilteredTasks(filtered);
  }, [filters, tasks]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      rating: 'Any',
      credits: 'Any',
      distance: 'Any',
      availability: 'Any',
      experience: 'Any'
    });
  };

  if (!isClient) {
    return (
      <div className="w-full h-[70vh] rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
            <p className="text-gray-700 text-lg font-medium">Loading interactive map...</p>
            <p className="text-gray-500 text-sm mt-2">Preparing your local community view</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-[70vh] rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
            <p className="text-gray-700 text-lg font-medium">Discovering nearby services...</p>
            <p className="text-gray-500 text-sm mt-2">Finding service providers in your area</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[70vh] rounded-2xl overflow-hidden bg-gradient-to-br from-red-50 to-pink-100 border border-red-200">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-700 text-lg font-medium mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="w-full h-[70vh] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-700 text-lg font-medium mb-2">No services found nearby</p>
            <p className="text-gray-500 text-sm">Services will appear here once providers set their location</p>
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-blue-700 text-sm font-medium">💡 Tip: Set your location in your profile to appear on the map!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[85vh] rounded-2xl overflow-hidden bg-white shadow-2xl border border-gray-200">
      {/* Map Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Nearby Services</h3>
            <p className="text-sm text-gray-600">{filteredTasks.length} of {tasks.length} services found</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="absolute top-20 left-0 right-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Filter Users</h4>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {filterOptions.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{filter.label}</label>
                <select
                  value={filters[filter.key as keyof typeof filters]}
                  onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {filter.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="w-full h-full" style={{ marginTop: showFilters ? '140px' : '80px' }}>
        <MapContainer
          center={center}
          zoom={11}
          scrollWheelZoom
          className="w-full h-full z-0"
          style={{ marginTop: '0' }}
        >
          <TileLayer
            attribution="© OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filteredTasks.map((task) => {
            const taskIcon = createTaskIcon(task.images);
            if (!taskIcon) return null;

            return (
              <Marker
                key={task.id}
                position={[task.latitude, task.longitude]}
                icon={taskIcon}
                eventHandlers={{
                  click: () => setSelectedTask(task),
                }}
              >
                <Popup className="custom-popup !p-0 !m-0">
                  <div className="w-64 bg-white rounded-lg overflow-hidden">
                    {/* Task Image */}
                    {task.images && task.images.length > 0 && (
                      <div className="relative">
                        <Image
                          src={task.images[0]}
                          alt={task.title}
                          width={256}
                          height={120}
                          className="w-full h-24 object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="p-3">

                    {/* Task Details */}
                    <div className="mb-3">
                      <h4 className="font-semibold text-gray-900 text-sm mb-3">{task.title}</h4>
                      
                      <div className="flex items-center gap-1 mb-3">
                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs text-gray-600">{task.location}</span>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        {task.category && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                            {task.category}
                          </span>
                        )}
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          <span className="text-xs text-blue-600 font-medium">{task.credits} Credits</span>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-200 my-3"></div>
                    
                    {/* Author Information */}
                    <div className="mb-2 pb-1 bg-gray-100 rounded-lg">
                      <div className="flex items-center justify-center gap-0 mb-1">
                        <Image
                          src={task.author.avatar}
                          alt={task.author.name}
                          width={24}
                          height={24}
                          className="rounded-full object-cover border border-blue-200"
                        />
                        <div className="text-center -ml-4">
                          <div className="flex items-center justify-center gap-1 mb-[-10px]">
                            <p className="font-medium text-gray-900 text-xs">{task.author.name}</p>
                          </div>
                          
                          {/* Rating Display */}
                          <div className="flex items-center justify-center gap-1 mt-0.5">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => {
                                const starValue = i + 1;
                                const isFilled = task.rating && task.rating > 0 && starValue <= task.rating;
                                const isHalfFilled = task.rating && task.rating > 0 && !isFilled && (starValue - 0.5) <= task.rating;
                                
                                return (
                                  <svg
                                    key={i}
                                    className={`w-3 h-3 ${isFilled ? 'text-yellow-400 fill-current' : isHalfFilled ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                );
                              })}
                            </div>
                            <span className="text-xs text-gray-600">
                              {task.rating && task.rating > 0 ? `${task.rating} (${task.reviewCount} reviews)` : '0 (0 reviews)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {(task.author.college || task.author.program) && (
                        <div className="mb-2 p-1.5 bg-blue-50 rounded text-xs">
                          <p className="text-blue-800 font-medium">Education</p>
                          <p className="text-blue-700">
                            {task.author.college && task.author.program ? `${task.author.program} at ${task.author.college}` : task.author.college || task.author.program}
                          </p>
                        </div>
                      )}

                      {task.author.skills && task.author.skills.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-gray-700 font-medium mb-1">Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {task.author.skills.slice(0, 2).map((skill: string, index: number) => (
                              <span key={index} className="px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                {skill}
                              </span>
                            ))}
                            {task.author.skills.length > 2 && (
                              <span className="px-1 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                +{task.author.skills.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1">
                      <Link
                        href={`/services/view/${task.id}`}
                        className="flex-1 inline-flex items-center justify-center px-2 py-1.5 bg-black text-white rounded font-medium hover:bg-gray-800 transition-all duration-200 text-xs"
                      >
                        <span className="text-white">View Task</span>
                        <svg className="w-2.5 h-2.5 ml-1 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>
                      <Link
                        href={`/users/${task.author.id}`}
                        className="px-2 py-1.5 bg-gray-100 text-gray-700 rounded font-medium hover:bg-gray-200 transition-all duration-200 text-xs"
                      >
                        Profile
                      </Link>
                    </div>
                  </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>


    </div>
  );
}

"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useRef, Suspense } from "react";
import CreateListingModal from "../CreateTaskModal";
import EditTaskModal from "@/components/EditTaskModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FaHeart, FaStar, FaTrash, FaCalendar, FaMapMarkerAlt, FaClock, FaCoins, FaPlus, FaEdit, FaClipboardList, FaFilter, FaSearch, FaTimes } from "react-icons/fa";

interface Availability {
  Date: string;
  TimeFrom: string;
  TimeTo: string;
}

interface Author {
  id: string;
  Name: string;
  Email: string;
  Avatar?: string;
}

interface Tier {
  name: string;
  title: string;
  description: string;
  credits: number;
  features: string[];
  availableTimeSlot: string;
  maxDays: number;
}

interface Task {
  id: string;
  Title: string;
  Description: string;
  Location: string;
  Latitude: number;
  longitude: number;
  LocationType: string;
  Credits: number;
  Availability: Availability[];
  Type?: string;
  Category?: string;
  Status?: string;
  Author?: Author;
  Images?: string[]; // Add Images field for uploaded images
  Tiers?: Tier[]; // Add Tiers field for pricing tiers
}

function TaskListPageContent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const isModalOpenFromParams = searchParams?.get("create") === "1";
  const prevModalOpen = useRef(isModalOpenFromParams);


  const fetchTasks = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, setting loading to false");
      setLoading(false);
      return;
    }
    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_TASK_API_URL || "http://localhost:8084";
      console.log("Fetching tasks from:", `${API_BASE_URL}/api/tasks/get/user`);
      console.log("Using token:", token.substring(0, 20) + "...");
      
      const res = await fetch(`${API_BASE_URL}/api/tasks/get/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log("API Response status:", res.status);
      console.log("API Response headers:", Object.fromEntries(res.headers.entries()));
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("API Error Response:", errorText);
        throw new Error(`HTTP error! status: ${res.status}, body: ${errorText}`);
      }
      
      const json = await res.json();
      console.log("=== FRONTEND DEBUG: Raw API Response ===");
      console.log("API Response:", json);
      
      let processedTasks;
      if (json && Array.isArray(json.data)) {
        processedTasks = json.data.map((task: any) => ({ ...task, id: task.id || task._id }));
      } else if (Array.isArray(json)) {
        processedTasks = json.map((task: any) => ({ ...task, id: task.id || task._id }));
      } else {
        processedTasks = [];
      }
      
      console.log("=== FRONTEND DEBUG: Processed Tasks ===");
      processedTasks.forEach((task: any, index: number) => {
        console.log(`Task ${index + 1}:`, {
          id: task.id,
          title: task.Title,
          images: task.Images,
          imagesLength: task.Images ? task.Images.length : 0,
          hasImages: task.Images && task.Images.length > 0
        });
      });
      
      setTasks(processedTasks);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      console.error("Error details:", {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Filter tasks based on search term, category, and price range
  useEffect(() => {
    let filtered = [...tasks];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.Description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(task => 
        task.Category === selectedCategory || task.Type === selectedCategory
      );
    }
    
    // Price range filter
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number);
      filtered = filtered.filter(task => {
        const taskPrice = task.Tiers && task.Tiers.length > 0 
          ? task.Tiers.find(tier => tier.name === 'Basic')?.credits || task.Tiers[0].credits
          : task.Credits;
        
        if (max) {
          return taskPrice >= min && taskPrice <= max;
        } else {
          return taskPrice >= min;
        }
      });
    }
    
    setFilteredTasks(filtered);
  }, [tasks, searchTerm, selectedCategory, priceRange]);

  // Refresh tasks when modal closes after creation
  useEffect(() => {
    if (prevModalOpen.current && !isModalOpenFromParams) {
      fetchTasks();
    }
    prevModalOpen.current = isModalOpenFromParams;
  }, [isModalOpenFromParams]);

  const handleDelete = async () => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    if (!taskToDelete || !token) return;

    // Check if user typed the correct confirmation
    if (deleteConfirmation.toLowerCase() !== "delete") {
      toast.error("❌ Please type 'delete' to confirm");
      return;
    }

    setIsDeleting(true);

    try {
      const API_BASE_URL =
        process.env.NEXT_PUBLIC_TASK_API_URL || "http://localhost:8084";

      const res = await fetch(
        `${API_BASE_URL}/api/tasks/delete/${taskToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        toast.error("❌ Failed to delete task");
        return;
      }

      toast.success("🗑️ Task deleted");
      setTasks((prevTasks) =>
        prevTasks.filter((task) => task.id !== taskToDelete)
      );
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("❌ Network error");
    } finally {
      setIsDeleting(false);
      setShowConfirmModal(false);
      setTaskToDelete(null);
      setDeleteConfirmation("");
    }
  };

  console.log("task", tasks);

  // Ensure all tasks have proper id mapping
  const mappedTasks = filteredTasks.map((task: any) => ({ 
    ...task, 
    id: task.id || task._id || task.ID 
  }));

  return (
    <div className="min-h-screen bg-white">
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      
      {/* Header Section */}
      <div className="pt-8 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
            <p className="text-gray-500 text-base font-normal mt-1">Manage and create your service listings</p>
          </div>
        <button
          onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-700 text-white px-6 py-3 rounded-lg text-sm font-semibold shadow-md hover:bg-emerald-800 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
            <FaPlus className="w-4 h-4 text-white" />
            Create Listing
        </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search your listings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FaFilter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">All Categories</option>
                  <option value="Academic Help">Academic Help</option>
                  <option value="Tech & Digital Skills">Tech & Digital Skills</option>
                  <option value="Creative & Arts">Creative & Arts</option>
                  <option value="Personal Development">Personal Development</option>
                  <option value="Language & Culture">Language & Culture</option>
                  <option value="Health & Wellness">Health & Wellness</option>
                  <option value="Handy Skills & Repair">Handy Skills & Repair</option>
                  <option value="Everyday Help">Everyday Help</option>
                  <option value="Administrative & Misc Help">Administrative & Misc Help</option>
                  <option value="Social & Community">Social & Community</option>
                  <option value="Entrepreneurship & Business">Entrepreneurship & Business</option>
                  <option value="Specialized Skills">Specialized Skills</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range (Credits)</label>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">All Prices</option>
                  <option value="0-50">0 - 50 Credits</option>
                  <option value="50-100">50 - 100 Credits</option>
                  <option value="100-200">100 - 200 Credits</option>
                  <option value="200-500">200 - 500 Credits</option>
                  <option value="500-">500+ Credits</option>
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("");
                    setPriceRange("");
                  }}
                  className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      {!loading && tasks.length > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredTasks.length} of {tasks.length} listings
          {(searchTerm || selectedCategory || priceRange) && (
            <span className="ml-2 text-emerald-600">
              (filtered)
            </span>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="py-8">

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[60vh]">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="bg-gray-100 rounded-xl p-4 animate-pulse h-64 flex flex-col">
              <div className="h-32 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="flex-1"></div>
              <div className="h-8 bg-gray-300 rounded w-full mt-2"></div>
            </div>
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="bg-white rounded-2xl p-8 shadow-sm max-w-md mx-auto text-center">
            <div className="flex items-center justify-center mb-4">
              <FaClipboardList className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {tasks.length === 0 ? "No listings yet" : "No matching listings"}
            </h3>
            <p className="text-gray-600">
              {tasks.length === 0 
                ? "You haven't created any service listings yet."
                : "Try adjusting your filters to see more results."
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task: Task, idx: number) => {
            const gradients = [
              'from-blue-400 to-blue-600',
              'from-purple-400 to-purple-600', 
              'from-green-400 to-green-600',
              'from-pink-400 to-pink-600',
              'from-yellow-400 to-yellow-600',
              'from-orange-400 to-orange-600'
            ];
            const colors = [
              { bg: 'bg-blue-100', text: 'text-blue-600' },
              { bg: 'bg-purple-100', text: 'text-purple-600' },
              { bg: 'bg-green-100', text: 'text-green-600' },
              { bg: 'bg-pink-100', text: 'text-pink-600' },
              { bg: 'bg-yellow-100', text: 'text-yellow-600' },
              { bg: 'bg-orange-100', text: 'text-orange-600' }
            ];
            
            // Debug image rendering
            console.log(`=== RENDERING TASK ${idx + 1}: ${task.Title} ===`);
            console.log('Task images:', task.Images);
            console.log('Has images:', task.Images && task.Images.length > 0);
            console.log('First image:', task.Images && task.Images.length > 0 ? task.Images[0] : 'None');
            
            // Convert primitive.A to string array if needed
            const imageUrls = task.Images && Array.isArray(task.Images) ? task.Images : [];
            console.log('Image URLs:', imageUrls);
            console.log('Has image URLs:', imageUrls.length > 0);
            
            return (
              <div key={task.id ?? idx} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1" onClick={() => {
                console.log('Clicking task:', task.id, task.Title);
                router.push(`/services/view/${String(task.id)}`);
              }}>
                <div className="h-32 relative">
                  {imageUrls.length > 0 ? (
                    <img
                      src={imageUrls[0]}
                      alt={task.Title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${gradients[idx % gradients.length]}`}></div>
                  )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setTaskToEdit(task);
                      setIsEditModalOpen(true);
                    }}
                    className="text-white hover:text-blue-400 transition-colors bg-black/20 rounded-full p-2 hover:bg-black/40"
                    title="Edit"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setTaskToDelete(task.id);
                      setShowConfirmModal(true);
                    }}
                    className="text-white hover:text-red-400 transition-colors bg-black/20 rounded-full p-2 hover:bg-black/40"
                    title="Delete"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-block px-2 py-1 ${colors[idx % colors.length].bg} ${colors[idx % colors.length].text} text-xs font-semibold rounded`}>
                      {task.Type || task.Category || 'SERVICE'}
                    </span>
                    <div className="flex items-center gap-1 text-sm font-bold text-green-600">
                      <FaCoins className="w-4 h-4" />
                      <span>
                        {task.Tiers && task.Tiers.length > 0 
                          ? task.Tiers.find(tier => tier.name === 'Basic')?.credits || task.Tiers[0].credits
                          : task.Credits
                        }
                      </span>
                      {task.Tiers && task.Tiers.length > 0 && (
                        <span className="text-xs text-gray-500 font-normal">(Basic)</span>
                      )}
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {task.Title}
                  </h4>
                  
                  {/* Description */}
                  {task.Description && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {task.Description}
                      </p>
                    </div>
                  )}
                  
                  {/* Time Details Only (Location Hidden) */}
                  {task.Availability?.length > 0 && (
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <FaClock className="w-4 h-4 text-gray-400" />
                        <span>{task.Availability[0].TimeFrom} - {task.Availability[0].TimeTo}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Rating */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FaStar className="w-4 h-4 text-yellow-400" />
                    <span>4.5 (12 reviews)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 px-4">
          <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-md">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTrash className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Listing?</h2>
              <p className="text-gray-600 mb-4">
                This action cannot be undone. The listing will be permanently removed.
              </p>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 text-left">
                  Type "delete" to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Type 'delete' to confirm"
                  className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setDeleteConfirmation("");
                }}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { console.log('Delete clicked', taskToDelete); handleDelete(); }}
                disabled={deleteConfirmation.toLowerCase() !== "delete" || isDeleting}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center ${
                  deleteConfirmation.toLowerCase() === "delete" && !isDeleting
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateListingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        showToast={(msg, type) =>
          type === "success" ? toast.success(msg) : toast.error(msg)
        }
        onCreated={fetchTasks}
      />

      <EditTaskModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setTaskToEdit(null);
        }}
        task={taskToEdit}
        showToast={(msg, type) =>
          type === "success" ? toast.success(msg) : toast.error(msg)
        }
        onUpdated={fetchTasks}
      />

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default function TaskListPage() {
  return (
    <div className="bg-white text-black min-h-screen">
      <Suspense fallback={
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[60vh]">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="bg-gray-100 rounded-xl p-4 animate-pulse h-64 flex flex-col">
              <div className="h-32 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="flex-1"></div>
              <div className="h-8 bg-gray-300 rounded w-full mt-2"></div>
            </div>
          ))}
        </div>
      }>
        <TaskListPageContent />
      </Suspense>
    </div>
  );
}

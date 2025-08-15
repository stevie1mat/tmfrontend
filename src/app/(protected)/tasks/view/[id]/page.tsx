"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ProtectedLayout from "@/components/Layout/ProtectedLayout";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaArrowLeft, FaMapMarkerAlt, FaClock, FaCoins, FaStar, FaHeart, FaCalendar, FaUser, FaChevronDown, FaChevronUp, FaEnvelope, FaTimes, FaChevronLeft, FaChevronRight, FaExpand, FaCheck } from "react-icons/fa";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";

interface Availability {
  date: string;
  timeFrom: string;
  timeTo: string;
}

interface Author {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  location: string;
  locationType: string;
  credits: number;
  availability: Availability[];
  author?: Author;
  createdAt?: number;
  completedAt?: number;
  status?: string;
  type?: string;
  acceptedBy?: string;
  Images?: string[];
  Tiers?: Tier[];
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

interface Review {
  id?: string;
  _id?: string;
  reviewer?: {
    id?: string;
    name?: string;
    avatar?: string;
    location?: string;
  };
  rating?: number;
  comment?: string;
  text?: string;
  createdAt?: number;
}

// Normalize raw API data with uppercase keys
function normalizeTask(raw: any): Task {
  return {
    id: raw.ID,
    title: raw.Title,
    description: raw.Description,
    location: raw.Location,
    locationType: raw.LocationType,
    credits: raw.Credits,
    availability: (raw.Availability || []).map((a: any) => ({
      date: a.Date,
      timeFrom: a.TimeFrom,
      timeTo: a.TimeTo,
    })),
    author: raw.Author
      ? {
          id: raw.Author.ID,
          name: raw.Author.Name,
          email: raw.Author.Email,
          avatar: raw.Author.Avatar,
        }
      : undefined,
    createdAt: raw.CreatedAt,
    completedAt: raw.CompletedAt,
    status: raw.Status,
    type: raw.Type,
    acceptedBy: raw.AcceptedBy,
    Images: raw.Images || [],
    Tiers: raw.Tiers || [],
  };
}

// Helper to check for valid MongoDB ObjectID
function isValidObjectId(id: string | undefined): boolean {
  return typeof id === 'string' && id.length === 24 && /^[a-fA-F0-9]+$/.test(id);
}

export default function ViewTaskPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('Basic');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [messageModal, setMessageModal] = useState(false);
  const [firstMessage, setFirstMessage] = useState("");
  const [sendingFirstMessage, setSendingFirstMessage] = useState(false);
  const [dialog, setDialog] = useState({ open: false, message: "", isError: false });
  const [imageModal, setImageModal] = useState({ open: false, currentIndex: 0, images: [] as string[] });
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || "http://localhost:8084";

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const taskId = params?.id as string;
        
        console.log("=== TASK VIEW DEBUG START ===");
        console.log("Task ID:", taskId);
        console.log("Params:", params);
        console.log("Token:", token ? "Present" : "Missing");
        
        if (!isValidObjectId(taskId)) {
          setError('Invalid task ID');
          setLoading(false);
          return;
        }

        const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || "http://localhost:8084";
        const url = `${API_BASE_URL}/api/tasks/get/${taskId}`;
        
        console.log("API Base URL:", API_BASE_URL);
        console.log("Full URL:", url);
        
        console.log("Making fetch request...");
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        console.log("Response received:");
        console.log("Status:", response.status);
        console.log("Status Text:", response.statusText);
        console.log("OK:", response.ok);

        if (!response.ok) {
          console.error("Response not OK - Status:", response.status);
          const errorText = await response.text();
          console.error("Error response body:", errorText);
          throw new Error(`Task not found (Status: ${response.status})`);
        }
        
        console.log("Response is OK, parsing JSON...");
        const data = await response.json();
        console.log("=== TASK VIEW DEBUG ===");
        console.log("Raw API response:", data);
        
        const normalizedTask = normalizeTask(data);
        console.log("Normalized task:", normalizedTask);
        setTask(normalizedTask);
        
        // Set initial selected tier if tiers are available
        if (normalizedTask.Tiers && normalizedTask.Tiers.length > 0) {
          setSelectedTier(normalizedTask.Tiers[0].name);
          console.log("Set initial selected tier:", normalizedTask.Tiers[0].name);
        }
        
        // Fetch reviews for this task
        if (normalizedTask.author?.id) {
          fetchReviews(normalizedTask.id, setReviews);
        }
        console.log("=== TASK VIEW DEBUG END ===");
      } catch (err) {
        console.error("=== TASK VIEW ERROR ===");
        console.error("Error type:", typeof err);
        console.error("Error name:", err instanceof Error ? err.name : 'N/A');
        console.error("Error message:", err instanceof Error ? err.message : err);
        console.error("Full error:", err);
        console.error("=== END ERROR ===");
        setError(err instanceof Error ? err.message : 'Failed to load task');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchTask();
    }
  }, [params?.id, token]);

  // Fetch reviews for this task
  const fetchReviews = async (taskId: string, setReviews: (reviews: Review[]) => void) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_REVIEW_API_URL || 'http://localhost:8086';
      const res = await fetch(`${API_BASE_URL}/api/reviews?taskId=${taskId}`);
      if (!res.ok) return;
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      // ignore
    }
  };

  // Fetch reviews for this task on mount or when task changes
  useEffect(() => {
    if (!task || !task.id) return;
    fetchReviews(task.id, setReviews);
  }, [task]);

  async function handleSendFirstMessage() {
    const token = localStorage.getItem("token");
    if (!token || !task || !task.author?.id) {
      setDialog({ open: true, message: "Authentication required", isError: true });
      return;
    }

    if (!firstMessage.trim()) {
      setDialog({ open: true, message: "Please enter a message", isError: true });
      return;
    }

    setSendingFirstMessage(true);
    try {
      // Get current user profile
              const profileRes = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://tmuserservice.onrender.com'}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!profileRes.ok) {
        throw new Error("Failed to fetch user profile");
      }
      
      const profileData = await profileRes.json();
      const currentUserId = profileData.ID || profileData.id;
      
      if (!currentUserId) {
        throw new Error("User ID not found");
      }

      // Send message via messaging service
      const messagingRes = await fetch(`${process.env.NEXT_PUBLIC_MESSAGING_API_URL || 'http://localhost:8085'}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: task.author.id,
          content: firstMessage,
          taskId: task.id,
        }),
      });

      if (!messagingRes.ok) {
        throw new Error("Failed to send message");
      }

      setDialog({ open: true, message: "Message sent successfully! You can now chat with the task provider.", isError: false });
      setMessageModal(false);
      setFirstMessage("");
      
      // Redirect to messages page after a short delay
      setTimeout(() => {
        router.push('/messages');
      }, 2000);

    } catch (error) {
      console.error("Error sending message:", error);
      setDialog({ open: true, message: "Failed to send message. Please try again.", isError: true });
    } finally {
      setSendingFirstMessage(false);
    }
  }

  const openImageModal = (images: string[], index: number) => {
    setImageModal({ open: true, currentIndex: index, images });
  };

  const closeImageModal = () => {
    setImageModal({ open: false, currentIndex: 0, images: [] });
  };

  const nextImage = () => {
    setImageModal(prev => ({
      ...prev,
      currentIndex: prev.currentIndex === prev.images.length - 1 ? 0 : prev.currentIndex + 1
    }));
  };

  const prevImage = () => {
    setImageModal(prev => ({
      ...prev,
      currentIndex: prev.currentIndex === 0 ? prev.images.length - 1 : prev.currentIndex - 1
    }));
  };

  if (loading) {
    return (
      <ProtectedLayout hideTopBar>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </ProtectedLayout>
    );
  }

  if (!task) {
    return (
      <ProtectedLayout hideTopBar>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Task not found</h1>
            <p className="text-gray-600 mb-6">The task you're looking for doesn't exist or has been removed.</p>
            <Link href="/tasks/explore" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Browse Tasks
            </Link>
          </div>
        </div>
      </ProtectedLayout>
    );
  }

  const images = task.Images || [];
  const title = task.title;
  const description = task.description;
  const location = task.location;
  const locationType = task.locationType;
  const availability = task.availability || [];
  const taskProvider = task.author?.name || 'Unknown';
  const avatar = task.author?.avatar || '/api/placeholder/60/60';

  return (
    <ProtectedLayout hideTopBar>
      <div className="min-h-screen bg-white">
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Cover Image */}
              <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
                <div className="relative h-96">
                  {images.length > 0 ? (
                    <Image
                      src={images[currentImageIndex] || images[0]}
                      alt={title || 'Task'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <span className="text-white text-lg">Task Image</span>
                    </div>
                  )}
                  
                  {/* Navigation arrows */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full"
                      >
                        ←
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full"
                      >
                        →
                      </button>
                    </>
                  )}
                </div>
                
                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="p-4 flex space-x-2 overflow-x-auto">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden ${
                          index === currentImageIndex ? 'ring-2 ring-green-500' : ''
                        }`}
                      >
                        <Image
                          src={image}
                          alt={`${title} ${index + 1}`}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Task Title and Provider Info */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  {title || 'Task Title'}
                </h1>
                
                {/* Task Details */}
                <div className="mb-6">
                  {/* Task Details Grid */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    {/* Location */}
                    <div className="flex items-center space-x-2">
                      <FaMapMarkerAlt className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{location}</p>
                        <p className="text-xs text-gray-500">{locationType}</p>
                      </div>
                    </div>
                    
                    {/* Availability */}
                    {availability.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <FaClock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {availability[0].timeFrom} - {availability[0].timeTo}
                          </p>
                          <p className="text-xs text-gray-500">Available time</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 mb-6">
                  <div className="relative">
                                      <Image
                    src={avatar || '/api/placeholder/60/60'}
                    alt={taskProvider}
                    width={60}
                    height={60}
                    className="rounded-full"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{taskProvider}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <FaStar key={i} className={`w-4 h-4 ${i < 4 ? 'text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        4.0 (24 reviews)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* About the Task */}
              {description && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">About the task</h2>
                  <div className="prose max-w-none text-gray-700">
                    <p className="leading-relaxed">
                      {description}
                    </p>
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">What people loved</h2>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600 cursor-pointer hover:text-green-600">See all reviews</span>
                    <div className="flex space-x-2">
                      <button className="p-1 hover:bg-gray-100 rounded">←</button>
                      <button className="p-1 hover:bg-gray-100 rounded">→</button>
                    </div>
                  </div>
                </div>
                
                {reviews.length > 0 ? (
                  reviews.map((review) => (
                    <div key={review.id || review._id} className="border-b border-gray-100 pb-6 mb-6 last:border-b-0">
                      <div className="flex items-start space-x-4">
                        <Image
                          src={review.reviewer?.avatar || '/api/placeholder/40/40'}
                          alt={review.reviewer?.name || 'Reviewer'}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-gray-900">{review.reviewer?.name || 'Anonymous'}</span>
                            <span className="text-sm text-gray-500">{review.reviewer?.location || 'Unknown location'}</span>
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <FaStar key={i} className={`w-4 h-4 ${i < (review.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} />
                            ))}
                            <span className="text-sm text-gray-500">
                              {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recently'}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-2">{review.comment || review.text || 'No comment provided'}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No reviews yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                {/* Task Details with Tiers */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  {task?.Tiers && task.Tiers.length > 0 ? (
                    <>
                      <div className="flex space-x-1 mb-6">
                        {task.Tiers.map((tier) => (
                          <button
                            key={tier.name}
                            onClick={() => setSelectedTier(tier.name)}
                            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                              selectedTier === tier.name
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {tier.name}
                          </button>
                        ))}
                      </div>

                      {/* Selected Tier Details */}
                      {(() => {
                        const currentTier = task.Tiers.find(tier => tier.name === selectedTier);
                        if (!currentTier) return null;
                        
                        return (
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {currentTier.title || `${currentTier.name} Package`}
                            </h3>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold text-gray-900">
                                {currentTier.credits} Credits
                              </span>
                              <div className="flex items-center text-sm text-gray-500">
                                <span>No tax</span>
                              </div>
                            </div>
                            
                            <p className="text-gray-600">
                              {currentTier.description}
                            </p>

                            {/* Tier Features */}
                            {currentTier.features && currentTier.features.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="font-medium text-gray-900">What's included:</h4>
                                <ul className="space-y-1">
                                  {currentTier.features.map((feature, index) => (
                                    <li key={index} className="flex items-center text-sm text-gray-600">
                                      <FaCheck className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                                      {feature}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Time Slot and Max Days */}
                            <div className="space-y-2 pt-2 border-t border-gray-100">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Available Time:</span>
                                <span className="font-medium text-gray-900">{currentTier.availableTimeSlot}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Max Duration:</span>
                                <span className="font-medium text-gray-900">{currentTier.maxDays} days</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-gray-900">
                          {task?.credits} Credits
                        </span>
                        <div className="flex items-center text-sm text-gray-500">
                          <span>No tax</span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600">
                        {description}
                      </p>

                      {/* Task Features */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">What's included:</h4>
                        <ul className="space-y-1">
                          <li className="flex items-center text-sm text-gray-600">
                            <FaCheck className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                            Professional service delivery
                          </li>
                          <li className="flex items-center text-sm text-gray-600">
                            <FaCheck className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                            Quality assurance
                          </li>
                          <li className="flex items-center text-sm text-gray-600">
                            <FaCheck className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                            On-time completion
                          </li>
                        </ul>
                      </div>

                      {/* Time Slot and Location */}
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Available Time:</span>
                          <span className="font-medium text-gray-900">
                            {availability.length > 0 ? `${availability[0].timeFrom} - ${availability[0].timeTo}` : 'Flexible'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium text-gray-900">{locationType}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>




              </div>
            </div>
          </div>
        </div>



        {/* Message Modal */}
        {messageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-xl shadow-lg p-8 min-w-[320px] text-center border border-blue-400">
              <div className="mb-2 text-lg font-semibold text-blue-600">Send a message to the task provider</div>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-2 mb-4 min-h-[80px]"
                placeholder="Type your message..."
                value={firstMessage}
                onChange={e => setFirstMessage(e.target.value)}
                disabled={sendingFirstMessage}
              />
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => { setMessageModal(false); setFirstMessage(""); }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  disabled={sendingFirstMessage}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendFirstMessage}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  disabled={sendingFirstMessage}
                >
                  {sendingFirstMessage ? "Sending..." : "Send & Start Chat"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dialog Modal */}
        {dialog.open && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/30`}>
            <div className={`bg-white rounded-xl shadow-lg p-8 min-w-[320px] text-center border ${dialog.isError ? 'border-red-400' : 'border-green-400'}`}>
              <div className={`mb-2 text-lg font-semibold ${dialog.isError ? 'text-red-600' : 'text-green-600'}`}>{dialog.isError ? 'Error' : 'Success'}</div>
              <div className="mb-4 text-gray-700">{dialog.message}</div>
              {!sendingFirstMessage && dialog.isError && (
                <button onClick={() => setDialog({ open: false, message: "", isError: false })} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Close</button>
              )}
            </div>
          </div>
        )}

        {/* Image Zoom Modal */}
        {imageModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Close Button */}
              <button
                onClick={closeImageModal}
                className="absolute top-4 right-4 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              >
                <FaTimes className="w-6 h-6 text-white" />
              </button>

              {/* Navigation Buttons */}
              {imageModal.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                  >
                    <FaChevronLeft className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                  >
                    <FaChevronRight className="w-6 h-6 text-white" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              {imageModal.images.length > 1 && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 px-4 py-2 bg-black/50 rounded-full">
                  <span className="text-white text-sm font-medium">
                    {imageModal.currentIndex + 1} / {imageModal.images.length}
                  </span>
                </div>
              )}

              {/* Main Image */}
              <div className="max-w-4xl max-h-full p-4">
                <img
                  src={imageModal.images[imageModal.currentIndex]}
                  alt={`Task image ${imageModal.currentIndex + 1}`}
                  className="w-full h-full object-contain max-h-[90vh] rounded-lg"
                />
              </div>

              {/* Thumbnail Strip */}
              {imageModal.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
                  {imageModal.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setImageModal(prev => ({ ...prev, currentIndex: index }))}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === imageModal.currentIndex 
                          ? 'border-white scale-110' 
                          : 'border-transparent hover:border-white/50'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </ProtectedLayout>
  );
}

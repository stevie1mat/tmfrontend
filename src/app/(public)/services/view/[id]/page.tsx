'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FaStar, FaMapMarkerAlt, FaClock, FaCoins, FaHeart, FaShare, FaEllipsisH, FaCheck, FaInfoCircle, FaTimes, FaEnvelope } from 'react-icons/fa';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import BookingModal from '@/components/BookingModal';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthHeaders } from '@/lib/token-utils';
import { fetchProfileWithCache } from '@/lib/profile-cache';

type Availability = {
  Date: string;
  TimeFrom: string;
  TimeTo: string;
};

type Tier = {
  name: string;
  title: string;
  description: string;
  credits: number;
  features: string[];
  availableTimeSlot: string;
  maxDays: number;
};

type Service = {
  ID?: string;
  id?: string;
  Title?: string;
  title?: string;
  Description?: string;
  description?: string;
  Credits?: number;
  credits?: number;
  Category?: string;
  category?: string;
  Location?: string;
  location?: string;
  LocationType?: string;
  locationType?: string;
  Availability?: Availability[];
  availability?: Availability[];
  Tiers?: Tier[];
  tiers?: Tier[];
  Author?: {
    ID?: string;
    id?: string;
    Name?: string;
    name?: string;
    Avatar?: string;
    avatar?: string;
  };
  author?: {
    id?: string;
    name?: string;
    avatar?: string;
  };
  Images?: string[];
  rating?: number;
  reviewCount?: number;
  CreatedAt?: number;
  createdAt?: number;
};



type Review = {
  id?: string;
  _id?: string;
  reviewer?: {
    name?: string;
    avatar?: string;
    location?: string;
  };
  rating?: number;
  text?: string;
  comment?: string;
  date?: string;
  createdAt?: number;
  price?: string;
  duration?: string;
  hasFiles?: boolean;
};

export default function ServiceViewPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('Basic');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isChatBoxOpen, setIsChatBoxOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    sender: 'user' | 'provider';
    message: string;
    timestamp: Date;
  }>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingChatMessage, setSendingChatMessage] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'chat' | 'book' | null>(null);
  const [hasBooked, setHasBooked] = useState(false);

  // Helper function to check if service belongs to current user
  const isOwnService = () => {
    if (!user || !service) return false;
    const serviceAuthorId = service.Author?.ID || service.Author?.id || service.author?.id;
    const currentUserId = user.ID || user.id;
    const isOwn = serviceAuthorId === currentUserId;
    
    console.log('=== IS OWN SERVICE DEBUG ===');
    console.log('User:', user);
    console.log('Service Author ID:', serviceAuthorId);
    console.log('Current User ID:', currentUserId);
    console.log('Is Own Service:', isOwn);
    console.log('=== END DEBUG ===');
    
    return isOwn;
  };

  // Check if user has already booked this service
  const checkIfUserHasBooked = async () => {
    if (!user || !service || !token) {
      console.log('🔍 checkIfUserHasBooked: Missing user, service, or token');
      console.log('User:', user);
      console.log('Service:', service);
      console.log('Token:', token ? 'Present' : 'Missing');
      setHasBooked(false);
      return;
    }

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || "http://localhost:8084";
      const serviceId = service.ID || service.id;
      const userId = user.ID || user.id;

      console.log('🔍 checkIfUserHasBooked: Checking booking status');
      console.log('Service ID:', serviceId);
      console.log('User ID:', userId);
      console.log('API URL:', `${API_BASE_URL}/api/bookings/user/${userId}/service/${serviceId}`);

      const res = await fetch(`${API_BASE_URL}/api/bookings/user/${userId}/service/${serviceId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('📡 Booking check response status:', res.status);

      if (res.ok) {
        const bookings = await res.json();
        console.log('📋 All bookings for user:', bookings);
        
        const hasExistingBooking = bookings.some((booking: any) => {
          const isMatchingService = booking.taskId === serviceId;
          const isValidStatus = ['pending', 'confirmed', 'completed'].includes(booking.status?.toLowerCase());
          console.log('🔍 Booking check:', {
            bookingId: booking.id || booking.ID,
            taskId: booking.taskId,
            serviceId: serviceId,
            status: booking.status,
            isMatchingService,
            isValidStatus,
            matches: isMatchingService && isValidStatus
          });
          return isMatchingService && isValidStatus;
        });
        
        console.log('✅ Has existing booking:', hasExistingBooking);
        setHasBooked(hasExistingBooking);
      } else {
        const errorText = await res.text();
        console.error('❌ Booking check failed:', res.status, errorText);
        setHasBooked(false);
      }
    } catch (error) {
      console.error('❌ Error checking if user has booked:', error);
      setHasBooked(false);
    }
  };

  // Track service view
  const trackServiceView = async (serviceId: string, serviceAuthorId: string) => {
    try {
      // Only track if not viewing own service
      if (isOwnService()) return;
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || 'http://localhost:8084';
      
      // Send view tracking request
      await fetch(`${API_BASE_URL}/api/views`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          serviceId: serviceId,
          viewedUserId: serviceAuthorId,
          viewerId: user?.ID || user?.id || 'anonymous',
          type: 'service',
          timestamp: new Date().toISOString()
        })
      });
      
      console.log('Service view tracked for service:', serviceId);
    } catch (error) {
      console.error('Error tracking service view:', error);
      // Don't throw error - view tracking shouldn't break the page
    }
  };

  // Debug logging function
  const logToFile = async (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}${data ? '\nData: ' + JSON.stringify(data, null, 2) : ''}\n\n`;
    
    // Log to console
    console.log('=== DEBUG LOG ENTRY ===');
    console.log(logEntry);
    console.log('=== END DEBUG LOG ===');
    
    // Write to debug log file
    try {
      const response = await fetch('/api/debug-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logEntry }),
      });
      
      if (!response.ok) {
        console.error('Failed to write to debug log file');
      }
    } catch (error) {
      console.error('Error writing to debug log:', error);
    }
  };

  // Mock reviews data
  const mockReviews: Review[] = [
    {
      id: '1',
      reviewer: {
        name: 'joemarks4',
        avatar: '/api/placeholder/40/40',
        location: 'United Arab Emirates'
      },
      rating: 5,
      text: 'Outstanding. He was able to take my hand drawn plans and turn them into cad plan\'s quickly, and with very little rework. He was able to fix all the little problems that my drawings got wrong. I highly recommend Alejandro!!',
      date: '3 weeks ago',
      price: 'CA$150-CA$300',
      duration: '6 days',
      hasFiles: true
    },
    {
      id: '2',
      reviewer: {
        name: 'larsosterberg',
        avatar: '/api/placeholder/40/40',
        location: 'Sweden'
      },
      rating: 5,
      text: 'Very quick delivery with great quality and attention to details. Proactive, fast response time. Highly recommend Alejandros work to others.',
      date: '2 months ago',
      price: 'CA$43-CA$57',
      duration: '2 days',
      hasFiles: false
    }
  ];



  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        const serviceId = params?.id as string;
        
        console.log("=== SERVICE VIEW DEBUG START ===");
        console.log("Service ID:", serviceId);
        console.log("Params:", params);
        
        // Use the public API endpoint (no authentication required)
        const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || "http://localhost:8084";
        const url = `${API_BASE_URL}/api/tasks/public/${serviceId}`;
        
        console.log("API Base URL:", API_BASE_URL);
        console.log("Full URL:", url);
        console.log("Environment variable:", process.env.NEXT_PUBLIC_TASK_API_URL);
        
        console.log("Making fetch request...");
        const response = await fetch(url);
        
        console.log("Response received:");
        console.log("Status:", response.status);
        console.log("Status Text:", response.statusText);
        console.log("Headers:", Object.fromEntries(response.headers.entries()));
        console.log("OK:", response.ok);
        
        if (!response.ok) {
          console.error("Response not OK - Status:", response.status);
          const errorText = await response.text();
          console.error("Error response body:", errorText);
          throw new Error(`Service not found (Status: ${response.status})`);
        }
        
        console.log("Response is OK, parsing JSON...");
        const json = await response.json();
        console.log("=== SERVICE VIEW DEBUG ===");
        console.log("Raw API response:", json);
        console.log("Response type:", typeof json);
        console.log("Is array:", Array.isArray(json));
        console.log("Has data property:", 'data' in json);
        console.log("Service data:", json.data || json);
        
        const data = json.data || json;
        console.log("Final data to set:", data);
        console.log("Data type:", typeof data);
        console.log("Data keys:", Object.keys(data || {}));
        
        // Debug tiers data specifically
        logToFile("TIERS DEBUG START", {
          tiersProperty: data.Tiers,
          tiersPropertyLowercase: data.tiers,
          tiersType: typeof data.Tiers,
          tiersTypeLowercase: typeof data.tiers,
          tiersIsArray: Array.isArray(data.Tiers),
          tiersIsArrayLowercase: Array.isArray(data.tiers),
          tiersLength: data.Tiers?.length,
          tiersLengthLowercase: data.tiers?.length,
          firstTier: data.Tiers?.[0],
          firstTierLowercase: data.tiers?.[0]
        });
        
        setService(data);
        
        // Track service view (only if not own service)
        const serviceAuthorId = data.Author?.ID || data.Author?.id || data.author?.id;
        if (serviceAuthorId) {
          await trackServiceView(params?.id as string, serviceAuthorId);
        }
        
        // Handle tiers data - could be string or array
        let tiersData = data.Tiers || data.tiers;
        
        logToFile("TIERS PARSING START", {
          originalTiersData: tiersData,
          originalType: typeof tiersData
        });
        
        // If tiers is a string, try to parse it
        if (typeof tiersData === 'string') {
          try {
            tiersData = JSON.parse(tiersData);
            logToFile("SUCCESSFULLY PARSED TIERS FROM STRING", tiersData);
          } catch (e) {
            logToFile("FAILED TO PARSE TIERS STRING", { error: e, originalString: tiersData });
            tiersData = [];
          }
        }
        
        // Update the data object with parsed tiers
        if (tiersData && Array.isArray(tiersData)) {
          data.Tiers = tiersData;
          logToFile("FINAL TIERS DATA SET", data.Tiers);
        } else {
          logToFile("NO VALID TIERS DATA FOUND", { tiersData, isArray: Array.isArray(tiersData) });
        }
        
        // Set initial selected tier if tiers are available
        if (data.Tiers && data.Tiers.length > 0) {
          setSelectedTier(data.Tiers[0].name);
          logToFile("SET INITIAL SELECTED TIER", { 
            selectedTier: data.Tiers[0].name,
            availableTiers: data.Tiers.map((t: Tier) => t.name)
          });
        } else {
          logToFile("NO TIERS AVAILABLE FOR INITIAL SELECTION", { 
            tiersLength: data.Tiers?.length,
            tiersData: data.Tiers
          });
        }
        
        // Fetch real reviews for this service
        if (data.Author?.ID || data.Author?.id) {
          fetchReviews(data.Author.ID || data.Author.id);
        }

        // Check if user has already booked this service
        await checkIfUserHasBooked();
        
        console.log("=== SERVICE VIEW DEBUG END ===");
      } catch (err) {
        console.error("=== SERVICE VIEW ERROR ===");
        console.error("Error type:", typeof err);
        console.error("Error name:", err instanceof Error ? err.name : 'N/A');
        console.error("Error message:", err instanceof Error ? err.message : err);
        console.error("Full error:", err);
        console.error("=== END ERROR ===");
        setError(err instanceof Error ? err.message : 'Failed to load service');
      } finally {
        setLoading(false);
      }
    };

    if (params?.id) {
      console.log("Params.id exists, calling fetchService");
      fetchService();
    } else {
      console.log("Params.id is falsy:", params?.id);
    }
  }, [params?.id]);

  // Check booking status when user or token changes
  useEffect(() => {
    if (user && service && token) {
      console.log('🔄 User/token changed, re-checking booking status');
      checkIfUserHasBooked();
    }
  }, [user, service, token]);

  const handleOrder = () => {
    console.log('🎯 handleOrder called');
    console.log('Token:', token ? 'Present' : 'Missing');
    console.log('hasBooked:', hasBooked);
    console.log('isOwnService:', isOwnService());
    
    // Prevent booking if it's own service (highest priority)
    if (isOwnService()) {
      console.log('Cannot book your own service');
      alert('You cannot book your own service.');
      return;
    }
    
    // Prevent booking if already booked
    if (hasBooked) {
      console.log('User has already booked this service, preventing booking');
      alert('You have already booked this service.');
      return;
    }
    
    if (!token) {
      console.log('No token, opening auth modal');
      setPendingAction('book');
      setIsAuthModalOpen(true);
    } else {
      console.log('Token present, opening booking modal');
      setIsBookingModalOpen(true);
    }
  };

  const handleContact = () => {
    // Navigate to messages or open contact modal
    router.push(`/messages?user=${service?.Author?.Name}`);
  };

  const fetchReviews = async (authorId: string) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_REVIEW_API_URL || 'http://localhost:8086';
      const response = await fetch(`${API_BASE_URL}/api/reviews?revieweeId=${authorId}`);
      
      if (response.ok) {
        const data = await response.json();
        const reviewsData = Array.isArray(data) ? data : data.data || [];
        setReviews(reviewsData);
        console.log("Fetched reviews:", reviewsData);
      } else {
        console.log("No reviews found or error fetching reviews");
        setReviews([]);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
    }
  };

  const fetchConversationHistory = async () => {
    if (!token || !service) return;

    try {
      console.log('=== FETCHING CONVERSATION HISTORY ===');
      
      // Get current user profile with caching
      const profileData = await fetchProfileWithCache('current-user', async () => {
        const profileRes = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8080'}/api/auth/profile`, {
          headers: getAuthHeaders(),
        });
        
        if (!profileRes.ok) {
          throw new Error("Failed to fetch user profile");
        }
        
        return profileRes.json();
      });
      
      const currentUserEmail = (profileData as any).email || (profileData as any).Email;
      
      // Get service provider email with caching
      const serviceProviderId = service.Author?.ID || service.Author?.id || service.author?.id;
      if (!serviceProviderId) {
        console.log('No service provider ID found');
        return;
      }

      const providerProfileData = await fetchProfileWithCache(serviceProviderId, async () => {
        const providerProfileRes = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8080'}/api/auth/user/${serviceProviderId}`, {
          headers: getAuthHeaders(),
        });
        
        if (!providerProfileRes.ok) {
          throw new Error('Failed to fetch provider profile');
        }
        
        return providerProfileRes.json();
      });
      
      const serviceProviderEmail = (providerProfileData as any).email || (providerProfileData as any).Email;
      
      // Find existing conversation
      const conversationsRes = await fetch(`${process.env.NEXT_PUBLIC_MESSAGING_API_URL || 'http://localhost:8085'}/api/conversations?userId=${currentUserEmail}`);
      
      if (conversationsRes.ok) {
        const conversations = await conversationsRes.json();
        console.log('Found conversations:', conversations);
        
        // Find conversation with this service provider
        const existingConversation = conversations.find((conv: any) => 
          conv.participants.includes(currentUserEmail) && 
          conv.participants.includes(serviceProviderEmail) &&
          conv.taskId === (service.ID || service.id)
        );
        
        if (existingConversation) {
          console.log('Found existing conversation:', existingConversation);
          setCurrentConversationId(existingConversation.id);
          
          // Fetch messages for this conversation
          const messagesRes = await fetch(`${process.env.NEXT_PUBLIC_MESSAGING_API_URL || 'http://localhost:8085'}/api/conversations/${existingConversation.id}/messages`);
          
          if (messagesRes.ok) {
            const messages = await messagesRes.json();
            console.log('Fetched messages:', messages);
            
            // Convert messages to chat format
            const chatMessages = messages.map((msg: any) => ({
              id: msg.id,
              sender: msg.senderId === currentUserEmail ? 'user' as const : 'provider' as const,
              message: msg.content,
              timestamp: new Date(msg.timestamp * 1000)
            }));
            
            setChatMessages(chatMessages);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching conversation history:', error);
    }
  };

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    const chatMessagesDiv = document.getElementById('chat-messages');
    if (chatMessagesDiv) {
      chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendChatMessage = async () => {
    if (!newMessage.trim() || sendingChatMessage || !token || !service) return;

    console.log('=== CHAT MESSAGE DEBUG ===');
    console.log('Service:', service);
    console.log('Token:', token ? 'Present' : 'Missing');
    console.log('Message:', newMessage.trim());

    setSendingChatMessage(true);
    try {
      // Get current user profile
      const profileRes = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8080'}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!profileRes.ok) {
        throw new Error("Failed to fetch user profile");
      }
      
      const profileData = await profileRes.json();
      console.log('Profile data:', profileData);
      
      const currentUserId = profileData.ID || profileData.id;
      const currentUserEmail = (profileData as any).email || (profileData as any).Email;
      
      console.log('Current user ID:', currentUserId);
      console.log('Current user email:', currentUserEmail);
      
      if (!currentUserId) {
        throw new Error("User ID not found");
      }

      // Get service provider email - we need to fetch the provider's profile
      const serviceProviderId = service.Author?.ID || service.Author?.id || service.author?.id;
      console.log('Service provider ID:', serviceProviderId);
      console.log('Service Author:', service.Author);
      console.log('Service author:', service.author);
      
      if (!serviceProviderId) {
        throw new Error("Service provider ID not found");
      }

      // Fetch service provider's profile to get their email
      const providerProfileRes = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8080'}/api/auth/user/${serviceProviderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!providerProfileRes.ok) {
        throw new Error("Failed to fetch service provider profile");
      }
      
      const providerProfileData = await providerProfileRes.json();
      const serviceProviderEmail = (providerProfileData as any).email || (providerProfileData as any).Email;
      console.log('Service provider email:', serviceProviderEmail);
      
      if (!serviceProviderEmail) {
        throw new Error("Service provider email not found");
      }

      // Use existing conversation ID or create new one
      let conversationId = currentConversationId;
      
      if (!conversationId) {
        // 1. Create/find conversation
        const conversationRes = await fetch(`${process.env.NEXT_PUBLIC_MESSAGING_API_URL || 'http://localhost:8085'}/api/conversations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            type: "direct",
            name: `Service: ${service.Title || service.title}`,
            avatar: service.Author?.Avatar || service.author?.avatar || "",
            participants: [currentUserEmail, serviceProviderEmail].sort(),
            taskId: service.ID || service.id
          })
        });

        if (!conversationRes.ok) {
          throw new Error("Failed to create conversation");
        }

        const conversationData = await conversationRes.json();
        conversationId = conversationData.$oid || conversationData;
        setCurrentConversationId(conversationId);
      }

      // 2. Send message
      const messageRes = await fetch(`${process.env.NEXT_PUBLIC_MESSAGING_API_URL || 'http://localhost:8085'}/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          senderId: currentUserEmail,
          senderName: profileData.name || profileData.Name || "User",
          senderAvatar: profileData.avatar || profileData.Avatar || "",
          type: "text"
        })
      });

      if (!messageRes.ok) {
        throw new Error("Failed to send message");
      }

      // Add user message to chat UI
      const userMessage = {
        id: Date.now().toString(),
        sender: 'user' as const,
        message: newMessage.trim(),
        timestamp: new Date(),
      };

      setChatMessages(prev => [...prev, userMessage]);
      setNewMessage('');
      
      // Refresh conversation history to get the latest messages
      setTimeout(() => {
        fetchConversationHistory();
      }, 500);

    } catch (error) {
      console.error('Error sending chat message:', error);
    } finally {
      setSendingChatMessage(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        
        {/* Breadcrumb Skeleton */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Skeleton */}
            <div className="lg:col-span-2 space-y-8">
              {/* Cover Image Skeleton */}
              <div className="bg-white rounded-xl overflow-hidden">
                <div className="relative h-96 bg-gray-200 animate-pulse"></div>
                {/* Thumbnails Skeleton */}
                <div className="p-4 flex space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-16 h-16 bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>

              {/* Service Title and Provider Info Skeleton */}
              <div className="bg-white rounded-xl p-6">
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-20 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* About the Service Skeleton */}
              <div className="bg-white rounded-xl p-6">
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                </div>
              </div>

              {/* Reviews Section Skeleton */}
              <div className="bg-white rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-40"></div>
                  <div className="flex items-center space-x-4">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                    <div className="flex space-x-2">
                      <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
                
                {/* Review Items Skeleton */}
                {[1, 2].map((i) => (
                  <div key={i} className="border-b border-gray-100 pb-6 mb-6 last:border-b-0">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <div key={star} className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                          ))}
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Skeleton */}
            <div className="space-y-6">
              {/* Booking Card Skeleton */}
              <div className="bg-white rounded-xl p-6">
                <div className="h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="space-y-4">
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="h-12 bg-green-500 rounded-lg animate-pulse"></div>
                </div>
              </div>

              {/* Provider Info Skeleton */}
              <div className="bg-white rounded-xl p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !service) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-16">
          <div className="text-red-500 text-lg mb-4">{error || 'Service not found'}</div>
          <button 
            onClick={() => router.push('/services')}
            className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            Browse Services
          </button>
        </div>
      </main>
    );
  }

  const serviceId = service.ID || service.id;
  const title = service.Title || service.title;
  const category = service.Category || service.category;
  const rating = service.rating || 4.9;
  const reviewCount = service.reviewCount || 554;
  const serviceProvider = service.Author?.Name || service.Author?.name || service.author?.name || 'Provider';
  const avatar = service.Author?.Avatar || service.author?.avatar;
  const price = service.Tiers && service.Tiers.length > 0 
    ? service.Tiers.find((tier: any) => tier.name === 'Basic')?.credits || service.Tiers[0].credits
    : service.Credits || service.credits || 0;
  const location = service.Location || service.location || 'Online';
  const locationType = service.LocationType || service.locationType || 'Online';
  const availability = service.Availability || service.availability || [];
  const images = service.Images || [];

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="cursor-pointer hover:text-green-600">🏠</Link>
            <span>/</span>
            <Link href="/services" className="cursor-pointer hover:text-green-600">Services</Link>
            {category && (
              <>
                <span>/</span>
                <Link 
                  href={`/services/category/${category.toLowerCase().replace(/\s+/g, '-')}`} 
                  className="cursor-pointer hover:text-green-600"
                >
                  {category}
                </Link>
              </>
            )}
            {title && (
              <>
                <span>/</span>
                <span className="text-gray-900 font-medium truncate max-w-xs">{title}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Cover Image */}
            <div className="bg-white rounded-xl overflow-hidden">
              <div className="relative h-96">
                {images.length > 0 ? (
                  <Image
                    src={images[currentImageIndex] || images[0]}
                    alt={title || 'Service'}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-white text-lg">Service Image</span>
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

            {/* Service Title and Provider Info */}
            <div className="bg-white rounded-xl p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {title || 'Service Title'}
              </h1>
              
              {/* Service Details */}
              <div className="mb-6">
                {/* Service Details Grid */}
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
                          {availability[0].TimeFrom} - {availability[0].TimeTo}
                        </p>
                        <p className="text-xs text-gray-500">Available time</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              

            </div>

            {/* About the Service */}
            {service?.Description && (
              <div className="bg-white rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About the service</h2>
                <div className="prose max-w-none text-gray-700">
                  <p className="leading-relaxed">
                    {service.Description}
                  </p>
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="bg-white rounded-xl p-6">
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
                      {review.reviewer?.avatar ? (
                        <Image
                          src={review.reviewer.avatar}
                          alt={review.reviewer?.name || 'Reviewer'}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 text-sm font-medium">
                            {review.reviewer?.name?.charAt(0)?.toUpperCase() || 'A'}
                          </span>
                        </div>
                      )}
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
              {/* Tier Selection */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                {service?.Tiers && service.Tiers.length > 0 ? (
                  <>
                    <div className="flex space-x-1 mb-6">
                      {service.Tiers.map((tier) => (
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
                      const currentTier = service.Tiers.find(tier => tier.name === selectedTier);
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
                  <div className="text-center py-8">
                    <p className="text-gray-500">No pricing tiers available</p>
                  </div>
                )}

                {/* Debug Section */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Debug Info:</h4>
                    <div className="text-sm text-yellow-700 space-y-1">
                      <div>hasBooked: {hasBooked.toString()}</div>
                      <div>isOwnService: {isOwnService().toString()}</div>
                      <div>UserID: {user?.ID || user?.id || 'Not logged in'}</div>
                      <div>ServiceAuthorID: {service?.Author?.ID || service?.Author?.id || service?.author?.id || 'Unknown'}</div>
                      <div>ServiceID: {service?.ID || service?.id || 'Unknown'}</div>
                      <div>Token: {token ? 'Present' : 'Missing'}</div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 mt-6">
                  {isOwnService() ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">You are the service provider. You cannot book or contact yourself.</p>
                    </div>
                  ) : hasBooked ? (
                    <div className="text-center py-8">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-center mb-2">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                        </div>
                        <p className="text-green-700 font-medium">Already Booked</p>
                        <p className="text-green-600 text-sm mt-1">You have already booked this service</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={handleOrder}
                        className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                      >
                        {(() => {
                          const currentTier = service?.Tiers?.find(tier => tier.name === selectedTier);
                          if (currentTier) {
                            return (
                              <div className="flex flex-col items-center">
                                <span>Book {currentTier.name} Package</span>
                                <span className="text-sm opacity-90">{currentTier.credits} Credits</span>
                              </div>
                            );
                          }
                          return 'Book this service';
                        })()}
                      </button>

                    </>
                  )}
                </div>

                {/* Service Provider Info */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 mb-3">
                    {avatar ? (
                      <Image
                        src={avatar}
                        alt={serviceProvider}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-sm font-medium">
                          {serviceProvider?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900">About {serviceProvider}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <FaStar key={i} className={`w-3 h-3 ${i < Math.floor(service?.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <span className="text-xs text-gray-600">
                          {service?.rating || 0} ({service?.reviewCount || 0} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {serviceProvider} is a trusted provider with a proven track record of delivering quality services. 
                    They specialize in {service?.Category || service?.category || 'their field'} and are committed to 
                    ensuring customer satisfaction with every project.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      {!isOwnService() && (
        <div className="fixed bottom-6 right-6">
          <div 
            className="bg-white rounded-full shadow-lg p-4 cursor-pointer hover:shadow-xl transition-shadow"
            onClick={async () => {
              // Double-check: don't allow chat if it's own service
              if (isOwnService()) {
                console.log('Cannot chat with yourself - service owner');
                return;
              }
              
              if (token) {
                // Open chat box and fetch conversation history
                setIsChatBoxOpen(true);
                await fetchConversationHistory();
              } else {
                // Show login modal and remember user wants to chat
                setPendingAction('chat');
                setIsAuthModalOpen(true);
              }
            }}
          >
            <div className="flex items-center space-x-3">
              {avatar ? (
                <Image
                  src={avatar}
                  alt={serviceProvider}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">
                    {serviceProvider?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div className="text-sm">
                <p className="font-medium text-gray-900">Message {serviceProvider}</p>
                <p className="text-gray-500">Click to chat</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        service={service}
        selectedTier={selectedTier}
        onBookingSuccess={() => {
          // Update booking status instead of reloading
          setHasBooked(true);
          setIsBookingModalOpen(false);
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingAction(null);
        }}
        onAuthSuccess={() => {
          setIsAuthModalOpen(false);
          
          // Handle the pending action after successful login
          if (pendingAction === 'chat') {
            // Double-check: don't allow chat if it's own service
            if (isOwnService()) {
              console.log('Cannot chat with yourself after login - service owner');
              setPendingAction(null);
              return;
            }
            setIsChatBoxOpen(true);
            fetchConversationHistory();
          } else if (pendingAction === 'book') {
            setIsBookingModalOpen(true);
          }
          
          setPendingAction(null);
        }}
        defaultMode="login"
      />

      {/* Message Modal */}
      {isMessageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-lg p-8 min-w-[400px] max-w-[500px] w-full mx-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Send a message to {serviceProvider}</h3>
              <p className="text-sm text-gray-600 mt-1">Ask questions or discuss project details</p>
            </div>
            
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 min-h-[120px] resize-none"
              placeholder="Type your message here..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={sendingMessage}
            />
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIsMessageModalOpen(false);
                  setMessageText('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={sendingMessage}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!messageText.trim() || !token || !service) return;
                  
                  setSendingMessage(true);
                  try {
                    console.log('=== CONTACT ME MESSAGE DEBUG ===');
                    console.log('Service:', service);
                    console.log('Token:', token ? 'Present' : 'Missing');
                    console.log('Message:', messageText.trim());

                    // Get current user profile
                    const profileRes = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8080'}/api/auth/profile`, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    
                    if (!profileRes.ok) {
                      throw new Error("Failed to fetch user profile");
                    }
                    
                    const profileData = await profileRes.json();
                    console.log('Profile data:', profileData);
                    
                    const currentUserId = profileData.ID || profileData.id;
                    const currentUserEmail = (profileData as any).email || (profileData as any).Email;
                    
                    console.log('Current user ID:', currentUserId);
                    console.log('Current user email:', currentUserEmail);
                    
                    if (!currentUserId) {
                      throw new Error("User ID not found");
                    }

                    // Get service provider email - we need to fetch the provider's profile
                    const serviceProviderId = service.Author?.ID || service.Author?.id || service.author?.id;
                    console.log('Service provider ID:', serviceProviderId);
                    console.log('Service Author:', service.Author);
                    console.log('Service author:', service.author);
                    
                    if (!serviceProviderId) {
                      throw new Error("Service provider ID not found");
                    }

                    // Fetch service provider's profile to get their email
                    const providerProfileRes = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8080'}/api/auth/user/${serviceProviderId}`, {
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    
                    if (!providerProfileRes.ok) {
                      throw new Error("Failed to fetch service provider profile");
                    }
                    
                    const providerProfileData = await providerProfileRes.json();
                    const serviceProviderEmail = (providerProfileData as any).email || (providerProfileData as any).Email;
                    console.log('Service provider email:', serviceProviderEmail);
                    
                    if (!serviceProviderEmail) {
                      throw new Error("Service provider email not found");
                    }

                    // 1. Create/find conversation
                    const conversationRes = await fetch(`${process.env.NEXT_PUBLIC_MESSAGING_API_URL || 'http://localhost:8085'}/api/conversations`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        type: "direct",
                        name: `Service: ${service.Title || service.title}`,
                        avatar: service.Author?.Avatar || service.author?.avatar || "",
                        participants: [currentUserEmail, serviceProviderEmail].sort(),
                        taskId: service.ID || service.id
                      })
                    });

                    if (!conversationRes.ok) {
                      throw new Error("Failed to create conversation");
                    }

                    const conversationData = await conversationRes.json();
                    const conversationId = conversationData.$oid || conversationData;

                    // 2. Send message
                    const messageRes = await fetch(`${process.env.NEXT_PUBLIC_MESSAGING_API_URL || 'http://localhost:8085'}/api/conversations/${conversationId}/messages`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        content: messageText.trim(),
                        senderId: currentUserEmail,
                        senderName: profileData.name || profileData.Name || "User",
                        senderAvatar: profileData.avatar || profileData.Avatar || "",
                        type: "text"
                      })
                    });

                    if (!messageRes.ok) {
                      throw new Error("Failed to send message");
                    }

                    // Close modal and clear message
                    setIsMessageModalOpen(false);
                    setMessageText('');
                    
                  } catch (error) {
                    console.error('Error sending message:', error);
                    // Don't show alert, just log the error
                  } finally {
                    setSendingMessage(false);
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                disabled={sendingMessage || !messageText.trim()}
              >
                {sendingMessage ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Box */}
      {isChatBoxOpen && !isOwnService() && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-80 h-96 flex flex-col overflow-hidden">
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt={serviceProvider}
                    width={36}
                    height={36}
                    className="rounded-full border-2 border-white"
                  />
                ) : (
                  <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-white text-sm font-medium">
                      {serviceProvider?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-white text-sm">{serviceProvider}</h4>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                    <p className="text-green-100 text-xs">Available now</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsChatBoxOpen(false)}
                className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50" id="chat-messages">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FaEnvelope className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="font-medium text-gray-700 mb-1">Start a conversation</p>
                  <p className="text-sm">Ask {serviceProvider} about their service</p>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-3 rounded-2xl text-sm shadow-sm ${
                        message.sender === 'user'
                          ? 'bg-green-500 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <p className="leading-relaxed">{message.message}</p>
                      <p className={`text-xs mt-2 ${
                        message.sender === 'user' ? 'text-green-100' : 'text-gray-400'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newMessage.trim()) {
                      handleSendChatMessage();
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  disabled={sendingChatMessage}
                />
                <button
                  onClick={handleSendChatMessage}
                  disabled={!newMessage.trim() || sendingChatMessage}
                  className="bg-green-500 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[60px]"
                >
                  {sendingChatMessage ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Send'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
} 
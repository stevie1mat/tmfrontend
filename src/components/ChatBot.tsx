"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaPaperPlane, FaExpand, FaCompress, FaWindowMinimize, FaTimes, FaBrain, FaRobot, FaUser, FaCoins, FaStar, FaClock } from "react-icons/fa";
import { BiBrain } from "react-icons/bi";
import ServiceCard from "./ServiceCard";

// Hook to fetch task images for multiple tasks
const useTaskImages = (taskIds: string[]) => {
  const [images, setImages] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [cachedIds, setCachedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!taskIds.length) return;

    // Only fetch uncached task IDs
    const uncachedIds = taskIds.filter(id => !cachedIds.has(id));
    if (!uncachedIds.length) return;

    const fetchImages = async () => {
      setLoading(true);
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || "http://localhost:8084";
        const response = await fetch(`${API_BASE_URL}/api/tasks/images/batch?taskIds=${uncachedIds.join(',')}&quality=70&width=600`);
        
        if (response.ok) {
          const data = await response.json();
          setImages(prev => ({ ...prev, ...data.images }));
          setCachedIds(prev => new Set([...prev, ...uncachedIds]));
        }
      } catch (error) {
        console.error('Error fetching task images:', error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the fetch to avoid multiple rapid requests
    const timeoutId = setTimeout(fetchImages, 300);
    return () => clearTimeout(timeoutId);
  }, [taskIds.join(','), cachedIds]);

  return { images, loading };
};

interface Task {
  id?: string;
  ID?: string;
  _id?: string;
  Title: string;
  Description: string;
  Category?: string;
  Author?: {
    Name: string;
  };
  Credits?: number;
  Images?: string[];
  images?: string[];
  ImageCount?: number;
}

interface UserMessage {
  sender: "user";
  text: string;
  timestamp: Date;
}

interface AgentMessage {
  sender: "agent";
  text: string;
  tasks?: Task[];
  timestamp: Date;
}

type Message = UserMessage | AgentMessage;

interface ChatBotProps {
  userSkills: string[];
}

// Helper to map agentic task to ServiceCard's Service type
function mapTaskToService(task: any): any {
  return {
    id: task.id || task.ID || Math.random(),
    title: task.Title || task.title || "Untitled",
    description: task.Description || task.description || "",
    provider: task.Author?.Name || task.author?.name || "Unknown",
    price: task.Credits || task.credits || 0,
    rating: task.rating || task.Rating || 0,
    imageUrl: (task.Images && task.Images[0]) || (task.images && task.images[0]) || "/default-task.jpg",
  };
}

export default function ChatBot({ userSkills }: ChatBotProps) {
  const router = useRouter();
  
  // Load messages from localStorage or use default welcome message
  const loadMessagesFromStorage = (): Message[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem('trademinutes-chat-messages');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading chat messages from localStorage:', error);
    }
    
    return [
      { 
        sender: "agent", 
        text: "Hi! I'm TradeMate, your AI companion. How can I help you today?", 
        timestamp: new Date() 
      }
    ];
  };

  const [messages, setMessages] = useState<Message[]>(loadMessagesFromStorage);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isModal, setIsModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Collect all task IDs from messages for batch image fetching
  const allTaskIds = messages
    .filter((msg): msg is AgentMessage => msg.sender === "agent" && "tasks" in msg && msg.tasks !== undefined)
    .flatMap(msg => msg.tasks!)
    .map(task => task.ID || task.id)
    .filter(Boolean) as string[];

  // Fetch images for all tasks
  const { images: taskImages, loading: imagesLoading } = useTaskImages(allTaskIds);

  // Save messages to localStorage
  const saveMessagesToStorage = (newMessages: Message[]) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('trademinutes-chat-messages', JSON.stringify(newMessages));
    } catch (error) {
      console.error('Error saving chat messages to localStorage:', error);
    }
  };

  // Update messages and save to localStorage
  const updateMessages = (updater: (prev: Message[]) => Message[]) => {
    setMessages(prev => {
      const newMessages = updater(prev);
      saveMessagesToStorage(newMessages);
      return newMessages;
    });
  };

  // Clear chat history
  const clearChat = () => {
    const welcomeMessage: Message = {
      sender: "agent",
      text: "Hi! I'm TradeMate, your AI companion. How can I help you today?",
      timestamp: new Date()
    };
    updateMessages(() => [welcomeMessage]);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend) return;

    const userMessage: UserMessage = { 
      sender: "user", 
      text: textToSend, 
      timestamp: new Date() 
    };
    updateMessages(msgs => [...msgs, userMessage]);
    setInput("");
    setLoading(true);

    // Check if this is a navigation query first
    const isNavigationQuery = checkIfNavigationQuery(textToSend);
    
    if (isNavigationQuery) {
      // Skip AI response for navigation querie
      setLoading(false);
      handleNavigation(textToSend);
      return;
    }

    try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://tmagenticai.onrender.com';
    const res = await fetch(`${API_BASE_URL}/api/agentic-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend, userSkills })
    });
    const data = await res.json();

      const agentMessage: AgentMessage = { 
        sender: "agent", 
        text: data.reply, 
        tasks: data.tasks,
        timestamp: new Date() 
      };
    updateMessages(msgs => [...msgs, agentMessage]);
    
    } catch (error) {
      const errorMessage: AgentMessage = { 
        sender: "agent", 
        text: "Sorry, I'm having trouble connecting right now. Please try again in a moment.", 
        timestamp: new Date() 
      };
      updateMessages(msgs => [...msgs, errorMessage]);
    } finally {
    setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const suggestedQuestions = [
    "What services are available?",
    "How do I earn time credits?",
    "How does TradeMinutes work?",
    "Take me to services",
    "Show me AI agents",
    "Browse users"
  ];

  const checkIfNavigationQuery = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    return (
      lowerMessage.includes('services') || 
      lowerMessage.includes('browse services') ||
      lowerMessage.includes('ai agents') || 
      lowerMessage.includes('ai agent') ||
      lowerMessage.includes('users') || 
      lowerMessage.includes('browse users') ||
      lowerMessage.includes('about') ||
      lowerMessage.includes('contact') ||
      lowerMessage.includes('login') || 
      lowerMessage.includes('sign in') ||
      lowerMessage.includes('register') || 
      lowerMessage.includes('registration') ||
      lowerMessage.includes('sign up') ||
      lowerMessage.includes('forgot password') ||
      lowerMessage.includes('reset password') ||
      lowerMessage.includes('product') ||
      lowerMessage.includes('seller') ||
      lowerMessage.includes('home') ||
      lowerMessage.includes('main page') ||
      lowerMessage.includes('take me to') ||
      lowerMessage.includes('navigate to') ||
      lowerMessage.includes('go to')
    );
  };

  const handleNavigation = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    // Check for navigation commands and provide specific responses
    if (lowerMessage.includes('services') || lowerMessage.includes('browse services')) {
      // Add a navigation response message
      const navigationMessage: AgentMessage = {
        sender: "agent",
        text: "Yes, navigating to /services/all",
        timestamp: new Date()
      };
      updateMessages(msgs => [...msgs, navigationMessage]);
      
      setTimeout(() => {
        router.push('/services/all');
      }, 2000); // 2 second delay
    } else if (lowerMessage.includes('ai agents') || lowerMessage.includes('ai agent')) {
      const navigationMessage: AgentMessage = {
        sender: "agent",
        text: "Yes, navigating to /ai-agents",
        timestamp: new Date()
      };
      updateMessages(msgs => [...msgs, navigationMessage]);
      
      setTimeout(() => {
        router.push('/ai-agents');
      }, 2000);
    } else if (lowerMessage.includes('users') || lowerMessage.includes('browse users')) {
      const navigationMessage: AgentMessage = {
        sender: "agent",
        text: "Yes, navigating to /users/top",
        timestamp: new Date()
      };
      updateMessages(msgs => [...msgs, navigationMessage]);
      
      setTimeout(() => {
        router.push('/users/top');
      }, 2000);
    } else if (lowerMessage.includes('about')) {
      const navigationMessage: AgentMessage = {
        sender: "agent",
        text: "Yes, navigating to /about",
        timestamp: new Date()
      };
      updateMessages(msgs => [...msgs, navigationMessage]);
      
      setTimeout(() => {
        router.push('/about');
      }, 2000);
    } else if (lowerMessage.includes('contact')) {
      const navigationMessage: AgentMessage = {
        sender: "agent",
        text: "Yes, navigating to /contact",
        timestamp: new Date()
      };
      updateMessages(msgs => [...msgs, navigationMessage]);
      
      setTimeout(() => {
        router.push('/contact');
      }, 2000);
    } else if (lowerMessage.includes('login') || lowerMessage.includes('sign in')) {
      const navigationMessage: AgentMessage = {
        sender: "agent",
        text: "Yes, navigating to /login",
        timestamp: new Date()
      };
      updateMessages(msgs => [...msgs, navigationMessage]);
      
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } else if (lowerMessage.includes('register') || lowerMessage.includes('registration') || lowerMessage.includes('sign up')) {
      const navigationMessage: AgentMessage = {
        sender: "agent",
        text: "Yes, navigating to /register",
        timestamp: new Date()
      };
      updateMessages(msgs => [...msgs, navigationMessage]);
      
      setTimeout(() => {
        router.push('/register');
      }, 2000);
    } else if (lowerMessage.includes('forgot password') || lowerMessage.includes('reset password')) {
      const navigationMessage: AgentMessage = {
        sender: "agent",
        text: "Yes, navigating to /forgot-password",
        timestamp: new Date()
      };
      updateMessages(msgs => [...msgs, navigationMessage]);
      
      setTimeout(() => {
        router.push('/forgot-password');
      }, 2000);
    } else if (lowerMessage.includes('product')) {
      const navigationMessage: AgentMessage = {
        sender: "agent",
        text: "Yes, navigating to /product",
        timestamp: new Date()
      };
      updateMessages(msgs => [...msgs, navigationMessage]);
      
      setTimeout(() => {
        router.push('/product');
      }, 2000);
    } else if (lowerMessage.includes('seller')) {
      const navigationMessage: AgentMessage = {
        sender: "agent",
        text: "Yes, navigating to /seller",
        timestamp: new Date()
      };
      updateMessages(msgs => [...msgs, navigationMessage]);
      
      setTimeout(() => {
        router.push('/seller');
      }, 2000);
    } else if (lowerMessage.includes('home') || lowerMessage.includes('main page')) {
      const navigationMessage: AgentMessage = {
        sender: "agent",
        text: "Yes, navigating to /",
        timestamp: new Date()
      };
      updateMessages(msgs => [...msgs, navigationMessage]);
      
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }
  };

  // Chat UI
  const chatUI = (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center">
            <FaBrain className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-xs sm:text-sm">TradeMate</h3>
            <p className="text-xs text-white/80">Your AI companion</p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
        <button 
          onClick={() => setIsModal(!isModal)} 
            className="p-1.5 sm:p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          aria-label="Toggle size"
        >
          {isModal ? (
              <FaCompress className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          ) : (
              <FaExpand className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          )}
        </button>
        <button 
          onClick={() => setIsOpen(false)} 
            className="p-1.5 sm:p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          aria-label="Close"
        >
            <FaTimes className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        </button>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50">
        {messages.length === 1 && messages[0].sender === "agent" ? (
          // Welcome state
          <div className="flex flex-col items-center justify-center h-full space-y-4 sm:space-y-6 text-center px-2">
            {/* Welcome Icon */}
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
              <FaBrain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">Welcome to TradeMinutes!</h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">Ask me anything about services, credits, or how to get started.</p>
            </div>
            
            {/* Quick Actions */}
            <div className="w-full max-w-sm space-y-2 sm:space-y-3">
              {/* Normal Query */}
              <button
                onClick={() => sendMessage("What services are available?")}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 hover:bg-gray-50 hover:border-emerald-300 transition-all duration-200 text-left shadow-sm"
              >
                What services are available?
              </button>
              
              {/* Navigation Queries Side by Side */}
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => sendMessage("Take me to services")}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 hover:bg-gray-50 hover:border-emerald-300 transition-all duration-200 text-left shadow-sm"
                >
                  Browse Services
                </button>
                <button
                  onClick={() => sendMessage("Show me AI agents")}
                  className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 hover:bg-gray-50 hover:border-emerald-300 transition-all duration-200 text-left shadow-sm"
                >
                  AI Agents
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Chat messages
          <>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`${msg.sender === "user" ? "max-w-[85%]" : msg.tasks && msg.tasks.length > 0 ? "max-w-[98%]" : "max-w-[85%]"} ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  {/* Message Bubble */}
                  <div className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl shadow-sm ${
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                      : "bg-white text-gray-800 border border-gray-200"
                  }`}>
                    <p className="text-xs sm:text-sm whitespace-pre-line">{msg.text}</p>
                    
                    {/* Tasks/Services */}
                  {msg.sender === "agent" && msg.tasks && msg.tasks.length > 0 && (
                    <div className="mt-2 sm:mt-3 space-y-2 sm:space-y-3 w-full min-w-full">
                        {msg.tasks.map((task: Task, taskIdx: number) => {
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
                          
                          // Get images for this specific task
                          const taskId = task.ID || task.id || '';
                          const fetchedImages = taskImages[taskId] || [];
                          
                          // Use task's own images first, then fallback to fetched images
                          const imageUrls = (task.Images && Array.isArray(task.Images) ? task.Images : []) || 
                                          (task.images && Array.isArray(task.images) ? task.images : []) ||
                                          fetchedImages;
                          
                          return (
                            <div key={taskIdx} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1 w-full min-w-full" 
                                 onClick={() => window.open(`/services/view/${task.id || task.ID || task._id || taskIdx}`, '_blank')}>
                              <div className="p-2 sm:p-3">
                                <div className="flex items-center justify-between mb-1 sm:mb-2">
                                  <span className={`inline-block px-1.5 sm:px-2 py-0.5 sm:py-1 ${colors[taskIdx % colors.length].bg} ${colors[taskIdx % colors.length].text} text-xs font-semibold rounded`}>
                                    {task.Category || 'SERVICE'}
                                  </span>
                                  <div className="flex items-center gap-1 text-xs sm:text-sm font-bold text-green-600">
                                    <FaCoins className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                    <span>{task.Credits || 0}</span>
                                  </div>
                                </div>
                                <h4 className="font-semibold text-gray-900 mb-1 text-xs sm:text-sm">
                                  {task.Title}
                                </h4>
                                
                                {/* Description */}
                                {task.Description && (
                                  <div className="mb-1 sm:mb-2">
                                    <p className="text-xs text-gray-600 line-clamp-2">
                                      {task.Description}
                                    </p>
                                  </div>
                                )}
                                
                                {/* Author */}
                                <div className="flex items-center gap-1 sm:gap-2 text-xs text-gray-500">
                                  <span>By {task.Author?.Name || 'Unknown'}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-white text-gray-800 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-600">thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="p-3 sm:p-4 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2 sm:gap-3">
        <input
            ref={inputRef}
            className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-xs sm:text-sm"
          value={input}
          onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Type your message..."
          disabled={loading}
        />
        <button
            className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
            onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
            aria-label="Send message"
        >
            <FaPaperPlane className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); setIsModal(false); }}
          className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
          aria-label="Open chat"
        >
          <FaBrain className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform duration-200" />
        </button>
      )}
      
      {isOpen && mounted && (
        <div
          className={`${
            isModal 
              ? "fixed inset-2 sm:inset-4 md:inset-8 lg:inset-32 max-h-[100vh]" 
              : "fixed bottom-4 sm:bottom-6 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] h-[calc(100vh-8rem)] sm:h-[650px] max-w-[420px]"
          } transition-all duration-300 ease-in-out`}
        >
          {chatUI}
        </div>
      )}
    </div>
  );
} 
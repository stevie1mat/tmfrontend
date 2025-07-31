"use client";

import React, { useState, useEffect, useRef } from "react";
import ProtectedLayout from "@/components/Layout/ProtectedLayout";
import { FiSearch, FiPlus, FiSend, FiVideo, FiPhone, FiX } from "react-icons/fi";

interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  type: string;
  timestamp: number;
  isMe?: boolean;
  typing?: boolean;
}

interface Conversation {
  id: string;
  type: string;
  name: string;
  avatar: string;
  participants: string[];
  lastMessage?: Message;
  createdAt: number;
  updatedAt: number;
}

export default function MessagesPage() {
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);
  const [callerInfo, setCallerInfo] = useState<any>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [callNotification, setCallNotification] = useState<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Get current user info
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Token found:", !!token);
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log("Token payload:", payload);
        const user = {
          id: payload.id,
          name: payload.name || (payload.email ? payload.email.split('@')[0] : undefined),
          email: payload.email
        };
        console.log("Setting current user:", user);
        setCurrentUser(user);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    } else {
      console.log("No token found in localStorage");
    }
  }, []);

  // Setup call notification sound and request permissions
  useEffect(() => {
    const audio = new Audio('/notification.mp3'); // You can add a notification sound file
    audio.volume = 0.5;
    setCallNotification(audio);
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Connect to WebSocket
  useEffect(() => {
    if (!currentUser?.email) return;

    const wsUrl = `${process.env.NEXT_PUBLIC_MESSAGING_WS_URL || 'ws://localhost:8085'}/ws?userId=${currentUser.email}`;
    console.log("Connecting to WebSocket:", wsUrl);
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log("WebSocket connected successfully");
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket message received:", data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    websocket.onclose = (event) => {
      console.log("WebSocket disconnected:", event.code, event.reason);
      setWs(null);
      // Try to reconnect after 3 seconds
      setTimeout(() => {
        if (currentUser?.email) {
          console.log("Attempting to reconnect WebSocket...");
        }
      }, 3000);
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      console.log("Cleaning up WebSocket connection");
      websocket.close();
    };
  }, [currentUser?.email]);

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUser?.email) return;
      
      try {
        console.log("Fetching conversations for user:", currentUser.email);
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_MESSAGING_API_URL || 'http://localhost:8085'}/api/conversations?userId=${currentUser.email}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log("Conversations response status:", response.status);
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched conversations:", data);
          const conversationsData = Array.isArray(data) ? data : [];
          setConversations(conversationsData);
          setFilteredConversations(conversationsData);
        } else {
          console.error("Failed to fetch conversations:", response.status, response.statusText);
          // If messaging service is not available, show empty state
          setConversations([]);
          setFilteredConversations([]);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [currentUser?.email]);

  // Fetch messages when conversation is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConv || !currentUser?.email) return;
      
      try {
        console.log("Fetching messages for conversation:", selectedConv);
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_MESSAGING_API_URL || 'http://localhost:8085'}/api/conversations/${selectedConv}/messages`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log("Messages response status:", response.status);
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched messages:", data);
          setMessages(Array.isArray(data) ? data.map((msg: any) => ({
            ...msg,
            isMe: msg.senderId === currentUser.email
          })) : []);
        } else {
          console.error("Failed to fetch messages:", response.status, response.statusText);
          // If messages endpoint fails, show empty messages
          setMessages([]);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [selectedConv, currentUser?.email]);

  // Auto-scroll to bottom when new messages arrive (but not after sending)
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      // Only auto-scroll if it's not the user's own message (to prevent scrolling after sending)
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage?.isMe) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  const handleWebSocketMessage = (data: any) => {
    console.log("Processing WebSocket message:", data);
    
    switch (data.type) {
      case "message":
        console.log("Received message:", data);
        if (data.roomId === selectedConv || data.message?.roomId === selectedConv) {
          const message = data.message || data;
          const newMessage = {
            ...message,
            isMe: message.senderId === currentUser?.email
          };
          console.log("Adding message to chat:", newMessage);
          setMessages(prev => [...prev, newMessage]);
          
          // Remove sender from typingUsers when a message is received
          setTypingUsers(prev => prev.filter(user => user !== message.senderName));
        }
        break;
      
      case "typing":
        console.log("Received typing indicator:", data);
        if (data.roomId === selectedConv) {
          if (data.isTyping) {
            setTypingUsers(prev => prev.includes(data.userName) ? prev : [...prev, data.userName]);
          } else {
            setTypingUsers(prev => prev.filter(user => user !== data.userName));
          }
        }
        break;

      case "video-call-offer":
        if (data.roomId === selectedConv) {
          setCallerInfo({ name: data.callerName, offer: data.offer });
          setIsIncomingCall(true);
          
          // Play notification sound
          if (callNotification) {
            callNotification.play().catch(err => console.log('Could not play notification sound:', err));
          }
          
          // Show browser notification if supported
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Incoming Video Call', {
              body: `${data.callerName} is calling you`,
              icon: '/favicon.ico'
            });
          }
        }
        break;

      case "video-call-answer":
        if (data.roomId === selectedConv && peerConnection) {
          peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
        break;

      case "ice-candidate":
        if (data.roomId === selectedConv && peerConnection) {
          peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
        break;

      case "video-call-end":
      case "video-call-reject":
        if (data.roomId === selectedConv) {
          endVideoCall();
        }
        break;

      default:
        console.log("Unknown message type:", data.type);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedConv || !ws || !currentUser) {
      console.log("Send aborted:", { input: !!input.trim(), selectedConv, ws: !!ws, currentUser: !!currentUser });
      return;
    }
    
    const messageData = {
      type: "message",
      roomId: selectedConv,
      senderId: currentUser.email,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
      content: input,
      timestamp: Math.floor(Date.now() / 1000)
    };
    
    console.log("Sending message:", messageData);
    ws.send(JSON.stringify(messageData));

    // Optimistic UI update
    const optimisticMsg = {
      id: Date.now().toString(),
      roomId: selectedConv,
      senderId: currentUser.email,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
      content: input,
      type: "text",
      timestamp: Math.floor(Date.now() / 1000),
      isMe: true
    };
    setMessages(prev => [...prev, optimisticMsg]);

    setInput("");
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    
    if (!ws || !selectedConv || !currentUser) return;

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Send typing indicator
    const typingData = {
      type: "typing",
      roomId: selectedConv,
      userName: currentUser.name,
      isTyping: e.target.value.length > 0
    };

    console.log("Sending typing indicator:", typingData);
    ws.send(JSON.stringify(typingData));

    // Set timeout to stop typing indicator after 2 seconds
    if (e.target.value.length > 0) {
      const timeout = setTimeout(() => {
        const stopTypingData = {
          type: "typing",
          roomId: selectedConv,
          userName: currentUser.name,
          isTyping: false
        };
        console.log("Sending stop typing indicator:", stopTypingData);
        ws.send(JSON.stringify(stopTypingData));
      }, 2000);
      setTypingTimeout(timeout);
    }
  };

  const createNewConversation = async () => {
    if (!currentUser?.email) return;

    const newConversation = {
      type: "direct",
      name: "New Chat",
      avatar: "https://static.vecteezy.com/system/resources/thumbnails/027/951/137/small_2x/stylish-spectacles-guy-3d-avatar-character-illustrations-png.png",
      participants: [currentUser.email]
    };

          try {
        console.log("Creating new conversation:", newConversation);
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_MESSAGING_API_URL || 'http://localhost:8085'}/api/conversations`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(newConversation)
          }
        );

      console.log("Create conversation response status:", response.status);
      if (response.ok) {
        const conversationId = await response.text();
        console.log("Created conversation ID:", conversationId);
        // Refresh conversations
        const convResponse = await fetch(
          `${process.env.NEXT_PUBLIC_MESSAGING_API_URL || 'http://localhost:8085'}/api/conversations?userId=${currentUser.email}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        if (convResponse.ok) {
          const data = await convResponse.json();
          const conversationsData = Array.isArray(data) ? data : [];
          setConversations(conversationsData);
          setFilteredConversations(conversationsData);
        }
      } else {
        console.error("Failed to create conversation:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const selectedConversation = conversations.find(conv => {
    const convId = typeof conv.id === 'string' ? conv.id : 
                  (conv.id && typeof conv.id === 'object' && 'oid' in conv.id) ? (conv.id as any).oid :
                  (conv.id && typeof conv.id === 'object' && '$oid' in conv.id) ? (conv.id as any).$oid :
                  String(conv.id || '');
    return convId === selectedConv;
  });

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  // Search conversations
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredConversations(conversations);
      return;
    }
    
    const filtered = conversations.filter(conv => 
      conv.name.toLowerCase().includes(query.toLowerCase()) ||
      (conv.lastMessage?.content && conv.lastMessage.content.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredConversations(filtered);
  };

  // WebRTC Video Call Functions
  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && ws) {
        ws.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate,
          roomId: selectedConv
        }));
      }
    };

    setPeerConnection(pc);
    return pc;
  };

  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection();
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Send call offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      if (ws) {
        ws.send(JSON.stringify({
          type: 'video-call-offer',
          offer: offer,
          roomId: selectedConv,
          callerName: currentUser.name
        }));
      }

      setIsVideoCallActive(true);
    } catch (error) {
      console.error('Error starting video call:', error);
      alert('Could not access camera/microphone. Please check permissions.');
    }
  };

  const acceptVideoCall = async (offer: RTCSessionDescriptionInit) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection();
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (ws) {
        ws.send(JSON.stringify({
          type: 'video-call-answer',
          answer: answer,
          roomId: selectedConv
        }));
      }

      setIsVideoCallActive(true);
      setIsIncomingCall(false);
    } catch (error) {
      console.error('Error accepting video call:', error);
    }
  };

  const endVideoCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }
    setRemoteStream(null);
    setIsVideoCallActive(false);
    setIsIncomingCall(false);
    setCallerInfo(null);

    if (ws) {
      ws.send(JSON.stringify({
        type: 'video-call-end',
        roomId: selectedConv
      }));
    }
  };

  const rejectVideoCall = () => {
    setIsIncomingCall(false);
    setCallerInfo(null);
    
    if (ws) {
      ws.send(JSON.stringify({
        type: 'video-call-reject',
        roomId: selectedConv
      }));
    }
  };

  return (
    <ProtectedLayout>
      <div className="flex h-[calc(100vh-80px)] bg-gray-50 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <button 
                className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
                onClick={createNewConversation}
              >
                <FiPlus />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-500 mb-3">Conversations</h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? (
                    <p className="text-sm">No conversations found for "{searchQuery}"</p>
                  ) : (
                    <>
                      <p className="text-sm">No conversations yet</p>
                      <button 
                        className="mt-2 text-blue-500 hover:text-blue-600 text-sm"
                        onClick={createNewConversation}
                      >
                        Start a new conversation
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredConversations.map((conv) => {
                    const convId = typeof conv.id === 'string' ? conv.id : 
                                  (conv.id && typeof conv.id === 'object' && 'oid' in conv.id) ? (conv.id as any).oid :
                                  (conv.id && typeof conv.id === 'object' && '$oid' in conv.id) ? (conv.id as any).$oid :
                                  String(conv.id || '');
                    
                    return (
                      <div
                        key={convId}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedConv === convId ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedConv(convId)}
                      >
                        <img
                          src={conv.avatar?.trim() ? conv.avatar : "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                          className="w-10 h-10 rounded-full object-cover"
                          alt={conv.name}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{conv.name}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {conv.lastMessage ? conv.lastMessage.content : "No messages yet"}
                          </div>
                        </div>
                        {conv.lastMessage && (
                          <div className="text-xs text-gray-400">
                            {formatTime(conv.lastMessage.timestamp)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main chat area */}
        <main className="flex-1 flex flex-col bg-white">
          {selectedConversation ? (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-white flex-shrink-0">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedConversation?.avatar?.trim() ? selectedConversation.avatar : "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                    className="w-10 h-10 rounded-full object-cover"
                    alt={selectedConversation?.name}
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{selectedConversation.name}</div>
                    <div className="text-xs text-gray-500">
                      {selectedConversation.participants.length} members • 
                      {selectedConversation.participants.map((participant, index) => (
                        <span key={participant}>
                          {participant === currentUser?.email ? 'You' : participant.split('@')[0]}
                          {index < selectedConversation.participants.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                    onClick={startVideoCall}
                    disabled={isVideoCallActive}
                  >
                    <FiVideo className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-6 py-2 space-y-4 min-h-0"
              >
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}>
                    <div className="flex items-end gap-2 max-w-xs lg:max-w-md">
                      {!msg.isMe && (
                        <img
                          src={msg.senderAvatar?.trim() ? msg.senderAvatar : "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                          className="w-8 h-8 rounded-full object-cover"
                          alt={msg.senderName}
                        />
                      )}
                      <div className={`px-4 py-2 rounded-2xl text-sm ${
                        msg.isMe 
                          ? "bg-blue-500 text-white" 
                          : "bg-gray-100 text-gray-900"
                      }`}>
                        {!msg.isMe && (
                          <div className={`text-xs font-medium mb-1 ${
                            msg.isMe ? "text-blue-100" : "text-gray-600"
                          }`}>
                            {msg.senderName}
                          </div>
                        )}
                        <div>{msg.content}</div>
                        <div className={`text-xs mt-1 ${
                          msg.isMe ? "text-blue-100" : "text-gray-500"
                        }`}>
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                      {msg.isMe && (
                        <img
                          src={msg.senderAvatar?.trim() ? msg.senderAvatar : "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                          className="w-8 h-8 rounded-full object-cover"
                          alt={msg.senderName}
                        />
                      )}
                    </div>
                  </div>
                ))}
                
                {typingUsers.length > 0 && (
                  <div className="flex justify-start">
                    <div className="flex items-end gap-2 max-w-xs lg:max-w-md">
                      <img
                        src={selectedConversation?.avatar?.trim() ? selectedConversation.avatar : "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                        className="w-8 h-8 rounded-full object-cover"
                        alt="Typing"
                      />
                      <div className="px-4 py-2 rounded-2xl text-sm bg-gray-100 text-gray-500 italic">
                        {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input box */}
              <form 
                className="flex items-center gap-3 px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0" 
                onSubmit={handleSend}
              >
                <input
                  className="flex-1 border border-gray-200 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  placeholder="Type a message..."
                  value={input}
                  onChange={handleTyping}
                />
                <button 
                  className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 transition flex items-center gap-2" 
                  type="submit"
                  disabled={!input.trim()}
                >
                  <FiSend className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 text-lg mb-2">Select a conversation</div>
                <div className="text-gray-300 text-sm">Choose from the conversations on the left to start messaging</div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Video Call Interface */}
      {isVideoCallActive && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative w-full h-full max-w-4xl max-h-[80vh] bg-gray-900 rounded-lg overflow-hidden">
            {/* Remote Video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Local Video */}
            <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>

            {/* Call Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
              <button
                onClick={endVideoCall}
                className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Call Modal */}
      {isIncomingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiVideo className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Incoming Video Call
              </h3>
              <p className="text-gray-600 mb-6">
                {callerInfo?.name || 'Unknown'} is calling...
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => acceptVideoCall(callerInfo?.offer)}
                  className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={rejectVideoCall}
                  className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
} 
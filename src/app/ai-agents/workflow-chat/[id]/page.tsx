"use client";
import React, { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ProtectedLayout from '@/components/Layout/ProtectedLayout';
import PublicChatLayout from '@/components/Layout/PublicChatLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from "react";
import { FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const suggestions = [
  {
    title: "How's my campaign?",
    desc: "Get a quick overview of your campaign's performance, including reach, engagement, and ROI.",
    action: "View Report",
  },
  {
    title: "Any spend issues?",
    desc: "Identify sudden spikes or dips in ad spend and get suggestions to optimize your budget.",
    action: "Analyze Budget",
  },
  {
    title: "Which ads work best?",
    desc: "See the top-performing ads based on clicks, conversions, and engagement to refine your strategy.",
    action: "View Insights",
  },
];

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export default function WorkflowChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const { user, loading } = useAuth();
  const userName = user?.Name || user?.name || 'User';
  const userId = user?.ID || user?.id;
  
  // Determine if this is a public marketplace chat
  const isPublicMarketplace = searchParams.get('public') === 'true';
  const [input, setInput] = useState("");
  
  // Determine greeting based on local time
  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }
  const greeting = getGreeting();

  // Workflow details
  const [workflow, setWorkflow] = useState<any>(null);
  const [workflowLoading, setWorkflowLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setWorkflowLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_AGENTIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8002'}/api/workflows/${id}`)
      .then(res => res.json())
      .then(data => {
        setWorkflow(data);
        setWorkflowLoading(false);
      })
      .catch(() => setWorkflowLoading(false));
  }, [id]);

  // Find first non-empty description in nodes
  const agentDescription = workflow?.nodes?.map((n: any) => n.data?.description).find((desc: string) => desc && desc.trim()) || '';

  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always start with a greeting on page load
  useEffect(() => {
    setChat(chat => chat.length === 0
      ? [{ role: "system", content: `${getGreeting()}, ${userName}\nHey there! What can I do for you today?` }]
      : chat
    );
    // eslint-disable-next-line
  }, []); // Only run on mount

  // New Chat button handler
  function handleNewChat() {
    const hour = new Date().getHours();
    let greeting = 'Good Morning';
    if (hour >= 12 && hour < 18) greeting = 'Good Afternoon';
    else if (hour >= 18) greeting = 'Good Evening';
    setChat([{ role: "system", content: `${greeting}, ${userName}\nHey there! What can I do for you today?` }]);
  }

  // Hide greeting after first user message
  const showGreeting = !chat.some((m: ChatMessage) => m.role === 'user');

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [savedChats, setSavedChats] = useState<any[]>([]);
  const [sidebarDebug, setSidebarDebug] = useState<string[]>([]);
  
  // Fetch all workflows with chat history for this user
  useEffect(() => {
    const debugLines: string[] = [];
    debugLines.push(`Sidebar useEffect userId: ${userId}, loading: ${loading}`);
    if (loading) { setSidebarDebug(debugLines); return; }
    if (!userId) { setSidebarDebug([...debugLines, 'No userId']); return; }
    
    debugLines.push('Fetching workflows...');
    fetch(`${process.env.NEXT_PUBLIC_AGENTIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8002'}/api/workflows?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        debugLines.push(`Got ${data.length} workflows`);
        setSavedChats(data);
        setSidebarDebug(debugLines);
      })
      .catch(err => {
        debugLines.push(`Error: ${err.message}`);
        setSidebarDebug(debugLines);
      });
  }, [userId, loading]);

  // ChatSidebar component
  function ChatSidebar() {
    return (
      <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg z-30 transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`} style={{ width: 320 }}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Chat History</h3>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FiChevronLeft className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="text-xs text-gray-500 mb-4">
            {sidebarDebug.map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
          </div>
          
          <div className="space-y-2">
            {savedChats.map((wf, idx) => (
              <div key={wf.id || idx} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer">
                <div className="font-medium text-gray-900">{wf.name || `Workflow ${idx + 1}`}</div>
                <div className="text-sm text-gray-500">{wf.description || 'No description'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // SidebarToggleButton component
  function SidebarToggleButton() {
    return (
      <button
        onClick={() => setSidebarOpen(true)}
        className="fixed left-4 top-4 z-20 p-2 bg-white border border-gray-200 rounded-lg shadow-md hover:bg-gray-50 transition"
      >
        <FiChevronRight className="w-5 h-5 text-gray-600" />
      </button>
    );
  }

  // Send message function
  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;

    const userMessage = input.trim();
    setInput("");
    setChat(prev => [...prev, { role: "user", content: userMessage }]);
    setChatLoading(true);
    setError(null);

    try {
      const requestBody = {
        message: userMessage,
        chat_history: chat.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({
          role: m.role,
          content: m.content
        }))
      };
      
      console.log('[DEBUG] Sending request to AI service:', {
        url: `${process.env.NEXT_PUBLIC_AGENTIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8002'}/api/workflow-chat/${id}`,
        body: requestBody,
        hasToken: !!localStorage.getItem('token')
      });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_AGENTIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8002'}/api/workflow-chat/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DEBUG] AI service error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[DEBUG] AI service response:', data);
      
      let responseContent = data.output;
      if (data.credits_used && data.credits_used > 0) {
        responseContent += `\n\n---\n💳 **Credits used:** ${data.credits_used}`;
        if (data.remaining_credits !== undefined) {
          responseContent += ` | **Remaining:** ${data.remaining_credits}`;
        }
      }
      
      setChat(prev => [...prev, { role: "assistant", content: responseContent }]);
    } catch (e: any) {
      console.error('Error sending message:', e);
      setError(e.message || "Failed to send message");
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <>
      {isPublicMarketplace ? (
        <PublicChatLayout agentName={workflow?.name}>
          <div className="relative h-full flex flex-col w-full">
            {/* Remove the New Chat button (remove handleNewChat and its button) */}
            <div className={`flex-1 overflow-y-auto px-6 py-4 pb-24 ${
              isPublicMarketplace ? 'pt-8' : ''
            }`}>
              {/* Main content: greeting or chat */}
              {!chat.some(m => m.role === 'user') ? (
                chat.filter(m => m.role === 'user' || m.role === 'assistant').length > 0 ? (
                  <div className={`${isPublicMarketplace ? 'flex flex-col items-center justify-center' : 'flex'} min-h-[300px]`}>
                    {/* Centered Greeting */}
                    <div className={`flex flex-col items-center justify-center ${isPublicMarketplace ? 'w-full' : 'flex-1'} mb-0`}>
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-200 via-purple-200 to-white shadow-lg mb-6 animate-pulse" style={{ filter: 'blur(0.5px)' }} />
                      <h1 className="text-3xl font-semibold text-black mb-2 text-center">
                        {getGreeting()}, {userName}
                      </h1>
                      <h2 className="text-base font-normal text-center text-gray-800">
                        {isPublicMarketplace ? (
                          <>The <span className="text-indigo-500">{workflow?.name || 'AI Agent'}</span> is ready to help you.</>
                        ) : (
                          <>Your <span className="text-indigo-500">{workflow?.name || 'AI Agent'}</span> is here to assist you.</>
                        )}
                      </h2>
                    </div>
                    {/* Chat History Panel - Only for protected users */}
                    {!isPublicMarketplace && (
                      <div className="w-full max-w-md border-l border-gray-200 bg-gray-50 p-6 overflow-y-auto flex flex-col" style={{ minWidth: 320, maxHeight: '80vh' }}>
                        <h3 className="text-lg font-bold mb-4 text-gray-700">Chat History</h3>
                        <div className="flex flex-col gap-3">
                          {chat.filter(m => m.role === 'user' || m.role === 'assistant').map((message, idx) => (
                            <div key={idx} className={`text-sm ${message.role === 'user' ? 'text-right' : 'text-left'}`}> 
                              <span className={message.role === 'user' ? 'font-semibold text-emerald-700' : 'font-semibold text-indigo-700'}>
                                {message.role === 'user' ? 'You' : 'Assistant'}:
                              </span>
                              <span className="block text-black whitespace-pre-line mt-1">{message.content}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 mx-auto mb-0" style={{maxWidth: 480}}>
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-200 via-purple-200 to-white shadow-lg mb-6 animate-pulse" style={{ filter: 'blur(0.5px)' }} />
                    <h1 className="text-2xl font-semibold text-gray-400 mb-2 text-center">
                      {getGreeting()}, {userName}
                    </h1>
                    <h2 className="text-2xl font-semibold text-center text-gray-800">
                      {isPublicMarketplace ? (
                        <>The <span className="text-indigo-500">{workflow?.name || 'AI Agent'}</span> is ready to help you.</>
                      ) : (
                        <>Your <span className="text-indigo-500">{workflow?.name || 'AI Agent'}</span> is here to assist you.</>
                      )}
                    </h2>
                  </div>
                )
              ) : (
                // Normal chat mode (existing code)
                <div className="max-w-2xl mx-auto">
                  {chat.slice(chat.findIndex(m => m.role === 'user')).map((message, index) => (
                    <div
                      key={index}
                      className={`mb-4 ${
                        message.role === 'user' ? 'text-right' : 'text-left'
                      }`}
                    >
                      <div
                        className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white/80 backdrop-blur-md text-gray-900'
                        }`}
                      >
                        <div className="whitespace-pre-line">{message.content}</div>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="text-left mb-4">
                      <div className="inline-block bg-gray-100 text-black px-4 py-2 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          <span>Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Chat Input - Fixed to Bottom of Main Content Area */}
            <div className={`fixed bottom-0 bg-white border-t border-gray-200 shadow-lg z-40 ${
              isPublicMarketplace ? 'left-0 right-0' : 'left-64 right-0'
            }`}>
              <div className="max-w-2xl mx-auto px-6 py-4">
                <form onSubmit={sendMessage} className="flex gap-2 w-full">
                  <input
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-3 text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={chatLoading}
                    required
                  />
                  <button type="submit" disabled={chatLoading || !input.trim()} className="rounded-xl px-6 py-3 bg-gradient-to-br from-indigo-500 via-blue-600 to-purple-600 text-white font-semibold shadow-md hover:scale-105 transition flex items-center justify-center" style={{ minWidth: 120 }}>
                    {chatLoading ? 'Thinking...' : 'Send'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </PublicChatLayout>
      ) : (
        <ProtectedLayout hideTopBar>
          {/* Collapsible Chat Sidebar */}
          <ChatSidebar />
          {!sidebarOpen && <SidebarToggleButton />}
          <div className="relative h-full flex flex-col w-full">
            {/* Remove the New Chat button (remove handleNewChat and its button) */}
            <div className="flex-1 overflow-y-auto px-6 py-4 pb-24">
              {/* Main content: greeting or chat */}
              {!chat.some(m => m.role === 'user') ? (
                chat.filter(m => m.role === 'user' || m.role === 'assistant').length > 0 ? (
                  <div className="flex min-h-[300px]">
                    {/* Centered Greeting */}
                    <div className="flex flex-col items-center justify-center flex-1 mb-0">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-200 via-purple-200 to-white shadow-lg mb-6 animate-pulse" style={{ filter: 'blur(0.5px)' }} />
                      <h1 className="text-3xl font-semibold text-black mb-2 text-center">
                        {getGreeting()}, {userName}
                      </h1>
                      <h2 className="text-base font-normal text-center text-gray-800">
                        Your <span className="text-indigo-500">{workflow?.name || 'AI Agent'}</span> is here to assist you.
                      </h2>
                    </div>
                    {/* Chat History Panel */}
                    <div className="w-full max-w-md border-l border-gray-200 bg-gray-50 p-6 overflow-y-auto flex flex-col" style={{ minWidth: 320, maxHeight: '80vh' }}>
                      <h3 className="text-lg font-bold mb-4 text-gray-700">Chat History</h3>
                      <div className="flex flex-col gap-3">
                        {chat.filter(m => m.role === 'user' || m.role === 'assistant').map((message, idx) => (
                          <div key={idx} className={`text-sm ${message.role === 'user' ? 'text-right' : 'text-left'}`}> 
                            <span className={message.role === 'user' ? 'font-semibold text-emerald-700' : 'font-semibold text-indigo-700'}>
                              {message.role === 'user' ? 'You' : 'Assistant'}:
                            </span>
                            <span className="block text-black whitespace-pre-line mt-1">{message.content}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 mx-auto mb-0" style={{maxWidth: 480}}>
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-200 via-purple-200 to-white shadow-lg mb-6 animate-pulse" style={{ filter: 'blur(0.5px)' }} />
                    <h1 className="text-2xl font-semibold text-gray-400 mb-2 text-center">
                      {getGreeting()}, {userName}
                    </h1>
                    <h2 className="text-2xl font-semibold text-center text-gray-800">
                      Your <span className="text-indigo-500">{workflow?.name || 'AI Agent'}</span> is here to assist you.
                    </h2>
                  </div>
                )
              ) : (
                // Normal chat mode (existing code)
                <div className="max-w-2xl mx-auto">
                  {chat.slice(chat.findIndex(m => m.role === 'user')).map((message, index) => (
                    <div
                      key={index}
                      className={`mb-4 ${
                        message.role === 'user' ? 'text-right' : 'text-left'
                      }`}
                    >
                      <div
                        className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white/80 backdrop-blur-md text-gray-900'
                        }`}
                      >
                        <div className="whitespace-pre-line">{message.content}</div>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="text-left mb-4">
                      <div className="inline-block bg-gray-100 text-black px-4 py-2 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                          <span>Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Chat Input - Fixed to Bottom of Main Content Area */}
            <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
              <div className="max-w-2xl mx-auto px-6 py-4">
                <form onSubmit={sendMessage} className="flex gap-2 w-full">
                  <input
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-3 text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={chatLoading}
                    required
                  />
                  <button type="submit" disabled={chatLoading || !input.trim()} className="rounded-xl px-6 py-3 bg-gradient-to-br from-indigo-500 via-blue-600 to-purple-600 text-white font-semibold shadow-md hover:scale-105 transition flex items-center justify-center" style={{ minWidth: 120 }}>
                    {chatLoading ? 'Thinking...' : 'Send'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </ProtectedLayout>
      )}
    </>
  );
}

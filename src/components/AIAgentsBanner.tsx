'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ParticlesBackground from "./ParticlesBackground";
import { FaSearch, FaTimes, FaBrain } from "react-icons/fa";

const images = [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
];

// AI Agent Categories
const aiCategories = [
  "Content Creation",
  "Data Analysis", 
  "Customer Service",
  "Development",
  "Marketing",
  "Research",
  "Language",
  "Automation",
  "Analytics",
  "Creative",
  "Business",
  "Education",
  "Other"
];

export default function AIAgentsBanner() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Background image rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000); // change every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Real-time search suggestions
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      // Generate suggestions based on query and categories
      const suggestions = aiCategories.filter(category => 
        category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchSuggestions(suggestions.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  // Handle search submission
  const handleSearch = () => {
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.append('q', searchQuery.trim());
      if (selectedCategory) {
        params.append('category', selectedCategory);
      }
      // For now, just filter the current page
      console.log('Searching for:', searchQuery, 'in category:', selectedCategory);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setSelectedCategory(suggestion);
    setShowSuggestions(false);
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
   <section
  className="relative min-h-[100vh] flex items-center justify-center bg-cover bg-center transition-all duration-1000"
  style={{
    backgroundImage: `url(${images[current]})`,
  }}
>
  {/* Gradient Overlay */}
  <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 via-blue-900/40 to-pink-900/50 z-0" />
  
  {/* Floating Elements Container */}
  <div className="relative z-10 w-full max-w-7xl mx-auto px-4">
    
    {/* Announcement Banner */}
    <div className="flex justify-center mb-8">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-2 border border-white/20 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-white">New AI Agents Available</span>
        </div>
      </div>
    </div>

    {/* Main Hero Content */}
    <div className="text-center mb-6">
      <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 leading-tight">
        Discover & Deploy AI Agents
      </h1>
      <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto mb-6 leading-relaxed">
        Transform your workflow with intelligent AI assistants that automate tasks, 
        enhance productivity, and revolutionize how you work.
      </p>
    </div>

    {/* Floating Search Bar */}
    <div className="mb-8 max-w-2xl mx-auto">
      <div className="bg-white/90 backdrop-blur-md rounded-full shadow-2xl border border-white/20 p-2">
        <div className="flex items-center px-6 py-3">
          <input
            type="text"
            placeholder="Search AI agents (e.g., 'content writer', 'data analyst')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 text-lg text-gray-800 outline-none placeholder-gray-500 bg-transparent"
          />
          <button 
            onClick={handleSearch}
            disabled={!searchQuery.trim()}
            className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:from-emerald-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50"
          >
            Search
          </button>
        </div>
      </div>
    </div>

    {/* Popular Tags */}
    <div className="mb-12 text-center">
      <p className="text-white/70 text-sm mb-4">Popular: Content Writer • Data Analyst • Customer Support • Code Assistant • Social Media Manager</p>
    </div>

    {/* Floating Cards Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
      
      {/* Stats Card */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
        <div className="text-center">
          <div className="text-3xl font-bold text-white mb-2">500+</div>
          <div className="text-white/80 text-sm">AI Agents Available</div>
          <div className="mt-4 h-1 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full"></div>
        </div>
      </div>

      {/* Performance Card */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
        <div className="text-center">
          <div className="text-3xl font-bold text-white mb-2">10K+</div>
          <div className="text-white/80 text-sm">Successful Deployments</div>
          <div className="mt-4 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
        </div>
      </div>

      {/* Rating Card */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
        <div className="text-center">
          <div className="text-3xl font-bold text-white mb-2">4.8★</div>
          <div className="text-white/80 text-sm">Average Rating</div>
          <div className="mt-4 h-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"></div>
        </div>
      </div>
    </div>

  </div>

  {/* Floating Decorative Elements */}
  <div className="absolute top-20 left-10 w-20 h-20 bg-emerald-400/20 rounded-full blur-xl"></div>
  <div className="absolute bottom-20 right-10 w-32 h-32 bg-blue-400/20 rounded-full blur-xl"></div>
  <div className="absolute top-1/2 left-20 w-16 h-16 bg-purple-400/20 rounded-full blur-xl"></div>

    </section>
  );
} 
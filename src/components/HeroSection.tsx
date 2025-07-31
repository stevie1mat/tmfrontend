"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ParticlesBackground from "./ParticlesBackground";
import { FaSearch, FaTimes } from "react-icons/fa";

const images = [
    "https://images.pexels.com/photos/6457565/pexels-photo-6457565.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
];

// Categories from the backend
const categories = [
  "Academic Help",
  "Tech & Digital Skills", 
  "Creative & Arts",
  "Personal Development",
  "Language & Culture",
  "Health & Wellness",
  "Handy Skills & Repair",
  "Everyday Help",
  "Administrative & Misc Help",
  "Social & Community",
  "Entrepreneurship & Business",
  "Specialized Skills",
  "Content Creation",
  "Data Analysis",
  "Customer Service",
  "Development",
  "Other"
];

interface HeroSectionProps {
  onVideoClick?: () => void;
}

export default function HeroSection({ onVideoClick }: HeroSectionProps) {
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
      const suggestions = categories.filter(category => 
        category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchSuggestions(suggestions.slice(0, 5));
      setShowSuggestions(true);
    } else {
      // Show all categories when no input is given
      setSearchSuggestions(categories.slice(0, 5));
      setShowSuggestions(true);
    }
  }, [searchQuery]);

  // Handle search submission
  const handleSearch = () => {
    const params = new URLSearchParams();
    
    // If there's a search query, add it
    if (searchQuery.trim()) {
      params.append('q', searchQuery.trim());
    }
    
    // If there's a selected category, add it
    if (selectedCategory) {
      params.append('category', selectedCategory);
    }
    
    // Navigate to search page with or without parameters
    const searchUrl = params.toString() ? `/services/search?${params.toString()}` : '/services/search';
    router.push(searchUrl);
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
  {/* Particle Layer */}
  <div className="absolute inset-0 z-0 overflow-hidden">
    <ParticlesBackground />
  </div>
    <div className="absolute inset-0 bg-black/40 z-0" />
     <div className="relative z-10 text-center px-4 text-white max-w-6xl">
  <h1 className="text-4xl md:text-5xl font-bold mb-4">
    Exchange Skills. Earn Time Credits.
  </h1>
  <p className="mb-6">
    TradeMinutes lets you help others and get help in return — no money involved, just your time.
  </p>

  <div className="bg-white rounded-lg shadow-lg flex items-center overflow-hidden w-full max-w-6xl mx-auto relative">

  {/* Search Icon + Input */}
  <div className="flex items-center px-6 py-4 w-full md:w-[50%] relative search-container">
    <FaSearch className="w-6 h-6 text-gray-500 mr-3" />
    <input
      type="text"
      placeholder="Search For Help or Services"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      onKeyPress={handleKeyPress}
      onFocus={() => {
        if (searchQuery.trim().length === 0) {
          setSearchSuggestions(categories.slice(0, 5));
        }
        setShowSuggestions(true);
      }}
      className="w-full text-lg text-black outline-none placeholder-gray-500"
    />
    {searchQuery && (
      <button
        onClick={() => setSearchQuery("")}
        className="absolute right-2 text-gray-400 hover:text-gray-600"
      >
        <FaTimes className="w-4 h-4" />
      </button>
    )}
    
    {/* Search Suggestions Dropdown */}
    {showSuggestions && searchSuggestions.length > 0 && (
      <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1">
        {searchQuery.trim().length === 0 && (
          <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
            Popular categories:
          </div>
        )}
        {searchSuggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
          >
            <div className="flex items-center">
              <FaSearch className="w-4 h-4 text-gray-400 mr-3" />
              <span className="text-gray-700">{suggestion}</span>
            </div>
          </button>
        ))}
      </div>
    )}
  </div>

  {/* Divider */}
  <div className="w-px h-12 bg-gray-300" />

  {/* Dropdown */}
  <div className="px-6 py-4 w-full md:w-[30%]">
    <select 
      value={selectedCategory}
      onChange={(e) => setSelectedCategory(e.target.value)}
      className="w-full text-lg py-3 bg-white text-black outline-none"
    >
      <option value="">All Categories</option>
      {categories.map((category, index) => (
        <option key={index} value={category}>
          {category}
        </option>
      ))}
    </select>
  </div>

  {/* Button */}
  <button 
    onClick={handleSearch}
    className="bg-green-500 text-white text-lg font-semibold px-13 py-8 hover:bg-green-600 rounded-r-lg transition-colors"
  >
    {isSearching ? "Searching..." : "Search"}
  </button>
</div>


  <p className="text-sm mt-4 text-gray-200">
    Popular: Gardening, Dog Walking, Coding Help, Resume Review, Piano Lessons
  </p>

  {/* Video Button Section */}
  <div className="mt-8 flex items-center justify-center gap-4">
    <button 
      onClick={onVideoClick}
      className="flex items-center gap-3 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full hover:bg-white/30 transition-all duration-300 border border-white/30"
    >
      <span className="bg-white rounded-full p-2 shadow-lg">
        <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6 4l8 6-8 6V4z" />
        </svg>
      </span>
      <span className="font-medium">How TradeMinutes Works</span>
    </button>
  </div>
</div>

    </section>
  );
}

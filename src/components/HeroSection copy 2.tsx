"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaSearch, FaChevronDown, FaShieldAlt, FaCheckCircle } from "react-icons/fa";

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

const AVATARS = [
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/women/44.jpg",
  "https://randomuser.me/api/portraits/men/45.jpg",
  "https://randomuser.me/api/portraits/women/65.jpg",
  "https://randomuser.me/api/portraits/men/77.jpg"
];

interface HeroSectionProps {
  onVideoClick?: () => void;
}

export default function HeroSection({ onVideoClick }: HeroSectionProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const suggestions = categories.filter(category =>
        category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchSuggestions(suggestions.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setSearchSuggestions(categories.slice(0, 5));
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('q', searchQuery.trim());
    if (selectedCategory) params.append('category', selectedCategory);
    const searchUrl = params.toString() ? `/services/search?${params.toString()}` : '/services/search';
    router.push(searchUrl);
  };

  return (
    <section className="relative min-h-[100vh] flex items-center justify-center bg-emerald-900 overflow-hidden">
      {/* Subtle background patterns */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-green-400 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-40 w-24 h-24 bg-green-300 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-1/3 w-40 h-40 bg-green-500 rounded-full blur-xl"></div>
        <div className="absolute bottom-40 right-20 w-28 h-28 bg-green-400 rounded-full blur-xl"></div>
      </div>
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col items-start">
          <h1 className="text-white font-bold leading-tight mb-3 text-left" style={{ fontSize: '40px' }}>
            Exchange Skills. Earn Time Credits.
          </h1>
          <p className="text-gray-200 text-sm md:text-base mb-10 text-left max-w-4xl whitespace-nowrap">
            TradeMinutes lets you help others and get help in return — no money involved, just your time.
          </p>
          {/* SEARCH BAR */}
          <div className="w-full max-w-2xl mb-10 relative z-20">
            <div className="flex items-center bg-white rounded-full shadow-lg overflow-hidden">
              <span className="pl-6 pr-2 text-gray-400">
                <FaSearch className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="What are you looking for?"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                className="flex-1 py-5 text-lg text-gray-900 outline-none bg-transparent placeholder-gray-400"
              />
              <button
                onClick={handleSearch}
                className="bg-green-500 hover:bg-green-600 transition-colors text-white font-semibold text-lg px-10 py-4 rounded-full ml-2 mr-2"
              >
                Search
              </button>
            </div>
            {/* Suggestions dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute bg-white border border-gray-200 rounded-lg shadow-lg mt-2 w-full max-w-2xl z-50">
                {searchSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchQuery(suggestion);
                      setSelectedCategory(suggestion);
                      setShowSuggestions(false);
                    }}
                    className="block w-full text-left px-6 py-3 hover:bg-gray-50 text-gray-700"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* STATS */}
          <div className="flex flex-wrap gap-8 mt-2">
            <div className="text-center min-w-[120px]">
              <div className="text-white font-bold text-2xl md:text-3xl lg:text-4xl">960M</div>
              <div className="text-gray-200 text-base mt-1">Total Freelancer</div>
            </div>
            <div className="text-center min-w-[120px]">
              <div className="text-white font-bold text-2xl md:text-3xl lg:text-4xl">850M</div>
              <div className="text-gray-200 text-base mt-1">Positive Review</div>
            </div>
            <div className="text-center min-w-[120px]">
              <div className="text-white font-bold text-2xl md:text-3xl lg:text-4xl">98M</div>
              <div className="text-gray-200 text-base mt-1">Order recieved</div>
            </div>
            <div className="text-center min-w-[120px]">
              <div className="text-white font-bold text-2xl md:text-3xl lg:text-4xl">250M</div>
              <div className="text-gray-200 text-base mt-1">Projects Completed</div>
            </div>
          </div>
        </div>
        {/* RIGHT SIDE - OVERLAPPING */}
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 flex items-center justify-center min-h-[500px] z-10">
          {/* IMAGE CARDS */}
          <div className="relative w-[370px] h-[480px]">
            {/* Main image */}
            <img
              src="https://demoapus1.com/freeio/wp-content/uploads/2022/11/service16-768x576.jpg"
              alt="service"
              className="absolute -left-30 -top-20 w-[270px] h-[380px] object-cover rounded-2xl shadow-xl"
              style={{zIndex: 1}}
            />
            {/* Overlapping image */}
            <img
              src="https://demoapus1.com/freeio/wp-content/uploads/2022/11/service13-768x576.jpg"
              alt="service"
              className="absolute left-32 top-24 w-[340px] h-[300px] object-cover rounded-2xl shadow-lg"
              style={{zIndex: 0}}
            />
            {/* Proof of quality popup */}
            <div className="absolute left-26 -top-14 bg-white rounded-xl shadow-lg px-6 py-4 flex items-center gap-3 min-w-[220px]" style={{zIndex: 3}}>
              <span className="bg-green-100 rounded-full p-2">
                <FaShieldAlt className="text-green-500 w-6 h-6" />
              </span>
              <div>
                <div className="font-semibold text-gray-900">Proof of quality</div>
                <div className="text-gray-500 text-sm">Lorem Ipsum Dolar Amet</div>
              </div>
            </div>
            {/* Safe and secure popup */}
            {/* <div className="absolute right-10 bottom-8 bg-white rounded-xl shadow-lg px-6 py-4 flex items-center gap-3 min-w-[220px]" style={{zIndex: 3}}>
              <span className="bg-green-100 rounded-full p-2">
                <FaCheckCircle className="text-green-500 w-6 h-6" />
              </span>
              <div>
                <div className="font-semibold text-gray-900">Safe and secure</div>
                <div className="text-gray-500 text-sm">Lorem Ipsum Dolar Amet</div>
              </div>
            </div> */}
            {/* Professionals bar */}
            <div className="absolute left-0 -bottom-6 flex items-center bg-white rounded-full shadow-lg px-6 py-3 min-w-[270px] gap-4" style={{zIndex: 4}}>
              <span className="font-semibold text-gray-800">58M+ Professionals</span>
              <div className="flex -space-x-2">
                {AVATARS.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="avatar"
                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
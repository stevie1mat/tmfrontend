"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaSearch, FaChevronDown, FaShieldAlt, FaCheckCircle, FaUsers, FaStar } from "react-icons/fa";

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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Image slideshow data
  const heroImages = [
    {
      main: "https://demoapus1.com/freeio/wp-content/uploads/2022/09/h2.png",
      overlapping: "https://demoapus1.com/freeio/wp-content/uploads/2022/11/service15.jpg",
      popupTitle: "Verified Professionals",
      popupSubtitle: "Background checked & rated",
      popupIcon: FaShieldAlt,
      popupIconColor: "text-green-500",
      popupBgColor: "bg-green-100"
    },
    {
      main: "https://demoapus1.com/freeio/wp-content/uploads/2022/09/bg-video-410x410.png",
      overlapping: "https://demoapus1.com/freeio/wp-content/uploads/2022/11/service2.jpg",
      popupTitle: "AI Agent Dashboard",
      popupSubtitle: "Task automation & chat interface",
      popupIcon: FaUsers,
      popupIconColor: "text-blue-500",
      popupBgColor: "bg-blue-100"
    },
    {
      main: "https://demoapus1.com/freeio/wp-content/uploads/2022/10/12-300x300.jpg",
      overlapping: "https://demoapus1.com/freeio/wp-content/uploads/2022/11/service5.jpg",
      popupTitle: "Quality Guaranteed",
      popupSubtitle: "Top-rated professionals only",
      popupIcon: FaStar,
      popupIconColor: "text-yellow-500",
      popupBgColor: "bg-yellow-100"
    }
  ];
  


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

  // Slideshow effect with fade transition
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => 
          (prevIndex + 1) % heroImages.length
        );
        setTimeout(() => {
          setIsTransitioning(false);
        }, 200); // Small delay to ensure new image is loaded
      }, 1200); // Fade out duration (matches CSS transition)
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [heroImages.length]);



  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('q', searchQuery.trim());
    if (selectedCategory) params.append('category', selectedCategory);
    const searchUrl = params.toString() ? `/services/search?${params.toString()}` : '/services/search';
    router.push(searchUrl);
  };

  return (
    <section className="relative min-h-[100vh] flex items-center justify-center bg-emerald-900 overflow-hidden">
      {/* Circular background patterns */}
      <div className="absolute inset-0 z-0">
        {/* Large concentric circles */}
        <svg className="absolute top-10 right-10 w-1/3 h-1/3 opacity-8" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="80" stroke="#10b981" strokeWidth="2" fill="none"/>
          <circle cx="100" cy="100" r="60" stroke="#34d399" strokeWidth="1.5" fill="none"/>
          <circle cx="100" cy="100" r="40" stroke="#6ee7b7" strokeWidth="1" fill="none"/>
          <circle cx="100" cy="100" r="20" stroke="#a7f3d0" strokeWidth="0.8" fill="none"/>
        </svg>
        
        {/* Medium concentric circles */}
        <svg className="absolute bottom-20 left-20 w-1/4 h-1/4 opacity-6" viewBox="0 0 150 150" fill="none">
          <circle cx="75" cy="75" r="60" stroke="#34d399" strokeWidth="1.5" fill="none"/>
          <circle cx="75" cy="75" r="45" stroke="#6ee7b7" strokeWidth="1.2" fill="none"/>
          <circle cx="75" cy="75" r="30" stroke="#a7f3d0" strokeWidth="0.8" fill="none"/>
          <circle cx="75" cy="75" r="15" stroke="#d1fae5" strokeWidth="0.5" fill="none"/>
        </svg>
        
        {/* Small concentric circles */}
        <svg className="absolute top-1/3 left-1/3 w-1/6 h-1/6 opacity-5" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="40" stroke="#6ee7b7" strokeWidth="1" fill="none"/>
          <circle cx="50" cy="50" r="30" stroke="#a7f3d0" strokeWidth="0.8" fill="none"/>
          <circle cx="50" cy="50" r="20" stroke="#d1fae5" strokeWidth="0.6" fill="none"/>
          <circle cx="50" cy="50" r="10" stroke="#ecfdf5" strokeWidth="0.4" fill="none"/>
        </svg>
        
        {/* More circular patterns */}
        <svg className="absolute top-1/2 right-1/4 w-1/8 h-1/8 opacity-4" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="32" stroke="#a7f3d0" strokeWidth="0.8" fill="none"/>
          <circle cx="40" cy="40" r="24" stroke="#d1fae5" strokeWidth="0.6" fill="none"/>
          <circle cx="40" cy="40" r="16" stroke="#ecfdf5" strokeWidth="0.4" fill="none"/>
          <circle cx="40" cy="40" r="8" stroke="#f0fdf4" strokeWidth="0.2" fill="none"/>
        </svg>
        
        <svg className="absolute bottom-1/3 right-1/6 w-1/7 h-1/7 opacity-3" viewBox="0 0 70 70" fill="none">
          <circle cx="35" cy="35" r="28" stroke="#d1fae5" strokeWidth="0.6" fill="none"/>
          <circle cx="35" cy="35" r="21" stroke="#ecfdf5" strokeWidth="0.4" fill="none"/>
          <circle cx="35" cy="35" r="14" stroke="#f0fdf4" strokeWidth="0.3" fill="none"/>
          <circle cx="35" cy="35" r="7" stroke="#f7fee7" strokeWidth="0.1" fill="none"/>
        </svg>
        
        <svg className="absolute top-1/4 left-1/6 w-1/9 h-1/9 opacity-2" viewBox="0 0 60 60" fill="none">
          <circle cx="30" cy="30" r="24" stroke="#ecfdf5" strokeWidth="0.4" fill="none"/>
          <circle cx="30" cy="30" r="18" stroke="#f0fdf4" strokeWidth="0.3" fill="none"/>
          <circle cx="30" cy="30" r="12" stroke="#f7fee7" strokeWidth="0.2" fill="none"/>
          <circle cx="30" cy="30" r="6" stroke="#fafdf8" strokeWidth="0.1" fill="none"/>
        </svg>
        
        {/* Additional circular patterns with different sizes */}
        <svg className="absolute top-1/6 right-1/8 w-1/10 h-1/10 opacity-3" viewBox="0 0 50 50" fill="none">
          <circle cx="25" cy="25" r="20" stroke="#d1fae5" strokeWidth="0.5" fill="none"/>
          <circle cx="25" cy="25" r="15" stroke="#ecfdf5" strokeWidth="0.4" fill="none"/>
          <circle cx="25" cy="25" r="10" stroke="#f0fdf4" strokeWidth="0.3" fill="none"/>
          <circle cx="25" cy="25" r="5" stroke="#f7fee7" strokeWidth="0.2" fill="none"/>
        </svg>
        
        <svg className="absolute bottom-1/6 left-1/8 w-1/12 h-1/12 opacity-2" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="16" stroke="#a7f3d0" strokeWidth="0.4" fill="none"/>
          <circle cx="20" cy="20" r="12" stroke="#d1fae5" strokeWidth="0.3" fill="none"/>
          <circle cx="20" cy="20" r="8" stroke="#ecfdf5" strokeWidth="0.2" fill="none"/>
          <circle cx="20" cy="20" r="4" stroke="#f0fdf4" strokeWidth="0.1" fill="none"/>
        </svg>
        
        <svg className="absolute top-2/3 right-1/3 w-1/8 h-1/8 opacity-4" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="32" stroke="#6ee7b7" strokeWidth="1" fill="none"/>
          <circle cx="40" cy="40" r="24" stroke="#a7f3d0" strokeWidth="0.8" fill="none"/>
          <circle cx="40" cy="40" r="16" stroke="#d1fae5" strokeWidth="0.6" fill="none"/>
          <circle cx="40" cy="40" r="8" stroke="#ecfdf5" strokeWidth="0.4" fill="none"/>
        </svg>
        
        <svg className="absolute bottom-1/2 left-1/4 w-1/11 h-1/11 opacity-3" viewBox="0 0 45 45" fill="none">
          <circle cx="22.5" cy="22.5" r="18" stroke="#34d399" strokeWidth="0.6" fill="none"/>
          <circle cx="22.5" cy="22.5" r="13.5" stroke="#6ee7b7" strokeWidth="0.5" fill="none"/>
          <circle cx="22.5" cy="22.5" r="9" stroke="#a7f3d0" strokeWidth="0.4" fill="none"/>
          <circle cx="22.5" cy="22.5" r="4.5" stroke="#d1fae5" strokeWidth="0.3" fill="none"/>
        </svg>
        
        <svg className="absolute top-1/3 right-1/5 w-1/13 h-1/13 opacity-2" viewBox="0 0 35 35" fill="none">
          <circle cx="17.5" cy="17.5" r="14" stroke="#10b981" strokeWidth="0.5" fill="none"/>
          <circle cx="17.5" cy="17.5" r="10.5" stroke="#34d399" strokeWidth="0.4" fill="none"/>
          <circle cx="17.5" cy="17.5" r="7" stroke="#6ee7b7" strokeWidth="0.3" fill="none"/>
          <circle cx="17.5" cy="17.5" r="3.5" stroke="#a7f3d0" strokeWidth="0.2" fill="none"/>
        </svg>
        
        <svg className="absolute bottom-1/4 right-1/3 w-1/9 h-1/9 opacity-3" viewBox="0 0 60 60" fill="none">
          <circle cx="30" cy="30" r="24" stroke="#a7f3d0" strokeWidth="0.7" fill="none"/>
          <circle cx="30" cy="30" r="18" stroke="#d1fae5" strokeWidth="0.6" fill="none"/>
          <circle cx="30" cy="30" r="12" stroke="#ecfdf5" strokeWidth="0.5" fill="none"/>
          <circle cx="30" cy="30" r="6" stroke="#f0fdf4" strokeWidth="0.4" fill="none"/>
        </svg>
        
        <svg className="absolute top-1/2 left-1/5 w-1/14 h-1/14 opacity-1" viewBox="0 0 30 30" fill="none">
          <circle cx="15" cy="15" r="12" stroke="#6ee7b7" strokeWidth="0.4" fill="none"/>
          <circle cx="15" cy="15" r="9" stroke="#a7f3d0" strokeWidth="0.3" fill="none"/>
          <circle cx="15" cy="15" r="6" stroke="#d1fae5" strokeWidth="0.2" fill="none"/>
          <circle cx="15" cy="15" r="3" stroke="#ecfdf5" strokeWidth="0.1" fill="none"/>
        </svg>
        
        {/* 20 Additional circular patterns */}
        <svg className="absolute top-1/8 right-1/10 w-1/15 h-1/15 opacity-2" viewBox="0 0 25 25" fill="none">
          <circle cx="12.5" cy="12.5" r="10" stroke="#10b981" strokeWidth="0.4" fill="none"/>
          <circle cx="12.5" cy="12.5" r="7.5" stroke="#34d399" strokeWidth="0.3" fill="none"/>
          <circle cx="12.5" cy="12.5" r="5" stroke="#6ee7b7" strokeWidth="0.2" fill="none"/>
          <circle cx="12.5" cy="12.5" r="2.5" stroke="#a7f3d0" strokeWidth="0.1" fill="none"/>
        </svg>
        
        <svg className="absolute bottom-1/8 left-1/12 w-1/16 h-1/16 opacity-1" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="8" stroke="#34d399" strokeWidth="0.3" fill="none"/>
          <circle cx="10" cy="10" r="6" stroke="#6ee7b7" strokeWidth="0.2" fill="none"/>
          <circle cx="10" cy="10" r="4" stroke="#a7f3d0" strokeWidth="0.1" fill="none"/>
          <circle cx="10" cy="10" r="2" stroke="#d1fae5" strokeWidth="0.1" fill="none"/>
        </svg>
        
        <svg className="absolute top-3/4 right-1/7 w-1/13 h-1/13 opacity-3" viewBox="0 0 35 35" fill="none">
          <circle cx="17.5" cy="17.5" r="14" stroke="#6ee7b7" strokeWidth="0.5" fill="none"/>
          <circle cx="17.5" cy="17.5" r="10.5" stroke="#a7f3d0" strokeWidth="0.4" fill="none"/>
          <circle cx="17.5" cy="17.5" r="7" stroke="#d1fae5" strokeWidth="0.3" fill="none"/>
          <circle cx="17.5" cy="17.5" r="3.5" stroke="#ecfdf5" strokeWidth="0.2" fill="none"/>
        </svg>
        
        <svg className="absolute bottom-3/4 left-1/9 w-1/17 h-1/17 opacity-1" viewBox="0 0 18 18" fill="none">
          <circle cx="9" cy="9" r="7.2" stroke="#a7f3d0" strokeWidth="0.3" fill="none"/>
          <circle cx="9" cy="9" r="5.4" stroke="#d1fae5" strokeWidth="0.2" fill="none"/>
          <circle cx="9" cy="9" r="3.6" stroke="#ecfdf5" strokeWidth="0.1" fill="none"/>
          <circle cx="9" cy="9" r="1.8" stroke="#f0fdf4" strokeWidth="0.1" fill="none"/>
        </svg>
        
        <svg className="absolute top-1/4 right-1/6 w-1/12 h-1/12 opacity-2" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="16" stroke="#10b981" strokeWidth="0.6" fill="none"/>
          <circle cx="20" cy="20" r="12" stroke="#34d399" strokeWidth="0.5" fill="none"/>
          <circle cx="20" cy="20" r="8" stroke="#6ee7b7" strokeWidth="0.4" fill="none"/>
          <circle cx="20" cy="20" r="4" stroke="#a7f3d0" strokeWidth="0.3" fill="none"/>
        </svg>
        
        <svg className="absolute bottom-1/3 left-1/7 w-1/18 h-1/18 opacity-1" viewBox="0 0 15 15" fill="none">
          <circle cx="7.5" cy="7.5" r="6" stroke="#34d399" strokeWidth="0.3" fill="none"/>
          <circle cx="7.5" cy="7.5" r="4.5" stroke="#6ee7b7" strokeWidth="0.2" fill="none"/>
          <circle cx="7.5" cy="7.5" r="3" stroke="#a7f3d0" strokeWidth="0.1" fill="none"/>
          <circle cx="7.5" cy="7.5" r="1.5" stroke="#d1fae5" strokeWidth="0.1" fill="none"/>
        </svg>
        
        <svg className="absolute top-2/5 right-1/9 w-1/19 h-1/19 opacity-1" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="4.8" stroke="#6ee7b7" strokeWidth="0.3" fill="none"/>
          <circle cx="6" cy="6" r="3.6" stroke="#a7f3d0" strokeWidth="0.2" fill="none"/>
          <circle cx="6" cy="6" r="2.4" stroke="#d1fae5" strokeWidth="0.1" fill="none"/>
          <circle cx="6" cy="6" r="1.2" stroke="#ecfdf5" strokeWidth="0.1" fill="none"/>
        </svg>
        
        <svg className="absolute bottom-2/5 left-1/11 w-1/20 h-1/20 opacity-1" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="4" stroke="#a7f3d0" strokeWidth="0.3" fill="none"/>
          <circle cx="5" cy="5" r="3" stroke="#d1fae5" strokeWidth="0.2" fill="none"/>
          <circle cx="5" cy="5" r="2" stroke="#ecfdf5" strokeWidth="0.1" fill="none"/>
          <circle cx="5" cy="5" r="1" stroke="#f0fdf4" strokeWidth="0.1" fill="none"/>
        </svg>
        
        <svg className="absolute top-1/5 right-1/4 w-1/10 h-1/10 opacity-3" viewBox="0 0 50 50" fill="none">
          <circle cx="25" cy="25" r="20" stroke="#10b981" strokeWidth="0.7" fill="none"/>
          <circle cx="25" cy="25" r="15" stroke="#34d399" strokeWidth="0.6" fill="none"/>
          <circle cx="25" cy="25" r="10" stroke="#6ee7b7" strokeWidth="0.5" fill="none"/>
          <circle cx="25" cy="25" r="5" stroke="#a7f3d0" strokeWidth="0.4" fill="none"/>
        </svg>
        
        <svg className="absolute bottom-1/5 left-1/10 w-1/21 h-1/21 opacity-1" viewBox="0 0 8 8" fill="none">
          <circle cx="4" cy="4" r="3.2" stroke="#34d399" strokeWidth="0.3" fill="none"/>
          <circle cx="4" cy="4" r="2.4" stroke="#6ee7b7" strokeWidth="0.2" fill="none"/>
          <circle cx="4" cy="4" r="1.6" stroke="#a7f3d0" strokeWidth="0.1" fill="none"/>
          <circle cx="4" cy="4" r="0.8" stroke="#d1fae5" strokeWidth="0.1" fill="none"/>
        </svg>
        
        <svg className="absolute top-3/5 right-1/12 w-1/22 h-1/22 opacity-1" viewBox="0 0 6 6" fill="none">
          <circle cx="3" cy="3" r="2.4" stroke="#6ee7b7" strokeWidth="0.3" fill="none"/>
          <circle cx="3" cy="3" r="1.8" stroke="#a7f3d0" strokeWidth="0.2" fill="none"/>
          <circle cx="3" cy="3" r="1.2" stroke="#d1fae5" strokeWidth="0.1" fill="none"/>
          <circle cx="3" cy="3" r="0.6" stroke="#ecfdf5" strokeWidth="0.1" fill="none"/>
        </svg>
        
        <svg className="absolute bottom-3/5 left-1/13 w-1/23 h-1/23 opacity-1" viewBox="0 0 5 5" fill="none">
          <circle cx="2.5" cy="2.5" r="2" stroke="#a7f3d0" strokeWidth="0.3" fill="none"/>
          <circle cx="2.5" cy="2.5" r="1.5" stroke="#d1fae5" strokeWidth="0.2" fill="none"/>
          <circle cx="2.5" cy="2.5" r="1" stroke="#ecfdf5" strokeWidth="0.1" fill="none"/>
          <circle cx="2.5" cy="2.5" r="0.5" stroke="#f0fdf4" strokeWidth="0.1" fill="none"/>
        </svg>
        
        <svg className="absolute top-4/5 right-1/14 w-1/24 h-1/24 opacity-1" viewBox="0 0 4 4" fill="none">
          <circle cx="2" cy="2" r="1.6" stroke="#34d399" strokeWidth="0.3" fill="none"/>
          <circle cx="2" cy="2" r="1.2" stroke="#6ee7b7" strokeWidth="0.2" fill="none"/>
          <circle cx="2" cy="2" r="0.8" stroke="#a7f3d0" strokeWidth="0.1" fill="none"/>
          <circle cx="2" cy="2" r="0.4" stroke="#d1fae5" strokeWidth="0.1" fill="none"/>
        </svg>
        
        <svg className="absolute bottom-4/5 left-1/15 w-1/25 h-1/25 opacity-1" viewBox="0 0 3 3" fill="none">
          <circle cx="1.5" cy="1.5" r="1.2" stroke="#6ee7b7" strokeWidth="0.3" fill="none"/>
          <circle cx="1.5" cy="1.5" r="0.9" stroke="#a7f3d0" strokeWidth="0.2" fill="none"/>
          <circle cx="1.5" cy="1.5" r="0.6" stroke="#d1fae5" strokeWidth="0.1" fill="none"/>
          <circle cx="1.5" cy="1.5" r="0.3" stroke="#ecfdf5" strokeWidth="0.1" fill="none"/>
        </svg>
        
        <svg className="absolute top-1/7 right-1/16 w-1/26 h-1/26 opacity-1" viewBox="0 0 2 2" fill="none">
          <circle cx="1" cy="1" r="0.8" stroke="#a7f3d0" strokeWidth="0.3" fill="none"/>
          <circle cx="1" cy="1" r="0.6" stroke="#d1fae5" strokeWidth="0.2" fill="none"/>
          <circle cx="1" cy="1" r="0.4" stroke="#ecfdf5" strokeWidth="0.1" fill="none"/>
          <circle cx="1" cy="1" r="0.2" stroke="#f0fdf4" strokeWidth="0.1" fill="none"/>
        </svg>
        
        <svg className="absolute bottom-1/7 left-1/17 w-1/27 h-1/27 opacity-1" viewBox="0 0 1 1" fill="none">
          <circle cx="0.5" cy="0.5" r="0.4" stroke="#34d399" strokeWidth="0.3" fill="none"/>
          <circle cx="0.5" cy="0.5" r="0.3" stroke="#6ee7b7" strokeWidth="0.2" fill="none"/>
          <circle cx="0.5" cy="0.5" r="0.2" stroke="#a7f3d0" strokeWidth="0.1" fill="none"/>
          <circle cx="0.5" cy="0.5" r="0.1" stroke="#d1fae5" strokeWidth="0.1" fill="none"/>
        </svg>
        
        <svg className="absolute top-1/9 right-1/18 w-1/28 h-1/28 opacity-1" viewBox="0 0 0.5 0.5" fill="none">
          <circle cx="0.25" cy="0.25" r="0.2" stroke="#6ee7b7" strokeWidth="0.3" fill="none"/>
          <circle cx="0.25" cy="0.25" r="0.15" stroke="#a7f3d0" strokeWidth="0.2" fill="none"/>
          <circle cx="0.25" cy="0.25" r="0.1" stroke="#d1fae5" strokeWidth="0.1" fill="none"/>
          <circle cx="0.25" cy="0.25" r="0.05" stroke="#ecfdf5" strokeWidth="0.1" fill="none"/>
        </svg>
        
        <svg className="absolute bottom-1/9 left-1/19 w-1/29 h-1/29 opacity-1" viewBox="0 0 0.25 0.25" fill="none">
          <circle cx="0.125" cy="0.125" r="0.1" stroke="#a7f3d0" strokeWidth="0.3" fill="none"/>
          <circle cx="0.125" cy="0.125" r="0.075" stroke="#d1fae5" strokeWidth="0.2" fill="none"/>
          <circle cx="0.125" cy="0.125" r="0.05" stroke="#ecfdf5" strokeWidth="0.1" fill="none"/>
          <circle cx="0.125" cy="0.125" r="0.025" stroke="#f0fdf4" strokeWidth="0.1" fill="none"/>
        </svg>
        
        <svg className="absolute top-1/11 right-1/20 w-1/30 h-1/30 opacity-1" viewBox="0 0 0.125 0.125" fill="none">
          <circle cx="0.0625" cy="0.0625" r="0.05" stroke="#34d399" strokeWidth="0.3" fill="none"/>
          <circle cx="0.0625" cy="0.0625" r="0.0375" stroke="#6ee7b7" strokeWidth="0.2" fill="none"/>
          <circle cx="0.0625" cy="0.0625" r="0.025" stroke="#a7f3d0" strokeWidth="0.1" fill="none"/>
          <circle cx="0.0625" cy="0.0625" r="0.0125" stroke="#d1fae5" strokeWidth="0.1" fill="none"/>
        </svg>
      </div>
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20">
        {/* Concentric circles above the heading */}
        <div className="absolute top-0 left-0 w-1/4 h-1/4 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="40" stroke="#10b981" strokeWidth="2" fill="none"/>
            <circle cx="50" cy="50" r="30" stroke="#34d399" strokeWidth="1.5" fill="none"/>
            <circle cx="50" cy="50" r="20" stroke="#6ee7b7" strokeWidth="1" fill="none"/>
          </svg>
        </div>
        
        <div className="absolute top-10 right-1/3 w-1/6 h-1/6 opacity-8">
          <svg className="w-full h-full" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="32" stroke="#34d399" strokeWidth="1.5" fill="none"/>
            <circle cx="40" cy="40" r="24" stroke="#6ee7b7" strokeWidth="1" fill="none"/>
            <circle cx="40" cy="40" r="16" stroke="#a7f3d0" strokeWidth="0.8" fill="none"/>
          </svg>
        </div>
        
        <div className="absolute top-20 left-1/4 w-1/8 h-1/8 opacity-6">
          <svg className="w-full h-full" viewBox="0 0 60 60" fill="none">
            <circle cx="30" cy="30" r="24" stroke="#6ee7b7" strokeWidth="1" fill="none"/>
            <circle cx="30" cy="30" r="18" stroke="#a7f3d0" strokeWidth="0.8" fill="none"/>
            <circle cx="30" cy="30" r="12" stroke="#d1fae5" strokeWidth="0.6" fill="none"/>
          </svg>
        </div>
        
        <div className="flex flex-col items-start sm:items-start">
          <h1 className="text-white font-bold leading-tight mb-3 text-center sm:text-left" style={{ fontSize: '40px' }}>
            Exchange Skills. Earn Time Credits
          </h1>
          <p className="text-gray-200 text-sm md:text-base mb-10 text-center sm:text-left max-w-4xl sm:whitespace-nowrap">
            Connect with skilled humans or powerful AI agents. No money needed.
          </p>
                     {/* SEARCH BAR */}
           <div className="w-full max-w-2xl mb-10 relative z-20 px-4 sm:px-0">
            <div className="flex flex-col sm:flex-row items-center bg-white rounded-2xl sm:rounded-full shadow-2xl sm:shadow-lg overflow-hidden">
              <div className="flex items-center w-full px-4 sm:pl-6 sm:pr-2 py-4 sm:py-5">
                <span className="text-emerald-500 sm:text-gray-400 mr-3 sm:mr-0">
                  <FaSearch className="w-5 h-5 sm:w-5 sm:h-5" />
                </span>
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  className="flex-1 text-base sm:text-lg text-gray-900 outline-none bg-transparent placeholder-gray-500 sm:placeholder-gray-400"
                />
              </div>
              <div className="w-full sm:w-auto px-4 sm:px-0 pb-4 sm:pb-0 sm:pl-0">
                <button
                  onClick={handleSearch}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 transition-all duration-200 text-white font-semibold text-base sm:text-lg py-3 sm:py-4 px-6 sm:px-10 rounded-xl sm:rounded-full ml-0 sm:ml-2 mr-0 sm:mr-2 shadow-lg hover:shadow-xl transform hover:scale-105 sm:hover:scale-100"
                >
                  Search
                </button>
              </div>
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
           <div className="flex flex-wrap gap-4 sm:gap-6 mt-2 justify-center sm:justify-start">
             <div className="text-center min-w-[80px] sm:min-w-[100px]">
               <div className="text-white font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl">50K+</div>
               <div className="text-gray-200 text-xs sm:text-sm mt-1">Active Users</div>
             </div>
             <div className="text-center min-w-[80px] sm:min-w-[100px]">
               <div className="text-white font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl">25K+</div>
               <div className="text-gray-200 text-xs sm:text-sm mt-1">Services Offered</div>
             </div>
             <div className="text-center min-w-[80px] sm:min-w-[100px]">
               <div className="text-white font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl">15K+</div>
               <div className="text-gray-200 text-xs sm:text-sm mt-1">Successful Trades</div>
             </div>
             <div className="text-center min-w-[80px] sm:min-w-[100px]">
               <div className="text-white font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl">200+</div>
               <div className="text-gray-200 text-xs sm:text-sm mt-1">Cities Covered</div>
             </div>
             <div className="text-center min-w-[80px] sm:min-w-[100px]">
               <div className="text-white font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl">500+</div>
               <div className="text-gray-200 text-xs sm:text-sm mt-1">AI Agents</div>
             </div>
           </div>
        </div>
        {/* RIGHT SIDE - OVERLAPPING */}
        <div className="hidden sm:flex absolute right-0 top-1/2 transform -translate-y-1/2 items-center justify-center min-h-[500px] z-10">
          {/* IMAGE CARDS */}
          <div className="relative w-[370px] h-[480px]">
            {currentImageIndex === 0 || currentImageIndex === 1 ? (
              // AI Agent Dashboard for slides 1 and 2
              <>
                {currentImageIndex === 0 ? (
                  // Slide 1: Original image + AI Agent Marketplace widget
                  <>
                    {/* Main image - Keep original */}
                    <img
                      src={heroImages[currentImageIndex].main}
                      alt="service"
                      className={`absolute -left-30 -top-20 w-[270px] h-[380px] object-cover rounded-2xl shadow-xl transition-all duration-1200 ease-in-out ${
                        isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                      }`}
                      style={{zIndex: 0}}
                    />
                    
                    {/* Overlapping AI Agent Marketplace - Replace second image */}
                    <div className={`absolute left-32 top-24 w-[400px] h-[300px] bg-white rounded-2xl shadow-2xl transition-all duration-1200 ease-in-out ${
                      isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                    }`} style={{zIndex: 1}}>
                      <div className="p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-semibold text-gray-800">AI Agent Marketplace</span>
                          </div>
                          <div className="text-xs text-emerald-600 font-medium">500+ Agents</div>
                        </div>
                        
                        {/* Agent Categories */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <img 
                                  src="https://images.stockcake.com/public/4/1/6/41687207-ae33-4e0a-93e2-7abea5433d93_large/autumn-cabin-retreat-stockcake.jpg" 
                                  alt="Scheduling Assistant"
                                  className="w-8 h-8 rounded-lg object-cover border-2 border-emerald-200"
                                />
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-white"></div>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-gray-800">Scheduling Assistant</div>
                                <div className="text-xs text-gray-500">Automate calendar management</div>
                              </div>
                            </div>
                            <div className="text-xs text-emerald-600 font-medium">Active</div>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <img 
                                  src="https://images.stockcake.com/public/3/b/8/3b8e562e-ebde-4582-b629-9ffff40099de_large/mystic-astral-gateway-stockcake.jpg" 
                                  alt="Data Analyzer"
                                  className="w-8 h-8 rounded-lg object-cover border-2 border-blue-200"
                                />
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-white"></div>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-gray-800">Data Analyzer</div>
                                <div className="text-xs text-gray-500">Process and analyze data</div>
                              </div>
                            </div>
                            <div className="text-xs text-blue-600 font-medium">Active</div>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <img 
                                  src="https://images.stockcake.com/public/7/b/8/7b87c790-b431-4a41-8442-12a226b4c231_large/neon-urban-reflections-stockcake.jpg" 
                                  alt="Content Creator"
                                  className="w-8 h-8 rounded-lg object-cover border-2 border-purple-200"
                                />
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border border-white"></div>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-gray-800">Content Creator</div>
                                <div className="text-xs text-gray-500">Generate creative content</div>
                              </div>
                            </div>
                            <div className="text-xs text-purple-600 font-medium">Active</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  // Slide 2: AI Agent Dashboard (existing code)
                  <>
                    {/* Main AI Agent Dashboard - Detailed */}
                    <div className={`absolute -left-30 -top-20 w-[270px] h-[380px] bg-white rounded-2xl shadow-2xl transition-all duration-1200 ease-in-out ${
                      isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                    }`} style={{zIndex: 0}}>
                      <div className="p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                            <span className="text-sm font-semibold text-gray-800">AI Agent Dashboard</span>
                          </div>
                          <div className="text-xs text-gray-400">LIVE</div>
                        </div>
                        
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-emerald-50 rounded-lg p-3">
                            <div className="text-xs text-gray-500 mb-1">Response Time</div>
                            <div className="text-lg font-bold text-emerald-600">1.2s</div>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-3">
                            <div className="text-xs text-gray-500 mb-1">Success Rate</div>
                            <div className="text-lg font-bold text-blue-600">98.5%</div>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-3">
                            <div className="text-xs text-gray-500 mb-1">Tasks Completed</div>
                            <div className="text-lg font-bold text-purple-600">1,247</div>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-3">
                            <div className="text-xs text-gray-500 mb-1">Active Users</div>
                            <div className="text-lg font-bold text-orange-600">2.3K</div>
                          </div>
                        </div>
                        
                        {/* Performance Chart */}
                        <div className="mb-4">
                          <div className="text-xs text-gray-500 mb-2">Performance Trend</div>
                          <svg width="100%" height="60" viewBox="0 0 200 60" fill="none">
                            <polyline points="0,50 30,30 60,20 90,35 120,25 150,15 180,10 200,5" fill="none" stroke="#22c55e" strokeWidth="2" />
                            <circle cx="180" cy="10" r="3" fill="#22c55e" />
                            <circle cx="200" cy="5" r="3" fill="#22c55e" />
                          </svg>
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span>
                          </div>
                        </div>
                        

                      </div>
                    </div>
                    
                    {/* Overlapping AI Chat Interface - Detailed */}
                    <div className={`absolute left-32 top-24 w-[400px] h-[300px] bg-white rounded-2xl shadow-2xl transition-all duration-1200 ease-in-out ${
                      isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                    }`} style={{zIndex: 1}}>
                      <div className="p-6">
                        {/* Chat Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="text-sm font-semibold text-gray-800">AI Chat Interface</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span className="text-xs text-emerald-600">Online</span>
                          </div>
                        </div>
                        
                        {/* Chat Messages */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                            </div>
                            <div className="bg-emerald-50 rounded-lg p-3 max-w-[80%]">
                              <div className="text-xs text-emerald-600 font-medium mb-1">AI Agent</div>
                              <div className="text-xs text-gray-700">How can I help you today?</div>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2 justify-end">
                            <div className="bg-blue-50 rounded-lg p-3 max-w-[80%]">
                              <div className="text-xs text-blue-600 font-medium mb-1">User</div>
                              <div className="text-xs text-gray-700">Need help with scheduling</div>
                            </div>
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                              </svg>
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                            </div>
                            <div className="bg-emerald-50 rounded-lg p-3 max-w-[80%]">
                              <div className="text-xs text-emerald-600 font-medium mb-1">AI Agent</div>
                              <div className="text-xs text-gray-700">I'll help you schedule that!</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Typing Indicator */}
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-xs text-gray-500">AI Agent is typing...</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              // Original images for other slides
              <>
                {/* Main image */}
                <img
                  src={heroImages[currentImageIndex].main}
                  alt="service"
                  className={`absolute -left-30 -top-20 w-[270px] h-[380px] object-cover rounded-2xl shadow-xl transition-all duration-1200 ease-in-out ${
                    isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  }`}
                  style={{zIndex: 0}}
                />
                {/* Overlapping image */}
                <img
                  src={heroImages[currentImageIndex].overlapping}
                  alt="service"
                  className={`absolute left-32 top-24 w-[400px] h-[300px] object-cover rounded-2xl shadow-lg transition-all duration-1200 ease-in-out ${
                    isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                  }`}
                  style={{zIndex: 1}}
                />
              </>
            )}
            
            {/* Proof of quality popup */}
            <div className={`absolute left-26 -top-14 bg-white rounded-xl shadow-lg px-6 py-4 flex items-center gap-3 min-w-[280px] animate-slide-in-left transition-all duration-1200 ease-in-out ${
              isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`} style={{zIndex: 3}}>
              <span className={`${heroImages[currentImageIndex].popupBgColor} rounded-full p-2`}>
                {React.createElement(heroImages[currentImageIndex].popupIcon, {
                  className: `${heroImages[currentImageIndex].popupIconColor} w-6 h-6`
                })}
              </span>
              <div>
                <div className="font-semibold text-gray-900">{heroImages[currentImageIndex].popupTitle}</div>
                <div className="text-gray-500 text-sm">{heroImages[currentImageIndex].popupSubtitle}</div>
              </div>
            </div>
            
            {/* Professionals bar */}
            <div className="absolute left-0 -bottom-6 flex items-center bg-white rounded-full shadow-lg px-6 py-3 min-w-[270px] gap-4 animate-slide-in-right" style={{zIndex: 4}}>
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
'use client';

import { useState, useEffect } from 'react';
import { FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface Slide {
  id: number;
  title: string;
  description: string;
  image: string;
  alt: string;
}

interface HowTradeMinutesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const slides: Slide[] = [
  {
    id: 1,
    title: "Browse Helpers",
    description: "Explore our community of trusted members who offer their skills and time. Read reviews, check ratings, and find the perfect person to help you with your task.",
    image: "/topuser-banner.png",
    alt: "Browse helpers illustration"
  },
  {
    id: 2,
    title: "Connect & Swap",
    description: "Once you find the right helper, connect with them and arrange your skill swap. No money involved - just fair exchanges of time and expertise.",
    image: "/slide02.png",
    alt: "Connect and swap illustration"
  },
  {
    id: 3,
    title: "Build Community",
    description: "Complete your task, leave reviews, and build lasting connections in your community. TradeMinutes helps you give and receive help while building meaningful relationships.",
    image: "/services-banner.png",
    alt: "Build community illustration"
  }
];

export default function HowTradeMinutesModal({ isOpen, onClose }: HowTradeMinutesModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Reset to first slide when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide(prev => prev > 0 ? prev - 1 : slides.length - 1);
      } else if (e.key === 'ArrowRight') {
        setCurrentSlide(prev => prev < slides.length - 1 ? prev + 1 : 0);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const nextSlide = () => {
    setCurrentSlide(prev => prev < slides.length - 1 ? prev + 1 : 0);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => prev > 0 ? prev - 1 : slides.length - 1);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-4">
      <div className="max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-end p-6">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Slideshow Content */}
        <div className="relative">
          {/* Slide */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Image */}
              <div className="relative">
                <img
                  src={slides[currentSlide].image}
                  alt={slides[currentSlide].alt}
                  className={`w-full h-64 object-cover rounded-lg ${
                    slides[currentSlide].image.includes('.png') || slides[currentSlide].image.includes('http') ? '' : 'shadow-lg'
                  }`}
                />
                {!slides[currentSlide].image.includes('.png') && !slides[currentSlide].image.includes('http') && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
                )}
              </div>

              {/* Text Content */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium border border-white/30">
                    Step {slides[currentSlide].id}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {slides[currentSlide].title}
                </h3>
                <p className="text-white/90 text-lg leading-relaxed">
                  {slides[currentSlide].description}
                </p>
              </div>
            </div>
          </div>


        </div>

        {/* Footer with Arrows */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <button
                onClick={prevSlide}
                className="text-white hover:text-white/80 transition-colors"
              >
                <FiChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextSlide}
                className="text-white hover:text-white/80 transition-colors"
              >
                <FiChevronRight className="w-6 h-6" />
              </button>
            </div>
            <div className="text-sm text-white/80">
              {currentSlide + 1} of {slides.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
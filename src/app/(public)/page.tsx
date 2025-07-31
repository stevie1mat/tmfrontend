'use client';

import { useState } from 'react';
import Benefits from '@/components/Benefits';
import BlogSection from '@/components/BlogSection';
import CategoriesGrid from '@/components/CategoriesGrid';
import FAQ from '@/components/FAQ';
import FindHelpSection from '@/components/FindHelpSection';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import HowItWorks from '@/components/HowItWorks';
import HowItWorksSection from '@/components/HowItWorksSection';
import HowTradeMinutesModal from '@/components/HowTradeMinutesModal';
import Navbar from '@/components/Navbar';
import Pricing from '@/components/Pricing';
import TalentCallout from '@/components/TalentCallout';
import Testimonials from '@/components/Testimonials';
import TrendingServices from '@/components/TrendingServices';
import WhyTradeMinutes from '@/components/WhyTradeMinutes';
import ChatBotWithAuth from "@/components/ChatBotWithAuth";

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Navbar */}
      <Navbar />

      {/* Sections with spacing */}
      <div className="space-y-10">
        <HeroSection onVideoClick={() => setIsModalOpen(true)} />
        <CategoriesGrid />
        <FindHelpSection />
        <HowItWorksSection />
        <WhyTradeMinutes />
        <TrendingServices />
        <Testimonials />
        <TalentCallout />
        <BlogSection />
        <Footer />
      </div>

      {/* How TradeMinutes Works Modal */}
      <HowTradeMinutesModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
      <ChatBotWithAuth />
    </main>
  );
}

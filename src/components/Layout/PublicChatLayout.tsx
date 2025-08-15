'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiHome } from 'react-icons/fi';

interface PublicChatLayoutProps {
  children: React.ReactNode;
  agentName?: string;
}

export default function PublicChatLayout({ children, agentName }: PublicChatLayoutProps) {
  const router = useRouter();

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Back button and agent name */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">AI</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {agentName || 'AI Agent'}
                </span>
              </div>
            </div>

            {/* Right side - Home button */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FiHome className="w-5 h-5" />
                <span>Home</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}

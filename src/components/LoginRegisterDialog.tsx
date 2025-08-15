'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaTimes, FaSignInAlt, FaUserPlus } from 'react-icons/fa';

interface LoginRegisterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function LoginRegisterDialog({ 
  isOpen, 
  onClose, 
  title = "Login Required", 
  message = "Please log in or create an account to continue." 
}: LoginRegisterDialogProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleLogin = () => {
    onClose();
    router.push('/login');
  };

  const handleRegister = () => {
    onClose();
    router.push('/register');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 px-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <FaSignInAlt className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              Access AI Agents
            </h4>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Credits will be deducted from your account when you chat with AI agents.
            </p>
          </div>
        </div>
        
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleLogin}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <FaSignInAlt className="w-4 h-4" />
            Login
          </button>
          <button
            onClick={handleRegister}
            className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2"
          >
            <FaUserPlus className="w-4 h-4" />
            Register
          </button>
        </div>
      </div>
    </div>
  );
}


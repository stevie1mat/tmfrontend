'use client';

import { useState, useEffect } from 'react';
import { FaHeart } from 'react-icons/fa';
import { favoritesService } from '@/lib/favorites';
import AuthModal from '@/components/AuthModal';

interface FavoriteButtonProps {
  taskId: string;
  className?: string;
  onFavoriteChange?: (isFavorited: boolean) => void;
}

export default function FavoriteButton({ taskId, className = '', onFavoriteChange }: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    checkFavoriteStatus();
  }, [taskId]);

  const checkFavoriteStatus = async () => {
    try {
      const status = await favoritesService.checkFavoriteStatus(taskId);
      setIsFavorited(status.isFavorited);
    } catch (error) {
      console.error('Error checking favorite status:', error);
      setIsFavorited(false);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isLoading) return;
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      // Show auth modal instead of redirecting
      setShowAuthModal(true);
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isFavorited) {
        await favoritesService.removeFromFavorites(taskId);
        setIsFavorited(false);
        onFavoriteChange?.(false);
      } else {
        await favoritesService.addToFavorites(taskId);
        setIsFavorited(true);
        onFavoriteChange?.(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert the state if there was an error
      setIsFavorited(!isFavorited);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    // After successful login, try to favorite the service
    setTimeout(() => {
      handleToggleFavorite({ stopPropagation: () => {} } as any);
    }, 500);
  };

  return (
    <>
      <button
        onClick={handleToggleFavorite}
        disabled={isLoading}
        className={`bg-white rounded-full p-2 shadow hover:bg-gray-50 transition-all duration-200 ${
          isFavorited ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <FaHeart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
      </button>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
} 
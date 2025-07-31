'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChatBotWithAuth from '@/components/ChatBotWithAuth';

export default function ProductPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to services page since this page was using mock data
    router.push('/services/all');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to services...</p>
      </div>
      <ChatBotWithAuth />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { FaCoins } from 'react-icons/fa';
import { FiTrash2 } from 'react-icons/fi';

interface AIAgent {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  features: string[];
  demoUrl?: string;
  isFavorite?: boolean;
}

interface AIAgentCardProps {
  agent: AIAgent;
  onFavorite?: (id: string) => void;
  onDemo?: (id: string) => void;
  onPurchase?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function AIAgentCard({ agent, onFavorite, onDemo, onPurchase, onDelete }: AIAgentCardProps) {
  // Card style matches task list item
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:-translate-y-1 border border-gray-100">
      <div className="h-32 relative">
        {/* If agent.image is a URL or base64, render as image, else emoji/char */}
        {agent.image && (agent.image.startsWith('http') || agent.image.startsWith('data:image')) ? (
          <img src={agent.image} alt={agent.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-blue-100 to-blue-300">{agent.image}</div>
        )}
        <div className="absolute top-3 right-3 flex gap-2">
          {onDelete && (
            <button
              onClick={e => {
                e.stopPropagation();
                onDelete(agent.id);
              }}
              className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition"
              title="Delete"
            >
              <FiTrash2 className="w-5 h-5 text-red-500" />
            </button>
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-600 text-xs font-semibold rounded">
            {agent.category}
          </span>
          <div className="flex items-center gap-1 text-sm font-bold text-green-600">
            <FaCoins className="w-4 h-4" />
            <span>{agent.price}</span>
          </div>
        </div>
        <h4 className="font-semibold text-gray-900 mb-3">
          {agent.name}
        </h4>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{agent.description}</p>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <StarIcon className="w-4 h-4 text-yellow-400" />
          <span>{agent.rating} ({agent.reviews} reviews)</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onDemo?.(agent.id)}
            className="px-4 py-2 text-sm font-medium bg-white text-emerald-700 border border-emerald-700 rounded-full hover:bg-emerald-50 transition"
          >
            Try It Now
          </button>
          <button
            onClick={() => onPurchase?.(agent.id)}
            className="px-4 py-2 text-sm font-medium bg-emerald-700 text-white rounded-full hover:bg-emerald-800 transition"
          >
            Edit workflow
          </button>
        </div>
      </div>
    </div>
  );
} 
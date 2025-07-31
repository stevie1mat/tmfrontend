"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AIAgentCard from "@/components/AIAgentCard";
import ProtectedLayout from '@/components/Layout/ProtectedLayout';

// Demo data for user's AI agents
const myAgents = [
  {
    id: '1',
    name: 'Content Writer Pro',
    description: 'AI-powered content creation assistant that writes engaging blog posts, articles, and marketing copy.',
    category: 'Content Creation',
    price: 29,
    rating: 4.8,
    reviews: 1247,
    image: 'https://images.stockcake.com/public/1/1/f/11fc6018-f8a9-4eb4-bf60-0700a6a8f677_large/pathway-to-possibility-stockcake.jpg',
    features: ['SEO Optimization', 'Multiple Languages', 'Tone Adjustment', 'Plagiarism Check'],
    demoUrl: '/demo/content-writer',
    isFavorite: false,
  },
  {
    id: '2',
    name: 'Data Analyst Bot',
    description: 'Intelligent data analysis and visualization agent that processes complex datasets and generates insights.',
    category: 'Data Analysis',
    price: 49,
    rating: 4.9,
    reviews: 892,
    image: 'https://images.stockcake.com/public/1/b/1/1b13d39c-4efb-459d-8100-0eb827c4be00_large/digital-market-waves-stockcake.jpg',
    features: ['Excel Integration', 'Chart Generation', 'Statistical Analysis', 'Report Creation'],
    demoUrl: '/demo/data-analyst',
    isFavorite: true,
  },
  {
    id: '3',
    name: 'Customer Support AI',
    description: '24/7 customer service agent that handles inquiries, resolves issues, and provides instant support.',
    category: 'Customer Service',
    price: 39,
    rating: 4.7,
    reviews: 2156,
    image: 'https://images.stockcake.com/public/b/9/9/b9904d56-b224-4b54-a297-5dc45c8483f5_large/digital-message-glow-stockcake.jpg',
    features: ['Multi-language Support', 'Ticket Management', 'FAQ Integration', 'Escalation Logic'],
    demoUrl: '/demo/customer-support',
    isFavorite: false,
  },
  {
    id: '4',
    name: 'Code Assistant',
    description: 'Programming companion that helps with code review, debugging, and generating code snippets.',
    category: 'Development',
    price: 59,
    rating: 4.9,
    reviews: 1567,
    image: 'https://images.stockcake.com/public/b/a/e/bae96ed6-0e0f-4e3b-a42e-a9d21c5e0db7_large/digital-dream-weaver-stockcake.jpg',
    features: ['Multiple Languages', 'Code Review', 'Bug Detection', 'Documentation'],
    demoUrl: '/demo/code-assistant',
    isFavorite: false,
  },
];

export default function MyAIAgentsListPage() {
  const router = useRouter();

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-white py-10 px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My AI Agents</h1>
            <p className="text-gray-500 text-base font-normal mt-1">Manage and create your AI agents</p>
          </div>
          <button
            onClick={() => router.push('/ai-agents/create-workflow')}
            className="flex items-center gap-2 bg-emerald-700 text-white px-6 py-3 rounded-lg text-sm font-semibold shadow-md hover:bg-emerald-800 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            + Create New Agent
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {myAgents.map((agent) => (
            <AIAgentCard
              key={agent.id}
              agent={agent}
              // Add onFavorite, onDemo, onPurchase handlers as needed
            />
          ))}
        </div>
      </div>
    </ProtectedLayout>
  );
} 
'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import AIAgentsBanner from '@/components/AIAgentsBanner';
import AIAgentCard from '@/components/AIAgentCard';
import AIAgentDemoModal from '@/components/AIAgentDemoModal';
import AIAgentsHelpSection from '@/components/AIAgentsHelpSection';
import { MagnifyingGlassIcon, FunnelIcon, StarIcon } from '@heroicons/react/24/outline';
import BlogSection from '@/components/BlogSection';
import Footer from '@/components/Footer';
import { FiCpu, FiBarChart2, FiHeadphones, FiCode, FiTrendingUp, FiSearch, FiGlobe, FiRepeat, FiPieChart, FiPenTool, FiBriefcase, FiBookOpen, FiZap, FiInfo, FiDollarSign, FiSettings, FiUpload, FiStar } from 'react-icons/fi';
import ServiceSlider from '@/components/ServiceSlider';
import ChatBotWithAuth from '@/components/ChatBotWithAuth';

// Demo AI Agents Data
const demoAgents = [
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

const aiAgentCategories = [
  {
    name: 'Content Generation',
    icon: <FiPenTool className="w-8 h-8" />,
    description: 'Blog writing, copywriting, creative content, SEO & more'
  },
  {
    name: 'Data Analysis',
    icon: <FiBarChart2 className="w-8 h-8" />,
    description: 'Data processing, visualization, insights, reporting'
  },
  {
    name: 'Customer Support',
    icon: <FiHeadphones className="w-8 h-8" />,
    description: '24/7 chatbots, ticketing, FAQ, helpdesk automation'
  },
  {
    name: 'Development',
    icon: <FiCode className="w-8 h-8" />,
    description: 'Code generation, review, debugging, dev tools'
  },
  {
    name: 'Marketing',
    icon: <FiTrendingUp className="w-8 h-8" />,
    description: 'Social media, email, campaign automation, analytics'
  },
  {
    name: 'Research',
    icon: <FiSearch className="w-8 h-8" />,
    description: 'Market, academic, web research, data gathering'
  },
  {
    name: 'Language',
    icon: <FiGlobe className="w-8 h-8" />,
    description: 'Translation, localization, language learning'
  },
  {
    name: 'Automation',
    icon: <FiRepeat className="w-8 h-8" />,
    description: 'Workflow, task, and process automation'
  },
  {
    name: 'Analytics',
    icon: <FiPieChart className="w-8 h-8" />,
    description: 'Business intelligence, dashboards, reporting'
  },
  {
    name: 'Creative',
    icon: <FiZap className="w-8 h-8" />,
    description: 'Design, art, music, creative tools'
  },
  {
    name: 'Business',
    icon: <FiBriefcase className="w-8 h-8" />,
    description: 'Productivity, management, finance, operations'
  },
  {
    name: 'Education',
    icon: <FiBookOpen className="w-8 h-8" />,
    description: 'Tutoring, e-learning, knowledge assistants'
  },
  {
    name: 'Other',
    icon: <FiCpu className="w-8 h-8" />,
    description: 'Specialized, experimental, or unique AI agents'
  },
];

// Categories Data
const categories = [
  { id: 'all', name: 'All Agents', icon: '🤖', count: demoAgents.length, color: 'purple' },
  { id: 'Content Creation', name: 'Content', icon: '✍️', count: 1, color: 'blue' },
  { id: 'Data Analysis', name: 'Data', icon: '📊', count: 1, color: 'green' },
  { id: 'Customer Service', name: 'Support', icon: '🎧', count: 1, color: 'orange' },
  { id: 'Development', name: 'Dev', icon: '💻', count: 1, color: 'purple' },
  { id: 'Marketing', name: 'Marketing', icon: '📱', count: 2, color: 'pink' },
  { id: 'Research', name: 'Research', icon: '🔍', count: 1, color: 'indigo' },
  { id: 'Language', name: 'Language', icon: '🌐', count: 1, color: 'teal' },
];

const whyCards = [
  {
    icon: <FiZap className="w-8 h-8 text-emerald-600 mb-2" />,
    title: 'Automate Repetitive Tasks',
    desc: 'Let AI handle data entry, scheduling, content generation, and more—so you can focus on what matters.'
  },
  {
    icon: <FiBarChart2 className="w-8 h-8 text-emerald-600 mb-2" />,
    title: 'Boost Productivity',
    desc: 'AI agents analyze data, generate reports, and provide instant insights to help you make smarter decisions.'
  },
  {
    icon: <FiHeadphones className="w-8 h-8 text-emerald-600 mb-2" />,
    title: 'Enhance Customer Experience',
    desc: 'Deploy chatbots and support agents for 24/7 assistance, instant answers, and issue resolution.'
  },
  {
    icon: <FiTrendingUp className="w-8 h-8 text-emerald-600 mb-2" />,
    title: 'Scale Your Operations',
    desc: 'AI agents handle multiple tasks at once, letting you grow without increasing manual workload.'
  },
  {
    icon: <FiCpu className="w-8 h-8 text-emerald-600 mb-2" />,
    title: 'Access Specialized Expertise',
    desc: 'Find agents for content, analytics, marketing, research, and more—no coding required.'
  },
];

const howSteps = [
  {
    icon: <FiSearch className="w-8 h-8 text-emerald-600 mb-2" />,
    title: 'Browse or Search',
    desc: 'Explore a curated marketplace of AI agents by category, use case, or keyword.'
  },
  {
    icon: <FiBarChart2 className="w-8 h-8 text-emerald-600 mb-2" />,
    title: 'Preview and Compare',
    desc: 'View agent features, demo videos, user reviews, and pricing before making a choice.'
  },
  {
    icon: <FiZap className="w-8 h-8 text-emerald-600 mb-2" />,
    title: 'Deploy Instantly',
    desc: 'Add an agent to your workflow with a single click—no installation or setup required.'
  },
  {
    icon: <FiPieChart className="w-8 h-8 text-emerald-600 mb-2" />,
    title: 'Monitor and Manage',
    desc: 'Track agent performance, usage, and results from your dashboard.'
  },
  {
    icon: <FiSettings className="w-8 h-8 text-emerald-600 mb-2" />,
    title: 'Create Your Own',
    desc: 'Use our no-code builder or upload your own code to publish a new agent for the community.'
  },
];

const makeAgentSteps = [
  {
    icon: <FiSettings className="w-8 h-8 text-emerald-600 mb-2" />,
    title: 'No-Code Builder',
    desc: 'Use our intuitive interface to design agent workflows, set triggers, and define outputs.'
  },
  {
    icon: <FiCode className="w-8 h-8 text-emerald-600 mb-2" />,
    title: 'Bring Your Own Code',
    desc: 'Advanced users can upload custom Python, Node.js, or other code for specialized agents.'
  },
  {
    icon: <FiZap className="w-8 h-8 text-emerald-600 mb-2" />,
    title: 'Test and Preview',
    desc: 'Run your agent in a sandbox environment before publishing.'
  },
  {
    icon: <FiUpload className="w-8 h-8 text-emerald-600 mb-2" />,
    title: 'Publish to Marketplace',
    desc: 'Share your agent with the TradeMinutes community and start earning credits.'
  },
  {
    icon: <FiStar className="w-8 h-8 text-emerald-600 mb-2" />,
    title: 'Get Feedback & Improve',
    desc: 'Collaborate with users to enhance your agent’s features and performance.'
  },
];

export default function AIAgentsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(demoAgents[0]);

  // Filter agents based on category and search
  const filteredAgents = demoAgents.filter(agent => {
    const matchesCategory = selectedCategory === 'all' || agent.category === selectedCategory;
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort agents
  const sortedAgents = [...filteredAgents].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'reviews':
        return b.reviews - a.reviews;
      default:
        return b.reviews - a.reviews; // popular by default
    }
  });

  const handleDemo = (agentId: string) => {
    const agent = demoAgents.find(a => a.id === agentId);
    if (agent) {
      setSelectedAgent(agent);
      setDemoModalOpen(true);
    }
  };

  const handleFavorite = (agentId: string) => {
    // In a real app, this would update the backend
    console.log('Toggle favorite for agent:', agentId);
  };

  const handlePurchase = (agentId: string) => {
    // In a real app, this would redirect to checkout
    console.log('Purchase agent:', agentId);
  };

  return (
    <div className="text-black bg-amber-50 min-h-screen w-full">
      <Navbar />

      <AIAgentsBanner />

      {/* Featured AI Agents Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-left">Featured AI Agents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {demoAgents.slice(0, 8).map((agent) => (
              <AIAgentCard
                key={agent.id}
                agent={agent}
                onFavorite={handleFavorite}
              />
            ))}
          </div>
        </div>
      </section>

      {/* AI Agent Categories Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Browse AI Agents by Category</h2>
            <p className="text-gray-600 text-lg">Explore the possibilities with specialized AI agents for every need</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {aiAgentCategories.map((cat) => (
              <div key={cat.name} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-green-300 transition-all duration-300 cursor-pointer group block">
                <div className="mb-4">
                  <div className="text-gray-600 group-hover:text-green-600 transition-colors">{cat.icon}</div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{cat.name}</h3>
                <p className="text-sm text-gray-600">{cat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AIAgentsHelpSection />

      {/* How to Make an Agent Section */}
      <section className="py-16 bg-white mt-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">How to Make an Agent</h2>
          <div className="flex flex-col md:flex-row gap-8 overflow-x-auto md:overflow-visible justify-center items-stretch mb-10">
            {makeAgentSteps.map((step, idx) => (
              <div key={idx} className="flex-1 min-w-[260px] bg-white border border-emerald-100 rounded-2xl p-6 flex flex-col items-center shadow hover:shadow-lg transition relative">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg border-4 border-emerald-50 shadow">{idx + 1}</div>
                <div className="mt-6 mb-2">{step.icon}</div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2 text-center">{step.title}</h3>
                <p className="text-gray-600 text-base text-center">{step.desc}</p>
                {idx < makeAgentSteps.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-8 h-1 bg-emerald-100" />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <a
              href="/ai-agents/create"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-full text-lg font-semibold transition-all duration-300 shadow-xl inline-flex items-center gap-2"
            >
              Start Building Your Agent
            </a>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <BlogSection />

      {/* Footer */}
      <Footer />
      <ChatBotWithAuth />
    </div>
  );
} 
import React, { useState, useEffect } from 'react';
import { FiHome, FiBookOpen, FiMonitor, FiHeart, FiUsers, FiHelpCircle, FiImage, FiGift, FiBriefcase, FiTarget, FiStar, FiSettings } from 'react-icons/fi';
import Link from 'next/link';

const categoryDefinitions = [
  {
    name: 'Academic Help',
    icon: <FiBookOpen className="w-8 h-8" />,
    examples: 'Tutoring, Study Groups, Test Prep & More'
  },
  {
    name: 'Tech & Digital Skills',
    icon: <FiMonitor className="w-8 h-8" />,
    examples: 'Computer Setup, Software, Coding & More'
  },
  {
    name: 'Creative & Arts',
    icon: <FiImage className="w-8 h-8" />,
    examples: 'Design, Art, Photography, Music & More'
  },
  {
    name: 'Personal Development',
    icon: <FiHeart className="w-8 h-8" />,
    examples: 'Coaching, Life Skills, Motivation & More'
  },
  {
    name: 'Language & Culture',
    icon: <FiUsers className="w-8 h-8" />,
    examples: 'Language Learning, Cultural Exchange & More'
  },
  {
    name: 'Health & Wellness',
    icon: <FiHeart className="w-8 h-8" />,
    examples: 'Fitness, Yoga, Nutrition, Mental Health & More'
  },
  {
    name: 'Handy Skills & Repair',
    icon: <FiHome className="w-8 h-8" />,
    examples: 'Home Repairs, DIY Projects, Maintenance & More'
  },
  {
    name: 'Everyday Help',
    icon: <FiHelpCircle className="w-8 h-8" />,
    examples: 'Errands, Shopping, Organization & More'
  },
  {
    name: 'Administrative & Misc Help',
    icon: <FiSettings className="w-8 h-8" />,
    examples: 'Data Entry, Research, Virtual Assistance & More'
  },
  {
    name: 'Social & Community',
    icon: <FiUsers className="w-8 h-8" />,
    examples: 'Event Planning, Social Support, Community Service & More'
  },
  {
    name: 'Entrepreneurship & Business',
    icon: <FiBriefcase className="w-8 h-8" />,
    examples: 'Business Planning, Marketing, Financial Advice & More'
  },
  {
    name: 'Specialized Skills',
    icon: <FiTarget className="w-8 h-8" />,
    examples: 'Legal Advice, Medical Consultation, Technical Expertise & More'
  }
];

export default function CategoriesGrid() {
  const [categories, setCategories] = useState<Array<{
    name: string;
    icon: React.ReactNode;
    skills: string;
    examples: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [totalSkills, setTotalSkills] = useState(0);

  useEffect(() => {
    const fetchCategoryCounts = async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || "http://localhost:8084";
        
        // Fetch all services to count by category
        const response = await fetch(`${API_BASE_URL}/api/tasks/public`);
        
        if (!response.ok) {
          console.error('Failed to fetch services for category counts');
          // Fallback to static data
          const fallbackCategories = categoryDefinitions.map(cat => ({
            ...cat,
            skills: '0 skills'
          }));
          setCategories(fallbackCategories);
          setLoading(false);
          return;
        }

        const data = await response.json();
        const allServices = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        
        // Count services by category
        const categoryCounts: { [key: string]: number } = {};
        allServices.forEach((service: any) => {
          const category = service.Category || service.category;
          if (category) {
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
          }
        });

        // Create categories with real counts
        const categoriesWithCounts = categoryDefinitions.map(cat => ({
          ...cat,
          skills: `${categoryCounts[cat.name] || 0} skills`
        }));

        setCategories(categoriesWithCounts);
        setTotalSkills(allServices.length);
      } catch (error) {
        console.error('Error fetching category counts:', error);
        // Fallback to static data
        const fallbackCategories = categoryDefinitions.map(cat => ({
          ...cat,
          skills: '0 skills'
        }));
        setCategories(fallbackCategories);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryCounts();
  }, []);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Browse services by category
            </h2>
            <p className="text-gray-600 text-lg">
              Get some Inspirations from {totalSkills > 0 ? `${totalSkills}+` : '1800+'} skills
            </p>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse"
              >
                <div className="w-8 h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-20"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))
          ) : (
            categories.map((category, index) => (
              <Link 
                key={category.name}
                href={`/services/search?category=${encodeURIComponent(category.name)}`}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-green-300 transition-all duration-300 cursor-pointer group block"
              >
                {/* Icon */}
                <div className="mb-4">
                  <div className="text-gray-600 group-hover:text-green-600 transition-colors">
                    {category.icon}
                  </div>
                </div>

                {/* Skills Count */}
                <p className="text-sm text-gray-500 mb-2">
                  {category.skills}
                </p>

                {/* Category Name */}
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {category.name}
                </h3>

                {/* Examples */}
                <p className="text-sm text-gray-600">
                  {category.examples}
                </p>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

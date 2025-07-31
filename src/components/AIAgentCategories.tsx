'use client';

interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
  color: string;
}

interface AIAgentCategoriesProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export default function AIAgentCategories({ categories, selectedCategory, onCategoryChange }: AIAgentCategoriesProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              selectedCategory === category.id
                ? 'border-emerald-700 bg-emerald-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">{category.icon}</div>
              <div className="text-sm font-medium text-gray-900">{category.name}</div>
              <div className="text-xs text-gray-500">{category.count} agents</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 
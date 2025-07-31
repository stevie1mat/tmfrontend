'use client';

import { useState } from 'react';
import Link from 'next/link';

const categories: string[] = [
];

export default function CategoryTabsWithBreadcrumb() {
  const [active, setActive] = useState('');

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Tabs - Only show if there are categories */}
        {categories.length > 0 && (
          <div className="flex gap-6 overflow-x-auto px-4 md:px-10 whitespace-nowrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`pb-2 text-sm font-medium transition-colors ${
                  active === cat ? 'text-black border-b-2 border-black' : 'text-gray-500'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

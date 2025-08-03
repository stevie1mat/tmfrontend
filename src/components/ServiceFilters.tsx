import React, { useState, useEffect, useRef } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface ServiceFiltersProps {
  onFiltersChange?: (filters: FilterState) => void;
  totalResults?: number;
  onSortChange?: (sortBy: string) => void;
}

interface FilterState {
  serviceOptions: string[];
  budget: string;
  sortBy: string;
}

export default function ServiceFilters({ onFiltersChange, totalResults = 0, onSortChange }: ServiceFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    serviceOptions: [],
    budget: '',
    sortBy: 'Best selling'
  });

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const serviceOptions = [
    'Academic Help',
    'Tech & Digital Skills',
    'Creative & Arts',
    'Personal Development',
    'Language & Culture',
    'Health & Wellness',
    'Handy Skills & Repair',
    'Everyday Help',
    'Administrative & Misc Help',
    'Social & Community',
    'Entrepreneurship & Business',
    'Specialized Skills',
    'Other'
  ];

  const budgetRanges = [
    'Any Budget',
    'Under $50',
    '$50 - $100',
    '$100 - $200',
    '$200 - $500',
    'Over $500'
  ];

  const sortOptions = [
    'Best selling',
    'Newest arrivals',
    'Price: Low to High',
    'Price: High to Low',
    'Rating: High to Low',
    'Most reviews'
  ];

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
    console.log(`Filter changed: ${key} =`, value);
  };

  const handleArrayFilterChange = (key: 'serviceOptions', value: string) => {
    const currentArray = filters[key];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    console.log('Array filter change:', { key, value, currentArray, newArray });
    handleFilterChange(key, newArray);
  };

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const FilterDropdown = ({ 
    label, 
    options, 
    selected, 
    onSelect, 
    isArray = false 
  }: {
    label: string;
    options: string[];
    selected: string | string[];
    onSelect: (value: string) => void;
    isArray?: boolean;
  }) => {
    const isOpen = openDropdown === label;
    const hasSelection = isArray ? (selected as string[]).length > 0 : selected;

    return (
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleDropdown(label);
          }}
          className={`px-4 h-10 rounded-lg border text-sm flex items-center gap-2 transition-colors ${
            hasSelection 
              ? 'bg-blue-50 border-blue-200 text-blue-700' 
              : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
          }`}
        >
          {label}
          {isOpen ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
        </button>
        
        {isOpen && (
          <div 
            className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {options.map((option) => (
              <label key={option} className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer">
                <input
                  type={isArray ? "checkbox" : "radio"}
                  name={label}
                  value={option}
                  checked={isArray ? (selected as string[]).includes(option) : selected === option}
                  onChange={(e) => {
                    e.stopPropagation();
                    onSelect(option);
                  }}
                  className="mr-3"
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ToggleSwitch = ({ 
    label, 
    checked, 
    onChange, 
    isNew = false 
  }: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    isNew?: boolean;
  }) => (
    <div className="flex items-center gap-2 h-10">
      <label className="flex items-center cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="sr-only"
          />
          <div className={`w-10 h-6 rounded-full transition-colors ${
            checked ? 'bg-blue-500' : 'bg-gray-300'
          }`}>
            <div className={`w-4 h-4 bg-white rounded-full transition-transform transform ${
              checked ? 'translate-x-5' : 'translate-x-1'
            } mt-1`} />
          </div>
        </div>
        <span className="ml-2 text-sm text-gray-700">{label}</span>
      </label>
      {isNew && (
        <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded">New</span>
      )}
    </div>
  );

  return (
    <div ref={filterRef} className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-4 mb-4 min-h-[40px]">
        <FilterDropdown
          label="Service options"
          options={serviceOptions}
          selected={filters.serviceOptions}
          onSelect={(value) => handleArrayFilterChange('serviceOptions', value)}
          isArray={true}
        />
        
        <FilterDropdown
          label="Budget"
          options={budgetRanges}
          selected={filters.budget}
          onSelect={(value) => handleFilterChange('budget', value)}
        />
        
        <div className="hidden sm:flex items-center gap-2 ml-auto h-10">
          <span className="text-sm text-gray-600">Sort by:</span>
          <FilterDropdown
            label={filters.sortBy}
            options={sortOptions}
            selected={filters.sortBy}
            onSelect={(value) => {
              handleFilterChange('sortBy', value);
              onSortChange?.(value);
            }}
          />
        </div>
      </div>

      {/* Results Row */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {totalResults.toLocaleString()}+ results
        </div>
      </div>
    </div>
  );
}

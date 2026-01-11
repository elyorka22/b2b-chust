'use client';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

export default function CategoryFilter({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelectCategory(null)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            selectedCategory === null
              ? 'bg-black text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-gray-400'
          }`}
        >
          Barcha mahsulotlar
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedCategory === category
                ? 'bg-black text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-gray-400'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}


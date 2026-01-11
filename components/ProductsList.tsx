'use client';

import { useState, useMemo } from 'react';
import { Product } from '@/lib/db';
import ProductCard from './ProductCard';
import CategoryFilter from './CategoryFilter';

interface ProductsListProps {
  initialProducts: Product[];
  categories: string[];
}

export default function ProductsList({ initialProducts, categories }: ProductsListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) {
      return initialProducts;
    }
    return initialProducts.filter(product => product.category === selectedCategory);
  }, [initialProducts, selectedCategory]);

  if (initialProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Mahsulotlar hali qo'shilmagan</p>
      </div>
    );
  }

  return (
    <>
      {categories.length > 0 && (
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      )}
      <div className="mb-4 text-sm text-gray-600">
        Topilgan mahsulotlar: {filteredProducts.length}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Bu kategoriyada mahsulotlar topilmadi</p>
        </div>
      )}
    </>
  );
}


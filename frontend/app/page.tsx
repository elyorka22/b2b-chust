'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import ProductsList from '@/components/ProductsList';
import CategoryFilter from '@/components/CategoryFilter';
import { productsApi } from '@/lib/api';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsApi.getAll()
      .then(data => {
        setProducts(data);
        const cats = Array.from(new Set(data.map((p: any) => p.category).filter(Boolean))) as string[];
        setCategories(cats);
      })
      .catch(error => {
        console.error('Ошибка загрузки товаров:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">Yuklanmoqda...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-center text-gray-900">Mahsulotlar katalogi</h1>
          <a 
            href="/stores"
            className="text-center text-gray-600 hover:text-black transition-colors block"
          >
            Barcha do'konlarni ko'rish
          </a>
        </div>
        <ProductsList initialProducts={products} categories={categories} />
      </main>
    </div>
  );
}

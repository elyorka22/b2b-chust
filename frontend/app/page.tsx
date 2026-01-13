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
    const loadProducts = async () => {
      try {
        // Пробуем загрузить через API
        const data = await productsApi.getAll();
        console.log('Загружено товаров через API:', data?.length || 0);
        setProducts(data || []);
        const cats = Array.from(new Set((data || []).map((p: any) => p.category).filter(Boolean))) as string[];
        setCategories(cats);
      } catch (error: any) {
        console.error('Ошибка загрузки товаров через API:', error);
        console.error('Детали ошибки:', error.response?.data || error.message);
        
        // Fallback: пробуем загрузить напрямую через fetch
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
          console.log('[FALLBACK] Пробуем загрузить через fetch:', `${API_BASE_URL}/api/products`);
          
          const response = await fetch(`${API_BASE_URL}/api/products`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('[FALLBACK] Загружено товаров через fetch:', data?.length || 0);
          setProducts(data || []);
          const cats = Array.from(new Set((data || []).map((p: any) => p.category).filter(Boolean))) as string[];
          setCategories(cats);
        } catch (fetchError: any) {
          console.error('[FALLBACK] Ошибка загрузки через fetch:', fetchError);
          // Устанавливаем пустой массив при ошибке
          setProducts([]);
          setCategories([]);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
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

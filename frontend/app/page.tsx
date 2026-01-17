'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import ProductsList from '@/components/ProductsList';
import CategoryFilter from '@/components/CategoryFilter';
import { productsApi, categoriesApi } from '@/lib/api';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Загружаем категории из БД
        const categoriesData = await categoriesApi.getAll();
        setCategories(categoriesData || []);
        
        // Пробуем загрузить через API
        const data = await productsApi.getAll();
        console.log('Загружено товаров через API:', data?.length || 0);
        setProducts(data || []);
      } catch (error: any) {
        console.error('Ошибка загрузки товаров через API:', error);
        console.error('Детали ошибки:', error.response?.data || error.message);
        
        // Fallback: пробуем загрузить напрямую через fetch (без токена для публичного каталога)
        try {
          const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
          console.log('[FALLBACK] Пробуем загрузить через fetch (публичный запрос):', `${API_BASE_URL}/api/products`);
          
          const response = await fetch(`${API_BASE_URL}/api/products`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'omit', // Не отправляем cookies для публичного каталога
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('[FALLBACK] Загружено товаров через fetch:', data?.length || 0);
          setProducts(data || []);
        } catch (fetchError: any) {
          console.error('[FALLBACK] Ошибка загрузки через fetch:', fetchError);
          // Устанавливаем пустой массив при ошибке
          setProducts([]);
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
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
        
        {/* Карусель категорий */}
        {categories.length > 0 && (
          <div className="mb-8">
            {Array.from({ length: Math.ceil(categories.length / 10) }).map((_, carouselIndex) => {
              const startIndex = carouselIndex * 10;
              const endIndex = Math.min(startIndex + 10, categories.length);
              const carouselCategories = categories.slice(startIndex, endIndex);
              
              return (
                <div key={carouselIndex} className="mb-6">
                  <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {carouselCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          const element = document.getElementById(`category-${category.name}`);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        className="flex-shrink-0 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-indigo-500 transition-all text-sm sm:text-base font-medium text-gray-900 whitespace-nowrap"
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <ProductsList initialProducts={products} categories={categories.map(c => c.name)} />
      </main>
    </div>
  );
}

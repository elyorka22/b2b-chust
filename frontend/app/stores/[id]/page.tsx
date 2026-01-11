'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { usersApi, productsApi } from '@/lib/api';
import { User, Product } from '@/lib/db';

export default function StorePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [store, setStore] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStoreData() {
      try {
        const [storeData, allProducts] = await Promise.all([
          usersApi.getById(id),
          productsApi.getAll(),
        ]);

        if (!storeData || storeData.role !== 'magazin') {
          router.push('/stores');
          return;
        }

        setStore(storeData);
        const storeProducts = allProducts.filter((p: Product) => p.storeId === storeData.id);
        setProducts(storeProducts);
      } catch (error) {
        console.error('Do\'kon ma\'lumotlarini yuklashda xatolik:', error);
        router.push('/stores');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchStoreData();
    }
  }, [id, router]);

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

  if (!store) {
    return null; // Редирект уже произошел
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link 
            href="/stores"
            className="text-black hover:text-gray-700 mb-4 inline-block"
          >
            ← Do'konlar ro'yxatiga qaytish
          </Link>
          <h1 className="text-4xl font-bold mb-2 text-gray-900">
            {store.storeName || store.username}
          </h1>
          <p className="text-gray-600">
            Foydalanuvchi: {store.username}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Bu do'konda mahsulotlar hali qo'shilmagan</p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              Topilgan mahsulotlar: {products.length}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

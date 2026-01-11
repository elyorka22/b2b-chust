import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import CategoryFilter from '@/components/CategoryFilter';
import ProductsList from '@/components/ProductsList';
import { db } from '@/lib/db';
import Link from 'next/link';

export default async function HomePage() {
  const products = db.products.getAll();
  
  // Получаем уникальные категории
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-center text-gray-900">Mahsulotlar katalogi</h1>
          <Link 
            href="/stores"
            className="text-center text-gray-600 hover:text-black transition-colors block"
          >
            Barcha do'konlarni ko'rish
          </Link>
        </div>
        <ProductsList initialProducts={products} categories={categories} />
      </main>
    </div>
  );
}

import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = db.users.getById(id);
  
  if (!store || store.role !== 'magazin') {
    notFound();
  }

  const products = db.products.getAll().filter(p => p.storeId === store.id);
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];

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


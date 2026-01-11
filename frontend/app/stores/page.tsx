import Header from '@/components/Header';
import { db } from '@/lib/db';
import Link from 'next/link';

export default async function StoresPage() {
  // Получаем всех пользователей с ролью magazin
  const allUsers = db.users.getAll();
  const stores = allUsers.filter(user => user.role === 'magazin');

  // Для каждого магазина получаем количество товаров
  const storesWithStats = stores.map(store => {
    const products = db.products.getAll().filter(p => p.storeId === store.id);
    return {
      ...store,
      productCount: products.length,
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-center text-gray-900">Do'konlar katalogi</h1>
          <Link 
            href="/"
            className="text-center text-gray-600 hover:text-black transition-colors block"
          >
            Barcha tovarlarni ko'rish
          </Link>
        </div>

        {storesWithStats.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Do'konlar hali qo'shilmagan</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {storesWithStats.map((store) => (
              <Link
                key={store.id}
                href={`/stores/${store.id}`}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
              >
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-2 text-gray-900">
                    {store.storeName || store.username}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Foydalanuvchi: {store.username}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Mahsulotlar: {store.productCount}
                    </span>
                    <span className="text-sm text-gray-400">
                      {new Date(store.createdAt).toLocaleDateString('uz-UZ')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}


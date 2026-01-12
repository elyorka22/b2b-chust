'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCart } from '@/lib/cart';

export default function Header() {
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    const cart = getCart();
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
    
    // Проверяем наличие токена админа
    const adminToken = document.cookie.split('; ').find(row => row.startsWith('auth-token='));
    setIsAdmin(!!adminToken);
    
    // Проверяем наличие токена клиента
    const customerToken = document.cookie.split('; ').find(row => row.startsWith('customer-token='));
    if (customerToken) {
      setIsCustomer(true);
      // Пытаемся получить имя из токена (в реальном приложении лучше через API)
      try {
        const tokenValue = customerToken.split('=')[1];
        const payload = JSON.parse(atob(tokenValue.split('.')[1]));
        setCustomerName(payload.name || payload.phone);
      } catch {
        setIsCustomer(true);
      }
    }
  }, []);

  const handleLogout = () => {
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'customer-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/');
    router.refresh();
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-black">
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/cart" className="relative text-gray-700 hover:text-black transition-colors">
              Savat
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            {isAdmin && (
              <>
                <Link href="/admin" className="text-gray-700 hover:text-black transition-colors">
                  Admin panel
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-black transition-colors"
                >
                  Chiqish
                </button>
              </>
            )}
            {!isAdmin && !isCustomer && (
              <Link 
                href="/login" 
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
              >
                Kirish
              </Link>
            )}
            {!isAdmin && isCustomer && (
              <div className="flex items-center gap-4">
                <span className="text-gray-700">Salom, {customerName}</span>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-black transition-colors"
                >
                  Chiqish
                </button>
              </div>
            )}
            {isAdmin && (
              <Link 
                href="/admin" 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
              >
                Admin panel
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}


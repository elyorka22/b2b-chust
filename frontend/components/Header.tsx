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

  const updateCartCount = () => {
    const cart = getCart();
    setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
  };

  useEffect(() => {
    updateCartCount();
    
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

    // Слушаем изменения в localStorage для обновления счетчика корзины
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cart') {
        updateCartCount();
      }
    };

    // Слушаем события storage (для обновления между вкладками)
    window.addEventListener('storage', handleStorageChange);

    // Периодически проверяем корзину (для обновления в той же вкладке)
    const interval = setInterval(() => {
      updateCartCount();
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
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
          <nav className="flex items-center justify-between w-full max-w-2xl mx-auto">
            <Link href="/cart" className="relative text-gray-700 hover:text-black transition-colors flex-1 text-center flex items-center justify-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            {!isAdmin && (
              <Link 
                href="/contact" 
                className="text-gray-700 hover:text-black transition-colors flex-1 text-center"
              >
                Sotuvchi bo'lish
              </Link>
            )}
            {isAdmin && (
              <Link 
                href="/admin" 
                className="text-gray-700 hover:text-black transition-colors flex-1 text-center"
              >
                Admin panel
              </Link>
            )}
            {!isAdmin && !isCustomer && (
              <Link 
                href="/login" 
                className="text-gray-700 hover:text-black transition-colors flex-1 text-center"
              >
                Kirish
              </Link>
            )}
            {!isAdmin && isCustomer && (
              <div className="flex items-center gap-2 flex-1 justify-center">
                <span className="text-gray-700 text-sm">Salom, {customerName}</span>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-black transition-colors text-sm"
                >
                  Chiqish
                </button>
              </div>
            )}
            {isAdmin && (
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-black transition-colors flex-1 text-center"
              >
                Chiqish
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}


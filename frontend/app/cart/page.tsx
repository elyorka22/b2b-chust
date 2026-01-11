'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { CartItem, getCart, removeFromCart, updateCartItem, clearCart, getCartTotal } from '@/lib/cart';
import { API_BASE_URL } from '@/lib/config';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);

  useEffect(() => {
    setCart(getCart());
    
    // Проверяем авторизован ли клиент
    const customerToken = document.cookie.split('; ').find(row => row.startsWith('customer-token='));
    if (customerToken) {
      setIsCustomer(true);
      try {
        const tokenValue = customerToken.split('=')[1];
        const payload = JSON.parse(atob(tokenValue.split('.')[1]));
        setCustomerData(payload);
        setPhone(payload.phone || '');
      } catch {
        setIsCustomer(false);
      }
    }
  }, []);

  const handleRemove = (productId: string) => {
    removeFromCart(productId);
    setCart(getCart());
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    updateCartItem(productId, quantity);
    setCart(getCart());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !address || cart.length === 0) {
      alert('Barcha maydonlarni to\'ldiring va savatga mahsulot qo\'shing');
      return;
    }

    setIsSubmitting(true);
    try {
      // Преобразуем items для backend (добавляем store_id)
      const orderItems = cart.map(item => ({
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        price: item.price,
        unit: item.unit || 'dona',
        store_id: item.storeId, // Добавляем store_id для уведомлений
      }));

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          address,
          items: orderItems,
        }),
      });

      if (response.ok) {
        clearCart();
        alert('Buyurtma muvaffaqiyatli rasmiylashtirildi! Tez orada siz bilan bog\'lanamiz.');
        router.push('/');
      } else {
        alert('Buyurtmani rasmiylashtirishda xatolik');
      }
    } catch (error) {
      alert('Buyurtmani rasmiylashtirishda xatolik');
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = getCartTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Savat</h1>
        {cart.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">Savat bo'sh</p>
            <button
              onClick={() => router.push('/')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
            >
              Katalogga qaytish
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Savatdagi mahsulotlar</h2>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center gap-4 border-b pb-4">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="w-20 h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium">{item.productName}</h3>
                        <p className="text-gray-600">{item.price.toLocaleString()} so'm/{item.unit || 'dona'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                          className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                          className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {(item.price * item.quantity).toLocaleString()} so'm
                        </p>
                        <button
                          onClick={() => handleRemove(item.productId)}
                          className="text-red-500 text-sm hover:text-red-700"
                        >
                          O'chirish
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Jami:</span>
                    <span>{total.toLocaleString()} so'm</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Buyurtmani rasmiylashtirish</h2>
                {isCustomer && customerData && (
                  <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Kirilgan:</strong> {customerData.name || customerData.phone}
                    </p>
                    <p className="text-xs text-gray-500">
                      Ma'lumotlar avtomatik to'ldirildi
                    </p>
                  </div>
                )}
                {!isCustomer && (
                  <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Buyurtma berish uchun ma'lumotlarni kiriting
                    </p>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Telefon raqami *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="+998 (90) 123-45-67"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Yetkazib berish manzili *
                    </label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      placeholder="Shahar, ko'cha, uy, kvartira"
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 disabled:bg-gray-400 shadow-md hover:shadow-lg transition-all"
                  >
                    {isSubmitting ? 'Rasmiylashtirilmoqda...' : 'Buyurtmani rasmiylashtirish'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


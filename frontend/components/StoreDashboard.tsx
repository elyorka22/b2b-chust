'use client';

import { useEffect, useState } from 'react';
import { Product, Order } from '@/lib/db';
import { productsApi, ordersApi, statsApi, userApi, subscriptionsApi } from '@/lib/api';
import { getCurrentUserFromToken, getAuthToken } from '@/lib/auth';

interface StoreDashboardProps {
  storeName?: string;
}

export default function StoreDashboard({ storeName }: StoreDashboardProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'stats' | 'reports'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'stats') {
      fetchStats();
    } else if (activeTab === 'subscription') {
      fetchSubscription();
    }
  }, [activeTab]);

  const [telegramChatId, setTelegramChatId] = useState<string>('');
  const [showTelegramSetup, setShowTelegramSetup] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    // Получаем ID текущего пользователя
    const user = getCurrentUserFromToken();
    if (user) {
      setCurrentUserId(user.id);
    }
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Используем метод для админ-панели (с токеном, фильтрует по магазину)
      const data = await productsApi.getAllForAdmin();
      setProducts(data);
    } catch (error) {
      console.error('Mahsulotlarni yuklashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await ordersApi.getAll();
      setOrders(data);
    } catch (error) {
      console.error('Buyurtmalarni yuklashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await statsApi.get();
      setStats(data);
    } catch (error) {
      console.error('Statistikani yuklashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (period: 'week' | 'month') => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
      
      const response = await fetch(`${API_BASE_URL}/api/reports/${period}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Hisobot yuklab olishda xatolik');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hisobot_${period === 'week' ? 'haftalik' : 'oylik'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Hisobot yuklab olishda xatolik:', error);
      alert('Hisobot yuklab olishda xatolik yuz berdi');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Mahsulotni o\'chirish?')) return;
    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchProducts();
      } else {
        alert('Mahsulotni o\'chirishda xatolik');
      }
    } catch (error) {
      alert('Mahsulotni o\'chirishda xatolik');
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        fetchOrders();
      }
    } catch (error) {
      alert('Holatni yangilashda xatolik');
    }
  };

  return (
    <div className="w-full">
      {/* Header with burger menu */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          {/* Burger menu button - visible on mobile */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Magazin paneli</h1>
            {storeName && (
              <p className="text-gray-900 font-semibold text-sm sm:text-base">Magazin: {storeName}</p>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar menu overlay - mobile */}
      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50 md:hidden transform transition-transform duration-300 ease-in-out">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Menu</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="p-4 space-y-2">
              <button
                onClick={() => {
                  setActiveTab('products');
                  setIsMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors font-semibold ${
                  activeTab === 'products' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
              >
                Mahsulotlar
              </button>
              <button
                onClick={() => {
                  setActiveTab('orders');
                  setIsMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors font-semibold ${
                  activeTab === 'orders' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
              >
                Buyurtmalar
              </button>
              <button
                onClick={() => {
                  setActiveTab('stats');
                  setIsMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors font-semibold ${
                  activeTab === 'stats' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
              >
                Statistika
              </button>
              <button
                onClick={() => {
                  setActiveTab('reports');
                  setIsMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors font-semibold ${
                  activeTab === 'reports' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
              >
                Hisobot
              </button>
              <button
                onClick={() => {
                  setActiveTab('subscription');
                  setIsMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors font-semibold ${
                  activeTab === 'subscription' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
              >
                Obuna
              </button>
            </nav>
          </div>
        </>
      )}

      {/* Desktop tabs - hidden on mobile */}
      <div className="hidden md:block mb-4 sm:mb-6">
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 transition-colors font-semibold ${activeTab === 'products' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-900 hover:text-indigo-600'}`}
          >
            Mahsulotlar
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 transition-colors font-semibold ${activeTab === 'orders' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-900 hover:text-indigo-600'}`}
          >
            Buyurtmalar
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 transition-colors font-semibold ${activeTab === 'stats' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-900 hover:text-indigo-600'}`}
          >
            Statistika
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 transition-colors font-semibold ${activeTab === 'reports' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-900 hover:text-indigo-600'}`}
          >
            Hisobot
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`px-4 py-2 transition-colors font-semibold ${activeTab === 'subscription' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-900 hover:text-indigo-600'}`}
          >
            Obuna
          </button>
        </div>
      </div>

      {/* Telegram Chat ID настройка */}
      {currentUserId && (
        <div className="mb-4 sm:mb-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1 text-sm sm:text-base">Telegram xabarnomalar</h3>
              <p className="text-xs sm:text-sm text-blue-700">
                Yangi buyurtmalar haqida xabar olish uchun Telegram Chat ID ni kiriting
              </p>
            </div>
            <button
              onClick={() => setShowTelegramSetup(true)}
              className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-700 transition-all text-xs sm:text-sm whitespace-nowrap"
            >
              {telegramChatId ? 'O\'zgartirish' : 'Sozlash'}
            </button>
          </div>
        </div>
      )}

      {showTelegramSetup && currentUserId && (
        <TelegramChatIdForm
          userId={currentUserId}
          currentChatId={telegramChatId}
          onClose={() => setShowTelegramSetup(false)}
          onSuccess={async (chatId) => {
            setTelegramChatId(chatId || '');
            setShowTelegramSetup(false);
            alert('Telegram Chat ID saqlandi! Endi siz yangi buyurtmalar haqida xabar olasiz.');
          }}
        />
      )}

      {activeTab === 'products' && (
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Mahsulotlarni boshqarish</h2>
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowProductForm(true);
              }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all text-sm sm:text-base w-full sm:w-auto"
            >
              Mahsulot qo'shish
            </button>
          </div>
          {showProductForm && (
            <ProductForm
              product={editingProduct}
              onClose={() => {
                setShowProductForm(false);
                setEditingProduct(null);
              }}
              onSuccess={() => {
                setShowProductForm(false);
                setEditingProduct(null);
                fetchProducts();
              }}
            />
          )}
          {loading ? (
            <div className="text-center py-12">Yuklanmoqda...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-md p-3 sm:p-4">
                  <h3 className="text-base sm:text-lg font-semibold mb-2 text-gray-900">{product.name}</h3>
                  <p className="text-gray-800 text-xs sm:text-sm mb-2 line-clamp-2">{product.description}</p>
                  <p className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {product.price.toLocaleString()} so'm/{product.unit || 'dona'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-800 font-medium mb-3 sm:mb-4">
                    Mavjud: {product.stock}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setShowProductForm(true);
                      }}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
                    >
                      Tahrirlash
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="flex-1 bg-red-600 text-white px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm hover:bg-red-700"
                    >
                      O'chirish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Buyurtmalar</h2>
          {loading ? (
            <div className="text-center py-12">Yuklanmoqda...</div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-3 sm:gap-0 mb-4">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">Buyurtma #{order.id}</h3>
                      <p className="text-xs sm:text-sm text-gray-800">
                        {new Date(order.createdAt).toLocaleString('uz-UZ')}
                      </p>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                      <span className={`px-2 sm:px-3 py-1 rounded text-xs sm:text-sm inline-block ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'processing' ? 'bg-indigo-100 text-indigo-800' :
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status === 'pending' ? 'Kutayapti' :
                         order.status === 'processing' ? 'Qayta ishlanmoqda' :
                         order.status === 'completed' ? 'Yakunlangan' : 'Bekor qilindi'}
                      </span>
                      <p className="text-lg sm:text-xl font-bold mt-2">{order.total.toLocaleString()} so'm</p>
                    </div>
                  </div>
                  <div className="mb-4 text-sm sm:text-base">
                    <p className="mb-1"><strong>Telefon:</strong> {order.phone}</p>
                    <p><strong>Manzil:</strong> {order.address}</p>
                  </div>
                  <div className="mb-4">
                    <h4 className="font-medium mb-2 text-sm sm:text-base">Mahsulotlar:</h4>
                    <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
                      {order.items.map((item, idx) => (
                        <li key={idx}>
                          {item.productName} - {item.quantity} {item.unit || 'dona'} × {item.price.toLocaleString()} so'm/{item.unit || 'dona'}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'processing')}
                        className="flex-1 px-3 sm:px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all font-semibold text-sm sm:text-base"
                      >
                        ✅ Buyurtma qabul qilindi
                      </button>
                    )}
                    {order.status === 'processing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                        className="flex-1 px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all font-semibold text-sm sm:text-base"
                      >
                        🚚 Yetkazildi
                      </button>
                    )}
                    {order.status !== 'cancelled' && order.status !== 'completed' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md hover:shadow-lg transition-all font-semibold text-sm sm:text-base"
                      >
                        Bekor qilish
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Statistika</h2>
          {loading ? (
            <div className="text-center py-12">Yuklanmoqda...</div>
          ) : stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h3 className="text-gray-900 font-semibold mb-2 text-sm sm:text-base">Jami buyurtmalar</h3>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.orders.total}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h3 className="text-gray-900 font-semibold mb-2 text-sm sm:text-base">Kutayapti</h3>
                <p className="text-2xl sm:text-3xl font-bold text-amber-600">{stats.orders.pending}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h3 className="text-gray-900 font-semibold mb-2 text-sm sm:text-base">Daromad</h3>
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{stats.revenue.total.toLocaleString()} so'm</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h3 className="text-gray-900 font-semibold mb-2 text-sm sm:text-base">Mahsulotlar</h3>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.products.total}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                <h3 className="text-gray-900 font-semibold mb-2 text-sm sm:text-base">Past qoldiq</h3>
                <p className="text-2xl sm:text-3xl font-bold text-rose-600">{stats.products.lowStock}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">Ma'lumotlar yo'q</div>
          )}
        </div>
      )}

      {activeTab === 'subscription' && (
        <div className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Obuna ma'lumotlari</h2>

          {loading ? (
            <p className="text-gray-700 font-medium">Yuklanmoqda...</p>
          ) : subscription ? (
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border border-gray-200">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <span className="text-gray-700 font-medium">Oylik to'lov:</span>
                  <span className="text-xl font-bold text-gray-900">
                    {subscription.subscription_price ? `${subscription.subscription_price.toLocaleString()} so'm` : 'Bepul'}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <span className="text-gray-700 font-medium">Balans:</span>
                  <span className={`text-xl font-bold ${(subscription.subscription_balance || 0) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {subscription.subscription_balance?.toLocaleString() || '0'} so'm
                  </span>
                </div>
                {subscription.subscription_start_date ? (
                  <>
                    <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                      <span className="text-gray-700 font-medium">Boshlanish sanasi:</span>
                      <span className="text-gray-900 font-semibold">
                        {new Date(subscription.subscription_start_date).toLocaleDateString('uz-UZ', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    {subscription.daysRemaining !== null && (
                      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                        <span className="text-gray-700 font-medium">Keyingi to'lov:</span>
                        <span className="text-gray-900 font-semibold">
                          {subscription.daysRemaining > 0 
                            ? `${subscription.daysRemaining} kundan keyin` 
                            : subscription.daysRemaining === 0
                            ? 'Bugun'
                            : 'Kechikkan'}
                        </span>
                      </div>
                    )}
                    {subscription.nextPaymentDate && (
                      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                        <span className="text-gray-700 font-medium">To'lov sanasi:</span>
                        <span className="text-gray-900 font-semibold">
                          {new Date(subscription.nextPaymentDate).toLocaleDateString('uz-UZ', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                    {subscription.monthsSinceStart !== null && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Faol oylar soni:</span>
                        <span className="text-gray-900 font-semibold">{subscription.monthsSinceStart}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 font-medium">
                      ⚠️ Obuna hali boshlanmagan. Birinchi mahsulotni qo'shganda obuna avtomatik boshlanadi.
                    </p>
                  </div>
                )}
                {subscription.isActive && (
                  <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <p className="text-emerald-800 font-medium">
                      ✅ Obuna faol. Balans manfiy bo'lsa ham, magazin ishlashda davom etadi.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-700 font-medium">Ma'lumotlar topilmadi</p>
          )}
        </div>
      )}

      {activeTab === 'reports' && (
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Hisobot</h2>
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <p className="text-gray-800 mb-4 sm:mb-6 font-medium text-sm sm:text-base">
              Magazin statistikasini PDF formatida yuklab oling
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                onClick={() => downloadReport('week')}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all font-semibold text-sm sm:text-base"
              >
                📊 Haftalik hisobot yuklab olish
              </button>
              <button
                onClick={() => downloadReport('month')}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 shadow-md hover:shadow-lg transition-all font-semibold text-sm sm:text-base"
              >
                📈 Oylik hisobot yuklab olish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductForm({ product, onClose, onSuccess }: { product: Product | null; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price ?? '',
    unit: product?.unit || 'dona' as 'dona' | 'upakovka' | 'karobka',
    stock: product?.stock ?? '',
    image: product?.image || '',
    category: product?.category || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageMode, setImageMode] = useState<'url' | 'file'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Faqat rasm fayllari qabul qilinadi');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Fayl hajmi 5MB dan oshmasligi kerak');
        return;
      }
      setSelectedFile(file);
      setFormData({ ...formData, image: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let imageUrl = formData.image;

      // Если выбран файл, загружаем его
      if (imageMode === 'file' && selectedFile) {
        setUploadingImage(true);
        console.log('Начинаем загрузку файла:', selectedFile.name, selectedFile.size, selectedFile.type);
        
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        
        try {
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: uploadFormData,
          });

          console.log('Ответ от /api/upload:', uploadResponse.status, uploadResponse.statusText);

          if (!uploadResponse.ok) {
            const error = await uploadResponse.json();
            console.error('Ошибка загрузки:', error);
            alert(error.error || 'Rasmni yuklashda xatolik');
            setIsSubmitting(false);
            setUploadingImage(false);
            return;
          }

          const uploadData = await uploadResponse.json();
          console.log('Данные загрузки:', uploadData);
          imageUrl = uploadData.url;
          console.log('URL изображения:', imageUrl);
          setUploadingImage(false);
        } catch (uploadError) {
          console.error('Ошибка при загрузке файла:', uploadError);
          alert('Rasmni yuklashda xatolik: ' + (uploadError instanceof Error ? uploadError.message : 'Неизвестная ошибка'));
          setIsSubmitting(false);
          setUploadingImage(false);
          return;
        }
      }

      // Конвертируем пустые строки в 0 для отправки
      const submitData = { 
        ...formData, 
        image: imageUrl,
        price: formData.price === '' ? 0 : (typeof formData.price === 'number' ? formData.price : parseFloat(formData.price) || 0),
        stock: formData.stock === '' ? 0 : (typeof formData.stock === 'number' ? formData.stock : parseInt(formData.stock) || 0),
      };
      console.log('Данные для отправки:', { ...submitData, image: imageUrl, hasImage: !!imageUrl });
      
      if (product) {
        console.log('Обновление товара:', product.id);
        await productsApi.update(product.id, submitData);
      } else {
        console.log('Создание нового товара');
        const createdProduct = await productsApi.create(submitData);
        console.log('Товар создан:', createdProduct);
        console.log('URL изображения в созданном товаре:', createdProduct?.image);
        console.log('Есть ли изображение:', !!createdProduct?.image);
      }
      onSuccess();
    } catch (error) {
      alert('Mahsulotni saqlashda xatolik');
    } finally {
      setIsSubmitting(false);
      setUploadingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col">
        <div className="p-6 pb-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-xl font-bold">
            {product ? 'Mahsulotni tahrirlash' : 'Mahsulot qo\'shish'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 pt-4 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Nomi *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Tavsifi *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Narxi *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price === '' ? '' : formData.price}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, price: value === '' ? '' : parseFloat(value) || '' });
                }}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">O'lchov birligi *</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value as 'dona' | 'upakovka' | 'karobka' })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              >
                <option value="dona">Dona</option>
                <option value="upakovka">Upakovka</option>
                <option value="karobka">Karobka</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Miqdori *</label>
            <input
              type="number"
              value={formData.stock === '' ? '' : formData.stock}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({ ...formData, stock: value === '' ? '' : parseInt(value) || '' });
              }}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Rasm</label>
            <div className="mb-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setImageMode('url');
                  setSelectedFile(null);
                }}
                className={`px-3 py-1 text-sm rounded ${
                  imageMode === 'url'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300 font-medium'
                }`}
              >
                URL
              </button>
              <button
                type="button"
                onClick={() => {
                  setImageMode('file');
                  setFormData({ ...formData, image: '' });
                }}
                className={`px-3 py-1 text-sm rounded ${
                  imageMode === 'file'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300 font-medium'
                }`}
              >
                Fayl yuklash
              </button>
            </div>
            {imageMode === 'url' ? (
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            ) : (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                />
                {selectedFile && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-800 font-medium">Tanlangan: {selectedFile.name}</p>
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt="Preview"
                      className="mt-2 max-w-full h-32 object-contain rounded"
                    />
                  </div>
                )}
              </div>
            )}
            {(formData.image || selectedFile) && (
              <div className="mt-2">
                <p className="text-sm text-gray-900 mb-1 font-semibold">Ko'rinish:</p>
                <img
                  src={selectedFile ? URL.createObjectURL(selectedFile) : formData.image}
                  alt="Preview"
                  className="max-w-full h-32 object-contain rounded border border-gray-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Kategoriya</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            />
          </div>
          </div>
          <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:bg-gray-400 shadow-md hover:shadow-lg transition-all"
            >
              {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TelegramChatIdForm({ userId, currentChatId, onClose, onSuccess }: { userId: string; currentChatId: string; onClose: () => void; onSuccess: (chatId: string | null) => void }) {
  const [chatId, setChatId] = useState(currentChatId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (chatId && isNaN(Number(chatId))) {
      setError('Chat ID raqam bo\'lishi kerak');
      return;
    }

    setIsSubmitting(true);
    try {
      await userApi.updateTelegramChatId(userId, chatId ? Number(chatId) : null);
      onSuccess(chatId || null);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Chat ID ni saqlashda xatolik');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Telegram Chat ID sozlash</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Telegram Chat ID *</label>
            <input
              type="number"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="123456789"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            />
            <p className="text-xs text-gray-700 mt-1 font-medium">
              💡 Chat ID ni olish uchun @userinfobot ga /start yuboring
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-800 font-medium">
              <strong>Qanday olish:</strong><br />
              1. Telegram da @userinfobot ni oching<br />
              2. /start buyrug'ini yuboring<br />
              3. "Id" raqamini ko'chirib, bu yerga yozing
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:bg-gray-400 shadow-md hover:shadow-lg transition-all"
            >
              {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


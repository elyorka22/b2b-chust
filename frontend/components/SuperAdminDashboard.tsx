'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Product, Order } from '@/lib/db';
import { productsApi, ordersApi, statsApi, usersApi, telegramApi, botSettingsApi, userApi, contactPageApi, categoriesApi, subscriptionsApi } from '@/lib/api';
import { getCurrentUserFromToken } from '@/lib/auth';

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'users' | 'stats' | 'telegram' | 'settings' | 'subscriptions'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [salesStats, setSalesStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [telegramStats, setTelegramStats] = useState<any>(null);
  const [showSendMessageForm, setShowSendMessageForm] = useState(false);
  const [showWelcomeMessageForm, setShowWelcomeMessageForm] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState<string>('');
  const [users, setUsers] = useState<any[]>([]);
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showContactPageForm, setShowContactPageForm] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showBotButtonsForm, setShowBotButtonsForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [showBalanceForm, setShowBalanceForm] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
      fetchCategories();
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'stats') {
      fetchStats();
      fetchSalesStats();
    } else if (activeTab === 'telegram') {
      fetchTelegramStats();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'subscriptions') {
      fetchSubscriptions();
    }
  }, [activeTab]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Используем метод для админ-панели (с токеном)
      // Для супер-админа backend покажет все товары, для магазинов - только свои
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

  const fetchSalesStats = async () => {
    try {
      const data = await statsApi.getSales();
      setSalesStats(data);
    } catch (error) {
      console.error('Ошибка загрузки статистики продаж:', error);
    }
  };

  const fetchTelegramStats = async () => {
    setLoading(true);
    try {
      console.log('[ADMIN] Загрузка статистики Telegram...');
      const [statsData, settingsData] = await Promise.all([
        telegramApi.getStats(),
        botSettingsApi.get('welcome_message').catch(() => ({ value: '' })),
      ]);
      console.log('[ADMIN] Получена статистика:', statsData);
      console.log('[ADMIN] Статистика.stats:', statsData?.stats);
      console.log('[ADMIN] totalUsers:', statsData?.stats?.totalUsers);
      setTelegramStats(statsData);
      setWelcomeMessage(settingsData.value || '');
    } catch (error: any) {
      console.error('[ADMIN] Ошибка загрузки статистики Telegram:', error);
      console.error('[ADMIN] Детали ошибки:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Foydalanuvchilarni yuklashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Kategoriyalarni yuklashda xatolik:', error);
    }
  };

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await subscriptionsApi.getAll();
      setSubscriptions(data);
    } catch (error) {
      console.error('Obunalarni yuklashda xatolik:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Mahsulotni o\'chirish?')) return;
    try {
      await productsApi.delete(id);
      fetchProducts();
    } catch (error) {
      alert('Mahsulotni o\'chirishda xatolik');
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await ordersApi.update(orderId, { status });
      fetchOrders();
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
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Super-admin panel</h1>
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
                  setActiveTab('users');
                  setIsMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors font-semibold ${
                  activeTab === 'users' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
              >
                Foydalanuvchilar
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
                  setActiveTab('telegram');
                  setIsMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors font-semibold ${
                  activeTab === 'telegram' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
              >
                Telegram Bot
              </button>
              <button
                onClick={() => {
                  setActiveTab('settings');
                  setIsMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors font-semibold ${
                  activeTab === 'settings' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
              >
                Sozlamalar
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
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 transition-colors font-semibold ${activeTab === 'users' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-900 hover:text-indigo-600'}`}
          >
            Foydalanuvchilar
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 transition-colors font-semibold ${activeTab === 'stats' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-900 hover:text-indigo-600'}`}
          >
            Statistika
          </button>
          <button
            onClick={() => setActiveTab('telegram')}
            className={`px-4 py-2 transition-colors font-semibold ${activeTab === 'telegram' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-900 hover:text-indigo-600'}`}
          >
            Telegram Bot
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-4 py-2 transition-colors font-semibold ${activeTab === 'subscriptions' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-900 hover:text-indigo-600'}`}
          >
            Obunalar
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 transition-colors font-semibold ${activeTab === 'settings' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-900 hover:text-indigo-600'}`}
          >
            Sozlamalar
          </button>
        </div>
      </div>

      {activeTab === 'products' && (
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Mahsulotlarni boshqarish</h2>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setShowCategoryForm(true);
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all text-sm sm:text-base w-full sm:w-auto"
              >
                Kategoriya yaratish
              </button>
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
          </div>
          {showCategoryForm && (
            <CategoryForm
              onClose={() => setShowCategoryForm(false)}
              onSuccess={() => {
                setShowCategoryForm(false);
                fetchCategories();
                alert('Kategoriya yaratildi!');
              }}
            />
          )}
          {showProductForm && (
            <ProductForm
              product={editingProduct}
              users={users.filter(u => u.role === 'magazin')}
              categories={categories}
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
                  <p className="text-xs sm:text-sm text-gray-800 font-medium mb-3 sm:mb-4">Mavjud: {product.stock}</p>
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
                    {order.status === 'completed' && (
                      <div className="flex-1 px-3 sm:px-4 py-2 bg-green-100 text-green-800 rounded-lg text-center font-semibold text-sm sm:text-base">
                        ✅ Yakunlangan
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Foydalanuvchilar</h2>
            <button
              onClick={() => setShowUserForm(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all text-sm sm:text-base w-full sm:w-auto"
            >
              Foydalanuvchi yaratish
            </button>
          </div>
          {showUserForm && (
            <UserForm
              onClose={() => setShowUserForm(false)}
              onSuccess={() => {
                setShowUserForm(false);
                fetchUsers();
                alert('Foydalanuvchi yaratildi');
              }}
            />
          )}
          {loading ? (
            <div className="text-center py-12">Yuklanmoqda...</div>
          ) : (
            <div className="space-y-4 mt-4">
              {users.map((user) => (
                <div key={user.id} className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-3 sm:gap-0">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">{user.username}</h3>
                      <p className="text-sm text-gray-800 font-medium">
                        Rol: {user.role === 'super-admin' ? 'Super-admin' : 'Magazin'}
                      </p>
                      {user.storeName && (
                        <p className="text-sm text-gray-800 font-medium">Magazin: {user.storeName}</p>
                      )}
                      <p className="text-xs text-gray-700 mt-1">
                        Yaratilgan: {new Date(user.createdAt).toLocaleString('uz-UZ')}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setShowChangePasswordForm(true);
                        }}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all text-xs sm:text-sm"
                      >
                        Parolni o'zgartirish
                      </button>
                      {user.role !== 'super-admin' && (
                        <button
                          onClick={async () => {
                            if (!confirm(`"${user.storeName || user.username}" magazinini o'chirishni tasdiqlaysizmi? Bu amal barcha mahsulotlarni ham o'chiradi.`)) {
                              return;
                            }
                            try {
                              await usersApi.delete(user.id);
                              alert('Magazin muvaffaqiyatli o\'chirildi');
                              fetchUsers();
                            } catch (error: any) {
                              console.error('Ошибка удаления магазина:', error);
                              alert(error.response?.data?.error || 'Magazinni o\'chirishda xatolik');
                            }
                          }}
                          className="bg-red-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-red-700 shadow-md hover:shadow-lg transition-all text-xs sm:text-sm"
                        >
                          O'chirish
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {showChangePasswordForm && selectedUserId && (
            <ChangePasswordForm
              userId={selectedUserId}
              onClose={() => {
                setShowChangePasswordForm(false);
                setSelectedUserId(null);
              }}
              onSuccess={() => {
                setShowChangePasswordForm(false);
                setSelectedUserId(null);
                alert('Parol muvaffaqiyatli o\'zgartirildi!');
              }}
            />
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Statistika</h2>
          {loading ? (
            <div className="text-center py-12">Yuklanmoqda...</div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-gray-900 font-semibold mb-2">Jami buyurtmalar</h3>
                  <p className="text-3xl font-bold text-gray-900">{stats.orders.total}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-gray-900 font-semibold mb-2">Kutayapti</h3>
                  <p className="text-3xl font-bold text-amber-600">{stats.orders.pending}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-gray-900 font-semibold mb-2">Daromad</h3>
                  <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{stats.revenue.total.toLocaleString()} so'm</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-gray-900 font-semibold mb-2">Katalogdagi mahsulotlar</h3>
                  <p className="text-3xl font-bold text-gray-900">{stats.products.total}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-gray-900 font-semibold mb-2">Past qoldiq</h3>
                  <p className="text-3xl font-bold text-rose-600">{stats.products.lowStock}</p>
                </div>
              </div>

              {/* Статистика продаж */}
              {salesStats && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Eng ko'p sotilgan mahsulotlar</h3>
                  
                  {/* За неделю */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h4 className="text-lg font-bold mb-4 text-gray-900">Hafta bo'yicha (miqdor)</h4>
                      {salesStats.week?.byQuantity && salesStats.week.byQuantity.length > 0 ? (
                        <div className="space-y-3">
                          {salesStats.week.byQuantity.map((item: any, index: number) => (
                            <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-indigo-600 w-8">{index + 1}</span>
                                <div>
                                  <p className="font-medium text-gray-900">{item.productName}</p>
                                  <p className="text-sm text-gray-700 font-medium">Miqdor: {item.weekQuantity.toLocaleString()}</p>
                                </div>
                              </div>
                              <p className="text-sm font-semibold text-emerald-600">{item.weekRevenue.toLocaleString()} so'm</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-700 text-center py-4 font-medium">Hafta davomida sotilgan mahsulotlar yo'q</p>
                      )}
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h4 className="text-lg font-bold mb-4 text-gray-900">Hafta bo'yicha (daromad)</h4>
                      {salesStats.week?.byRevenue && salesStats.week.byRevenue.length > 0 ? (
                        <div className="space-y-3">
                          {salesStats.week.byRevenue.map((item: any, index: number) => (
                            <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-purple-600 w-8">{index + 1}</span>
                                <div>
                                  <p className="font-medium text-gray-900">{item.productName}</p>
                                  <p className="text-sm text-gray-700 font-medium">Daromad: {item.weekRevenue.toLocaleString()} so'm</p>
                                </div>
                              </div>
                              <p className="text-sm font-semibold text-gray-900">{item.weekQuantity.toLocaleString()} dona</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-700 text-center py-4 font-medium">Hafta davomida sotilgan mahsulotlar yo'q</p>
                      )}
                    </div>
                  </div>

                  {/* За месяц */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h4 className="text-lg font-bold mb-4 text-gray-900">Oy bo'yicha (miqdor)</h4>
                      {salesStats.month?.byQuantity && salesStats.month.byQuantity.length > 0 ? (
                        <div className="space-y-3">
                          {salesStats.month.byQuantity.map((item: any, index: number) => (
                            <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-emerald-600 w-8">{index + 1}</span>
                                <div>
                                  <p className="font-medium text-gray-900">{item.productName}</p>
                                  <p className="text-sm text-gray-500">Miqdor: {item.monthQuantity.toLocaleString()}</p>
                                </div>
                              </div>
                              <p className="text-sm font-semibold text-emerald-600">{item.monthRevenue.toLocaleString()} so'm</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-700 text-center py-4 font-medium">Oy davomida sotilgan mahsulotlar yo'q</p>
                      )}
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                      <h4 className="text-lg font-bold mb-4 text-gray-900">Oy bo'yicha (daromad)</h4>
                      {salesStats.month?.byRevenue && salesStats.month.byRevenue.length > 0 ? (
                        <div className="space-y-3">
                          {salesStats.month.byRevenue.map((item: any, index: number) => (
                            <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-teal-600 w-8">{index + 1}</span>
                                <div>
                                  <p className="font-medium text-gray-900">{item.productName}</p>
                                  <p className="text-sm text-gray-700 font-medium">Daromad: {item.monthRevenue.toLocaleString()} so'm</p>
                                </div>
                              </div>
                              <p className="text-sm font-semibold text-gray-900">{item.monthQuantity.toLocaleString()} dona</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-700 text-center py-4 font-medium">Oy davomida sotilgan mahsulotlar yo'q</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">Ma'lumotlar yo'q</div>
          )}
        </div>
      )}

      {activeTab === 'telegram' && (
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Telegram Bot boshqaruvi</h2>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowWelcomeMessageForm(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
              >
                Welcome xabar sozlash
              </button>
              <button
                onClick={() => setShowBotButtonsForm(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
              >
                Bot tugmalari sozlash
              </button>
              <button
                onClick={() => setShowSendMessageForm(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
              >
                Xabar yuborish
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">Yuklanmoqda...</div>
          ) : telegramStats ? (
            <div className="space-y-6">
              {telegramStats.botInfo && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Bot ma'lumotlari</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-900 font-semibold">Bot nomi:</p>
                      <p className="text-lg font-bold text-gray-900">{telegramStats.botInfo.first_name}</p>
                    </div>
                    {telegramStats.botInfo.username && (
                      <div>
                        <p className="text-gray-900 font-semibold">Username:</p>
                        <p className="text-lg font-bold text-gray-900">@{telegramStats.botInfo.username}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-900 font-semibold">Bot ID:</p>
                      <p className="text-lg font-bold text-gray-900">{telegramStats.botInfo.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold">Holati:</p>
                      <p className="text-lg font-bold text-green-600">Faol</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Statistika</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <p className="text-gray-900 text-sm mb-1 font-semibold">Jami foydalanuvchilar</p>
                    <p className="text-2xl font-bold text-blue-600">{telegramStats.stats?.totalUsers || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                    <p className="text-gray-900 text-sm mb-1 font-semibold">Jami xabarlar</p>
                    <p className="text-2xl font-bold text-green-600">{telegramStats.stats?.totalMessages || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                    <p className="text-gray-900 text-sm mb-1 font-semibold">Faol foydalanuvchilar</p>
                    <p className="text-2xl font-bold text-purple-600">{telegramStats.stats?.activeUsers || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                    <p className="text-gray-900 text-sm mb-1 font-semibold">Jami chatlar</p>
                    <p className="text-2xl font-bold text-orange-600">{telegramStats.stats?.totalChats || 0}</p>
                  </div>
                </div>
              </div>

              {!telegramStats.botInfo && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">
                    ⚠️ Telegram bot sozlanmagan. Iltimos, <code className="bg-yellow-100 px-2 py-1 rounded">TELEGRAM_BOT_TOKEN</code> ni o'zgaruvchilar muhitiga qo'shing.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-800 font-medium">Telegram bot statistikasi yuklanmoqda...</p>
            </div>
          )}

          {showSendMessageForm && (
            <SendMessageForm
              onClose={() => setShowSendMessageForm(false)}
              onSuccess={() => {
                setShowSendMessageForm(false);
                alert('Xabar yuborildi!');
              }}
            />
          )}

          {showWelcomeMessageForm && (
            <WelcomeMessageForm
              onClose={() => setShowWelcomeMessageForm(false)}
              onSuccess={() => {
                setShowWelcomeMessageForm(false);
                alert('Welcome xabar saqlandi!');
              }}
            />
          )}

          {showBotButtonsForm && (
            <BotButtonsForm
              onClose={() => setShowBotButtonsForm(false)}
              onSuccess={() => {
                setShowBotButtonsForm(false);
                alert('Bot tugmalari saqlandi!');
              }}
            />
          )}
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Obunalarni boshqarish</h2>
            <button
              onClick={async () => {
                try {
                  const result = await subscriptionsApi.updateMonthly();
                  alert(result.message || 'Obunalar yangilandi');
                  fetchSubscriptions();
                } catch (error: any) {
                  alert(error.response?.data?.error || 'Xatolik yuz berdi');
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium"
            >
              Oylik to'lovni yangilash
            </button>
          </div>

          {loading ? (
            <p className="text-gray-700 font-medium">Yuklanmoqda...</p>
          ) : subscriptions.length === 0 ? (
            <p className="text-gray-700 font-medium">Magazinlar topilmadi</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {subscriptions.map((sub: any) => (
                <div key={sub.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{sub.store_name || sub.username}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-medium">Oylik to'lov:</span>
                      <span className="text-gray-900 font-semibold">
                        {sub.subscription_price ? `${sub.subscription_price.toLocaleString()} so'm` : 'Bepul'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 font-medium">Balans:</span>
                      <span className={`font-semibold ${(sub.subscription_balance || 0) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {sub.subscription_balance?.toLocaleString() || '0'} so'm
                      </span>
                    </div>
                    {sub.subscription_start_date && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-700 font-medium">Boshlanish sanasi:</span>
                          <span className="text-gray-900 font-medium">
                            {new Date(sub.subscription_start_date).toLocaleDateString('uz-UZ')}
                          </span>
                        </div>
                        {sub.daysRemaining !== null && (
                          <div className="flex justify-between">
                            <span className="text-gray-700 font-medium">Keyingi to'lov:</span>
                            <span className="text-gray-900 font-medium">
                              {sub.daysRemaining > 0 ? `${sub.daysRemaining} kun` : 'Bugun'}
                            </span>
                          </div>
                        )}
                        {sub.monthsSinceStart !== null && (
                          <div className="flex justify-between">
                            <span className="text-gray-700 font-medium">Oylar soni:</span>
                            <span className="text-gray-900 font-medium">{sub.monthsSinceStart}</span>
                          </div>
                        )}
                      </>
                    )}
                    {!sub.subscription_start_date && (
                      <p className="text-gray-500 text-sm font-medium">Hali birinchi mahsulot qo'shilmagan</p>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setSelectedStore(sub);
                        setShowBalanceForm(true);
                      }}
                      className="w-full px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all font-medium"
                    >
                      Balansni yangilash
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showBalanceForm && selectedStore && (
        <BalanceUpdateForm
          store={selectedStore}
          onClose={() => {
            setShowBalanceForm(false);
            setSelectedStore(null);
          }}
          onSuccess={() => {
            setShowBalanceForm(false);
            setSelectedStore(null);
            fetchSubscriptions();
          }}
        />
      )}

      {activeTab === 'settings' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Sozlamalar</h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Sotuvchi bo'lish sahifasi</h3>
                  <p className="text-xs sm:text-sm text-gray-800 mt-1 font-medium">
                    Sotuvchilar uchun kontakt sahifasining ma'lumotlarini tahrirlash
                  </p>
                </div>
                <button
                  onClick={() => setShowContactPageForm(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all text-sm sm:text-base w-full sm:w-auto"
                >
                  Tahrirlash
                </button>
              </div>
              <div className="mt-4">
                <Link
                  href="/contact"
                  target="_blank"
                  className="text-indigo-600 hover:text-indigo-800 underline"
                >
                  Sahifani ko'rish →
                </Link>
              </div>
            </div>
          </div>

          {showContactPageForm && (
            <ContactPageForm
              onClose={() => setShowContactPageForm(false)}
              onSuccess={() => {
                setShowContactPageForm(false);
                alert('Ma\'lumotlar saqlandi!');
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function CategoryForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await categoriesApi.create(formData);
      onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Kategoriyani yaratishda xatolik');
      console.error('Ошибка создания категории:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-md w-full mx-2 sm:mx-0">
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-gray-200">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Kategoriya yaratish</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-4 sm:p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm mb-4">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Nomi *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="Kategoriya nomi"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Tavsifi</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Kategoriya tavsifi (ixtiyoriy)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-sm sm:text-base"
              />
            </div>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm sm:text-base"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:bg-gray-400 shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
            >
              {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProductForm({ product, users, categories, onClose, onSuccess }: { product: Product | null; users: any[]; categories: any[]; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price ?? '',
    unit: product?.unit || 'dona' as 'dona' | 'upakovka' | 'karobka',
    stock: product?.stock ?? '',
    image: product?.image || '',
    category: product?.category || '',
    storeId: product?.storeId || '',
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

      // Валидация storeId для super-admin
      if (!formData.storeId) {
        alert('Magazin tanlash majburiy!');
        setIsSubmitting(false);
        setUploadingImage(false);
        return;
      }

      // Конвертируем пустые строки в 0 для отправки
      const submitData = { 
        ...formData, 
        image: imageUrl,
        price: formData.price === '' ? 0 : (typeof formData.price === 'number' ? formData.price : parseFloat(formData.price) || 0),
        stock: formData.stock === '' ? 0 : (typeof formData.stock === 'number' ? formData.stock : parseInt(formData.stock) || 0),
        storeId: formData.storeId,
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
            <label className="block text-sm font-medium mb-1 text-gray-900">Magazin *</label>
            <select
              value={formData.storeId}
              onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            >
              <option value="">Magazin tanlang</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.storeName || user.username}
                </option>
              ))}
            </select>
          </div>
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
          <div className="grid grid-cols-2 gap-4">
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
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            >
              <option value="">Kategoriya tanlang</option>
              {categories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          </div>
          <div className="p-6 pt-4 border-t border-gray-200 flex gap-2 flex-shrink-0">
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

function UserForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'magazin' as 'magazin' | 'super-admin',
    storeName: '',
    subscriptionPrice: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Валидация на клиенте
    if (formData.role === 'magazin' && (!formData.storeName || formData.storeName.trim() === '')) {
      alert('Magazin nomi kiritilishi shart!');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await usersApi.create(formData);
      onSuccess();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Foydalanuvchi yaratishda xatolik';
      console.error('Ошибка создания пользователя:', error);
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Foydalanuvchi yaratish</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Foydalanuvchi nomi *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded text-gray-900 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Parol *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded text-gray-900 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Rol *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'magazin' | 'super-admin' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            >
              <option value="magazin">Magazin</option>
              <option value="super-admin">Super-admin</option>
            </select>
          </div>
          {formData.role === 'magazin' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">Magazin nomi *</label>
                <input
                  type="text"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  required={formData.role === 'magazin'}
                  placeholder="Magazin nomi"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-900">Oylik obuna narxi (so'm) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.subscriptionPrice}
                  onChange={(e) => setFormData({ ...formData, subscriptionPrice: e.target.value })}
                  required={formData.role === 'magazin'}
                  placeholder="Masalan: 110000 yoki 0 (bepul)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                />
                <p className="mt-1 text-xs text-gray-500">0 kiritsangiz, obuna bepul bo'ladi</p>
              </div>
            </>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:bg-gray-400 shadow-md hover:shadow-lg transition-all"
            >
              {isSubmitting ? 'Yaratilmoqda...' : 'Yaratish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SendMessageForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [sendMode, setSendMode] = useState<'single' | 'mass'>('single');
  const [chatId, setChatId] = useState('');
  const [message, setMessage] = useState('');
  const [webAppUrl, setWebAppUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (!message) {
      setError('Xabar matni kiritilishi shart');
      return;
    }

    if (sendMode === 'single' && !chatId) {
      setError('Chat ID kiritilishi shart');
      return;
    }

    setIsSubmitting(true);
    try {
      if (sendMode === 'single') {
        await telegramApi.send(parseInt(chatId), message, webAppUrl || undefined);
        setSuccessMessage('Xabar muvaffaqiyatli yuborildi!');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        const result = await telegramApi.sendMass(message, webAppUrl || undefined);
        setSuccessMessage(result.message || `Xabar ${result.successful} ta foydalanuvchiga yuborildi!`);
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Xabar yuborishda xatolik');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Xabar yuborish</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {successMessage}
            </div>
          )}
          
          {/* Переключатель режима отправки */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900">Yuborish turi</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSendMode('single');
                  setError('');
                  setSuccessMessage('');
                }}
                className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                  sendMode === 'single'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300 font-medium'
                }`}
              >
                Bitta foydalanuvchiga
              </button>
              <button
                type="button"
                onClick={() => {
                  setSendMode('mass');
                  setError('');
                  setSuccessMessage('');
                }}
                className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                  sendMode === 'mass'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300 font-medium'
                }`}
              >
                Barcha foydalanuvchilarga
              </button>
            </div>
          </div>

          {/* Поле Chat ID только для одиночной отправки */}
          {sendMode === 'single' && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Chat ID *</label>
              <input
                type="number"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                required={sendMode === 'single'}
                placeholder="123456789"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
              <p className="text-xs text-gray-700 mt-1 font-medium">
                Foydalanuvchi yoki guruh ID raqami
              </p>
            </div>
          )}

          {sendMode === 'mass' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                ⚠️ Xabar barcha bot foydalanuvchilariga yuboriladi. {`{name}`} - foydalanuvchi ismi bilan almashtiriladi.
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Xabar matni *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              placeholder="Xabar matnini kiriting..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Web App URL (ixtiyoriy)</label>
            <input
              type="url"
              value={webAppUrl}
              onChange={(e) => setWebAppUrl(e.target.value)}
              placeholder="https://your-app.railway.app"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Agar ko'rsatilsa, xabar bilan Web App tugmasi yuboriladi
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
              className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:bg-gray-400 shadow-md hover:shadow-lg transition-all"
            >
              {isSubmitting 
                ? (sendMode === 'mass' ? 'Yuborilmoqda...' : 'Yuborilmoqda...')
                : (sendMode === 'mass' ? 'Barchaga yuborish' : 'Yuborish')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChangePasswordForm({ userId, onClose, onSuccess }: { userId: string; onClose: () => void; onSuccess: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const currentUser = getCurrentUserFromToken();
  const isSuperAdmin = currentUser?.role === 'super-admin';
  const isOwnAccount = currentUser?.id === userId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 6) {
      setError('Yangi parol kamida 6 belgidan iborat bo\'lishi kerak');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Yangi parollar mos kelmaydi');
      return;
    }

    // Если это не супер-админ и не свой аккаунт, требуем текущий пароль
    if (!isSuperAdmin && !isOwnAccount) {
      setError('Siz faqat o\'z parolingizni o\'zgartirishingiz mumkin');
      return;
    }

    setIsSubmitting(true);
    try {
      // Супер-админ может менять пароль без текущего пароля
      await userApi.updatePassword(userId, isSuperAdmin ? null : currentPassword, newPassword);
      onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Parolni o\'zgartirishda xatolik');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Parolni o'zgartirish</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {!isSuperAdmin && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Joriy parol *</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required={!isSuperAdmin}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Yangi parol *</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            />
            <p className="text-xs text-gray-500 mt-1">Kamida 6 belgi</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Yangi parolni tasdiqlash *</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            />
          </div>
          {isSuperAdmin && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                ℹ️ Super-admin sifatida siz joriy parolni kiritmasdan parolni o'zgartirishingiz mumkin
              </p>
            </div>
          )}
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
              className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:bg-gray-400 shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
            >
              {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function WelcomeMessageForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    botSettingsApi.get('welcome_message')
      .then(data => {
        if (data && data.value !== null && data.value !== undefined) {
          setMessage(data.value);
        } else {
          // Если настройка не найдена, используем дефолтное значение
          setMessage('Salom, {name}! 👋\n\nB2B Chust do\'koniga xush kelibsiz!');
        }
      })
      .catch(error => {
        console.error('Ошибка загрузки welcome message:', error);
        // При ошибке используем дефолтное значение
        setMessage('Salom, {name}! 👋\n\nB2B Chust do\'koniga xush kelibsiz!');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!message.trim()) {
      setError('Xabar matni kiritilishi shart');
      return;
    }

    setIsSubmitting(true);
    try {
      await botSettingsApi.update('welcome_message', message);
      onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Xabarni saqlashda xatolik');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <p className="text-center">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Welcome xabar sozlash</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Xabar matni *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={6}
              placeholder="Salom, {name}! 👋&#10;&#10;B2B Chust do'koniga xush kelibsiz!"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              {`{name}`} - foydalanuvchi ismi bilan almashtiriladi
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-all font-medium"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:bg-gray-400 shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
            >
              {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BotButtonsForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [botAboutButtonText, setBotAboutButtonText] = useState('');
  const [botAboutMessage, setBotAboutMessage] = useState('');
  const [botPartnershipButtonText, setBotPartnershipButtonText] = useState('');
  const [botPartnershipMessage, setBotPartnershipMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [aboutButton, aboutMessage, partnershipButton, partnershipMessage] = await Promise.all([
          botSettingsApi.get('bot_about_button_text').catch(() => ({ value: 'ℹ️ Bot haqida' })),
          botSettingsApi.get('bot_about_message').catch(() => ({ value: '' })),
          botSettingsApi.get('bot_partnership_button_text').catch(() => ({ value: '🤝 Hamkorlik' })),
          botSettingsApi.get('bot_partnership_message').catch(() => ({ value: '' })),
        ]);

        setBotAboutButtonText(aboutButton.value || 'ℹ️ Bot haqida');
        setBotAboutMessage(aboutMessage.value || '');
        setBotPartnershipButtonText(partnershipButton.value || '🤝 Hamkorlik');
        setBotPartnershipMessage(partnershipMessage.value || '');
      } catch (error) {
        console.error('Ошибка загрузки настроек кнопок:', error);
      }
    };

    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await Promise.all([
        botSettingsApi.update('bot_about_button_text', botAboutButtonText),
        botSettingsApi.update('bot_about_message', botAboutMessage),
        botSettingsApi.update('bot_partnership_button_text', botPartnershipButtonText),
        botSettingsApi.update('bot_partnership_message', botPartnershipMessage),
      ]);

      onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Sozlamalarni saqlashda xatolik');
      console.error('Ошибка сохранения настроек кнопок:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col mx-2 sm:mx-0">
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Bot tugmalari sozlash</h3>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-4 sm:p-6 pt-3 sm:pt-4 overflow-y-auto flex-1 space-y-4 sm:space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            {/* Bot haqida */}
            <div className="border-b border-gray-200 pb-4">
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Bot haqida</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900">Tugma matni *</label>
                  <input
                    type="text"
                    value={botAboutButtonText}
                    onChange={(e) => setBotAboutButtonText(e.target.value)}
                    required
                    placeholder="ℹ️ Bot haqida"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900">Javob xabari *</label>
                  <textarea
                    value={botAboutMessage}
                    onChange={(e) => setBotAboutMessage(e.target.value)}
                    required
                    rows={4}
                    placeholder="Bu bot B2B Chust do'koni uchun yaratilgan..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>

            {/* Hamkorlik */}
            <div>
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Hamkorlik</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900">Tugma matni *</label>
                  <input
                    type="text"
                    value={botPartnershipButtonText}
                    onChange={(e) => setBotPartnershipButtonText(e.target.value)}
                    required
                    placeholder="🤝 Hamkorlik"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-900">Javob xabari *</label>
                  <textarea
                    value={botPartnershipMessage}
                    onChange={(e) => setBotPartnershipMessage(e.target.value)}
                    required
                    rows={4}
                    placeholder="Hamkorlik uchun biz bilan bog'laning..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm sm:text-base"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:bg-gray-400 shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
            >
              {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContactPageForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    phone: '',
    email: '',
    telegram: '',
    address: '',
    howItWorks: ['', '', '', ''],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contactPageApi.get()
      .then(data => {
        if (data) {
          setFormData({
            title: data.contact_page_title || '',
            description: data.contact_page_description || '',
            phone: data.contact_page_phone || '',
            email: data.contact_page_email || '',
            telegram: data.contact_page_telegram || '',
            address: data.contact_page_address || '',
            howItWorks: data.contact_page_how_it_works || ['', '', '', ''],
          });
        }
      })
      .catch(error => {
        console.error('Ошибка загрузки данных:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.description) {
      setError('Barcha majburiy maydonlarni to\'ldiring');
      return;
    }

    setIsSubmitting(true);
    try {
      await contactPageApi.update({
        title: formData.title,
        description: formData.description,
        phone: formData.phone,
        email: formData.email,
        telegram: formData.telegram,
        address: formData.address,
        howItWorks: formData.howItWorks.filter(item => item.trim() !== ''),
      });
      onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Ma\'lumotlarni saqlashda xatolik');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addHowItWorksItem = () => {
    setFormData({
      ...formData,
      howItWorks: [...formData.howItWorks, ''],
    });
  };

  const removeHowItWorksItem = (index: number) => {
    setFormData({
      ...formData,
      howItWorks: formData.howItWorks.filter((_, i) => i !== index),
    });
  };

  const updateHowItWorksItem = (index: number, value: string) => {
    const newHowItWorks = [...formData.howItWorks];
    newHowItWorks[index] = value;
    setFormData({
      ...formData,
      howItWorks: newHowItWorks,
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
          <div className="text-center py-12">Yuklanmoqda...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full my-8">
        <h3 className="text-xl font-bold mb-4">Sotuvchi bo'lish sahifasini tahrirlash</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Sarlavha *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Tavsif *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Telefon</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Telegram</label>
              <input
                type="text"
                value={formData.telegram}
                onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Manzil</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Qanday ishlaydi?</label>
            <div className="space-y-2">
              {formData.howItWorks.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateHowItWorksItem(index, e.target.value)}
                    placeholder={`${index + 1}-qadam`}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
                  />
                  {formData.howItWorks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeHowItWorksItem(index)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      O'chirish
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addHowItWorksItem}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-900 font-medium"
              >
                + Qadam qo'shish
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-900 font-medium"
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

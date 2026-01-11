'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Product, Order } from '@/lib/db';
import { productsApi, ordersApi, statsApi, usersApi, telegramApi, botSettingsApi, userApi, contactPageApi } from '@/lib/api';
import { getCurrentUserFromToken } from '@/lib/auth';

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'users' | 'stats' | 'telegram' | 'settings'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);
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

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'stats') {
      fetchStats();
    } else if (activeTab === 'telegram') {
      fetchTelegramStats();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productsApi.getAll();
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

  const fetchTelegramStats = async () => {
    setLoading(true);
    try {
      const [statsData, settingsData] = await Promise.all([
        telegramApi.getStats(),
        botSettingsApi.get('welcome_message').catch(() => ({ value: '' })),
      ]);
      setTelegramStats(statsData);
      setWelcomeMessage(settingsData.value || '');
    } catch (error) {
      console.error('Telegram statistikani yuklashda xatolik:', error);
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
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Super-admin panel</h1>

      <div className="mb-6 flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 transition-colors ${activeTab === 'products' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-700 hover:text-indigo-600'}`}
        >
          Mahsulotlar
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 transition-colors ${activeTab === 'orders' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'hover:text-indigo-600'}`}
        >
          Buyurtmalar
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 transition-colors ${activeTab === 'users' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'hover:text-indigo-600'}`}
        >
          Foydalanuvchilar
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 transition-colors ${activeTab === 'stats' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'hover:text-indigo-600'}`}
        >
          Statistika
        </button>
        <button
          onClick={() => setActiveTab('telegram')}
          className={`px-4 py-2 transition-colors ${activeTab === 'telegram' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'hover:text-indigo-600'}`}
        >
          Telegram Bot
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 transition-colors ${activeTab === 'settings' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'hover:text-indigo-600'}`}
        >
          Sozlamalar
        </button>
      </div>

      {activeTab === 'products' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">Mahsulotlarni boshqarish</h2>
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowProductForm(true);
              }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                  <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                  <p className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    {product.price.toLocaleString()} so'm/{product.unit || 'dona'}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">Mavjud: {product.stock}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingProduct(product);
                        setShowProductForm(true);
                      }}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1 rounded-lg text-sm hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
                    >
                      Tahrirlash
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="flex-1 bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700"
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
          <h2 className="text-2xl font-semibold mb-4">Buyurtmalar</h2>
          {loading ? (
            <div className="text-center py-12">Yuklanmoqda...</div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Buyurtma #{order.id}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleString('uz-UZ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded text-sm ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'processing' ? 'bg-indigo-100 text-indigo-800' :
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status === 'pending' ? 'Kutayapti' :
                         order.status === 'processing' ? 'Qayta ishlanmoqda' :
                         order.status === 'completed' ? 'Yakunlangan' : 'Bekor qilindi'}
                      </span>
                      <p className="text-xl font-bold mt-2">{order.total.toLocaleString()} so'm</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p><strong>Telefon:</strong> {order.phone}</p>
                    <p><strong>Manzil:</strong> {order.address}</p>
                  </div>
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Mahsulotlar:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {order.items.map((item, idx) => (
                        <li key={idx}>
                          {item.productName} - {item.quantity} {item.unit || 'dona'} × {item.price.toLocaleString()} so'm/{item.unit || 'dona'}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                      className="px-4 py-2 border border-gray-300 rounded"
                    >
                      <option value="pending">Kutayapti</option>
                      <option value="processing">Qayta ishlanmoqda</option>
                      <option value="completed">Yakunlangan</option>
                      <option value="cancelled">Bekor qilindi</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">Foydalanuvchilar</h2>
            <button
              onClick={() => setShowUserForm(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
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
                <div key={user.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{user.username}</h3>
                      <p className="text-sm text-gray-600">
                        Rol: {user.role === 'super-admin' ? 'Super-admin' : 'Magazin'}
                      </p>
                      {user.storeName && (
                        <p className="text-sm text-gray-600">Magazin: {user.storeName}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Yaratilgan: {new Date(user.createdAt).toLocaleString('uz-UZ')}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setShowChangePasswordForm(true);
                      }}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all text-sm"
                    >
                      Parolni o'zgartirish
                    </button>
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
          <h2 className="text-2xl font-semibold mb-4">Statistika</h2>
          {loading ? (
            <div className="text-center py-12">Yuklanmoqda...</div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-gray-600 mb-2">Jami buyurtmalar</h3>
                <p className="text-3xl font-bold">{stats.orders.total}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-gray-600 mb-2">Kutayapti</h3>
                <p className="text-3xl font-bold text-amber-600">{stats.orders.pending}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-gray-600 mb-2">Daromad</h3>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{stats.revenue.total.toLocaleString()} so'm</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-gray-600 mb-2">Katalogdagi mahsulotlar</h3>
                <p className="text-3xl font-bold">{stats.products.total}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-gray-600 mb-2">Past qoldiq</h3>
                <p className="text-3xl font-bold text-rose-600">{stats.products.lowStock}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">Ma'lumotlar yo'q</div>
          )}
        </div>
      )}

      {activeTab === 'telegram' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">Telegram Bot boshqaruvi</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowWelcomeMessageForm(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all"
              >
                Welcome xabar sozlash
              </button>
              <button
                onClick={() => setShowSendMessageForm(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
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
                  <h3 className="text-xl font-semibold mb-4">Bot ma'lumotlari</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-600">Bot nomi:</p>
                      <p className="text-lg font-medium">{telegramStats.botInfo.first_name}</p>
                    </div>
                    {telegramStats.botInfo.username && (
                      <div>
                        <p className="text-gray-600">Username:</p>
                        <p className="text-lg font-medium">@{telegramStats.botInfo.username}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-gray-600">Bot ID:</p>
                      <p className="text-lg font-medium">{telegramStats.botInfo.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Holati:</p>
                      <p className="text-lg font-medium text-green-600">Faol</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">Statistika</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                    <p className="text-gray-600 text-sm mb-1">Jami foydalanuvchilar</p>
                    <p className="text-2xl font-bold text-blue-600">{telegramStats.stats?.totalUsers || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                    <p className="text-gray-600 text-sm mb-1">Jami xabarlar</p>
                    <p className="text-2xl font-bold text-green-600">{telegramStats.stats?.totalMessages || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                    <p className="text-gray-600 text-sm mb-1">Faol foydalanuvchilar</p>
                    <p className="text-2xl font-bold text-purple-600">{telegramStats.stats?.activeUsers || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
                    <p className="text-gray-600 text-sm mb-1">Jami chatlar</p>
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
              <p className="text-gray-500">Telegram bot statistikasi yuklanmoqda...</p>
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
        </div>
      )}

      {activeTab === 'settings' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">Sozlamalar</h2>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-semibold">Sotuvchi bo'lish sahifasi</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Sotuvchilar uchun kontakt sahifasining ma'lumotlarini tahrirlash
                  </p>
                </div>
                <button
                  onClick={() => setShowContactPageForm(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
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

function ProductForm({ product, onClose, onSuccess }: { product: Product | null; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    unit: product?.unit || 'dona' as 'dona' | 'upakovka' | 'karobka',
    stock: product?.stock || 0,
    image: product?.image || '',
    category: product?.category || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (product) {
        await productsApi.update(product.id, formData);
      } else {
        await productsApi.create(formData);
      }
      onSuccess();
    } catch (error) {
      alert('Mahsulotni saqlashda xatolik');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">
          {product ? 'Mahsulotni tahrirlash' : 'Mahsulot qo\'shish'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Nomi *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Tavsifi *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Narxi *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">O'lchov birligi *</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value as 'dona' | 'upakovka' | 'karobka' })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Rasm (URL)</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Kategoriya</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await usersApi.create(formData);
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Foydalanuvchi yaratishda xatolik');
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
              className="w-full px-4 py-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Parol *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Rol *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'magazin' | 'super-admin' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="magazin">Magazin</option>
              <option value="super-admin">Super-admin</option>
            </select>
          </div>
          {formData.role === 'magazin' && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Magazin nomi *</label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                required={formData.role === 'magazin'}
                placeholder="Magazin nomi"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
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
  const [chatId, setChatId] = useState('');
  const [message, setMessage] = useState('');
  const [webAppUrl, setWebAppUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!chatId || !message) {
      setError('Chat ID va xabar matni kiritilishi shart');
      return;
    }

    setIsSubmitting(true);
    try {
      await telegramApi.send(parseInt(chatId), message, webAppUrl || undefined);
      onSuccess();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Xabar yuborishda xatolik');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Xabar yuborish</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Chat ID *</label>
            <input
              type="number"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              required
              placeholder="123456789"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Foydalanuvchi yoki guruh ID raqami
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Xabar matni *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              placeholder="Xabar matnini kiriting..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Web App URL (ixtiyoriy)</label>
            <input
              type="url"
              value={webAppUrl}
              onChange={(e) => setWebAppUrl(e.target.value)}
              placeholder="https://your-app.railway.app"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
              {isSubmitting ? 'Yuborilmoqda...' : 'Yuborish'}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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

    if (!formData.title || !formData.description || !formData.phone || !formData.email) {
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-900">Tavsif *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Telefon *</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Manzil</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                + Qadam qo'shish
              </button>
            </div>
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
              {isSubmitting ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Product, Order } from '@/lib/db';
import { productsApi, ordersApi, statsApi, userApi } from '@/lib/api';
import { getCurrentUserFromToken, getAuthToken } from '@/lib/auth';

interface StoreDashboardProps {
  storeName?: string;
}

export default function StoreDashboard({ storeName }: StoreDashboardProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'stats'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts();
    } else if (activeTab === 'orders') {
      fetchOrders();
    } else if (activeTab === 'stats') {
      fetchStats();
    }
  }, [activeTab]);

  const [telegramChatId, setTelegramChatId] = useState<string>('');
  const [showTelegramSetup, setShowTelegramSetup] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
    <div>
      <h1 className="text-3xl font-bold mb-2">Magazin paneli</h1>
      {storeName && (
        <p className="text-gray-600 mb-6">Magazin: {storeName}</p>
      )}

      {/* Telegram Chat ID настройка */}
      {currentUserId && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Telegram xabarnomalar</h3>
              <p className="text-sm text-blue-700">
                Yangi buyurtmalar haqida xabar olish uchun Telegram Chat ID ni kiriting
              </p>
            </div>
            <button
              onClick={() => setShowTelegramSetup(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all text-sm"
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

      <div className="mb-6 flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 transition-colors ${activeTab === 'products' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'hover:text-indigo-600'}`}
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
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 transition-colors ${activeTab === 'stats' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'hover:text-indigo-600'}`}
        >
          Statistika
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
                  <p className="text-sm text-gray-500 mb-4">
                    Mavjud: {product.stock}
                  </p>
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
                </div>
              ))}
            </div>
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
                <h3 className="text-gray-600 mb-2">Mahsulotlar</h3>
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

      const submitData = { ...formData, image: imageUrl };
      console.log('Данные для отправки:', { ...submitData, image: imageUrl, hasImage: !!imageUrl });
      
      if (product) {
        console.log('Обновление товара:', product.id);
        await productsApi.update(product.id, submitData);
      } else {
        console.log('Создание нового товара');
        const createdProduct = await productsApi.create(submitData);
        console.log('Товар создан:', createdProduct);
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900">Narxi *</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
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
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
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
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
                    <p className="text-sm text-gray-600">Tanlangan: {selectedFile.name}</p>
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
                <p className="text-sm text-gray-600 mb-1">Ko'rinish:</p>
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
            <p className="text-xs text-gray-500 mt-1">
              💡 Chat ID ni olish uchun @userinfobot ga /start yuboring
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">
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


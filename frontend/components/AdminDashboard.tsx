'use client';

import { useEffect, useState } from 'react';
import { Order } from '@/lib/db';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'completed'>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Buyurtmalarni yuklashda xatolik:', error);
    } finally {
      setLoading(false);
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
      } else {
        alert('Buyurtma holatini yangilashda xatolik');
      }
    } catch (error) {
      alert('Buyurtma holatini yangilashda xatolik');
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

  if (loading) {
    return <div className="text-center py-12">Yuklanmoqda...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Admin panel</h1>
      <p className="text-gray-600 mb-6">Buyurtmalarni ko'rish va boshqarish</p>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-all ${filter === 'all' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          Barchasi
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg transition-all ${filter === 'pending' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          Kutayapti ({orders.filter(o => o.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('processing')}
          className={`px-4 py-2 rounded-lg transition-all ${filter === 'processing' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          Qayta ishlanmoqda ({orders.filter(o => o.status === 'processing').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg transition-all ${filter === 'completed' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          Yakunlangan ({orders.filter(o => o.status === 'completed').length})
        </button>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Buyurtmalar yo'q</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Buyurtma #{order.id}</h3>
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
                {order.status === 'pending' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'processing')}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
                  >
                    Qayta ishlashga olish
                  </button>
                )}
                {order.status === 'processing' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Yakunlash
                  </button>
                )}
                {order.status !== 'cancelled' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'cancelled')}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
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
  );
}

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireAuth();
    
    let orders = db.orders.getAll();
    let products = db.products.getAll();
    
    // Если это магазин, фильтруем по его товарам
    if (user.role === 'magazin') {
      products = products.filter(p => p.storeId === user.id);
      
      // Фильтруем заказы, оставляя только те, где есть товары этого магазина
      orders = orders.map(order => {
        const storeItems = order.items.filter(item => {
          const product = db.products.getById(item.productId);
          return product && product.storeId === user.id;
        });
        
        if (storeItems.length === 0) return null;
        
        return {
          ...order,
          items: storeItems,
          total: storeItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        };
      }).filter(Boolean) as typeof orders;
    }
    
    const totalRevenue = orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + o.total, 0);
    
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const processingOrders = orders.filter(o => o.status === 'processing').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.stock < 10).length;
    
    const stats = {
      orders: {
        total: orders.length,
        pending: pendingOrders,
        processing: processingOrders,
        completed: completedOrders,
      },
      revenue: {
        total: totalRevenue,
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts,
      },
    };
    
    return NextResponse.json(stats);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      );
    }
    if (error.message === 'Forbidden') {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Ошибка при получении статистики' },
      { status: 500 }
    );
  }
}


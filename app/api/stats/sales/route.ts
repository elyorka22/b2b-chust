import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db-wrapper';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireAuth();
    
    const db = await getDb();
    let orders = await db.orders.getAll();
    
    // Фильтруем только завершенные заказы
    const completedOrders = orders.filter(o => o.status === 'completed');
    
    // Если это магазин, фильтруем по его товарам
    if (user.role === 'magazin') {
      const products = await db.products.getAll();
      const storeProducts = products.filter(p => p.storeId === user.id);
      const storeProductIds = new Set(storeProducts.map(p => p.id));
      
      completedOrders = completedOrders.map(order => {
        const storeItems = order.items.filter(item => storeProductIds.has(item.productId));
        if (storeItems.length === 0) return null;
        return {
          ...order,
          items: storeItems,
        };
      }).filter(Boolean) as typeof completedOrders;
    }
    
    // Функция для получения начала недели
    const getWeekStart = (date: Date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Понедельник
      return new Date(d.setDate(diff));
    };
    
    // Функция для получения начала месяца
    const getMonthStart = (date: Date) => {
      return new Date(date.getFullYear(), date.getMonth(), 1);
    };
    
    const now = new Date();
    const weekStart = getWeekStart(now);
    const monthStart = getMonthStart(now);
    
    // Группируем товары по productId
    const productStats: Record<string, {
      productId: string;
      productName: string;
      totalQuantity: number;
      totalRevenue: number;
      weekQuantity: number;
      weekRevenue: number;
      monthQuantity: number;
      monthRevenue: number;
    }> = {};
    
    completedOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const isThisWeek = orderDate >= weekStart;
      const isThisMonth = orderDate >= monthStart;
      
      order.items.forEach(item => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            totalQuantity: 0,
            totalRevenue: 0,
            weekQuantity: 0,
            weekRevenue: 0,
            monthQuantity: 0,
            monthRevenue: 0,
          };
        }
        
        const revenue = item.price * item.quantity;
        productStats[item.productId].totalQuantity += item.quantity;
        productStats[item.productId].totalRevenue += revenue;
        
        if (isThisWeek) {
          productStats[item.productId].weekQuantity += item.quantity;
          productStats[item.productId].weekRevenue += revenue;
        }
        
        if (isThisMonth) {
          productStats[item.productId].monthQuantity += item.quantity;
          productStats[item.productId].monthRevenue += revenue;
        }
      });
    });
    
    // Преобразуем в массив и сортируем
    const allProducts = Object.values(productStats);
    
    const topByWeek = [...allProducts]
      .filter(p => p.weekQuantity > 0)
      .sort((a, b) => b.weekQuantity - a.weekQuantity)
      .slice(0, 10);
    
    const topByMonth = [...allProducts]
      .filter(p => p.monthQuantity > 0)
      .sort((a, b) => b.monthQuantity - a.monthQuantity)
      .slice(0, 10);
    
    const topByRevenueWeek = [...allProducts]
      .filter(p => p.weekRevenue > 0)
      .sort((a, b) => b.weekRevenue - a.weekRevenue)
      .slice(0, 10);
    
    const topByRevenueMonth = [...allProducts]
      .filter(p => p.monthRevenue > 0)
      .sort((a, b) => b.monthRevenue - a.monthRevenue)
      .slice(0, 10);
    
    return NextResponse.json({
      week: {
        byQuantity: topByWeek,
        byRevenue: topByRevenueWeek,
      },
      month: {
        byQuantity: topByMonth,
        byRevenue: topByRevenueMonth,
      },
    });
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
    console.error('Ошибка получения статистики продаж:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка при получении статистики продаж' },
      { status: 500 }
    );
  }
}





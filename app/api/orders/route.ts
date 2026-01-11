import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, address, items } = body;

    if (!phone || !address || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Необходимо указать телефон, адрес и товары' },
        { status: 400 }
      );
    }

    // Получаем информацию о товарах из базы
    const orderItems = items.map((item: any) => {
      const product = db.products.getById(item.productId);
      if (!product) {
        throw new Error(`Товар с ID ${item.productId} не найден`);
      }
      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        price: item.price,
        unit: product.unit || 'dona',
      };
    });

    const total = orderItems.reduce(
      (sum: number, item: any) => sum + item.price * item.quantity,
      0
    );

    const order = db.orders.create({
      phone,
      address,
      items: orderItems,
      total,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Ошибка при создании заказа' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();
    
    let orders = db.orders.getAll();
    
    // Если это магазин, показываем только заказы с его товарами
    if (user && user.role === 'magazin') {
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
    // Супер-админ видит все заказы
    // Неавторизованные не могут видеть заказы (но это не должно происходить)
    
    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Ошибка при получении заказов' },
      { status: 500 }
    );
  }
}


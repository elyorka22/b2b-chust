import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Пытаемся получить текущего пользователя (необязательно)
    let user = null;
    try {
      const { getCurrentUser } = await import('@/lib/auth');
      user = await getCurrentUser();
    } catch {
      // Если не авторизован, показываем все товары
    }

    let products = db.products.getAll();
    
    // Если это магазин, показываем только его товары
    if (user && user.role === 'magazin') {
      products = products.filter(p => p.storeId === user.id);
    }
    // Если супер-админ, показываем все товары
    // Если не авторизован, показываем все товары (для клиентов)

    return NextResponse.json(products);
  } catch (error: any) {
    // В случае ошибки показываем все товары
    const products = db.products.getAll();
    return NextResponse.json(products);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name, description, price, unit, image, category, stock } = body;

    if (!name || !description || price === undefined || stock === undefined || !unit) {
      return NextResponse.json(
        { error: 'Необходимо указать название, описание, цену, единицу измерения и количество' },
        { status: 400 }
      );
    }

    // Если это магазин, добавляем storeId
    const storeId = user.role === 'magazin' ? user.id : undefined;

    const product = db.products.create({
      name,
      description,
      price: parseFloat(price),
      unit: unit || 'dona',
      image,
      category,
      stock: parseInt(stock),
      storeId,
    });

    return NextResponse.json(product, { status: 201 });
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
      { error: error.message || 'Ошибка при создании товара' },
      { status: 500 }
    );
  }
}


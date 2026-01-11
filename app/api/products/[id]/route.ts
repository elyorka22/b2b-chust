import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const product = db.products.getById(id);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Товар не найден' },
        { status: 404 }
      );
    }

    // Магазин может редактировать только свои товары
    if (user.role === 'magazin' && product.storeId !== user.id) {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const updatedProduct = db.products.update(id, body);
    
    return NextResponse.json(updatedProduct);
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
      { error: error.message || 'Ошибка при обновлении товара' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const product = db.products.getById(id);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Товар не найден' },
        { status: 404 }
      );
    }

    // Магазин может удалять только свои товары
    if (user.role === 'magazin' && product.storeId !== user.id) {
      return NextResponse.json(
        { error: 'Недостаточно прав' },
        { status: 403 }
      );
    }

    const success = db.products.delete(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Товар не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
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
      { error: error.message || 'Ошибка при удалении товара' },
      { status: 500 }
    );
  }
}


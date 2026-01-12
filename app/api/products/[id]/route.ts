import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db-wrapper';
import { requireAuth } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const db = await getDb();
    const product = await db.products.getById(id);
    
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
    console.log('Обновление товара:', { id, image: body.image, hasImage: !!body.image });
    const updatedProduct = await db.products.update(id, body);
    
    if (!updatedProduct) {
      return NextResponse.json(
        { error: 'Товар не найден' },
        { status: 404 }
      );
    }
    
    console.log('Товар обновлен:', { id: updatedProduct.id, image: updatedProduct.image });
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
    const db = await getDb();
    const product = await db.products.getById(id);
    
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

    const success = await db.products.delete(id);
    
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


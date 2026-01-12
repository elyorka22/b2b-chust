import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 400 }
      );
    }

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Файл должен быть изображением' },
        { status: 400 }
      );
    }

    // Проверяем размер файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Размер файла не должен превышать 5MB' },
        { status: 400 }
      );
    }

    // Создаем уникальное имя файла
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${timestamp}-${randomString}.${extension}`;
    const filePath = `products/${filename}`;

    // Конвертируем File в ArrayBuffer, затем в Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Загружаем файл в Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('product-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Ошибка при загрузке в Supabase Storage:', uploadError);
      
      // Если bucket не существует, пытаемся создать его
      if (uploadError.message?.includes('Bucket not found')) {
        const { error: createError } = await supabaseAdmin.storage.createBucket('product-images', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        });

        if (createError) {
          console.error('Ошибка при создании bucket:', createError);
          return NextResponse.json(
            { error: 'Не удалось создать хранилище для изображений. Обратитесь к администратору.' },
            { status: 500 }
          );
        }

        // Повторная попытка загрузки после создания bucket
        const { data: retryData, error: retryError } = await supabaseAdmin.storage
          .from('product-images')
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (retryError) {
          return NextResponse.json(
            { error: retryError.message || 'Ошибка при загрузке файла' },
            { status: 500 }
          );
        }

        // Получаем публичный URL
        const { data: urlData } = supabaseAdmin.storage
          .from('product-images')
          .getPublicUrl(filePath);

        return NextResponse.json({ url: urlData.publicUrl }, { status: 200 });
      }

      return NextResponse.json(
        { error: uploadError.message || 'Ошибка при загрузке файла' },
        { status: 500 }
      );
    }

    // Получаем публичный URL загруженного файла
    const { data: urlData } = supabaseAdmin.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return NextResponse.json({ url: urlData.publicUrl }, { status: 200 });
  } catch (error: any) {
    console.error('Ошибка при загрузке файла:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка при загрузке файла' },
      { status: 500 }
    );
  }
}


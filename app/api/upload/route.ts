import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

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

    // Пытаемся загрузить в Supabase Storage, если доступен
    let supabaseAdmin: any = null;
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabaseModule = await import('@/lib/supabase');
        supabaseAdmin = supabaseModule.supabaseAdmin;
      }
    } catch (error) {
      console.warn('Supabase не доступен, будет использовано локальное хранилище');
    }

    if (supabaseAdmin) {
      try {
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('product-images')
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (!uploadError) {
          // Получаем публичный URL загруженного файла
          const { data: urlData } = supabaseAdmin.storage
            .from('product-images')
            .getPublicUrl(filePath);

          return NextResponse.json({ url: urlData.publicUrl }, { status: 200 });
        }

        // Если bucket не существует, пытаемся создать его
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
          const { error: createError } = await supabaseAdmin.storage.createBucket('product-images', {
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          });

          if (!createError) {
            // Повторная попытка загрузки после создания bucket
            const { data: retryData, error: retryError } = await supabaseAdmin.storage
              .from('product-images')
              .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false,
              });

            if (!retryError) {
              const { data: urlData } = supabaseAdmin.storage
                .from('product-images')
                .getPublicUrl(filePath);

              return NextResponse.json({ url: urlData.publicUrl }, { status: 200 });
            }
          }
        }

        console.warn('Не удалось загрузить в Supabase Storage, используем локальное хранилище:', uploadError.message);
      } catch (supabaseError: any) {
        console.warn('Ошибка при работе с Supabase Storage, используем локальное хранилище:', supabaseError.message);
      }
    }

    // Fallback: сохраняем локально в public/uploads
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const localFilePath = join(uploadsDir, filename);
    await writeFile(localFilePath, buffer);

    // Возвращаем URL файла
    const url = `/uploads/${filename}`;
    return NextResponse.json({ url }, { status: 200 });
  } catch (error: any) {
    console.error('Ошибка при загрузке файла:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json(
      { 
        error: error.message || 'Ошибка при загрузке файла',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}


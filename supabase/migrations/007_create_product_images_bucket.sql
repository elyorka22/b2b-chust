-- Создание bucket для изображений товаров
-- Выполните этот скрипт в Supabase SQL Editor

-- Создаем bucket для изображений товаров
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true, -- Публичный bucket для доступа к изображениям
  5242880, -- 5MB лимит размера файла
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'] -- Разрешенные типы файлов
)
ON CONFLICT (id) DO NOTHING;

-- Политика для публичного чтения изображений (SELECT)
-- Позволяет всем пользователям читать файлы из bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public Access for product-images'
  ) THEN
    CREATE POLICY "Public Access for product-images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'product-images');
  END IF;
END $$;

-- Политика для загрузки файлов (INSERT)
-- Позволяет аутентифицированным пользователям загружать файлы
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload images'
  ) THEN
    CREATE POLICY "Authenticated users can upload images"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = 'product-images' 
      AND (storage.foldername(name))[1] = 'products'
    );
  END IF;
END $$;

-- Политика для обновления файлов (UPDATE)
-- Позволяет аутентифицированным пользователям обновлять файлы
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can update images'
  ) THEN
    CREATE POLICY "Authenticated users can update images"
    ON storage.objects
    FOR UPDATE
    USING (
      bucket_id = 'product-images' 
      AND (storage.foldername(name))[1] = 'products'
    );
  END IF;
END $$;

-- Политика для удаления файлов (DELETE)
-- Позволяет аутентифицированным пользователям удалять файлы
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can delete images'
  ) THEN
    CREATE POLICY "Authenticated users can delete images"
    ON storage.objects
    FOR DELETE
    USING (
      bucket_id = 'product-images' 
      AND (storage.foldername(name))[1] = 'products'
    );
  END IF;
END $$;


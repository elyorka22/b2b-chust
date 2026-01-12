-- Упрощенная версия: создание bucket с минимальными политиками
-- Выполните этот скрипт в Supabase SQL Editor

-- Создаем bucket для изображений товаров
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true, -- Публичный bucket
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Политика для публичного чтения (все могут читать)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public read access for product-images'
  ) THEN
    CREATE POLICY "Public read access for product-images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'product-images');
  END IF;
END $$;

-- Политика для загрузки
-- ВНИМАНИЕ: Для полного доступа можно использовать service_role key в коде
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Service role can upload to product-images'
  ) THEN
    CREATE POLICY "Service role can upload to product-images"
    ON storage.objects
    FOR INSERT
    WITH CHECK (bucket_id = 'product-images');
  END IF;
END $$;

-- Политика для обновления
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Service role can update product-images'
  ) THEN
    CREATE POLICY "Service role can update product-images"
    ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'product-images');
  END IF;
END $$;

-- Политика для удаления
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Service role can delete product-images'
  ) THEN
    CREATE POLICY "Service role can delete product-images"
    ON storage.objects
    FOR DELETE
    USING (bucket_id = 'product-images');
  END IF;
END $$;


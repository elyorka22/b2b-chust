-- Минимальная версия: только создание bucket (без политик)
-- Политики можно создать через Dashboard или они будут работать через service_role key
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

-- Примечание: Политики можно создать через Dashboard в разделе Storage → Policies
-- Или использовать service_role key в коде, который обходит RLS политики


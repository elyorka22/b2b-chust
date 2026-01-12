# Создание bucket для изображений товаров в Supabase

## Быстрый способ (через SQL Editor)

### Шаг 1: Откройте SQL Editor в Supabase
1. Зайдите на [supabase.com](https://supabase.com)
2. Откройте ваш проект
3. Перейдите в **SQL Editor** в боковом меню

### Шаг 2: Выполните SQL скрипт

Скопируйте и выполните один из следующих скриптов:

#### Вариант A: Полная версия (рекомендуется)
Откройте файл `supabase/migrations/007_create_product_images_bucket.sql` и скопируйте его содержимое в SQL Editor.

#### Вариант B: Упрощенная версия
Откройте файл `supabase/migrations/008_product_images_bucket_simple.sql` и скопируйте его содержимое в SQL Editor.

### Шаг 3: Проверьте результат
1. Перейдите в **Storage** → **Buckets**
2. Убедитесь, что bucket `product-images` создан
3. Проверьте, что он помечен как **Public**

## Альтернативный способ (через Dashboard)

### Шаг 1: Откройте Storage
1. В Supabase Dashboard перейдите в **Storage**
2. Нажмите **"New bucket"** или **"Create bucket"**

### Шаг 2: Настройте bucket
- **Name**: `product-images`
- **Public bucket**: ✅ Включено
- **File size limit**: 5 MB (5242880 bytes)
- **Allowed MIME types**: 
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `image/gif`

### Шаг 3: Создайте политики доступа
После создания bucket перейдите в **Storage** → **Policies** и создайте следующие политики:

#### Политика 1: Публичное чтение
- **Policy name**: "Public read access for product-images"
- **Allowed operation**: SELECT
- **Policy definition**:
  ```sql
  bucket_id = 'product-images'
  ```

#### Политика 2: Загрузка файлов (для service role)
- **Policy name**: "Service role can upload to product-images"
- **Allowed operation**: INSERT
- **Policy definition**:
  ```sql
  bucket_id = 'product-images'
  ```

#### Политика 3: Обновление файлов
- **Policy name**: "Service role can update product-images"
- **Allowed operation**: UPDATE
- **Policy definition**:
  ```sql
  bucket_id = 'product-images'
  ```

#### Политика 4: Удаление файлов
- **Policy name**: "Service role can delete product-images"
- **Allowed operation**: DELETE
- **Policy definition**:
  ```sql
  bucket_id = 'product-images'
  ```

## Проверка работы

После создания bucket и политик:

1. Попробуйте загрузить изображение через админ-панель
2. Проверьте в **Storage** → **product-images**, что файл появился
3. Проверьте, что изображение отображается на карточке товара

## Troubleshooting

### Bucket не создается
- Убедитесь, что у вас есть права администратора проекта
- Проверьте, что имя bucket уникально (не используется другой bucket с таким именем)

### Политики не работают
- Убедитесь, что bucket создан как публичный
- Проверьте, что политики применены к правильному bucket
- Для загрузки через API используйте `SUPABASE_SERVICE_ROLE_KEY` (обходит RLS)

### Изображения не отображаются
- Проверьте, что bucket публичный
- Проверьте URL изображения в базе данных
- Убедитесь, что политика SELECT активна


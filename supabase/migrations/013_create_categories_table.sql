-- Создание таблицы категорий

-- Создаем функцию для обновления updated_at, если её нет
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS b2b_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для b2b_categories
CREATE INDEX IF NOT EXISTS idx_b2b_categories_name ON b2b_categories(name);
CREATE INDEX IF NOT EXISTS idx_b2b_categories_created_at ON b2b_categories(created_at DESC);

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_b2b_categories_updated_at
  BEFORE UPDATE ON b2b_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Комментарии
COMMENT ON TABLE b2b_categories IS 'Категории товаров';
COMMENT ON COLUMN b2b_categories.name IS 'Название категории (уникальное)';
COMMENT ON COLUMN b2b_categories.description IS 'Описание категории';


-- B2B Chust Database Schema
-- Создание таблиц и настройка Row Level Security (RLS)

-- ============================================
-- 1. Таблица пользователей (магазины и супер-админы)
-- ============================================
CREATE TABLE IF NOT EXISTS b2b_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('super-admin', 'magazin')),
  store_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для b2b_users
CREATE INDEX IF NOT EXISTS idx_b2b_users_username ON b2b_users(username);
CREATE INDEX IF NOT EXISTS idx_b2b_users_role ON b2b_users(role);

-- ============================================
-- 2. Таблица покупателей
-- ============================================
CREATE TABLE IF NOT EXISTS b2b_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  address TEXT,
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для b2b_customers
CREATE INDEX IF NOT EXISTS idx_b2b_customers_phone ON b2b_customers(phone);

-- ============================================
-- 3. Таблица товаров
-- ============================================
CREATE TABLE IF NOT EXISTS b2b_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  unit VARCHAR(50) NOT NULL DEFAULT 'dona' CHECK (unit IN ('dona', 'upakovka', 'karobka')),
  image TEXT,
  category VARCHAR(255),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  store_id UUID REFERENCES b2b_users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для b2b_products
CREATE INDEX IF NOT EXISTS idx_b2b_products_store_id ON b2b_products(store_id);
CREATE INDEX IF NOT EXISTS idx_b2b_products_category ON b2b_products(category);
CREATE INDEX IF NOT EXISTS idx_b2b_products_created_at ON b2b_products(created_at DESC);

-- ============================================
-- 4. Таблица заказов
-- ============================================
CREATE TABLE IF NOT EXISTS b2b_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  items JSONB NOT NULL, -- Массив товаров в заказе
  total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для b2b_orders
CREATE INDEX IF NOT EXISTS idx_b2b_orders_phone ON b2b_orders(phone);
CREATE INDEX IF NOT EXISTS idx_b2b_orders_status ON b2b_orders(status);
CREATE INDEX IF NOT EXISTS idx_b2b_orders_created_at ON b2b_orders(created_at DESC);

-- ============================================
-- 5. Функция для автоматического обновления updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_b2b_products_updated_at
  BEFORE UPDATE ON b2b_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_b2b_orders_updated_at
  BEFORE UPDATE ON b2b_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. Включение Row Level Security (RLS)
-- ============================================
ALTER TABLE b2b_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_orders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RLS Политики для b2b_users
-- ============================================
-- Все пользователи могут читать информацию о магазинах (для каталога)
CREATE POLICY "Users are viewable by everyone"
  ON b2b_users FOR SELECT
  USING (true);

-- Только супер-админы могут создавать пользователей
CREATE POLICY "Only super-admins can create users"
  ON b2b_users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM b2b_users
      WHERE id = auth.uid()::uuid
      AND role = 'super-admin'
    )
  );

-- Пользователи могут обновлять только свои данные
CREATE POLICY "Users can update own data"
  ON b2b_users FOR UPDATE
  USING (id = auth.uid()::uuid);

-- Только супер-админы могут удалять пользователей
CREATE POLICY "Only super-admins can delete users"
  ON b2b_users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM b2b_users
      WHERE id = auth.uid()::uuid
      AND role = 'super-admin'
    )
  );

-- ============================================
-- 8. RLS Политики для b2b_customers
-- ============================================
-- Покупатели могут видеть только свои данные
CREATE POLICY "Customers can view own data"
  ON b2b_customers FOR SELECT
  USING (id = auth.uid()::uuid);

-- Покупатели могут создавать свои записи
CREATE POLICY "Customers can create own data"
  ON b2b_customers FOR INSERT
  WITH CHECK (true);

-- Покупатели могут обновлять только свои данные
CREATE POLICY "Customers can update own data"
  ON b2b_customers FOR UPDATE
  USING (id = auth.uid()::uuid);

-- ============================================
-- 9. RLS Политики для b2b_products
-- ============================================
-- Все могут читать товары (публичный каталог)
CREATE POLICY "Products are viewable by everyone"
  ON b2b_products FOR SELECT
  USING (true);

-- Магазины могут создавать только свои товары, супер-админы - любые
CREATE POLICY "Stores can create own products, super-admins can create any"
  ON b2b_products FOR INSERT
  WITH CHECK (
    store_id IS NULL OR
    store_id = (
      SELECT id FROM b2b_users
      WHERE id = auth.uid()::uuid
      AND role = 'magazin'
    ) OR
    EXISTS (
      SELECT 1 FROM b2b_users
      WHERE id = auth.uid()::uuid
      AND role = 'super-admin'
    )
  );

-- Магазины могут обновлять только свои товары, супер-админы - любые
CREATE POLICY "Stores can update own products, super-admins can update any"
  ON b2b_products FOR UPDATE
  USING (
    store_id = (
      SELECT id FROM b2b_users
      WHERE id = auth.uid()::uuid
      AND role = 'magazin'
    ) OR
    EXISTS (
      SELECT 1 FROM b2b_users
      WHERE id = auth.uid()::uuid
      AND role = 'super-admin'
    ) OR
    store_id IS NULL
  );

-- Магазины могут удалять только свои товары, супер-админы - любые
CREATE POLICY "Stores can delete own products, super-admins can delete any"
  ON b2b_products FOR DELETE
  USING (
    store_id = (
      SELECT id FROM b2b_users
      WHERE id = auth.uid()::uuid
      AND role = 'magazin'
    ) OR
    EXISTS (
      SELECT 1 FROM b2b_users
      WHERE id = auth.uid()::uuid
      AND role = 'super-admin'
    ) OR
    store_id IS NULL
  );

-- ============================================
-- 10. RLS Политики для b2b_orders
-- ============================================
-- Все могут создавать заказы (публичный доступ)
CREATE POLICY "Anyone can create orders"
  ON b2b_orders FOR INSERT
  WITH CHECK (true);

-- Магазины видят только заказы со своими товарами, супер-админы - все
CREATE POLICY "Stores see orders with own products, super-admins see all"
  ON b2b_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM b2b_users
      WHERE id = auth.uid()::uuid
      AND role = 'super-admin'
    ) OR
    EXISTS (
      SELECT 1 FROM b2b_products
      WHERE id::text = ANY(
        SELECT jsonb_array_elements(items)->>'product_id'
        FROM b2b_orders
        WHERE b2b_orders.id = b2b_orders.id
      )
      AND store_id = (
        SELECT id FROM b2b_users
        WHERE id = auth.uid()::uuid
        AND role = 'magazin'
      )
    )
  );

-- Магазины могут обновлять только заказы со своими товарами, супер-админы - все
CREATE POLICY "Stores can update orders with own products, super-admins can update any"
  ON b2b_orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM b2b_users
      WHERE id = auth.uid()::uuid
      AND role = 'super-admin'
    ) OR
    EXISTS (
      SELECT 1 FROM b2b_products
      WHERE id::text = ANY(
        SELECT jsonb_array_elements(items)->>'product_id'
        FROM b2b_orders
        WHERE b2b_orders.id = b2b_orders.id
      )
      AND store_id = (
        SELECT id FROM b2b_users
        WHERE id = auth.uid()::uuid
        AND role = 'magazin'
      )
    )
  );

-- ============================================
-- 11. Комментарии к таблицам
-- ============================================
COMMENT ON TABLE b2b_users IS 'Пользователи системы: магазины и супер-администраторы';
COMMENT ON TABLE b2b_customers IS 'Покупатели (клиенты)';
COMMENT ON TABLE b2b_products IS 'Товары в каталоге';
COMMENT ON TABLE b2b_orders IS 'Заказы покупателей';

COMMENT ON COLUMN b2b_products.store_id IS 'ID магазина-владельца товара (NULL для товаров супер-админа)';
COMMENT ON COLUMN b2b_orders.items IS 'JSON массив товаров: [{"product_id": "...", "product_name": "...", "quantity": 1, "price": 100, "unit": "dona"}]';


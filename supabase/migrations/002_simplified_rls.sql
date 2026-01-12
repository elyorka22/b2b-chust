-- Упрощенные RLS политики (для использования с Service Role Key)
-- Если вы используете Service Role Key в backend, RLS можно отключить
-- или оставить только базовые политики

-- ============================================
-- Упрощенные политики (все через Service Role)
-- ============================================

-- Отключаем RLS для Service Role (используется в backend)
-- Service Role Key обходит все RLS политики

-- Для публичного доступа к товарам (без авторизации)
DROP POLICY IF EXISTS "Products are viewable by everyone" ON b2b_products;
CREATE POLICY "Products are viewable by everyone"
  ON b2b_products FOR SELECT
  USING (true);

-- Для публичного доступа к пользователям (магазинам) для каталога
DROP POLICY IF EXISTS "Users are viewable by everyone" ON b2b_users;
CREATE POLICY "Users are viewable by everyone"
  ON b2b_users FOR SELECT
  USING (true);

-- Для публичного создания заказов
DROP POLICY IF EXISTS "Anyone can create orders" ON b2b_orders;
CREATE POLICY "Anyone can create orders"
  ON b2b_orders FOR INSERT
  WITH CHECK (true);

-- Остальные операции (INSERT, UPDATE, DELETE) будут выполняться через Service Role Key
-- который обходит все RLS политики



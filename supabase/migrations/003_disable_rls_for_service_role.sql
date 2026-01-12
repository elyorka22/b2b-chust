-- Отключение RLS для Service Role (если используете Service Role Key)
-- Service Role Key автоматически обходит все RLS политики
-- Этот файл можно не применять, если используете Service Role Key

-- Если хотите полностью отключить RLS (не рекомендуется):
-- ALTER TABLE b2b_users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE b2b_customers DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE b2b_products DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE b2b_orders DISABLE ROW LEVEL SECURITY;

-- Вместо этого оставьте RLS включенным, но используйте Service Role Key в backend
-- Service Role Key автоматически обходит все политики



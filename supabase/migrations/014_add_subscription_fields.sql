-- Добавление полей подписки для магазинов

-- Проверяем существование таблицы перед добавлением колонок
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'b2b_users') THEN
    -- Добавляем колонки, если они еще не существуют
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'b2b_users' AND column_name = 'subscription_price') THEN
      ALTER TABLE b2b_users ADD COLUMN subscription_price DECIMAL(10, 2) DEFAULT 0 CHECK (subscription_price >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'b2b_users' AND column_name = 'subscription_start_date') THEN
      ALTER TABLE b2b_users ADD COLUMN subscription_start_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'b2b_users' AND column_name = 'subscription_balance') THEN
      ALTER TABLE b2b_users ADD COLUMN subscription_balance DECIMAL(10, 2) DEFAULT 0;
    END IF;

    -- Индекс для поиска по дате подписки
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_b2b_users_subscription_start_date') THEN
      CREATE INDEX idx_b2b_users_subscription_start_date ON b2b_users(subscription_start_date);
    END IF;

    -- Комментарии
    COMMENT ON COLUMN b2b_users.subscription_price IS 'Ежемесячная цена подписки магазина (0 = бесплатно)';
    COMMENT ON COLUMN b2b_users.subscription_start_date IS 'Дата начала подписки (дата добавления первого товара)';
    COMMENT ON COLUMN b2b_users.subscription_balance IS 'Текущий баланс подписки (может быть отрицательным)';
  END IF;
END $$;


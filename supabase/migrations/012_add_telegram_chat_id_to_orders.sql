-- Добавление поля telegram_chat_id в таблицу заказов

ALTER TABLE b2b_orders 
ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT;

-- Индекс для поиска по telegram_chat_id
CREATE INDEX IF NOT EXISTS idx_b2b_orders_telegram_chat_id ON b2b_orders(telegram_chat_id);

-- Комментарий
COMMENT ON COLUMN b2b_orders.telegram_chat_id IS 'Telegram Chat ID покупателя для отправки уведомлений о статусе заказа';


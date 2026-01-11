#!/usr/bin/env node

/**
 * Скрипт для генерации хеша пароля для создания супер-админа
 * 
 * Использование:
 *   cd backend && node ../scripts/generate-password-hash.js <password>
 * 
 * Пример:
 *   cd backend && node ../scripts/generate-password-hash.js mySecurePassword123
 */

// Используем CommonJS для совместимости
const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('❌ Ошибка: Укажите пароль');
  console.log('\nИспользование:');
  console.log('  node scripts/generate-password-hash.js <password>');
  console.log('\nПример:');
  console.log('  node scripts/generate-password-hash.js mySecurePassword123');
  process.exit(1);
}

if (password.length < 6) {
  console.error('❌ Ошибка: Пароль должен содержать минимум 6 символов');
  process.exit(1);
}

// Генерируем хеш пароля
const saltRounds = 10;
bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('❌ Ошибка при генерации хеша:', err);
    process.exit(1);
  }

  console.log('\n✅ Хеш пароля успешно сгенерирован!\n');
  console.log('📋 Скопируйте этот хеш и используйте в SQL запросе:\n');
  console.log('─'.repeat(80));
  console.log(hash);
  console.log('─'.repeat(80));
  console.log('\n💡 Теперь выполните SQL запрос в Supabase SQL Editor:\n');
  console.log(`INSERT INTO b2b_users (username, password_hash, role, store_name)`);
  console.log(`VALUES (`);
  console.log(`  'admin',`);
  console.log(`  '${hash}',`);
  console.log(`  'super-admin',`);
  console.log(`  NULL`);
  console.log(`);`);
  console.log('\n');
});


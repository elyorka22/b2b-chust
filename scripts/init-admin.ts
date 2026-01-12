import { db } from '../lib/db';
import { hashPassword } from '../lib/auth';

async function initAdmin() {
  const username = process.argv[2] || 'admin';
  const password = process.argv[3] || 'admin123';
  
  const existingUser = db.users.getByUsername(username);
  if (existingUser) {
    console.log(`Пользователь ${username} уже существует`);
    return;
  }

  const hashedPassword = await hashPassword(password);
  const user = db.users.create({
    username,
    password: hashedPassword,
    role: 'super-admin',
  });

  console.log(`Супер-админ создан:`);
  console.log(`Имя пользователя: ${user.username}`);
  console.log(`Роль: ${user.role}`);
  console.log(`\nДля входа используйте:`);
  console.log(`URL: http://localhost:3000/admin/login`);
  console.log(`Имя пользователя: ${username}`);
  console.log(`Пароль: ${password}`);
}

initAdmin().catch(console.error);



'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { API_BASE_URL } from '@/lib/config';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (role === 'buyer') {
        // Покупатель - просто сохраняем данные и переходим на главную
        if (!phone || !name) {
          setError('Telefon raqami va ism kiritilishi shart');
          setIsLoading(false);
          return;
        }

        // Сохраняем данные покупателя в localStorage или создаем без пароля
        try {
          const response = await fetch('/api/customers/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, name }),
          });

          if (response.ok) {
            router.push('/');
            router.refresh();
          } else {
            // Если уже существует, просто переходим
            router.push('/');
            router.refresh();
          }
        } catch {
          // В случае ошибки просто переходим на главную
          router.push('/');
          router.refresh();
        }
      } else {
        // Продавец - проверяем логин и пароль
        if (!username || !password) {
          setError('Foydalanuvchi nomi va parol kiritilishi shart');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
          // Сохраняем токен в localStorage как резервный вариант
          if (data.user) {
            // Создаем простой токен для хранения в localStorage (только для проверки на клиенте)
            try {
              const tokenParts = document.cookie.split('; ').find(row => row.startsWith('auth-token='));
              if (tokenParts) {
                const token = tokenParts.split('=')[1];
                if (token) {
                  localStorage.setItem('auth-token-backup', token);
                }
              }
            } catch (e) {
              console.error('Error saving token to localStorage:', e);
            }
          }
          
          // Небольшая задержка, чтобы cookies успели сохраниться
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // После успешного логина продавца/супер-админа переходим в админ-панель
          window.location.href = '/admin'; // Используем window.location для полного перезагрузки страницы
        } else {
          // Если пользователь не найден, переходим на страницу связи
          if (response.status === 401) {
            router.push('/contact');
          } else {
            setError(data.error || 'Kirishda xatolik');
          }
        }
      }
    } catch (error) {
      if (role === 'seller') {
        router.push('/contact');
      } else {
        setError('Xatolik yuz berdi');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">Kirish</h1>
          
          <div className="mb-6 flex gap-4 border-b">
            <button
              type="button"
              onClick={() => {
                setRole('buyer');
                setError('');
              }}
              className={`px-4 py-2 font-medium transition-colors ${
                role === 'buyer' 
                  ? 'border-b-2 border-indigo-600 text-indigo-600' 
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              Xaridor
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('seller');
                setError('');
              }}
              className={`px-4 py-2 font-medium transition-colors ${
                role === 'seller' 
                  ? 'border-b-2 border-indigo-600 text-indigo-600' 
                  : 'text-gray-600 hover:text-indigo-600'
              }`}
            >
              Sotuvchi
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {role === 'buyer' ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Telefon raqami *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+998 (90) 123-45-67"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Ism *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Ismingizni kiriting"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Foydalanuvchi nomi *
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Parol *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 disabled:bg-gray-400 shadow-md hover:shadow-lg transition-all"
            >
              {isLoading ? 'Kirilmoqda...' : 'Kirish'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

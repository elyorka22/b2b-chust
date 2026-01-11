'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import StoreDashboard from '@/components/StoreDashboard';
import SuperAdminDashboard from '@/components/SuperAdminDashboard';
import { getCurrentUserFromToken, AuthUser } from '@/lib/auth';
import { authApi } from '@/lib/api';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем токен на клиенте
    const currentUser = getCurrentUserFromToken();
    
    if (!currentUser) {
      // Если токена нет, перенаправляем на страницу входа
      router.push('/admin/login');
      return;
    }

    // Можно также проверить токен через API для дополнительной безопасности
    // Но для простоты используем проверку на клиенте
    setUser(currentUser);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12">Yuklanmoqda...</div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null; // Редирект уже произошел
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {user.role === 'super-admin' ? (
          <SuperAdminDashboard />
        ) : (
          <StoreDashboard storeName={user.storeName} />
        )}
      </main>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StoreDashboard from '@/components/StoreDashboard';
import SuperAdminDashboard from '@/components/SuperAdminDashboard';
import { getCurrentUserFromToken, AuthUser } from '@/lib/auth';
import { authApi } from '@/lib/api';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Небольшая задержка, чтобы дать время cookies сохраниться
    const checkAuth = async () => {
      // Даем время для установки cookies после редиректа
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Проверяем токен на клиенте
      console.log('Checking auth token...');
      console.log('All cookies:', document.cookie);
      
      const currentUser = getCurrentUserFromToken();
      console.log('Current user from token:', currentUser);
      
      if (!currentUser) {
        console.log('No user found, redirecting to login');
        // Если токена нет, перенаправляем на страницу входа
        router.push('/login');
        return;
      }

      console.log('User authenticated:', currentUser);
      // Можно также проверить токен через API для дополнительной безопасности
      // Но для простоты используем проверку на клиенте
      setUser(currentUser);
      setLoading(false);
    };
    
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
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

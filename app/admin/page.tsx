import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Header from '@/components/Header';
import StoreDashboard from '@/components/StoreDashboard';
import SuperAdminDashboard from '@/components/SuperAdminDashboard';

export default async function AdminPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/admin/login');
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


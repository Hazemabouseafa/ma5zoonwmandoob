import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { dbStore } from '@/lib/store';
import AdminSettingsClientView from '@/components/admin/AdminSettingsClientView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminSettingsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'admin') {
    redirect('/login');
  }

  const stats = await dbStore.getDatabaseStats();

  return (
    <AdminSettingsClientView
      initialStats={stats}
      adminName={user.name}
    />
  );
}

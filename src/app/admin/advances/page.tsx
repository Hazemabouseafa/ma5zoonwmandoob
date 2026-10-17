import { dbStore } from '@/lib/store';
import AdminAdvancesClientView from '@/components/admin/AdminAdvancesClientView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminAdvancesPage() {
  const advances = await dbStore.getAdvances();
  const users = await dbStore.getUsers();
  const reps = users.filter((u) => u.role === 'rep');

  return <AdminAdvancesClientView advances={advances} reps={reps} />;
}

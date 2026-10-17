import { getCurrentUser } from '@/lib/auth';
import { dbStore } from '@/lib/store';
import RepAdvancesClientView from '@/components/rep/RepAdvancesClientView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RepAdvancesPage() {
  const user = await getCurrentUser();
  const advances = await dbStore.getAdvances(user!.id);

  return <RepAdvancesClientView advances={advances} />;
}

import { dbStore } from '@/lib/store';
import RepsClientView from '@/components/admin/RepsClientView';

interface Props {
  searchParams?: Promise<{ month?: string; tab?: string }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminRepsPage({ searchParams }: Props) {
  let month: string | undefined;
  let initialTab: 'targets' | 'accounts' = 'targets';

  try {
    const resolved = searchParams ? await searchParams : {};
    month = resolved?.month;
    if (resolved?.tab === 'accounts') {
      initialTab = 'accounts';
    }
  } catch (err) {
    console.error('Error resolving searchParams on reps page:', err);
  }

  const allUsers = (await dbStore.getUsers().catch(() => [])) || [];
  const reps = allUsers.filter((u) => u.role === 'rep');
  const monthlyPerformance = await dbStore.getMonthlyRepsPerformance(month);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">إدارة المناديب وتتبع الأداء والتارجت الشهري</h1>
        <p className="text-sm text-slate-500">
          متابعة مبيعات المناديب شهرياً، تحديد التارجت المستهدف، قياس نسب الإنجاز، وإدارة حسابات الدخول
        </p>
      </div>

      <RepsClientView
        reps={reps}
        initialPerformance={monthlyPerformance}
        initialTab={initialTab}
      />
    </div>
  );
}

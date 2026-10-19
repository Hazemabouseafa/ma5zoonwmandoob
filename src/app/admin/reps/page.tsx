import { dbStore } from '@/lib/store';
import RepsClientView from '@/components/admin/RepsClientView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminRepsPage() {
  const users = await dbStore.getUsers();
  const reps = users.filter((u) => u.role === 'rep');
  const monthlyPerformance = await dbStore.getMonthlyRepsPerformance();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">إدارة المناديب وتتبع الأداء والتارجت الشهري</h1>
        <p className="text-sm text-slate-500">
          متابعة مبيعات المناديب شهرياً، تحديد التارجت المستهدف، قياس نسب الإنجاز، وإدارة حسابات الدخول
        </p>
      </div>

      <RepsClientView reps={reps} initialPerformance={monthlyPerformance} />
    </div>
  );
}

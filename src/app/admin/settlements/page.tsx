import { dbStore } from '@/lib/store';
import SettlementClientView from '@/components/admin/SettlementClientView';

interface Props {
  searchParams?: Promise<{ repId?: string }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminSettlementsPage({ searchParams }: Props) {
  let repId: string | undefined;
  try {
    const resolved = searchParams ? await searchParams : {};
    repId = resolved?.repId;
  } catch (err) {
    console.error('Error resolving searchParams on settlements page:', err);
  }

  const allUsers = (await dbStore.getUsers().catch(() => [])) || [];
  const reps = allUsers.filter((u) => u.role === 'rep');
  const pastSettlements = (await dbStore.getSettlements().catch(() => [])) || [];

  const selectedRepId = repId || reps[0]?.id || '';
  let repSummary = null;

  if (selectedRepId) {
    try {
      repSummary = await dbStore.getRepDaySummary(selectedRepId);
    } catch (err) {
      console.error('Error fetching rep day summary:', err);
      repSummary = null;
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">
          جرد وتسوية عهدة نهاية اليوم (End-of-Day Reconciliation)
        </h1>
        <p className="text-sm text-slate-500">
          مطابقة مبيعات المندوب، والكاش المحصل، والمخزون المتبقي في السيارة لمنع أي عجز أو اختلال
        </p>
      </div>

      <SettlementClientView
        reps={reps}
        selectedRepId={selectedRepId}
        repSummary={repSummary}
        pastSettlements={pastSettlements}
      />
    </div>
  );
}

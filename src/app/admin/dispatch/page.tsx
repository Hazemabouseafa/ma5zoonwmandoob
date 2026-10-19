import { dbStore } from '@/lib/store';
import DispatchClientView from '@/components/admin/DispatchClientView';

interface Props {
  searchParams?: Promise<{ repId?: string; batchId?: string }>;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDispatchPage({ searchParams }: Props) {
  let repId: string | undefined;
  let batchId: string | undefined;

  try {
    const resolved = searchParams ? await searchParams : {};
    repId = resolved?.repId;
    batchId = resolved?.batchId;
  } catch (err) {
    console.error('Error resolving searchParams on dispatch page:', err);
  }

  const allUsers = (await dbStore.getUsers().catch(() => [])) || [];
  const reps = allUsers.filter((u) => u.role === 'rep' && u.isActive);
  const allBatches = (await dbStore.getBatches().catch(() => [])) || [];
  const batches = allBatches.filter((b) => b && b.quantity > 0 && b.product);

  // Get van stock for each rep safely
  const repVanStocks = await Promise.all(
    reps.map(async (rep) => {
      const stock = (await dbStore.getRepVanStock(rep.id).catch(() => [])) || [];
      return {
        rep,
        stock,
        totalUnits: stock.reduce((s, i) => s + (i.quantity || 0), 0),
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">تحويل البضاعة لسيارات المناديب (عهدة السيارات)</h1>
        <p className="text-sm text-slate-500">
          تحويل الكميات من المستودع الرئيسي لسيارة كل مندوب بضغطة زر مع تحديث فوري ولحظي
        </p>
      </div>

      <DispatchClientView
        reps={reps}
        batches={batches}
        repVanStocks={repVanStocks}
        initialRepId={repId}
        initialBatchId={batchId}
      />
    </div>
  );
}

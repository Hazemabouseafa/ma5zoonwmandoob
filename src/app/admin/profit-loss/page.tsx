import { dbStore } from '@/lib/store';
import ProfitLossClientView from '@/components/admin/ProfitLossClientView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminProfitLossPage() {
  const profitLossData = await dbStore.getProfitLossEngine();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">محرك الأرباح والخسائر الصافية (P&L Engine)</h1>
          <p className="text-sm text-slate-500">
            حساب تلقائي وفوري لصافي أرباح الشركة بعد خصم تكلفة البضاعة المباعة (COGS)، مرتبات الموظفين، التوالف، والخصومات
          </p>
        </div>
      </div>

      <ProfitLossClientView initialData={profitLossData} />
    </div>
  );
}

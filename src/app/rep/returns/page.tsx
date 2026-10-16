import { getCurrentUser } from '@/lib/auth';
import { dbStore } from '@/lib/store';
import ReturnsClientView from '@/components/rep/ReturnsClientView';

export default async function RepReturnsPage() {
  const user = await getCurrentUser();
  const products = await dbStore.getProducts();
  const myReturns = await dbStore.getReturns(user!.id);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-slate-900">تسجيل المرتجعات (تالف ومنتهي الصلاحية)</h1>
        <p className="text-xs text-slate-500">
          تسجيل البضاعة المرتجعة من العملاء لخصمها ومطابقتها في تسوية اليومية
        </p>
      </div>

      <ReturnsClientView products={products} myReturns={myReturns} />
    </div>
  );
}

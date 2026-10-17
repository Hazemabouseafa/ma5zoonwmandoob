import { dbStore } from '@/lib/store';
import InventoryClientView from '@/components/admin/InventoryClientView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminInventoryPage() {
  const products = await dbStore.getProducts();
  const batches = await dbStore.getBatches();
  const categories = await dbStore.getCategories();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">إدارة المخزون وتشغيلات الوارد (FIFO)</h1>
          <p className="text-sm text-slate-500">
            تتبع تشغيلات السلع سريعة التلف وإدارة التصنيفات واحتساب الصلاحية آلياً
          </p>
        </div>
      </div>

      <InventoryClientView products={products} batches={batches} categories={categories} />
    </div>
  );
}

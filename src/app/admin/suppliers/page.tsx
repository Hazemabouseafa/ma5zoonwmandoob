import { dbStore } from '@/lib/store';
import SuppliersClientView from '@/components/admin/SuppliersClientView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminSuppliersPage() {
  const suppliers = await dbStore.getSuppliers();
  const purchases = await dbStore.getSupplierPurchases();
  const products = await dbStore.getProducts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">إدارة الموردين وفواتير الشراء والتوريد</h1>
          <p className="text-sm text-slate-500">
            متابعة حسابات وديون الموردين، تسجيل فواتير الشراء الواردة، وإيداع البضاعة بالمخزن الرئيسي آلياً (FIFO)
          </p>
        </div>
      </div>

      <SuppliersClientView
        suppliers={suppliers}
        purchases={purchases}
        products={products}
      />
    </div>
  );
}

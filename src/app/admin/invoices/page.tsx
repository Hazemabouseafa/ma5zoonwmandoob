import { dbStore } from '@/lib/store';
import InvoicesClientView from '@/components/admin/InvoicesClientView';

export default async function AdminInvoicesPage() {
  const invoices = await dbStore.getInvoices();
  const reps = (await dbStore.getUsers()).filter((u) => u.role === 'rep');
  const clients = await dbStore.getClients();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">
          سجل فواتير مبيعات المناديب والخصومات
        </h1>
        <p className="text-sm text-slate-500">
          متابعة تفصيلية لكل فاتورة أصدرها أي مندوب، والعملاء الذين تم البيع لهم، وقيم الخصومات الممنوحة
        </p>
      </div>

      <InvoicesClientView invoices={invoices} reps={reps} clients={clients} />
    </div>
  );
}

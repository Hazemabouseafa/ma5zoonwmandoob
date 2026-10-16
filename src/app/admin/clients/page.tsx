import { dbStore } from '@/lib/store';
import ClientsClientView from '@/components/admin/ClientsClientView';

export default async function AdminClientsPage() {
  const clients = await dbStore.getClients();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">إدارة المنافذ والسوبرماركتات (العملاء)</h1>
        <p className="text-sm text-slate-500">
          إضافة وتعديل بيانات المنافذ والمحلات التي يتم التوزيع لها بأسمائها وأماكنها
        </p>
      </div>

      <ClientsClientView clients={clients} />
    </div>
  );
}

import { getCurrentUser } from '@/lib/auth';
import { dbStore } from '@/lib/store';
import CollectionsClientView from '@/components/rep/CollectionsClientView';

export default async function RepCollectionsPage() {
  const user = await getCurrentUser();
  const clients = await dbStore.getClients();
  const myCollections = await dbStore.getCollections(user!.id);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-slate-900">سندات القبض والتحصيل النقدي</h1>
        <p className="text-xs text-slate-500">
          تسجيل المبالغ النقدية المحصلة من ديون العملاء وتحديث أرصدتهم فورياً
        </p>
      </div>

      <CollectionsClientView clients={clients} myCollections={myCollections} />
    </div>
  );
}

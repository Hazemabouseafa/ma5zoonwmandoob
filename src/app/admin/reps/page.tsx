import { dbStore } from '@/lib/store';
import RepsClientView from '@/components/admin/RepsClientView';

export default async function AdminRepsPage() {
  const users = await dbStore.getUsers();
  const reps = users.filter((u) => u.role === 'rep');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">إدارة المناديب وحسابات الدخول</h1>
        <p className="text-sm text-slate-500">
          إضافة مناديب جدد، إنشاء بيانات الدخول (اسم المستخدم وكلمة المرور)، وتفعيل أو تعطيل الحسابات
        </p>
      </div>

      <RepsClientView reps={reps} />
    </div>
  );
}

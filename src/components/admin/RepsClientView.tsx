'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { createRepAction, toggleRepStatusAction, resetRepPasswordAction } from '@/lib/actions';
import {
  Users,
  UserPlus,
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  MapPin,
  Lock,
} from 'lucide-react';

interface Props {
  reps: User[];
}

export default function RepsClientView({ reps }: Props) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAddRep = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const formData = new FormData(e.currentTarget);
    const res = await createRepAction(formData);
    setLoading(false);

    if (res.success) {
      setMsg({ type: 'success', text: res.message || 'تم إضافة المندوب بنجاح' });
      setShowAddModal(false);
      router.refresh();
    } else {
      setMsg({ type: 'error', text: res.error || 'حدث خطأ أثناء الإضافة' });
    }
  };

  const handleToggleStatus = async (rep: User) => {
    const res = await toggleRepStatusAction(rep.id, rep.isActive);
    if (res.success) {
      router.refresh();
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;

    setLoading(true);
    setMsg(null);

    const res = await resetRepPasswordAction(resetModalUser.id, newPassword);
    setLoading(false);

    if (res.success) {
      setMsg({ type: 'success', text: res.message || 'تم تحديث كلمة المرور' });
      setResetModalUser(null);
      setNewPassword('');
      router.refresh();
    } else {
      setMsg({ type: 'error', text: res.error || 'فشل التحديث' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500 font-medium">
          إجمالي المناديب المسجلين: <strong className="text-slate-900">{reps.length} مناديب</strong>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>إضافة مندوب مبيعات جديد</span>
        </button>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Reps Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reps.map((rep) => (
          <div
            key={rep.id}
            className={`p-5 rounded-2xl border transition bg-white shadow-xs flex flex-col justify-between ${
              rep.isActive ? 'border-slate-200' : 'border-slate-200 bg-slate-50/70 opacity-75'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{rep.name}</h3>
                    <div className="text-xs text-slate-500 font-mono">@{rep.username}</div>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    rep.isActive
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  {rep.isActive ? 'حساب نشط' : 'حساب معطل'}
                </span>
              </div>

              <div className="space-y-2 py-3 border-y border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>خط السير: <strong>{rep.assignedRoute || 'غير محدد'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>الهاتف: <strong>{rep.phone || 'غير مسجل'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>كلمة المرور الحالية: <strong className="font-mono">{rep.password}</strong></span>
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setResetModalUser(rep)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>تغيير كلمة السر</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleStatus(rep)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${
                  rep.isActive
                    ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                    : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                {rep.isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Rep Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">إضافة مندوب مبيعات جديد</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRep} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم المندوب بالكامل
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="مثلاً: سامح عبد الرحمن"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم المستخدم (Login Username)
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    placeholder="rep_sameh"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    كلمة المرور الأولية
                  </label>
                  <input
                    type="text"
                    name="password"
                    required
                    defaultValue="123"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  خط السير أو منطقة التوزيع
                </label>
                <input
                  type="text"
                  name="assignedRoute"
                  placeholder="مثلاً: خط مدينة نصر ومصر الجديدة"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم هاتف المندوب
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="010XXXXXXXX"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                >
                  {loading ? 'جاري الإضافة...' : 'حفظ وإنشاء الحساب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm">
                تغيير كلمة المرور لـ ({resetModalUser.name})
              </h3>
              <button
                onClick={() => setResetModalUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  كلمة المرور الجديدة
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="أدخل كلمة مرور جديدة"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                >
                  {loading ? 'جاري الحفظ...' : 'تحديث كلمة المرور'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

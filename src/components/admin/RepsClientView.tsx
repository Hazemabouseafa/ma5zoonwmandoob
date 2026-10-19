'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, RepMonthlyPerformance } from '@/types';
import {
  createRepAction,
  toggleRepStatusAction,
  resetRepPasswordAction,
  setRepTargetAction,
} from '@/lib/actions';
import {
  Users,
  UserPlus,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  MapPin,
  Lock,
  BarChart3,
  Target,
  TrendingUp,
  Award,
  Calendar,
  DollarSign,
  Edit,
  ArrowUpRight,
  Clock,
  Sparkles,
} from 'lucide-react';

interface MonthlyPerformanceData {
  month: string;
  availableMonths: string[];
  reps: RepMonthlyPerformance[];
  summary: {
    totalTarget: number;
    totalSales: number;
    totalCollected: number;
    overallAchievementPercent: number;
    achievedCount: number;
    totalRepsCount: number;
  };
}

interface Props {
  reps: User[];
  initialPerformance?: MonthlyPerformanceData;
}

export default function RepsClientView({
  reps: initialReps,
  initialPerformance,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'targets' | 'accounts'>('targets');
  const [repsList, setRepsList] = useState<User[]>(initialReps || []);

  // Performance & Targets state
  const [performance, setPerformance] = useState<MonthlyPerformanceData | undefined>(
    initialPerformance
  );
  const [selectedMonth, setSelectedMonth] = useState<string>(
    initialPerformance?.month ||
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  );

  // Target Modal State
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetRepId, setTargetRepId] = useState<string>('');
  const [targetMonth, setTargetMonth] = useState<string>(selectedMonth);
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [targetNotes, setTargetNotes] = useState<string>('');

  // Reps Account Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync state with parent RSC
  useEffect(() => {
    setRepsList(initialReps || []);
  }, [initialReps]);

  useEffect(() => {
    if (initialPerformance) {
      setPerformance(initialPerformance);
    }
  }, [initialPerformance]);

  const handleOpenTargetModal = (repId?: string, currentAmount?: number) => {
    setTargetRepId(repId || repsList[0]?.id || '');
    setTargetMonth(selectedMonth);
    setTargetAmount(currentAmount ? String(currentAmount) : '');
    setTargetNotes('');
    setShowTargetModal(true);
  };

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRepId) {
      setMsg({ type: 'error', text: 'يرجى اختيار المندوب' });
      return;
    }

    setLoading(true);
    setMsg(null);

    const formData = new FormData();
    formData.append('repId', targetRepId);
    formData.append('month', targetMonth);
    formData.append('targetAmount', targetAmount);
    formData.append('notes', targetNotes);

    try {
      const res = await setRepTargetAction(formData);
      setLoading(false);

      if (res.success) {
        setMsg({ type: 'success', text: res.message || 'تم حفظ تارجت المندوب بنجاح' });
        setShowTargetModal(false);
        router.refresh();
      } else {
        setMsg({ type: 'error', text: res.error || 'فشل حفظ التارجت' });
      }
    } catch {
      setLoading(false);
      setMsg({ type: 'error', text: 'حدث خطأ أثناء الاتصال بالخادم' });
    }
  };

  const handleAddRep = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const formData = new FormData(e.currentTarget);
    const res = await createRepAction(formData);
    setLoading(false);

    if (res.success) {
      if (res.user) {
        setRepsList((prev) => [res.user, ...prev.filter((r) => r.id !== res.user.id)]);
      }
      setMsg({ type: 'success', text: res.message || 'تم إضافة المندوب بنجاح' });
      setShowAddModal(false);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('app:sync'));
      router.refresh();
    } else {
      setMsg({ type: 'error', text: res.error || 'حدث خطأ أثناء الإضافة' });
    }
  };

  const handleToggleStatus = async (rep: User) => {
    setRepsList((prev) =>
      prev.map((r) => (r.id === rep.id ? { ...r, isActive: !rep.isActive } : r))
    );
    const res = await toggleRepStatusAction(rep.id, rep.isActive);
    if (res.success && res.user) {
      setRepsList((prev) =>
        prev.map((r) => (r.id === res.user.id ? res.user : r))
      );
    }
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('app:sync'));
    router.refresh();
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;

    setLoading(true);
    setMsg(null);

    const targetUserId = resetModalUser.id;
    const res = await resetRepPasswordAction(targetUserId, newPassword);
    setLoading(false);

    if (res.success) {
      if (res.user) {
        setRepsList((prev) =>
          prev.map((r) => (r.id === res.user.id ? res.user : r))
        );
      } else {
        setRepsList((prev) =>
          prev.map((r) => (r.id === targetUserId ? { ...r, password: newPassword } : r))
        );
      }
      setMsg({ type: 'success', text: res.message || 'تم تحديث كلمة المرور بنجاح' });
      setResetModalUser(null);
      setNewPassword('');
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('app:sync'));
      router.refresh();
    } else {
      setMsg({ type: 'error', text: res.error || 'فشل التحديث' });
    }
  };

  const summary = performance?.summary || {
    totalTarget: 0,
    totalSales: 0,
    totalCollected: 0,
    overallAchievementPercent: 0,
    achievedCount: 0,
    totalRepsCount: repsList.length,
  };

  const repsPerfList = performance?.reps || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('targets')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'targets'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-600" />
              <span>متابعة التارجت والأداء الشهري</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'accounts'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>بيانات وحسابات المناديب ({repsList.length})</span>
            </div>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {activeTab === 'targets' ? (
            <button
              onClick={() => handleOpenTargetModal()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2"
            >
              <Target className="w-4 h-4" />
              <span>تحديد تارجت لمندوب</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة مندوب مبيعات جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {msg && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between border ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span className="font-semibold">{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: MONTHLY TARGETS & PERFORMANCE */}
      {activeTab === 'targets' && (
        <div className="space-y-6">
          {/* Month Selector Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-500" />
              <span className="text-sm font-bold text-slate-700">تتبع الأداء لشهر:</span>
              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    router.push(`/admin/reps?month=${e.target.value}`);
                  }}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div className="text-xs text-slate-500">
              يتم احتساب المبيعات الفعلية تلقائياً من واقع فواتير المبيعات الصادرة لكل مندوب خلال هذا الشهر
            </div>
          </div>

          {/* 4 Summary Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">إجمالي التارجت المستهدف</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {summary.totalTarget.toLocaleString('ar-EG')}{' '}
                  <span className="text-sm font-normal text-slate-500">ج.م</span>
                </p>
                <span className="text-xs text-blue-600 font-semibold">مبيعات مطلوبة</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">إجمالي المبيعات المحققة</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">
                  {summary.totalSales.toLocaleString('ar-EG')}{' '}
                  <span className="text-sm font-normal text-slate-500">ج.م</span>
                </p>
                <span className="text-xs text-emerald-600 font-semibold">
                  تحصيل: {summary.totalCollected.toLocaleString('ar-EG')} ج.م
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">نسبة التحقيق الإجمالية</p>
                <p className="text-2xl font-black text-purple-700 mt-1">
                  %{summary.overallAchievementPercent.toFixed(1)}
                </p>
                <span className="text-xs text-purple-600 font-semibold">من إجمالي المستهدف</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">المناديب المحققون للتارجت</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {summary.achievedCount}{' '}
                  <span className="text-sm font-normal text-slate-500">من {summary.totalRepsCount}</span>
                </p>
                <span className="text-xs text-amber-600 font-semibold">حققوا $\ge 100\%$</span>
              </div>
            </div>
          </div>

          {/* Reps Targets & Achievement Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  جدول تفصيلي لتارجت وإنجاز المناديب ({selectedMonth})
                </h3>
                <p className="text-xs text-slate-500">
                  مقارنة المبيعات المحققة بالتارجت المطلوب، مع مؤشر التحقيق وحالة الهدف
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              {repsPerfList.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-bold">لا يوجد مناديب مسجلون حالياً</p>
                </div>
              ) : (
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-bold text-slate-500">
                      <th className="py-3 px-4">المندوب وخط السير</th>
                      <th className="py-3 px-4">التارجت المستهدف</th>
                      <th className="py-3 px-4">المبيعات المحققة</th>
                      <th className="py-3 px-4">التحصيل الفعلي</th>
                      <th className="py-3 px-4 text-center">نسبة الإنجاز</th>
                      <th className="py-3 px-4 text-center">حالة التارجت</th>
                      <th className="py-3 px-4 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {repsPerfList.map((rep) => {
                      const pct = Math.min(100, rep.achievementPercent);
                      return (
                        <tr key={rep.repId} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{rep.repName}</div>
                            <div className="text-xs text-slate-400">
                              {rep.assignedRoute || 'بدون خط سير'} • {rep.repPhone || 'بدون هاتف'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            {rep.targetAmount > 0 ? (
                              <>
                                {rep.targetAmount.toLocaleString('ar-EG')}{' '}
                                <span className="text-xs font-normal text-slate-500">ج.م</span>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400 font-normal">لم يُحدد تارجت</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-black text-emerald-700">
                            {rep.salesAmount.toLocaleString('ar-EG')}{' '}
                            <span className="text-xs font-normal text-slate-500">ج.م</span>
                            <div className="text-[11px] text-slate-400 font-normal">
                              ({rep.invoicesCount} فاتورة)
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            {rep.collectedAmount.toLocaleString('ar-EG')}{' '}
                            <span className="text-xs font-normal text-slate-400">ج.م</span>
                          </td>

                          <td className="py-3.5 px-4 text-center min-w-[140px]">
                            {rep.targetAmount > 0 ? (
                              <div className="space-y-1">
                                <div className="text-xs font-black text-slate-900">
                                  %{rep.achievementPercent.toFixed(1)}
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      rep.achievementPercent >= 100
                                        ? 'bg-emerald-500'
                                        : rep.achievementPercent >= 75
                                        ? 'bg-amber-500'
                                        : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">-</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {rep.status === 'achieved' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <Award className="w-3.5 h-3.5 text-emerald-700" />
                                حقق التارجت 🎯
                              </span>
                            )}
                            {rep.status === 'near_target' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                                قريب من التارجت ⚡
                              </span>
                            )}
                            {rep.status === 'in_progress' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                جاري العمل ⏳
                              </span>
                            )}
                            {rep.status === 'no_target' && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                                لم يُحدد تارجت
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenTargetModal(rep.repId, rep.targetAmount)}
                                title="تحديد / تعديل التارجت"
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                <span>تعديل التارجت</span>
                              </button>
                              <Link
                                href={`/admin/reps/${rep.repId}`}
                                title="الملف الشامل للمندوب"
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REPS ACCOUNTS & LOGINS */}
      {activeTab === 'accounts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repsList.map((rep) => (
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

              <div className="pt-3 space-y-2">
                <Link
                  href={`/admin/reps/${rep.id}`}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>الملف الشامل ومؤشرات الأداء (360° Analytics)</span>
                </Link>

                <div className="flex items-center gap-2">
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
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Set / Edit Rep Monthly Target */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <h3 className="font-black text-lg text-emerald-950 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                <span>تحديد تارجت المبيعات للمندوب</span>
              </h3>
              <button
                onClick={() => setShowTargetModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTarget} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المندوب المستهدف <span className="text-rose-500">*</span>
                </label>
                <select
                  value={targetRepId}
                  onChange={(e) => setTargetRepId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                >
                  {repsList.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.assignedRoute || 'عام'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    عن شهر <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="month"
                    required
                    value={targetMonth}
                    onChange={(e) => setTargetMonth(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المبلغ المستهدف (ج.م) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="500"
                      min="1"
                      required
                      placeholder="مثال: 50000"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-left text-emerald-700"
                      dir="ltr"
                    />
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      ج.م
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات أو حوافز إضافية</label>
                <textarea
                  rows={2}
                  value={targetNotes}
                  onChange={(e) => setTargetNotes(e.target.value)}
                  placeholder="مثال: تارجت الربع الأخير، حافز 5% عند تجاوز المستهدف..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTargetModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition disabled:opacity-50"
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ التارجت'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

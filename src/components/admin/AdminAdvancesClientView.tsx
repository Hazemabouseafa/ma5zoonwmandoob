'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdvanceRequest, User, AdvanceStatus } from '@/types';
import { updateAdvanceStatusAction, deleteAdvanceAction } from '@/lib/actions';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import {
  HandCoins,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  User as UserIcon,
  Phone,
  MapPin,
  Check,
  X,
  Search,
  MessageSquare,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface Props {
  advances: (AdvanceRequest & { rep: User })[];
  reps: User[];
}

export default function AdminAdvancesClientView({
  advances: initialAdvances,
  reps,
}: Props) {
  const router = useRouter();
  const [advancesList, setAdvancesList] = useState(initialAdvances);
  const [statusFilter, setStatusFilter] = useState<'all' | AdvanceStatus>('all');
  const [selectedRepId, setSelectedRepId] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [actionModal, setActionModal] = useState<{
    advId: string;
    targetStatus: AdvanceStatus;
    repName: string;
    amount: number;
  } | null>(null);
  const [managerNotes, setManagerNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Universal Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const pendingList = advancesList.filter((a) => a.status === 'pending');
  const pendingTotal = pendingList.reduce((sum, a) => sum + a.amount, 0);

  const approvedList = advancesList.filter((a) => a.status === 'approved');
  const approvedTotal = approvedList.reduce((sum, a) => sum + a.amount, 0);

  const rejectedList = advancesList.filter((a) => a.status === 'rejected');

  const filteredAdvances = advancesList.filter((adv) => {
    if (statusFilter !== 'all' && adv.status !== statusFilter) return false;
    if (selectedRepId !== 'all' && adv.repId !== selectedRepId) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchRep = adv.rep?.name?.toLowerCase().includes(q);
      const matchReason = adv.reason?.toLowerCase().includes(q);
      const matchAmount = adv.amount.toString().includes(q);
      if (!matchRep && !matchReason && !matchAmount) return false;
    }
    return true;
  });

  const handleQuickAction = (
    advId: string,
    targetStatus: AdvanceStatus,
    repName: string,
    amount: number
  ) => {
    setManagerNotes('');
    setActionModal({ advId, targetStatus, repName, amount });
  };

  const handleConfirmAction = async () => {
    if (!actionModal) return;
    setLoading(true);
    setMsg(null);

    const { advId, targetStatus } = actionModal;
    const res = await updateAdvanceStatusAction(advId, targetStatus, managerNotes);
    setLoading(false);

    if (res.success) {
      setAdvancesList((prev) =>
        prev.map((a) =>
          a.id === advId
            ? { ...a, status: targetStatus, managerNotes: managerNotes.trim() }
            : a
        )
      );
      setMsg({ type: 'success', text: res.message || 'تم تحديث حالة السلفة بنجاح' });
      setActionModal(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('app:sync'));
      }
      router.refresh();
    } else {
      setMsg({ type: 'error', text: res.error || 'فشل تحديث حالة السلفة' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setMsg(null);
    try {
      const res = await deleteAdvanceAction(deleteTarget.id);
      if (res.success) {
        setAdvancesList((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        setMsg({ type: 'success', text: res.message || 'تم حذف طلب السلفة بنجاح' });
      } else {
        setMsg({ type: 'error', text: res.error || 'فشل حذف طلب السلفة' });
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('app:sync'));
      }
      router.refresh();
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.message || 'حدث خطأ أثناء الحذف' });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <HandCoins className="w-5 h-5 text-emerald-700" />
            </span>
            <h1 className="text-2xl font-black text-slate-900">سلف المناديب والعهد الشخصية</h1>
          </div>
          <p className="text-sm text-slate-500">
            متابعة واعتماد طلبات السلف المالية المقدمة من مناديب التوزيع لحظياً
          </p>
        </div>

        {pendingList.length > 0 && (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold animate-pulse">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>يوجد {pendingList.length} طلب سلفة بانتظار موافقتك</span>
          </div>
        )}
      </div>

      {/* Messages */}
      {msg && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-amber-200/80 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-amber-700 font-bold mb-2">
            <span>طلبات قيد المراجعة</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {pendingTotal.toLocaleString('ar-EG')}{' '}
            <span className="text-sm font-bold text-amber-600">ج.م</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {pendingList.length} طلبات تنتظر الاعتماد
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-emerald-200/80 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-emerald-700 font-bold mb-2">
            <span>إجمالي السلف المعتمدة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {approvedTotal.toLocaleString('ar-EG')}{' '}
            <span className="text-sm font-bold text-emerald-600">ج.م</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {approvedList.length} طلبات تمت الموافقة عليها
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-2">
            <span>الطلبات المرفوضة</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">
            {rejectedList.length}{' '}
            <span className="text-sm font-bold text-slate-400">طلب</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            إجمالي السلف غير المعتمدة
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'الكل', count: advancesList.length },
              { id: 'pending', label: 'قيد المراجعة', count: pendingList.length },
              { id: 'approved', label: 'المعتمدة', count: approvedList.length },
              { id: 'rejected', label: 'المرفوضة', count: rejectedList.length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    statusFilter === tab.id
                      ? 'bg-emerald-800/50 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Rep Select Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedRepId}
              onChange={(e) => setSelectedRepId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">كل المناديب</option>
              {reps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="بحث باسم المندوب أو السبب..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Advances Cards List */}
      <div className="space-y-3">
        {filteredAdvances.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl mx-auto flex items-center justify-center">
              <HandCoins className="w-7 h-7" />
            </div>
            <div className="text-base font-bold text-slate-800">لا توجد طلبات سلف مطابقة للبحث</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              عندما يقوم أي مندوب بتقديم طلب سلفة مالية من هاتفه ستظهر مباشرة هنا للاعتماد الفوري
            </p>
          </div>
        ) : (
          filteredAdvances.map((adv) => {
            const isPending = adv.status === 'pending';
            const isApproved = adv.status === 'approved';
            const isRejected = adv.status === 'rejected';

            return (
              <div
                key={adv.id}
                className={`bg-white rounded-3xl p-5 border shadow-2xs transition hover:shadow-sm space-y-4 ${
                  isPending
                    ? 'border-amber-200/90 ring-1 ring-amber-100'
                    : isApproved
                    ? 'border-slate-200'
                    : 'border-slate-200 opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Rep Info & Request */}
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-100">
                      <UserIcon className="w-6 h-6 text-emerald-700" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-base font-black text-slate-900 break-words">
                          {adv.rep?.name || 'مندوب'}
                        </strong>
                        {adv.rep?.assignedRoute && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 flex items-center gap-1 font-medium shrink-0">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{adv.rep.assignedRoute}</span>
                          </span>
                        )}
                        {adv.rep?.phone && (
                          <a
                            href={`tel:${adv.rep.phone}`}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center gap-1 font-mono font-semibold shrink-0"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{adv.rep.phone}</span>
                          </a>
                        )}
                      </div>

                      <div className="text-xs text-slate-600 font-medium mt-1 flex items-center gap-2">
                        <span>سبب السلفة:</span>
                        <span className="font-bold text-slate-800">{adv.reason}</span>
                      </div>
                    </div>
                  </div>

                  {/* Amount and Status */}
                  <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <div className="text-xl sm:text-2xl font-black text-slate-900">
                      {adv.amount.toLocaleString('ar-EG')}{' '}
                      <span className="text-xs font-bold text-emerald-600">ج.م</span>
                    </div>

                    <div>
                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-700 animate-pulse" />
                          <span>قيد المراجعة</span>
                        </span>
                      )}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          <span>تمت الموافقة والاعتماد</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-700" />
                          <span>طلب مرفوض</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Date & Manager Action Bar */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      تاريخ الطلب:{' '}
                      {new Date(adv.createdAt).toLocaleDateString('ar-EG', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      الساعة{' '}
                      {new Date(adv.createdAt).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Manager Notes display if exists */}
                  {adv.managerNotes && (
                    <div className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        <strong>ملاحظة الإدارة:</strong> {adv.managerNotes}
                      </span>
                    </div>
                  )}

                  {/* Quick Action Buttons for Admin */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            handleQuickAction(
                              adv.id,
                              'approved',
                              adv.rep?.name || 'المندوب',
                              adv.amount
                            )
                          }
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs active:scale-95 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>موافقة على السلفة</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleQuickAction(
                              adv.id,
                              'rejected',
                              adv.rep?.name || 'المندوب',
                              adv.amount
                            )
                          }
                          className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>رفض</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleQuickAction(
                            adv.id,
                            isApproved ? 'rejected' : 'approved',
                            adv.rep?.name || 'المندوب',
                            adv.amount
                          )
                        }
                        className="text-slate-500 hover:text-slate-800 text-[11px] font-semibold underline underline-offset-2"
                      >
                        {isApproved ? 'تعديل الحالة إلى مرفوض' : 'تعديل الحالة إلى معتمد'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setDeleteTarget({
                          id: adv.id,
                          name: `طلب سلفة للمندوب: ${adv.rep?.name || 'مندوب'} بمبلغ: ${adv.amount.toLocaleString('ar-EG')} ج.م (${adv.reason})`,
                        })
                      }
                      title="حذف طلب السلفة"
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation & Notes Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    actionModal.targetStatus === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {actionModal.targetStatus === 'approved' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {actionModal.targetStatus === 'approved'
                      ? 'اعتماد والموافقة على السلفة'
                      : 'رفض طلب السلفة'}
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    مندوب: {actionModal.repName} • {actionModal.amount} ج.م
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                {actionModal.targetStatus === 'approved' ? (
                  <span>
                    هل أنت متأكد من اعتماد سلفة بمبلغ{' '}
                    <strong className="text-emerald-700 font-black">
                      {actionModal.amount} ج.م
                    </strong>{' '}
                    للمندوب {actionModal.repName}؟
                  </span>
                ) : (
                  <span>
                    هل أنت متأكد من رفض طلب السلفة بمبلغ{' '}
                    <strong className="text-rose-700 font-black">
                      {actionModal.amount} ج.م
                    </strong>{' '}
                    للمندوب {actionModal.repName}؟
                  </span>
                )}
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ملاحظات الإدارة للمندوب (اختياري):
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    actionModal.targetStatus === 'approved'
                      ? 'مثال: تم الصرف نقداً من خزينة المستودع'
                      : 'مثال: تم الرفض لتجاوز الحد المسموح للسلف هذا الأسبوع'
                  }
                  value={managerNotes}
                  onChange={(e) => setManagerNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={loading}
                  className={`flex-1 py-2.5 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md ${
                    actionModal.targetStatus === 'approved'
                      ? 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 shadow-emerald-600/20'
                      : 'bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 shadow-rose-600/20'
                  }`}
                >
                  {loading
                    ? 'جاري التنفيذ...'
                    : actionModal.targetStatus === 'approved'
                    ? 'تأكيد الموافقة'
                    : 'تأكيد الرفض'}
                </button>
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Universal Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteTarget !== null}
        itemName={deleteTarget?.name}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
      />
    </div>
  );
}

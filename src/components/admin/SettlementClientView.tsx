'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Settlement, Product, Invoice, ReturnItem } from '@/types';
import { saveSettlementAction, deleteSettlementAction } from '@/lib/actions';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Truck,
  RotateCcw,
  FileCheck,
  ArrowRight,
  TrendingUp,
  Trash2,
} from 'lucide-react';

interface RepSummaryData {
  rep: User;
  todayInvoices: Invoice[];
  todayCashFromSales: number;
  todayCreditSales: number;
  todayCollections: number;
  expectedCash: number;
  currentVanStock: {
    product: Product;
    quantity: number;
  }[];
  todayReturns: ReturnItem[];
}

interface Props {
  reps: User[];
  selectedRepId: string;
  repSummary: RepSummaryData | null;
  pastSettlements: (Settlement & { rep: User })[];
}

export default function SettlementClientView({
  reps,
  selectedRepId,
  repSummary,
  pastSettlements,
}: Props) {
  const router = useRouter();
  const [repId, setRepId] = useState(selectedRepId);
  const [actualCash, setActualCash] = useState<string>(
    repSummary ? repSummary.expectedCash.toString() : '0'
  );
  const [notes, setNotes] = useState('');
  const [stockDiscrepancies, setStockDiscrepancies] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Settlement Deletion State
  const [deleteTarget, setDeleteTarget] = useState<(Settlement & { rep: User }) | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const numActualCash = parseFloat(actualCash) || 0;
  const expectedCash = repSummary?.expectedCash || 0;
  const difference = numActualCash - expectedCash;
  const isBalanced = Math.abs(difference) < 0.01 && !stockDiscrepancies;

  const handleRepChange = (newRepId: string) => {
    setRepId(newRepId);
    router.push(`/admin/settlements?repId=${newRepId}`);
  };

  const handleSaveSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repSummary) return;

    setLoading(true);
    setResultMsg(null);

    const res = await saveSettlementAction({
      repId,
      actualCash: numActualCash,
      stockDiscrepancies: stockDiscrepancies.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    setLoading(false);
    if (res.success) {
      setResultMsg({
        type: 'success',
        text: 'تم حفظ واعتماد تسوية اليومية بنجاح وإغلاق وردية المندوب',
      });
      router.refresh();
    } else {
      setResultMsg({
        type: 'error',
        text: res.error || 'فشل حفظ التسوية',
      });
    }
  };

  const handleDeleteSettlement = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    const res = await deleteSettlementAction(deleteTarget.id);
    setIsDeleting(false);

    if (res.success) {
      setResultMsg({
        type: 'success',
        text: res.message || 'تم حذف سجل التسوية بنجاح',
      });
      setDeleteTarget(null);
      router.refresh();
    } else {
      setResultMsg({
        type: 'error',
        text: res.error || 'فشل حذف سجل التسوية',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Rep Selection Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-bold text-slate-800">اختر المندوب لإجراء المطابقة:</span>
        </div>
        <select
          value={repId}
          onChange={(e) => handleRepChange(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
        >
          {reps.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} - ({r.assignedRoute || 'بدون خط سير'})
            </option>
          ))}
        </select>
      </div>

      {resultMsg && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
            resultMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {resultMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{resultMsg.text}</span>
        </div>
      )}

      {/* Main Reconciliation Card */}
      {repSummary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2 cols): Calculated Expected Stats */}
          <div className="lg:col-span-2 space-y-6">
            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">مبيعات نقدية اليوم</div>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {repSummary.todayCashFromSales.toLocaleString('ar-EG')} ج.م
                </div>
                <div className="text-[11px] text-slate-400 mt-1">من فواتير اليوم</div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="text-xs text-slate-500 font-medium">تحصيلات ديون سابقة</div>
                <div className="text-xl font-black text-teal-600 mt-1">
                  {repSummary.todayCollections.toLocaleString('ar-EG')} ج.م
                </div>
                <div className="text-[11px] text-slate-400 mt-1">سندات قبض نقدية</div>
              </div>

              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-xs">
                <div className="text-xs text-emerald-800 font-bold">إجمالي الكاش المتوقع استلامه</div>
                <div className="text-2xl font-black text-emerald-700 mt-1">
                  {expectedCash.toLocaleString('ar-EG')} ج.م
                </div>
                <div className="text-[11px] text-emerald-600 mt-1">مبيعات كاش + تحصيلات</div>
              </div>
            </div>

            {/* Van Stock Physical Count (المتبقي في السيارة) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 mb-3 gap-1">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    المخزون الفعلي المتبقي في السيارة (جرد نهاية اليوم)
                  </h3>
                </div>
                <span className="text-xs text-slate-500">
                  المتبقي المفترض حسب سجل الحركات
                </span>
              </div>

              {repSummary.currentVanStock.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                  السيارة فارغة - تم بيع كامل العهدة اليوم بنجاح.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {repSummary.currentVanStock.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-slate-800">{item.product.name}</span>
                      <span className="font-bold font-mono text-emerald-700 bg-white px-2 py-1 rounded-md border border-slate-200">
                        {item.quantity} كرتونة
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Today's Returns logged by Rep */}
            {repSummary.todayReturns.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-3">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-slate-900 text-sm">مرتجعات مسجلة من المندوب اليوم</h3>
                </div>
                <div className="space-y-2">
                  {repSummary.todayReturns.map((ret) => (
                    <div
                      key={ret.id}
                      className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-800">
                          {ret.amount !== undefined && ret.amount > 0
                            ? `${Number(ret.amount).toLocaleString('ar-EG')} ج.م (تلفيات)`
                            : `${ret.quantity} كرتونة`}
                        </span>
                        <span className="text-slate-500 mx-1">
                          - السبب: {ret.reason === 'expired' ? 'منتهي الصلاحية' : 'تالف'}
                        </span>
                        {ret.notes && <div className="text-[11px] text-slate-500 mt-0.5">{ret.notes}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (1 col): Reconciliation Action Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
            <form onSubmit={handleSaveSettlement} className="space-y-5">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-base">استلام النقدية وإغلاق الوردية</h3>
                <p className="text-xs text-slate-500">
                  قم بعدّ النقدية المستلمة من المندوب ومقارنتها بالمتوقع
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  النقدية الفعلية المسلمة من المندوب (ج.م)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-lg font-black text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              {/* Live Reconciliation Feedback */}
              <div
                className={`p-4 rounded-2xl border text-center transition ${
                  isBalanced
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : difference < 0
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <div className="text-xs font-semibold">نتيجة المطابقة:</div>
                <div className="text-lg font-black mt-1">
                  {isBalanced ? (
                    <span className="text-emerald-700 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-5 h-5" />
                      مطابق تماماً (لا يوجد عجز)
                    </span>
                  ) : difference < 0 ? (
                    <span className="text-rose-700 flex items-center justify-center gap-1">
                      <AlertTriangle className="w-5 h-5" />
                      عجز نقدية بمقدار {Math.abs(difference).toLocaleString('ar-EG')} ج.م
                    </span>
                  ) : (
                    <span className="text-blue-700 flex items-center justify-center gap-1">
                      فائض نقدية بمقدار {difference.toLocaleString('ar-EG')} ج.م
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  فروقات أو عجز في البضاعة (اختياري)
                </label>
                <input
                  type="text"
                  value={stockDiscrepancies}
                  onChange={(e) => setStockDiscrepancies(e.target.value)}
                  placeholder="مثلاً: عجز كرتونة حليب لم تُسلم"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ملاحظات التسوية
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات إضافية على تسوية الوردية..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FileCheck className="w-4 h-4" />
                <span>{loading ? 'جاري الاعتماد...' : 'اعتماد التسوية وإغلاق الوردية'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Past Settlements Archive Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200">
          <h3 className="font-bold text-slate-800 text-sm">سجل التسويات السابقة المعتمدة</h3>
        </div>
        <div className="overflow-x-auto touch-pan-x">
          <table className="w-full text-right text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs bg-slate-50/40">
                <th className="py-3 pr-4">التاريخ</th>
                <th className="py-3">المندوب</th>
                <th className="py-3">الكاش المتوقع</th>
                <th className="py-3">الكاش الفعلي المستلم</th>
                <th className="py-3">الفارق</th>
                <th className="py-3">الحالة</th>
                <th className="py-3">ملاحظات</th>
                <th className="py-3 pl-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pastSettlements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                    لا توجد تسويات سابقة مسجلة حالياً
                  </td>
                </tr>
              ) : (
                pastSettlements.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 pr-4 font-mono text-xs text-slate-600">
                      {new Date(s.date).toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-3 font-semibold text-slate-900">{s.rep?.name || 'مندوب'}</td>
                    <td className="py-3 font-mono font-bold text-slate-800">
                      {(s.expectedCash ?? 0).toLocaleString('ar-EG')} ج.م
                    </td>
                    <td className="py-3 font-mono font-bold text-emerald-700">
                      {(s.actualCash ?? 0).toLocaleString('ar-EG')} ج.م
                    </td>
                    <td className="py-3 font-mono text-xs">
                      {(s.cashDifference ?? 0) === 0 ? (
                        <span className="text-emerald-600 font-bold">0 (مطابق)</span>
                      ) : (
                        <span className="text-rose-600 font-bold">
                          {(s.cashDifference ?? 0).toLocaleString('ar-EG')} ج.م
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          s.status === 'balanced'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {s.status === 'balanced' ? 'متزن' : 'يوجد فارق'}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-slate-500">{s.notes || '-'}</td>
                    <td className="py-3 pl-4 text-center">
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(s)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="حذف سجل التسوية"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Universal Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="تأكيد حذف سجل التسوية"
        message={`هل أنت متأكد من حذف تسوية المندوب "${deleteTarget?.rep?.name || 'مندوب'}" المسجلة بتاريخ ${
          deleteTarget
            ? new Date(deleteTarget.date).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
            : ''
        }؟ هذا الإجراء نهائي ولا يمكن التراجع عنه.`}
        itemName={
          deleteTarget
            ? `تسوية ${deleteTarget.rep?.name || 'مندوب'} - الكاش المستلم: ${(
                deleteTarget.actualCash ?? 0
              ).toLocaleString('ar-EG')} ج.م`
            : undefined
        }
        isLoading={isDeleting}
        onConfirm={handleDeleteSettlement}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

import { getCurrentUser } from '@/lib/auth';
import { dbStore } from '@/lib/store';
import {
  ClipboardList,
  Wallet,
  TrendingUp,
  Package,
  RotateCcw,
  CheckCircle2,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default async function RepSummaryPage() {
  const user = await getCurrentUser();
  const summary = await dbStore.getRepDaySummary(user!.id);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-slate-900">ملخص وردية اليوم (إغلاق اليومية)</h1>
        <p className="text-xs text-slate-500">
          تقرير شامل بكل مبيعاتك والنقدية التي يجب توريدها لإدارة المستودع
        </p>
      </div>

      {/* Top Expected Cash Handover Card */}
      <div className="bg-gradient-to-br from-emerald-800 to-teal-900 rounded-3xl p-6 text-white shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-emerald-200 border border-white/20">
            النقدية الواجب توريدها للمستودع
          </span>
          <span className="text-xs text-emerald-300 font-mono">
            {new Date().toLocaleDateString('ar-EG')}
          </span>
        </div>

        <div>
          <div className="text-4xl font-black tracking-tight">
            {summary.expectedCash.toLocaleString('ar-EG')}{' '}
            <span className="text-base font-bold text-emerald-300">ج.م</span>
          </div>
          <div className="text-xs text-emerald-200 mt-1">
            إجمالي الكاش من المبيعات الفورية ({summary.todayCashFromSales} ج.م) + التحصيلات ({summary.todayCollections} ج.م)
          </div>
        </div>

        <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-emerald-300 block">فواتير اليوم:</span>
            <strong className="text-sm font-bold">{summary.todayInvoices.length} فواتير</strong>
          </div>
          <div>
            <span className="text-emerald-300 block">بضاعة متبقية بالسيارة:</span>
            <strong className="text-sm font-bold">
              {summary.currentVanStock.reduce((s, i) => s + i.quantity, 0)} كرتونة
            </strong>
          </div>
        </div>
      </div>

      {/* Van Stock Remaining Status */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-800">
              البضاعة المتبقية في سيارتك حالياً (للمطابقة):
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {summary.currentVanStock.length} أصناف
          </span>
        </div>

        {summary.currentVanStock.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
            السيارة فارغة - تم تصريف كامل العهدة اليوم.
          </div>
        ) : (
          <div className="space-y-2">
            {summary.currentVanStock.map((item) => (
              <div
                key={item.product.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
              >
                <span className="font-bold text-slate-800">{item.product.name}</span>
                <span className="font-bold font-mono text-emerald-700 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                  {item.quantity} كرتونة
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's Invoices List */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-600" />
          <span>فواتير مبيعات اليوم الصادرة:</span>
        </h2>

        {summary.todayInvoices.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
            لم تصدر أي فواتير اليوم بعد.
          </div>
        ) : (
          <div className="space-y-2">
            {summary.todayInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold font-mono text-slate-800">{inv.invoiceNumber}</div>
                  <div className="text-[11px] text-slate-500">
                    الدفع: {inv.paymentType === 'cash' ? 'نقدي' : 'آجل'}
                  </div>
                </div>
                <div className="text-left">
                  <div className="font-bold text-slate-900">{inv.totalAmount} ج.م</div>
                  <div className="text-[10px] text-emerald-600 font-bold">
                    مدفوع: {inv.paidAmount} ج.م
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Readiness Notice */}
      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
        <div>
          بياناتك محدثة ومتزامنة لحظياً مع شاشة المدير. عند وصولك للمستودع، توجه لمسؤول التسوية لتسليم الكاش وجرد السيارة.
        </div>
      </div>
    </div>
  );
}

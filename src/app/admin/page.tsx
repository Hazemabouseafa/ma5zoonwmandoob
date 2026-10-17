import Link from 'next/link';
import { dbStore } from '@/lib/store';
import {
  TrendingUp,
  Wallet,
  Users,
  FileText,
  AlertTriangle,
  Clock,
  Truck,
  ArrowLeft,
  ChevronLeft,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';

export default async function AdminDashboardPage() {
  const analytics = await dbStore.getAnalytics();
  const recentInvoices = (await dbStore.getInvoices()).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 text-emerald-200 text-xs font-semibold mb-3 border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>متابعة العمليات اللحظية • اليوم {new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mb-2">لوحة العمليات والرقابة الحية</h1>
            <p className="text-emerald-100 text-sm max-w-2xl leading-relaxed">
              متابعة حركة سيارات التوزيع، وتنبيهات الصلاحية الحرجة للألبان والعصائر، ومطابقة النقدية والعهدة فورياً لمنع أي عجز أو تلف.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/admin/dispatch"
              className="px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 font-bold rounded-xl text-sm transition shadow-sm flex items-center gap-2"
            >
              <Truck className="w-4 h-4" />
              <span>تحويل بضاعة للمناديب</span>
            </Link>
            <Link
              href="/admin/settlements"
              className="px-4 py-2.5 bg-emerald-900/80 hover:bg-emerald-950 text-white font-bold rounded-xl text-sm transition border border-emerald-500/30 flex items-center gap-2"
            >
              <span>تسوية نهاية اليوم</span>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Big KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales Today */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">إجمالي مبيعات اليوم</div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {analytics.todaySalesAmount.toLocaleString('ar-EG')} <span className="text-xs font-bold text-slate-500">ج.م</span>
            </div>
          </div>
        </div>

        {/* Cash Collected Today */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">النقدية المحصلة اليوم</div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {analytics.todayCashCollected.toLocaleString('ar-EG')} <span className="text-xs font-bold text-slate-500">ج.م</span>
            </div>
          </div>
        </div>

        {/* Active Reps */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">المناديب وسيارات التوزيع النشطة</div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {analytics.activeReps} <span className="text-xs font-bold text-slate-500">سيارات</span>
            </div>
          </div>
        </div>

        {/* Total Invoices Today */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">عدد فواتير المبيعات اليوم</div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {analytics.totalInvoicesCount} <span className="text-xs font-bold text-slate-500">فاتورة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Expiry Alerts (Short-Shelf-Life Products: Dairy & Juices) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                تنبيهات الصلاحية الحرجة بنظام FIFO (ألبان وعصائر)
              </h2>
              <p className="text-xs text-slate-500">
                دفعات تقترب من انتهاء صلاحيتها (الألبان: خلال 24 ساعة، العصائر: خلال 48 ساعة)
              </p>
            </div>
          </div>
          <Link
            href="/admin/inventory"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>عرض كل التشغيلات</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>

        {analytics.criticalBatches.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-center justify-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>ممتاز! جميع تشغيلات المستودع طازجة ولا توجد أي دفعات مهددة بانتهاء الصلاحية حالياً.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {analytics.criticalBatches.map((batch) => (
              <div
                key={batch.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                  batch.hoursRemaining <= 16
                    ? 'bg-rose-50/60 border-rose-200 hover:border-rose-300'
                    : 'bg-amber-50/60 border-amber-200 hover:border-amber-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                      رقم التشغيلة: {batch.batchNumber}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">{batch.product.name}</h3>
                    <div className="text-xs text-slate-500">
                      تصنيف: {batch.product.category === 'dairy' ? 'ألبان طازجة (1 يوم)' : batch.product.category === 'juice' ? 'عصائر طبيعية' : `${batch.product.category} (${batch.product.shelfLifeDays} يوم)`}
                    </div>
                  </div>
                  <div
                    className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                      batch.hoursRemaining <= 16
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-500 text-white'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {batch.hoursRemaining <= 0
                        ? 'منتهية الصلاحية'
                        : `متبقي ${batch.hoursRemaining} ساعة`}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600">
                    الكمية المتبقية: <strong className="text-slate-900">{batch.quantity} كرتونة</strong>
                  </span>
                  <Link
                    href={`/admin/dispatch?batchId=${batch.id}`}
                    className="text-emerald-700 hover:text-emerald-800 font-bold underline"
                  >
                    توزيع فوري للمناديب
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Reps Monitoring Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                الرقابة اللحظية على خطوط سير وسيارات المناديب
              </h2>
              <p className="text-xs text-slate-500">
                متابعة حركة المبيعات، عهدة السيارة المتبقية، والتحصيلات لكل مندوب لحظة بلحظة
              </p>
            </div>
          </div>
          <Link
            href="/admin/reps"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>إدارة المناديب</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.repPerformance.map((item) => (
            <div
              key={item.rep.id}
              className="p-5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition bg-slate-50/50 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{item.rep.name}</h3>
                    <div className="text-xs text-emerald-700 font-medium">
                      {item.rep.assignedRoute || 'خط سير افتراضي'}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    نشط في الميدان
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-200 text-center my-3">
                  <div>
                    <div className="text-[11px] text-slate-500">مبيعات اليوم</div>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">
                      {item.todaySales.toLocaleString('ar-EG')} ج.م
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">الكاش المحصل</div>
                    <div className="font-bold text-emerald-600 text-sm mt-0.5">
                      {item.todayCash.toLocaleString('ar-EG')} ج.م
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">بضاعة بالسيارة</div>
                    <div className="font-bold text-blue-600 text-sm mt-0.5">
                      {item.vanUnitsRemaining} كرتونة
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Link
                  href={`/admin/dispatch?repId=${item.rep.id}`}
                  className="flex-1 py-2 text-center text-xs font-bold rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition"
                >
                  تحويل عهدة
                </Link>
                <Link
                  href={`/admin/settlements?repId=${item.rep.id}`}
                  className="flex-1 py-2 text-center text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs"
                >
                  تسوية اليومية
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">آخر فواتير المبيعات الصادرة</h2>
          <span className="text-xs text-slate-500 font-medium">تحديث فوري وتلقائي</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs">
                <th className="pb-3 pr-2">رقم الفاتورة</th>
                <th className="pb-3">العميل</th>
                <th className="pb-3">المندوب</th>
                <th className="pb-3">طريقة الدفع</th>
                <th className="pb-3">الإجمالي</th>
                <th className="pb-3">المدفوع</th>
                <th className="pb-3 pl-2">الوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 pr-2 font-mono font-bold text-slate-800">{inv.invoiceNumber}</td>
                  <td className="py-3 font-semibold text-slate-900">{inv.client.name}</td>
                  <td className="py-3 text-slate-600">{inv.rep.name}</td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        inv.paymentType === 'cash'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {inv.paymentType === 'cash' ? 'نقدي' : 'آجل'}
                    </span>
                  </td>
                  <td className="py-3 font-bold text-slate-900">
                    {inv.totalAmount.toLocaleString('ar-EG')} ج.م
                  </td>
                  <td className="py-3 font-semibold text-emerald-600">
                    {inv.paidAmount.toLocaleString('ar-EG')} ج.م
                  </td>
                  <td className="py-3 pl-2 text-xs text-slate-500 font-mono">
                    {new Date(inv.createdAt).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

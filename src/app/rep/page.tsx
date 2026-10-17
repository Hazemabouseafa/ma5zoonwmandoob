import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { dbStore } from '@/lib/store';
import {
  Package,
  PlusCircle,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowLeft,
  HandCoins,
} from 'lucide-react';

export default async function RepVanStockPage() {
  const user = await getCurrentUser();
  const vanStock = await dbStore.getRepVanStock(user!.id);
  const totalCartons = vanStock.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="space-y-4">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-700 rounded-3xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 text-emerald-100 backdrop-blur-xs">
            عهدة السيارة الحالية
          </span>
          <span className="text-xs text-emerald-200 font-mono">
            نظام FIFO الذكي
          </span>
        </div>

        <div className="flex items-baseline justify-between mt-1">
          <div>
            <div className="text-3xl font-black">{totalCartons}</div>
            <div className="text-xs text-emerald-100">إجمالي الكراتين المتاحة بالسيارة</div>
          </div>

          <Link
            href="/rep/new-invoice"
            className="px-4 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-2xl font-bold text-xs shadow-md transition flex items-center gap-1.5 active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-emerald-700" />
            <span>فاتورة بيع</span>
          </Link>
        </div>
      </div>

      {/* Quick Action Pills */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/rep/advances"
          className="p-3 bg-white hover:bg-emerald-50 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-2.5 transition active:scale-98"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <HandCoins className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-right">
            <div className="text-xs font-black text-slate-900">طلب سلفة مالية</div>
            <div className="text-[10px] text-slate-500">تقديم سلفة مؤقتة</div>
          </div>
        </Link>

        <Link
          href="/rep/collections"
          className="p-3 bg-white hover:bg-emerald-50 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-2.5 transition active:scale-98"
        >
          <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-teal-700" />
          </div>
          <div className="text-right">
            <div className="text-xs font-black text-slate-900">تسجيل تحصيل</div>
            <div className="text-[10px] text-slate-500">تحصيل مديونية عميل</div>
          </div>
        </Link>
      </div>

      {/* Van Stock List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-slate-700">
            البضاعة في سيارتك (مرتبة حسب الأقدم انتهاءً لتصريفها أولاً)
          </h2>
          <span className="text-[11px] text-slate-500">{vanStock.length} أصناف</span>
        </div>

        {vanStock.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-xs space-y-3">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl mx-auto flex items-center justify-center">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">سيارتك فارغة حالياً</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              تواصل مع مسؤول المستودع لتحميل بضاعة لسيارتك للبدء في خط السير والبيع.
            </p>
          </div>
        ) : (
          vanStock.map((item) => {
            const isShortLived = item.product.shelfLifeDays <= 1 || item.product.category?.includes('لبن') || item.product.category === 'dairy';
            const isUrgent = item.hoursRemaining <= (isShortLived ? 16 : 48);
            const isExpired = item.hoursRemaining <= 0;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between gap-3 transition active:bg-slate-50"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{item.product.name}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        isShortLived ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {item.product.category === 'dairy' ? 'ألبان' : item.product.category === 'juice' ? 'عصائر' : item.product.category}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500">
                    سعر البيع: <strong className="text-slate-800">{item.product.price} ج.م</strong>
                    <span className="mx-1 text-slate-300">•</span>
                    <span className="font-mono text-[11px]">تشغيلة {item.batch.batchNumber}</span>
                  </div>

                  {/* Expiry Badge */}
                  <div className="pt-1 flex items-center gap-1.5">
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        isExpired
                          ? 'bg-rose-100 text-rose-800'
                          : isUrgent
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>
                        {isExpired
                          ? 'منتهية الصلاحية'
                          : isUrgent
                          ? `حرجة: متبقي ${item.hoursRemaining} ساعة`
                          : `متبقي ${item.hoursRemaining} ساعة`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Big Quantity Display */}
                <div className="text-left bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 flex flex-col items-center justify-center min-w-[70px]">
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {item.quantity}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">كرتونة</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Action Button */}
      {vanStock.length > 0 && (
        <div className="pt-2">
          <Link
            href="/rep/new-invoice"
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 text-center flex items-center justify-center gap-2 text-base transition"
          >
            <PlusCircle className="w-5 h-5" />
            <span>إنشاء فاتورة بيع جديدة الآن</span>
          </Link>
        </div>
      )}
    </div>
  );
}

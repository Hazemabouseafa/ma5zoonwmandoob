import { dbStore } from '@/lib/store';
import {
  BarChart3,
  Trophy,
  Users,
  TrendingUp,
  PackageCheck,
  CreditCard,
  Building,
  Sparkles,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminAnalyticsPage() {
  const analytics = await dbStore.getAnalytics();
  const clients = await dbStore.getClients();

  const totalClientCredits = clients.reduce((sum, c) => sum + c.creditBalance, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">
          تحليلات المبيعات وأداء المنتجات والعملاء
        </h1>
        <p className="text-sm text-slate-500">
          رؤى شاملة حول المنتجات الأكثر طلباً، وأفضل العملاء، وحجم المديونيات في السوق
        </p>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">أعلى صنف مبيعاً</div>
            <div className="text-base font-bold text-slate-900 mt-1">
              {analytics.topProducts[0]?.product.name || 'لا توجد مبيعات بعد'}
            </div>
            <div className="text-xs text-amber-700 font-semibold mt-0.5">
              {analytics.topProducts[0]?.quantitySold || 0} كرتونة مباعة
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">أكبر عميل مشتريات</div>
            <div className="text-base font-bold text-slate-900 mt-1">
              {analytics.topClients[0]?.client.name || 'لا يوجد'}
            </div>
            <div className="text-xs text-emerald-700 font-semibold mt-0.5">
              {(analytics.topClients[0]?.totalPurchases || 0).toLocaleString('ar-EG')} ج.م
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center flex-shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">إجمالي مديونيات العملاء في السوق</div>
            <div className="text-base font-black text-rose-700 mt-1">
              {totalClientCredits.toLocaleString('ar-EG')} ج.م
            </div>
            <div className="text-xs text-slate-500 mt-0.5">مبالغ آجلة مستحقة التحصيل</div>
          </div>
        </div>
      </div>

      {/* Two Columns: Top Products & Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
            <PackageCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                أكثر المنتجات طلباً ومبيعاً (Top Selling Products)
              </h2>
              <p className="text-xs text-slate-500">مرتبة حسب حجم الكميات والإيرادات</p>
            </div>
          </div>

          <div className="space-y-3">
            {analytics.topProducts.map((item, idx) => (
              <div
                key={item.product.id}
                className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      idx === 0
                        ? 'bg-amber-400 text-amber-950 shadow-xs'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-800'
                        : idx === 2
                        ? 'bg-amber-700 text-amber-100'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{item.product.name}</div>
                      {item.product.category === 'dairy'
                        ? 'ألبان طازجة'
                        : item.product.category === 'juice'
                        ? 'عصائر طبيعية'
                        : item.product.category}
                  </div>
                </div>

                <div className="text-left">
                  <div className="font-bold text-slate-900 text-sm">
                    {item.quantitySold} كرتونة
                  </div>
                  <div className="text-xs text-emerald-700 font-semibold">
                    {item.totalRevenue.toLocaleString('ar-EG')} ج.م
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Clients by Purchasing Volume */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
            <Building className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                أفضل العملاء بالشراء (Top Clients)
              </h2>
              <p className="text-xs text-slate-500">العملاء الأكثر سحباً للبضاعة ونشاطاً</p>
            </div>
          </div>

          <div className="space-y-3">
            {analytics.topClients.map((item, idx) => (
              <div
                key={item.client.id}
                className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{item.client.name}</div>
                    <div className="text-xs text-slate-500">{item.client.address || 'القاهرة'}</div>
                  </div>
                </div>

                <div className="text-left">
                  <div className="font-bold text-slate-900 text-sm">
                    {item.totalPurchases.toLocaleString('ar-EG')} ج.م
                  </div>
                  <div className="text-xs text-slate-500">
                    مديونية حالية:{' '}
                    <strong
                      className={
                        item.client.creditBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }
                    >
                      {item.client.creditBalance.toLocaleString('ar-EG')} ج.م
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

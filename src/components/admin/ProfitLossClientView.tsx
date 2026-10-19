'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProfitLossSummary, PayrollPayment } from '@/types';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  ShoppingBag,
  Users,
  Tag,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Search,
  Layers,
  Sparkles,
  Calculator,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import Link from 'next/link';

interface ProductProfitItem {
  productId: string;
  productName: string;
  category: string;
  unitsSold: number;
  revenue: number;
  cost: number;
  profit: number;
  marginPercent: number;
}

interface Props {
  initialData: {
    summary: ProfitLossSummary;
    productBreakdown: ProductProfitItem[];
    recentPayroll: (PayrollPayment & { employeeName: string; employeeRole: string })[];
  };
}

export default function ProfitLossClientView({ initialData }: Props) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchProduct, setSearchProduct] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const { summary, productBreakdown, recentPayroll } = data;

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Filtered products
  const filteredProducts = productBreakdown.filter((item) => {
    const matchSearch = item.productName.toLowerCase().includes(searchProduct.toLowerCase());
    const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const categories = Array.from(new Set(productBreakdown.map((p) => p.category))).filter(Boolean);

  const isNetPositive = summary.netProfit >= 0;

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>نظام الحسابات المالية التلقائي الفوري</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            ملخص الأداء المالي والأرباح الصافية
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            يتم تحديث جميع الأرقام آلياً فور تسجيل كل فاتورة بيع، شراء مورد، صرف مرتب أو إرجاع تالف
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>تحديث فوري</span>
          </button>
          <Link
            href="/admin/employees"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2"
          >
            <Users className="w-3.5 h-3.5" />
            <span>إدارة المرتبات</span>
          </Link>
        </div>
      </div>

      {/* Hero Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Net Profit Card (Hero) */}
        <div
          className={`p-6 rounded-3xl border shadow-sm relative overflow-hidden transition ${
            isNetPositive
              ? 'bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 border-emerald-200'
              : 'bg-gradient-to-br from-rose-50 via-white to-rose-50/30 border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">صافي الأرباح الحقيقي النهائي</span>
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isNetPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
              }`}
            >
              {isNetPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-2">
            <div
              className={`text-3xl font-black tracking-tight ${
                isNetPositive ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {summary.netProfit.toLocaleString('ar-EG')}{' '}
              <span className="text-sm font-bold text-slate-500">ج.م</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black ${
                  isNetPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                <Percent className="w-3 h-3" />
                {summary.netMarginPercent.toFixed(1)}% هامش صافي
              </span>
              <span className="text-xs text-slate-400">بعد كل المصروفات والتكاليف</span>
            </div>
          </div>
        </div>

        {/* 2. Total Invoiced Revenue Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">إجمالي إيرادات المبيعات</span>
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-2">
              {summary.totalRevenue.toLocaleString('ar-EG')}{' '}
              <span className="text-sm font-bold text-slate-500">ج.م</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>نقدية: {summary.totalCollectedCash.toLocaleString('ar-EG')} ج.م</span>
            <span>آجل: {summary.totalPendingCredit.toLocaleString('ar-EG')} ج.م</span>
          </div>
        </div>

        {/* 3. Cost of Goods Sold (COGS) & Gross Profit */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">تكلفة البضاعة المباعة (COGS)</span>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 mt-2">
              {summary.cogs.toLocaleString('ar-EG')}{' '}
              <span className="text-sm font-bold text-slate-500">ج.م</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">مجمل الربح:</span>
            <span className="font-bold text-emerald-600">
              {summary.grossProfit.toLocaleString('ar-EG')} ج.م ({summary.grossMarginPercent.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* 4. Total Operating Expenses & Deductions */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">المصروفات والخصومات والتوالف</span>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <PieChart className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-rose-600 mt-2">
              {summary.totalExpenses.toLocaleString('ar-EG')}{' '}
              <span className="text-sm font-bold text-slate-500">ج.م</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>مرتبات: {summary.totalSalaries.toLocaleString('ar-EG')} ج.م</span>
            <span>خصومات: {summary.totalDiscounts.toLocaleString('ar-EG')} ج.م</span>
          </div>
        </div>
      </div>

      {/* Step-by-Step P&L Financial Statement Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900">قائمة الدخل والأرباح التفصيلية (P&L Breakdown)</h3>
              <p className="text-xs text-slate-500">
                تسلسل احتساب صافي الربح من إجمالي الإيرادات وحتى الصافي النهائي بعد كافة الاستقطاعات
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            معادلة مالية معتمدة
          </span>
        </div>

        <div className="space-y-3 font-mono text-sm">
          {/* Revenue */}
          <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                +
              </span>
              <span className="font-bold text-slate-800">إجمالي إيرادات المبيعات (Total Revenue)</span>
            </div>
            <span className="font-black text-blue-900 text-base">
              {summary.totalRevenue.toLocaleString('ar-EG')} ج.م
            </span>
          </div>

          {/* COGS */}
          <div className="p-3 rounded-2xl bg-amber-50/50 border border-amber-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                -
              </span>
              <span className="font-bold text-slate-800">تكلفة البضاعة المباعة (Cost of Goods Sold - COGS)</span>
            </div>
            <span className="font-black text-amber-900 text-base">
              ({summary.cogs.toLocaleString('ar-EG')} ج.م)
            </span>
          </div>

          {/* Gross Profit Subtotal */}
          <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-slate-700 text-white flex items-center justify-center font-bold text-xs">
                =
              </span>
              <span className="font-black text-slate-900">
                مجمل الربح التجاري (Gross Profit) — هامش {summary.grossMarginPercent.toFixed(1)}%
              </span>
            </div>
            <span className="font-black text-slate-900 text-base">
              {summary.grossProfit.toLocaleString('ar-EG')} ج.م
            </span>
          </div>

          {/* Salaries */}
          <div className="p-3 rounded-2xl bg-rose-50/40 border border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-xs">
                -
              </span>
              <span className="font-bold text-slate-800">مرتبات وأجور العاملين والموظفين</span>
            </div>
            <span className="font-black text-rose-700 text-base">
              ({summary.totalSalaries.toLocaleString('ar-EG')} ج.م)
            </span>
          </div>

          {/* Discounts */}
          <div className="p-3 rounded-2xl bg-rose-50/40 border border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-xs">
                -
              </span>
              <span className="font-bold text-slate-800">إجمالي الخصومات الممنوحة للعملاء</span>
            </div>
            <span className="font-black text-rose-700 text-base">
              ({summary.totalDiscounts.toLocaleString('ar-EG')} ج.م)
            </span>
          </div>

          {/* Wastage */}
          <div className="p-3 rounded-2xl bg-rose-50/40 border border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-xs">
                -
              </span>
              <span className="font-bold text-slate-800">خسائر توالف البضاعة والمرتجعات التالفة</span>
            </div>
            <span className="font-black text-rose-700 text-base">
              ({summary.totalWastageLoss.toLocaleString('ar-EG')} ج.م)
            </span>
          </div>

          {/* Final Net Profit */}
          <div
            className={`p-4 rounded-2xl border-2 flex items-center justify-between mt-2 ${
              isNetPositive
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                : 'bg-rose-50 border-rose-500 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-8 h-8 rounded-xl text-white flex items-center justify-center font-black text-sm ${
                  isNetPositive ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
              >
                =
              </span>
              <div>
                <div className="font-black text-lg">صافي الربح الحقيقي للشركة (Net Profit)</div>
                <div className="text-xs text-slate-500 font-sans">
                  الأرباح الفعلية القابلة للتوزيع بعد تغطية كافة النفقات والتكاليف
                </div>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-2xl font-black ${
                  isNetPositive ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {summary.netProfit.toLocaleString('ar-EG')} ج.م
              </div>
              <div className="text-xs font-bold text-slate-500">
                نسبة الهامش الصافي: {summary.netMarginPercent.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Profitability Analysis */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900">تحليل ربحية الأصناف والمنتجات</h3>
              <p className="text-xs text-slate-500">
                متابعة الأصناف الأكثر تحقيقاً للأرباح وهوامش الربحية لكل منتج
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                placeholder="بحث عن صنف..."
                className="w-full pl-3 pr-9 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
              >
                <option value="ALL">جميع التصنيفات</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 px-4">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 font-bold">لا توجد مبيعات مسجلة للأصناف حتى الآن</p>
              <p className="text-xs text-slate-400 mt-1">
                فور إصدار فواتير بيع للأصناف، سيظهر تحليل الربحية والتكلفة هنا
              </p>
            </div>
          ) : (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-bold text-slate-500">
                  <th className="py-3 px-4">الصنف</th>
                  <th className="py-3 px-4">التصنيف</th>
                  <th className="py-3 px-4 text-center">الكمية المباعة</th>
                  <th className="py-3 px-4">إجمالي الإيراد</th>
                  <th className="py-3 px-4">إجمالي التكلفة</th>
                  <th className="py-3 px-4">مجمل ربح الصنف</th>
                  <th className="py-3 px-4 text-center">هامش الربح</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredProducts.map((p) => {
                  const isPositive = p.profit >= 0;
                  return (
                    <tr key={p.productId} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{p.productName}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                        {p.unitsSold.toLocaleString('ar-EG')}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {p.revenue.toLocaleString('ar-EG')} ج.م
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-500">
                        {p.cost.toLocaleString('ar-EG')} ج.م
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-black ${
                            isPositive ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {p.profit.toLocaleString('ar-EG')} ج.م
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                            isPositive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {p.marginPercent.toFixed(1)}%
                        </span>
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
  );
}

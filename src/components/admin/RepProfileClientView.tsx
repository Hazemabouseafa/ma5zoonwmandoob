'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Invoice, PaymentType } from '@/types';
import { resetRepPasswordAction, toggleRepStatusAction } from '@/lib/actions';
import {
  Users,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Banknote,
  RotateCcw,
  Scale,
  Truck,
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  Lock,
  KeyRound,
  Printer,
  Calendar,
  AlertCircle,
  X,
  Store,
  Layers,
  HandCoins,
  Percent,
  Check,
} from 'lucide-react';

interface Props {
  analytics: {
    rep: User;
    sales: {
      totalSales: number;
      totalSubtotal: number;
      totalDiscounts: number;
      totalReturnsDeducted: number;
      cashSales: number;
      creditSales: number;
      cashPaidOnCredit: number;
      totalCashGeneratedFromInvoices: number;
      invoicesCount: number;
      invoices: (Invoice & { clientName: string })[];
    };
    collections: {
      totalCollected: number;
      collectionsCount: number;
      collectionsList: {
        id: string;
        amount: number;
        notes?: string;
        createdAt: string;
        clientName: string;
      }[];
      totalClientsDebt: number;
      clientsCount: number;
      clients: {
        id: string;
        name: string;
        phone?: string;
        address?: string;
        creditBalance: number;
      }[];
    };
    returns: {
      totalReturnedItems: number;
      expiredCount: number;
      damagedCount: number;
      returnsList: {
        id: string;
        productId: string;
        productName: string;
        quantity: number;
        unitPrice: number;
        reason: 'expired' | 'damaged';
        notes?: string;
        createdAt: string;
      }[];
    };
    vanStock: {
      totalVanCartons: number;
      totalVanValue: number;
      items: {
        id: string;
        productId: string;
        batchId: string;
        quantity: number;
        product: { name: string; price: number; unit: string; category: string };
        batch: { batchNumber: string; expiryDate: string };
        hoursRemaining: number;
      }[];
      urgentCount: number;
    };
    settlements: {
      totalSettlements: number;
      balancedSettlements: number;
      discrepancySettlements: number;
      totalCashDifference: number;
      settlementsList: {
        id: string;
        date: string;
        expectedCash: number;
        actualCash: number;
        cashDifference: number;
        stockDiscrepancies?: string;
        status: 'balanced' | 'discrepancy';
        notes?: string;
        createdAt: string;
      }[];
    };
    advances: {
      totalAdvancesApproved: number;
      advancesList: {
        id: string;
        amount: number;
        reason: string;
        status: 'pending' | 'approved' | 'rejected';
        managerNotes?: string;
        createdAt: string;
      }[];
    };
  };
}

export default function RepProfileClientView({ analytics }: Props) {
  const router = useRouter();
  const { rep, sales, collections, returns, vanStock, settlements, advances } = analytics;

  const [activeTab, setActiveTab] = useState<'sales' | 'vanStock' | 'returns' | 'collections' | 'settlements'>('sales');

  // Rep status and password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Selected invoice modal
  const [selectedInvoice, setSelectedInvoice] = useState<(Invoice & { clientName: string }) | null>(null);

  // Collection efficiency
  const totalFinancialResponsibility = collections.totalCollected + collections.totalClientsDebt;
  const collectionEfficiency = totalFinancialResponsibility > 0
    ? Math.round((collections.totalCollected / totalFinancialResponsibility) * 100)
    : 100;

  // Wastage / Return Ratio
  const totalVolumeHandled = sales.invoices.reduce((s, i) => s + i.items.reduce((sum, item) => sum + item.quantity, 0), 0);
  const wastageRatio = totalVolumeHandled > 0
    ? ((returns.totalReturnedItems / totalVolumeHandled) * 100).toFixed(1)
    : '0';

  // Toggle active status
  const handleToggleStatus = async () => {
    setLoading(true);
    const res = await toggleRepStatusAction(rep.id, rep.isActive);
    setLoading(false);
    if (res.success) {
      setActionMsg({ type: 'success', text: `تم ${rep.isActive ? 'تعطيل' : 'تفعيل'} الحساب بنجاح` });
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('app:sync'));
      router.refresh();
    } else {
      setActionMsg({ type: 'error', text: res.error || 'فشل التحديث' });
    }
  };

  // Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 3) {
      alert('كلمة المرور يجب أن لا تقل عن 3 أحرف/أرقام');
      return;
    }

    setLoading(true);
    const res = await resetRepPasswordAction(rep.id, newPassword);
    setLoading(false);

    if (res.success) {
      setShowPasswordModal(false);
      setNewPassword('');
      setActionMsg({ type: 'success', text: 'تم تحديث كلمة المرور للمندوب بنجاح' });
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('app:sync'));
      router.refresh();
    } else {
      setActionMsg({ type: 'error', text: res.error || 'فشل التحديث' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/reps"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لقائمة المناديب</span>
        </Link>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-xs"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>طباعة تقرير أداء المندوب</span>
        </button>
      </div>

      {actionMsg && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
            actionMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {actionMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-2xl shadow-inner">
            {rep.name.charAt(0)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">{rep.name}</h1>
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
            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-700">
                @{rep.username}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>خط السير: <strong className="text-slate-700">{rep.assignedRoute || 'غير محدد'}</strong></span>
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>الهاتف: <strong className="text-slate-700">{rep.phone || 'غير مسجل'}</strong></span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>تغيير كلمة السر</span>
          </button>

          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={loading}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
              rep.isActive
                ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            {rep.isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}
          </button>
        </div>
      </div>

      {/* 5 Core 360-Degree Performance Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Metric 1: Sales & Revenue */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold">المبيعات الإجمالية</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {sales.totalSales.toLocaleString('ar-EG')}{' '}
            <span className="text-xs font-bold text-slate-500">ج.م</span>
          </div>
          <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
            <div className="flex justify-between">
              <span>كاش:</span>
              <strong className="text-emerald-700 font-mono">{sales.cashSales.toLocaleString('ar-EG')} ج.م</strong>
            </div>
            <div className="flex justify-between">
              <span>آجل:</span>
              <strong className="text-blue-700 font-mono">{sales.creditSales.toLocaleString('ar-EG')} ج.م</strong>
            </div>
          </div>
        </div>

        {/* Metric 2: Collections & Financials */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold">التحصيلات والمديونيات</span>
            <Banknote className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-emerald-700 font-mono">
            {collections.totalCollected.toLocaleString('ar-EG')}{' '}
            <span className="text-xs font-bold text-slate-500">ج.م</span>
          </div>
          <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
            <div className="flex justify-between">
              <span>كفاءة التحصيل:</span>
              <strong className="text-emerald-800 font-mono">{collectionEfficiency}%</strong>
            </div>
            <div className="flex justify-between">
              <span>مديونيات باقية:</span>
              <strong className="text-rose-600 font-mono">{collections.totalClientsDebt.toLocaleString('ar-EG')} ج.م</strong>
            </div>
          </div>
        </div>

        {/* Metric 3: Returns & Wastage */}
        <div className="bg-white rounded-2xl p-4 border border-rose-200 bg-rose-50/20 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[11px] font-bold">المرتجعات والتالف</span>
            <RotateCcw className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-black text-rose-900 font-mono">
            {returns.totalReturnedItems}{' '}
            <span className="text-xs font-bold text-rose-700">كرتونة</span>
          </div>
          <div className="text-[11px] text-rose-700 space-y-0.5 pt-1 border-t border-rose-200/60">
            <div className="flex justify-between">
              <span>منتهي الصلاحية:</span>
              <strong className="font-mono">{returns.expiredCount} كرتونة</strong>
            </div>
            <div className="flex justify-between">
              <span>تالف / عيب تغليف:</span>
              <strong className="font-mono">{returns.damagedCount} كرتونة</strong>
            </div>
          </div>
        </div>

        {/* Metric 4: Van Stock */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold">عهدة السيارة الحالية</span>
            <Truck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {vanStock.totalVanCartons}{' '}
            <span className="text-xs font-bold text-slate-500">كرتونة</span>
          </div>
          <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
            <div className="flex justify-between">
              <span>القيمة التقديرية:</span>
              <strong className="font-mono text-purple-800">{vanStock.totalVanValue.toLocaleString('ar-EG')} ج.م</strong>
            </div>
            <div className="flex justify-between">
              <span>تشغيلات حرجة:</span>
              <strong className={vanStock.urgentCount > 0 ? 'text-amber-600 font-mono font-bold' : 'text-slate-400 font-mono'}>
                {vanStock.urgentCount} تشغيلة
              </strong>
            </div>
          </div>
        </div>

        {/* Metric 5: Settlement Accuracy */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold">التسويات اليومية</span>
            <Scale className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-slate-900 font-mono">
            {settlements.balancedSettlements} / {settlements.totalSettlements}{' '}
            <span className="text-xs font-bold text-slate-500">مطابقة</span>
          </div>
          <div className="text-[11px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-100">
            <div className="flex justify-between">
              <span>تسويات بعجز:</span>
              <strong className={settlements.discrepancySettlements > 0 ? 'text-rose-600 font-mono' : 'text-slate-400 font-mono'}>
                {settlements.discrepancySettlements}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>فروقات نقدية:</span>
              <strong className={settlements.totalCashDifference !== 0 ? 'text-rose-600 font-mono' : 'text-emerald-700 font-mono'}>
                {settlements.totalCashDifference.toLocaleString('ar-EG')} ج.م
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'sales'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>فواتير المبيعات الصادرة ({sales.invoicesCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vanStock')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'vanStock'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>المخزون الحالي بالسيارة ({vanStock.totalVanCartons} كرتونة)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('returns')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'returns'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>المرتجعات والتالف المستلم ({returns.totalReturnedItems} كرتونة)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('collections')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'collections'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>التحصيلات ومديونيات المنافذ ({collections.clientsCount} منفذ)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settlements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'settlements'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>التسويات اليومية والسلف ({settlements.totalSettlements})</span>
        </button>
      </div>

      {/* TAB 1: SALES INVOICES */}
      {activeTab === 'sales' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              سجل فواتير مبيعات المندوب
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              إجمالي المبيعات: {sales.totalSales.toLocaleString('ar-EG')} ج.م
            </span>
          </div>

          {sales.invoices.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              لم يقم هذا المندوب بإصدار أي فواتير مبيعات حتى الآن.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs bg-slate-50/40">
                    <th className="py-3 pr-4">رقم الفاتورة</th>
                    <th className="py-3">العميل / المنفذ</th>
                    <th className="py-3">المجموع قبل الخصم</th>
                    <th className="py-3">الخصم / المرتجع</th>
                    <th className="py-3">الصافي المطلوب</th>
                    <th className="py-3">طريقة الدفع</th>
                    <th className="py-3">المدفوع / المتبقي</th>
                    <th className="py-3">التاريخ والوقت</th>
                    <th className="py-3 pl-4 text-center">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sales.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 pr-4 font-mono font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 font-bold text-slate-800">
                        {inv.clientName}
                      </td>
                      <td className="py-3 font-mono text-xs text-slate-600">
                        {(inv.subtotal || inv.totalAmount).toLocaleString('ar-EG')} ج.م
                      </td>
                      <td className="py-3 text-xs">
                        {inv.discount && inv.discount > 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-0.5">
                            خصم: -{inv.discount} ج.م
                          </span>
                        ) : null}
                        {inv.returnsTotal && inv.returnsTotal > 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded-md font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            مرتجع: -{inv.returnsTotal} ج.م
                          </span>
                        ) : null}
                        {!inv.discount && !inv.returnsTotal && <span className="text-slate-400 font-mono">-</span>}
                      </td>
                      <td className="py-3 font-mono font-black text-slate-900 text-sm">
                        {inv.totalAmount.toLocaleString('ar-EG')} ج.م
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            inv.paymentType === 'cash'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {inv.paymentType === 'cash' ? 'نقدي' : 'آجل'}
                        </span>
                      </td>
                      <td className="py-3 text-xs">
                        <div className="font-bold text-emerald-700">
                          مدفوع: {inv.paidAmount.toLocaleString('ar-EG')} ج.م
                        </div>
                        {inv.totalAmount - inv.paidAmount > 0 && (
                          <div className="text-rose-600 font-bold">
                            آجل: {(inv.totalAmount - inv.paidAmount).toLocaleString('ar-EG')} ج.م
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-xs font-mono text-slate-500">
                        {new Date(inv.createdAt).toLocaleDateString('ar-EG')} - {new Date(inv.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </td>
                      <td className="py-3 pl-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                        >
                          عرض الأصناف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CURRENT VAN STOCK */}
      {activeTab === 'vanStock' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              الأصناف والتشغيلات المحملة حالياً في سيارة المندوب
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              إجمالي الكراتين بالسيارة: {vanStock.totalVanCartons} كرتونة | القيمة: {vanStock.totalVanValue.toLocaleString('ar-EG')} ج.م
            </span>
          </div>

          {vanStock.items.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              لا توجد بضاعة محملة حالياً في سيارة هذا المندوب.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs bg-slate-50/40">
                    <th className="py-3 pr-4">اسم الصنف</th>
                    <th className="py-3">التصنيف</th>
                    <th className="py-3">رقم التشغيلة</th>
                    <th className="py-3">الكمية بالسيارة</th>
                    <th className="py-3">سعر الكرتونة</th>
                    <th className="py-3">القيمة الإجمالية</th>
                    <th className="py-3">تاريخ الانتهاء</th>
                    <th className="py-3 pl-4">حالة الصلاحية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vanStock.items.map((it) => {
                    const isUrgent = it.hoursRemaining <= 24;
                    const isCritical = it.hoursRemaining <= 12;

                    return (
                      <tr key={it.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 pr-4 font-bold text-slate-900">
                          {it.product?.name || 'صنف'}
                        </td>
                        <td className="py-3 text-xs text-slate-600">
                          {it.product?.category || 'عام'}
                        </td>
                        <td className="py-3 font-mono text-xs text-slate-500">
                          {it.batch?.batchNumber || 'BATCH'}
                        </td>
                        <td className="py-3 font-mono font-black text-slate-900 text-sm">
                          {it.quantity} {it.product?.unit || 'كرتونة'}
                        </td>
                        <td className="py-3 font-mono text-xs text-slate-600">
                          {it.product?.price || 0} ج.م
                        </td>
                        <td className="py-3 font-mono font-bold text-emerald-700">
                          {(it.quantity * (it.product?.price || 0)).toLocaleString('ar-EG')} ج.م
                        </td>
                        <td className="py-3 font-mono text-xs text-slate-600">
                          {it.batch?.expiryDate ? new Date(it.batch.expiryDate).toLocaleDateString('ar-EG') : '-'}
                        </td>
                        <td className="py-3 pl-4">
                          {isCritical ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              حرج: باقي {it.hoursRemaining} ساعة
                            </span>
                          ) : isUrgent ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              أولوية صرف (باقي {it.hoursRemaining} س)
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              صالح (باقي {it.hoursRemaining} س)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RETURNS & WASTAGE */}
      {activeTab === 'returns' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              سجل المرتجعات والتوالف المستلمة بواسطة المندوب
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              نسبة الهدر التقديرية: {wastageRatio}%
            </span>
          </div>

          {returns.returnsList.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">
              سجل ممتاز! لا توجد مرتجعات أو توالف مسجلة لهذا المندوب.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-xs bg-slate-50/40">
                    <th className="py-3 pr-4">الصنف المرتجع</th>
                    <th className="py-3">الكمية</th>
                    <th className="py-3">سبب الإرجاع</th>
                    <th className="py-3">سعر الوحدة</th>
                    <th className="py-3">القيمة المخصومة</th>
                    <th className="py-3">تاريخ الاستلام</th>
                    <th className="py-3 pl-4">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {returns.returnsList.map((ret) => (
                    <tr key={ret.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 pr-4 font-bold text-slate-900">
                        {ret.productName}
                      </td>
                      <td className="py-3 font-mono font-bold text-slate-900">
                        {ret.quantity} كرتونة
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            ret.reason === 'expired'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}
                        >
                          {ret.reason === 'expired' ? 'منتهي الصلاحية' : 'تالف / عيب تغليف'}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-xs text-slate-600">
                        {ret.unitPrice} ج.م
                      </td>
                      <td className="py-3 font-mono font-bold text-rose-700">
                        -{(ret.quantity * ret.unitPrice).toLocaleString('ar-EG')} ج.م
                      </td>
                      <td className="py-3 text-xs font-mono text-slate-500">
                        {new Date(ret.createdAt).toLocaleDateString('ar-EG')}
                      </td>
                      <td className="py-3 pl-4 text-xs text-slate-500">
                        {ret.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: COLLECTIONS & CLIENT DEBTS */}
      {activeTab === 'collections' && (
        <div className="space-y-6">
          {/* Clients in route with debts */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                المنافذ والمحلات التابعة للمندوب وأرصدة المديونيات
              </h3>
              <span className="text-xs font-bold text-rose-700">
                إجمالي ديون المنافذ: {collections.totalClientsDebt.toLocaleString('ar-EG')} ج.م
              </span>
            </div>

            {collections.clients.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500">
                لا توجد منافذ مسجلة باسم هذا المندوب حتى الآن.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-xs bg-slate-50/40">
                      <th className="py-3 pr-4">اسم المنفذ / السوبرماركت</th>
                      <th className="py-3">الهاتف</th>
                      <th className="py-3">العنوان</th>
                      <th className="py-3 pl-4">رصيد المديونية الآجلة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {collections.clients.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 pr-4 font-bold text-slate-900">
                          {c.name}
                        </td>
                        <td className="py-3 text-xs font-mono text-slate-600">
                          {c.phone || '-'}
                        </td>
                        <td className="py-3 text-xs text-slate-600">
                          {c.address || '-'}
                        </td>
                        <td className="py-3 pl-4">
                          {c.creditBalance > 0 ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-300 font-mono">
                              {c.creditBalance.toLocaleString('ar-EG')} ج.م
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                              خالص (0 ج.م)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Past collections list */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">سجل عمليات التحصيل المالي النقدية</h3>
              <span className="text-xs font-bold text-emerald-700">
                إجمالي المحصل: {collections.totalCollected.toLocaleString('ar-EG')} ج.م
              </span>
            </div>

            {collections.collectionsList.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500">
                لا توجد عمليات تحصيل منفصلة مسجلة.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-xs bg-slate-50/40">
                      <th className="py-3 pr-4">العميل</th>
                      <th className="py-3">المبلغ المحصل</th>
                      <th className="py-3">التاريخ والوقت</th>
                      <th className="py-3 pl-4">ملاحظات التحصيل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {collections.collectionsList.map((col) => (
                      <tr key={col.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 pr-4 font-bold text-slate-900">
                          {col.clientName}
                        </td>
                        <td className="py-3 font-mono font-black text-emerald-700 text-sm">
                          {col.amount.toLocaleString('ar-EG')} ج.م
                        </td>
                        <td className="py-3 text-xs font-mono text-slate-500">
                          {new Date(col.createdAt).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="py-3 pl-4 text-xs text-slate-500">
                          {col.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: SETTLEMENTS & ADVANCES */}
      {activeTab === 'settlements' && (
        <div className="space-y-6">
          {/* Daily End-of-Day Settlements */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                سجل التسويات اليومية ومطابقة النقدية والمخزون
              </h3>
              <span className="text-xs text-slate-500">
                دقة التسويات: {settlements.balancedSettlements} من أصل {settlements.totalSettlements}
              </span>
            </div>

            {settlements.settlementsList.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500">
                لا توجد تسويات يومية مسجلة لهذا المندوب حتى الآن.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-xs bg-slate-50/40">
                      <th className="py-3 pr-4">تاريخ التسوية</th>
                      <th className="py-3">النقدية المتوقعة</th>
                      <th className="py-3">النقدية الفعلية المسلمة</th>
                      <th className="py-3">فرق النقدية (عجز / زيادة)</th>
                      <th className="py-3">الحالة</th>
                      <th className="py-3 pl-4">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {settlements.settlementsList.map((set) => (
                      <tr key={set.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 pr-4 font-mono font-bold text-slate-900">
                          {set.date}
                        </td>
                        <td className="py-3 font-mono text-xs text-slate-600">
                          {set.expectedCash.toLocaleString('ar-EG')} ج.م
                        </td>
                        <td className="py-3 font-mono text-xs font-bold text-slate-800">
                          {set.actualCash.toLocaleString('ar-EG')} ج.م
                        </td>
                        <td className="py-3 font-mono font-bold text-xs">
                          {set.cashDifference === 0 ? (
                            <span className="text-emerald-700">0 ج.م (مطابق تماماً)</span>
                          ) : set.cashDifference < 0 ? (
                            <span className="text-rose-700 font-black">
                              عجز {Math.abs(set.cashDifference).toLocaleString('ar-EG')} ج.م
                            </span>
                          ) : (
                            <span className="text-blue-700">
                              فائض +{set.cashDifference.toLocaleString('ar-EG')} ج.م
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              set.status === 'balanced'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {set.status === 'balanced' ? 'تسوية مطابقة' : 'يوجد فروقات'}
                          </span>
                        </td>
                        <td className="py-3 pl-4 text-xs text-slate-500">
                          {set.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Advances Requests */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">سجل السلف المالية وطلبات المندوب</h3>
              <span className="text-xs font-bold text-slate-700">
                إجمالي السلف المعتمدة: {advances.totalAdvancesApproved.toLocaleString('ar-EG')} ج.م
              </span>
            </div>

            {advances.advancesList.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500">
                لا توجد طلبات سلف سابقة لهذا المندوب.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-xs bg-slate-50/40">
                      <th className="py-3 pr-4">المبلغ المطلوب</th>
                      <th className="py-3">السبب المذكور</th>
                      <th className="py-3">الحالة</th>
                      <th className="py-3">ملاحظات الإدارة</th>
                      <th className="py-3 pl-4">تاريخ الطلب</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {advances.advancesList.map((adv) => (
                      <tr key={adv.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 pr-4 font-mono font-black text-slate-900 text-sm">
                          {adv.amount.toLocaleString('ar-EG')} ج.م
                        </td>
                        <td className="py-3 text-xs text-slate-700 font-medium">
                          {adv.reason}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              adv.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : adv.status === 'rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {adv.status === 'approved' ? 'معتمدة' : adv.status === 'rejected' ? 'مرفوضة' : 'قيد المراجعة'}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-slate-500">
                          {adv.managerNotes || '-'}
                        </td>
                        <td className="py-3 pl-4 text-xs font-mono text-slate-500">
                          {new Date(adv.createdAt).toLocaleDateString('ar-EG')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">تغيير كلمة المرور للمندوب</h3>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">المندوب:</label>
                <input
                  type="text"
                  readOnly
                  value={`${rep.name} (@${rep.username})`}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">كلمة المرور الجديدة *</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور الجديدة"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW INVOICE MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  تفاصيل الفاتورة ({selectedInvoice.invoiceNumber})
                </h3>
                <p className="text-xs text-slate-500">
                  العميل: <strong className="text-slate-800">{selectedInvoice.clientName}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 pr-3">الصنف</th>
                    <th className="py-2.5">الكمية</th>
                    <th className="py-2.5">سعر الكرتونة</th>
                    <th className="py-2.5 pl-3">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoice.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 pr-3 font-bold text-slate-800">
                        صنف رقم #{it.productId.slice(-4)}
                      </td>
                      <td className="py-2.5 font-mono font-bold text-slate-900">
                        {it.quantity} كرتونة
                      </td>
                      <td className="py-2.5 font-mono text-slate-600">
                        {it.unitPrice} ج.م
                      </td>
                      <td className="py-2.5 pl-3 font-mono font-bold text-slate-900">
                        {it.totalPrice} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>المجموع قبل الخصم:</span>
                <span className="font-mono font-bold">{(selectedInvoice.subtotal || selectedInvoice.totalAmount).toLocaleString('ar-EG')} ج.م</span>
              </div>
              {selectedInvoice.discount && selectedInvoice.discount > 0 ? (
                <div className="flex justify-between text-amber-700 font-bold">
                  <span>الخصم الممنوح:</span>
                  <span className="font-mono">-{selectedInvoice.discount} ج.م</span>
                </div>
              ) : null}
              {selectedInvoice.returnsTotal && selectedInvoice.returnsTotal > 0 ? (
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>المرتجع المخصوم:</span>
                  <span className="font-mono">-{selectedInvoice.returnsTotal} ج.م</span>
                </div>
              ) : null}
              <div className="flex justify-between font-black text-slate-900 text-sm border-t border-slate-200 pt-1">
                <span>الصافي المطلوب:</span>
                <span className="text-emerald-700">{selectedInvoice.totalAmount.toLocaleString('ar-EG')} ج.م</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>المدفوع ({selectedInvoice.paymentType === 'cash' ? 'كاش' : 'آجل'}):</span>
                <span className="font-mono font-bold text-emerald-600">{selectedInvoice.paidAmount.toLocaleString('ar-EG')} ج.م</span>
              </div>
              {selectedInvoice.totalAmount - selectedInvoice.paidAmount > 0 && (
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>المتبقي آجل على العميل:</span>
                  <span className="font-mono">{(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toLocaleString('ar-EG')} ج.م</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Invoice, InvoiceItem, Product, Client, User } from '@/types';
import {
  FileText,
  Search,
  Filter,
  Percent,
  TrendingUp,
  Wallet,
  Clock,
  Building,
  User as UserIcon,
  ChevronDown,
  X,
  Printer,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ExtendedInvoice extends Invoice {
  client: Client;
  rep: User;
  itemsWithProducts: (InvoiceItem & { product: Product })[];
}

interface Props {
  invoices: ExtendedInvoice[];
  reps: User[];
  clients: Client[];
}

export default function InvoicesClientView({ invoices, reps, clients }: Props) {
  const [selectedRepId, setSelectedRepId] = useState<string>('all');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [activeModalInvoice, setActiveModalInvoice] = useState<ExtendedInvoice | null>(null);

  // Filtering
  const filteredInvoices = invoices.filter((inv) => {
    if (selectedRepId !== 'all' && inv.repId !== selectedRepId) return false;
    if (selectedClientId !== 'all' && inv.clientId !== selectedClientId) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = inv.invoiceNumber.toLowerCase().includes(q);
      const matchClient = inv.client.name.toLowerCase().includes(q);
      const matchRep = inv.rep.name.toLowerCase().includes(q);
      return matchNum || matchClient || matchRep;
    }
    return true;
  });

  // Totals for filtered selection
  const totalSales = filteredInvoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalDiscounts = filteredInvoices.reduce((s, i) => s + (i.discount || 0), 0);
  const totalPaid = filteredInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalSubtotal = filteredInvoices.reduce((s, i) => s + (i.subtotal || i.totalAmount), 0);

  return (
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">إجمالي عدد الفواتير</div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {filteredInvoices.length} <span className="text-xs font-bold text-slate-500">فاتورة</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">صافي المبيعات المطلوبة</div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {totalSales.toLocaleString('ar-EG')} <span className="text-xs font-bold text-slate-500">ج.م</span>
            </div>
          </div>
        </div>

        {/* Total Discounts Badge */}
        <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center flex-shrink-0">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-800">إجمالي الخصومات الممنوحة</div>
            <div className="text-2xl font-black text-amber-900 mt-1">
              {totalDiscounts.toLocaleString('ar-EG')} <span className="text-xs font-bold text-amber-700">ج.م</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">النقدية المحصلة فعلياً</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {totalPaid.toLocaleString('ar-EG')} <span className="text-xs font-bold text-slate-500">ج.م</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث برقم الفاتورة أو العميل..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
        </div>

        {/* Filter by Rep */}
        <div>
          <select
            value={selectedRepId}
            onChange={(e) => setSelectedRepId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
          >
            <option value="all">جميع المناديب ({reps.length})</option>
            {reps.map((r) => (
              <option key={r.id} value={r.id}>
                المندوب: {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Client */}
        <div>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
          >
            <option value="all">جميع المنافذ والعملاء ({clients.length})</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                المنفذ: {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">
            سجل الفواتير الصادرة للمناديب والخصومات المسجلة
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            عرض {filteredInvoices.length} فاتورة
          </span>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">
            لا توجد فواتير مبيعات مطابقة لمعايير البحث حالياً.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-xs bg-slate-50/40">
                  <th className="py-3 pr-4">رقم الفاتورة</th>
                  <th className="py-3">المندوب</th>
                  <th className="py-3">المنفذ / العميل</th>
                  <th className="py-3">المجموع قبل الخصم</th>
                  <th className="py-3">قيمة الخصم</th>
                  <th className="py-3">الصافي المطلوب</th>
                  <th className="py-3">المدفوع / المتبقي</th>
                  <th className="py-3">طريقة الدفع</th>
                  <th className="py-3">التاريخ والوقت</th>
                  <th className="py-3 pl-4">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 pr-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 font-semibold text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{inv.rep.name}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="font-bold text-slate-900">{inv.client.name}</div>
                      {inv.client.address && (
                        <div className="text-[11px] text-slate-400">{inv.client.address}</div>
                      )}
                    </td>
                    <td className="py-3 font-mono text-slate-600 text-xs">
                      {(inv.subtotal || inv.totalAmount).toLocaleString('ar-EG')} ج.م
                    </td>
                    <td className="py-3">
                      {inv.discount && inv.discount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                          <Percent className="w-3 h-3" />
                          <span>خصم {inv.discount.toLocaleString('ar-EG')} ج.م</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs font-mono">-</span>
                      )}
                    </td>
                    <td className="py-3 font-mono font-black text-slate-900 text-sm">
                      {inv.totalAmount.toLocaleString('ar-EG')} ج.م
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
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          inv.paymentType === 'cash'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {inv.paymentType === 'cash' ? 'نقدي' : 'آجل'}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-slate-500 font-mono">
                      {new Date(inv.createdAt).toLocaleString('ar-EG', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 pl-4">
                      <button
                        type="button"
                        onClick={() => setActiveModalInvoice(inv)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                      >
                        <span>عرض الأصناف</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Full Invoice Details & Items */}
      {activeModalInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  تفاصيل الفاتورة {activeModalInvoice.invoiceNumber}
                </h3>
                <div className="text-xs text-slate-500">
                  المندوب: {activeModalInvoice.rep.name} • العميل: {activeModalInvoice.client.name}
                </div>
              </div>
              <button
                onClick={() => setActiveModalInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 pr-3">اسم المنتج</th>
                    <th className="py-2.5">الكمية</th>
                    <th className="py-2.5">سعر الوحدة</th>
                    <th className="py-2.5 pl-3">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeModalInvoice.itemsWithProducts.map((it) => (
                    <tr key={it.id}>
                      <td className="py-2.5 pr-3 font-bold text-slate-800">
                        {it.product.name}
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

            {/* Calculations & Discount Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>المجموع قبل الخصم:</span>
                <span className="font-mono font-bold">
                  {(activeModalInvoice.subtotal || activeModalInvoice.totalAmount).toLocaleString('ar-EG')} ج.م
                </span>
              </div>

              {activeModalInvoice.discount > 0 && (
                <div className="flex justify-between text-amber-800 font-bold bg-amber-100/60 p-2 rounded-xl border border-amber-200">
                  <span className="flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5" />
                    <span>الخصم الممنوح من المندوب:</span>
                  </span>
                  <span className="font-mono font-black text-sm">
                    - {activeModalInvoice.discount.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
              )}

              <div className="flex justify-between text-slate-900 font-black text-base pt-1 border-t border-slate-200">
                <span>الصافي المطلوب:</span>
                <span className="text-emerald-700">
                  {activeModalInvoice.totalAmount.toLocaleString('ar-EG')} ج.م
                </span>
              </div>

              <div className="flex justify-between text-slate-700 pt-1">
                <span>المبلغ المدفوع ({activeModalInvoice.paymentType === 'cash' ? 'كاش' : 'آجل'}):</span>
                <span className="font-mono font-bold text-emerald-600">
                  {activeModalInvoice.paidAmount.toLocaleString('ar-EG')} ج.م
                </span>
              </div>

              {activeModalInvoice.totalAmount - activeModalInvoice.paidAmount > 0 && (
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>المتبقي آجل على العميل:</span>
                  <span className="font-mono">
                    {(activeModalInvoice.totalAmount - activeModalInvoice.paidAmount).toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
              )}

              {activeModalInvoice.notes && (
                <div className="pt-2 border-t border-slate-200 text-slate-500">
                  ملاحظات: {activeModalInvoice.notes}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModalInvoice(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition"
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

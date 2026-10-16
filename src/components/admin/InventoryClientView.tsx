'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product, InventoryBatch } from '@/types';
import { createBatchAction, createProductAction } from '@/lib/actions';
import {
  Boxes,
  Plus,
  Calendar,
  AlertCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  X,
  PackagePlus,
  Layers,
} from 'lucide-react';

interface Props {
  products: Product[];
  batches: (InventoryBatch & { product: Product; hoursRemaining: number })[];
}

export default function InventoryClientView({ products, batches }: Props) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'dairy' | 'juice'>('all');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Batch Form State
  const [batchProductId, setBatchProductId] = useState(products[0]?.id || '');
  const [batchNumber, setBatchNumber] = useState('');
  const [batchQuantity, setBatchQuantity] = useState(50);
  const [productionDate, setProductionDate] = useState(new Date().toISOString().slice(0, 16));

  const selectedProduct = products.find((p) => p.id === batchProductId) || products[0];

  // Calculate projected expiry based on selected product and production date
  const getProjectedExpiry = () => {
    if (!selectedProduct) return '';
    const d = new Date(productionDate);
    const exp = new Date(d.getTime() + selectedProduct.shelfLifeDays * 24 * 60 * 60 * 1000);
    return exp.toLocaleString('ar-EG', {
      weekday: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredBatches = batches.filter((b) => {
    if (selectedCategory === 'all') return true;
    return b.product.category === selectedCategory;
  });

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const formData = new FormData();
    formData.append('productId', batchProductId);
    formData.append('batchNumber', batchNumber || `BAT-${Date.now().toString().slice(-6)}`);
    formData.append('quantity', batchQuantity.toString());
    formData.append('productionDate', new Date(productionDate).toISOString());

    const res = await createBatchAction(formData);
    setLoading(false);

    if (res.success) {
      setMsg({ type: 'success', text: res.message || 'تم تسجيل التشغيلة بنجاح' });
      setShowBatchModal(false);
      setBatchNumber('');
      router.refresh();
    } else {
      setMsg({ type: 'error', text: res.error || 'حدث خطأ' });
    }
  };

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const formData = new FormData(e.currentTarget);
    const res = await createProductAction(formData);
    setLoading(false);

    if (res.success) {
      setMsg({ type: 'success', text: res.message || 'تم إضافة المنتج بنجاح' });
      setShowProductModal(false);
      router.refresh();
    } else {
      setMsg({ type: 'error', text: res.error || 'حدث خطأ' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            جميع التشغيلات ({batches.length})
          </button>
          <button
            onClick={() => setSelectedCategory('dairy')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              selectedCategory === 'dairy'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            ألبان طازجة (صلاحية 1 يوم)
          </button>
          <button
            onClick={() => setSelectedCategory('juice')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              selectedCategory === 'juice'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            عصائر طبيعية (صلاحية 7-10 أيام)
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowProductModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 bg-white shadow-xs"
          >
            <PackagePlus className="w-4 h-4 text-slate-500" />
            <span>تعريف صنف جديد</span>
          </button>

          <button
            onClick={() => setShowBatchModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل تشغيلة واردة (FIFO Batch)</span>
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Batches Table with FIFO Sorting */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800">
              سجل تشغيلات المستودع الرئيسي (مرتبة حسب الأقدم انتهاءً أولاً - FIFO)
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            الصرف الآلي يعتمد على أقرب تاريخ انتهاء
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs bg-slate-50/40">
                <th className="py-3 pr-4">رقم التشغيلة</th>
                <th className="py-3">اسم المنتج</th>
                <th className="py-3">النوع وفترة الصلاحية</th>
                <th className="py-3">تاريخ الإنتاج</th>
                <th className="py-3">تاريخ الانتهاء</th>
                <th className="py-3">المتبقي / الأولي</th>
                <th className="py-3">حالة الصلاحية</th>
                <th className="py-3 pl-4">الوقت المتبقي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBatches.map((batch) => {
                const isDairy = batch.product.category === 'dairy';
                const isUrgent = batch.hoursRemaining <= (isDairy ? 16 : 48);
                const isExpired = batch.hoursRemaining <= 0;

                return (
                  <tr key={batch.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 pr-4 font-mono font-bold text-slate-800">
                      {batch.batchNumber}
                    </td>
                    <td className="py-3 font-semibold text-slate-900">
                      {batch.product.name}
                    </td>
                    <td className="py-3 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold ${
                          isDairy
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isDairy ? 'ألبان (1 يوم)' : `عصائر (${batch.product.shelfLifeDays} أيام)`}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-slate-600 font-mono">
                      {new Date(batch.productionDate).toLocaleDateString('ar-EG', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 text-xs font-mono font-bold text-slate-800">
                      {new Date(batch.expiryDate).toLocaleDateString('ar-EG', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 text-xs">
                      <strong className="text-slate-900 font-mono text-sm">{batch.quantity}</strong>
                      <span className="text-slate-400"> / {batch.initialQuantity} {batch.product.unit}</span>
                    </td>
                    <td className="py-3">
                      {batch.quantity === 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                          نفدت الكمية
                        </span>
                      ) : isExpired ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          منتهية الصلاحية
                        </span>
                      ) : isUrgent ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          تقترب من الانتهاء
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          صالحة وطازجة
                        </span>
                      )}
                    </td>
                    <td className="py-3 pl-4">
                      {batch.quantity === 0 ? (
                        <span className="text-xs text-slate-400">-</span>
                      ) : (
                        <div
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isExpired
                              ? 'bg-rose-50 text-rose-700'
                              : isUrgent
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {isExpired ? 'منتهية' : `${batch.hoursRemaining} ساعة`}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Batch (تسجيل تشغيلة واردة مع احتساب آلي للصلاحية) */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  تسجيل تشغيلة واردة جديدة (FIFO Batch)
                </h3>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اختر المنتج
                </label>
                <select
                  value={batchProductId}
                  onChange={(e) => setBatchProductId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category === 'dairy' ? 'ألبان - يوم واحد' : `عصائر - ${p.shelfLifeDays} أيام`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رقم التشغيلة (Batch Code)
                  </label>
                  <input
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="مثلاً: DAIRY-05"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الكمية الواردة (بالكرتونة)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={batchQuantity}
                    onChange={(e) => setBatchQuantity(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تاريخ وتوقيت الإنتاج
                </label>
                <input
                  type="datetime-local"
                  required
                  value={productionDate}
                  onChange={(e) => setProductionDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
                />
              </div>

              {/* Automatic Expiry Calculation Box */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>الاحتساب التلقائي للصلاحية بنظام FIFO:</span>
                </div>
                <div>
                  مدة الصلاحية المبرمجة للمنتج:{' '}
                  <strong>
                    {selectedProduct?.category === 'dairy'
                      ? '24 ساعة (ألبان طازجة)'
                      : `${selectedProduct?.shelfLifeDays} أيام (عصائر)`}
                  </strong>
                </div>
                <div className="pt-1 border-t border-emerald-200 font-bold text-emerald-950">
                  تاريخ الانتهاء المحسوب: {getProjectedExpiry()}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                >
                  {loading ? 'جاري الحفظ...' : 'تأكيد وحفظ التشغيلة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Product (تعريف منتج جديد) */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <PackagePlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">تعريف منتج جديد في النظام</h3>
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المنتج</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="مثلاً: حليب خالي الدسم 1 لتر"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تصنيف المنتج</label>
                  <select
                    name="category"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    <option value="dairy">ألبان طازجة (Dairy)</option>
                    <option value="juice">عصائر طبيعية (Juice)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    أيام الصلاحية الافتراضية
                  </label>
                  <input
                    type="number"
                    name="shelfLifeDays"
                    defaultValue="1"
                    min="1"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    سعر البيع للعميل (ج.م)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    name="price"
                    required
                    placeholder="35"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    سعر التكلفة (ج.م)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    name="cost"
                    required
                    placeholder="28"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الوحدة</label>
                  <input
                    type="text"
                    name="unit"
                    defaultValue="كرتونة"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ المنتج الجديد'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

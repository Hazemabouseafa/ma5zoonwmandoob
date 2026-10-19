'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Product, InventoryBatch, Category } from '@/types';
import {
  createBatchAction,
  createProductAction,
  createCategoryAction,
  deleteCategoryAction,
  createProductAndBatchAction,
} from '@/lib/actions';
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
  Tags,
  Trash2,
  Building2,
} from 'lucide-react';

interface Props {
  products: Product[];
  batches: (InventoryBatch & { product: Product; hoursRemaining: number })[];
  categories: Category[];
}

export default function InventoryClientView({
  products: initialProducts,
  batches: initialBatches,
  categories: initialCategories,
}: Props) {
  const router = useRouter();
  const [productsList, setProductsList] = useState<Product[]>(initialProducts || []);
  const [batchesList, setBatchesList] = useState(initialBatches || []);
  const [categories, setCategories] = useState<Category[]>(initialCategories || []);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Synchronize state when server props update
  useEffect(() => {
    setProductsList(initialProducts || []);
  }, [initialProducts]);

  useEffect(() => {
    setBatchesList(initialBatches || []);
  }, [initialBatches]);

  useEffect(() => {
    setCategories(initialCategories || []);
  }, [initialCategories]);

  // Category Modal Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatShelfLife, setNewCatShelfLife] = useState(1);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);
  const [catSuccess, setCatSuccess] = useState<string | null>(null);

  // Product Modal State
  const [productCategory, setProductCategory] = useState<string>(
    initialCategories[0]?.name || ''
  );
  const [productShelfLife, setProductShelfLife] = useState<number>(
    initialCategories[0]?.defaultShelfLifeDays || 1
  );

  // Synchronize productCategory when categories change
  useEffect(() => {
    if (categories.length > 0 && (!productCategory || !categories.some((c) => c.name === productCategory))) {
      setProductCategory(categories[0].name);
      setProductShelfLife(categories[0].defaultShelfLifeDays || 1);
    }
  }, [categories, productCategory]);

  // Batch Form State & On-the-spot Product Creation
  const [batchMode, setBatchMode] = useState<'existing' | 'new'>(
    initialProducts.length === 0 ? 'new' : 'existing'
  );
  const [batchProductId, setBatchProductId] = useState(initialProducts[0]?.id || '');
  const [batchNumber, setBatchNumber] = useState('');
  const [batchQuantity, setBatchQuantity] = useState(50);
  const [productionDate, setProductionDate] = useState(new Date().toISOString().slice(0, 16));

  // Inline product fields when adding an incoming batch for a brand new product
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState(
    initialCategories[0]?.name || ''
  );
  const [newProductShelfLife, setNewProductShelfLife] = useState(
    initialCategories[0]?.defaultShelfLifeDays || 1
  );
  const [newProductPrice, setNewProductPrice] = useState(35);
  const [newProductCost, setNewProductCost] = useState(28);
  const [newProductUnit, setNewProductUnit] = useState('كرتونة');

  // Auto-switch to 'new' mode if no products exist
  useEffect(() => {
    if (productsList.length === 0) {
      setBatchMode('new');
    }
  }, [productsList]);

  // Synchronize category selection for new product in batch modal
  useEffect(() => {
    if (categories.length > 0) {
      if (!newProductCategory || !categories.some((c) => c.name === newProductCategory)) {
        setNewProductCategory(categories[0].name);
        setNewProductShelfLife(categories[0].defaultShelfLifeDays || 1);
      }
    }
  }, [categories, newProductCategory]);

  // Automatically keep batchProductId in sync with available products
  useEffect(() => {
    if (productsList.length > 0) {
      if (!batchProductId || !productsList.some((p) => p.id === batchProductId)) {
        setBatchProductId(productsList[0].id);
      }
    }
  }, [productsList, batchProductId]);

  const selectedProduct =
    productsList.find((p) => p.id === batchProductId) || productsList[0];

  // Calculate projected expiry based on mode and production date
  const getProjectedExpiry = () => {
    const d = new Date(productionDate);
    if (isNaN(d.getTime())) return '';
    const days =
      batchMode === 'new'
        ? newProductShelfLife || 1
        : selectedProduct?.shelfLifeDays || 1;
    const exp = new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
    return exp.toLocaleString('ar-EG', {
      weekday: 'short',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredBatches = batchesList.filter((b) => {
    if (selectedCategory === 'all') return true;
    return b.product.category === selectedCategory;
  });

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      if (batchMode === 'new') {
        if (!newProductName.trim()) {
          setMsg({ type: 'error', text: 'يرجى إدخال اسم الصنف أو المنتج الوارد' });
          setLoading(false);
          return;
        }

        const chosenCat = newProductCategory.trim() || (categories[0]?.name || 'عام');
        const formData = new FormData();
        formData.append('name', newProductName.trim());
        formData.append('category', chosenCat);
        formData.append('shelfLifeDays', (newProductShelfLife || 1).toString());
        formData.append('price', (newProductPrice || 0).toString());
        formData.append('cost', (newProductCost || 0).toString());
        formData.append('unit', newProductUnit.trim() || 'كرتونة');
        formData.append('batchNumber', batchNumber.trim() || `BAT-${Date.now().toString().slice(-6)}`);
        formData.append('quantity', (batchQuantity || 1).toString());
        formData.append('productionDate', new Date(productionDate).toISOString());

        const res = await createProductAndBatchAction(formData);
        setLoading(false);

        if (res.success && res.product && res.batch) {
          const newProd = res.product;
          const newBat = {
            ...res.batch,
            product: newProd,
            hoursRemaining: (newProd.shelfLifeDays || 1) * 24,
          };
          setProductsList((prev) => [...prev, newProd]);
          setBatchesList((prev) => [newBat, ...prev]);
          setBatchProductId(newProd.id);
          setNewProductName('');
          setBatchNumber('');
          setShowBatchModal(false);
          setMsg({ type: 'success', text: res.message || 'تم تسجيل الصنف والتشغيلة بنجاح' });
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('app:sync'));
          }
          router.refresh();
        } else {
          setMsg({ type: 'error', text: res.error || 'فشل تسجيل الصنف والتشغيلة' });
        }
      } else {
        const targetProdId = batchProductId || productsList[0]?.id || '';
        if (!targetProdId) {
          setMsg({ type: 'error', text: 'يرجى اختيار صنف أو تسجيل صنف جديد' });
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('productId', targetProdId);
        formData.append('batchNumber', batchNumber.trim() || `BAT-${Date.now().toString().slice(-6)}`);
        formData.append('quantity', batchQuantity.toString());
        formData.append('productionDate', new Date(productionDate).toISOString());

        const res = await createBatchAction(formData);
        setLoading(false);

        if (res.success && res.batch) {
          const prod = productsList.find((p) => p.id === targetProdId) || selectedProduct;
          if (prod) {
            const newBat = {
              ...res.batch,
              product: prod,
              hoursRemaining: (prod.shelfLifeDays || 1) * 24,
            };
            setBatchesList((prev) => [newBat, ...prev]);
          }
          setMsg({ type: 'success', text: res.message || 'تم تسجيل التشغيلة بنجاح' });
          setShowBatchModal(false);
          setBatchNumber('');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('app:sync'));
          }
          router.refresh();
        } else {
          setMsg({ type: 'error', text: res.error || 'حدث خطأ أثناء تسجيل التشغيلة' });
        }
      }
    } catch (err: any) {
      setLoading(false);
      setMsg({ type: 'error', text: err.message || 'حدث خطأ غير متوقع' });
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
      if (res.product) {
        setProductsList((prev) => [...prev, res.product!]);
        setBatchProductId(res.product.id);
      }
      setMsg({ type: 'success', text: res.message || 'تم إضافة المنتج بنجاح' });
      setShowProductModal(false);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('app:sync'));
      router.refresh();
    } else {
      setMsg({ type: 'error', text: res.error || 'حدث خطأ أثناء إضافة الصنف' });
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setCatLoading(true);
    setCatError(null);
    setCatSuccess(null);

    const formData = new FormData();
    formData.append('name', newCatName.trim());
    formData.append('defaultShelfLifeDays', newCatShelfLife.toString());

    const res = await createCategoryAction(formData);
    setCatLoading(false);

    if (res.success && res.category) {
      setCategories((prev) => [...prev.filter((c) => c.id !== res.category!.id), res.category!]);
      setProductCategory(res.category.name);
      setProductShelfLife(res.category.defaultShelfLifeDays);
      setCatSuccess(res.message || `تم إضافة التصنيف "${newCatName}" بنجاح`);
      setNewCatName('');
      setNewCatShelfLife(1);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('app:sync'));
      router.refresh();
    } else {
      setCatError(res.error || 'فشل إضافة التصنيف');
    }
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    if (!confirm(`هل أنت متأكد من حذف تصنيف "${catName}"؟`)) return;

    setCatLoading(true);
    setCatError(null);
    setCatSuccess(null);

    const res = await deleteCategoryAction(catId);
    setCatLoading(false);

    if (res.success) {
      setCategories((prev) => prev.filter((c) => c.id !== catId));
      setCatSuccess('تم حذف التصنيف بنجاح');
      if (selectedCategory === catName) setSelectedCategory('all');
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('app:sync'));
      router.refresh();
    } else {
      setCatError(res.error || 'فشل حذف التصنيف');
    }
  };

  const handleCategoryChange = (catName: string) => {
    setProductCategory(catName);
    const found = categories.find((c) => c.name === catName);
    if (found) {
      setProductShelfLife(found.defaultShelfLifeDays);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Dynamic Category Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            جميع التشغيلات ({batchesList.length})
          </button>

          {categories.map((cat) => {
            const isSelected =
              selectedCategory === cat.name ||
              (cat.name === 'ألبان' && selectedCategory === 'dairy') ||
              (cat.name === 'عصائر' && selectedCategory === 'juice');

            const count = batchesList.filter(
              (b) =>
                b.product.category === cat.name ||
                (cat.name === 'ألبان' && b.product.category === 'dairy') ||
                (cat.name === 'عصائر' && b.product.category === 'juice')
            ).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Manage Categories Button */}
          <button
            onClick={() => {
              setCatError(null);
              setCatSuccess(null);
              setShowCategoriesModal(true);
            }}
            className="px-3.5 py-2 rounded-xl border border-indigo-200 hover:bg-indigo-50 text-indigo-700 text-xs font-bold transition flex items-center gap-1.5 bg-indigo-50/60 shadow-xs"
          >
            <Tags className="w-4 h-4 text-indigo-600" />
            <span>إدارة التصنيفات ({categories.length})</span>
          </button>

          <button
            onClick={() => setShowProductModal(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 bg-white shadow-xs"
          >
            <PackagePlus className="w-4 h-4 text-slate-500" />
            <span>تعريف صنف جديد</span>
          </button>

          <Link
            href="/admin/suppliers"
            className="px-3.5 py-2 rounded-xl border border-blue-200 hover:bg-blue-100/70 text-blue-800 text-xs font-bold transition flex items-center gap-1.5 bg-blue-50/70 shadow-xs"
          >
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>توريد من مورد للمخزن</span>
          </Link>

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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    تسجيل تشغيلة واردة جديدة (FIFO Batch)
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    إدخال البضاعة الواردة وحساب الصلاحية تلقائياً
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Selector Tabs (if products exist) */}
            {productsList.length > 0 ? (
              <div className="flex items-center p-1 bg-slate-100 rounded-xl mb-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setBatchMode('existing')}
                  className={`flex-1 py-2 rounded-lg transition ${
                    batchMode === 'existing'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  اختيار صنف مسجل ({productsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBatchMode('new')}
                  className={`flex-1 py-2 rounded-lg transition ${
                    batchMode === 'new'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  + صنف وارد جديد لأول مرة
                </button>
              </div>
            ) : (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  أدخل بيانات الصنف الوارد وتفاصيل التشغيلة أدناه وسيتم حفظهما في المخزون مباشرة معاً!
                </span>
              </div>
            )}

            <form onSubmit={handleAddBatch} className="space-y-4">
              {batchMode === 'existing' && productsList.length > 0 ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اختر الصنف / المنتج المسجل
                  </label>
                  <select
                    name="productId"
                    value={batchProductId || productsList[0]?.id || ''}
                    onChange={(e) => setBatchProductId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-medium"
                  >
                    {productsList.map((p) => {
                      const shelfLabel =
                        p.shelfLifeDays === 1 ? 'صلاحية يوم واحد' : `صلاحية ${p.shelfLifeDays} أيام`;
                      const catLabel =
                        p.category === 'dairy' ? 'ألبان' : p.category === 'juice' ? 'عصائر' : p.category || 'عام';
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} ({catLabel} - {shelfLabel})
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : (
                /* On-the-spot Product Fields */
                <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>بيانات الصنف الجديد</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      تسجيل فوري
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      اسم الصنف أو المنتج *
                    </label>
                    <input
                      type="text"
                      required
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      placeholder="مثلاً: حليب طازج 1 لتر أو عصير برتقال..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">التصنيف *</label>
                        <button
                          type="button"
                          onClick={() => setShowCategoriesModal(true)}
                          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          + إدارة التصنيفات
                        </button>
                      </div>
                      {categories.length > 0 ? (
                        <select
                          value={newProductCategory}
                          onChange={(e) => {
                            setNewProductCategory(e.target.value);
                            const found = categories.find((c) => c.name === e.target.value);
                            if (found) {
                              setNewProductShelfLife(found.defaultShelfLifeDays);
                            }
                          }}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-medium"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.name}>
                              {c.name} ({c.defaultShelfLifeDays} يوم)
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          required
                          value={newProductCategory}
                          onChange={(e) => setNewProductCategory(e.target.value)}
                          placeholder="اكتب اسم التصنيف..."
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        أيام الصلاحية الافتراضية
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={newProductShelfLife}
                        onChange={(e) =>
                          setNewProductShelfLife(parseInt(e.target.value, 10) || 1)
                        }
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        سعر البيع (ج.م) *
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        required
                        value={newProductPrice}
                        onChange={(e) => setNewProductPrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        التكلفة (ج.م) *
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        required
                        value={newProductCost}
                        onChange={(e) => setNewProductCost(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">الوحدة</label>
                      <input
                        type="text"
                        value={newProductUnit}
                        onChange={(e) => setNewProductUnit(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Batch Specific Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رقم التشغيلة (Batch Code)
                  </label>
                  <input
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="مثلاً: BAT-001 (اختياري)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الكمية الواردة (بالكرتونة) *
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
                  تاريخ وتوقيت الإنتاج *
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
                    {batchMode === 'new'
                      ? newProductShelfLife === 1
                        ? '24 ساعة (يوم واحد)'
                        : `${newProductShelfLife} أيام`
                      : selectedProduct?.shelfLifeDays === 1
                      ? '24 ساعة (يوم واحد)'
                      : `${selectedProduct?.shelfLifeDays || 1} أيام`}
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
                  {loading
                    ? 'جاري الحفظ...'
                    : batchMode === 'new'
                    ? 'تأكيد وحفظ الصنف والتشغيلة فوراً'
                    : 'تأكيد وحفظ التشغيلة'}
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">تصنيف المنتج</label>
                    <button
                      type="button"
                      onClick={() => setShowCategoriesModal(true)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      + تصنيف جديد
                    </button>
                  </div>
                  <select
                    name="category"
                    value={productCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-medium"
                  >
                    {categories.length === 0 ? (
                      <option value="">-- اضغط على "+ تصنيف جديد" أولاً --</option>
                    ) : (
                      categories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} (صلاحية: {c.defaultShelfLifeDays} يوم)
                        </option>
                      ))
                    )}
                  </select>
                  {categories.length === 0 && (
                    <p className="text-[11px] text-amber-700 mt-1 font-medium">
                      ⚠️ يرجى إضافة تصنيف أولاً عبر الزر أعلاه
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    أيام الصلاحية الافتراضية
                  </label>
                  <input
                    type="number"
                    name="shelfLifeDays"
                    value={productShelfLife}
                    onChange={(e) => setProductShelfLife(parseInt(e.target.value, 10) || 1)}
                    min="1"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-bold"
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

      {/* Modal: Manage Categories (إضافة وإلغاء تصنيفات المنتجات) */}
      {showCategoriesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Tags className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">إدارة تصنيفات المنتجات</h3>
                  <div className="text-[11px] text-slate-500">إضافة أو إلغاء وحذف أسماء التصنيفات</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoriesModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {catError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{catError}</span>
              </div>
            )}

            {catSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{catSuccess}</span>
              </div>
            )}

            {/* Existing Categories List */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700">التصنيفات المسجلة حالياً:</div>
              <div className="max-h-52 overflow-y-auto space-y-1.5 pr-0.5">
                {categories.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl">
                    لا توجد تصنيفات مسجلة
                  </div>
                ) : (
                  categories.map((c) => {
                    const count = productsList.filter(
                      (p) =>
                        p.category === c.name ||
                        (c.name === 'ألبان' && p.category === 'dairy') ||
                        (c.name === 'عصائر' && p.category === 'juice')
                    ).length;

                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 transition"
                      >
                        <div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>{c.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-normal">
                              صلاحية: {c.defaultShelfLifeDays} يوم
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {count} أصناف مرتبطة بهذا التصنيف
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(c.id, c.name)}
                          disabled={catLoading}
                          title="حذف التصنيف"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Form to Add New Category */}
            <form onSubmit={handleCreateCategory} className="pt-3 border-t border-slate-100 space-y-3">
              <div className="text-xs font-bold text-slate-800">إضافة تصنيف جديد:</div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    اسم التصنيف (مثل: أجبان، زبادي، مياه)
                  </label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    required
                    placeholder="اسم التصنيف..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    أيام الصلاحية
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newCatShelfLife}
                    onChange={(e) => setNewCatShelfLife(parseInt(e.target.value, 10) || 1)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-bold text-center"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCategoriesModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  إغلاق
                </button>
                <button
                  type="submit"
                  disabled={catLoading || !newCatName.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {catLoading ? (
                    'جاري الإضافة...'
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة التصنيف</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

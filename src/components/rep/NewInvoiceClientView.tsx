'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Client, Invoice } from '@/types';
import { createInvoiceAction, createClientAction } from '@/lib/actions';
import {
  UserCheck,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Share2,
  Printer,
  X,
  CreditCard,
  Banknote,
  Search,
  UserPlus,
  ArrowRight,
  Receipt,
  Tag,
} from 'lucide-react';

interface AvailableProduct {
  productId: string;
  name: string;
  category: 'dairy' | 'juice';
  price: number;
  unit: string;
  totalAvailable: number;
  earliestHoursRemaining: number;
}

interface Props {
  clients: Client[];
  availableProducts: AvailableProduct[];
  repName: string;
}

export default function NewInvoiceClientView({
  clients: initialClients,
  availableProducts,
  repName,
}: Props) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClients[0]?.id || '');
  const [clientSearch, setClientSearch] = useState('');

  // Cart: Map of productId -> quantity
  const [cart, setCart] = useState<Record<string, number>>({});
  const [discount, setDiscount] = useState<string>('0');
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('cash');
  const [partialPaid, setPartialPaid] = useState<string>('0');
  const [notes, setNotes] = useState('');

  // Modals & Status
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const updateCartQty = (productId: string, delta: number, maxQty: number) => {
    const current = cart[productId] || 0;
    const next = Math.max(0, Math.min(maxQty, current + delta));
    setCart((prev) => {
      const copy = { ...prev };
      if (next === 0) {
        delete copy[productId];
      } else {
        copy[productId] = next;
      }
      return copy;
    });
  };

  // Calculations
  const cartEntries = Object.entries(cart);
  const subtotal = cartEntries.reduce((sum, [pId, qty]) => {
    const prod = availableProducts.find((p) => p.productId === pId);
    return sum + (prod ? prod.price * qty : 0);
  }, 0);

  const numDiscount = Math.max(0, parseFloat(discount) || 0);
  const totalAmount = Math.max(0, subtotal - numDiscount);
  const totalItemsCount = cartEntries.reduce((sum, [, qty]) => sum + qty, 0);

  const handleCheckout = async () => {
    if (!selectedClientId) {
      setErrorMsg('يرجى اختيار العميل');
      return;
    }
    if (cartEntries.length === 0) {
      setErrorMsg('يرجى إضافة صنف واحد على الأقل إلى الفاتورة');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const items = cartEntries.map(([productId, quantity]) => ({
      productId,
      quantity,
    }));

    const paid = paymentType === 'cash' ? totalAmount : parseFloat(partialPaid) || 0;

    const res = await createInvoiceAction({
      clientId: selectedClientId,
      paymentType,
      paidAmount: paid,
      discount: numDiscount,
      notes: notes.trim() || undefined,
      items,
    });

    setLoading(false);

    if (res.success && res.invoice) {
      setCreatedInvoice(res.invoice);
    } else {
      setErrorMsg(res.error || 'حدث خطأ أثناء إصدار الفاتورة');
    }
  };

  const handleCreateClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await createClientAction(formData);

    if (res.success && res.client) {
      setClients((prev) => [res.client, ...prev]);
      setSelectedClientId(res.client.id);
      setShowNewClientModal(false);
    } else {
      alert(res.error || 'فشل إضافة العميل');
    }
  };

  const shareViaWhatsApp = (inv: Invoice) => {
    const itemsText = inv.items
      .map((item) => {
        const p = availableProducts.find((prod) => prod.productId === item.productId);
        return `• ${p?.name || 'صنف'}: ${item.quantity} كرتونة × ${item.unitPrice} ج.م = ${item.totalPrice} ج.م`;
      })
      .join('\n');

    const discountLine = inv.discount && inv.discount > 0 ? `🎁 *الخصم الممنوح*: ${inv.discount} ج.م\n` : '';

    const message = `🧾 *فاتورة مبيعات - المراعي للتوزيع*
━━━━━━━━━━━━━━━━━━
🏢 *تحت إدارة*: أ/ محمد عبد الله
🔢 رقم الفاتورة: ${inv.invoiceNumber}
👤 العميل: ${selectedClient?.name || 'عميل'}
🚚 المندوب: ${repName}
📅 التاريخ: ${new Date(inv.createdAt).toLocaleString('ar-EG')}
━━━━━━━━━━━━━━━━━━
الأصناف المباعة:
${itemsText}
━━━━━━━━━━━━━━━━━━
💵 *المجموع الفرعي*: ${inv.subtotal || inv.totalAmount} ج.م
${discountLine}💰 *الصافي المطلوب*: ${inv.totalAmount} ج.م
💳 *المدفوع*: ${inv.paidAmount} ج.م (${inv.paymentType === 'cash' ? 'نقدي' : 'آجل'})
${inv.totalAmount - inv.paidAmount > 0 ? `⚠️ *المتبقي آجل*: ${inv.totalAmount - inv.paidAmount} ج.م\n` : ''}
شكراً لتعاملكم معنا! 🥛🥤`;

    const phone = selectedClient?.phone?.replace(/\D/g, '') || '';
    const cleanPhone = phone.startsWith('0') ? '2' + phone : phone;
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Client Selection Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>اختر العميل (المحل أو السوبرماركت):</span>
          </label>
          <button
            type="button"
            onClick={() => setShowNewClientModal(true)}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ عميل جديد</span>
          </button>
        </div>

        <select
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
        >
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.address ? `(${c.address})` : ''} - مديونية: {c.creditBalance} ج.م
            </option>
          ))}
        </select>

        {selectedClient && (
          <div className="px-3 py-2 bg-slate-50 rounded-xl text-xs flex items-center justify-between">
            <span className="text-slate-500">الهاتف: {selectedClient.phone || 'غير مسجل'}</span>
            <span className="font-semibold text-slate-700">
              رصيد المديونية السابق:{' '}
              <strong
                className={selectedClient.creditBalance > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}
              >
                {selectedClient.creditBalance.toLocaleString('ar-EG')} ج.م
              </strong>
            </span>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Products Touch POS Grid */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-slate-700 px-1">
          الأصناف المتاحة في سيارتك (انقر + للزيادة):
        </h2>

        {availableProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 text-xs text-slate-500">
            لا توجد بضاعة في سيارتك حالياً للبيع.
          </div>
        ) : (
          <div className="space-y-2.5">
            {availableProducts.map((p) => {
              const qtyInCart = cart[p.productId] || 0;
              const isUrgent = p.earliestHoursRemaining <= 24;

              return (
                <div
                  key={p.productId}
                  className={`bg-white rounded-2xl p-3.5 border transition ${
                    qtyInCart > 0
                      ? 'border-emerald-500 ring-2 ring-emerald-500/10'
                      : 'border-slate-200'
                  } shadow-xs flex items-center justify-between gap-3`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                      {isUrgent && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          أولوية صرف
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      سعر الكرتونة:{' '}
                      <strong className="text-emerald-700 font-bold">{p.price} ج.م</strong>
                      <span className="mx-1 text-slate-300">•</span>
                      <span>متاح بالسيارة: {p.totalAvailable} كرتونة</span>
                    </div>
                  </div>

                  {/* Touch Counter Buttons */}
                  <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => updateCartQty(p.productId, -1, p.totalAvailable)}
                      disabled={qtyInCart === 0}
                      className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-700 disabled:opacity-30 flex items-center justify-center font-black active:scale-95 shadow-xs"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <span className="w-8 text-center font-black text-slate-900 font-mono text-base">
                      {qtyInCart}
                    </span>

                    <button
                      type="button"
                      onClick={() => updateCartQty(p.productId, 1, p.totalAvailable)}
                      disabled={qtyInCart >= p.totalAvailable}
                      className="w-9 h-9 rounded-lg bg-emerald-600 text-white disabled:opacity-30 flex items-center justify-center font-black active:scale-95 shadow-xs shadow-emerald-600/30"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Options & Summary */}
      {totalItemsCount > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-600">طريقة الدفع:</span>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPaymentType('cash')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  paymentType === 'cash'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>نقدي (كاش)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('credit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  paymentType === 'credit'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>آجل (مديونية)</span>
              </button>
            </div>
          </div>

          {paymentType === 'credit' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المبلغ المدفوع كاش الآن (إن وجد والباقي يسجل آجل)
              </label>
              <input
                type="number"
                min="0"
                max={totalAmount}
                value={partialPaid}
                onChange={(e) => setPartialPaid(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900"
              />
            </div>
          )}

          {/* Discount Input */}
          <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-amber-700" />
              <div>
                <span className="text-xs font-bold text-amber-950 block">خصم خاص على الفاتورة (ج.م)</span>
                <span className="text-[10px] text-amber-700">سيظهر للمدير العام في لوحة التحكم</span>
              </div>
            </div>
            <div className="w-28">
              <input
                type="number"
                min="0"
                max={subtotal}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-1.5 rounded-xl border border-amber-300 text-sm font-black text-amber-900 text-center font-mono focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
              />
            </div>
          </div>

          {/* Total Bar */}
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 pb-2 border-b border-emerald-200/60">
              <span>المجموع قبل الخصم:</span>
              <span className="font-bold font-mono">{subtotal.toLocaleString('ar-EG')} ج.م</span>
            </div>
            {numDiscount > 0 && (
              <div className="flex items-center justify-between text-xs text-amber-700 font-bold pb-2 border-b border-emerald-200/60">
                <span>قيمة الخصم الممنوح:</span>
                <span className="font-mono">-{numDiscount.toLocaleString('ar-EG')} ج.م</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="text-xs font-bold text-emerald-800">
                  إجمالي الأصناف: {totalItemsCount} كرتونة
                </div>
                <div className="text-xs text-emerald-600 mt-0.5">
                  {paymentType === 'cash' ? 'دفع نقدي فوري' : 'دفع آجل'}
                </div>
              </div>
              <div className="text-left">
                <div className="text-xs text-emerald-700 font-semibold mb-0.5">الصافي المطلوب:</div>
                <div className="text-2xl font-black text-emerald-900">
                  {totalAmount.toLocaleString('ar-EG')}{' '}
                  <span className="text-xs font-bold text-emerald-700">ج.م</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 text-center flex items-center justify-center gap-2 text-base transition disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Receipt className="w-5 h-5" />
                <span>إصدار الفاتورة وتأكيد البيع</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Modal: Quick Add Client */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm">إضافة عميل جديد سريعاً</h3>
              <button
                onClick={() => setShowNewClientModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم المحل أو العميل
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="مثلاً: ماركت الصفا"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم الهاتف (لإرسال الفواتير عبر الواتساب)
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="010XXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">العنوان أو الشارع</label>
                <input
                  type="text"
                  name="address"
                  placeholder="شارع التحرير - الدقي"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
                >
                  حفظ واختيار العميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Invoice Created Success & WhatsApp Share / Thermal Receipt */}
      {createdInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center mb-2">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-slate-900">تم إصدار الفاتورة بنجاح!</h3>
              <p className="text-xs text-slate-500">
                رقم الفاتورة: <strong className="font-mono text-slate-800">{createdInvoice.invoiceNumber}</strong>
              </p>
            </div>

            {/* Thermal Receipt Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono space-y-2">
              <div className="text-center font-bold text-slate-800 pb-2 border-b border-dashed border-slate-300">
                شركة المراعي للتوزيع والتوريدات
                <div className="text-[10px] text-emerald-800 font-bold mt-0.5">
                  تحت إدارة: أ/ محمد عبد الله
                </div>
                <div className="text-[10px] text-slate-500 font-normal">
                  المندوب: {repName} | العميل: {selectedClient?.name}
                </div>
              </div>

              <div className="space-y-1 py-1 border-b border-dashed border-slate-300">
                {createdInvoice.items.map((it) => {
                  const p = availableProducts.find((x) => x.productId === it.productId);
                  return (
                    <div key={it.id} className="flex justify-between">
                      <span>
                        {p?.name || 'صنف'} × {it.quantity}
                      </span>
                      <span>{it.totalPrice} ج.م</span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-1 space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>المجموع الفرعي:</span>
                  <span>{createdInvoice.subtotal ?? createdInvoice.totalAmount} ج.م</span>
                </div>
                {createdInvoice.discount && createdInvoice.discount > 0 ? (
                  <div className="flex justify-between text-amber-600 font-bold">
                    <span>الخصم الممنوح:</span>
                    <span>-{createdInvoice.discount} ج.م</span>
                  </div>
                ) : null}
                <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-dashed border-slate-300 pt-1">
                  <span>الصافي المطلوب:</span>
                  <span>{createdInvoice.totalAmount} ج.م</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>المدفوع ({createdInvoice.paymentType === 'cash' ? 'نقداً' : 'آجل'}):</span>
                  <span>{createdInvoice.paidAmount} ج.م</span>
                </div>
                {createdInvoice.totalAmount - createdInvoice.paidAmount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>المتبقي آجل:</span>
                    <span>{createdInvoice.totalAmount - createdInvoice.paidAmount} ج.م</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons: WhatsApp & Print */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => shareViaWhatsApp(createdInvoice)}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/30"
              >
                <Share2 className="w-4 h-4" />
                <span>مشاركة الفاتورة عبر الواتساب (WhatsApp)</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة إيصال حراري (Print Receipt)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreatedInvoice(null);
                  setCart({});
                  router.push('/rep');
                  router.refresh();
                }}
                className="w-full py-2.5 text-slate-500 hover:text-slate-800 text-xs font-bold transition text-center"
              >
                العودة لعهدة السيارة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

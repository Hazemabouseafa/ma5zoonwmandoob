'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ReturnItem, User } from '@/types';
import { createReturnAction } from '@/lib/actions';
import {
  RotateCcw,
  AlertOctagon,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
} from 'lucide-react';

interface Props {
  products: Product[];
  myReturns: (ReturnItem & { product: Product; rep: User })[];
}

export default function ReturnsClientView({ products, myReturns }: Props) {
  const router = useRouter();
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<'expired' | 'damaged'>('expired');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || quantity <= 0) return;

    setLoading(true);
    setMsg(null);

    const res = await createReturnAction({
      productId,
      quantity,
      reason,
      notes: notes.trim() || undefined,
    });

    setLoading(false);
    if (res.success) {
      setMsg({ type: 'success', text: 'تم تسجيل المرتجع بنجاح' });
      setQuantity(1);
      setNotes('');
      router.refresh();
    } else {
      setMsg({ type: 'error', text: res.error || 'فشل التسجيل' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Return Logging Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-amber-600" />
          <span>تسجيل مرتجع جديد:</span>
        </h2>

        {msg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              msg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {msg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{msg.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الصنف المرتجع</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category === 'dairy' ? 'ألبان' : p.category === 'juice' ? 'عصائر' : p.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الكمية (كرتونة)
              </label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">سبب الارجاع</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white"
              >
                <option value="expired">منتهي الصلاحية (Expired)</option>
                <option value="damaged">تالف أو مكسور (Damaged)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ملاحظات أو اسم العميل المرجع منه (اختياري)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثلاً: كسر أثناء النقل أو مرتجع من سوبرماركت الأمانة"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-bold text-xs transition shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>{loading ? 'جاري الحفظ...' : 'تسجيل المرتجع في الوردية'}</span>
          </button>
        </form>
      </div>

      {/* Logged Returns List */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-700 px-1">سجل مرتجعاتي السابقة:</h3>

        {myReturns.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 text-xs text-slate-500">
            لا توجد مرتجعات مسجلة حتى الآن.
          </div>
        ) : (
          <div className="space-y-2">
            {myReturns.map((ret) => (
              <div
                key={ret.id}
                className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{ret.product.name}</div>
                  <div className="text-[11px] text-slate-500">
                    السبب: {ret.reason === 'expired' ? 'منتهي الصلاحية' : 'تالف أو كسر'}
                    {ret.notes ? ` • ${ret.notes}` : ''}
                  </div>
                </div>

                <div className="text-left">
                  <div className="font-bold text-amber-700 font-mono text-sm">
                    {ret.quantity} كرتونة
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(ret.createdAt).toLocaleDateString('ar-EG')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

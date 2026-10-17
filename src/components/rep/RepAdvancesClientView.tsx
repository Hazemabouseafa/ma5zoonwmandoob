'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdvanceRequest } from '@/types';
import { createAdvanceRequestAction } from '@/lib/actions';
import {
  HandCoins,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  X,
  Wallet,
} from 'lucide-react';

interface Props {
  advances: AdvanceRequest[];
}

export default function RepAdvancesClientView({ advances }: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const approvedTotal = advances
    .filter((a) => a.status === 'approved')
    .reduce((sum, a) => sum + a.amount, 0);

  const pendingList = advances.filter((a) => a.status === 'pending');
  const pendingTotal = pendingList.reduce((sum, a) => sum + a.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setMsg({ type: 'error', text: 'يرجى إدخال مبلغ صحيح أكبر من الصفر' });
      return;
    }
    if (!reason.trim()) {
      setMsg({ type: 'error', text: 'يرجى كتابة سبب طلب السلفة' });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('amount', val.toString());
    formData.append('reason', reason.trim());

    const res = await createAdvanceRequestAction(formData);
    setLoading(false);

    if (res.success) {
      setMsg({ type: 'success', text: res.message || 'تم إرسال طلب السلفة للإدارة بنجاح' });
      setAmount('');
      setReason('');
      setShowModal(false);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('app:sync'));
      }
      router.refresh();
    } else {
      setMsg({ type: 'error', text: res.error || 'فشل إرسال الطلب' });
    }
  };

  const getStatusBadge = (status: AdvanceRequest['status']) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>معتمدة</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>مرفوضة</span>
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>قيد المراجعة</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">سلف المندوب والعهد</h1>
          <p className="text-xs text-slate-500">
            تقديم طلبات السلف ومتابعة حالة اعتمادها من الإدارة
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setMsg(null);
            setShowModal(true);
          }}
          className="px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>طلب سلفة</span>
        </button>
      </div>

      {/* Messages */}
      {msg && (
        <div
          className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>إجمالي السلف المعتمدة</span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {approvedTotal.toLocaleString('ar-EG')}{' '}
            <span className="text-xs font-bold text-emerald-600">ج.م</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>طلبات قيد المراجعة</span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {pendingTotal.toLocaleString('ar-EG')}{' '}
            <span className="text-xs font-bold text-amber-600">ج.م</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {pendingList.length} طلبات قيد الانتظار
          </div>
        </div>
      </div>

      {/* Advance Requests List */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold text-slate-700 px-1">سجل طلبات السلف</h2>

        {advances.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-xs space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl mx-auto flex items-center justify-center">
              <HandCoins className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-slate-700">لا توجد طلبات سلف سابقة</div>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              يمكنك الضغط على زر &quot;طلب سلفة&quot; بالأعلى لتقديم طلب سلفة مالية للإدارة في أي وقت
            </p>
          </div>
        ) : (
          advances.map((adv) => (
            <div
              key={adv.id}
              className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-2xs space-y-2.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-black text-slate-900">
                    {adv.amount.toLocaleString('ar-EG')}{' '}
                    <span className="text-xs font-bold text-emerald-600">ج.م</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 font-medium">
                    {adv.reason}
                  </div>
                </div>
                <div>{getStatusBadge(adv.status)}</div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {new Date(adv.createdAt).toLocaleDateString('ar-EG', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    -{' '}
                    {new Date(adv.createdAt).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {adv.managerNotes && (
                <div className="bg-slate-50 rounded-2xl p-2.5 text-xs text-slate-700 border border-slate-200">
                  <strong className="text-slate-900 block font-bold mb-0.5">ملاحظات الإدارة:</strong>
                  <span>{adv.managerNotes}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <HandCoins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">طلب سلفة مالية جديدة</h3>
                  <div className="text-[11px] text-slate-500">سيتم إرسال الطلب للمدير العام للاعتماد</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المبلغ المطلوب (جنيه مصري) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  placeholder="مثال: 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-bold focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />

                {/* Quick Add Amount Buttons */}
                <div className="flex items-center gap-1.5 mt-2">
                  {[100, 200, 500, 1000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val.toString())}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-semibold transition"
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  سبب السلفة / ملاحظات *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="مثال: مصاريف صيانة طارئة للسيارة / وقود إضافي / سلفة شخصية"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-xs leading-relaxed focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  {loading ? 'جاري الإرسال...' : 'تأكيد إرسال الطلب'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

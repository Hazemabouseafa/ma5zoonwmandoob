'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Client, Collection, User } from '@/types';
import { createCollectionAction } from '@/lib/actions';
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  Building,
  ArrowRight,
} from 'lucide-react';

interface Props {
  clients: Client[];
  myCollections: (Collection & { client: Client; rep: User })[];
}

export default function CollectionsClientView({ clients, myCollections }: Props) {
  const router = useRouter();
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedClient = clients.find((c) => c.id === clientId) || clients[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!clientId || isNaN(numAmount) || numAmount <= 0) return;

    setLoading(true);
    setMsg(null);

    const res = await createCollectionAction({
      clientId,
      amount: numAmount,
      notes: notes.trim() || undefined,
    });

    setLoading(false);
    if (res.success) {
      setMsg({ type: 'success', text: 'تم تسجيل التحصيل وتحديث حساب العميل بنجاح' });
      setAmount('');
      setNotes('');
      router.refresh();
    } else {
      setMsg({ type: 'error', text: res.error || 'فشل تسجيل التحصيل' });
    }
  };

  return (
    <div className="space-y-4">
      {/* Form Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-emerald-600" />
          <span>تسجيل تحصيل نقدي من عميل:</span>
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
            <label className="block text-xs font-bold text-slate-700 mb-1">اختر العميل</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} - مديونية حالية: {c.creditBalance.toLocaleString('ar-EG')} ج.م
                </option>
              ))}
            </select>
          </div>

          {selectedClient && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <span className="text-slate-500">المديونية المستحقة على العميل:</span>
              <strong
                className={`font-mono text-sm ${
                  selectedClient.creditBalance > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {selectedClient.creditBalance.toLocaleString('ar-EG')} ج.م
              </strong>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              المبلغ المحصل نقداً (ج.م) *
            </label>
            <input
              type="number"
              step="0.5"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ملاحظات أو رقم الإيصال اليدوي (اختياري)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Wallet className="w-4 h-4" />
            <span>{loading ? 'جاري التسجيل...' : 'تأكيد استلام المبلغ وتحديث الحساب'}</span>
          </button>
        </form>
      </div>

      {/* History */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-700 px-1">سجل تحصيلاتي السابقة:</h3>

        {myCollections.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 text-xs text-slate-500">
            لم تسجل تحصيلات نقدية بعد.
          </div>
        ) : (
          <div className="space-y-2">
            {myCollections.map((col) => (
              <div
                key={col.id}
                className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{col.client.name}</div>
                  <div className="text-[11px] text-slate-500">{col.notes || 'سند قبض نقدي'}</div>
                </div>

                <div className="text-left">
                  <div className="font-bold text-emerald-700 font-mono text-sm">
                    {col.amount.toLocaleString('ar-EG')} ج.م
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {new Date(col.createdAt).toLocaleDateString('ar-EG')}
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

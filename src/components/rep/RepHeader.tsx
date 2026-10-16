'use client';

import { useRouter } from 'next/navigation';
import { logoutAction } from '@/lib/actions';
import { Truck, LogOut, MapPin } from 'lucide-react';

interface RepHeaderProps {
  repName: string;
  assignedRoute?: string;
}

export default function RepHeader({ repName, assignedRoute }: RepHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="bg-emerald-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
            <Truck className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="font-bold text-sm leading-tight">{repName}</div>
            <div className="text-[10px] text-emerald-200 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-emerald-300" />
              <span>{assignedRoute || 'مندوب مبيعات وتوزيع'}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="تسجيل الخروج"
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition text-emerald-100 hover:text-white text-xs font-semibold flex items-center gap-1"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-[11px]">خروج</span>
        </button>
      </div>
    </header>
  );
}

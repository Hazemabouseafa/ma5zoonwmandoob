'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Package,
  PlusCircle,
  RotateCcw,
  Wallet,
  ClipboardList,
  HandCoins,
} from 'lucide-react';

export default function RepNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/rep', label: 'عهدة السيارة', icon: Package },
    { href: '/rep/new-invoice', label: 'فاتورة جديدة', icon: PlusCircle, isPrimary: true },
    { href: '/rep/returns', label: 'المرتجعات', icon: RotateCcw },
    { href: '/rep/collections', label: 'التحصيلات', icon: Wallet },
    { href: '/rep/advances', label: 'السلف', icon: HandCoins },
    { href: '/rep/summary', label: 'يوميتي', icon: ClipboardList },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1 shadow-lg max-w-lg mx-auto sm:rounded-t-2xl">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition active:scale-95 ${
                    isActive
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-emerald-600/30'
                      : 'bg-emerald-700 text-white shadow-emerald-700/30'
                  }`}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-bold text-emerald-800 mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition ${
                isActive
                  ? 'text-emerald-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600 stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

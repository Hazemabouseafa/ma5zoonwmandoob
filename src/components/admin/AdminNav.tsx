'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logoutAction } from '@/lib/actions';
import {
  LayoutDashboard,
  Boxes,
  Truck,
  Scale,
  Users,
  BarChart3,
  LogOut,
  ShieldCheck,
  FileText,
  Store,
} from 'lucide-react';

interface AdminNavProps {
  userName: string;
}

export default function AdminNav({ userName }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: '/admin', label: 'الرقابة الحية والمؤشرات', icon: LayoutDashboard },
    { href: '/admin/invoices', label: 'فواتير المناديب والخصومات', icon: FileText },
    { href: '/admin/clients', label: 'المنافذ والسوبرماركتات', icon: Store },
    { href: '/admin/inventory', label: 'المخزون والتشغيلات (FIFO)', icon: Boxes },
    { href: '/admin/dispatch', label: 'تحويل عهدة للسيارات', icon: Truck },
    { href: '/admin/settlements', label: 'تسويات نهاية اليوم', icon: Scale },
    { href: '/admin/reps', label: 'إدارة المناديب', icon: Users },
    { href: '/admin/analytics', label: 'التحليلات والمبيعات', icon: BarChart3 },
  ];

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="font-black text-lg text-slate-800 leading-tight">المراعي للتوزيع</div>
              <div className="text-[11px] text-emerald-600 font-semibold">تحت إدارة: أ/ محمد عبد الله</div>
            </div>
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-800">{userName}</div>
                <div className="text-[10px] text-emerald-600 font-medium">المدير العام</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="تسجيل الخروج"
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 space-x-reverse min-w-max py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

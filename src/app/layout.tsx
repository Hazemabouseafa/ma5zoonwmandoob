import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "المراعي | نظام إدارة وتوزيع السلع سريعة التلف - إدارة محمد عبد الله",
  description: "نظام المراعي لإدارة المخزون والمبيعات الميدانية للسلع سريعة التلف (ألبان وعصائر) بنظام FIFO والتسوية اليومية - تحت إدارة محمد عبد الله",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=Tajawal:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased font-sans selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

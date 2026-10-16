import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import RepHeader from '@/components/rep/RepHeader';
import RepNav from '@/components/rep/RepNav';

export default async function RepLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Rep layout is mobile-optimized (max-w-lg mx-auto)
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      <RepHeader repName={user.name} assignedRoute={user.assignedRoute} />
      <main className="flex-1 max-w-lg w-full mx-auto p-4 pb-24">
        {children}
      </main>
      <RepNav />
    </div>
  );
}

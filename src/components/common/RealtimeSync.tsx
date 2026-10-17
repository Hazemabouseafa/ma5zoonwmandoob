'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Radio } from 'lucide-react';

export default function RealtimeSync() {
  const router = useRouter();
  const lastVersionRef = useRef<number>(Date.now());
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('الآن');

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    let isFetching = false;

    const checkSync = async () => {
      // Bandwidth Saver: Do NOT check if the tab is in the background or minimized!
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }

      if (isFetching) return;
      isFetching = true;

      try {
        const res = await fetch(`/api/sync?since=${lastVersionRef.current}`, {
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          if (data.u && data.v) {
            lastVersionRef.current = data.v;
            setSyncing(true);
            router.refresh();
            setLastSyncedTime(
              new Date().toLocaleTimeString('ar-EG', {
                hour: '2-digit',
                minute: '2-digit',
              })
            );
            setTimeout(() => setSyncing(false), 1200);
          }
        }
      } catch (e) {
        // Silently ignore network hiccup to prevent interruption
      } finally {
        isFetching = false;
      }
    };

    // Smart polling every 6 seconds while active tab is visible
    timer = setInterval(checkSync, 6000);

    // Instant sync when user switches back to this tab
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkSync();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      if (timer) clearInterval(timer);
      window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [router]);

  return (
    <div
      title="مزامنة حية وفورية بأقل استهلاك لباقة Vercel (Fast Origin Transfer)"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-800 shadow-2xs select-none"
    >
      <span className="relative flex h-2 w-2">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 ${
            syncing ? 'duration-300' : 'duration-1000'
          }`}
        />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
      </span>
      <span className="hidden md:inline">
        {syncing ? 'جاري التحديث...' : 'مزامنة فورية نشطة'}
      </span>
      {syncing && <RefreshCw className="w-2.5 h-2.5 animate-spin text-emerald-600 ml-0.5" />}
    </div>
  );
}

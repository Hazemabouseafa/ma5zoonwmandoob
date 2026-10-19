import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dbStore } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'غير مصرح لك بسحب النسخة الاحتياطية' },
        { status: 401 }
      );
    }

    const backupData = await dbStore.getFullBackup();
    const now = new Date();
    const dateFormatted = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `al_waseet_backup_${dateFormatted}.json`;

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch (err: any) {
    console.error('Error generating full backup:', err);
    return NextResponse.json(
      { error: err.message || 'حدث خطأ أثناء سحب النسخة الاحتياطية' },
      { status: 500 }
    );
  }
}

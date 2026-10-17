import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const since = Number(searchParams.get('since') || 0);
    const current = await dbStore.getLatestVersion();

    // If client is already up-to-date, return ultra-lightweight payload (11 bytes!)
    if (since && current <= since) {
      return NextResponse.json(
        { u: false },
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
    }

    // New updates occurred (e.g. rep issued invoice, collection, return)
    return NextResponse.json(
      { u: true, v: current },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (err) {
    return NextResponse.json({ u: false }, { status: 500 });
  }
}

import { notFound } from 'next/navigation';
import { dbStore } from '@/lib/store';
import RepProfileClientView from '@/components/admin/RepProfileClientView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminRepProfilePage({ params }: PageProps) {
  const { id } = await params;
  try {
    const analytics = await dbStore.getRep360Analytics(id);
    return <RepProfileClientView analytics={analytics} />;
  } catch {
    notFound();
  }
}

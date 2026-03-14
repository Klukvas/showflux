'use client';

import { use } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Spinner } from '@/components/ui/spinner';
import { useShowing } from '@/features/showings/hooks/use-showing';
import { ShowingDetailCard } from '@/features/showings/components/showing-detail-card';

interface ShowingDetailPageProps {
  readonly params: Promise<{ id: string }>;
}

export default function ShowingDetailPage({ params }: ShowingDetailPageProps) {
  const { id } = use(params);
  const { data: showing, isLoading, error } = useShowing(id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !showing) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">{error ?? 'Showing not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Showing Details" />
      <ShowingDetailCard showing={showing} />
    </div>
  );
}

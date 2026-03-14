'use client';

import { use } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Spinner } from '@/components/ui/spinner';
import { useOffer } from '@/features/offers/hooks/use-offer';
import { OfferDetailCard } from '@/features/offers/components/offer-detail-card';

interface OfferDetailPageProps {
  readonly params: Promise<{ id: string }>;
}

export default function OfferDetailPage({ params }: OfferDetailPageProps) {
  const { id } = use(params);
  const { data: offer, isLoading, error } = useOffer(id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">{error ?? 'Offer not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Offer Details" />
      <OfferDetailCard offer={offer} />
    </div>
  );
}

'use client';

import { use } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Spinner } from '@/components/ui/spinner';
import { useListing } from '@/features/listings/hooks/use-listing';
import { ListingForm } from '@/features/listings/components/listing-form';

interface EditListingPageProps {
  readonly params: Promise<{ id: string }>;
}

export default function EditListingPage({ params }: EditListingPageProps) {
  const { id } = use(params);
  const { data: listing, isLoading, error } = useListing(id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">{error ?? 'Listing not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Listing" />
      <ListingForm listing={listing} />
    </div>
  );
}

'use client';

import { PageHeader } from '@/components/ui/page-header';
import { ListingForm } from '@/features/listings/components/listing-form';

export default function NewListingPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New Listing" />
      <ListingForm />
    </div>
  );
}

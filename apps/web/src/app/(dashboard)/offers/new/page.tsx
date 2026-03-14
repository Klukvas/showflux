'use client';

import { PageHeader } from '@/components/ui/page-header';
import { OfferForm } from '@/features/offers/components/offer-form';

export default function NewOfferPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New Offer" />
      <OfferForm />
    </div>
  );
}

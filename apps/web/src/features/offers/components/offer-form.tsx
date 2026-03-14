'use client';

import { useRouter } from 'next/navigation';
import { useForm } from '@/hooks/use-form';
import { useFetch } from '@/hooks/use-fetch';
import { api } from '@/lib/api-client';
import { endpoints } from '@/lib/api-endpoints';
import { useToast } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { compose, required, minLength, maxLength, positiveNumber } from '@/lib/validators';
import type { Offer } from '@/types/offer';
import type { Listing } from '@/types/listing';
import type { PaginatedResponse } from '@/types/common';

const statusOptions = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'countered', label: 'Countered' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'expired', label: 'Expired' },
];

interface OfferFormProps {
  readonly offer?: Offer;
}

export function OfferForm({ offer }: OfferFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!offer;

  const { data: listingsData } = useFetch<PaginatedResponse<Listing>>(
    `${endpoints.listings.list}?limit=100&status=active`,
  );

  const listingOptions = (listingsData?.data ?? []).map((l) => ({
    value: l.id,
    label: `${l.address}, ${l.city}`,
  }));

  const formatDateForInput = (dateStr?: string | null) => {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().slice(0, 16);
  };

  const form = useForm({
    initialValues: {
      listingId: offer?.listingId ?? '',
      buyerName: offer?.buyerName ?? '',
      offerAmount: offer?.offerAmount?.toString() ?? '',
      status: offer?.status ?? 'submitted',
      expirationDate: formatDateForInput(offer?.expirationDate),
      notes: offer?.notes ?? '',
    },
    validators: {
      listingId: required('Listing'),
      buyerName: compose(required('Buyer name'), minLength('Buyer name', 2), maxLength('Buyer name', 255)),
      offerAmount: positiveNumber('Offer amount'),
    },
    onSubmit: async (values) => {
      if (isEditing) {
        await api.patch(endpoints.offers.update(offer.id), {
          buyerName: values.buyerName,
          offerAmount: Number(values.offerAmount),
          status: values.status,
          expirationDate: values.expirationDate ? new Date(values.expirationDate).toISOString() : undefined,
          notes: values.notes || undefined,
        });
        toast('Offer updated', 'success');
      } else {
        await api.post(endpoints.offers.create, {
          listingId: values.listingId,
          buyerName: values.buyerName,
          offerAmount: Number(values.offerAmount),
          expirationDate: values.expirationDate ? new Date(values.expirationDate).toISOString() : undefined,
          notes: values.notes || undefined,
        });
        toast('Offer submitted', 'success');
      }
      router.push('/offers');
      router.refresh();
    },
  });

  return (
    <Card>
      <form onSubmit={form.handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          {form.serverError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {form.serverError}
            </div>
          )}
          {!isEditing && (
            <Select
              label="Listing"
              options={listingOptions}
              placeholder="Select a listing"
              value={form.values.listingId}
              onChange={(e) => form.setValue('listingId', e.target.value)}
              error={form.errors.listingId}
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Buyer Name"
              value={form.values.buyerName}
              onChange={(e) => form.setValue('buyerName', e.target.value)}
              onBlur={() => form.handleBlur('buyerName')}
              error={form.errors.buyerName}
            />
            <Input
              label="Offer Amount"
              type="number"
              value={form.values.offerAmount}
              onChange={(e) => form.setValue('offerAmount', e.target.value)}
              onBlur={() => form.handleBlur('offerAmount')}
              error={form.errors.offerAmount}
            />
          </div>
          <Input
            label="Expiration Date"
            type="datetime-local"
            value={form.values.expirationDate}
            onChange={(e) => form.setValue('expirationDate', e.target.value)}
          />
          {isEditing && (
            <Select
              label="Status"
              options={statusOptions}
              value={form.values.status}
              onChange={(e) => form.setValue('status', e.target.value)}
            />
          )}
          <Textarea
            label="Notes"
            value={form.values.notes}
            onChange={(e) => form.setValue('notes', e.target.value)}
          />
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" isLoading={form.isSubmitting}>
            {isEditing ? 'Update Offer' : 'Submit Offer'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

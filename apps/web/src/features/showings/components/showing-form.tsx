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
import { required } from '@/lib/validators';
import type { Showing } from '@/types/showing';
import type { Listing } from '@/types/listing';
import type { PaginatedResponse } from '@/types/common';

const statusOptions = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
];

interface ShowingFormProps {
  readonly showing?: Showing;
}

export function ShowingForm({ showing }: ShowingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!showing;

  const { data: listingsData } = useFetch<PaginatedResponse<Listing>>(
    `${endpoints.listings.list}?limit=100&status=active`,
  );

  const listingOptions = (listingsData?.data ?? []).map((l) => ({
    value: l.id,
    label: `${l.address}, ${l.city}`,
  }));

  const formatDateForInput = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toISOString().slice(0, 16);
  };

  const form = useForm({
    initialValues: {
      listingId: showing?.listingId ?? '',
      scheduledAt: formatDateForInput(showing?.scheduledAt),
      duration: showing?.duration?.toString() ?? '30',
      status: showing?.status ?? 'scheduled',
      feedback: showing?.feedback ?? '',
      notes: showing?.notes ?? '',
    },
    validators: {
      listingId: required('Listing'),
      scheduledAt: required('Scheduled date'),
    },
    onSubmit: async (values) => {
      if (isEditing) {
        await api.patch(endpoints.showings.update(showing.id), {
          scheduledAt: new Date(values.scheduledAt).toISOString(),
          duration: Number(values.duration),
          status: values.status,
          feedback: values.feedback || undefined,
          notes: values.notes || undefined,
        });
        toast('Showing updated', 'success');
      } else {
        await api.post(endpoints.showings.create, {
          listingId: values.listingId,
          scheduledAt: new Date(values.scheduledAt).toISOString(),
          duration: Number(values.duration),
          notes: values.notes || undefined,
        });
        toast('Showing created', 'success');
      }
      router.push('/showings');
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
              label="Scheduled At"
              type="datetime-local"
              value={form.values.scheduledAt}
              onChange={(e) => form.setValue('scheduledAt', e.target.value)}
              onBlur={() => form.handleBlur('scheduledAt')}
              error={form.errors.scheduledAt}
            />
            <Input
              label="Duration (minutes)"
              type="number"
              min={15}
              max={480}
              value={form.values.duration}
              onChange={(e) => form.setValue('duration', e.target.value)}
            />
          </div>
          {isEditing && (
            <>
              <Select
                label="Status"
                options={statusOptions}
                value={form.values.status}
                onChange={(e) => form.setValue('status', e.target.value)}
              />
              <Textarea
                label="Feedback"
                value={form.values.feedback}
                onChange={(e) => form.setValue('feedback', e.target.value)}
              />
            </>
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
            {isEditing ? 'Update Showing' : 'Schedule Showing'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

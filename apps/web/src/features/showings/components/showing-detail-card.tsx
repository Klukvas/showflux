'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { api } from '@/lib/api-client';
import { endpoints } from '@/lib/api-endpoints';
import { useToast } from '@/components/ui/toast';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatDateTime, formatDate } from '@/lib/format';
import type { Showing } from '@/types/showing';

interface ShowingDetailCardProps {
  readonly showing: Showing;
}

export function ShowingDetailCard({ showing }: ShowingDetailCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isBroker = user?.role === 'broker';

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.del(endpoints.showings.delete(showing.id));
      toast('Showing deleted', 'success');
      router.push('/showings');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete', 'error');
    } finally {
      setIsDeleting(false);
      setShowDelete(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {showing.listing?.address ?? 'Showing'}
            </h2>
            <p className="text-sm text-gray-500">
              {showing.listing?.city}, {showing.listing?.state}
            </p>
          </div>
          <StatusBadge status={showing.status} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Detail label="Scheduled" value={formatDateTime(showing.scheduledAt)} />
            <Detail label="Duration" value={`${showing.duration} min`} />
            <Detail label="Agent" value={showing.agent?.fullName ?? '-'} />
            <Detail label="Created" value={formatDate(showing.createdAt)} />
          </div>
          {showing.feedback && <Detail label="Feedback" value={showing.feedback} />}
          {showing.notes && <Detail label="Notes" value={showing.notes} />}

          <div className="flex gap-3 pt-4">
            <Button onClick={() => router.push(`/showings/${showing.id}/edit`)}>
              Edit
            </Button>
            {isBroker && (
              <Button variant="danger" onClick={() => setShowDelete(true)}>
                Delete
              </Button>
            )}
            <Button variant="secondary" onClick={() => router.push('/showings')}>
              Back
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Showing"
        message="Are you sure you want to delete this showing? This action cannot be undone."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </>
  );
}

function Detail({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm text-gray-900">{value}</p>
    </div>
  );
}

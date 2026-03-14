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
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import type { Offer } from '@/types/offer';

interface OfferDetailCardProps {
  readonly offer: Offer;
}

export function OfferDetailCard({ offer }: OfferDetailCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isBroker = user?.role === 'broker';

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.del(endpoints.offers.delete(offer.id));
      toast('Offer deleted', 'success');
      router.push('/offers');
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
              {offer.listing?.address ?? 'Offer'}
            </h2>
            <p className="text-sm text-gray-500">
              {offer.listing?.city}, {offer.listing?.state}
            </p>
          </div>
          <StatusBadge status={offer.status} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Detail label="Amount" value={formatCurrency(offer.offerAmount)} />
            <Detail label="Buyer" value={offer.buyerName} />
            <Detail label="Agent" value={offer.agent?.fullName ?? '-'} />
            <Detail label="Submitted" value={formatDate(offer.submittedAt)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Detail label="Expiration" value={offer.expirationDate ? formatDateTime(offer.expirationDate) : 'None'} />
            <Detail label="Created" value={formatDate(offer.createdAt)} />
          </div>
          {offer.notes && <Detail label="Notes" value={offer.notes} />}

          <div className="flex gap-3 pt-4">
            <Button onClick={() => router.push(`/offers/${offer.id}/edit`)}>
              Edit
            </Button>
            {isBroker && (
              <Button variant="danger" onClick={() => setShowDelete(true)}>
                Delete
              </Button>
            )}
            <Button variant="secondary" onClick={() => router.push('/offers')}>
              Back
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Offer"
        message="Are you sure you want to delete this offer? This action cannot be undone."
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

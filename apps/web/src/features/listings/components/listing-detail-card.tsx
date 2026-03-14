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
import { formatCurrency, formatDate, formatAddress } from '@/lib/format';
import type { Listing } from '@/types/listing';

interface ListingDetailCardProps {
  readonly listing: Listing;
}

export function ListingDetailCard({ listing }: ListingDetailCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isBroker = user?.role === 'broker';

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.del(endpoints.listings.delete(listing.id));
      toast('Listing deleted', 'success');
      router.push('/listings');
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
            <h2 className="text-lg font-semibold text-gray-900">{listing.address}</h2>
            <p className="text-sm text-gray-500">
              {formatAddress(listing.address, listing.city, listing.state, listing.zip)}
            </p>
          </div>
          <StatusBadge status={listing.status} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Detail label="Price" value={formatCurrency(listing.price)} />
            <Detail label="Bedrooms" value={listing.bedrooms?.toString() ?? '-'} />
            <Detail label="Bathrooms" value={listing.bathrooms?.toString() ?? '-'} />
            <Detail label="Sqft" value={listing.sqft?.toLocaleString() ?? '-'} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Detail label="MLS #" value={listing.mlsNumber ?? '-'} />
            <Detail label="Agent" value={listing.listingAgent?.fullName ?? '-'} />
            <Detail label="Created" value={formatDate(listing.createdAt)} />
            <Detail label="Updated" value={formatDate(listing.updatedAt)} />
          </div>
          {listing.notes && <Detail label="Notes" value={listing.notes} />}

          <div className="flex gap-3 pt-4">
            <Button onClick={() => router.push(`/listings/${listing.id}/edit`)}>
              Edit
            </Button>
            {isBroker && (
              <Button variant="danger" onClick={() => setShowDelete(true)}>
                Delete
              </Button>
            )}
            <Button variant="secondary" onClick={() => router.push('/listings')}>
              Back
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Listing"
        message="Are you sure you want to delete this listing? This action cannot be undone."
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

'use client';

import { PageHeader } from '@/components/ui/page-header';
import { ShowingForm } from '@/features/showings/components/showing-form';

export default function NewShowingPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Schedule Showing" />
      <ShowingForm />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useForm } from '@/hooks/use-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { email as emailValidator } from '@/lib/validators';

interface InviteFormProps {
  readonly onCreateInvite: (email: string) => Promise<string>;
}

export function InviteForm({ onCreateInvite }: InviteFormProps) {
  const { toast } = useToast();
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const form = useForm({
    initialValues: { email: '' },
    validators: { email: emailValidator },
    onSubmit: async (values) => {
      const token = await onCreateInvite(values.email);
      const link = `${window.location.origin}/invite/${token}`;
      setInviteLink(link);
      toast('Invite sent', 'success');
      form.reset();
    },
  });

  const copyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    toast('Link copied to clipboard', 'success');
  };

  return (
    <div className="space-y-4">
      <form onSubmit={form.handleSubmit} className="flex items-end gap-3">
        <div className="flex-1">
          <Input
            label="Email Address"
            type="email"
            placeholder="agent@example.com"
            value={form.values.email}
            onChange={(e) => form.setValue('email', e.target.value)}
            onBlur={() => form.handleBlur('email')}
            error={form.errors.email}
          />
        </div>
        <Button type="submit" isLoading={form.isSubmitting}>
          Send Invite
        </Button>
      </form>
      {form.serverError && (
        <p className="text-sm text-red-600">{form.serverError}</p>
      )}
      {inviteLink && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3">
          <p className="flex-1 truncate text-sm text-green-700">{inviteLink}</p>
          <Button variant="secondary" size="sm" onClick={copyLink}>
            Copy
          </Button>
        </div>
      )}
    </div>
  );
}

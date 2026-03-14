'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { useForm } from '@/hooks/use-form';
import { api } from '@/lib/api-client';
import { endpoints } from '@/lib/api-endpoints';
import { useToast } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { compose, minLength, maxLength } from '@/lib/validators';
import type { User } from '@/types/user';

export function ProfileForm() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const form = useForm({
    initialValues: {
      fullName: user?.fullName ?? '',
      avatarUrl: user?.avatarUrl ?? '',
    },
    validators: {
      fullName: compose(minLength('Full name', 2), maxLength('Full name', 100)),
    },
    onSubmit: async (values) => {
      const updated = await api.patch<User>(endpoints.users.me, {
        fullName: values.fullName,
        avatarUrl: values.avatarUrl || undefined,
      });
      updateUser(updated);
      toast('Profile updated', 'success');
    },
  });

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
      </CardHeader>
      <form onSubmit={form.handleSubmit}>
        <CardContent className="space-y-4">
          {form.serverError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {form.serverError}
            </div>
          )}
          <Input
            label="Email"
            type="email"
            value={user?.email ?? ''}
            disabled
          />
          <Input
            label="Full Name"
            value={form.values.fullName}
            onChange={(e) => form.setValue('fullName', e.target.value)}
            onBlur={() => form.handleBlur('fullName')}
            error={form.errors.fullName}
          />
          <Input
            label="Avatar URL"
            type="url"
            placeholder="https://example.com/avatar.jpg"
            value={form.values.avatarUrl}
            onChange={(e) => form.setValue('avatarUrl', e.target.value)}
          />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" isLoading={form.isSubmitting}>
            Save Changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

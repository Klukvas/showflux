'use client';

import { useForm } from '@/hooks/use-form';
import { api } from '@/lib/api-client';
import { endpoints } from '@/lib/api-endpoints';
import { useToast } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { required, strongPassword, matchesField } from '@/lib/validators';

export function ChangePasswordForm() {
  const { toast } = useToast();

  const form = useForm({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validators: {
      currentPassword: required('Current password'),
      newPassword: strongPassword,
      confirmPassword: matchesField('newPassword', 'Passwords'),
    },
    onSubmit: async (values) => {
      await api.post(endpoints.users.changePassword, {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast('Password changed', 'success');
      form.reset();
    },
  });

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
      </CardHeader>
      <form onSubmit={form.handleSubmit}>
        <CardContent className="space-y-4">
          {form.serverError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {form.serverError}
            </div>
          )}
          <Input
            label="Current Password"
            type="password"
            autoComplete="current-password"
            value={form.values.currentPassword}
            onChange={(e) => form.setValue('currentPassword', e.target.value)}
            onBlur={() => form.handleBlur('currentPassword')}
            error={form.errors.currentPassword}
          />
          <Input
            label="New Password"
            type="password"
            autoComplete="new-password"
            value={form.values.newPassword}
            onChange={(e) => form.setValue('newPassword', e.target.value)}
            onBlur={() => form.handleBlur('newPassword')}
            error={form.errors.newPassword}
          />
          <Input
            label="Confirm New Password"
            type="password"
            autoComplete="new-password"
            value={form.values.confirmPassword}
            onChange={(e) => form.setValue('confirmPassword', e.target.value)}
            onBlur={() => form.handleBlur('confirmPassword')}
            error={form.errors.confirmPassword}
          />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" isLoading={form.isSubmitting}>
            Change Password
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

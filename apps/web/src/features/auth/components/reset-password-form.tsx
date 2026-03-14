'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from '@/hooks/use-form';
import { api } from '@/lib/api-client';
import { endpoints } from '@/lib/api-endpoints';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { strongPassword, matchesField } from '@/lib/validators';

interface ResetPasswordFormProps {
  readonly token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm({
    initialValues: { password: '', confirmPassword: '' },
    validators: {
      password: strongPassword,
      confirmPassword: matchesField('password', 'Passwords'),
    },
    onSubmit: async (values) => {
      await api.post(endpoints.auth.resetPassword, { token, password: values.password });
      setSubmitted(true);
    },
  });

  if (submitted) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900">Password reset successful</h2>
          <p className="mt-2 text-sm text-gray-500">
            Your password has been updated. You can now sign in.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit} className="space-y-4">
          {form.serverError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {form.serverError}
            </div>
          )}
          <Input
            label="New Password"
            type="password"
            autoComplete="new-password"
            value={form.values.password}
            onChange={(e) => form.setValue('password', e.target.value)}
            onBlur={() => form.handleBlur('password')}
            error={form.errors.password}
          />
          <Input
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            value={form.values.confirmPassword}
            onChange={(e) => form.setValue('confirmPassword', e.target.value)}
            onBlur={() => form.handleBlur('confirmPassword')}
            error={form.errors.confirmPassword}
          />
          <Button type="submit" isLoading={form.isSubmitting} className="w-full">
            Reset Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

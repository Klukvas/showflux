'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from '@/hooks/use-form';
import { api } from '@/lib/api-client';
import { endpoints } from '@/lib/api-endpoints';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { email as emailValidator } from '@/lib/validators';

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm({
    initialValues: { email: '' },
    validators: { email: emailValidator },
    onSubmit: async (values) => {
      await api.post(endpoints.auth.forgotPassword, { email: values.email });
      setSubmitted(true);
    },
  });

  if (submitted) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900">Check your email</h2>
          <p className="mt-2 text-sm text-gray-500">
            If an account exists with that email, we&apos;ve sent a password reset link.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={form.handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-500">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
          {form.serverError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {form.serverError}
            </div>
          )}
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={form.values.email}
            onChange={(e) => form.setValue('email', e.target.value)}
            onBlur={() => form.handleBlur('email')}
            error={form.errors.email}
          />
          <Button type="submit" isLoading={form.isSubmitting} className="w-full">
            Send Reset Link
          </Button>
          <p className="text-center text-sm text-gray-500">
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
              Back to sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

'use client';

import { useSearchParams } from 'next/navigation';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900">Invalid reset link</h2>
          <p className="mt-2 text-sm text-gray-500">
            This password reset link is invalid or has expired.
          </p>
          <Link
            href="/forgot-password"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Request a new one
          </Link>
        </CardContent>
      </Card>
    );
  }

  return <ResetPasswordForm token={token} />;
}

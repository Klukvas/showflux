'use client';

import Link from 'next/link';
import { useAuth } from '../hooks/use-auth';
import { useForm } from '@/hooks/use-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { email as emailValidator, strongPassword, compose, minLength, maxLength } from '@/lib/validators';
import { ApiClientError } from '@/lib/api-client';

export function RegisterForm() {
  const { register } = useAuth();

  const form = useForm({
    initialValues: { email: '', password: '', fullName: '', workspaceName: '' },
    validators: {
      email: emailValidator,
      password: strongPassword,
      fullName: compose(minLength('Full name', 2), maxLength('Full name', 100)),
      workspaceName: compose(minLength('Workspace name', 2), maxLength('Workspace name', 100)),
    },
    onSubmit: async (values) => {
      try {
        await register(values.email, values.password, values.fullName, values.workspaceName);
      } catch (err) {
        if (err instanceof ApiClientError && err.statusCode === 409) {
          form.setFieldError('email', 'This email is already taken');
          return;
        }
        throw err;
      }
    },
  });

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
            label="Full Name"
            autoComplete="name"
            value={form.values.fullName}
            onChange={(e) => form.setValue('fullName', e.target.value)}
            onBlur={() => form.handleBlur('fullName')}
            error={form.errors.fullName}
          />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={form.values.email}
            onChange={(e) => form.setValue('email', e.target.value)}
            onBlur={() => form.handleBlur('email')}
            error={form.errors.email}
          />
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            value={form.values.password}
            onChange={(e) => form.setValue('password', e.target.value)}
            onBlur={() => form.handleBlur('password')}
            error={form.errors.password}
          />
          <Input
            label="Workspace Name"
            value={form.values.workspaceName}
            onChange={(e) => form.setValue('workspaceName', e.target.value)}
            onBlur={() => form.handleBlur('workspaceName')}
            error={form.errors.workspaceName}
            placeholder="Your brokerage name"
          />
          <Button type="submit" isLoading={form.isSubmitting} className="w-full">
            Create Account
          </Button>
          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

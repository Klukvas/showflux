'use client';

import Link from 'next/link';
import { useAuth } from '../hooks/use-auth';
import { useForm } from '@/hooks/use-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { email as emailValidator, required } from '@/lib/validators';

export function LoginForm() {
  const { login } = useAuth();

  const form = useForm({
    initialValues: { email: '', password: '' },
    validators: {
      email: emailValidator,
      password: required('Password'),
    },
    onSubmit: async (values) => {
      await login(values.email, values.password);
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
            autoComplete="current-password"
            value={form.values.password}
            onChange={(e) => form.setValue('password', e.target.value)}
            onBlur={() => form.handleBlur('password')}
            error={form.errors.password}
          />
          <div className="flex items-center justify-between">
            <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" isLoading={form.isSubmitting} className="w-full">
            Sign in
          </Button>
          <p className="text-center text-sm text-gray-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-700">
              Register
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Spinner } from '@/components/ui/spinner';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) return null;

  return <AppShell>{children}</AppShell>;
}

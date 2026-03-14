'use client';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { PageHeader } from '@/components/ui/page-header';
import { ProfileForm } from '@/features/settings/components/profile-form';
import { ChangePasswordForm } from '@/features/settings/components/change-password-form';
import { WorkspaceForm } from '@/features/settings/components/workspace-form';

export default function SettingsPage() {
  const { user } = useAuth();
  const isBroker = user?.role === 'broker';

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />
      <div className="space-y-6 max-w-2xl">
        <ProfileForm />
        <ChangePasswordForm />
        {isBroker && <WorkspaceForm />}
      </div>
    </div>
  );
}

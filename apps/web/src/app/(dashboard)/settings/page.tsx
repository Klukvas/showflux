"use client";

import { useAuth } from "@/features/auth/hooks/use-auth";
import { PageHeader } from "@/components/ui/page-header";
import { ProfileForm } from "@/features/settings/components/profile-form";
import { ChangePasswordForm } from "@/features/settings/components/change-password-form";
import { WorkspaceForm } from "@/features/settings/components/workspace-form";
import { SubscriptionCard } from "@/features/subscription/components/subscription-card";

export default function SettingsPage() {
  const { user } = useAuth();
  const isBroker = user?.role === "broker";

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" />
      <div className="max-w-2xl space-y-6">
        <ProfileForm />
        <ChangePasswordForm />
        {isBroker && <WorkspaceForm />}
        {isBroker && <SubscriptionCard />}
      </div>
    </div>
  );
}

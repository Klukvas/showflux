"use client";

import { RoleGuard } from "@/components/auth/role-guard";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { UserTable } from "@/features/team/components/user-table";
import { InviteForm } from "@/features/team/components/invite-form";
import { InviteTable } from "@/features/team/components/invite-table";
import { useUsers } from "@/features/team/hooks/use-users";
import { useInvites } from "@/features/team/hooks/use-invites";

function TeamPageContent() {
  const users = useUsers();
  const invites = useInvites();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Manage your workspace members and invitations"
      />

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Members</h2>
        </CardHeader>
        <CardContent>
          <UserTable
            data={users.data?.data ?? null}
            isLoading={users.isLoading}
            onToggleActive={users.toggleActive}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Invitations</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <InviteForm onCreateInvite={invites.createInvite} />
          <InviteTable
            data={invites.data?.data ?? null}
            isLoading={invites.isLoading}
            onRevoke={invites.revokeInvite}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function TeamPage() {
  return (
    <RoleGuard allowedRoles={["broker"]}>
      <TeamPageContent />
    </RoleGuard>
  );
}

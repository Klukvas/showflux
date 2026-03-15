"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Spinner } from "@/components/ui/spinner";
import type { Role } from "@/types/common";

interface RoleGuardProps {
  readonly allowedRoles: readonly Role[];
  readonly redirectTo?: string;
  readonly children: React.ReactNode;
}

export function RoleGuard({
  allowedRoles,
  redirectTo = "/dashboard",
  children,
}: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const isAllowed = user != null && allowedRoles.includes(user.role);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!isAllowed) {
      router.replace(redirectTo);
    }
  }, [isLoading, user, isAllowed, router, redirectTo]);

  if (isLoading || !isAllowed) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}

'use client';

import { use } from 'react';
import { AcceptInviteForm } from '@/features/auth/components/accept-invite-form';

interface InvitePageProps {
  readonly params: Promise<{ token: string }>;
}

export default function InvitePage({ params }: InvitePageProps) {
  const { token } = use(params);
  return <AcceptInviteForm token={token} />;
}

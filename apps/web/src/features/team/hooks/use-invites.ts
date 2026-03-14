'use client';

import { useFetch } from '@/hooks/use-fetch';
import { api } from '@/lib/api-client';
import { endpoints } from '@/lib/api-endpoints';
import type { Invite } from '@/types/invite';
import type { PaginatedResponse } from '@/types/common';

export function useInvites() {
  const result = useFetch<PaginatedResponse<Invite>>(endpoints.invites.list);

  const createInvite = async (email: string): Promise<string> => {
    const res = await api.post<{ token: string }>(endpoints.invites.create, { email });
    result.refetch();
    return res.token;
  };

  const revokeInvite = async (id: string) => {
    await api.del(endpoints.invites.revoke(id));
    result.refetch();
  };

  return { ...result, createInvite, revokeInvite };
}

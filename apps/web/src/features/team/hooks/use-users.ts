'use client';

import { useState, useMemo } from 'react';
import { useFetch } from '@/hooks/use-fetch';
import { api } from '@/lib/api-client';
import { endpoints } from '@/lib/api-endpoints';
import type { User } from '@/types/user';
import type { PaginatedResponse } from '@/types/common';

export function useUsers() {
  const [page, setPage] = useState(1);

  const path = useMemo(() => `${endpoints.users.list}?page=${page}&limit=20`, [page]);
  const result = useFetch<PaginatedResponse<User>>(path);

  const toggleActive = async (user: User) => {
    const endpoint = user.isActive
      ? endpoints.users.deactivate(user.id)
      : endpoints.users.reactivate(user.id);
    await api.patch(endpoint);
    result.refetch();
  };

  return { ...result, page, setPage, toggleActive };
}

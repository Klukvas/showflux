'use client';

import { useContext } from 'react';
import { AuthContext, type AuthContextShape } from '../auth-context';

export function useAuth(): AuthContextShape {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

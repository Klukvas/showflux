"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AuthContext, type AuthContextShape } from "./auth-context";
import { api, setAccessToken } from "@/lib/api-client";
import { endpoints } from "@/lib/api-endpoints";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import type { User } from "@/types/user";
import type { AuthResponse } from "@/types/auth";

function setSessionCookie(exists: boolean): void {
  if (exists) {
    document.cookie = `${SESSION_COOKIE_NAME}=1; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Strict; Secure`;
  } else {
    document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Strict; Secure`;
  }
}

export function AuthProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.post<AuthResponse>(endpoints.auth.refresh);
        setAccessToken(res.accessToken);
        setUser(res.user);
        setSessionCookie(true);
      } catch {
        setAccessToken(null);
        setSessionCookie(false);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<AuthResponse>(endpoints.auth.login, {
        email,
        password,
      });
      setAccessToken(res.accessToken);
      setUser(res.user);
      setSessionCookie(true);
      router.push("/dashboard");
    },
    [router],
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
      workspaceName: string,
    ) => {
      const res = await api.post<AuthResponse>(endpoints.auth.register, {
        email,
        password,
        fullName,
        workspaceName,
      });
      setAccessToken(res.accessToken);
      setUser(res.user);
      setSessionCookie(true);
      router.push("/dashboard");
    },
    [router],
  );

  const logout = useCallback(async () => {
    try {
      await api.post(endpoints.auth.logout);
    } catch {
      // ignore
    }
    setAccessToken(null);
    setUser(null);
    setSessionCookie(false);
    router.push("/login");
  }, [router]);

  const updateUser = useCallback((updated: User) => {
    setUser(updated);
  }, []);

  const value = useMemo<AuthContextShape>(
    () => ({ user, isLoading, login, register, logout, updateUser }),
    [user, isLoading, login, register, logout, updateUser],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

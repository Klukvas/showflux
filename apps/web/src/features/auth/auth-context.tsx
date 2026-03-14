"use client";

import { createContext } from "react";
import type { User } from "@/types/user";

export interface AuthContextShape {
  readonly user: User | null;
  readonly isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (
    email: string,
    password: string,
    fullName: string,
    workspaceName: string,
  ) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextShape | null>(null);

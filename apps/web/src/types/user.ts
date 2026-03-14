import type { Role } from './common';

export interface User {
  readonly id: string;
  readonly workspaceId: string;
  readonly email: string;
  readonly role: Role;
  readonly fullName: string;
  readonly avatarUrl: string | null;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface UpdateProfileDto {
  readonly fullName?: string;
  readonly avatarUrl?: string;
}

export interface ChangePasswordDto {
  readonly currentPassword: string;
  readonly newPassword: string;
}

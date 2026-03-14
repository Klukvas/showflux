import type { User } from './user';

export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface Invite {
  readonly id: string;
  readonly workspaceId: string;
  readonly invitedBy: string;
  readonly inviter?: User;
  readonly email: string;
  readonly token: string;
  readonly status: InviteStatus;
  readonly expiresAt: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateInviteDto {
  readonly email: string;
}

export interface AcceptInviteDto {
  readonly password: string;
  readonly fullName: string;
}

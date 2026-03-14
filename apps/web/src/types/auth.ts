import type { User } from './user';

export interface LoginDto {
  readonly email: string;
  readonly password: string;
}

export interface RegisterDto {
  readonly email: string;
  readonly password: string;
  readonly fullName: string;
  readonly workspaceName: string;
}

export interface ForgotPasswordDto {
  readonly email: string;
}

export interface ResetPasswordDto {
  readonly token: string;
  readonly password: string;
}

export interface AuthResponse {
  readonly accessToken: string;
  readonly user: User;
}

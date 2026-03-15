import { createHash } from 'node:crypto';

export const BCRYPT_ROUNDS = 12;

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

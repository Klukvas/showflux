export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export const SESSION_COOKIE_NAME = 'sf_session';

export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export const PASSWORD_REQUIREMENTS =
  'At least 8 characters, one uppercase, one lowercase, one number, and one special character';

export const ITEMS_PER_PAGE = 10;

import { setCookie, removeCookie } from './cookie.utils';

const ACCESS_TOKEN_KEY = 'access_token';
const COOKIE_EXPIRY_DAYS = 7;

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function saveAccessToken(accessToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  setCookie(ACCESS_TOKEN_KEY, accessToken, COOKIE_EXPIRY_DAYS);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  removeCookie(ACCESS_TOKEN_KEY);
}

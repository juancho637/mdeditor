import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { getRefreshToken, saveTokens, clearTokens } from '@/common/helpers/token-storage.utils';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  failedQueue = [];
}

function clearAuthAndRedirect(): void {
  clearTokens();
  if (
    typeof window !== 'undefined' &&
    !window.location.pathname.startsWith('/setup') &&
    !window.location.pathname.startsWith('/sign-in')
  ) {
    window.location.href = '/sign-in';
  }
}

const AUTH_ENDPOINTS = ['/api/auth/sign-in', '/api/auth/refresh', '/api/auth/setup'];

function isAuthEndpoint(url?: string): boolean {
  return AUTH_ENDPOINTS.some((endpoint) => url?.includes(endpoint));
}

export async function handleTokenRefresh(
  originalRequest: InternalAxiosRequestConfig & { _retry?: boolean },
  baseURL: string,
): Promise<InternalAxiosRequestConfig> {
  if (isAuthEndpoint(originalRequest.url)) {
    throw new Error('Auth endpoint 401');
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuthAndRedirect();
    throw new Error('No refresh token');
  }

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({
        resolve: (token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(originalRequest);
        },
        reject,
      });
    });
  }

  originalRequest._retry = true;
  isRefreshing = true;

  try {
    const response = await axios.post(
      `${baseURL}/api/auth/refresh`,
      { refresh_token: refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    );

    const data = response.data?.data ?? response.data;
    const newAccessToken = data.access_token;
    const newRefreshToken = data.refresh_token;

    saveTokens(newAccessToken, newRefreshToken);
    processQueue(null, newAccessToken);

    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    return originalRequest;
  } catch (refreshError) {
    processQueue(refreshError, null);
    clearAuthAndRedirect();
    throw refreshError;
  } finally {
    isRefreshing = false;
  }
}

import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { handleTokenRefresh } from './token-refresh.service';

export function setupResponseInterceptor(instance: AxiosInstance): void {
  instance.interceptors.response.use(
    (response) => {
      if (response.data && 'data' in response.data) {
        response.data = response.data.data;
      }
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      if (
        error.response?.status === 401 &&
        typeof window !== 'undefined' &&
        !originalRequest._retry
      ) {
        const retryConfig = await handleTokenRefresh(
          originalRequest,
          instance.defaults.baseURL ?? '',
        );
        return instance(retryConfig);
      }

      return Promise.reject(error);
    },
  );
}

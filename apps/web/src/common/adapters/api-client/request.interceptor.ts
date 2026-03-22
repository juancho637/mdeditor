import type { AxiosInstance } from 'axios';
import { getAccessToken } from '@/common/helpers/token-storage.utils';

export function setupRequestInterceptor(instance: AxiosInstance): void {
  instance.interceptors.request.use(
    (config) => {
      const token = getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );
}

import axios from 'axios';
import { setupRequestInterceptor } from './request.interceptor';
import { setupResponseInterceptor } from './response.interceptor';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

setupRequestInterceptor(apiClient);
setupResponseInterceptor(apiClient);

export { apiClient };

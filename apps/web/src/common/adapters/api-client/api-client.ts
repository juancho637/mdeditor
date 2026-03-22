import axios from 'axios';
import { setupRequestInterceptor } from './request.interceptor';
import { setupResponseInterceptor } from './response.interceptor';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

setupRequestInterceptor(apiClient);
setupResponseInterceptor(apiClient);

export { apiClient };

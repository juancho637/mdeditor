import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach access token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: unwrap backend response wrapper { data: T }
apiClient.interceptors.response.use(
  (response) => {
    // Backend wraps all responses in { data, path, request_id, duration, method }
    if (response.data && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      // Don't redirect if already on auth pages
      if (
        !window.location.pathname.startsWith('/setup') &&
        !window.location.pathname.startsWith('/sign-in')
      ) {
        window.location.href = '/sign-in';
      }
    }
    return Promise.reject(error);
  }
);

export { apiClient };

import axios from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Handle 401 — try refresh token
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          const res = await axios.post('/api/auth/refresh', {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token } = res.data;
          useAuthStore.getState().setTokens(access_token, refresh_token);
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return client(originalRequest);
        } catch {
          useAuthStore.getState().logout();
        }
      } else {
        useAuthStore.getState().logout();
      }
      return Promise.reject(error);
    }

    // Show toast for other errors (skip 401 which is handled above, and 409 which is handled by register)
    if (status && status !== 401 && status !== 409) {
      const detail = error.response?.data?.detail;
      if (status === 429) {
        toast.error('Too many requests. Please wait.');
      } else if (status >= 500) {
        toast.error('Server error. Please try again later.');
      } else if (detail && typeof detail === 'string') {
        toast.error(detail);
      }
    }

    // Network error (no response)
    if (!error.response && error.code === 'ERR_NETWORK') {
      toast.error('Network error. Check your connection.');
    }

    return Promise.reject(error);
  }
);

export default client;

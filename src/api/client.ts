import axios from 'axios';
import { toast } from 'sonner';

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Auth0 token getter — set by AuthProvider
let getAccessToken: (() => Promise<string>) | null = null;

export function setTokenGetter(getter: () => Promise<string>) {
  getAccessToken = getter;
}

client.interceptors.request.use(async (config) => {
  if (getAccessToken) {
    try {
      const token = await getAccessToken();
      config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // Not authenticated — request will go without token
    }
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

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

    if (!error.response && error.code === 'ERR_NETWORK') {
      toast.error('Network error. Check your connection.');
    }

    return Promise.reject(error);
  }
);

export default client;

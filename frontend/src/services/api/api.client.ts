import axios from 'axios';
import { useAuthStore } from '../../features/auth/auth.store';

// Get base URL from env or use default local backend port
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

if (typeof window !== 'undefined') {
  console.log('[PitchPulse] API Base URL:', baseURL);
}

export const apiClient = axios.create({
  baseURL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT tokens into headers
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      try {
        // Source of truth: Active memory state, fallback to native local storage
        let token = useAuthStore.getState()?.token;
        if (!token) {
           token = localStorage.getItem('pitchpulse_token');
        }
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          if (config.url?.includes('/teams')) {
             console.log('[AXIOS OUTBOX] Token Prefix:', token.substring(0, 15) + '...');
          }
        }
      } catch (e) {
        console.error('[AXIOS INTERCEPTOR ERROR]', e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response error handler
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        // HARD OBLITERATE entire local session to cure bounce-loops
        localStorage.removeItem('pitchpulse_token');
        localStorage.removeItem('pitchpulse-auth-storage');
        
        // Use hard browser replacement to permanently drop all React virtual states
        window.location.replace('/login?expired=true');
        
        // Never resolve the promise to completely freeze UI component chains
        return new Promise(() => {});
      }
    }
    return Promise.reject(error);
  }
);

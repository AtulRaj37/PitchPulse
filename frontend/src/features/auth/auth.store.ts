import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/services/api/api.client';
import { socketService } from '@/services/socket.service';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'ORGANIZER' | 'PLAYER' | 'USER';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await apiClient.post('/auth/login', { email, password });
          const { user, token } = res.data.data;
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('pitchpulse_token', token);
          }
          
          // Connect Socket with User Token for Private events
          socketService.connect(token);
          
          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
          let errorMessage = 'Login failed';
          const apiError = err.response?.data?.error;
          
          if (apiError) {
            errorMessage = apiError.message || errorMessage;
            if (apiError.code === 'VALIDATION_ERROR' && Array.isArray(apiError.details) && apiError.details.length > 0) {
              errorMessage = apiError.details.map((d: any) => `${d.field}: ${d.message}`).join(', ');
            }
          } else if (err.response?.data?.message) {
            errorMessage = err.response.data.message;
          } else if (err.message) {
            errorMessage = err.message;
          }

          set({ error: errorMessage, isLoading: false });
          throw err;
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await apiClient.post('/auth/register', { name, email, password });
          const { user, token } = res.data.data;
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('pitchpulse_token', token);
          }
          
          socketService.connect(token);

          set({ user, token, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
          let errorMessage = 'Registration failed';
          const apiError = err.response?.data?.error;
          
          if (apiError) {
            errorMessage = apiError.message || errorMessage;
            if (apiError.code === 'VALIDATION_ERROR' && Array.isArray(apiError.details) && apiError.details.length > 0) {
              errorMessage = apiError.details.map((d: any) => `${d.field}: ${d.message}`).join(', ');
            }
          } else if (err.response?.data?.message) {
            errorMessage = err.response.data.message;
          } else if (err.message) {
            errorMessage = err.message;
          }

          set({ error: errorMessage, isLoading: false });
          throw err;
        }
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('pitchpulse_token');
        }
        socketService.disconnect();
        set({ user: null, token: null, isAuthenticated: false });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'pitchpulse-auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);

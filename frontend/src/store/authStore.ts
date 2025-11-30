import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  full_name?: string;
  is_admin?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  selectedCafeId: string | null;
  setAuth: (user: User, token: string) => void;
  setToken: (token: string) => void;
  setSelectedCafe: (cafeId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      selectedCafeId: null,
      setAuth: (user, token) => set({ user, token }),
      setToken: (token) => set({ token }),
      setSelectedCafe: (cafeId) => set({ selectedCafeId: cafeId }),
      logout: () => set({ user: null, token: null, selectedCafeId: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

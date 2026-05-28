"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { User } from "@/types";
import { authApi } from "@/lib/api";

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      isLoading: true,

      setUser: (user) =>
        set({ user, isLoggedIn: !!user, isLoading: false }),

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // ignore logout errors
        }
        set({ user: null, isLoggedIn: false, isLoading: false });
      },

      restoreSession: async () => {
        set({ isLoading: true });
        try {
          const { data } = await authApi.me();
          set({ user: data.user, isLoggedIn: true, isLoading: false });
        } catch {
          set({ user: null, isLoggedIn: false, isLoading: false });
        }
      },
    }),
    {
      name: "hostelhub-auth",
      storage: createJSONStorage(() => sessionStorage),
      // Only persist user, not isLoading
      partialize: (state) => ({ user: state.user, isLoggedIn: state.isLoggedIn }),
    }
  )
);

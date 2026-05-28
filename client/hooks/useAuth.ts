"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * useAuth() – thin wrapper around the Zustand store.
 * Pass requireAuth=true to redirect unauthenticated users to /login.
 */
export function useAuth(requireAuth = false) {
  const { user, isLoggedIn, isLoading, logout, setUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && !isLoading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [requireAuth, isLoading, isLoggedIn, router]);

  return { user, isLoggedIn, isLoading, logout, setUser };
}

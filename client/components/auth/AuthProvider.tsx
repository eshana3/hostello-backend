"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const restoreSession = useAuthStore((s) => s.restoreSession);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    // Restore session from httpOnly cookie on every app load
    restoreSession();

    // Listen for 401 events from axios interceptor
    const handler = () => logout();
    window.addEventListener("auth:expired", handler);
    return () => window.removeEventListener("auth:expired", handler);
  }, [restoreSession, logout]);

  return <>{children}</>;
}

// Hook for convenience
export { useAuthStore };

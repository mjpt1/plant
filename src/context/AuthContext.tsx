"use client";

import { SessionProvider, signOut, useSession } from "next-auth/react";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ApiUser } from "@/types/next-auth";

interface AuthContextValue {
  user: ApiUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
});

function AuthContextBridge({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user
        ? {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            username: session.user.username,
            avatar: session.user.avatar,
            bio: session.user.bio,
            country: session.user.country,
            city: session.user.city,
            role: session.user.role,
          }
        : null,
      loading: status === "loading",
      logout: async () => {
        await signOut({ callbackUrl: "/" });
      },
      refreshUser: async () => {
        await update();
      },
    }),
    [session, status, update]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextBridge>{children}</AuthContextBridge>
    </SessionProvider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

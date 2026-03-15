"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import { User } from "@/lib/types";

type AuthContextValue = {
  ready: boolean;
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
};

const TOKEN_KEY = "lop-token";
const USER_KEY = "lop-user";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY),
  );
  const [user, setUserState] = useState<User | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const savedUser = window.localStorage.getItem(USER_KEY);
    return savedUser ? (JSON.parse(savedUser) as User) : null;
  });
  const [ready, setReady] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return !window.localStorage.getItem(TOKEN_KEY);
  });

  useEffect(() => {
    if (!token) {
      return;
    }

    api
      .me(token)
      .then((profile) => {
        setUserState(profile);
        window.localStorage.setItem(USER_KEY, JSON.stringify(profile));
      })
      .catch(() => {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
        setToken(null);
        setUserState(null);
      })
      .finally(() => setReady(true));
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      token,
      user,
      async login(email: string, password: string) {
        const response = await api.login(email, password);
        setToken(response.access_token);
        setUserState(response.user);
        window.localStorage.setItem(TOKEN_KEY, response.access_token);
        window.localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      },
      logout() {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
        setToken(null);
        setUserState(null);
      },
      setUser(nextUser: User) {
        setUserState(nextUser);
        window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      },
    }),
    [ready, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

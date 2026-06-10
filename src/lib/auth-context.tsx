'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface AuthUser {
  id_customer: number;
  email: string;
  firstname: string;
  lastname: string;
  newsletter: boolean;
  date_add?: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  newsletter?: boolean;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (data: RegisterInput) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthCtx = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) {
    return {
      user: null, loading: false,
      login: async () => ({ success: false }),
      register: async () => ({ success: false }),
      logout: async () => {},
      refreshUser: async () => {},
    };
  }
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const d = await res.json();
        setUser(d.user ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Réhydrate l'utilisateur au montage (cookie HTTP-only lu côté serveur)
  useEffect(() => { refreshUser(); }, [refreshUser]);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const d = await res.json();
      if (res.ok && d.success && d.user) {
        setUser(d.user);
        return { success: true };
      }
      return { success: false, error: d.error || 'invalid' };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  }, []);

  const register = useCallback(async (data: RegisterInput): Promise<AuthResult> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const d = await res.json();
      if (res.ok && d.success && d.user) {
        setUser(d.user);
        return { success: true };
      }
      return { success: false, error: d.error || 'error', ...(res.status === 409 ? { error: 'email_taken' } : {}) };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthCtx.Provider>
  );
}

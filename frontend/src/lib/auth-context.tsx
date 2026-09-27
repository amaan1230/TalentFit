'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { apiFetch } from './api-client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('talentfit_token');
    if (savedToken) {
      setToken(savedToken);
      // Pass token explicitly to avoid race condition with localStorage read timing
      fetch(`${process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_API_URL || 'https://talentfit-ptbk.onrender.com/api'}/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then(async (res) => {
          if (!res.ok) {
            // Token is invalid/expired — clear it
            localStorage.removeItem('talentfit_token');
            setToken(null);
            setUser(null);
            return;
          }
          const userData: User = await res.json();
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('talentfit_token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await apiFetch<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });
    localStorage.setItem('talentfit_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const register = async (name: string, email: string, pass: string) => {
    const res = await apiFetch<{ access_token: string; user: User }>('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password: pass }),
    });
    localStorage.setItem('talentfit_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('talentfit_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

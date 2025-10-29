'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name?: string;
  role: 'ADMIN' | 'USER';
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const response = await authApi.getCurrentUser();
        setUser(response.data);
      }
    } catch (error) {
      // Token might be expired
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    const { user, token } = response.data;

    localStorage.setItem('auth_token', token);
    setUser(user);
  };

  const register = async (email: string, password: string, name?: string) => {
    const response = await authApi.register({ email, password, name });
    const { user, token } = response.data;

    localStorage.setItem('auth_token', token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    authApi.logout().catch(() => {}); // Fire and forget
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

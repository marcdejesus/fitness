"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import authApi, { AuthResponse, SignInData, SignUpData } from '@/lib/api/auth';

interface AuthContextType {
  user: AuthResponse['user'] | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (data: SignInData) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Change this type definition to fix the children issue
type AuthProviderProps = {
  children: React.ReactNode;
};

// Remove React.FC typing and use explicit function with return type
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for saved token on mount (only in browser)
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('authToken');
      if (savedToken) {
        setToken(savedToken);
        fetchUser(savedToken);
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (authToken: string) => {
    try {
      const userData = await authApi.getCurrentUser(authToken);
      setUser(userData);
    } catch (err) {
      console.error('Error fetching user:', err);
      setToken(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (data: SignInData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.signIn(data);
      setUser(response.user);
      setToken(response.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', response.token);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to sign in');
      console.error('Sign in error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (data: SignUpData) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.signUp(data);
      setUser(response.user);
      setToken(response.token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', response.token);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to sign up');
      console.error('Sign up error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
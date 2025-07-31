"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  ID?: string;
  id?: string;
  Name?: string;
  name?: string;
  Email?: string;
  email?: string;
  Credits?: number;
  credits?: number;
  ProfilePictureURL?: string;
  profilePictureURL?: string;
  Skills?: string[];
  skills?: string[];
  // Profile completion fields
  College?: string;
  college?: string;
  Program?: string;
  program?: string;
  YearOfStudy?: string;
  yearOfStudy?: string;
  University?: string;
  university?: string;
  Bio?: string;
  bio?: string;
  Location?: string;
  location?: string;
  // Additional fields
  Verified?: boolean;
  verified?: boolean;
  CreatedAt?: any;
  createdAt?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const fetchUserProfile = async (authToken: string) => {
    // Debounce: don't fetch if we've fetched in the last 5 seconds
    const now = Date.now();
    if (now - lastFetchTime < 5000) {
      console.log("⏱️ Skipping profile fetch - too soon since last request");
      return;
    }
    setLastFetchTime(now);

    try {
      // Try profile service first (has complete user data)
      const PROFILE_API_URL = process.env.NEXT_PUBLIC_PROFILE_API_URL || 'http://localhost:8081';
      let res = await fetch(`${PROFILE_API_URL}/api/profile/get`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      
      if (res.ok) {
        const profile = await res.json();
        console.log("✅ Profile service data:", profile);
        setUser(profile);
        return;
      }
      
      // Fallback to auth service if profile service fails
      console.log("⚠️ Profile service failed, trying auth service...");
      const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8080';
      res = await fetch(`${AUTH_API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      
      if (res.ok) {
        const profile = await res.json();
        console.log("✅ Auth service data:", profile);
        setUser(profile);
      } else {
        // Token might be invalid, clear it
        console.log("❌ Auth service failed, logging out");
        logout();
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      logout();
    }
  };

  const login = (authToken: string) => {
    localStorage.setItem("token", authToken);
    setToken(authToken);
    fetchUserProfile(authToken);
  };

  const logout = () => {
    console.log("🔄 Logging out user...");
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    // Redirect to login page
    console.log("📍 Redirecting to login page...");
    try {
      router.push('/login');
    } catch (error) {
      console.error("❌ Router push failed, using window.location:", error);
      // Fallback: force redirect
      window.location.href = '/login';
    }
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUserProfile(token);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        setToken(storedToken);
        await fetchUserProfile(storedToken);
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
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
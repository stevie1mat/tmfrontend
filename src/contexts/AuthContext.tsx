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

  const fetchUserProfile = async (authToken: string, force = false) => {
    // Debounce: don't fetch if we've fetched in the last 5 seconds (unless forced)
    const now = Date.now();
    if (!force && now - lastFetchTime < 5000) {
      console.log("⏱️ Skipping profile fetch - too soon since last request");
      return;
    }
    setLastFetchTime(now);

    try {
      // Use unified user service
      const USER_API_URL = process.env.NEXT_PUBLIC_USER_API_URL || 'http://localhost:8080';
      console.log("🔍 Fetching profile from:", `${USER_API_URL}/api/profile/get`);
      console.log("🔍 Token:", authToken ? authToken.substring(0, 50) + "..." : "missing");
      
      let res = await fetch(`${USER_API_URL}/api/profile/get`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      
      console.log("📡 Profile response status:", res.status);
      
      if (res.ok) {
        const profile = await res.json();
        console.log("✅ User service data:", profile);
        setUser(profile);
        return;
      }
      
      // Fallback to auth endpoint if profile endpoint fails
      console.log("⚠️ Profile endpoint failed (status:", res.status, "), trying auth endpoint...");
      res = await fetch(`${USER_API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      
      console.log("📡 Auth response status:", res.status);
      
      if (res.ok) {
        const profile = await res.json();
        console.log("✅ Auth endpoint data:", profile);
        setUser(profile);
      } else {
        // Token might be invalid, clear it
        console.log("❌ Auth endpoint failed, logging out");
        logout();
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      logout();
    }
  };

  const login = (authToken: string, userData?: User) => {
    localStorage.setItem("token", authToken);
    setToken(authToken);
    
    // If user data is provided immediately, set it without debounce
    if (userData) {
      console.log("✅ Setting immediate user data from login:", userData);
      setUser(userData);
    }
    
    // Still fetch the full profile in the background (force fetch)
    fetchUserProfile(authToken, true);
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
      console.log("🔍 Initializing auth...");
      const storedToken = localStorage.getItem("token");
      console.log("🔍 Stored token:", storedToken ? "exists" : "missing");
      
      if (storedToken) {
        console.log("✅ Setting token and fetching profile...");
        setToken(storedToken);
        await fetchUserProfile(storedToken);
      } else {
        console.log("⚠️ No stored token found");
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
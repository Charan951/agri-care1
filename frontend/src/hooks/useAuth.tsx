import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export interface UserProfile {
  id: string;
  _id?: string;
  name: string;
  email: string;
  mobile: string;
  role: 'ADMIN' | 'SUPER_USER' | 'AGRI_SPECIALIST' | 'MERCHANT' | 'FARMER';
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  workingRegion?: string;
  specialization?: string;
  businessName?: string;
  gstin?: string;
  landAcres?: number;
  storeProfile?: any;
  availabilityStatus?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperUser: boolean;
  isSpecialist: boolean;
  isMerchant: boolean;
  isFarmer: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  registerFarmer: (formData: any) => Promise<{ success: boolean; message: string }>;
  refreshProfile: () => Promise<void>;
  googleLogin: (idToken: string) => Promise<{ success: boolean; isNewUser?: boolean; googleProfile?: any; message: string }>;
  googleRegister: (regData: { idToken: string; name: string; mobile: string; workingRegion: string; landAcres: number }) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const response = await apiFetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        return { success: true, message: data.message || 'Logged in successfully.' };
      } else {
        return { success: false, message: data.message || 'Failed to log in.' };
      }
    } catch (error) {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error during logout api request:', error);
    } finally {
      setUser(null);
    }
  };

  const registerFarmer = async (formData: any) => {
    try {
      const response = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'FARMER' }),
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        return { success: true, message: data.message || 'Account created successfully.' };
      } else {
        return { success: false, message: data.message || 'Registration failed.' };
      }
    } catch (error) {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const googleLogin = async (idToken: string) => {
    try {
      const response = await apiFetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await response.json();
      if (response.ok) {
        if (data.isNewUser) {
          return { success: true, isNewUser: true, googleProfile: data.googleProfile, message: 'Google authenticated. Onboarding details required.' };
        } else {
          setUser(data.user);
          return { success: true, isNewUser: false, message: data.message || 'Logged in successfully with Google.' };
        }
      } else {
        return { success: false, message: data.message || 'Failed to authenticate with Google.' };
      }
    } catch (error) {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const googleRegister = async (regData: { idToken: string; name: string; mobile: string; workingRegion: string; landAcres: number }) => {
    try {
      const response = await apiFetch('/api/auth/google/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData),
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data.user);
        return { success: true, message: data.message || 'Google registration completed.' };
      } else {
        return { success: false, message: data.message || 'Google registration failed.' };
      }
    } catch (error) {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isSuperUser: user?.role === 'SUPER_USER',
    isSpecialist: user?.role === 'AGRI_SPECIALIST',
    isMerchant: user?.role === 'MERCHANT',
    isFarmer: user?.role === 'FARMER',
    login,
    logout,
    registerFarmer,
    refreshProfile,
    googleLogin,
    googleRegister
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

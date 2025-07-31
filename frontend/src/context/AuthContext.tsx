import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserLogin, UserCreate } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: UserLogin) => Promise<void>;
  register: (userData: UserCreate) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Load user from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Verify token is still valid
          const response = await authAPI.getCurrentUser();
          setUser(response.data);
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: UserLogin) => {
    try {
      setIsLoading(true);
      
      // Get token
      const tokenResponse = await authAPI.login(credentials);
      const { access_token } = tokenResponse.data;
      
      // Store token
      localStorage.setItem('access_token', access_token);
      
      // Get user data
      const userResponse = await authAPI.getCurrentUser();
      const userData = userResponse.data;
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: UserCreate) => {
    try {
      setIsLoading(true);
      
      // Register user
      await authAPI.register(userData);
      
      // Auto-login after registration
      await login({
        email: userData.email,
        password: userData.password,
      });
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      const userData = response.data;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      logout();
    }
  };

  const updateUser = (userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    updateUser,
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

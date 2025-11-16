import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiService from '../lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'company' | 'driver' | 'agent' | 'passenger';
  avatar_url?: string;
  wallet_balance?: number;
  wallet_pin_set?: boolean;
  serial_code?: string;
  company_id?: number;
  phone?: string;
  is_verified?: boolean;
  phone_verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<any>;
  logout: () => void;
  isLoading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          apiService.setAuthToken(token, true);
          
          // Verify token is still valid by fetching current user
          try {
            const response = await apiService.get('/auth/me');
            if (response.success && response.data) {
              setUser(response.data);
              localStorage.setItem('user', JSON.stringify(response.data));
            }
          } catch (error) {
            // Token might be expired, clear session
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            apiService.removeAuthToken();
            setUser(null);
          }
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
          apiService.removeAuthToken();
          setUser(null);
      }
    }
    setIsLoading(false);
    };
    
    checkSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.post('/auth/login', { email, password });
      
      if (response.success && response.data) {
        const { token, user: userData } = response.data;
        
        apiService.setAuthToken(token, true);
      localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      
      return true;
      }
      
      return false;
    } catch (error: any) {
      return false;
    }
  };

  const register = async (userData: any): Promise<any> => {
    try {
      const response = await apiService.post('/auth/register', userData);
      
      if (response.success && response.data) {
        const { token, user: userInfo } = response.data;
        
        if (token) {
          apiService.setAuthToken(token, true);
          localStorage.setItem('token', token);
        }
        if (userInfo) {
          localStorage.setItem('user', JSON.stringify(userInfo));
          setUser(userInfo);
        }
        
        return response;
      }
      
      throw new Error(response.message || 'Registration failed');
    } catch (error: any) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    apiService.removeAuthToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import * as api from '../../services/apiService';

// Mock AsyncStorage for web/Vite environment. In a real RN app, you'd use @react-native-async-storage/async-storage.
const AsyncStorage = {
    _data: {},
    setItem: async (key: string, value: string) => { AsyncStorage._data[key] = value; },
    getItem: async (key: string) => AsyncStorage._data[key] || null,
    removeItem: async (key: string) => { delete AsyncStorage._data[key]; },
};

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'passenger' | 'company' | 'admin' | 'agent' | 'driver';
  avatar_url: string;
  loyalty_points?: number;
  wallet_balance?: number;
  company_id?: number;
  pin?: string; // Note: This is the hash, not the raw PIN
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: any) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadToken = useCallback(async () => {
        const storedToken = await AsyncStorage.getItem('authToken');
        if (storedToken) {
            setToken(storedToken);
            api.setAuthToken(storedToken);
            try {
                const { data: currentUser } = await api.getCurrentUser();
                setUser(currentUser);
            } catch (error) {
                console.error("Failed to fetch user, token might be expired.", error);
                await AsyncStorage.removeItem('authToken');
                setToken(null);
            }
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadToken();
    }, [loadToken]);
    
    const login = async (credentials: any) => {
        const response = await api.login(credentials);
        if (response.success && response.data) {
            const { token: newToken, user: userData } = response.data;
            await AsyncStorage.setItem('authToken', newToken);
            setToken(newToken);
            api.setAuthToken(newToken);
            setUser(userData);
        } else {
            throw new Error(response.message || 'Login failed');
        }
    };

    const register = async (userData: any) => {
        const response = await api.register(userData);
        if (response.success && response.data) {
            const { token: newToken, user: newUser } = response.data;
            await AsyncStorage.setItem('authToken', newToken);
            setToken(newToken);
            api.setAuthToken(newToken);
            setUser(newUser);
        } else {
            throw new Error(response.message || 'Registration failed');
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
        api.setAuthToken(null);
    };

    // FIX: Replaced JSX with React.createElement to resolve parsing errors in a .ts file.
    return React.createElement(
        AuthContext.Provider,
        { value: { user, token, login, register, logout, isLoading, setUser } },
        children
    );
};


export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

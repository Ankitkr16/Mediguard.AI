import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  id: number;
  email: string;
  full_name: string | null;
  created_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, fullName: string) => Promise<boolean>;
  logout: () => void;
  fetchWithAuth: (endpoint: string, options?: RequestInit) => Promise<Response>;
  API_BASE_URL: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Helper function to call API endpoints with token header automatically injected
  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers || {});
    
    // Check if token exists in state or localstorage
    const currentToken = token || localStorage.getItem('token');
    if (currentToken) {
      headers.set('Authorization', `Bearer ${currentToken}`);
    }

    const config: RequestInit = {
      ...options,
      headers
    };

    const targetUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    return fetch(targetUrl, config);
  };

  const loadUserProfile = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const profile = await response.json();
        setUser(profile);
      } else {
        // Token expired or invalid
        logout();
      }
    } catch (error) {
      console.error("Failed to load user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      loadUserProfile(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Login failed");
      }

      const data = await response.json();
      const accessToken = data.access_token;
      
      localStorage.setItem('token', accessToken);
      setToken(accessToken);
      await loadUserProfile(accessToken);
      return true;
    } catch (error: any) {
      setLoading(false);
      console.error(error);
      alert(error.message || "Invalid credentials.");
      return false;
    }
  };

  const signup = async (email: string, password: string, fullName: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, full_name: fullName })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Signup failed");
      }

      // Automatically login on success
      return await login(email, password);
    } catch (error: any) {
      setLoading(false);
      console.error(error);
      alert(error.message || "Failed to create account.");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, fetchWithAuth, API_BASE_URL }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

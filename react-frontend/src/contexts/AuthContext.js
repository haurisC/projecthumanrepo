import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create AuthContext
const AuthContext = createContext();

// Custom hook to use AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// JWT Token Management
class TokenManager {
  static TOKEN_KEY = 'projecthuman_token';
  static USER_KEY = 'projecthuman_user';

  // Store token in localStorage
  static storeToken(token) {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
      return true;
    } catch (error) {
      console.error('Failed to store token:', error);
      return false;
    }
  }

  // Get token from localStorage
  static getToken() {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  // Clear token from localStorage
  static clearToken() {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear token:', error);
      return false;
    }
  }

  // Store user data
  static storeUser(user) {
    try {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      return true;
    } catch (error) {
      console.error('Failed to store user:', error);
      return false;
    }
  }

  // Get user data
  static getUser() {
    try {
      const user = localStorage.getItem(this.USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Failed to get user:', error);
      return null;
    }
  }

  // Decode JWT token to get expiration
  static decodeToken(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  // Check if token is expired
  static isTokenExpired(token) {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  }

  // Check if token is valid
  static isTokenValid(token) {
    return token && !this.isTokenExpired(token);
  }
}

// Configure axios defaults
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include token
apiClient.interceptors.request.use(
  (config) => {
    const token = TokenManager.getToken();
    if (token && TokenManager.isTokenValid(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear the token but don't redirect
      // Let the AuthContext handle the redirect through React Router
      TokenManager.clearToken();
      console.log('Token expired - clearing authentication');
    }
    return Promise.reject(error);
  }
);

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isLoginInProgress, setIsLoginInProgress] = useState(false); // Add login guard

  // Initialize auth state from localStorage
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    if (isInitializing) {
      console.log('[AuthContext] Already initializing, skipping...');
      return;
    }

    // If already authenticated, don't re-initialize
    if (isAuthenticated) {
      console.log('[AuthContext] Already authenticated, skipping initialization...');
      setIsLoading(false);
      return;
    }
    
    console.log('[AuthContext] Initializing auth...');
    setIsInitializing(true);
    setIsLoading(true);
    setError(null);

    try {
      const token = TokenManager.getToken();
      const storedUser = TokenManager.getUser();

      if (token && TokenManager.isTokenValid(token) && storedUser) {
        // Token exists and is valid, verify with backend
        try {
          console.log('[AuthContext] Verifying token with backend...');
          const response = await apiClient.get('/api/auth/me');
          const userData = response.data.user;
          
          setUser(userData);
          setIsAuthenticated(true);
          TokenManager.storeUser(userData); // Update stored user data
          console.log('[AuthContext] Auth initialized successfully');
        } catch (error) {
          console.error('[AuthContext] Failed to verify token with backend:', error);
          clearAuth();
        }
      } else {
        // No valid token, clear any stale data
        console.log('[AuthContext] No valid token found, clearing auth');
        clearAuth();
      }
    } catch (error) {
      console.error('[AuthContext] Auth initialization error:', error);
      clearAuth();
    } finally {
      setIsLoading(false);
      setIsInitializing(false);
    }
  };

  const clearAuth = () => {
    TokenManager.clearToken();
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  };

  // Login function
  const login = async (credentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/api/auth/login', credentials);
      const { token, user: userData, message } = response.data;

      if (token && userData) {
        // Store token and user data
        TokenManager.storeToken(token);
        TokenManager.storeUser(userData);
        
        setUser(userData);
        setIsAuthenticated(true);
      }

      return { success: true, message, user: userData };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/api/auth/register', userData);
      const { token, user: newUser, message } = response.data;

      if (token && newUser) {
        // Store token and user data
        TokenManager.storeToken(token);
        TokenManager.storeUser(newUser);
        
        setUser(newUser);
        setIsAuthenticated(true);
      }

      return { success: true, message, user: newUser };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    
    try {
      // Attempt to notify backend (optional)
      await apiClient.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with logout even if API call fails
    }

    // Clear auth state
    clearAuth();
    setIsLoading(false);
  };

  // Refresh user data
  const refreshUser = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await apiClient.get('/api/auth/me');
      const userData = response.data.user;
      
      setUser(userData);
      TokenManager.storeUser(userData);
      return userData;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      if (error.response?.status === 401) {
        clearAuth();
      }
      throw error;
    }
  };

  // OAuth login function (for handling tokens from OAuth callbacks)
  const loginWithToken = async (token) => {
    if (isLoginInProgress) {
      console.log('[AuthContext] Login already in progress, skipping...');
      return { success: false, error: 'Login already in progress' };
    }

    console.log('[AuthContext] loginWithToken called');
    setIsLoginInProgress(true);
    setIsLoading(true);
    setError(null); // Clear any previous errors

    try {
      if (!token) {
        throw new Error('No token provided');
      }

      // Store the token
      TokenManager.storeToken(token);
      console.log('[AuthContext] Token stored, verifying with backend...');

      // Verify token and get user data
      const response = await apiClient.get('/api/auth/me');
      const userData = response.data.user;

      if (userData) {
        // Store user data and update state
        TokenManager.storeUser(userData);
        setUser(userData);
        setIsAuthenticated(true);
        console.log('[AuthContext] OAuth login successful');
        return { success: true, user: userData };
      } else {
        throw new Error('Failed to get user data');
      }
    } catch (error) {
      console.error('OAuth login failed:', error);
      const errorMessage = error.response?.data?.message || 'Authentication failed';
      setError(errorMessage);
      clearAuth();
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
      setIsLoginInProgress(false);
    }
  };

  // Auto-logout when token expires
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = TokenManager.getToken();
    if (!token || !TokenManager.isTokenValid(token)) {
      clearAuth();
      return;
    }

    const decoded = TokenManager.decodeToken(token);
    if (decoded && decoded.exp) {
      const expirationTime = decoded.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;

      if (timeUntilExpiration > 0) {
        const timeoutId = setTimeout(() => {
          console.log('Token expired, logging out...');
          clearAuth();
        }, timeUntilExpiration);

        return () => clearTimeout(timeoutId);
      } else {
        // Token already expired
        clearAuth();
      }
    }
  }, [isAuthenticated]);

  const value = {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,

    // Actions
    login,
    loginWithToken,
    register,
    logout,
    refreshUser,
    clearError: () => setError(null),

    // Utilities
    apiClient, // Expose configured axios instance
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

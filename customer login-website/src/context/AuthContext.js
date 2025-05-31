// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/apiService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Initialize auth state from localStorage on app load
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      
      try {
        // Check if we have a token in localStorage
        const isLoggedIn = authAPI.initializeAuth();
        
        if (isLoggedIn) {
          // Verify token with backend
          try {
            const response = await authAPI.verifyToken();
            if (response.success && response.user) {
              setCurrentUser(response.user);
            } else {
              // Token invalid or expired
              authAPI.logout();
            }
          } catch (err) {
            console.error('Token verification failed:', err);
            authAPI.logout();
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setError('');
      setLoading(true);
      
      const response = await authAPI.customerLogin({
        email_address: email,
        password: password
      });
      
      // Extract user data from token
      if (response.token) {
        const tokenParts = response.token.split('.');
        const payload = JSON.parse(atob(tokenParts[1]));
        
        setCurrentUser({
          id: payload.id,
          email: payload.email,
          role: payload.role
        });
      }
      
      return response;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError('');
      setLoading(true);
      
      const response = await authAPI.customerSignup(userData);
      
      // If registration automatically logs in, extract user data from token
      if (response.token) {
        const tokenParts = response.token.split('.');
        const payload = JSON.parse(atob(tokenParts[1]));
        
        setCurrentUser({
          id: payload.id,
          email: payload.email,
          role: payload.role
        });
      }
      
      return response;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout();
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    setError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;
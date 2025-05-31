// src/components/ProtectedRoute.jsx

import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

// Only import the authApi service
import authApi from '../services/authApi';

/**
 * Component to protect routes that require admin authentication
 * 
 * @param {Object} props - Component props
 * @param {React.Component} props.children - Child components to render if authenticated
 * @returns {React.Component} - Protected route component
 */
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const verifyAdminAuth = async () => {
      try {
        console.log('ProtectedRoute: Checking authentication...');
        
        // Basic check first (token exists)
        if (!authApi.isAuthenticated()) {
          console.log('ProtectedRoute: No token found');
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        
        console.log('ProtectedRoute: Token found, verifying admin privileges...');
        // Verify admin token with the backend
        const isAdmin = await authApi.isAdminAuthenticated();
        console.log('ProtectedRoute: Admin verification result:', isAdmin);
        
        setIsAuthenticated(isAdmin);
      } catch (error) {
        console.error('ProtectedRoute: Auth verification error:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    verifyAdminAuth();
  }, []);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated and authorized, render the children
  console.log('ProtectedRoute: Authentication successful, rendering protected content');
  return children;
};

export default ProtectedRoute;
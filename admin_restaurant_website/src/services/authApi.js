// src/services/authApi.js
import apiService from './apiService';

/**
 * API service for authentication operations
 */
const authApi = {
  
  /**
   * Register a new admin account
   * @param {Object} adminData - Admin registration data
   * @returns {Promise<Object>} - Registration confirmation with token
   */
  registerAdmin: async (adminData) => {
    try {
      const response = await apiService.post('/auth/admins/signup', adminData);
      // Store the token if registration is successful
      if (response && response.token) {
        apiService.setToken(response.token);
      }
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Login as an admin
   * @param {Object} credentials - Admin login credentials
   * @returns {Promise<Object>} - Login confirmation with token
   */
  loginAdmin: async (credentials) => {
    try {
      const response = await apiService.post('/auth/admins/login', credentials);
      // Store the token if login is successful
      if (response && response.token) {
        apiService.setToken(response.token);
      }
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Logout the current user
   */
  logout: () => {
    apiService.clearToken();
  },
  
  /**
   * Check if a user is authenticated based on token existence
   * @returns {boolean} - Whether the user has a token
   */
  isAuthenticated: () => {
    return !!apiService.token;
  },

  /**
   * Verify that the current token belongs to an admin user
   * @returns {Promise<boolean>} - Whether the token is valid for an admin
   */
  verifyAdminToken: async () => {
    try {
      // Make sure we have a token before trying to verify
      if (!apiService.token) {
        return false;
      }
      
      const response = await apiService.get('/auth/verify/admin');
      console.log('Admin verification response:', response); // Debug log
      return response && response.success === true;
    } catch (error) {
      console.error('Admin token verification failed:', error);
      apiService.clearToken();
      return false;
    }
  },
  
  /**
   * Check if the current user is authenticated as an admin
   * @returns {Promise<boolean>} - Whether the user is authenticated as an admin
   */
  isAdminAuthenticated: async () => {
    // First check if we have a token at all
    if (!apiService.token) {
      return false;
    }
    
    // Then verify if it's an admin token
    return await authApi.verifyAdminToken();
  }
};

export default authApi;
// src/services/apiService.js

/**
 * Base API service that handles authentication and common request logic
 */
class ApiService {
    constructor() {
      this.baseUrl = 'https://api.markoitalianrestaurant.com/api';  // Replace with your actual API URL
      this.token = localStorage.getItem('jwt_token');
    }
  
    // Set JWT token after login
    setToken(token) {
      this.token = token;
      localStorage.setItem('jwt_token', token);
    }
  
    // Clear JWT token on logout
    clearToken() {
      this.token = null;
      localStorage.removeItem('jwt_token');
    }
  
    // Helper to create request headers
    getHeaders() {
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }
      
      return headers;
    }
  
    // Generic request method
    async request(endpoint, method = 'GET', data = null) {
      const url = `${this.baseUrl}${endpoint}`;
      
      const options = {
        method,
        headers: this.getHeaders(),
      };
      
      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }
      
      try {
        const response = await fetch(url, options);
        
        // Handle non-2xx responses
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }
        
        // Check if response is empty
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        }
        
        return null;
      } catch (error) {
        console.error(`API Error (${endpoint}):`, error);
        throw error;
      }
    }
  
    // HTTP method shortcuts
    async get(endpoint) {
      return this.request(endpoint, 'GET');
    }
    
    async post(endpoint, data) {
      return this.request(endpoint, 'POST', data);
    }
    
    async put(endpoint, data) {
      return this.request(endpoint, 'PUT', data);
    }
    
    async delete(endpoint) {
      return this.request(endpoint, 'DELETE');
    }
  }
  
  // Create a singleton instance
  const apiService = new ApiService();
  export default apiService;
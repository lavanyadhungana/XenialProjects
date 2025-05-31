// src/services/customersApi.js
import apiService from './apiService';

/**
 * API service for customer operations
 */
export default {
  /**
   * Add a new customer
   * @param {Object} customerData - Customer data to add
   * @returns {Promise<Object>} - The created customer
   */
  addCustomer: async (customerData) => {
    try {
      return await apiService.post('/customers/add', customerData);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Search for customers with pagination and filtering
   * @param {Object} searchParams - Search parameters including pagination
   * @returns {Promise<Object>} - Search results with pagination
   */
  searchCustomers: async (searchParams) => {
    try {
      return await apiService.post('/customers/search', searchParams);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Update an existing customer
   * @param {Object} customerData - Updated customer data
   * @returns {Promise<Object>} - The updated customer
   */
  updateCustomer: async (customerData) => {
    try {
      return await apiService.put('/customers/update', customerData);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Delete a customer
   * @param {number} id - Customer ID to delete
   * @returns {Promise<Object>} - Confirmation message
   */
  deleteCustomer: async (id) => {
    try {
      return await apiService.delete(`/customers/${id}`);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get the current customer's reservations
   * @returns {Promise<Object>} - Customer's reservations with pagination
   */
  getMyReservations: async () => {
    try {        
      return await apiService.get('/customers/my-reservations');
    } catch (error) {
      throw error;
    }
  }
};
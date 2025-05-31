// src/services/restaurantApi.js
import apiService from './apiService';

/**
 * API service for restaurant operations
 */
export default {
  /**
   * Get restaurant information
   * @returns {Promise<Object>} - Restaurant information
   */
  getRestaurantInfo: async () => {
    try {
      return await apiService.get('/restaurant/info');
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get restaurant operating hours
   * @returns {Promise<Array>} - Restaurant operating hours
   */
  getRestaurantHours: async () => {
    try {
      return await apiService.get('/restaurant/hours');
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Update restaurant operating hours
   * @param {Array} hoursData - Updated operating hours
   * @returns {Promise<Object>} - Confirmation message
   */
  updateRestaurantHours: async (hoursData) => {
    try {
      return await apiService.post('/restaurant/hours', hoursData);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get restaurant seating capacity
   * @returns {Promise<Object>} - Seating capacity information
   */
  getSeatingCapacity: async () => {
    try {
      return await apiService.get('/restaurant/seating');
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Update restaurant seating capacity
   * @param {Object} seatingData - Updated seating capacity
   * @returns {Promise<Object>} - Confirmation message
   */
  updateSeatingCapacity: async (seatingData) => {
    try {
      return await apiService.put('/restaurant/seating', seatingData);
    } catch (error) {
      throw error;
    }
  }
};
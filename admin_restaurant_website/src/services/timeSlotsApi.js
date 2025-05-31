// src/services/timeSlotsApi.js
import apiService from './apiService';

/**
 * API service for time slots and availability
 */
export default {
  /**
   * Get available time slots for a specific date
   * @param {string} date - Date string in format YYYY-MM-DD
   * @returns {Promise<Object>} - Available time slots
   */
  getAvailability: async (date) => {
    try {
      if (!date) {
        throw new Error('Date parameter is required');
      }
      
      const result = await apiService.get(`/timeslots/availability/${date}`);
      console.log(result)
      return result
    } catch (error) {
      throw error;
    }
  }
};
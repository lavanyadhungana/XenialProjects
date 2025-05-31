// src/services/announcementsApi.js
import apiService from './apiService';

/**
 * API service for announcements operations
 */
export default {
  /**
   * Get all announcements
   * @returns {Promise<Array>} - All announcements
   */
  getAllAnnouncements: async () => {
    try {
      return await apiService.get('/announcements');
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Create a new announcement
   * @param {Object} announcementData - Announcement data to create
   * @returns {Promise<Object>} - The created announcement
   */
  createAnnouncement: async (announcementData) => {
    try {
      return await apiService.post('/announcements', announcementData);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Update an existing announcement
   * @param {Object} announcementData - Updated announcement data
   * @returns {Promise<Object>} - The updated announcement
   */
  updateAnnouncement: async (announcementData) => {
    try {
      const { id, ...data } = announcementData;
      return await apiService.put(`/announcements/${id}`, data);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Delete an announcement
   * @param {number} id - Announcement ID to delete
   * @returns {Promise<Object>} - Confirmation message
   */
  deleteAnnouncement: async (id) => {
    try {
      return await apiService.delete(`/announcements/${id}`);
    } catch (error) {
      throw error;
    }
  }
};
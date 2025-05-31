// src/services/menuApi.js
import apiService from './apiService';

/**
 * API service for menu operations
 */
export default {
  /**
   * Get all menu items
   * @returns {Promise<Array>} - All menu items
   */
  getAllMenuItems: async () => {
    try {
      return await apiService.get('/menu');
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Add a new menu item
   * @param {Object} menuItemData - Menu item data to add
   * @returns {Promise<Object>} - The created menu item
   */
  addMenuItem: async (menuItemData) => {
    try {
      return await apiService.post('/menu', menuItemData);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Update an existing menu item
   * @param {Object} menuItemData - Updated menu item data
   * @returns {Promise<Object>} - The updated menu item
   */
  updateMenuItem: async (menuItemData) => {
    try {
      const { id, ...data } = menuItemData;
      return await apiService.put(`/menu/${id}`, data);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Delete a menu item
   * @param {number} id - Menu item ID to delete
   * @returns {Promise<Object>} - Confirmation message
   */
  deleteMenuItem: async (id) => {
    try {
      return await apiService.delete(`/menu/${id}`);
    } catch (error) {
      throw error;
    }
  }
};
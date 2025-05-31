// src/services/reservationsApi.js
import apiService from './apiService';

/**
 * API service for reservation operations
 */
export default {
  /**
   * Create a customer reservation
   * @param {Object} reservationData - Customer reservation data
   * @returns {Promise<Object>} - The created reservation
   */
  createCustomerReservation: async (reservationData) => {
    try {
      return await apiService.post('/reservations/customer', reservationData);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Create a guest reservation
   * @param {Object} reservationData - Guest reservation data
   * @returns {Promise<Object>} - The created reservation
   */
  createGuestReservation: async (reservationData) => {
    try {
      return await apiService.post('/reservations/guest', reservationData);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Update reservation details
   * @param {Object} reservationData - Updated reservation data
   * @returns {Promise<Object>} - The updated reservation
   */
  updateReservation: async (reservationData) => {
    try {
      return await apiService.put('/reservations/updateReservation', reservationData);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Update reservation time slot
   * @param {Object} reservationData - Updated time slot data
   * @returns {Promise<Object>} - The updated reservation
   */
  updateReservationTimeSlot: async (reservationData) => {
    try {
      return await apiService.put('/reservations/updateReservationTimeslot', reservationData);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Cancel a reservation
   * @param {Object} data - Reservation display ID
   * @returns {Promise<Object>} - The cancelled reservation
   */
  cancelReservation: async (data) => {
    try {
      return await apiService.post('/reservations/cancelReservation', data);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Update reservation status
   * @param {Object} data - Reservation display ID and new status
   * @returns {Promise<Object>} - The updated reservation
   */
  updateReservationStatus: async (data) => {
    try {
      return await apiService.put('/reservations/updateReservationStatus', data);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Search reservations by display ID
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Object>} - Search results with pagination
   */
  searchReservationsById: async (searchParams) => {
    try {
      return await apiService.post('/reservations/search/id', searchParams);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Search customer reservations
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Object>} - Search results with pagination
   */
  searchCustomerReservations: async (searchParams) => {
    try {
      return await apiService.post('/reservations/search/customer', searchParams);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Search guest reservations
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Object>} - Search results with pagination
   */
  searchGuestReservations: async (searchParams) => {
    try {
      return await apiService.post('/reservations/search/guest', searchParams);
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Filter reservations
   * @param {Object} filterParams - Filter parameters
   * @returns {Promise<Object>} - Filter results with pagination
   */
  filterReservations: async (filterParams) => {
    try {
      return await apiService.post('/reservations/filter', filterParams);
    } catch (error) {
      throw error;
    }
  }
};
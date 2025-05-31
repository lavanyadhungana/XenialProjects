// src/services/api.js
// Main API export file

import apiService from './apiService';
import authApi from './authApi';
import timeSlotsApi from './timeSlotsApi';
import customersApi from './customersApi';
import menuApi from './menuApi';
import announcementsApi from './announcementsApi';
import restaurantApi from './restaurantApi';
import reservationsApi from './reservationsApi';

// Export API services as a single object
export default {
  // Base service
  service: apiService,
  
  // Auth
  auth: authApi,
  
  // Time slots & availability
  timeSlots: timeSlotsApi,
  
  // Customers
  customers: customersApi,
  
  // Menu
  menu: menuApi,
  
  // Announcements
  announcements: announcementsApi,
  
  // Restaurant info
  restaurant: restaurantApi,
  
  // Reservations
  reservations: reservationsApi
};

// Also export individual services
export {
  apiService,
  authApi,
  timeSlotsApi,
  customersApi,
  menuApi,
  announcementsApi,
  restaurantApi,
  reservationsApi
};
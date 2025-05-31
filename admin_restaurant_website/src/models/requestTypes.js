// src/models/requestTypes.js
/**
 * This file defines the structure for all API request objects
 * to ensure consistency across the application.
 */

/**
 * Validates that required fields are present in a request object
 * @param {Object} requestObject - The object to validate
 * @param {Array<string>} requiredFields - List of required field names
 * @returns {boolean} - True if validation passes
 * @throws {Error} - If validation fails
 */
function validateRequest(requestObject, requiredFields) {
    const missingFields = requiredFields.filter(field => {
      return requestObject[field] === undefined || requestObject[field] === null || requestObject[field] === '';
    });
    
    if (missingFields.length > 0) {
      throw new Error(`Required fields missing: ${missingFields.join(', ')}`);
    }
    
    return true;
  }
  
  /**
   * Format pagination parameters to ensure they're valid
   * @param {Object} params - Pagination parameters
   * @returns {Object} - Formatted pagination parameters
   */
  function formatPaginationParams(params) {
    return {
      page: params.page ? Math.max(1, parseInt(params.page)) : 1,
      limit: params.limit ? Math.min(100, Math.max(1, parseInt(params.limit))) : 10,
      sort_by: params.sort_by || 'id',
      sort_order: ['asc', 'desc'].includes(params.sort_order?.toLowerCase()) 
        ? params.sort_order.toLowerCase() 
        : 'asc'
    };
  }
  
  // ==================== Auth Requests ====================
  
  /**
   * Customer Registration Request
   */
  class CustomerRegistrationRequest {
    constructor(data) {
      this.email_address = data.email_address;
      this.phone_number = data.phone_number;
      this.first_name = data.first_name;
      this.last_name = data.last_name;
      this.password = data.password;
      this.dietary_requirements = data.dietary_requirements || '';
      
      const requiredFields = ['email_address', 'phone_number', 'first_name', 'last_name', 'password'];
      validateRequest(this, requiredFields);
    }
  }
  
  /**
   * Customer Login Request
   */
  class CustomerLoginRequest {
    constructor(data) {
      this.email_address = data.email_address;
      this.password = data.password;
      
      const requiredFields = ['email_address', 'password'];
      validateRequest(this, requiredFields);
    }
  }
  
  /**
   * Admin Registration Request
   */
  class AdminRegistrationRequest {
    constructor(data) {
      this.email_address = data.email_address;
      this.first_name = data.first_name;
      this.last_name = data.last_name;
      this.password = data.password;
      
      const requiredFields = ['email_address', 'first_name', 'last_name', 'password'];
      validateRequest(this, requiredFields);
    }
  }
  
  /**
   * Admin Login Request
   */
  class AdminLoginRequest {
    constructor(data) {
      this.email_address = data.email_address;
      this.password = data.password;
      
      const requiredFields = ['email_address', 'password'];
      validateRequest(this, requiredFields);
    }
  }
  
  // ==================== Customer Requests ====================
  
  /**
   * Customer Add Request
   */
  class CustomerAddRequest {
    constructor(data) {
      this.email_address = data.email_address;
      this.phone_number = data.phone_number;
      this.first_name = data.first_name;
      this.last_name = data.last_name;
      this.password = data.password;
      this.dietary_requirements = data.dietary_requirements || '';
      
      const requiredFields = ['email_address', 'phone_number', 'first_name', 'last_name', 'password'];
      validateRequest(this, requiredFields);
    }
  }
  
  /**
   * Customer Search Request
   */
  class CustomerSearchRequest {
    constructor(data) {
      this.first_name = data.first_name || '';
      this.last_name = data.last_name || '';
      this.email_address = data.email_address || '';
      this.phone_number = data.phone_number || '';
      
      // Pagination parameters
      const paginationParams = formatPaginationParams({
        page: data.page,
        limit: data.limit,
        sort_by: data.sort_by,
        sort_order: data.sort_order
      });
      
      this.page = paginationParams.page;
      this.limit = paginationParams.limit;
      this.sort_by = paginationParams.sort_by;
      this.sort_order = paginationParams.sort_order;
      
      // Ensure at least one search parameter is provided
      const searchFields = ['first_name', 'last_name', 'email_address', 'phone_number'];
      const hasSearchParam = searchFields.some(field => this[field] && this[field].length > 0);
      
      if (!hasSearchParam) {
        throw new Error('At least one search parameter must be provided');
      }
    }
  }
  
  /**
   * Customer Update Request
   */
  class CustomerUpdateRequest {
    constructor(data) {
      this.id = data.id;
      this.email_address = data.email_address;
      this.phone_number = data.phone_number;
      this.first_name = data.first_name;
      this.last_name = data.last_name;
      this.dietary_requirements = data.dietary_requirements || '';
      
      const requiredFields = ['id', 'email_address', 'phone_number', 'first_name', 'last_name'];
      validateRequest(this, requiredFields);
    }
  }
  
  // ==================== Menu Requests ====================
  
  /**
   * Menu Item Add Request
   */
  class MenuItemAddRequest {
    constructor(data) {
      this.category = data.category;
      this.dish_name = data.dish_name;
      this.dish_description = data.dish_description || '';
      this.dish_tags = Array.isArray(data.dish_tags) ? data.dish_tags : [];
      this.price = typeof data.price === 'number' ? data.price : parseFloat(data.price);
      this.active = data.active !== undefined ? Boolean(data.active) : true;
      
      const requiredFields = ['category', 'dish_name', 'price'];
      validateRequest(this, requiredFields);
      
      // Validate price is a positive number
      if (isNaN(this.price) || this.price <= 0) {
        throw new Error('Price must be a positive number');
      }
    }
  }
  
  /**
   * Menu Item Update Request
   */
  class MenuItemUpdateRequest {
    constructor(data) {
      this.id = data.id;
      this.category = data.category;
      this.dish_name = data.dish_name;
      this.dish_description = data.dish_description || '';
      this.dish_tags = Array.isArray(data.dish_tags) ? data.dish_tags : [];
      this.price = typeof data.price === 'number' ? data.price : parseFloat(data.price);
      this.active = data.active !== undefined ? Boolean(data.active) : true;
      
      const requiredFields = ['category', 'dish_name', 'price'];
      validateRequest(this, requiredFields);
      
      // Validate price is a positive number
      if (isNaN(this.price) || this.price <= 0) {
        throw new Error('Price must be a positive number');
      }
    }
  }
  
  // ==================== Announcement Requests ====================
  
  /**
   * Announcement Create Request
   */
  class AnnouncementCreateRequest {
    constructor(data) {
      this.title = data.title;
      this.description = data.description || '';
      this.start_date = data.start_date || null;
      this.end_date = data.end_date || null;
      this.is_active = data.is_active !== undefined ? Boolean(data.is_active) : true;
      
      const requiredFields = ['title'];
      validateRequest(this, requiredFields);
      
      // Validate dates if provided
      if (this.start_date && this.end_date) {
        const startDate = new Date(this.start_date);
        const endDate = new Date(this.end_date);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error('Invalid date format');
        }
        
        if (startDate > endDate) {
          throw new Error('End date must be after start date');
        }
      }
    }
  }
  
  /**
   * Announcement Update Request
   */
  class AnnouncementUpdateRequest {
    constructor(data) {
      this.id = data.id;
      this.title = data.title;
      this.description = data.description || '';
      this.start_date = data.start_date || null;
      this.end_date = data.end_date || null;
      this.is_active = data.is_active !== undefined ? Boolean(data.is_active) : true;
      
      const requiredFields = ['id', 'title'];
      validateRequest(this, requiredFields);
      
      // Validate dates if provided
      if (this.start_date && this.end_date) {
        const startDate = new Date(this.start_date);
        const endDate = new Date(this.end_date);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error('Invalid date format');
        }
        
        if (startDate > endDate) {
          throw new Error('End date must be after start date');
        }
      }
    }
  }
  
  // ==================== Restaurant Requests ====================
  
  /**
   * Restaurant Hours Update Request
   */
  class RestaurantHoursUpdateRequest {
    constructor(data) {
      if (!Array.isArray(data)) {
        throw new Error('Hours data must be an array');
      }
      
      this.hours = data.map(day => {
        // Validate required fields for each day
        const requiredFields = ['day_of_the_week', 'time_open', 'time_closed'];
        validateRequest(day, requiredFields);
        
        // Ensure day_of_the_week is in valid range (0-6)
        if (day.day_of_the_week < 0 || day.day_of_the_week > 6) {
          throw new Error('day_of_the_week must be between 0 and 6');
        }
        
        return {
          day_of_the_week: day.day_of_the_week,
          time_open: day.time_open,
          time_closed: day.time_closed,
          is_closed: day.is_closed !== undefined ? Boolean(day.is_closed) : false
        };
      });
      
      // Validate that all days (0-6) are included
      const daysIncluded = this.hours.map(day => day.day_of_the_week);
      for (let i = 0; i <= 6; i++) {
        if (!daysIncluded.includes(i)) {
          throw new Error(`Missing day ${i} in hours update`);
        }
      }
    }
    
    // Convert to array format expected by API
    toArray() {
      return this.hours;
    }
  }
  
  /**
   * Restaurant Seating Update Request
   */
  class RestaurantSeatingUpdateRequest {
    constructor(data) {
      this.seating_capacity = parseInt(data.seating_capacity);
      this.tables_count = parseInt(data.tables_count);
      
      const requiredFields = ['seating_capacity', 'tables_count'];
      validateRequest(this, requiredFields);
      
      // Validate that values are positive numbers
      if (isNaN(this.seating_capacity) || this.seating_capacity <= 0) {
        throw new Error('seating_capacity must be a positive number');
      }
      
      if (isNaN(this.tables_count) || this.tables_count <= 0) {
        throw new Error('tables_count must be a positive number');
      }
    }
  }
  
  // ==================== Reservation Requests ====================
  
  /**
   * Customer Reservation Create Request
   */
  class CustomerReservationCreateRequest {
    constructor(data) {
      this.customer_id = data.customer_id;
      this.number_of_guests = parseInt(data.number_of_guests);
      this.number_of_tables = parseInt(data.number_of_tables);
      this.comments_for_admin = data.comments_for_admin || '';
      this.reservation_date = data.reservation_date;
      this.slot_start = data.slot_start;
      this.slot_end = data.slot_end;
      
      const requiredFields = ['customer_id', 'number_of_guests', 'reservation_date', 'slot_start', 'slot_end'];
      validateRequest(this, requiredFields);
      
      // Validate numeric fields
      if (isNaN(this.number_of_guests) || this.number_of_guests <= 0) {
        throw new Error('number_of_guests must be a positive number');
      }
      
      if (isNaN(this.number_of_tables) || this.number_of_tables <= 0) {
        this.number_of_tables = Math.ceil(this.number_of_guests / 2); // Default calculation
      }
      
      // Validate dates
      const reservationDate = new Date(this.reservation_date);
      if (isNaN(reservationDate.getTime())) {
        throw new Error('Invalid reservation_date format');
      }
    }
  }
  
  /**
   * Guest Reservation Create Request
   */
  class GuestReservationCreateRequest {
    constructor(data) {
      this.guest_first_name = data.guest_first_name;
      this.guest_last_name = data.guest_last_name;
      this.guest_email = data.guest_email;
      this.guest_phone = data.guest_phone;
      this.number_of_guests = parseInt(data.number_of_guests);
      this.number_of_tables = parseInt(data.number_of_tables);
      this.comments_for_admin = data.comments_for_admin || '';
      this.reservation_date = data.reservation_date;
      this.slot_start = data.slot_start;
      this.slot_end = data.slot_end;
      
      const requiredFields = [
        'guest_first_name', 'guest_last_name', 'guest_email', 'guest_phone',
        'number_of_guests', 'reservation_date', 'slot_start', 'slot_end'
      ];
      validateRequest(this, requiredFields);
      
      // Validate numeric fields
      if (isNaN(this.number_of_guests) || this.number_of_guests <= 0) {
        throw new Error('number_of_guests must be a positive number');
      }
      
      if (isNaN(this.number_of_tables) || this.number_of_tables <= 0) {
        this.number_of_tables = Math.ceil(this.number_of_guests / 2); // Default calculation
      }
      
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.guest_email)) {
        throw new Error('Invalid email format');
      }
      
      // Validate dates
      const reservationDate = new Date(this.reservation_date);
      if (isNaN(reservationDate.getTime())) {
        throw new Error('Invalid reservation_date format');
      }
    }
  }
  
  /**
   * Reservation Update Request
   */
  class ReservationUpdateRequest {
    constructor(data) {
      this.display_id = data.display_id;
      
      // Optional fields depending on type (guest or customer)
      if (data.display_id.startsWith('G-')) {
        // Guest fields
        this.guest_first_name = data.guest_first_name;
        this.guest_last_name = data.guest_last_name;
        this.guest_email = data.guest_email;
        this.guest_phone = data.guest_phone;
      }
      
      // Common fields
      this.number_of_guests = data.number_of_guests ? parseInt(data.number_of_guests) : undefined;
      this.number_of_tables = data.number_of_tables ? parseInt(data.number_of_tables) : undefined;
      this.comments_for_admin = data.comments_for_admin;
      
      const requiredFields = ['display_id'];
      validateRequest(this, requiredFields);
      
      // Validate numeric fields if provided
      if (this.number_of_guests !== undefined && (isNaN(this.number_of_guests) || this.number_of_guests <= 0)) {
        throw new Error('number_of_guests must be a positive number');
      }
      
      if (this.number_of_tables !== undefined && (isNaN(this.number_of_tables) || this.number_of_tables <= 0)) {
        if (this.number_of_guests !== undefined) {
          this.number_of_tables = Math.ceil(this.number_of_guests / 2); // Default calculation
        } else {
          throw new Error('number_of_tables must be a positive number');
        }
      }
      
      // Validate email if provided for guest
      if (this.guest_email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(this.guest_email)) {
          throw new Error('Invalid email format');
        }
      }
    }
  }
  
  /**
   * Reservation Time Slot Update Request
   */
  class ReservationTimeSlotUpdateRequest {
    constructor(data) {
      this.display_id = data.display_id;
      this.reservation_date = data.reservation_date;
      this.slot_start = data.slot_start;
      this.slot_end = data.slot_end;
      this.number_of_tables = parseInt(data.number_of_tables);
      
      const requiredFields = ['display_id', 'reservation_date', 'slot_start', 'slot_end', 'number_of_tables'];
      validateRequest(this, requiredFields);
      
      // Validate numeric fields
      if (isNaN(this.number_of_tables) || this.number_of_tables <= 0) {
        throw new Error('number_of_tables must be a positive number');
      }
      
      // Validate dates
      const reservationDate = new Date(this.reservation_date);
      if (isNaN(reservationDate.getTime())) {
        throw new Error('Invalid reservation_date format');
      }
    }
  }
  
  /**
   * Reservation Cancel Request
   */
  class ReservationCancelRequest {
    constructor(data) {
      this.display_id = data.display_id;
      
      const requiredFields = ['display_id'];
      validateRequest(this, requiredFields);
    }
  }
  
  /**
   * Reservation Status Update Request
   */
  class ReservationStatusUpdateRequest {
    constructor(data) {
      this.display_id = data.display_id;
      this.status = data.status;
      
      const requiredFields = ['display_id', 'status'];
      validateRequest(this, requiredFields);
      
      // Validate status
      const validStatuses = ['upcoming', 'attended', 'no_show', 'cancelled'];
      if (!validStatuses.includes(this.status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }
    }
  }
  
  /**
   * Reservation Search By ID Request
   */
  class ReservationSearchByIdRequest {
    constructor(data) {
      this.display_id = data.display_id;
      
      // Pagination parameters
      const paginationParams = formatPaginationParams({
        page: data.page,
        limit: data.limit
      });
      
      this.page = paginationParams.page;
      this.limit = paginationParams.limit;
      
      const requiredFields = ['display_id'];
      validateRequest(this, requiredFields);
    }
  }
  
  /**
   * Reservation Search Customer Request
   */
  class ReservationSearchCustomerRequest {
    constructor(data) {
      this.first_name = data.first_name || '';
      this.last_name = data.last_name || '';
      this.email = data.email || '';
      this.phone = data.phone || '';
      this.date = data.date || '';
      this.status = data.status || '';
      
      // Pagination and sorting
      const paginationParams = formatPaginationParams({
        page: data.page,
        limit: data.limit,
        sort_by: data.sortField || 'date',
        sort_order: data.sortOrder || 'desc'
      });
      
      this.page = paginationParams.page;
      this.limit = paginationParams.limit;
      this.sortField = paginationParams.sort_by;
      this.sortOrder = paginationParams.sort_order;
      
      // Ensure at least one search parameter is provided
      const searchFields = ['first_name', 'last_name', 'email', 'phone', 'date', 'status'];
      const hasSearchParam = searchFields.some(field => this[field] && this[field].length > 0);
      
      if (!hasSearchParam) {
        throw new Error('At least one search parameter must be provided');
      }
      
      // Validate status if provided
      if (this.status && !['upcoming', 'attended', 'no_show', 'cancelled'].includes(this.status)) {
        throw new Error('Invalid status value');
      }
    }
  }
  
  /**
   * Reservation Search Guest Request
   */
  class ReservationSearchGuestRequest {
    constructor(data) {
      this.first_name = data.first_name || '';
      this.last_name = data.last_name || '';
      this.email = data.email || '';
      this.phone = data.phone || '';
      this.date = data.date || '';
      this.status = data.status || '';
      
      // Pagination and sorting
      const paginationParams = formatPaginationParams({
        page: data.page,
        limit: data.limit,
        sort_by: data.sortField || 'date',
        sort_order: data.sortOrder || 'desc'
      });
      
      this.page = paginationParams.page;
      this.limit = paginationParams.limit;
      this.sortField = paginationParams.sort_by;
      this.sortOrder = paginationParams.sort_order;
      
      // Ensure at least one search parameter is provided
      const searchFields = ['first_name', 'last_name', 'email', 'phone', 'date', 'status'];
      const hasSearchParam = searchFields.some(field => this[field] && this[field].length > 0);
      
      if (!hasSearchParam) {
        throw new Error('At least one search parameter must be provided');
      }
      
      // Validate status if provided
      if (this.status && !['upcoming', 'attended', 'no_show', 'cancelled'].includes(this.status)) {
        throw new Error('Invalid status value');
      }
    }
  }
  
  /**
   * Reservation Filter Request
   */
  class ReservationFilterRequest {
    constructor(data) {
      this.status = data.status || '';
      this.start_date = data.start_date || '';
      this.end_date = data.end_date || '';
      this.type = data.type || ''; // 'customer' or 'guest'
      
      // Pagination and sorting
      const paginationParams = formatPaginationParams({
        page: data.page,
        limit: data.limit,
        sort_by: data.sortField || 'date',
        sort_order: data.sortOrder || 'asc'
      });
      
      this.page = paginationParams.page;
      this.limit = paginationParams.limit;
      this.sortField = paginationParams.sort_by;
      this.sortOrder = paginationParams.sort_order;
      
      // Validate type if provided
      if (this.type && !['customer', 'guest'].includes(this.type)) {
        throw new Error('Type must be either "customer" or "guest"');
      }
      
      // Validate status if provided
      if (this.status && !['upcoming', 'attended', 'no_show', 'cancelled'].includes(this.status)) {
        throw new Error('Invalid status value');
      }
      
      // Validate dates if both provided
      if (this.start_date && this.end_date) {
        const startDate = new Date(this.start_date);
        const endDate = new Date(this.end_date);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error('Invalid date format');
        }
        
        if (startDate > endDate) {
          throw new Error('End date must be after start date');
        }
      }
    }
  }
  
  // Export all request types
  export default {
    // Helpers
    validateRequest,
    formatPaginationParams,
    
    // Auth
    CustomerRegistrationRequest,
    CustomerLoginRequest,
    AdminRegistrationRequest,
    AdminLoginRequest,
    
    // Customer
    CustomerAddRequest,
    CustomerSearchRequest,
    CustomerUpdateRequest,
    
    // Menu
    MenuItemAddRequest,
    MenuItemUpdateRequest,
    
    // Announcements
    AnnouncementCreateRequest,
    AnnouncementUpdateRequest,
    
    // Restaurant
    RestaurantHoursUpdateRequest,
    RestaurantSeatingUpdateRequest,
    
    // Reservations
    CustomerReservationCreateRequest,
    GuestReservationCreateRequest,
    ReservationUpdateRequest,
    ReservationTimeSlotUpdateRequest,
    ReservationCancelRequest,
    ReservationStatusUpdateRequest,
    ReservationSearchByIdRequest,
    ReservationSearchCustomerRequest,
    ReservationSearchGuestRequest,
    ReservationFilterRequest
  };
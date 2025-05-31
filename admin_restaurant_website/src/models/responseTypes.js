// src/models/responseTypes.js
/**
 * This file defines the structure for all API response objects
 * to ensure consistency across the application.
 */

/**
 * Base response class with common properties
 */
class BaseResponse {
    constructor(success, message = '') {
      this.success = success;
      this.message = message;
    }
  }
  
  /**
   * Error response with error details
   */
  class ErrorResponse extends BaseResponse {
    constructor(message, errorCode = 500, details = null) {
      super(false, message);
      this.error = {
        code: errorCode,
        message: message,
        details: details
      };
    }
  }
  
  /**
   * Success response with optional data
   */
  class SuccessResponse extends BaseResponse {
    constructor(message, data = null) {
      super(true, message);
      if (data !== null) {
        this.data = data;
      }
    }
  }
  
  /**
   * Standard pagination information
   */
  class PaginationInfo {
    constructor(currentPage, totalPages, totalRecords, pageSize) {
      this.current_page = currentPage;
      this.total_pages = totalPages;
      this.total_records = totalRecords;
      this.page_size = pageSize;
    }
  }
  
  // ==================== Auth Responses ====================
  
  /**
   * Authentication Response with JWT token
   */
  class AuthResponse extends SuccessResponse {
    constructor(message, token, user = null) {
      super(message);
      this.token = token;
      if (user) {
        this.user = user;
      }
    }
  }
  
  // ==================== Customer Responses ====================
  
  /**
   * Customer Response
   */
  class CustomerResponse {
    constructor(customer) {
      this.id = customer.id;
      this.email_address = customer.email_address;
      this.phone_number = customer.phone_number;
      this.first_name = customer.first_name;
      this.last_name = customer.last_name;
      this.dietary_requirements = customer.dietary_requirements || '';
      this.created_at = customer.created_at;
      
      // Omit sensitive information
      delete this.password;
    }
  }
  
  /**
   * Customer Add Response
   */
  class CustomerAddResponse extends SuccessResponse {
    constructor(customer) {
      super('Customer added successfully');
      this.customer = new CustomerResponse(customer);
    }
  }
  
  /**
   * Customer Update Response
   */
  class CustomerUpdateResponse extends SuccessResponse {
    constructor(customer) {
      super('Customer updated successfully');
      this.customer = new CustomerResponse(customer);
    }
  }
  
  /**
   * Customer Delete Response
   */
  class CustomerDeleteResponse extends SuccessResponse {
    constructor(id) {
      super('Customer deleted successfully');
      this.id = id;
    }
  }
  
  /**
   * Customer Search Response
   */
  class CustomerSearchResponse {
    constructor(customers, pagination) {
      this.customers = customers.map(customer => new CustomerResponse(customer));
      this.pagination = new PaginationInfo(
        pagination.current_page,
        pagination.total_pages,
        pagination.total_records,
        pagination.page_size
      );
    }
  }
  
  // ==================== Menu Responses ====================
  
  /**
   * Menu Item Response
   */
  class MenuItemResponse {
    constructor(menuItem) {
      this.id = menuItem.id;
      this.category = menuItem.category;
      this.dish_name = menuItem.dish_name;
      this.dish_description = menuItem.dish_description || '';
      this.dish_tags = menuItem.dish_tags || [];
      this.price = menuItem.price;
      this.active = menuItem.active !== undefined ? menuItem.active : true;
    }
  }
  
  /**
   * Menu Item Add Response
   */
  class MenuItemAddResponse extends SuccessResponse {
    constructor(menuItem) {
      super('Menu item added successfully');
      this.data = new MenuItemResponse(menuItem);
    }
  }
  
  /**
   * Menu Item Update Response
   */
  class MenuItemUpdateResponse extends SuccessResponse {
    constructor(menuItem) {
      super('Menu item updated successfully');
      this.data = new MenuItemResponse(menuItem);
    }
  }
  
  /**
   * Menu Item Delete Response
   */
  class MenuItemDeleteResponse extends SuccessResponse {
    constructor(id) {
      super('Menu item deleted successfully');
      this.id = id;
    }
  }
  
  /**
   * Menu Items List Response
   */
  class MenuItemsListResponse {
    constructor(menuItems) {
      return menuItems.map(item => new MenuItemResponse(item));
    }
  }
  
  // ==================== Announcement Responses ====================
  
  /**
   * Announcement Response
   */
  class AnnouncementResponse {
    constructor(announcement) {
      this.id = announcement.id;
      this.title = announcement.title;
      this.description = announcement.description || '';
      this.start_date = announcement.start_date;
      this.end_date = announcement.end_date;
      this.is_active = announcement.is_active !== undefined ? announcement.is_active : true;
      this.created_at = announcement.created_at;
      this.updated_at = announcement.updated_at;
    }
  }
  
  /**
   * Announcement Create Response
   */
  class AnnouncementCreateResponse extends SuccessResponse {
    constructor(announcement) {
      super('Announcement created successfully');
      this.data = new AnnouncementResponse(announcement);
    }
  }
  
  /**
   * Announcement Update Response
   */
  class AnnouncementUpdateResponse extends SuccessResponse {
    constructor(announcement) {
      super('Announcement updated successfully');
      this.data = new AnnouncementResponse(announcement);
    }
  }
  
  /**
   * Announcement Delete Response
   */
  class AnnouncementDeleteResponse extends SuccessResponse {
    constructor(id) {
      super('Announcement deleted successfully');
      this.id = id;
    }
  }
  
  /**
   * Announcements List Response
   */
  class AnnouncementsListResponse {
    constructor(announcements) {
      return announcements.map(item => new AnnouncementResponse(item));
    }
  }
  
  // ==================== Restaurant Responses ====================
  
  /**
   * Restaurant Info Response
   */
  class RestaurantInfoResponse {
    constructor(info) {
      this.id = info.id;
      this.restaurant_email_address = info.restaurant_email_address;
      this.restaurant_phone_number = info.restaurant_phone_number;
      this.restaurant_name = info.restaurant_name;
      this.restaurant_address = info.restaurant_address;
      this.restaurant_description = info.restaurant_description || '';
      this.restaurant_seating_capacity = info.restaurant_seating_capacity;
      this.tables_count = info.tables_count;
      this.logo_url = info.logo_url || '';
      this.website_url = info.website_url || '';
      this.updated_at = info.updated_at;
    }
  }
  
  /**
   * Restaurant Hours Response
   */
  class RestaurantHoursResponse {
    constructor(hours) {
      return hours.map(day => ({
        id: day.id,
        day_of_the_week: day.day_of_the_week,
        time_open: day.time_open,
        time_closed: day.time_closed,
        is_closed: day.is_closed !== undefined ? day.is_closed : false
      }));
    }
  }
  
  /**
   * Restaurant Hours Update Response
   */
  class RestaurantHoursUpdateResponse extends SuccessResponse {
    constructor() {
      super('Restaurant hours updated successfully');
    }
  }
  
  /**
   * Restaurant Seating Response
   */
  class RestaurantSeatingResponse {
    constructor(seating) {
      this.seating_capacity = seating.seating_capacity;
      this.tables_count = seating.tables_count;
    }
  }
  
  /**
   * Restaurant Seating Update Response
   */
  class RestaurantSeatingUpdateResponse extends SuccessResponse {
    constructor(seating) {
      super('Seating capacity updated successfully');
      this.seating_capacity = seating.seating_capacity;
      this.tables_count = seating.tables_count;
    }
  }
  
  // ==================== Time Slots Responses ====================
  
  /**
   * Time Slot Response
   */
  class TimeSlotResponse {
    constructor(slot) {
      this.id = slot.id;
      this.reservation_date = slot.reservation_date;
      this.slot_start = slot.slot_start;
      this.slot_end = slot.slot_end;
      this.max_tables = slot.max_tables;
      this.reserved_tables = slot.reserved_tables;
      this.available_tables = slot.max_tables - slot.reserved_tables;
      this.available_seats = this.available_tables * 2; // Assumption: 2 seats per table
      this.is_available = this.available_tables > 0;
    }
  }
  
  /**
   * Time Slots Availability Response
   */
  class TimeSlotsAvailabilityResponse {
    constructor(date, slots) {
      this.date = date;
      this.time_slots = slots.map(slot => new TimeSlotResponse(slot));
    }
  }
  
  // ==================== Reservation Responses ====================
  
  /**
   * Base Reservation Response
   */
  class BaseReservationResponse {
    constructor(reservation) {
      this.id = reservation.id;
      this.display_id = reservation.display_id;
      this.time_slot_id = reservation.time_slot_id;
      this.number_of_guests = reservation.number_of_guests;
      this.number_of_tables = reservation.number_of_tables;
      this.comments_for_admin = reservation.comments_for_admin || '';
      this.status = reservation.status;
      this.created_at = reservation.created_at;
      this.updated_at = reservation.updated_at;
    }
  }
  
  /**
   * Customer Reservation Response
   */
  class CustomerReservationResponse extends BaseReservationResponse {
    constructor(reservation) {
      super(reservation);
      this.customer_id = reservation.customer_id;
    }
  }
  
  /**
   * Guest Reservation Response
   */
  class GuestReservationResponse extends BaseReservationResponse {
    constructor(reservation) {
      super(reservation);
      this.guest_first_name = reservation.guest_first_name;
      this.guest_last_name = reservation.guest_last_name;
      this.guest_email = reservation.guest_email;
      this.guest_phone = reservation.guest_phone;
    }
  }
  
  /**
   * Customer Reservation Create Response
   */
  class CustomerReservationCreateResponse extends SuccessResponse {
    constructor(reservation) {
      super('Reservation created successfully');
      this.reservation = new CustomerReservationResponse(reservation);
    }
  }
  
  /**
   * Guest Reservation Create Response
   */
  class GuestReservationCreateResponse extends SuccessResponse {
    constructor(reservation) {
      super('Guest reservation created successfully');
      this.reservation = new GuestReservationResponse(reservation);
    }
  }
  
  /**
   * Reservation Update Response
   */
  class ReservationUpdateResponse extends SuccessResponse {
    constructor(reservation) {
      super('Reservation updated successfully');
      
      // Determine the type of reservation by the display_id prefix
      if (reservation.display_id.startsWith('C-')) {
        this.reservation = new CustomerReservationResponse(reservation);
      } else {
        this.reservation = new GuestReservationResponse(reservation);
      }
    }
  }
  
  /**
   * Reservation Time Slot Update Response
   */
  class ReservationTimeSlotUpdateResponse extends SuccessResponse {
    constructor(reservation) {
      super('Reservation time slot updated successfully');
      
      // Determine the type of reservation by the display_id prefix
      if (reservation.display_id.startsWith('C-')) {
        this.reservation = new CustomerReservationResponse(reservation);
      } else {
        this.reservation = new GuestReservationResponse(reservation);
      }
    }
  }
  
  /**
   * Reservation Cancel Response
   */
  class ReservationCancelResponse extends SuccessResponse {
    constructor(reservation) {
      super('Reservation cancelled successfully');
      
      // Determine the type of reservation by the display_id prefix
      if (reservation.display_id.startsWith('C-')) {
        this.reservation = new CustomerReservationResponse(reservation);
      } else {
        this.reservation = new GuestReservationResponse(reservation);
      }
    }
  }
  
  /**
   * Reservation Status Update Response
   */
  class ReservationStatusUpdateResponse extends SuccessResponse {
    constructor(reservation) {
      const statusMessages = {
        'upcoming': 'Reservation marked as upcoming',
        'attended': 'Reservation marked as attended',
        'no_show': 'Reservation marked as no_show',
        'cancelled': 'Reservation marked as cancelled'
      };
      
      super(statusMessages[reservation.status] || 'Reservation status updated');
      
      // Determine the type of reservation by the display_id prefix
      if (reservation.display_id.startsWith('C-')) {
        this.reservation = new CustomerReservationResponse(reservation);
      } else {
        this.reservation = new GuestReservationResponse(reservation);
      }
    }
  }
  
  /**
   * Unified Reservation Response for search/filter results
   */
  class UnifiedReservationResponse {
    constructor(reservation) {
      this.id = reservation.id;
      this.display_id = reservation.display_id;
      this.type = reservation.display_id.startsWith('C-') ? 'customer' : 'guest';
      
      // Common fields
      this.first_name = reservation.first_name || reservation.guest_first_name;
      this.last_name = reservation.last_name || reservation.guest_last_name;
      this.email = reservation.email || reservation.guest_email;
      this.phone = reservation.phone || reservation.guest_phone;
      this.date = reservation.date || reservation.reservation_date;
      this.slot_start = reservation.slot_start;
      this.slot_end = reservation.slot_end;
      this.number_of_guests = reservation.number_of_guests;
      this.number_of_tables = reservation.number_of_tables;
      this.comments_for_admin = reservation.comments_for_admin || '';
      this.status = reservation.status;
      this.created_at = reservation.created_at;
      this.updated_at = reservation.updated_at;
      
      // Additional time slot info if available
      if (reservation.max_tables) {
        this.max_tables = reservation.max_tables;
        this.reserved_tables = reservation.reserved_tables;
        this.available_tables = reservation.available_tables;
      }
      
      // Customer specific
      if (this.type === 'customer' && reservation.customer_id) {
        this.customer_id = reservation.customer_id;
      }
    }
  }
  
  /**
   * Reservation Search Response
   */
  class ReservationSearchResponse {
    constructor(reservations, pagination) {
      this.count = reservations.length;
      this.reservations = reservations.map(res => new UnifiedReservationResponse(res));
      this.pagination = new PaginationInfo(
        pagination.current_page,
        pagination.total_pages,
        pagination.total_records,
        pagination.page_size
      );
    }
  }
  
  /**
   * My Reservations Response (for customer's own reservations)
   */
  class MyReservationsResponse {
    constructor(reservations, pagination) {
      this.reservations = reservations.map(res => ({
        id: res.id,
        display_id: res.display_id,
        customer_id: res.customer_id,
        number_of_guests: res.number_of_guests,
        number_of_tables: res.number_of_tables,
        comments_for_admin: res.comments_for_admin || '',
        status: res.status,
        created_at: res.created_at,
        updated_at: res.updated_at,
        reservation_date: res.reservation_date || res.date,
        slot_start: res.slot_start,
        slot_end: res.slot_end
      }));
      
      this.pagination = new PaginationInfo(
        pagination.current_page,
        pagination.total_pages,
        pagination.total_records,
        pagination.page_size
      );
    }
  }
  
  // Export all response types
  export default {
    // Base responses
    BaseResponse,
    ErrorResponse,
    SuccessResponse,
    PaginationInfo,
    
    // Auth
    AuthResponse,
    
    // Customer
    CustomerResponse,
    CustomerAddResponse,
    CustomerUpdateResponse,
    CustomerDeleteResponse,
    CustomerSearchResponse,
    
    // Menu
    MenuItemResponse,
    MenuItemAddResponse,
    MenuItemUpdateResponse,
    MenuItemDeleteResponse,
    MenuItemsListResponse,
    
    // Announcements
    AnnouncementResponse,
    AnnouncementCreateResponse,
    AnnouncementUpdateResponse,
    AnnouncementDeleteResponse,
    AnnouncementsListResponse,
    
    // Restaurant
    RestaurantInfoResponse,
    RestaurantHoursResponse,
    RestaurantHoursUpdateResponse,
    RestaurantSeatingResponse,
    RestaurantSeatingUpdateResponse,
    
    // Time Slots
    TimeSlotResponse,
    TimeSlotsAvailabilityResponse,
    
    // Reservations
    BaseReservationResponse,
    CustomerReservationResponse,
    GuestReservationResponse,
    CustomerReservationCreateResponse,
    GuestReservationCreateResponse,
    ReservationUpdateResponse,
    ReservationTimeSlotUpdateResponse,
    ReservationCancelResponse,
    ReservationStatusUpdateResponse,
    UnifiedReservationResponse,
    ReservationSearchResponse,
    MyReservationsResponse
  };
# Restaurant Management API

## Overview
This repository contains a RESTful API for restaurant management, including endpoints for managing time slots, customer accounts, reservations, menu items, announcements, and restaurant information.

## Authentication
Most endpoints require authentication using a JWT token which should be included in the request headers:

```
Authorization: Bearer <your_token>
```

You can obtain a token by using the login endpoints for either customers or admins.

## Table of Contents
- [Setup](#setup)
- [API Endpoints](#api-endpoints)
  - [1. Time Slots API](#1-time-slots-api)
  - [2. Customer API](#2-customer-api)
  - [3. Menu API](#3-menu-api)
  - [4. Announcements API](#4-announcements-api)
  - [5. Restaurant API](#5-restaurant-api)
  - [6. Authentication API](#6-authentication-api)
  - [7. Reservation API](#7-reservation-api)
- [Database Schema](#database-schema)
- [Error Handling](#error-handling)
- [Contributing](#contributing)
- [License](#license)

```

## Setup
1. Create a `.env` file in the root directory with the following variables:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
PORT=3000
```

2. Set up the database:
```bash
# Run the database migration script
npm run db:migrate
```

## API Endpoints

### 1. Time Slots API

#### GET /api/timeslots/availability/:date
Get available time slots for a specific date.

**Authentication Required**: Yes (Admin)  
**URL Parameters**:
- `date`: Date string in format YYYY-MM-DD

**Response**:
```json
{
  "date": "2025-05-01",
  "time_slots": [
    {
      "id": 1,
      "reservation_date": "2025-05-01",
      "slot_start": "18:00:00",
      "slot_end": "20:00:00",
      "max_tables": 20,
      "reserved_tables": 5,
      "available_tables": 15,
      "available_seats": 30,
      "is_available": true
    },
    // Additional time slots...
  ]
}
```

**Response Fields**:
- `date`: The requested date
- `time_slots`: Array of available time slots with the following properties:
  - `id`: Unique identifier for the time slot
  - `reservation_date`: Date of the time slot
  - `slot_start`: Start time
  - `slot_end`: End time
  - `max_tables`: Maximum number of tables available
  - `reserved_tables`: Number of tables already reserved
  - `available_tables`: Number of tables still available (max_tables - reserved_tables)
  - `available_seats`: Number of seats still available (available_tables * 2)
  - `is_available`: Boolean indicating if the time slot has available tables

**Error Responses**:
- `400 Bad Request`: If date parameter is missing
- `500 Internal Server Error`: If server encounters an error

### 2. Customer API

#### POST /api/customers/add
Add a new customer account.

**Authentication Required**: Yes (Admin)  
**Request Body**:
```json
{
  "email_address": "customer@example.com",
  "phone_number": "123-456-7890",
  "first_name": "John",
  "last_name": "Doe",
  "password": "securepassword",
  "dietary_requirements": "Vegetarian"
}
```

**Required Fields**: `email_address`, `phone_number`, `first_name`, `last_name`, `password`  
**Optional Fields**: `dietary_requirements`

**Response**:
```json
{
  "message": "Customer added successfully",
  "customer": {
    "id": 1,
    "email_address": "customer@example.com",
    "phone_number": "123-456-7890",
    "first_name": "John",
    "last_name": "Doe",
    "dietary_requirements": "Vegetarian"
  }
}
```

**Error Responses**:
- `400 Bad Request`: If required fields are missing
- `409 Conflict`: If a customer with the provided email already exists
- `500 Internal Server Error`: If server encounters an error

#### POST /api/customers/search
Search for customers with pagination.

**Authentication Required**: Yes (Admin)  
**Request Body**:
```json
{
  "first_name": "Jo",
  "last_name": "Do",
  "email_address": "example",
  "phone_number": "123",
  "page": 1,
  "limit": 10,
  "sort_by": "last_name",
  "sort_order": "asc"
}
```

**Required Fields**: At least one of `first_name`, `last_name`, `email_address`, or `phone_number`  
**Optional Fields**: `page`, `limit`, `sort_by`, `sort_order`

**Response**:
```json
{
  "customers": [
    {
      "id": 1,
      "email_address": "customer@example.com",
      "phone_number": "123-456-7890",
      "first_name": "John",
      "last_name": "Doe",
      "dietary_requirements": "Vegetarian",
      "created_at": "2025-04-20T14:30:00Z"
    },
    // Additional customers...
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_records": 45,
    "page_size": 10
  }
}
```

**Error Responses**:
- `400 Bad Request`: If no search parameters are provided or pagination parameters are invalid
- `500 Internal Server Error`: If server encounters an error

#### PUT /api/customers/update
Update an existing customer's details.

**Authentication Required**: Yes (Admin)  
**Request Body**:
```json
{
  "id": 1,
  "email_address": "updated@example.com",
  "phone_number": "123-456-7890",
  "first_name": "John",
  "last_name": "Doe",
  "dietary_requirements": "Vegan"
}
```

**Required Fields**: `id`, `email_address`, `phone_number`, `first_name`, `last_name`  
**Optional Fields**: `dietary_requirements`

**Response**:
```json
{
  "message": "Customer updated successfully",
  "customer": {
    "id": 1,
    "email_address": "updated@example.com",
    "phone_number": "123-456-7890",
    "first_name": "John",
    "last_name": "Doe",
    "dietary_requirements": "Vegan"
  }
}
```

**Error Responses**:
- `400 Bad Request`: If required fields are missing
- `404 Not Found`: If the customer with the provided ID does not exist
- `409 Conflict`: If the email is already in use by another customer
- `500 Internal Server Error`: If server encounters an error

#### DELETE /api/customers/:id
Delete a customer account.

**Authentication Required**: Yes (Admin)  
**URL Parameters**:
- `id`: Customer ID to delete

**Response**:
```json
{
  "message": "Customer deleted successfully",
  "id": 1
}
```

**Error Responses**:
- `400 Bad Request`: If the customer has existing reservations
- `404 Not Found`: If the customer with the provided ID does not exist
- `500 Internal Server Error`: If server encounters an error

#### GET /api/customers/my-reservations
Get current customer's reservations with pagination and filtering.

**Authentication Required**: Yes (Customer)  
**Query Parameters**:
- `status`: Filter by reservation status (upcoming, attended, no_show, cancelled)
- `start_date`: Filter by date range start
- `end_date`: Filter by date range end
- `page`: Page number (default: 1)
- `limit`: Records per page (default: 10)
- `sort_by`: Field to sort by (default: 'reservation_date')
- `sort_order`: Sort direction, 'asc' or 'desc' (default: 'desc')

**Response**:
```json
{
  "reservations": [
    {
      "id": 1,
      "display_id": "C-1",
      "customer_id": 1,
      "number_of_guests": 4,
      "number_of_tables": 2,
      "comments_for_admin": "Window seat preferred",
      "status": "upcoming",
      "created_at": "2025-04-20T14:30:00Z",
      "updated_at": "2025-04-20T14:30:00Z",
      "reservation_date": "2025-05-01",
      "slot_start": "18:00:00",
      "slot_end": "20:00:00"
    },
    // Additional reservations...
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_records": 25,
    "page_size": 10
  }
}
```

**Error Responses**:
- `400 Bad Request`: If status is invalid or pagination parameters are invalid
- `500 Internal Server Error`: If server encounters an error

### 3. Menu API

#### GET /api/menu
Get all menu items.

**Authentication Required**: No  
**Response**:
```json
[
  {
    "id": 1,
    "category": "Appetizers",
    "dish_name": "Bruschetta",
    "dish_description": "Toasted bread with tomatoes, garlic, and basil",
    "dish_tags": ["vegetarian", "italian"],
    "price": 8.99,
    "active": true
  },
  // Additional menu items...
]
```

**Error Response**:
- `500 Internal Server Error`: If server encounters an error

#### POST /api/menu
Add a new menu item.

**Authentication Required**: Yes (Admin)  
**Request Body**:
```json
{
  "category": "Appetizers",
  "dish_name": "Bruschetta",
  "dish_description": "Toasted bread with tomatoes, garlic, and basil",
  "dish_tags": ["vegetarian", "italian"],
  "price": 8.99,
  "active": true
}
```

**Required Fields**: `category`, `dish_name`, `price`  
**Optional Fields**: `dish_description`, `dish_tags`, `active`

**Response**:
```json
{
  "message": "Menu item added successfully",
  "data": {
    "id": 1,
    "category": "Appetizers",
    "dish_name": "Bruschetta",
    "dish_description": "Toasted bread with tomatoes, garlic, and basil",
    "dish_tags": ["vegetarian", "italian"],
    "price": 8.99,
    "active": true
  }
}
```

**Error Responses**:
- `400 Bad Request`: If required fields are missing
- `409 Conflict`: If a menu item with the same name already exists
- `500 Internal Server Error`: If server encounters an error

#### PUT /api/menu/:id
Update an existing menu item.

**Authentication Required**: Yes (Admin)  
**URL Parameters**:
- `id`: Menu item ID to update

**Request Body**:
```json
{
  "category": "Appetizers",
  "dish_name": "Bruschetta with Mozzarella",
  "dish_description": "Toasted bread with tomatoes, garlic, basil, and fresh mozzarella",
  "dish_tags": ["vegetarian", "italian", "cheese"],
  "price": 9.99,
  "active": true
}
```

**Required Fields**: `category`, `dish_name`, `price`  
**Optional Fields**: `dish_description`, `dish_tags`, `active`

**Response**:
```json
{
  "message": "Menu item updated successfully",
  "data": {
    "id": 1,
    "category": "Appetizers",
    "dish_name": "Bruschetta with Mozzarella",
    "dish_description": "Toasted bread with tomatoes, garlic, basil, and fresh mozzarella",
    "dish_tags": ["vegetarian", "italian", "cheese"],
    "price": 9.99,
    "active": true
  }
}
```

**Error Responses**:
- `400 Bad Request`: If required fields are missing
- `404 Not Found`: If the menu item with the provided ID does not exist
- `409 Conflict`: If another menu item with the same name already exists
- `500 Internal Server Error`: If server encounters an error

#### DELETE /api/menu/:id
Delete a menu item.

**Authentication Required**: Yes (Admin)  
**URL Parameters**:
- `id`: Menu item ID to delete

**Response**:
```json
{
  "message": "Menu item deleted successfully",
  "id": 1
}
```

**Error Responses**:
- `404 Not Found`: If the menu item with the provided ID does not exist
- `500 Internal Server Error`: If server encounters an error

### 4. Announcements API

#### GET /api/announcements
Get all announcements.

**Authentication Required**: Yes (Admin)  
**Response**:
```json
[
  {
    "id": 1,
    "title": "Holiday Hours",
    "description": "We will be open extended hours during the holiday season",
    "start_date": "2025-12-01",
    "end_date": "2025-12-31",
    "is_active": true,
    "created_at": "2025-11-15T10:00:00Z",
    "updated_at": "2025-11-15T10:00:00Z"
  },
  // Additional announcements...
]
```

**Error Response**:
- `500 Internal Server Error`: If server encounters an error

#### POST /api/announcements
Create a new announcement.

**Authentication Required**: Yes (Admin)  
**Request Body**:
```json
{
  "title": "Holiday Hours",
  "description": "We will be open extended hours during the holiday season",
  "start_date": "2025-12-01",
  "end_date": "2025-12-31",
  "is_active": true
}
```

**Required Fields**: `title`  
**Optional Fields**: `description`, `start_date`, `end_date`, `is_active`

**Response**:
```json
{
  "message": "Announcement created successfully",
  "data": {
    "id": 1,
    "title": "Holiday Hours",
    "description": "We will be open extended hours during the holiday season",
    "start_date": "2025-12-01",
    "end_date": "2025-12-31",
    "is_active": true,
    "created_at": "2025-04-27T14:30:00Z",
    "updated_at": "2025-04-27T14:30:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: If the title is missing
- `500 Internal Server Error`: If server encounters an error

#### PUT /api/announcements/:id
Update an existing announcement.

**Authentication Required**: Yes (Admin)  
**URL Parameters**:
- `id`: Announcement ID to update

**Request Body**:
```json
{
  "title": "Updated Holiday Hours",
  "description": "We will be open extended hours during the holiday season",
  "start_date": "2025-12-01",
  "end_date": "2025-12-31",
  "is_active": true
}
```

**Required Fields**: `title`  
**Optional Fields**: `description`, `start_date`, `end_date`, `is_active`

**Response**:
```json
{
  "message": "Announcement updated successfully",
  "data": {
    "id": 1,
    "title": "Updated Holiday Hours",
    "description": "We will be open extended hours during the holiday season",
    "start_date": "2025-12-01",
    "end_date": "2025-12-31",
    "is_active": true,
    "created_at": "2025-04-27T14:30:00Z",
    "updated_at": "2025-04-27T15:00:00Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: If the title is missing
- `404 Not Found`: If the announcement with the provided ID does not exist
- `500 Internal Server Error`: If server encounters an error

#### DELETE /api/announcements/:id
Delete an announcement.

**Authentication Required**: Yes (Admin)  
**URL Parameters**:
- `id`: Announcement ID to delete

**Response**:
```json
{
  "message": "Announcement deleted successfully",
  "id": 1
}
```

**Error Responses**:
- `404 Not Found`: If the announcement with the provided ID does not exist
- `500 Internal Server Error`: If server encounters an error

### 5. Restaurant API

#### GET /api/restaurant/info
Get restaurant information.

**Authentication Required**: Yes (Admin)  
**Response**:
```json
{
  "id": 1,
  "restaurant_email_address": "info@restaurant.com",
  "restaurant_phone_number": "123-456-7890",
  "restaurant_name": "Fine Dining Restaurant",
  "restaurant_address": "123 Main St, City, State, 12345",
  "restaurant_description": "Upscale dining experience with authentic cuisine",
  "restaurant_seating_capacity": 100,
  "tables_count": 25,
  "logo_url": "https://example.com/logo.png",
  "website_url": "https://restaurant.com",
  "updated_at": "2025-04-27T14:30:00Z"
}
```

**Error Responses**:
- `404 Not Found`: If restaurant information is not found
- `500 Internal Server Error`: If server encounters an error

#### GET /api/restaurant/hours
Get restaurant operating hours.

**Authentication Required**: Yes (Admin)  
**Response**:
```json
[
  {
    "id": 1,
    "day_of_the_week": 0,
    "time_open": "11:00:00",
    "time_closed": "22:00:00",
    "is_closed": false
  },
  {
    "id": 2,
    "day_of_the_week": 1,
    "time_open": "11:00:00",
    "time_closed": "22:00:00",
    "is_closed": false
  },
  // Additional days of the week...
]
```

**Note**: `day_of_the_week` is a number from 0-6, where 0 is Sunday, 1 is Monday, etc.

**Error Response**:
- `500 Internal Server Error`: If server encounters an error

#### POST /api/restaurant/hours
Update restaurant operating hours.

**Authentication Required**: Yes (Admin)  
**Request Body**:
```json
[
  {
    "day_of_the_week": 0,
    "time_open": "11:00:00",
    "time_closed": "22:00:00",
    "is_closed": false
  },
  {
    "day_of_the_week": 1,
    "time_open": "11:00:00",
    "time_closed": "22:00:00",
    "is_closed": false
  },
  // Additional days of the week...
]
```

**Required Fields for Each Item**: `day_of_the_week`, `time_open`, `time_closed`  
**Optional Field for Each Item**: `is_closed`

**Response**:
```json
{
  "message": "Restaurant hours updated successfully"
}
```

**Error Responses**:
- `400 Bad Request`: If the request body is not an array or if required fields are missing
- `500 Internal Server Error`: If server encounters an error

#### GET /api/restaurant/seating
Get restaurant seating capacity.

**Authentication Required**: Yes (Admin)  
**Response**:
```json
{
  "seating_capacity": 100,
  "tables_count": 25
}
```

**Error Responses**:
- `404 Not Found`: If restaurant seating information is not found
- `500 Internal Server Error`: If server encounters an error

#### PUT /api/restaurant/seating
Update restaurant seating capacity.

**Authentication Required**: Yes (Admin)  
**Request Body**:
```json
{
  "seating_capacity": 120,
  "tables_count": 30
}
```

**Required Fields**: `seating_capacity`, `tables_count`

**Response**:
```json
{
  "message": "Seating capacity updated successfully",
  "seating_capacity": 120,
  "tables_count": 30
}
```

**Error Responses**:
- `400 Bad Request`: If required fields are missing or invalid
- `404 Not Found`: If restaurant information is not found
- `500 Internal Server Error`: If server encounters an error

### 6. Authentication API

#### POST /api/auth/customers/signup
Register a new customer account.

**Authentication Required**: No  
**Request Body**:
```json
{
  "email_address": "customer@example.com",
  "phone_number": "123-456-7890",
  "first_name": "John",
  "last_name": "Doe",
  "password": "securepassword",
  "dietary_requirements": "Vegetarian"
}
```

**Required Fields**: `email_address`, `phone_number`, `first_name`, `last_name`, `password`  
**Optional Fields**: `dietary_requirements`

**Response**:
```json
{
  "message": "Customer account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:
- `400 Bad Request`: If required fields are missing
- `409 Conflict`: If a customer with the provided email already exists
- `500 Internal Server Error`: If server encounters an error

#### POST /api/auth/customers/login
Customer login.

**Authentication Required**: No  
**Request Body**:
```json
{
  "email_address": "customer@example.com",
  "password": "securepassword"
}
```

**Required Fields**: `email_address`, `password`

**Response**:
```json
{
  "message": "Customer login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:
- `400 Bad Request`: If email or password is missing
- `401 Unauthorized`: If credentials are invalid
- `500 Internal Server Error`: If server encounters an error

#### POST /api/auth/admins/signup
Register a new admin account.

**Authentication Required**: No  
**Request Body**:
```json
{
  "email_address": "admin@example.com",
  "first_name": "Admin",
  "last_name": "User",
  "password": "secureadminpassword"
}
```

**Required Fields**: `email_address`, `first_name`, `last_name`, `password`

**Response**:
```json
{
  "message": "Admin account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:
- `400 Bad Request`: If required fields are missing
- `409 Conflict`: If an admin with the provided email already exists
- `500 Internal Server Error`: If server encounters an error

#### POST /api/auth/admins/login
Admin login.

**Authentication Required**: No  
**Request Body**:
```json
{
  "email_address": "admin@example.com",
  "password": "secureadminpassword"
}
```

**Required Fields**: `email_address`, `password`

**Response**:
```json
{
  "message": "Admin login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:
- `400 Bad Request`: If email or password is missing
- `401 Unauthorized`: If credentials are invalid
- `500 Internal Server Error`: If server encounters an error

### 7. Reservation API

The reservation system handles two types of reservations:
1. **Customer Reservations**: For registered customers with accounts in the system
2. **Guest Reservations**: For walk-in guests without registered accounts

#### Database Schema

```sql
-- Time slots table - stores available reservation time slots
CREATE TABLE time_slots (
    id SERIAL PRIMARY KEY,
    reservation_date DATE NOT NULL,
    slot_start TIME NOT NULL,
    slot_end TIME NOT NULL,
    max_tables INTEGER NOT NULL,
    reserved_tables INTEGER NOT NULL DEFAULT 0
);

-- Customer reservations - for registered customers
CREATE TABLE customer_reservations (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customer_account_details(id),
    time_slot_id INTEGER NOT NULL REFERENCES time_slots(id),
    number_of_guests INTEGER NOT NULL,
    number_of_tables INTEGER NOT NULL,
    display_id VARCHAR(20) UNIQUE, -- Format: C-1
    comments_for_admin TEXT,
    status reservation_status NOT NULL DEFAULT 'upcoming'
);

-- Guest reservations - for non-registered guests
CREATE TABLE guest_reservations (
    id SERIAL PRIMARY KEY,
    guest_first_name VARCHAR(100) NOT NULL,
    guest_last_name VARCHAR(100) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(50) NOT NULL,
    time_slot_id INTEGER NOT NULL REFERENCES time_slots(id),
    number_of_guests INTEGER NOT NULL,
    number_of_tables INTEGER NOT NULL,
    display_id VARCHAR(20) UNIQUE, -- Format: G-1
    comments_for_admin TEXT,
    status reservation_status NOT NULL DEFAULT 'upcoming'
);
```

#### Create Customer Reservation
Creates a reservation for a registered customer.

**Endpoint:** `POST /api/reservations/customer`  
**Authentication:** Required (Admin)

**Request Body (Customer):**
```json
{
  "customer_id": 1,
  "number_of_guests": 4,
  "number_of_tables": 2,
  "comments_for_admin": "Window seat preferred",
  "reservation_date": "2025-05-01",
  "slot_start": "18:00:00",
  "slot_end": "20:00:00"
}
```

**Response (Customer):**
```json
{
  "message": "Reservation created successfully",
  "reservation": {
    "id": 1,
    "customer_id": 1,
    "time_slot_id": 5,
    "number_of_guests": 4,
    "number_of_tables": 2,
    "display_id": "C-1",
    "comments_for_admin": "Window seat preferred",
    "status": "upcoming",
    "created_at": "2025-04-27T15:30:00Z",
    "updated_at": "2025-04-27T15:30:00Z"
  }
}
```

#### Create Guest Reservation
Creates a reservation for a guest without an account.

**Endpoint:** `POST /api/reservations/guest`  
**Authentication:** Required (Admin)

**Request Body (Guest):**
```json
{
  "guest_first_name": "Jane",
  "guest_last_name": "Smith",
  "guest_email": "jane.smith@example.com",
  "guest_phone": "123-456-7890",
  "number_of_guests": 2,
  "number_of_tables": 1,
  "comments_for_admin": "Anniversary dinner",
  "reservation_date": "2025-05-02",
  "slot_start": "19:00:00",
  "slot_end": "21:00:00"
}
```

**Response (Guest):**
```json
{
  "message": "Guest reservation created successfully",
  "reservation": {
    "id": 1,
    "guest_first_name": "Jane",
    "guest_last_name": "Smith",
    "guest_email": "jane.smith@example.com",
    "guest_phone": "123-456-7890",
    "time_slot_id": 8,
    "number_of_guests": 2,
    "number_of_tables": 1,
    "display_id": "G-1",
    "comments_for_admin": "Anniversary dinner",
    "status": "upcoming",
    "created_at": "2025-04-27T15:30:00Z",
    "updated_at": "2025-04-27T15:30:00Z"
  }
}
```

#### Update Reservation Details
Updates the details of an existing reservation. The API determines if it's a customer or guest reservation based on the display_id prefix.

**Endpoint:** `PUT /api/reservations/updateReservation`  
**Authentication:** Required (Admin)

**For Customer Reservations:**

**Request Body (Customer):**
```json
{
  "display_id": "C-1",
  "number_of_guests": 5,
  "number_of_tables": 3,
  "comments_for_admin": "Now need a larger table"
}
```

**Response (Customer):**
```json
{
  "message": "Reservation updated successfully",
  "reservation": {
    "id": 1,
    "display_id": "C-1",
    "customer_id": 1,
    "time_slot_id": 5,
    "number_of_guests": 5,
    "number_of_tables": 3,
    "comments_for_admin": "Now need a larger table",
    "status": "upcoming",
    "created_at": "2025-04-27T15:30:00Z",
    "updated_at": "2025-04-27T16:00:00Z"
  }
}
```

**For Guest Reservations:**

**Request Body (Guest):**
```json
{
  "display_id": "G-1",
  "guest_first_name": "Jane",
  "guest_last_name": "Smith-Johnson",
  "guest_email": "jane.updated@example.com",
  "guest_phone": "987-654-3210",
  "number_of_guests": 3,
  "number_of_tables": 2,
  "comments_for_admin": "Added an extra guest"
}
```

**Response (Guest):**
```json
{
  "message": "Reservation updated successfully",
  "reservation": {
    "id": 1,
    "display_id": "G-1",
    "guest_first_name": "Jane",
    "guest_last_name": "Smith-Johnson",
    "guest_email": "jane.updated@example.com",
    "guest_phone": "987-654-3210",
    "time_slot_id": 8,
    "number_of_guests": 3,
    "number_of_tables": 2,
    "comments_for_admin": "Added an extra guest",
    "status": "upcoming",
    "created_at": "2025-04-27T15:30:00Z",
    "updated_at": "2025-04-27T16:00:00Z"
  }
}
```

#### Update Reservation Time Slot
Changes the time slot of an existing reservation.

**Endpoint:** `PUT /api/reservations/updateReservationTimeslot`  
**Authentication:** Required (Admin)

**For Customer Reservations:**

**Request Body (Customer):**
```json
{
  "display_id": "C-1",
  "reservation_date": "2025-05-03",
  "slot_start": "18:30:00",
  "slot_end": "20:30:00",
  "number_of_tables": 3
}
```

**Response (Customer):**
```json
{
  "message": "Reservation time slot updated successfully",
  "reservation": {
    "id": 1,
    "display_id": "C-1",
    "customer_id": 1,
    "time_slot_id": 12,
    "number_of_guests": 5,
    "number_of_tables": 3,
    "comments_for_admin": "Now need a larger table",
    "status": "upcoming",
    "created_at": "2025-04-27T15:30:00Z",
    "updated_at": "2025-04-27T16:30:00Z"
  }
}
```

**For Guest Reservations:**

**Request Body (Guest):**
```json
{
  "display_id": "G-1",
  "reservation_date": "2025-05-04",
  "slot_start": "19:30:00",
  "slot_end": "21:30:00",
  "number_of_tables": 2
}
```

**Response (Guest):**
```json
{
  "message": "Reservation time slot updated successfully",
  "reservation": {
    "id": 1,
    "display_id": "G-1",
    "guest_first_name": "Jane",
    "guest_last_name": "Smith-Johnson",
    "guest_email": "jane.updated@example.com",
    "guest_phone": "987-654-3210",
    "time_slot_id": 15,
    "number_of_guests": 3,
    "number_of_tables": 2,
    "comments_for_admin": "Added an extra guest",
    "status": "upcoming",
    "created_at": "2025-04-27T15:30:00Z",
    "updated_at": "2025-04-27T16:30:00Z"
  }
}
```

#### Cancel Reservation
Cancels an existing reservation.

**Endpoint:** `POST /api/reservations/cancelReservation`  
**Authentication:** Required (Admin)

**For Customer Reservations:**

**Request Body:**
```json
{
  "display_id": "C-1"
}
```

**Response (Customer):**
```json
{
  "message": "Reservation cancelled successfully",
  "reservation": {
    "id": 1,
    "display_id": "C-1",
    "customer_id": 1,
    "time_slot_id": 12,
    "number_of_guests": 5,
    "number_of_tables": 3,
    "comments_for_admin": "Now need a larger table",
    "status": "cancelled",
    "created_at": "2025-04-27T15:30:00Z",
    "updated_at": "2025-04-27T17:00:00Z"
  }
}
```

**For Guest Reservations:**

**Request Body:**
```json
{
  "display_id": "G-1"
}
```

**Response (Guest):**
```json
{
  "message": "Reservation cancelled successfully",
  "reservation": {
    "id": 1,
    "display_id": "G-1",
    "guest_first_name": "Jane",
    "guest_last_name": "Smith-Johnson",
    "guest_email": "jane.updated@example.com",
    "guest_phone": "987-654-3210",
    "time_slot_id": 15,
    "number_of_guests": 3,
    "number_of_tables": 2,
    "comments_for_admin": "Added an extra guest",
    "status": "cancelled",
    "created_at": "2025-04-27T15:30:00Z",
    "updated_at": "2025-04-27T17:00:00Z"
  }
}
```

#### Update Reservation Status
Updates the status of an existing reservation.

**Endpoint:** `PUT /api/reservations/updateReservationStatus`  
**Authentication:** Required (Admin)

**For Customer Reservations:**

**Request Body (Customer):**
```json
{
  "display_id": "C-2",
  "status": "attended"
}
```

**Response (Customer):**
```json
{
  "message": "Reservation marked as attended",
  "reservation": {
    "id": 2,
    "display_id": "C-2",
    "customer_id": 2,
    "time_slot_id": 7,
    "number_of_guests": 6,
    "number_of_tables": 3,
    "comments_for_admin": "Birthday celebration",
    "status": "attended",
    "created_at": "2025-04-27T15:40:00Z",
    "updated_at": "2025-04-27T17:30:00Z"
  }
}
```

**For Guest Reservations:**

**Request Body (Guest):**
```json
{
  "display_id": "G-2",
  "status": "no_show"
}
```

**Response (Guest):**
```json
{
  "message": "Reservation marked as no_show",
  "reservation": {
    "id": 2,
    "display_id": "G-2",
    "guest_first_name": "Robert",
    "guest_last_name": "Johnson",
    "guest_email": "robert.j@example.com",
    "guest_phone": "555-123-4567",
    "time_slot_id": 9,
    "number_of_guests": 2,
    "number_of_tables": 1,
    "comments_for_admin": "Business dinner",
    "status": "no_show",
    "created_at": "2025-04-27T15:45:00Z",
    "updated_at": "2025-04-27T17:30:00Z"
  }
}
```

#### Search Reservations by Display ID

**Endpoint:** `POST /api/reservations/search/id`  
**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "display_id": "C-1",
  "page": 1,
  "limit": 10
}
```

**Response for Customer Reservation:**
```json
{
  "count": 1,
  "reservations": [
    {
      "id": 1,
      "display_id": "C-1",
      "type": "customer",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "phone": "123-456-7890",
      "date": "2025-05-03",
      "slot_start": "18:30:00",
      "slot_end": "20:30:00",
      "number_of_guests": 5,
      "number_of_tables": 3,
      "comments_for_admin": "Now need a larger table",
      "status": "cancelled",
      "created_at": "2025-04-27T15:30:00Z",
      "updated_at": "2025-04-27T17:00:00Z",
      "max_tables": 25,
      "reserved_tables": 15,
      "available_tables": 10
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_records": 1,
    "page_size": 10
  }
}
```

#### Search Customer Reservations

**Endpoint:** `POST /api/reservations/search/customer`  
**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "123-456-7890",
  "date": "2025-05-03",
  "status": "cancelled",
  "page": 1,
  "limit": 10,
  "sortField": "date",
  "sortOrder": "desc"
}
```

**Response:**
```json
{
  "count": 1,
  "reservations": [
    {
      "id": 1,
      "display_id": "C-1",
      "type": "customer",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "phone": "123-456-7890",
      "date": "2025-05-03",
      "slot_start": "18:30:00",
      "slot_end": "20:30:00",
      "number_of_guests": 5,
      "number_of_tables": 3,
      "comments_for_admin": "Now need a larger table",
      "status": "cancelled",
      "created_at": "2025-04-27T15:30:00Z",
      "updated_at": "2025-04-27T17:00:00Z",
      "max_tables": 25,
      "reserved_tables": 15,
      "available_tables": 10
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_records": 1,
    "page_size": 10
  }
}
```

#### Search Guest Reservations

**Endpoint:** `POST /api/reservations/search/guest`  
**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane",
  "phone": "987",
  "date": "2025-05-04",
  "status": "cancelled",
  "page": 1,
  "limit": 10,
  "sortField": "date",
  "sortOrder": "desc"
}
```

**Response:**
```json
{
  "count": 1,
  "reservations": [
    {
      "id": 1,
      "display_id": "G-1",
      "type": "guest",
      "first_name": "Jane",
      "last_name": "Smith-Johnson",
      "email": "jane.updated@example.com",
      "phone": "987-654-3210",
      "date": "2025-05-04",
      "slot_start": "19:30:00",
      "slot_end": "21:30:00",
      "number_of_guests": 3,
      "number_of_tables": 2,
      "comments_for_admin": "Added an extra guest",
      "status": "cancelled",
      "created_at": "2025-04-27T15:30:00Z",
      "updated_at": "2025-04-27T17:00:00Z",
      "max_tables": 25,
      "reserved_tables": 18,
      "available_tables": 7
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_records": 1,
    "page_size": 10
  }
}
```

#### Filter Reservations

**Endpoint:** `POST /api/reservations/filter`  
**Authentication:** Required (Admin)

**For Customer Reservations:**

**Request Body (Customer):**
```json
{
  "status": "upcoming",
  "start_date": "2025-05-01",
  "end_date": "2025-05-31",
  "type": "customer",
  "page": 1,
  "limit": 10,
  "sortField": "date",
  "sortOrder": "asc"
}
```

**Response (Customer filtering):**
```json
{
  "count": 5,
  "reservations": [
    {
      "id": 3,
      "display_id": "C-3",
      "type": "customer",
      "first_name": "Alice",
      "last_name": "Johnson",
      "email": "alice.johnson@example.com",
      "phone": "123-555-7890",
      "date": "2025-05-01",
      "slot_start": "19:00:00",
      "slot_end": "21:00:00",
      "number_of_guests": 4,
      "number_of_tables": 2,
      "comments_for_admin": "Birthday celebration",
      "status": "upcoming",
      "created_at": "2025-04-27T18:30:00Z",
      "updated_at": "2025-04-27T18:30:00Z",
      "max_tables": 25,
      "reserved_tables": 12,
      "available_tables": 13
    },
    // Additional customer reservations...
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_records": 5,
    "page_size": 10
  }
}
```

**For Guest Reservations:**

**Request Body (Guest):**
```json
{
  "status": "upcoming",
  "start_date": "2025-05-01",
  "end_date": "2025-05-31",
  "type": "guest",
  "page": 1,
  "limit": 10,
  "sortField": "date",
  "sortOrder": "asc"
}
```

**Response (Guest filtering):**
```json
{
  "count": 3,
  "reservations": [
    {
      "id": 3,
      "display_id": "G-3",
      "type": "guest",
      "first_name": "Michael",
      "last_name": "Brown",
      "email": "michael.b@example.com",
      "phone": "555-987-6543",
      "date": "2025-05-05",
      "slot_start": "18:00:00",
      "slot_end": "20:00:00",
      "number_of_guests": 2,
      "number_of_tables": 1,
      "comments_for_admin": "Quiet corner preferred",
      "status": "upcoming",
      "created_at": "2025-04-27T18:45:00Z",
      "updated_at": "2025-04-27T18:45:00Z",
      "max_tables": 25,
      "reserved_tables": 14,
      "available_tables": 11
    },
    // Additional guest reservations...
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_records": 3,
    "page_size": 10
  }
}
```

#### Important Notes on Reservations

1. **Display IDs Format**:
   - Customer reservations have display IDs starting with "C-" (e.g., "C-1")
   - Guest reservations have display IDs starting with "G-" (e.g., "G-1")

2. **Reservation Status Values**:
   - `upcoming`: Default status for new reservations
   - `attended`: Customer has attended the reservation
   - `no_show`: Customer did not show up
   - `cancelled`: Reservation was cancelled

3. **Time Slot Management**:
   - The system maintains a count of reserved tables per time slot
   - When reservations are cancelled or modified, the reserved_tables count is automatically adjusted

## Database Schema
The API uses a PostgreSQL database with the following main tables:

- `admin_account_details`: Admin user information
- `customer_account_details`: Customer information
- `time_slots`: Available reservation time slots
- `customer_reservations`: Reservations made by registered customers
- `guest_reservations`: Reservations made by guests (non-registered customers)
- `restaurant_menu_item`: Menu items offered by the restaurant
- `announcements`: Restaurant announcements
- `restaurant_details`: Restaurant information (name, address, capacity, etc.)
- `restaurant_schedule`: Restaurant operating hours

For a complete schema, refer to the `setup_schema.sql` file.

## Error Handling
The API uses standard HTTP status codes to indicate the success or failure of a request:

- `200 OK`: Request succeeded
- `201 Created`: Resource was successfully created
- `400 Bad Request`: Request was malformed or invalid
- `401 Unauthorized`: Authentication is required or failed
- `404 Not Found`: Resource was not found
- `409 Conflict`: Request conflicts with the current state of the server
- `500 Internal Server Error`: Server encountered an error

Error responses include a JSON object with an `error` field containing a descriptive message:
```json
{
  "error": "Descriptive error message"
}
```

## Contributing
1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## License
MIT
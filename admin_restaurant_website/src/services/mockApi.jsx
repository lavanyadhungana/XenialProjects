// src/services/mockApi.js

// In-memory data simulating a database
// RESERVATIONS DATA
let mockData = [
  {
    id: 'R1001',
    type: 'guest',
    customerId: 'N/A',
    first_name: 'Alice',
    last_name: 'Tray',
    email: 'alice@example.com',
    phone: '123-456-7890',
    date: '2025-04-15',
    time: '10:00 AM',
    guests: 4,
    tables: 2, // Ceil(4/2)
    comments: 'Vegetarian meal needed',
    status: 'confirmed',
  },
  {
    id: 'R1002',
    type: 'customer',
    customerId: 'CUST-001',
    first_name: 'Bob',
    last_name: 'Wang',
    email: 'bob@example.com',
    phone: '987-654-3210',
    date: '2025-04-15',
    time: '12:00 PM',
    guests: 2,
    tables: 1, 
    comments: 'Birthday celebration',
    status: 'confirmed',
  },
];

// Suppose your restaurant has 10 total tables per time slot.
const TOTAL_TABLES_PER_SLOT = 10;

// Common set of time slots, though in a real app you might vary them by day
const TIME_SLOTS = [
  '10:00 AM','10:30 AM','11:00 AM','11:30 AM',
  '12:00 PM','12:30 PM','01:00 PM','01:30 PM',
  '02:00 PM','02:30 PM','03:00 PM','03:30 PM',
  '04:00 PM','04:30 PM','05:00 PM','05:30 PM',
];

// Simulate network latency
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch all reservations.
 */
export async function getAllReservations() {
  await delay(300);
  return [...mockData];
}

/**
 * Generate a new reservation ID (simple example).
 */
function generateId() {
  return 'R' + Math.floor(Math.random() * 100000);
}

/**
 * Create a new reservation if capacity allows.
 */
export async function createReservation(res) {
  await delay(300);

  // Basic capacity check
  const tablesNeeded = Math.ceil(res.guests / 2);
  const canBook = checkCapacity(null, res.date, res.time, tablesNeeded);
  if (!canBook) {
    throw new Error('Not enough tables available for this date/time slot.');
  }

  const newId = generateId();
  const newRes = {
    id: newId,
    tables: tablesNeeded,
    status: 'confirmed',
    ...res,
  };
  mockData.push(newRes);
  return newRes;
}

/**
 * Update an existing reservation (change date/time/guests, etc.).
 */
export async function updateReservation(updated) {
  await delay(300);

  const index = mockData.findIndex((r) => r.id === updated.id);
  if (index === -1) {
    throw new Error(`Reservation ${updated.id} not found`);
  }

  // If date/time changed, capacity check
  const tablesNeeded = Math.ceil(updated.guests / 2);
  const canBook = checkCapacity(updated.id, updated.date, updated.time, tablesNeeded);
  if (!canBook) {
    throw new Error('Not enough tables available for the updated date/time slot.');
  }

  // Merge changes
  mockData[index] = {
    ...mockData[index],
    ...updated,
    tables: tablesNeeded,
  };

  return mockData[index];
}

/**
 * Cancel a reservation.
 */
export async function cancelReservation(resId) {
  await delay(300);

  const index = mockData.findIndex((r) => r.id === resId);
  if (index === -1) {
    throw new Error(`Reservation ${resId} not found`);
  }
  mockData[index].status = 'cancelled';
  return mockData[index];
}

/**
 * Mark a reservation as attended.
 */
export async function markAttended(resId) {
  await delay(300);

  const index = mockData.findIndex((r) => r.id === resId);
  if (index === -1) {
    throw new Error(`Reservation ${resId} not found`);
  }
  mockData[index].status = 'attended';
  return mockData[index];
}

/**
 * Return a list of available time slots for a given date
 * by checking how many tables are already reserved for each slot.
 */
export async function getAvailability(date) {
  await delay(300);

  // For each timeslot, see how many tables are booked
  const availability = [];
  TIME_SLOTS.forEach((slot) => {
    const tablesBooked = mockData.reduce((count, r) => {
      if (r.date === date && r.time === slot && r.status !== 'cancelled') {
        return count + r.tables;
      }
      return count;
    }, 0);

    const tablesRemaining = TOTAL_TABLES_PER_SLOT - tablesBooked;
    if (tablesRemaining > 0) {
      availability.push({
        slot,
        tablesRemaining,
      });
    }
  });

  // Sort by time if needed; in this example, TIME_SLOTS are already sorted
  return availability;
}

/**
 * Helper: check capacity for a specific date/time, ignoring the reservation with
 * the given ID (if updating).
 */
function checkCapacity(existingResId, date, time, neededTables) {
  let tablesBooked = 0;

  mockData.forEach((r) => {
    // Only count if same date/time, not cancelled
    if (r.date === date && r.time === time && r.status !== 'cancelled') {
      // If updating an existing reservation, skip counting that one
      if (existingResId && r.id === existingResId) {
        return;
      }
      tablesBooked += r.tables;
    }
  });

  return tablesBooked + neededTables <= TOTAL_TABLES_PER_SLOT;
}


// src/services/mockApi.js
// Add these functions to your existing mockApi.js file

// Mock database for customers

// CUSTOMERS DATA
let mockCustomers = [
  {
    id: "C1001",
    email_address: "john.doe@example.com",
    phone_number: "555-123-4567",
    first_name: "John",
    last_name: "Doe",
    password: "hashedpassword1",
    dietary_requirements: "Gluten-free"
  },
  {
    id: "C1002",
    email_address: "jane.smith@example.com",
    phone_number: "555-987-6543",
    first_name: "Jane",
    last_name: "Smith",
    password: "hashedpassword2",
    dietary_requirements: "Vegetarian"
  },
  {
    id: "C1003",
    email_address: "michael.johnson@example.com",
    phone_number: "555-456-7890",
    first_name: "Michael",
    last_name: "Johnson",
    password: "hashedpassword3",
    dietary_requirements: ""
  },
  {
    id: "C1004",
    email_address: "emily.williams@example.com",
    phone_number: "555-789-0123",
    first_name: "Emily",
    last_name: "Williams",
    password: "hashedpassword4",
    dietary_requirements: "Allergic to nuts"
  },
  {
    id: "C1005",
    email_address: "robert.brown@example.com",
    phone_number: "555-234-5678",
    first_name: "Robert",
    last_name: "Brown",
    password: "hashedpassword5",
    dietary_requirements: "Dairy-free"
  }
];

/**
 * Get all customers
 * @returns {Promise<Array>} Array of customer objects
 */
export const getAllCustomers = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mockCustomers]);
    }, 300);
  });
};

/**
 * Create a new customer
 * @param {Object} customerData - Customer data
 * @returns {Promise<Object>} Created customer object
 */
export const createCustomer = (customerData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Check if email already exists
      if (mockCustomers.some(c => c.email_address === customerData.email_address)) {
        reject(new Error('A customer with this email address already exists.'));
        return;
      }

      // Generate an ID
      const newId = `C${1000 + mockCustomers.length + 1}`;
      
      const newCustomer = {
        id: newId,
        ...customerData
      };
      
      mockCustomers.push(newCustomer);
      resolve(newCustomer);
    }, 500);
  });
};

/**
 * Update a customer
 * @param {Object} customerData - Updated customer data
 * @returns {Promise<Object>} Updated customer object
 */
export const updateCustomer = (customerData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockCustomers.findIndex(c => c.id === customerData.id);
      if (index === -1) {
        reject(new Error('Customer not found.'));
        return;
      }

      // Check if trying to update to an email that already exists with another customer
      const emailExists = mockCustomers.some(
        c => c.email_address === customerData.email_address && c.id !== customerData.id
      );
      if (emailExists) {
        reject(new Error('Email address already in use by another customer.'));
        return;
      }

      // Update customer
      mockCustomers[index] = {
        ...mockCustomers[index],
        ...customerData,
        // Preserve the password - wouldn't normally be updated this way
        password: mockCustomers[index].password
      };

      resolve(mockCustomers[index]);
    }, 500);
  });
};

/**
 * Delete a customer
 * @param {string} id - Customer ID
 * @returns {Promise<Object>} Deleted customer
 */
export const deleteCustomer = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockCustomers.findIndex(c => c.id === id);
      if (index === -1) {
        reject(new Error('Customer not found.'));
        return;
      }

      const deletedCustomer = mockCustomers[index];
      mockCustomers = mockCustomers.filter(c => c.id !== id);
      
      resolve(deletedCustomer);
    }, 500);
  })};

// Restaurant general info mock data
let restaurantInfo = {
  name: "Fine Dining Restaurant",
  address: "123 Main St, Anytown, USA",
  phone: "555-123-4567",
  email: "contact@finedinigrestaurant.com",
  totalTables: 10,
  tableCapacity: {
    smallTables: 4,  // Capacity of 2 people
    mediumTables: 4, // Capacity of 4 people
    largeTables: 2   // Capacity of 6-8 people
  },
  operatingHours: {
    monday: { open: "11:00", close: "22:00", closed: false },
    tuesday: { open: "11:00", close: "22:00", closed: false },
    wednesday: { open: "11:00", close: "22:00", closed: false },
    thursday: { open: "11:00", close: "22:00", closed: false },
    friday: { open: "11:00", close: "23:00", closed: false },
    saturday: { open: "10:00", close: "23:00", closed: false },
    sunday: { open: "10:00", close: "21:00", closed: false },
  }
};

// Announcements/Special events mock data (matching the announcement schema in your DB)
let announcements = [
  {
    id: 1,
    title: "Wine Tasting Night",
    description: "Sample our finest selection of wines with cheese pairings. Every Friday at 6 PM. Tickets available for $45 per person, limited to 30 guests.",
    start_date: "2025-04-01",
    end_date: "2025-06-30",
    created_at: "2025-03-15T10:00:00",
    updated_at: "2025-03-15T10:00:00"
  },
  {
    id: 2,
    title: "Live Jazz Evening",
    description: "Enjoy dinner with live jazz music from local artists. April 25th at 7 PM. Cover charge $10, limited to 40 guests.",
    start_date: "2025-04-25",
    end_date: "2025-04-25",
    created_at: "2025-03-20T14:30:00",
    updated_at: "2025-03-20T14:30:00"
  },
  {
    id: 3,
    title: "Mother's Day Special Menu",
    description: "Join us for a special brunch menu celebrating mothers. Complimentary glass of champagne for all moms.",
    start_date: "2025-05-11",
    end_date: "2025-05-11",
    created_at: "2025-04-01T09:15:00",
    updated_at: "2025-04-01T09:15:00"
  }
];

// Menu items mock data (matching the restaurant_menu_item schema in your DB)
let menuItems = [
  {
    id: 1,
    category: "Appetizer",
    dish_name: "Classic Caesar Salad",
    dish_description: "Romaine lettuce, parmesan cheese, croutons, and Caesar dressing",
    dish_tags: ["Vegetarian", "Popular"]
  },
  {
    id: 2,
    category: "Main Course",
    dish_name: "Grilled Salmon",
    dish_description: "Fresh Atlantic salmon with lemon butter sauce and seasonal vegetables",
    dish_tags: ["Gluten-Free", "Pescatarian", "Signature"]
  },
  {
    id: 3,
    category: "Main Course",
    dish_name: "Filet Mignon",
    dish_description: "8oz tender beef filet with truffle mashed potatoes and asparagus",
    dish_tags: ["Premium", "Signature"]
  },
  {
    id: 4,
    category: "Dessert",
    dish_name: "Chocolate Lava Cake",
    dish_description: "Warm chocolate cake with a molten center, served with vanilla ice cream",
    dish_tags: ["Vegetarian", "Popular"]
  },
  {
    id: 5,
    category: "Beverage",
    dish_name: "House Red Wine",
    dish_description: "Glass of our premium house cabernet sauvignon",
    dish_tags: ["Alcoholic", "Vegan"]
  }
];

// Available menu categories
const menuCategories = ["Appetizer", "Main Course", "Dessert", "Beverage", "Side"];

// Available menu tags
const availableTags = ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Nut-Free", 
                       "Pescatarian", "Spicy", "Organic", "Signature", "Popular", "Seasonal", 
                       "Alcoholic", "Non-Alcoholic", "Premium"];

/**
 * Get restaurant information
 * @returns {Promise<Object>} Restaurant information
 */
export const getRestaurantInfo = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({...restaurantInfo});
    }, 300);
  });
};

/**
 * Update restaurant information
 * @param {Object} info - Updated restaurant information
 * @returns {Promise<Object>} Updated restaurant information
 */
export const updateRestaurantInfo = (info) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      restaurantInfo = {...info};
      resolve({...restaurantInfo});
    }, 500);
  });
};

/**
 * Get all announcements/special events
 * @returns {Promise<Array>} Array of announcements
 */
export const getAllAnnouncements = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...announcements]);
    }, 300);
  });
};

/**
 * Create a new announcement/special event
 * @param {Object} announcement - Announcement data
 * @returns {Promise<Object>} Created announcement
 */
export const createAnnouncement = (announcement) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newId = announcements.length > 0 ? Math.max(...announcements.map(a => a.id)) + 1 : 1;
      const now = new Date().toISOString();
      
      const newAnnouncement = {
        id: newId,
        ...announcement,
        created_at: now,
        updated_at: now
      };
      
      announcements.push(newAnnouncement);
      resolve({...newAnnouncement});
    }, 500);
  });
};

/**
 * Update an announcement/special event
 * @param {Object} announcement - Updated announcement data
 * @returns {Promise<Object>} Updated announcement
 */
export const updateAnnouncement = (announcement) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = announcements.findIndex(a => a.id === announcement.id);
      if (index === -1) {
        reject(new Error('Announcement not found'));
        return;
      }
      
      announcements[index] = {
        ...announcements[index],
        ...announcement,
        updated_at: new Date().toISOString()
      };
      
      resolve({...announcements[index]});
    }, 500);
  });
};

/**
 * Delete an announcement/special event
 * @param {number} id - Announcement ID
 * @returns {Promise<Object>} Deleted announcement
 */
export const deleteAnnouncement = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = announcements.findIndex(a => a.id === id);
      if (index === -1) {
        reject(new Error('Announcement not found'));
        return;
      }
      
      const deleted = announcements[index];
      announcements = announcements.filter(a => a.id !== id);
      
      resolve(deleted);
    }, 500);
  });
};

/**
 * Get all menu items
 * @returns {Promise<Array>} Array of menu items
 */
export const getAllMenuItems = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...menuItems]);
    }, 300);
  });
};

/**
 * Get available menu categories
 * @returns {Promise<Array>} Array of menu categories
 */
export const getMenuCategories = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...menuCategories]);
    }, 200);
  });
};

/**
 * Get available menu tags
 * @returns {Promise<Array>} Array of menu tags
 */
export const getMenuTags = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...availableTags]);
    }, 200);
  });
};

/**
 * Create a new menu item
 * @param {Object} menuItem - Menu item data
 * @returns {Promise<Object>} Created menu item
 */
export const createMenuItem = (menuItem) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Check if dish name already exists
      if (menuItems.some(item => item.dish_name.toLowerCase() === menuItem.dish_name.toLowerCase())) {
        reject(new Error('A menu item with this name already exists'));
        return;
      }
      
      const newId = menuItems.length > 0 ? Math.max(...menuItems.map(item => item.id)) + 1 : 1;
      
      const newMenuItem = {
        id: newId,
        ...menuItem
      };
      
      menuItems.push(newMenuItem);
      resolve({...newMenuItem});
    }, 500);
  });
};

/**
 * Update a menu item
 * @param {Object} menuItem - Updated menu item data
 * @returns {Promise<Object>} Updated menu item
 */
export const updateMenuItem = (menuItem) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = menuItems.findIndex(item => item.id === menuItem.id);
      if (index === -1) {
        reject(new Error('Menu item not found'));
        return;
      }
      
      // Check if dish name already exists on another item
      const nameExists = menuItems.some(
        item => item.dish_name.toLowerCase() === menuItem.dish_name.toLowerCase() && item.id !== menuItem.id
      );
      if (nameExists) {
        reject(new Error('A menu item with this name already exists'));
        return;
      }
      
      menuItems[index] = {
        ...menuItems[index],
        ...menuItem
      };
      
      resolve({...menuItems[index]});
    }, 500);
  });
};

/**
 * Delete a menu item
 * @param {number} id - Menu item ID
 * @returns {Promise<Object>} Deleted menu item
 */
export const deleteMenuItem = (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = menuItems.findIndex(item => item.id === id);
      if (index === -1) {
        reject(new Error('Menu item not found'));
        return;
      }
      
      const deleted = menuItems[index];
      menuItems = menuItems.filter(item => item.id !== id);
      
      resolve(deleted);
    }, 500);
  });
};
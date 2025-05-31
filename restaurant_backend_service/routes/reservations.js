/**
 * File: src/routes/reservations.js
 * Reservation Management API Endpoints
 */

import { Router } from 'express';
const router = Router();
import pool from '../config/db.js';

import auth from '../middleware/auth.js';
const { authenticateToken, requireAdmin, extractTokenDetails } = auth;

import queryUtils from '../utils/queryUtils.js';

import { addMinutes, parse, format } from 'date-fns';

import {  sendCustomerReservationEmail, sendAdminReservationEmail } from '../utils/emailUtils.js'

/**
 * Add Reservation Endpoints
 */

// Helper functions
const getRestaurantCapacity = async (client) => {
    const restaurantQuery = 'SELECT tables_count FROM restaurant_details WHERE id = 1';
    const restaurantResult = await client.query(restaurantQuery);
    
    if (restaurantResult.rows.length === 0) {
        throw new Error('Restaurant details not found');
    }
    return restaurantResult.rows[0].tables_count; // Now using the direct tables_count field
};
  
const getOrCreateTimeSlot = async (client, reservation_date, slot_start, number_of_tables) => {
    
    // Parse the time string

    console.log(reservation_date)
    console.log(slot_start)
    const startTime = parse(`${reservation_date} ${slot_start}`, 'yyyy-MM-dd h:mm a', new Date());
    // Add 90 minutes
    const endTime = addMinutes(startTime, 90);
    
    console.log(endTime)
    // Format back to the required format
    const slot_end = format(endTime, 'h:mm a');
    // Check if a time slot already exists for this date and time
    const existingSlotQuery = `
        SELECT id, reserved_tables, max_tables FROM time_slots 
        WHERE reservation_date = $1 AND slot_start = $2
    `;
    
    const existingSlotResult = await client.query(existingSlotQuery, [reservation_date, slot_start]);
    let timeSlotId;
    const maxTables = await getRestaurantCapacity(client);
    
    if (existingSlotResult.rows.length > 0) {
        // Use existing time slot
        timeSlotId = existingSlotResult.rows[0].id;
        const currentReservedTables = existingSlotResult.rows[0].reserved_tables;
        const slotMaxTables = existingSlotResult.rows[0].max_tables;
        
        // Check if adding these tables would exceed capacity
        if (currentReservedTables + number_of_tables > slotMaxTables) {
            throw {
                status: 400,
                message: 'Reservation exceeds time slot capacity',
                details: {
                    current_reserved: currentReservedTables,
                    requested_tables: number_of_tables,
                    max_tables: slotMaxTables,
                    available_tables: slotMaxTables - currentReservedTables
                }
            };
        }
    } else {
        // Create a new time slot with max_tables capacity
        const createSlotQuery = `
            INSERT INTO time_slots (reservation_date, slot_start, slot_end, max_tables, reserved_tables)
            VALUES ($1, $2, $3, $4, 0)
            RETURNING id
        `;    
        const createSlotResult = await client.query(createSlotQuery, [reservation_date, slot_start, slot_end, maxTables]);
        timeSlotId = createSlotResult.rows[0].id;
        
        // Check if adding these tables would exceed capacity
        if (number_of_tables > maxTables) {
            throw {
                status: 400,
                message: 'Reservation exceeds restaurant capacity',
                details: {
                    requested_tables: number_of_tables,
                    max_tables: maxTables
                }
            };
        }
    }
    
    return timeSlotId;
};
  
  
// POST add new customer reservation
router.post('/customer', authenticateToken, async (req, res) => {
  let { customer_id, number_of_guests, number_of_tables, comments_for_admin, reservation_date, slot_start } = req.body;

  if (req.user.role === 'customer') {
    customer_id = req.user.id
  } 
  
  if (!customer_id || !number_of_guests || !number_of_tables || !reservation_date || !slot_start) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Basic validation
  if (number_of_guests <= 0 || number_of_tables <= 0) {
    return res.status(400).json({ error: 'Number of guests and tables must be positive' });
  }
  
  let client;
  try {
    client = await pool.connect();
    
    // Check if customer exists
    const customerQuery = 'SELECT id, first_name, last_name, email_address, phone_number FROM customer_account_details WHERE id = $1';
    const customerResult = await client.query(customerQuery, [customer_id]);
    
    if (customerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    const customerDetails = {
      first_name: customerResult.rows[0].first_name,
      last_name: customerResult.rows[0].last_name,
      email: customerResult.rows[0].email_address,
      phone: customerResult.rows[0].phone_number
    };
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Get or create time slot with capacity check
    const timeSlotId = await getOrCreateTimeSlot(client, reservation_date, slot_start, number_of_tables);
    
    // Get time slot details for the email
    const slotQuery = 'SELECT * FROM time_slots WHERE id = $1';
    const slotResult = await client.query(slotQuery, [timeSlotId]);
    const slotDetails = slotResult.rows[0];
    
    // Add reservation - the trigger will automatically update the time_slots.reserved_tables
    const insertQuery = `
      INSERT INTO customer_reservations (
        customer_id, 
        time_slot_id, 
        number_of_guests, 
        number_of_tables, 
        comments_for_admin,
        status
      )
      VALUES ($1, $2, $3, $4, $5, 'upcoming')
      RETURNING *
    `;
    
    const values = [
      customer_id,
      timeSlotId,
      number_of_guests,
      number_of_tables,
      comments_for_admin
    ];
    
    const result = await client.query(insertQuery, values);
    const reservation = result.rows[0];
    
    // Commit the transaction
    await client.query('COMMIT');
    
    // Prepare reservation details for email
    const reservationDetails = {
      reservation_date: slotDetails.reservation_date,
      slot_start: slotDetails.slot_start,
      slot_end: slotDetails.slot_end,
      number_of_guests: reservation.number_of_guests,
      number_of_tables: reservation.number_of_tables,
      comments_for_admin: reservation.comments_for_admin,
      display_id: reservation.display_id
    };
    
    // Send confirmation emails
    const isAdmin = req.user.role === 'admin';
    
    // Fetch creator details if admin created this
    let creatorDetails = null;
    if (isAdmin) {
      try {
        const adminQuery = 'SELECT first_name, last_name, email_address, phone_number FROM admin_account_details WHERE id = $1';
        const adminResult = await client.query(adminQuery, [req.user.id]);
        
        if (adminResult.rows.length > 0) {
          creatorDetails = {
            first_name: adminResult.rows[0].first_name,
            last_name: adminResult.rows[0].last_name,
            email: adminResult.rows[0].email_address
          };
        }

        sendAdminReservationEmail(
          customerDetails,
          reservationDetails,
          creatorDetails
        ).catch(err => console.error('Error sending admin email:', err));

      } catch (err) {
        console.error('Error fetching admin details:', err);
      }
    }
    
    // Send email to customer
    sendCustomerReservationEmail(
      customerDetails, 
      reservationDetails, 
      isAdmin,
      creatorDetails
    ).catch(err => console.error('Error sending customer email:', err));
    
    
    res.status(201).json({
      message: 'Reservation created successfully',
      reservation: reservation
    });
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK');
    }
    
    console.error('Error creating reservation:', err);
    
    // Handle custom errors
    if (err.status && err.message) {
      return res.status(err.status).json({ 
        error: err.message,
        ...err.details
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
});

// POST add new guest reservation
router.post('/guest', extractTokenDetails, async (req, res) => {
  const { 
    guest_first_name, 
    guest_last_name, 
    guest_email, 
    guest_phone, 
    number_of_guests, 
    number_of_tables, 
    comments_for_admin,
    reservation_date,
    slot_start
  } = req.body;
  
  if (!guest_first_name || !guest_last_name || !guest_email || !guest_phone || 
      !number_of_guests || !number_of_tables || !reservation_date || !slot_start) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Basic validation
  if (number_of_guests <= 0 || number_of_tables <= 0) {
    return res.status(400).json({ error: 'Number of guests and tables must be positive' });
  }
  
  let client;
  try {
    client = await pool.connect();
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Get or create time slot with capacity check
    const timeSlotId = await getOrCreateTimeSlot(client, reservation_date, slot_start, number_of_tables);
    
    // Get time slot details for the email
    const slotQuery = 'SELECT * FROM time_slots WHERE id = $1';
    const slotResult = await client.query(slotQuery, [timeSlotId]);
    const slotDetails = slotResult.rows[0];
    
    // Add reservation - the trigger will automatically update the time_slots.reserved_tables
    const insertQuery = `
      INSERT INTO guest_reservations (
        guest_first_name, 
        guest_last_name, 
        guest_email, 
        guest_phone, 
        time_slot_id, 
        number_of_guests, 
        number_of_tables, 
        comments_for_admin,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'upcoming')
      RETURNING *
    `;
    
    const values = [
      guest_first_name,
      guest_last_name,
      guest_email,
      guest_phone,
      timeSlotId,
      number_of_guests,
      number_of_tables,
      comments_for_admin
    ];
    
    const result = await client.query(insertQuery, values);
    const reservation = result.rows[0];
    
    // Commit the transaction
    await client.query('COMMIT');
    
    // Prepare guest details for email
    const guestDetails = {
      first_name: guest_first_name,
      last_name: guest_last_name,
      email: guest_email,
      phone: guest_phone
    };
    
    // Prepare reservation details for email
    const reservationDetails = {
      reservation_date: slotDetails.reservation_date,
      slot_start: slotDetails.slot_start,
      slot_end: slotDetails.slot_end,
      number_of_guests: reservation.number_of_guests,
      number_of_tables: reservation.number_of_tables,
      comments_for_admin: reservation.comments_for_admin,
      display_id: reservation.display_id
    };
    
    // Check if request has user property (might be from authenticated admin)
    const isAdmin = req?.user?.role === 'admin';
    
    // Fetch creator details if admin created this
    let creatorDetails = null;

    if (isAdmin) {
      try {
        const adminQuery = 'SELECT first_name, last_name, email_address, phone_number FROM admin_account_details WHERE id = $1';
        const adminResult = await client.query(adminQuery, [req.user.id]);
        if (adminResult.rows.length > 0) {
          creatorDetails = {
            first_name: adminResult.rows[0].first_name,
            last_name: adminResult.rows[0].last_name,
            email: adminResult.rows[0].email_address,
            phone: adminResult.rows[0].phone_number
          };
        }


        sendAdminReservationEmail(
          guestDetails,
          reservationDetails,
          creatorDetails
        ).catch(err => console.error('Error sending admin email:', err));
      } catch (err) {
        console.error('Error fetching admin details:', err);
      }
    } 

    // Send email to guest
    sendCustomerReservationEmail(
      guestDetails, 
      reservationDetails,
      isAdmin,
      creatorDetails
    ).catch(err => console.error('Error sending guest email:', err));
    
    
    res.status(201).json({
      message: 'Guest reservation created successfully',
      reservation: reservation
    });
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK');
    }
    
    console.error('Error creating guest reservation:', err);
    
    // Handle custom errors
    if (err.status && err.message) {
      return res.status(err.status).json({ 
        error: err.message,
        ...err.details
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
}); 


/**
 * Update Reservation Details Endpoint
 * 
 * This endpoint handles updating details for both customer and guest reservations
 * using the display_id to determine the reservation type.
 * 
 * It only updates details like:
 * - Number of guests and tables
 * - Comments for admin
 * - Guest contact information (for guest reservations)
 */
router.put('/updateReservation', authenticateToken, requireAdmin, async (req, res) => {
  const { 
    display_id,
    guest_first_name,
    guest_last_name,
    guest_email, 
    guest_phone, 
    number_of_guests, 
    number_of_tables, 
    comments_for_admin
  } = req.body;
  
  if (!display_id) {
    return res.status(400).json({ error: 'Display ID is required' });
  }
  
  // Use the utility function to determine reservation type and table name
  const reservationInfo = queryUtils.getReservationTypeFromId(display_id);
  
  if (!reservationInfo) {
    return res.status(400).json({ 
      error: 'Invalid display_id format',
      message: 'Display ID should start with C- (customer) or G- (guest)'
    });
  }
  
  const { type, tableName } = reservationInfo;
  
  let client;
  try {
    client = await pool.connect();
    
    // Check if reservation exists
    const checkQuery = `
      SELECT r.*, ts.reserved_tables, ts.max_tables
      FROM ${tableName} r
      JOIN time_slots ts ON r.time_slot_id = ts.id
      WHERE r.display_id = $1
    `;
    
    const checkResult = await client.query(checkQuery, [display_id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    const reservation = checkResult.rows[0];
    
    // Only upcoming reservations can have their details changed
    if (reservation.status !== 'upcoming') {
      return res.status(400).json({ 
        error: 'Only upcoming reservations can have their details updated' 
      });
    }
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Check if we're increasing table count and if so, check capacity
    if (number_of_tables && number_of_tables > reservation.number_of_tables) {
      const additionalTables = number_of_tables - reservation.number_of_tables;
      const availableTables = reservation.max_tables - reservation.reserved_tables;
      
      if (additionalTables > availableTables) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Requested number of tables exceeds capacity',
          details: {
            current_tables: reservation.number_of_tables,
            requested_tables: number_of_tables,
            additional_needed: additionalTables,
            available: availableTables,
            max_tables: reservation.max_tables
          }
        });
      }
    }
    
    // Prepare the update fields based on provided inputs
    const updateFields = {};
    
    // Add common fields if provided
    if (number_of_guests) updateFields.number_of_guests = number_of_guests;
    if (number_of_tables) updateFields.number_of_tables = number_of_tables;
    if (comments_for_admin !== undefined) updateFields.comments_for_admin = comments_for_admin;
    
    // Add guest-specific fields if it's a guest reservation
    if (type === 'guest') {
      if (guest_email) updateFields.guest_email = guest_email;
      if (guest_phone) updateFields.guest_phone = guest_phone;
      if (guest_first_name) updateFields.guest_first_name = guest_first_name;
      if (guest_last_name) updateFields.guest_last_name = guest_last_name;
    }
    
    // If nothing to update, return early
    if (Object.keys(updateFields).length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No update fields provided' });
    }
    
    // Use buildUpdateQuery to generate the SQL
    // For this case, we don't need filterOptions since we're doing a simple equality check
    const { query, values } = queryUtils.buildUpdateQuery({
      tableName: tableName,
      updateFields: updateFields,
      whereConditions: { display_id: display_id },
      returning: true,
      update_now: true
    });

    console.log(query)
    console.log(values)
    
    // Execute the update
    const result = await client.query(query, values);
    
    // Commit the transaction
    await client.query('COMMIT');
    
    res.status(200).json({
      message: 'Reservation updated successfully',
      reservation: result.rows[0]
    });
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Error updating reservation:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
});

/*
Update the date of the reservation

We are given the type of reservation - Is it a Customer or Guest Reservation? Perhaps have different api requests (customer or guest endpoint)

We want to change our timeslot. So we should provide the customer's reservation details in a request body. 

This endpoint only changes the timeslot (Reservation Date, start time, end time),
*/
router.put('/updateReservationTimeslot', authenticateToken, requireAdmin, async (req, res) => {
  const { display_id, reservation_date, slot_start, number_of_tables } = req.body;

  console.log(req.body);

  if (!display_id || !reservation_date || !slot_start || !number_of_tables) {
    return res.status(400).json({ error: 'These data fields arent populated display_id, reservation_date, slot_start, number_of_tables' });
  }

  // Use the utility function to determine reservation type and table name
  const reservationInfo = queryUtils.getReservationTypeFromId(display_id);
  
  if (!reservationInfo) {
    return res.status(400).json({ 
      error: 'Invalid display_id format',
      message: 'Display ID should start with C- (customer) or G- (guest)'
    });
  }

  let client;
  try {
    client = await pool.connect();
    
    // Start a transaction
    await client.query('BEGIN');
    const {type, tableName} = reservationInfo;
    // Get reservation details
    const getReservationQuery = `
      SELECT *, 
            (SELECT reserved_tables FROM time_slots WHERE id = time_slot_id) as current_reserved_tables
      FROM ${tableName} 
      WHERE display_id = $1
    `;
    
    const reservationResult = await client.query(getReservationQuery, [display_id]);
    
    if (reservationResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    const reservation = reservationResult.rows[0];
    
    // Check if it's an upcoming reservation
    if (reservation.status !== 'upcoming') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Only upcoming reservations can be updated' 
      });
    }
    
    // Fix: Handle time format conversion properly
    // First, determine if slot_start is in 24-hour or 12-hour format
    let formattedSlotStart = slot_start;
    let parseFormat;
    
    // Check the format of slot_start
    if (slot_start.includes(':')) {
      if (slot_start.includes('AM') || slot_start.includes('PM')) {
        // Already in 12-hour format with AM/PM
        parseFormat = 'h:mm a';
        formattedSlotStart = slot_start;
      } else {
        // Convert from 24-hour format to 12-hour format
        // First, remove any seconds component if present
        const timeComponents = slot_start.split(':');
        const hours = parseInt(timeComponents[0], 10);
        const minutes = parseInt(timeComponents[1], 10);
        
        const date = new Date();
        date.setHours(hours, minutes, 0);
        
        // Format to 12-hour time with AM/PM
        formattedSlotStart = format(date, 'h:mm a');
        parseFormat = 'h:mm a';
      }
    } else {
      // Default to assuming 12-hour format
      parseFormat = 'h:mm a';
      formattedSlotStart = slot_start;
    }
    
    // Get or create time slot for the new date and time
    let newTimeSlotId;
    try {
      newTimeSlotId = await getOrCreateTimeSlot(
        client,
        reservation_date,
        formattedSlotStart,
        number_of_tables
      );
    } catch (error) {
      await client.query('ROLLBACK');
      
      if (error.status && error.message) {
        return res.status(error.status).json({ 
          error: error.message,
          ...error.details
        });
      }
      
      throw error;
    }
    
    // If we're moving to a different time slot or changing the number of tables
    if (reservation.time_slot_id !== newTimeSlotId || reservation.number_of_tables !== number_of_tables) {
      // First set status to cancelled to trigger the table count update for old slot
      await client.query(
        `UPDATE ${tableName} SET status = 'cancelled' WHERE display_id = $1`,
        [display_id]
      );
      
      // Now update with the new values and set status back to upcoming
      const updateQuery = `
        UPDATE ${tableName}
        SET 
          time_slot_id = $1,
          number_of_tables = $2,
          status = 'upcoming',
          updated_at = NOW()
        WHERE display_id = $3
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, [newTimeSlotId, number_of_tables, display_id]);
      
      // Commit the transaction
      await client.query('COMMIT');
      
      return res.status(200).json({
        message: 'Reservation time slot updated successfully',
        reservation: result.rows[0]
      });
    } else {
      // No actual change in time slot or table count
      await client.query('ROLLBACK');
      return res.status(200).json({
        message: 'No changes made to reservation',
        reservation: reservation
      });
    }
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK');
    }
    
    console.error('Error updating reservation time slot:', err);
    
    if (err.status && err.message) {
      return res.status(err.status).json({ 
        error: err.message,
        ...err.details
      });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
});

/*
    Cancel a reservation

    Body Parameters:
    display_id: The unique reservation identifier (C-xxxxxx or G-xxxxxx)
*/
router.post('/cancelReservation', authenticateToken, async (req, res) => {
    const { display_id } = req.body;
    
    if (!display_id) {
      return res.status(400).json({ error: 'Reservation display ID is required' });
    }
    
    // Use the utility function to determine reservation type and table name
    const reservationInfo = queryUtils.getReservationTypeFromId(display_id);
    
    if (!reservationInfo) {
      return res.status(400).json({ 
        error: 'Invalid display_id format',
        message: 'Display ID should start with C- (customer) or G- (guest)'
      });
    }

    const {type, tableName} = reservationInfo;
        
    let client;
    try {
      client = await pool.connect();
      
      // Check if reservation exists and is upcoming
      const checkQuery = `
        SELECT * FROM ${tableName}
        WHERE display_id = $1
      `;
      
      const checkResult = await client.query(checkQuery, [display_id]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Reservation not found' });
      }
      
      const reservation = checkResult.rows[0];
      
      if (reservation.status !== 'upcoming') {
        return res.status(400).json({ 
          error: 'Only upcoming reservations can be cancelled' 
        });
      }
      
      // Start a transaction
      await client.query('BEGIN');
      
      // Update reservation status - the trigger will handle updating time_slots.reserved_tables
      const updateQuery = `
        UPDATE ${tableName}
        SET 
          status = 'cancelled',
          updated_at = NOW()
        WHERE display_id = $1
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, [display_id]);
      
      // Commit the transaction
      await client.query('COMMIT');
      
      res.status(200).json({
        message: 'Reservation cancelled successfully',
        reservation: result.rows[0]
      });
    } catch (err) {
      if (client) {
        await client.query('ROLLBACK');
      }
      console.error('Error cancelling reservation:', err);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      if (client) client.release();
    }
  }
);

/*
    Update the status of a reservation.

    Body Parameters:
    display_id: The unique reservation identifier (C-xxxxxx or G-xxxxxx)
    status: Status to change it to, can be "attended", "no_show", or "cancelled"
*/
router.put('/updateReservationStatus', authenticateToken, requireAdmin, async (req, res) => {
  const { display_id, status } = req.body;
  
  if (!display_id) {
    return res.status(400).json({ error: 'Reservation display ID is required' });
  }
  
  if (!status || !['attended', 'no_show', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Valid status (attended, no_show, or cancelled) is required' });
  }
  
  // Use the utility function to determine reservation type and table name
  const reservationInfo = queryUtils.getReservationTypeFromId(display_id);
  
  if (!reservationInfo) {
    return res.status(400).json({ 
      error: 'Invalid display_id format',
      message: 'Display ID should start with C- (customer) or G- (guest)'
    });
  }
    
  const {type, tableName} = reservationInfo;
  
  let client;
  try {
    client = await pool.connect();
    
    // First get the current reservation to check its status
    const checkQuery = `
      SELECT *, 
             (SELECT reserved_tables FROM time_slots WHERE id = time_slot_id) as current_reserved_tables
      FROM ${tableName} 
      WHERE display_id = $1
    `;
    
    const checkResult = await client.query(checkQuery, [display_id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }
    
    const reservation = checkResult.rows[0];
    
    // Only allow updates for upcoming reservations
    if (reservation.status !== 'upcoming') {
      return res.status(400).json({ 
        error: `Cannot update: reservation is already marked as ${reservation.status}` 
      });
    }
    
    // Start a transaction if we're dealing with database changes
    await client.query('BEGIN');
    
    // Update the reservation status
    // The trigger will handle decreasing the reserved_tables count if needed
    const query = `
      UPDATE ${tableName}
      SET 
        status = $1,
        updated_at = NOW()
      WHERE display_id = $2
      RETURNING *
    `;
    
    const result = await client.query(query, [status, display_id]);
    
    // Commit the transaction
    await client.query('COMMIT');
    
    res.status(200).json({
      message: `Reservation marked as ${status}`,
      reservation: result.rows[0]
    });
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK');
    }
    
    console.error('Error updating reservation status:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
});


/**
 * File: src/routes/reservations.js
 * Improved search and filter endpoints with consistent pagination.
 */

// Replace the existing search endpoints with these improved versions
// that utilize queryUtils for consistent filtering and pagination

// 1. Consolidated Search Function - used by all search endpoints
const searchReservations = async (client, options) => {
  const { 
    type,
    filters = {},
    page = 1,
    limit = 10,
    sortField = 'date',
    sortOrder = 'asc'
  } = options;
  
  // Set table and field names based on type
  const isCustomer = type === 'customer';
  const tableName = isCustomer ? 'customer_reservations' : 'guest_reservations';
  const tableAlias = isCustomer ? 'cr' : 'gr';
  const customerJoin = isCustomer ? 'JOIN customer_account_details cad ON cr.customer_id = cad.id' : '';
  
  // Select fields with appropriate aliases
  const nameFields = isCustomer 
    ? 'cad.first_name, cad.last_name, cad.email_address as email, cad.phone_number as phone'
    : 'gr.guest_first_name as first_name, gr.guest_last_name as last_name, gr.guest_email as email, gr.guest_phone as phone';
  
  // Field mappings for queries
  const fieldMappings = {
    'date': 'ts.reservation_date',
    'first_name': isCustomer ? 'cad.first_name' : 'gr.guest_first_name',
    'last_name': isCustomer ? 'cad.last_name' : 'gr.guest_last_name',
    'email': isCustomer ? 'cad.email_address' : 'gr.guest_email',
    'phone': isCustomer ? 'cad.phone_number' : 'gr.guest_phone',
    'status': `${tableAlias}.status`,
    'number_of_guests': `${tableAlias}.number_of_guests`,
    'display_id': `${tableAlias}.display_id`,
    'start_date': 'ts.reservation_date',
    'end_date': 'ts.reservation_date'
  };
  
  // Build base query
  const baseQuery = `
    SELECT 
      ${tableAlias}.id, 
      ${tableAlias}.display_id,
      '${type}' as type,
      ${nameFields},
      ts.reservation_date as date,
      ts.slot_start,
      ts.slot_end,
      ${tableAlias}.number_of_guests,
      ${tableAlias}.number_of_tables,
      ${tableAlias}.comments_for_admin,
      ${tableAlias}.status,
      ${tableAlias}.created_at,
      ${tableAlias}.updated_at,
      ts.max_tables,
      ts.reserved_tables
    FROM ${tableName} ${tableAlias}
    ${customerJoin}
    JOIN time_slots ts ON ${tableAlias}.time_slot_id = ts.id
  `;
  
  // Configure filter options
  const filterOptions = {
    exactFields: ['status', 'display_id', 'phone'],
    likeFields: ['first_name', 'last_name'],
    greaterThenOrEqualFields : ['start_date'],
    lessThenOrEqualFields : ['end_date'],
    fieldMappings
  };
  
  // Build filter conditions
  const { whereClause, params } = queryUtils.buildFilterConditions(filters, filterOptions);
  
  // Execute paginated query
  const paginationOptions = {
    baseQuery: baseQuery + ` WHERE ${whereClause}`,
    params,
    page,
    limit,
    sortField,
    sortOrder,
    allowedSortFields: ['date', 'first_name', 'last_name', 'email', 'status', 'number_of_guests', 'phone'],
    fieldMappings
  };
  
  const result = await queryUtils.executePaginatedQuery(client, paginationOptions);
  
  // Calculate available tables
  const reservations = result.data.map(reservation => ({
    ...reservation,
    available_tables: reservation.max_tables - reservation.reserved_tables
  }));
  
  return {
    count: result.pagination.total,
    reservations,
    pagination: result.pagination
  };
};

// 2. Search by display_id (works for both customer and guest reservations)
router.post('/search/id', authenticateToken, requireAdmin, async (req, res) => {
  const { display_id, page = 1, limit = 10 } = req.body;

  if (!display_id) {
    return res.status(400).json({ error: 'Display ID is required' });
  }

  // Determine which type to search based on the prefix
  let type;
  if (display_id.startsWith('C-')) {
    type = 'customer';
  } else if (display_id.startsWith('G-')) {
    type = 'guest';
  } else {
    return res.status(400).json({
      error: 'Invalid display_id format',
      message: 'Display ID must start with C- (for customers) or G- (for guests)'
    });
  }

  let client;
  try {
    client = await pool.connect();
    
    const result = await searchReservations(client, {
      type,
      filters: { display_id },
      page,
      limit,
      sortField: 'date',
      sortOrder: 'desc'
    });
    
    return res.status(200).json(result);
  } catch (err) {
    console.error('Error searching reservation by ID:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
});

// 3. Search customer reservations (by customer details)
router.post('/search/customer', authenticateToken, requireAdmin, async (req, res) => {
  const { 
    first_name, 
    last_name, 
    email, 
    phone, 
    date,
    status,
    page = 1,
    limit = 10,
    sortField = 'date',
    sortOrder = 'desc'
  } = req.body;

  // Validate that at least one search criterion is provided
  if (!first_name && !last_name && !email && !phone && !date && !status) {
    return res.status(400).json({ error: 'At least one search parameter is required' });
  }

  // Convert date to start_date for the filter function
  const filters = {
    first_name,
    last_name,
    email,
    phone,
    status
  };
  
  if (date) {
    filters.start_date = date;
    filters.end_date = date;
  }

  let client;
  try {
    client = await pool.connect();
    
    const result = await searchReservations(client, {
      type: 'customer',
      filters,
      page,
      limit,
      sortField,
      sortOrder
    });
    
    return res.status(200).json(result);
  } catch (err) {
    console.error('Error searching customer reservations:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
});

// 4. Search guest reservations (by guest details)
router.post('/search/guest', authenticateToken, requireAdmin, async (req, res) => {
  const { 
    first_name, 
    last_name, 
    email, 
    phone, 
    date,
    status,
    page = 1,
    limit = 10,
    sortField = 'date',
    sortOrder = 'desc'
  } = req.body;

  // Validate that at least one search criterion is provided
  if (!first_name && !last_name && !email && !phone && !date && !status) {
    return res.status(400).json({ error: 'At least one search parameter is required' });
  }

  // Convert date to start_date for the filter function
  const filters = {
    first_name,
    last_name,
    email,
    phone,
    status
  };
  
  if (date) {
    filters.start_date = date;
    filters.end_date = date;
  }

  let client;
  try {
    client = await pool.connect();
    
    const result = await searchReservations(client, {
      type: 'guest',
      filters,
      page,
      limit,
      sortField,
      sortOrder
    });
    
    return res.status(200).json(result);
  } catch (err) {
    console.error('Error searching guest reservations:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
});

// 5. Replace the existing filter endpoint with this enhanced version
router.post('/filter', authenticateToken, requireAdmin, async (req, res) => {
  const { 
    status, 
    start_date, 
    end_date, 
    type,
    page = 1,
    limit = 10,
    sortField = 'date',
    sortOrder = 'asc'
  } = req.body;
  
  // Validate type parameter
  if (!type || (type !== 'customer' && type !== 'guest')) {
    return res.status(400).json({ 
      error: 'Invalid type parameter',
      message: 'Type must be either "customer" or "guest"'
    });
  }
  
  let client;
  try {
    client = await pool.connect();
    
    const result = await searchReservations(client, {
      type,
      filters: { status, start_date, end_date },
      page,
      limit,
      sortField,
      sortOrder
    });
    
    return res.status(200).json(result);
  } catch (err) {
    console.error('Error filtering reservations:', err);
    
    // Return more informative error for validation failures
    if (err.message && (
      err.message.includes('Page must be') || 
      err.message.includes('Limit must be') ||
      err.message.includes('Sort field must be') ||
      err.message.includes('Sort order must be')
    )) {
      return res.status(400).json({ error: err.message });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
});


export default router;
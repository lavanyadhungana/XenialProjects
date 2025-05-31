/**
 * Customer Management routes using Express Router
 * File: src/routes/customers.js
 */

import { Router } from 'express';
const router = Router();
import { hash } from 'bcrypt';
import pool from '../config/db.js';

import auth from '../middleware/auth.js';
const { authenticateToken, requireAdmin, requireCustomer } = auth;

import queryUtils from '../utils/queryUtils.js';

/**
 * Add new customer
 * POST /api/customers
 */
router.post('/add', authenticateToken, requireAdmin, async (req, res) => {
  const { email_address, phone_number, first_name, last_name, password, dietary_requirements } = req.body;
  
  if (!email_address || !phone_number || !first_name || !last_name || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  let client;
  try {
    client = await pool.connect();
    
    // Check if customer with email already exists
    const checkQuery = 'SELECT id FROM customer_account_details WHERE email_address = $1';
    const checkResult = await client.query(checkQuery, [email_address]);
    
    if (checkResult.rows.length > 0) {
      return res.status(409).json({ error: 'Customer with this email already exists' });
    }
    
    // Hash the password
    const hashedPassword = await hash(password, 12);
    
    // Insert new customer
    const insertQuery = `
      INSERT INTO customer_account_details (
        email_address, 
        phone_number, 
        first_name, 
        last_name, 
        password, 
        dietary_requirements
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email_address, phone_number, first_name, last_name, dietary_requirements
    `;
    
    const values = [
      email_address,
      phone_number,
      first_name,
      last_name,
      hashedPassword,
      dietary_requirements || null
    ];
    
    const result = await client.query(insertQuery, values);
    
    res.status(201).json({
      message: 'Customer added successfully',
      customer: result.rows[0]
    });
  } catch (err) {
    console.error('Error adding customer:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
});

/**
 * Search for customers with pagination
 * POST /api/customers/search
 */
router.post('/search', authenticateToken, requireAdmin, async (req, res) => {
  const { 
    first_name, 
    last_name, 
    email_address, 
    phone_number,
    page = 1,
    limit = 10,
    sort_by = 'last_name',
    sort_order = 'asc'
  } = req.body;
  
  // At least one search parameter is required
  if (!first_name && !last_name && !email_address && !phone_number) {
    return res.status(400).json({ error: 'At least one search parameter is required' });
  }
  
  let client;
  try {
    client = await pool.connect();
    
    // Define filter fields and how they should be matched
    const filters = { first_name, last_name, email_address, phone_number };
    const filterOptions = {
      exactFields: [],
      likeFields: ['first_name', 'last_name', 'email_address', 'phone_number'],
      fieldMappings: {}
    };
    
    // Build filter conditions
    const { whereClause, params } = queryUtils.buildFilterConditions(filters, filterOptions);
    
    // Define base query
    const baseQuery = `
      SELECT 
        id, 
        email_address, 
        phone_number, 
        first_name, 
        last_name, 
        dietary_requirements,
        created_at
      FROM customer_account_details
      WHERE ${whereClause}
    `;
    
    // Setup pagination options
    const paginationOptions = {
      baseQuery,
      params,
      page,
      limit,
      sortField: sort_by,
      sortOrder: sort_order,
      allowedSortFields: ['first_name', 'last_name', 'email_address', 'created_at'],
      fieldMappings: {}
    };
    
    // Execute paginated query
    const result = await queryUtils.executePaginatedQuery(client, paginationOptions);
    
    res.status(200).json({
      customers: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    console.error('Error searching for customers:', err);
    
    // Handle validation errors from pagination utility
    if (err.message && (
      err.message.includes('Page must be') || 
      err.message.includes('Limit must be') ||
      err.message.includes('Sort field must be') ||
      err.message.includes('Sort order must be')
    )) {
      return res.status(400).json({ error: err.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
});

/**
  Update Customer Details, excluding Password Update / Reset.
 */
router.put('/update', authenticateToken, requireAdmin, async (req, res) => {
  const { id, email_address, phone_number, first_name, last_name, dietary_requirements } = req.body;
  
  if (!email_address || !phone_number || !first_name || !last_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  let client;
  try {
    client = await pool.connect();
    
    // Check if customer exists
    const checkQuery = 'SELECT id FROM customer_account_details WHERE id = $1';
    const checkResult = await client.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Check if email already exists for another customer
    const emailCheckQuery = 'SELECT id FROM customer_account_details WHERE email_address = $1 AND id != $2';
    const emailCheckResult = await client.query(emailCheckQuery, [email_address, id]);
    
    if (emailCheckResult.rows.length > 0) {
      return res.status(409).json({ error: 'Email address already in use by another customer' });
    }
    
    let query;
    let values;
    
    query = `
    UPDATE customer_account_details
    SET 
        email_address = $1,
        phone_number = $2,
        first_name = $3,
        last_name = $4,
        dietary_requirements = $5
    WHERE id = $6
    RETURNING id, email_address, phone_number, first_name, last_name, dietary_requirements
    `;
    
    values = [
    email_address,
    phone_number,
    first_name,
    last_name,
    dietary_requirements || null,
    id
    ];
    
    const result = await client.query(query, values);
    
    res.status(200).json({
      message: 'Customer updated successfully',
      customer: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating customer:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
});

/**
 Delete Customer Account.
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  
  let client;
  try {
    client = await pool.connect();
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Check if customer has any reservations
    const reservationCheckQuery = 'SELECT id FROM customer_reservations WHERE customer_id = $1 LIMIT 1';
    const reservationCheck = await client.query(reservationCheckQuery, [id]);
    
    if (reservationCheck.rows.length > 0) {
      // Has reservations, don't delete - return error
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Cannot delete customer with existing reservations. Cancel their reservations first.' 
      });
    }
    
    // Check if customer exists
    const deleteQuery = 'DELETE FROM customer_account_details WHERE id = $1 RETURNING id';
    const result = await client.query(deleteQuery, [id]);
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    res.status(200).json({
      message: 'Customer deleted successfully',
      id: result.rows[0].id
    });
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Error deleting customer:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
});


/**
 * NEW ENDPOINT: Get current customer's upcoming reservations
 * GET /api/customers/upcomingReservations
 */
router.get('/upcomingReservations', authenticateToken, requireCustomer, async (req, res) => {
  // Get customer ID from the JWT token
  const customerId = req.user.id;
  
  let client;
  try {
    client = await pool.connect();
    
    // Query for upcoming reservations only (status = 'upcoming')
    const query = `
      SELECT 
        cr.id,
        cr.display_id,
        cr.number_of_guests,
        cr.number_of_tables,
        cr.comments_for_admin,
        cr.status,
        cr.created_at,
        cr.updated_at,
        ts.reservation_date,
        ts.slot_start,
        ts.slot_end
      FROM customer_reservations cr
      JOIN time_slots ts ON cr.time_slot_id = ts.id
      WHERE cr.customer_id = $1 AND cr.status = 'upcoming'
      ORDER BY ts.reservation_date ASC, ts.slot_start ASC
    `;
    
    const result = await client.query(query, [customerId]);
    
    res.status(200).json({
      upcomingReservations: result.rows
    });
  } catch (err) {
    console.error('Error fetching upcoming reservations:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
});

/**
 * NEW ENDPOINT: Get current customer's past reservations
 * GET /api/customers/pastReservations
 */
router.get('/pastReservations', authenticateToken, requireCustomer, async (req, res) => {
  // Get customer ID from the JWT token
  const customerId = req.user.id;
  
  let client;
  try {
    client = await pool.connect();
    
    // Query for past reservations (status = 'attended', 'no_show', or 'cancelled')
    const query = `
      SELECT 
        cr.id,
        cr.display_id,
        cr.number_of_guests,
        cr.number_of_tables,
        cr.comments_for_admin,
        cr.status,
        cr.created_at,
        cr.updated_at,
        ts.reservation_date,
        ts.slot_start,
        ts.slot_end
      FROM customer_reservations cr
      JOIN time_slots ts ON cr.time_slot_id = ts.id
      WHERE cr.customer_id = $1 AND cr.status IN ('attended', 'no_show', 'cancelled')
      ORDER BY ts.reservation_date DESC, ts.slot_start DESC
    `;
    
    const result = await client.query(query, [customerId]);
    
    res.status(200).json({
      pastReservations: result.rows
    });
  } catch (err) {
    console.error('Error fetching past reservations:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
});

/**
 * GET /api/customers/myDetails
 */
router.get('/myDetails', authenticateToken, requireCustomer, async (req, res) => {
  // Get customer ID from the JWT token
  const customerId = req.user.id;
  
  let client;
  try {
    client = await pool.connect();
    
    const query = `
      SELECT 
        id,
        email_address,
        phone_number,
        first_name,
        last_name,
        dietary_requirements,
        created_at
      FROM customer_account_details
      WHERE id = $1
    `;
    
    const result = await client.query(query, [customerId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.status(200).json({
      customerDetails: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching customer details:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
});

/**
 * PUT /api/customers/updateMyAccount
 */
router.put('/updateMyAccount', authenticateToken, requireCustomer, async (req, res) => {
  // Get customer ID from the JWT token
  const customerId = req.user.id;
  
  const { 
    email_address, 
    phone_number, 
    first_name, 
    last_name, 
    dietary_requirements,
    current_password,
    new_password
  } = req.body;
  
  if (!email_address || !phone_number || !first_name || !last_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  let client;
  try {
    client = await pool.connect();
    
    // Check if customer exists and get current password
    const checkQuery = 'SELECT password FROM customer_account_details WHERE id = $1';
    const checkResult = await client.query(checkQuery, [customerId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Check if email already exists for another customer
    const emailCheckQuery = 'SELECT id FROM customer_account_details WHERE email_address = $1 AND id != $2';
    const emailCheckResult = await client.query(emailCheckQuery, [email_address, customerId]);
    
    if (emailCheckResult.rows.length > 0) {
      return res.status(409).json({ error: 'Email address already in use by another customer' });
    }
    
    // Check if we need to update the password
    let query;
    let values;
    
    if (current_password && new_password) {
      // Verify current password
      const isPasswordValid = await compare(current_password, checkResult.rows[0].password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      
      // Hash the new password
      const hashedPassword = await hash(new_password, 12);
      
      query = `
        UPDATE customer_account_details
        SET 
          email_address = $1,
          phone_number = $2,
          first_name = $3,
          last_name = $4,
          dietary_requirements = $5,
          password = $6
        WHERE id = $7
        RETURNING id, email_address, phone_number, first_name, last_name, dietary_requirements
      `;
      
      values = [
        email_address,
        phone_number,
        first_name,
        last_name,
        dietary_requirements || null,
        hashedPassword,
        customerId
      ];
    } else {
      // Update without changing password
      query = `
        UPDATE customer_account_details
        SET 
          email_address = $1,
          phone_number = $2,
          first_name = $3,
          last_name = $4,
          dietary_requirements = $5
        WHERE id = $6
        RETURNING id, email_address, phone_number, first_name, last_name, dietary_requirements
      `;
      
      values = [
        email_address,
        phone_number,
        first_name,
        last_name,
        dietary_requirements || null,
        customerId
      ];
    }
    
    const result = await client.query(query, values);
    
    res.status(200).json({
      message: 'Account updated successfully',
      customerDetails: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating customer account:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
});


export default router;
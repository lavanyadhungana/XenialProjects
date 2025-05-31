import { Router } from 'express';
import { hash, compare } from 'bcrypt';
import jwt from 'jsonwebtoken';   
const { sign } = jwt;

import pool from '../config/db.js';

import auth from '../middleware/auth.js';
const {authenticateToken, requireAdmin, requireCustomer} = auth;

const { JWT_SECRET } = auth;

const router = Router();

// ===== CUSTOMER SIGN UP =====
router.post('/customers/signup', async (req, res) => {
  const { email_address, phone_number, first_name, last_name, password, dietary_requirements } = req.body;
  if (!email_address || !phone_number || !first_name || !last_name || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  console.log(req.body)

  let client;
  try {
    client = await pool.connect();
    const checkQuery = 'SELECT id FROM customer_account_details WHERE email_address = $1';
    const checkResult = await client.query(checkQuery, [email_address]);
    if (checkResult.rows.length > 0) {
      return res.status(409).json({ error: 'Customer with this email already exists' });
    }
    const hashedPassword = await hash(password, 12);
    const insertQuery = `
      INSERT INTO customer_account_details (email_address, phone_number, first_name, last_name, password, dietary_requirements)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email_address, first_name, last_name
    `;
    const values = [email_address, phone_number, first_name, last_name, hashedPassword, dietary_requirements || null];
    
    const result = await client.query(insertQuery, values);

    // Generate a JWT token.
    const token = sign(
      { id: result.rows[0].id, email: result.rows[0].email_address, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.status(201).json({ message: 'Customer account created successfully', token });
  } catch (err) {
    console.error('Error during customer sign-up:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
});

// ===== CUSTOMER LOGIN =====
router.post('/customers/login', async (req, res) => {
  const { email_address, password } = req.body;
  if (!email_address || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  let client;
  try {
    client = await pool.connect();
    const query = 'SELECT id, email_address, password FROM customer_account_details WHERE email_address = $1';
    const result = await client.query(query, [email_address]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const customer = result.rows[0];
    const isValid = await compare(password, customer.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = sign(
      { id: customer.id, email: customer.email_address, role: 'customer' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.status(200).json({ message: 'Customer login successful', token });
  } catch (err) {
    console.error('Error during customer login:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
});

// ===== ADMIN SIGN UP =====
router.post('/admins/signup', async (req, res) => {
  const { email_address, phone_number, first_name, last_name, password } = req.body;
  if (!email_address || !first_name || !last_name || !password || !phone_number) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  console.log(req.body)

  let client;
  try {
    client = await pool.connect();
    const checkQuery = 'SELECT id FROM admin_account_details WHERE email_address = $1';
    const checkResult = await client.query(checkQuery, [email_address]);
    if (checkResult.rows.length > 0) {
      return res.status(409).json({ error: 'Admin with this email already exists' });
    }
    const hashedPassword = await hash(password, 12);
    const insertQuery = `
      INSERT INTO admin_account_details (email_address, phone_number, first_name, last_name, password)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email_address, first_name, last_name
    `;
    const values = [email_address, phone_number, first_name, last_name, hashedPassword];
    const result = await client.query(insertQuery, values);

    const token = sign(
      { id: result.rows[0].id, email: result.rows[0].email_address, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '12h' }
    );
    res.status(201).json({ message: 'Admin account created successfully', token });
  } catch (err) {
    console.error('Error during admin sign-up:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
});

// ===== ADMIN LOGIN =====
router.post('/admins/login', async (req, res) => {
  const { email_address, password } = req.body;
  if (!email_address || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  let client;
  try {
    client = await pool.connect();
    const query = 'SELECT id, email_address, password FROM admin_account_details WHERE email_address = $1';
    const result = await client.query(query, [email_address]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const admin = result.rows[0];
    const isValid = await compare(password, admin.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = sign(
      { id: admin.id, email: admin.email_address, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '12h' }
    );
    res.status(200).json({ message: 'Admin login successful', token });
  } catch (err) {
    console.error('Error during admin login:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    if (client) client.release();
  }
});

// ===== VERIFY CUSTOMER TOKEN =====
router.get('/verify', authenticateToken, requireCustomer, async (req, res) => {
  try {
    // Since authenticateToken middleware has already verified the token
    // and added the user payload to req.user, we just need to return the user info
    
    const userData = {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    };
    
    res.status(200).json({ 
      success: true, 
      message: 'Token is valid', 
      user: userData 
    });
  } catch (err) {
    console.error('Error during token verification:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ===== VERIFY ADMIN TOKEN =====
router.get('/verify/admin', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // If we reach here, the token is valid and belongs to an admin
    // (thanks to the authenticateToken and requireAdmin middlewares)
    
    const adminData = {
      id: req.user.id,
      email: req.user.email
    };
    
    res.status(200).json({ 
      success: true, 
      message: 'Admin token is valid', 
      admin: adminData 
    });
  } catch (err) {
    console.error('Error during admin token verification:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
// File: src/routes/announcements.js
// Announcements routes
import { Router } from 'express';
const router = Router();
import pool from '../config/db.js';

import auth from '../middleware/auth.js';
const { authenticateToken, requireAdmin } = auth;

// Get announcements
router.get('/', async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        const query = 'SELECT * FROM announcements ORDER BY start_date DESC';
        const result = await client.query(query);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error retrieving announcements:', err);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        if (client) client.release();
    }
});

// Add announcements
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    const { title, description, start_date, end_date, is_active } = req.body;
 
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    let client;
    try {
      client = await pool.connect();
      const query = `
        INSERT INTO announcements (title, description, start_date, end_date, is_active)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      
      const values = [title, description, start_date, end_date, is_active !== false];
      const result = await client.query(query, values);
      
      res.status(201).json({ message: 'Announcement created successfully', data: result.rows[0] });
    } catch (err) {
      console.error('Error creating announcement:', err);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      if (client) client.release();
    }
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { title, description, start_date, end_date, is_active } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    let client;
    try {
      client = await pool.connect();
      const query = `
        UPDATE announcements
        SET 
          title = $1, 
          description = $2,
          start_date = $3,
          end_date = $4,
          is_active = $5,
          updated_at = NOW()
        WHERE id = $6
        RETURNING *
      `;
      
      const values = [title, description, start_date, end_date, is_active !== false, id];
      const result = await client.query(query, values);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Announcement not found' });
      }
      
      res.status(200).json({ message: 'Announcement updated successfully', data: result.rows[0] });
    } catch (err) {
      console.error('Error updating announcement:', err);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      if (client) client.release();
    }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    const { id } = req.params;
 
    let client;
    try {
      client = await pool.connect();
      const query = 'DELETE FROM announcements WHERE id = $1 RETURNING id';
      const result = await client.query(query, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Announcement not found' });
      }
      
      res.status(200).json({ message: 'Announcement deleted successfully', id: result.rows[0].id });
    } catch (err) {
      console.error('Error deleting announcement:', err);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      if (client) client.release();
    }
});

export default router;
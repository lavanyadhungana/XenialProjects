/**
 * File: src/routes/timeslots.js
 * Time Slots Management API Endpoints
 */

import { Router } from 'express';
import { getDay, format, parse, addMinutes } from 'date-fns';
const router = Router();
import pool from '../config/db.js';

// GET available time slots for a specific date
router.get('/availability/:date', async (req, res) => {
    const { date } = req.params;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    let client;
    try {
      client = await pool.connect();
      
      // 1. Get the day of the week index (0-6, where 0 is Sunday)
      const dateObj = new Date(date);
      const dayIndex = getDay(dateObj);
      
      // 2. Get restaurant schedule for this day
      const scheduleQuery = `
        SELECT 
          time_open,
          time_closed,
          is_closed
        FROM restaurant_schedule
        WHERE day_of_the_week = $1
      `;
      
      const scheduleResult = await client.query(scheduleQuery, [dayIndex]);
      
      // Check if restaurant is closed on this day
      if (scheduleResult.rows.length === 0 || scheduleResult.rows[0].is_closed) {
        return res.status(200).json({
          date,
          time_slots: [],
          message: 'Restaurant is closed on this day'
        });
      }
      
      // 3. Get restaurant details for max tables
      const restaurantQuery = `
        SELECT 
          tables_count
        FROM restaurant_details
        LIMIT 1
      `;
      
      const restaurantResult = await client.query(restaurantQuery);
      
      if (restaurantResult.rows.length === 0) {
        return res.status(500).json({ error: 'Restaurant details not found' });
      }
      
      const maxTables = restaurantResult.rows[0].tables_count;
      const openTime = scheduleResult.rows[0].time_open;
      const closeTime = scheduleResult.rows[0].time_closed;
      
      // 4. Generate time slots at 30-minute intervals
      const timeSlotsMap = new Map();
      
      // Parse times to create Date objects for manipulation
      const baseDate = new Date(date);
      const startTime = parse(openTime, 'HH:mm:ss', baseDate);
      const endTime = parse(closeTime, 'HH:mm:ss', baseDate);
      
      // Calculate time slots (each reservation lasts 1.5 hours)
      let currentTime = startTime;
      const slotDuration = 30; // minutes
      const reservationDuration = 90; // minutes (1.5 hours)
      
      let i = 1;
      while (addMinutes(currentTime, reservationDuration) <= endTime) {
        const slotStart = format(currentTime, 'HH:mm:ss');
        const slotEnd = format(addMinutes(currentTime, reservationDuration), 'HH:mm:ss');
        
        const formattedStartTime = format(currentTime, 'h:mm aa');
        
        timeSlotsMap.set(formattedStartTime, {
          slot_id : i,
          slot_start: slotStart,
          slot_end: slotEnd,
          reserved_tables: 0,
          max_tables: maxTables,
          reservation_date: date
        });
        i++;
        // Move to next slot
        currentTime = addMinutes(currentTime, slotDuration);
      }
      
      // 5. Query existing time slots from database
      const existingSlotsQuery = `
        SELECT 
          id,
          reservation_date,
          slot_start,
          slot_end,
          max_tables,
          reserved_tables
        FROM time_slots
        WHERE reservation_date = $1
        ORDER BY slot_start
      `;
      
      const existingSlotsResult = await client.query(existingSlotsQuery, [date]);
      
      // Update reserved_tables in our map from database records
      for (const slot of existingSlotsResult.rows) {
        const slotStartFormatted = format(parse(slot.slot_start, 'HH:mm:ss', baseDate), 'h:mm aa');
        
        if (timeSlotsMap.has(slotStartFormatted)) {
          const existingSlot = timeSlotsMap.get(slotStartFormatted);
          existingSlot.reserved_tables = slot.reserved_tables;
          timeSlotsMap.set(slotStartFormatted, existingSlot);
        }
      }
      
      // 6. Convert map to array and add availability calculations
      const timeSlots = Array.from(timeSlotsMap.entries()).map(([time, slot]) => {
        const availableTables = Math.max(0, slot.max_tables - slot.reserved_tables);
        return {
          id: slot.slot_id, // Will be undefined for new slots
          reservation_date: slot.reservation_date,
          slot_start: slot.slot_start,
          slot_end: slot.slot_end,
          max_tables: slot.max_tables,
          available_tables: availableTables,
          available_seats: availableTables * 2, // Assuming 2 seats per table
          is_available: availableTables > 0 
        };
      });

      console.log(timeSlots)
      
      res.status(200).json({
        date,
        time_slots: timeSlots
      });
    } catch (err) {
      console.error('Error retrieving time slots:', err);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      if (client) client.release();
    }
});

export default router;
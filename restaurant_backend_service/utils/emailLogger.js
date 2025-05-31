// File: src/utils/emailLogger.js

import pool from '../config/db.js';

/**
 * Log an email to the database for tracking purposes
 * 
 * @param {string} emailAddress - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} body - Email content (HTML)
 * @param {string} status - Email status (default: 'sent')
 * @returns {Promise<boolean>} Success indicator
 */
export const logEmail = async (emailAddress, subject, body, status = 'sent') => {
  let client;
  try {
    client = await pool.connect();
    
    const query = `
      INSERT INTO email_notifications (
        email_address,
        subject,
        body,
        sent_at,
        status
      )
      VALUES ($1, $2, $3, NOW(), $4)
    `;
    
    const values = [
      emailAddress,
      subject,
      body,
      status
    ];
    
    await client.query(query, values);
    return true;
  } catch (error) {
    console.error('Error logging email:', error);
    return false;
  } finally {
    if (client) client.release();
  }
};

export default {
  logEmail
};
// File: src/utils/emailService.js

import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
import emailLogger from './emailLogger.js';
dotenv.config();

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send confirmation email to customer after reservation
 * 
 * @param {Object} customerDetails - Customer information (first_name, last_name, email)
 * @param {Object} reservationDetails - Reservation information
 * @param {boolean} isAdmin - Whether the reservation was made by an admin
 * @param {Object} [adminDetails] - Admin details if reservation was made by admin
 */
export const sendCustomerReservationEmail = async (customerDetails, reservationDetails, isAdmin = false, adminDetails = null) => {
  try {
    const { first_name, last_name, email } = customerDetails;
    
    // Format reservation date and time for email
    const reservationDate = new Date(reservationDetails.reservation_date);
    const formattedDate = reservationDate.toLocaleDateString('en-AU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Create email subject and content
    let subject = `Your Reservation at Marko Italian Restaurant`;
    let adminNote = '';
    
    if (isAdmin && adminDetails) {
      adminNote = `<p>This reservation was made on your behalf by ${adminDetails.first_name} ${adminDetails.last_name}.</p>`;
    }
    
    // Create email HTML content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #b71c1c;">Marko Italian Restaurant</h2>
        <h3>Reservation Confirmation</h3>
        <p>Dear ${first_name} ${last_name},</p>
        <p>Thank you for making a reservation with us! We're excited to welcome you to Marko Italian Restaurant.</p>
        ${adminNote}
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4 style="margin-top: 0;">Reservation Details:</h4>
          <ul style="list-style-type: none; padding-left: 0;">
            <li><strong>Date:</strong> ${formattedDate}</li>
            <li><strong>Time:</strong> ${reservationDetails.slot_start}</li>
            <li><strong>Number of Guests:</strong> ${reservationDetails.number_of_guests}</li>
            <li><strong>Reservation ID:</strong> ${reservationDetails.display_id}</li>
          </ul>
        </div>
        <p>If you need to make any changes to your reservation, please contact us at ${process.env.RESTAURANT_PHONE || '+61-2-9876-5432'}.</p>
        <p>We look forward to serving you!</p>
        <p>Warm regards,<br>Marko Italian Restaurant Team</p>
        <p style="font-size: 0.8em; color: #757575; margin-top: 30px;">123 Italian Lane, Sydney NSW 2000, Australia</p>
      </div>
    `;
    
    // Set up email message
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: subject,
      html: htmlContent,
    };
    
    // Send the email
    await sgMail.send(msg);
    
    // Log the email
    await emailLogger.logEmail(email, subject, htmlContent);
    
    console.log(`Reservation confirmation email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending customer reservation email:', error);
    console.error(error.response.body)
    // Don't throw error to prevent disrupting the main reservation flow
    return false;
  }
};

/**
 * Send notification email to admin when a reservation is made
 * 
 * @param {Object} adminDetails - Admin information (email_address, first_name, last_name, etc.)
 * @param {Object} customerDetails - Customer information
 * @param {Object} reservationDetails - Reservation information
 * @param {Object} [creatorDetails] - Details of admin who created reservation (if applicable)
 */
export const sendAdminReservationEmail = async (customerDetails, reservationDetails, creatorDetails = null) => {
    try {
      const adminEmail = creatorDetails.email;
      
      // Format reservation date and time for email
      const reservationDate = new Date(reservationDetails.reservation_date);
      const formattedDate = reservationDate.toLocaleDateString('en-AU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Create subject line
      let subject = `New Reservation: ${customerDetails.first_name} ${customerDetails.last_name} - ${formattedDate}`;
      
      
      // Create email HTML content with admin details included
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1b5e20;">New Reservation Notification</h2>
          <p>Hello ${creatorDetails.first_name} ${creatorDetails.last_name},</p>
          <p>A new reservation has been made at Marko Italian Restaurant.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin-top: 0;">Reservation Details:</h4>
            <ul style="list-style-type: none; padding-left: 0;">
              <li><strong>Customer:</strong> ${customerDetails.first_name} ${customerDetails.last_name}</li>
              <li><strong>Email:</strong> ${customerDetails.email}</li>
              <li><strong>Phone:</strong> ${customerDetails.phone || 'Not provided'}</li>
              <li><strong>Date:</strong> ${formattedDate}</li>
              <li><strong>Time:</strong> ${reservationDetails.slot_start}</li>
              <li><strong>Number of Guests:</strong> ${reservationDetails.number_of_guests}</li>
              <li><strong>Number of Tables:</strong> ${reservationDetails.number_of_tables}</li>
              <li><strong>Reservation ID:</strong> ${reservationDetails.display_id}</li>
              <li><strong>Comments:</strong> ${reservationDetails.comments_for_admin || 'None'}</li>
            </ul>
          </div>
          <p>You can view and manage this reservation in the admin dashboard.</p>
          <p>Your admin details:</p>
          <ul style="list-style-type: none; padding-left: 0;">
            <li><strong>Email:</strong> ${creatorDetails.email}</li>
            <li><strong>Phone:</strong> ${creatorDetails.phone || 'N/A'}</li>
          </ul>
          <p>Best regards,<br>Marko Italian Restaurant System</p>
        </div>
      `;
      
      // Set up email message
      const msg = {
        to: adminEmail,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: subject,
        html: htmlContent,
      };
      
      // Send the email
      await sgMail.send(msg);
      
      // Log the email
      await emailLogger.logEmail(adminEmail, subject, htmlContent);
      
      console.log(`Admin notification email sent to ${adminEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending admin notification email:', error);
      // Don't throw error to prevent disrupting the main reservation flow
      return false;
    }
};


export default {
  sendCustomerReservationEmail,
  sendAdminReservationEmail
};
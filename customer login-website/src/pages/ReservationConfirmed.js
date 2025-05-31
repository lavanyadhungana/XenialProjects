import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ReservationConfirmed.css';

const ReservationConfirmed = () => {
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Retrieve reservation data from localStorage
    const storedReservation = localStorage.getItem('currentReservation');
    
    if (!storedReservation) {
      // If no reservation data is found, redirect to reservation page
      navigate('/reservation');
      return;
    }

    try {
      const parsedReservation = JSON.parse(storedReservation);
      setReservation(parsedReservation);
    } catch (error) {
      console.error('Error parsing reservation data:', error);
      navigate('/reservation');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  if (loading) {
    return (
      <div className="confirmation-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!reservation) {
    return null;
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    // Handle HH:MM:SS format from the server
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM
      
      return `${hour12}:${minutes.substring(0, 2)} ${ampm}`;
    }
    
    // For backward compatibility with already stored data
    const date = new Date();
    date.setHours(parseInt(timeString.split(':')[0]), parseInt(timeString.split(':')[1]));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="confirmation-container">
      <div className="confirmation-card">
        <div className="confirmation-header">
          <i className="fas fa-check-circle"></i>
          <h2>Reservation Confirmed!</h2>
          <span className="reservation-id">Reservation ID: #{reservation.display_id || reservation.id}</span>
        </div>

        <div className="confirmation-section">
          <h3>Guest Information</h3>
          <div className="detail-row">
            <span className="label">Name</span>
            <span className="value">{`${reservation.firstName} ${reservation.lastName}`}</span>
          </div>
          <div className="detail-row">
            <span className="label">Email</span>
            <span className="value">{reservation.email}</span>
          </div>
          <div className="detail-row">
            <span className="label">Phone</span>
            <span className="value">{reservation.phone}</span>
          </div>
        </div>

        <div className="confirmation-section">
          <h3>Reservation Details</h3>
          <div className="detail-row">
            <span className="label">Date</span>
            <span className="value">{formatDate(reservation.reservation_date || reservation.date)}</span>
          </div>
          <div className="detail-row">
            <span className="label">Time</span>
            <span className="value">{formatTime(reservation.slot_start || reservation.time)}</span>
          </div>
          <div className="detail-row">
            <span className="label">Number of Guests</span>
            <span className="value">{reservation.number_of_guests || reservation.guests}</span>
          </div>
          <div className="detail-row">
            <span className="label">Number of Tables</span>
            <span className="value">{reservation.number_of_tables || Math.ceil((reservation.guests || 1) / 2)}</span>
          </div>
          {reservation.tablePreference && (
            <div className="detail-row">
              <span className="label">Table Preference</span>
              <span className="value">{reservation.tablePreference}</span>
            </div>
          )}
        </div>

        {(reservation.comments_for_admin || reservation.specialRequests) && (
          <div className="confirmation-section">
            <h3>Additional Information</h3>
            {reservation.occasion && (
              <div className="detail-row">
                <span className="label">Special Occasion</span>
                <span className="value">{reservation.occasion}</span>
              </div>
            )}
            {(reservation.comments_for_admin || reservation.specialRequests) && (
              <div className="detail-row">
                <span className="label">Special Requests</span>
                <span className="value">{reservation.comments_for_admin || reservation.specialRequests}</span>
              </div>
            )}
          </div>
        )}

        <div className="confirmation-actions">
          <button 
            onClick={() => navigate('/')} 
            className="btn btn-primary"
          >
            <i className="fas fa-home"></i>
            Return to Home
          </button>
          <button 
            onClick={() => navigate('/reservation')} 
            className="btn btn-secondary"
          >
            <i className="fas fa-calendar-plus"></i>
            Make Another Reservation
          </button>
        </div>

        <div className="confirmation-footer">
          <p>A confirmation email has been sent to {reservation.email}</p>
          <p>Need to modify your reservation? <a href="/reservation">Click here</a></p>
        </div>
      </div>
    </div>
  );
};

export default ReservationConfirmed;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ReservationSummary.css';

const ReservationSummary = () => {
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

  const handleModify = () => {
    navigate('/reservation');
  };

  const handleConfirm = () => {
    if (reservation) {
      // Update the reservation status
      const confirmedReservation = {
        ...reservation,
        status: 'confirmed'
      };

      // Store the updated reservation
      localStorage.setItem('currentReservation', JSON.stringify(confirmedReservation));
      
      // Navigate to confirmation page
      navigate('/reservation-confirmed');
    }
  };

  if (loading) {
    return (
      <div className="summary-container">
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
    <div className="summary-container">
      <div className="summary-card">
        <div className="summary-header">
          <h2>Reservation Summary</h2>
          <span className="reservation-id">#{reservation.display_id || reservation.id}</span>
        </div>

        <div className="summary-content">
          <div className="summary-section">
            <h3>
              <i className="fas fa-user-circle"></i>
              Guest Information
            </h3>
            <div className="detail-row">
              <span className="detail-label">Name</span>
              <span className="detail-value">{`${reservation.firstName} ${reservation.lastName}`}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email</span>
              <span className="detail-value">{reservation.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Phone</span>
              <span className="detail-value">{reservation.phone}</span>
            </div>
          </div>

          <div className="summary-section">
            <h3>
              <i className="fas fa-calendar-alt"></i>
              Reservation Details
            </h3>
            <div className="detail-row">
              <span className="detail-label">Date</span>
              <span className="detail-value">{formatDate(reservation.reservation_date || reservation.date)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Time</span>
              <span className="detail-value">{formatTime(reservation.slot_start || reservation.time)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Number of Guests</span>
              <span className="detail-value">{reservation.number_of_guests || reservation.guests}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Number of Tables</span>
              <span className="detail-value">{reservation.number_of_tables || Math.ceil((reservation.guests || 1) / 2)}</span>
            </div>
            {reservation.tablePreference && (
              <div className="detail-row">
                <span className="detail-label">Table Preference</span>
                <span className="detail-value">{reservation.tablePreference}</span>
              </div>
            )}
          </div>

          {(reservation.comments_for_admin || reservation.specialRequests) && (
            <div className="summary-section">
              <h3>
                <i className="fas fa-info-circle"></i>
                Additional Information
              </h3>
              {reservation.occasion && (
                <div className="detail-row">
                  <span className="detail-label">Special Occasion</span>
                  <span className="detail-value">{reservation.occasion}</span>
                </div>
              )}
              {(reservation.comments_for_admin || reservation.specialRequests) && (
                <div className="special-requests">
                  <h4>Special Requests</h4>
                  <p>{reservation.comments_for_admin || reservation.specialRequests}</p>
                </div>
              )}
            </div>
          )}

          <div className="summary-section">
            <h3>
              <i className="fas fa-clock"></i>
              Status
            </h3>
            <div className="detail-row">
              <span className="detail-label">Reservation Status</span>
              <span className={`status-badge status-${reservation.status}`}>
                {reservation.status}
              </span>
            </div>
          </div>
        </div>

        <div className="summary-actions">
          <button onClick={handleModify} className="btn btn-secondary">
            <i className="fas fa-edit"></i>
            Modify Reservation
          </button>
          <button onClick={handleConfirm} className="btn btn-primary">
            <i className="fas fa-check"></i>
            Confirm Reservation
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReservationSummary;
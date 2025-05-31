// src/pages/GuestReservation.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reservationAPI } from '../services/apiService';
import { format } from 'date-fns';
import './Reservation.css';

const formatTimeToAMPM = (timeString) => {
    // Parse the time components
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM
    
    return `${hour12}:${minutes} ${ampm}`;
};

const GuestReservation = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    number_of_guests: 1,
    number_of_tables: 1,
    comments_for_admin: '',
    guest_first_name: '',
    guest_last_name: '',
    guest_email: '',
    guest_phone: ''
  });
  const [errors, setErrors] = useState({});
  const [availableTimes, setAvailableTimes] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In the useEffect hook that fetches time slots
  useEffect(() => {
      if (formData.date) {
      setLoadingTimeSlots(true);
      setAvailableTimes([]);
      
      // Fetch time slots from the API
      reservationAPI.getAvailability(formData.date)
          .then(response => {
          setTimeSlots(response.time_slots || []);
          
          // Map time slots to available times for the dropdown
          const times = (response.time_slots || [])
              .filter(slot => slot.is_available)
              .map(slot => {
                // Format time for display only
                const formattedTime = formatTimeToAMPM(slot.slot_start);
                
                return {
                  value: slot.slot_start, // Keep original format for backend
                  label: `${formattedTime} (${slot.available_tables} tables available)`,
                  availableTables: slot.available_tables,
                  availableSeats: slot.available_tables * 2 // 2 seats per table
                };
              });
          
          setAvailableTimes(times);
          })
          .catch(error => {
            console.error('Error fetching available times:', error);
            setErrors(prev => ({
              ...prev,
              timeSlots: 'Failed to fetch available times. Please try again.'
            }));
          })
          .finally(() => {
            setLoadingTimeSlots(false);
          });
      }
  }, [formData.date]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Update number_of_tables when time slot changes
    if (name === 'time') {
      calculateRequiredTables(value, formData.number_of_guests);
    }
  };

  const handleGuestChange = (e) => {
    let value = e.target.value;
    
    // Remove any non-numeric characters
    value = value.replace(/[^0-9]/g, '');
    
    // Convert to number for validation
    const numValue = value === '' ? 0 : parseInt(value);
    
    // Validate the range
    if (value === '' || (numValue >= 1 && numValue <= 60)) {
      setFormData(prev => ({
        ...prev,
        number_of_guests: numValue
      }));
      
      // Calculate required tables based on guest count
      if (numValue > 0 && formData.time) {
        calculateRequiredTables(formData.time, numValue);
      }
    }
  };

  // Calculate how many tables are needed based on guest count
  const calculateRequiredTables = (timeValue, guestCount) => {
    if (!timeValue || !guestCount) return;
    
    // Find the selected time slot
    const selectedSlot = availableTimes.find(time => time.value === timeValue);
    if (!selectedSlot) return;
    
    // Each table seats 2 people (changed from 4)
    const requiredTables = Math.ceil(guestCount / 2);
    
    // Check if we have enough tables
    const availableTables = selectedSlot.availableTables;
    
    if (requiredTables > availableTables) {
      setErrors(prev => ({
        ...prev,
        number_of_guests: `Not enough tables available. Maximum ${availableTables * 2} guests for this time.`
      }));
      
      // Set to maximum available
      setFormData(prev => ({
        ...prev,
        number_of_tables: availableTables
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        number_of_tables: requiredTables
      }));
      
      // Clear the error if it exists
      if (errors.number_of_guests) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.number_of_guests;
          return newErrors;
        });
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const currentDate = new Date();
    const selectedDate = new Date(formData.date);

    // Date validation
    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else if (selectedDate < currentDate.setHours(0, 0, 0, 0)) {
      newErrors.date = 'Date cannot be in the past';
    }

    // Time validation
    if (!formData.time) {
      newErrors.time = 'Time is required';
    }

    // Guest count validation
    if (!formData.number_of_guests) {
      newErrors.number_of_guests = 'Number of guests is required';
    } else {
      const guestCount = parseInt(formData.number_of_guests);
      if (isNaN(guestCount) || guestCount < 1 || guestCount > 60) {
        newErrors.number_of_guests = 'Number of guests must be between 1 and 60';
      }
    }

    // Guest information validation
    if (!formData.guest_first_name?.trim()) {
      newErrors.guest_first_name = 'First name is required';
    }

    if (!formData.guest_last_name?.trim()) {
      newErrors.guest_last_name = 'Last name is required';
    }

    if (!formData.guest_email?.trim()) {
      newErrors.guest_email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.guest_email)) {
      newErrors.guest_email = 'Please enter a valid email address';
    }

    if (!formData.guest_phone?.trim()) {
      newErrors.guest_phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare reservation data
      const reservationData = {
        reservation_date: formData.date,
        slot_start: formatTimeToAMPM(formData.time),
        number_of_guests: parseInt(formData.number_of_guests),
        number_of_tables: parseInt(formData.number_of_tables),
        comments_for_admin: formData.comments_for_admin || '',
        guest_first_name: formData.guest_first_name,
        guest_last_name: formData.guest_last_name,
        guest_email: formData.guest_email,
        guest_phone: formData.guest_phone
      };
      
      // Use the guest endpoint
      const reservationResponse = await reservationAPI.createGuestReservation(reservationData);
      
      // Store the reservation data in localStorage for the confirmation page
      localStorage.setItem('currentReservation', JSON.stringify({
        ...reservationData,
        id: reservationResponse.reservation?.id || 'pending',
        display_id: reservationResponse.reservation?.display_id || 'pending',
        status: reservationResponse.reservation?.status || 'pending',
        firstName: formData.guest_first_name,
        lastName: formData.guest_last_name,
        email: formData.guest_email,
        phone: formData.guest_phone,
        createdAt: new Date().toISOString()
      }));

      // Navigate to the summary page
      navigate('/reservation-summary');
    } catch (error) {
      console.error('Error submitting reservation:', error);
      setErrors(prev => ({
        ...prev,
        submit: error.response?.data?.error || 'Failed to submit reservation. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIncrement = () => {
    const currentGuests = parseInt(formData.number_of_guests) || 0;
    if (currentGuests < 60) {
      const newValue = currentGuests + 1;
      setFormData(prev => ({
        ...prev,
        number_of_guests: newValue
      }));
      
      if (formData.time) {
        calculateRequiredTables(formData.time, newValue);
      }
    }
  };

  const handleDecrement = () => {
    const currentGuests = parseInt(formData.number_of_guests) || 2;
    if (currentGuests > 1) {
      const newValue = currentGuests - 1;
      setFormData(prev => ({
        ...prev,
        number_of_guests: newValue
      }));
      
      if (formData.time) {
        calculateRequiredTables(formData.time, newValue);
      }
    }
  };

  return (
    <div className="reservation-container">
      <div className="reservation-card">
        <div className="reservation-header">
          <h2>Guest Reservation</h2>
          <p className="subtitle">Book your table for a memorable dining experience</p>
        </div>

        {errors.submit && (
          <div className="error-message global">
            <i className="fas fa-exclamation-circle"></i>
            {errors.submit}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="reservation-form">
          <div className="form-section">
            <h3>Reservation Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">
                  <i className="fas fa-calendar"></i>
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={errors.date ? 'error' : ''}
                />
                {errors.date && <span className="error-text">{errors.date}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="time">
                  <i className="fas fa-clock"></i>
                  Time *
                </label>
                <select
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className={errors.time ? 'error' : ''}
                  disabled={!formData.date || loadingTimeSlots}
                >
                  <option value="">Select time</option>
                  {availableTimes.map(time => (
                    <option key={time.value} value={time.value}>
                      {formatTimeToAMPM(time.value)} ({time.availableTables} tables available)
                    </option>
                  ))}
                </select>
                {loadingTimeSlots && <span className="loading-text">Loading available times...</span>}
                {errors.time && <span className="error-text">{errors.time}</span>}
                {errors.timeSlots && <span className="error-text">{errors.timeSlots}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="number_of_guests">
                <i className="fas fa-users"></i>
                Number of Guests *
              </label>
              <div className="guest-input-container">
                <button
                  type="button"
                  className="guest-control"
                  onClick={handleDecrement}
                >
                  <i className="fas fa-minus"></i>
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  id="number_of_guests"
                  name="number_of_guests"
                  value={formData.number_of_guests}
                  onChange={handleGuestChange}
                  className={errors.number_of_guests ? 'error' : ''}
                />
                <button
                  type="button"
                  className="guest-control"
                  onClick={handleIncrement}
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
              {errors.number_of_guests && <span className="error-text">{errors.number_of_guests}</span>}
              <span className="input-hint">Maximum 60 guests</span>
            </div>

            <div className="form-group">
              <label htmlFor="comments_for_admin">
                <i className="fas fa-comment-alt"></i>
                Special Requests
              </label>
              <textarea
                id="comments_for_admin"
                name="comments_for_admin"
                value={formData.comments_for_admin}
                onChange={handleInputChange}
                placeholder="Any additional requests or notes?"
                rows="4"
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Guest Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="guest_first_name">
                  <i className="fas fa-user"></i>
                  First Name *
                </label>
                <input
                  type="text"
                  id="guest_first_name"
                  name="guest_first_name"
                  value={formData.guest_first_name}
                  onChange={handleInputChange}
                  className={errors.guest_first_name ? 'error' : ''}
                  placeholder="Enter your first name"
                />
                {errors.guest_first_name && <span className="error-text">{errors.guest_first_name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="guest_last_name">
                  <i className="fas fa-user"></i>
                  Last Name *
                </label>
                <input
                  type="text"
                  id="guest_last_name"
                  name="guest_last_name"
                  value={formData.guest_last_name}
                  onChange={handleInputChange}
                  className={errors.guest_last_name ? 'error' : ''}
                  placeholder="Enter your last name"
                />
                {errors.guest_last_name && <span className="error-text">{errors.guest_last_name}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="guest_email">
                <i className="fas fa-envelope"></i>
                Email Address *
              </label>
              <input
                type="email"
                id="guest_email"
                name="guest_email"
                value={formData.guest_email}
                onChange={handleInputChange}
                className={errors.guest_email ? 'error' : ''}
                placeholder="Enter your email"
              />
              {errors.guest_email && <span className="error-text">{errors.guest_email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="guest_phone">
                <i className="fas fa-phone"></i>
                Phone Number *
              </label>
              <input
                type="tel"
                id="guest_phone"
                name="guest_phone"
                value={formData.guest_phone}
                onChange={handleInputChange}
                className={errors.guest_phone ? 'error' : ''}
                placeholder="Enter your phone number"
              />
              {errors.guest_phone && <span className="error-text">{errors.guest_phone}</span>}
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="loading-spinner"></span>
                  Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-check"></i>
                  Confirm Reservation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GuestReservation;
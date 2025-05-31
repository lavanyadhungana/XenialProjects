// src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { customerAPI } from '../services/apiService';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    email_address: '',
    phone_number: '',
    dietary_requirements: ''
  });

  const [errors, setErrors] = useState({});
  const [editedData, setEditedData] = useState(userData);

  useEffect(() => {
    // Fetch user details from API
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const data = await customerAPI.getMyDetails();
        setUserData(data);
        setEditedData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setMessage({
          text: 'Failed to load your profile data. Please try again later.',
          type: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!editedData.first_name?.trim()) newErrors.first_name = 'First name is required';
    if (!editedData.last_name?.trim()) newErrors.last_name = 'Last name is required';
    if (!editedData.email_address?.trim()) {
      newErrors.email_address = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(editedData.email_address)) {
      newErrors.email_address = 'Invalid email format';
    }
    if (!editedData.phone_number?.trim()) {
      newErrors.phone_number = 'Phone number is required';
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      setMessage({ 
        text: 'Please fix the errors before submitting.', 
        type: 'error' 
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const result = await customerAPI.updateMyAccount(editedData);
      
      setUserData(result.customerDetails);
      setMessage({ 
        text: 'Profile updated successfully!', 
        type: 'success' 
      });
      
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        text: error.response?.data?.error || 'Failed to update profile. Please try again.', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  if (isLoading && !userData.first_name) {
    return (
      <div className="profile-container loading">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h2>Profile Settings</h2>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.type === 'success' ? (
              <i className="fas fa-check-circle"></i>
            ) : (
              <i className="fas fa-exclamation-circle"></i>
            )}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="section-header">
            <h3>Personal Information</h3>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={editedData.first_name || ''}
                onChange={handleChange}
                className={errors.first_name ? 'error' : ''}
              />
              {errors.first_name && <span className="error-message">{errors.first_name}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={editedData.last_name || ''}
                onChange={handleChange}
                className={errors.last_name ? 'error' : ''}
              />
              {errors.last_name && <span className="error-message">{errors.last_name}</span>}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="email_address">Email</label>
            <input
              type="email"
              id="email_address"
              name="email_address"
              value={editedData.email_address || ''}
              onChange={handleChange}
              className={errors.email_address ? 'error' : ''}
            />
            {errors.email_address && <span className="error-message">{errors.email_address}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="phone_number">Phone Number</label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={editedData.phone_number || ''}
              onChange={handleChange}
              className={errors.phone_number ? 'error' : ''}
              placeholder="e.g., +1 234-567-8900"
            />
            {errors.phone_number && <span className="error-message">{errors.phone_number}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="dietary_requirements">Dietary Requirements</label>
            <textarea
              id="dietary_requirements"
              name="dietary_requirements"
              value={editedData.dietary_requirements || ''}
              onChange={handleChange}
              rows="3"
              placeholder="Any dietary restrictions or preferences? (e.g., vegetarian, gluten-free, allergies)"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? (
                <><span className="loading-spinner"></span> Saving...</>
              ) : (
                <><i className="fas fa-save"></i> Save Changes</>
              )}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <i className="fas fa-times"></i> Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
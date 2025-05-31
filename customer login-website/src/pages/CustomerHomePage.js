// src/pages/CustomerHomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './CustomerHomePage.css';

const CustomerHomePage = () => {
  const { currentUser } = useAuth();

  return (
    <div className="home-container">
      <div className="hero-section" style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/background.jpg)` }}>
        <div className="hero-content">
          <h1>Welcome to Marko Italian Restaurant</h1>
          <p>Experience authentic Italian cuisine in a warm and inviting atmosphere</p>
          <div className="glass-container">
            <div className="hero-buttons">
              {!currentUser ? (
                <>
                  <Link to="/login" className="btn btn-primary">
                    Login
                  </Link>
                  <Link to="/signup" className="btn btn-secondary">
                    Signup
                  </Link>
                  <Link to="/guest-reservation" className="btn btn-outline">
                    Book as Guest
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className="btn btn-primary">
                    My Dashboard
                  </Link>
                  <Link to="/customer-reservation" className="btn btn-secondary">
                    Make a Reservation
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerHomePage;
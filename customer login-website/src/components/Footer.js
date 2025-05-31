import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer>
      <div className="footer-content">
        <div className="restaurant-info">
          <h3>Marko Italian Restaurant</h3>
          <p>123 Italian Lane</p>
          <p>Sydney NSW 2000, Australia</p>
          <p>Phone: +61-2-9876-5432</p>
          <p>Email: info@markoitalian.com</p>
          <div className="social-links">
            <a href="#"><i className="fab fa-facebook"></i></a>
            <a href="#"><i className="fab fa-instagram"></i></a>
            <a href="#"><i className="fab fa-twitter"></i></a>
          </div>
        </div>
        <div className="hours">
          <h3>Opening Hours</h3>
          <p>Sunday - Wednesday: 5:00 PM - 10:00 PM</p>
          <p>Thursday: 10:00 AM - 11:30 PM</p>
          <p>Friday - Saturday: 5:00 PM - 11:00 PM</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2024 Marko Italian Restaurant. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact Us</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
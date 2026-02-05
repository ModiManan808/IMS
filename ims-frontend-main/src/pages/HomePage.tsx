import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <div className="home-container">
        <h1>Intern Management System</h1>
        <p className="subtitle">National Forensic Sciences University - CoE-CS</p>
        
        <div className="action-cards">
          <div className="action-card">
            <h2>Apply for Internship</h2>
            <p>Submit your application with Letter of Intent</p>
            <Link to="/apply" className="action-button">
              Apply Now
            </Link>
          </div>
          
          <div className="action-card">
            <h2>Already Applied?</h2>
            <p>Login to check your status or complete enrollment</p>
            <Link to="/login" className="action-button">
              Login
            </Link>
          </div>
        </div>

        <div className="info-section">
          <h3>Application Process</h3>
          <ol>
            <li>Submit your application with LOI (Letter of Intent)</li>
            <li>Wait for admin approval</li>
            <li>Receive enrollment link via email</li>
            <li>Complete enrollment form with required documents</li>
            <li>Get approved and start your internship</li>
            <li>Submit daily status reports</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default HomePage;

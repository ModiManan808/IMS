import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './Header.css';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getCurrentUser());
  const [showDropdown, setShowDropdown] = useState(false);

  // Update user when auth changes
  useEffect(() => {
    const updateUser = () => {
      setUser(authService.getCurrentUser());
    };

    const unsubscribe = authService.onAuthChange(updateUser);
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        <img src="/nfsu-logo.png" alt="NFSU Logo" className="nfsu-logo" />
        <div className="nfsu-info">
          <h1>National Forensic Sciences University</h1>
          <p>Knowledge | Wisdom | Fulfilment</p>
          <p className="institution-note">
            An Institution of National Importance (Ministry of Home Affairs, Government of India)
          </p>
        </div>
      </div>
      <div className="header-center">
        <div className="search-bar">
          <input type="text" placeholder="E-Content Search" />
          <span className="search-icon">🔍</span>
        </div>
      </div>
      <div className="header-right">
        <div className="user-profile" onClick={() => setShowDropdown(!showDropdown)}>
          <div className="profile-picture">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <span className="user-name">{user?.fullName || 'User'}</span>
          <span className="dropdown-arrow">▼</span>
          {showDropdown && (
            <div className="dropdown-menu">
              {user?.role?.startsWith('Intern_') && (
                <div className="dropdown-item" onClick={() => navigate('/intern/profile')}>
                  Profile
                </div>
              )}
              <div className="dropdown-item" onClick={handleLogout}>
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

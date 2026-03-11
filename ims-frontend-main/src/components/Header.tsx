import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './Header.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/** Fetch the passport photo as a blob URL (with JWT auth header) */
async function fetchPhotoBlob(relativePath: string): Promise<string | null> {
  try {
    const token = localStorage.getItem('token');
    const normalized = relativePath.replace(/\\/g, '/');
    const filePart = normalized.replace(/^uploads\//, '');
    const response = await fetch(`${API_URL}/api/files/${filePart}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    const blob = await response.blob();
    // Only accept image blobs
    if (!blob.type.startsWith('image/')) return null;
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

interface HeaderProps {
  isPublic?: boolean;
}

const Header: React.FC<HeaderProps> = ({ isPublic = false }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getCurrentUser());
  const [showDropdown, setShowDropdown] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const photoBlobRef = useRef<string | null>(null);

  // Revoke old blob URL to prevent memory leaks
  const revokePhoto = () => {
    if (photoBlobRef.current) {
      URL.revokeObjectURL(photoBlobRef.current);
      photoBlobRef.current = null;
    }
  };

  useEffect(() => {
    return () => revokePhoto(); // cleanup on unmount
  }, []);

  // Load user photo whenever user changes (only for interns who have a passportPhoto)
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);

    if (currentUser?.role?.startsWith('Intern_') && currentUser?.passportPhoto) {
      fetchPhotoBlob(currentUser.passportPhoto).then((url) => {
        revokePhoto();
        setPhotoUrl(url);
        photoBlobRef.current = url;
      });
    } else {
      revokePhoto();
      setPhotoUrl(null);
    }
  }, []);

  // Also refresh when auth changes
  const updateUser = () => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);

    if (currentUser?.role?.startsWith('Intern_') && currentUser?.passportPhoto) {
      fetchPhotoBlob(currentUser.passportPhoto).then((url) => {
        revokePhoto();
        setPhotoUrl(url);
        photoBlobRef.current = url;
      });
    } else {
      revokePhoto();
      setPhotoUrl(null);
    }
  };

  useEffect(() => {
    const unsubscribe = authService.onAuthChange(updateUser);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    revokePhoto();
    setPhotoUrl(null);
    await authService.logout();
    navigate('/login');
  };

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev);
  };

  const initials = user?.fullName?.charAt(0)?.toUpperCase() || 'U';

  return (
    <header className="header">
      <div className="header-left">
        <Link to="/" className="header-logo-link" aria-label="Go to home page">
          <img src="/nfsu-logo.png" alt="NFSU Logo" className="nfsu-logo" />
        </Link>
      </div>
      <div className="header-center">
        <span className="header-title">Centre of Excellence Cyber Security - NFSU</span>
      </div>

      <div className="header-right">
        <img src="/coecs-logo.png" alt="CoE-CS Logo" className="coecs-logo" />
        {!isPublic && (
          <div
            className="user-profile"
            onClick={toggleDropdown}
            role="button"
            aria-haspopup="true"
            aria-expanded={showDropdown}
            aria-controls="header-user-menu"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleDropdown();
              }
            }}
          >
            <div className="profile-picture">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={`${user?.fullName || 'User'}'s photo`}
                  className="profile-picture-img"
                />
              ) : (
                initials
              )}
            </div>
            <span className="user-name">{user?.fullName || 'User'}</span>
            <span className="dropdown-arrow">▼</span>
            {showDropdown && (
              <div className="dropdown-menu" id="header-user-menu" role="menu" aria-label="User menu">
                {user?.role?.startsWith('Intern_') && (
                  <button
                    type="button"
                    className="dropdown-item"
                    role="menuitem"
                    onClick={() => navigate('/intern/profile')}
                  >
                    Profile
                  </button>
                )}
                <button
                  type="button"
                  className="dropdown-item"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

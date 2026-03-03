import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
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

const Header: React.FC = () => {
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

  const initials = user?.fullName?.charAt(0)?.toUpperCase() || 'U';

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
          <Search className="search-icon" size={18} aria-hidden="true" />
        </div>
      </div>
      <div className="header-right">
        <div
          className="user-profile"
          onClick={() => setShowDropdown(!showDropdown)}
          role="button"
          aria-haspopup="true"
          aria-expanded={showDropdown}
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setShowDropdown(!showDropdown)}
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

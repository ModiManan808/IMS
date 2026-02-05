import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();
  const [user, setUser] = useState(authService.getCurrentUser());

  // Update user when auth changes
  useEffect(() => {
    const updateUser = () => {
      setUser(authService.getCurrentUser());
    };

    const unsubscribe = authService.onAuthChange(updateUser);
    return unsubscribe;
  }, []);

  const isAdmin = user?.role === 'Admin';

  const adminMenuItems = [
    { path: '/admin/fresh', label: 'NEW Fresh', icon: '📄' },
    { path: '/admin/pending', label: 'Pending', icon: '⏳' },
    { path: '/admin/ongoing', label: 'Approved & Ongoing', icon: '✅' },
    { path: '/admin/rejected', label: 'Rejected', icon: '❌' },
    { path: '/admin/completed', label: 'Completed', icon: '🎓' },
  ];

  const internMenuItems = [
    { path: '/intern/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/intern/profile', label: 'Profile', icon: '👤' },
  ];

  const menuItems = isAdmin ? adminMenuItems : internMenuItems;

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={onToggle} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${location.pathname === item.path || (item.path === '/admin/fresh' && location.pathname === '/admin') ? 'active' : ''}`}
              onClick={() => window.innerWidth < 768 && onToggle()}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;

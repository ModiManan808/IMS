import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import {
  FileText, Clock, CheckCircle, XCircle, GraduationCap,
  LayoutDashboard, User,
} from 'lucide-react';
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

  const adminMenuItems: { path: string; label: string; icon: React.ReactNode }[] = [
    { path: '/admin/newapplication', label: 'New Application', icon: <FileText size={18} aria-hidden="true" /> },
    { path: '/admin/pending', label: 'Pending', icon: <Clock size={18} aria-hidden="true" /> },
    { path: '/admin/ongoing', label: 'Approved & Ongoing', icon: <CheckCircle size={18} aria-hidden="true" /> },
    { path: '/admin/rejected', label: 'Rejected', icon: <XCircle size={18} aria-hidden="true" /> },
    { path: '/admin/completed', label: 'Completed', icon: <GraduationCap size={18} aria-hidden="true" /> },
  ];

  const internMenuItems: { path: string; label: string; icon: React.ReactNode }[] = [
    { path: '/intern/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} aria-hidden="true" /> },
    { path: '/intern/profile', label: 'Profile', icon: <User size={18} aria-hidden="true" /> },
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
              className={`sidebar-item ${location.pathname === item.path || (item.path === '/admin/newapplication' && location.pathname === '/admin') ? 'active' : ''}`}
              onClick={() => window.innerWidth < 768 && onToggle()}
            >
              <span className="sidebar-icon" aria-hidden="true">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;

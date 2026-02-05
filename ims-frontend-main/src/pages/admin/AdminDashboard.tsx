import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import './AdminDashboard.css';

const AdminDashboard: React.FC = () => {
  const [freshCount, setFreshCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [ongoingCount, setOngoingCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCounts();
  }, []);

  const loadCounts = async () => {
    try {
      const [fresh, pending, ongoing, rejected, completed] = await Promise.all([
        adminService.getFreshApplications(),
        adminService.getPendingApplications(),
        adminService.getOngoingInterns(),
        adminService.getRejectedApplications(),
        adminService.getCompletedInterns(),
      ]);
      setFreshCount(fresh.data.length);
      setPendingCount(pending.data.length);
      setOngoingCount(ongoing.data.length);
      setRejectedCount(rejected.data.length);
      setCompletedCount(completed.data.length);
    } catch (error) {
      console.error('Error loading counts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card fresh">
          <div className="stat-icon">🆕</div>
          <div className="stat-info">
            <h3>Fresh</h3>
            <p className="stat-number">{freshCount}</p>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>Pending</h3>
            <p className="stat-number">{pendingCount}</p>
          </div>
        </div>
        <div className="stat-card ongoing">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>Approved & Ongoing</h3>
            <p className="stat-number">{ongoingCount}</p>
          </div>
        </div>
        <div className="stat-card rejected">
          <div className="stat-icon">❌</div>
          <div className="stat-info">
            <h3>Rejected</h3>
            <p className="stat-number">{rejectedCount}</p>
          </div>
        </div>
        <div className="stat-card completed">
          <div className="stat-icon">🎓</div>
          <div className="stat-info">
            <h3>Completed</h3>
            <p className="stat-number">{completedCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

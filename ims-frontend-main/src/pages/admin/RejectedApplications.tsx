import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Intern } from '../../types';
import './RejectedApplications.css';

const RejectedApplications: React.FC = () => {
  const [applications, setApplications] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const response = await adminService.getRejectedApplications();
      setApplications(response.data);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="rejected-applications">
      <h1>Rejected Applications</h1>
      {applications.length === 0 ? (
        <div className="empty-state">No rejected applications</div>
      ) : (
        <div className="applications-list">
          {applications.map((app) => (
            <div key={app.id} className="application-card">
              <div className="card-header">
                <h3>{app.fullName}</h3>
                <span className="enrollment-no">{app.enrollmentNo}</span>
              </div>
              <div className="card-body">
                <p><strong>Email:</strong> {app.personalEmail}</p>
                <p><strong>Mobile:</strong> {app.mobileNo}</p>
                {app.rejectionReason && (
                  <p><strong>Reason:</strong> {app.rejectionReason}</p>
                )}
                <p><strong>Rejected:</strong> {new Date(app.updatedAt || '').toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RejectedApplications;

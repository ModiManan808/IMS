import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Intern } from '../../types';
import { Search } from 'lucide-react';
import { formatDate } from '../../utils/dateFormat';
import './RejectedApplications.css';

const RejectedApplications: React.FC = () => {
  const [applications, setApplications] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const filtered = applications.filter((a) =>
    a.fullName.toLowerCase().includes(search.toLowerCase()) ||
    a.enrollmentNo?.toLowerCase().includes(search.toLowerCase()) ||
    a.personalEmail?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="rejected-applications">
      <h1>Rejected Applications</h1>

      {/* ── Search ── */}
      <div className="search-bar-wrapper">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          className="search-bar"
          placeholder="Search by name, enrollment no or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">{search ? 'No applications match your search' : 'No rejected applications'}</div>
      ) : (
        <div className="applications-list">
          {filtered.map((app) => (
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
                <p><strong>Rejected:</strong> {formatDate(app.updatedAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RejectedApplications;

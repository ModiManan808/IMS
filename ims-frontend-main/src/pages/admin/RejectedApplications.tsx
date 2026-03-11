import React, { useState, useEffect, useRef } from 'react';
import { adminService } from '../../services/adminService';
import { Intern } from '../../types';
import { Search } from 'lucide-react';
import { formatDate } from '../../utils/dateFormat';
import './RejectedApplications.css';

const RejectedApplications: React.FC = () => {
  const [applications, setApplications] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const searchInitialized = useRef(false);
  const requestSeq = useRef(0);

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    if (!searchInitialized.current) {
      searchInitialized.current = true;
      return;
    }

    const timer = setTimeout(() => {
      loadApplications(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const loadApplications = async (query?: string) => {
    const seq = ++requestSeq.current;
    try {
      const response = await adminService.getRejectedApplications(query);
      if (seq !== requestSeq.current) return; // stale response — discard
      setApplications(response.data);
    } catch (error) {
      if (seq !== requestSeq.current) return;
      console.error('Error loading applications:', error);
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  };

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

      {applications.length === 0 ? (
        <div className="empty-state">{search ? 'No applications match your search' : 'No rejected applications'}</div>
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

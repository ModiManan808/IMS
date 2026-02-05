import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Intern } from '../../types';
import './PendingApplications.css';

const PendingApplications: React.FC = () => {
  const [applications, setApplications] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    applicationNo: '',
    dateOfJoining: '',
    dateOfLeaving: '',
  });

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const response = await adminService.getPendingApplications();
      setApplications(response.data);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboard = async () => {
    if (!selectedId) return;

    // Validate dates
    if (!formData.applicationNo || !formData.dateOfJoining || !formData.dateOfLeaving) {
      alert('All fields are required');
      return;
    }

    const joiningDate = new Date(formData.dateOfJoining);
    const leavingDate = new Date(formData.dateOfLeaving);

    if (joiningDate >= leavingDate) {
      alert('Date of Leaving must be after Date of Joining');
      return;
    }

    try {
      await adminService.finalizeOnboarding({
        id: selectedId,
        ...formData,
      });
      alert('Intern onboarded successfully!');
      loadApplications();
      setSelectedId(null);
      setFormData({ applicationNo: '', dateOfJoining: '', dateOfLeaving: '' });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to onboard intern');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="pending-applications">
      <h1>Pending Applications</h1>
      {applications.length === 0 ? (
        <div className="empty-state">No pending applications</div>
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
                <p><strong>Program:</strong> {app.program}</p>
                <p><strong>Department:</strong> {app.department}</p>
                <p><strong>Semester:</strong> {app.semester}</p>
              </div>
              <div className="card-actions">
                <button
                  className="action-button"
                  onClick={() => setSelectedId(app.id)}
                >
                  Approve & Onboard
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedId && (
        <div className="onboard-modal">
          <div className="modal-content">
            <h2>Finalize Onboarding</h2>
            <div className="form-group">
              <label>Application Number *</label>
              <input
                type="text"
                value={formData.applicationNo}
                onChange={(e) => setFormData({ ...formData, applicationNo: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Date of Joining *</label>
              <input
                type="date"
                value={formData.dateOfJoining}
                onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Date of Leaving *</label>
              <input
                type="date"
                value={formData.dateOfLeaving}
                onChange={(e) => setFormData({ ...formData, dateOfLeaving: e.target.value })}
                required
              />
            </div>
            <div className="modal-actions">
              <button onClick={handleOnboard} className="submit-button">
                Approve
              </button>
              <button onClick={() => setSelectedId(null)} className="cancel-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApplications;

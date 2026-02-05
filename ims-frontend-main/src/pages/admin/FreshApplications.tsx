import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { Intern } from '../../types';
import './FreshApplications.css';

const FreshApplications: React.FC = () => {
  const [applications, setApplications] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [decision, setDecision] = useState<'Approved' | 'Rejected' | 'Special Approval Required'>('Approved');
  const [rejectionReason, setRejectionReason] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const response = await adminService.getFreshApplications();
      setApplications(response.data);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async () => {
    if (!selectedId) return;

    // Confirmation for rejection
    if (decision === 'Rejected') {
      if (!window.confirm('Are you sure you want to reject this application? This action cannot be undone.')) {
        return;
      }
    }

    setSubmitting(true);
    try {
      await adminService.decideOnFresh({
        id: selectedId,
        decision,
        rejectionReason: decision === 'Rejected' ? rejectionReason : undefined,
        specialApprovalNotes: decision === 'Special Approval Required' ? specialNotes : undefined,
      });
      alert('Decision recorded successfully!');
      loadApplications();
      setSelectedId(null);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to record decision');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="fresh-applications">
      <h1>Fresh Applications</h1>
      {applications.length === 0 ? (
        <div className="empty-state">No fresh applications</div>
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
                <p><strong>Applied:</strong> {new Date(app.createdAt || '').toLocaleDateString()}</p>
              </div>
              <div className="card-actions">
                <button
                  className="action-button"
                  onClick={() => setSelectedId(app.id)}
                >
                  Make Decision
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedId && (
        <div className="decision-modal">
          <div className="modal-content">
            <h2>Make Decision</h2>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  value="Approved"
                  checked={decision === 'Approved'}
                  onChange={(e) => setDecision(e.target.value as any)}
                />
                Approved
              </label>
              <label>
                <input
                  type="radio"
                  value="Rejected"
                  checked={decision === 'Rejected'}
                  onChange={(e) => setDecision(e.target.value as any)}
                />
                Rejected
              </label>
              <label>
                <input
                  type="radio"
                  value="Special Approval Required"
                  checked={decision === 'Special Approval Required'}
                  onChange={(e) => setDecision(e.target.value as any)}
                />
                Special Approval Required
              </label>
            </div>
            {decision === 'Rejected' && (
              <div className="form-group">
                <label>Rejection Reason</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}
            {decision === 'Special Approval Required' && (
              <div className="form-group">
                <label>Special Approval Notes</label>
                <textarea
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  rows={3}
                />
              </div>
            )}
            <div className="modal-actions">
              <button onClick={handleDecision} className="submit-button" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Decision'}
              </button>
              <button onClick={() => setSelectedId(null)} className="cancel-button" disabled={submitting}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreshApplications;

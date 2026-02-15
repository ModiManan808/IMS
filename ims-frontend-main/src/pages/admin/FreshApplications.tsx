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
  const [loiVerified, setLoiVerified] = useState<'Pending' | 'Verified' | 'Rejected'>('Verified');
  const [loiNotes, setLoiNotes] = useState('');

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

  const handleLOIVerification = async () => {
    if (!selectedId) return;

    const app = applications.find(a => a.id === selectedId);
    if (!app) return;

    setSubmitting(true);
    try {
      await adminService.verifyLOI({
        id: selectedId,
        loiVerified,
        loiVerificationNotes: loiNotes,
      });
      alert('LOI verification status updated successfully!');
      loadApplications();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to verify LOI');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewLOI = async (filePath: string) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5586';
      const token = localStorage.getItem('token');

      // Remove 'uploads/' prefix if it exists since backend adds it automatically
      const cleanPath = filePath.replace(/^uploads[\/\\]/, '');

      const response = await fetch(`${API_URL}/api/files/${cleanPath}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');

      // Clean up the blob URL after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error viewing LOI:', error);
      alert('Failed to open LOI document');
    }
  };

  const getLoiBadge = (status?: string) => {
    switch (status) {
      case 'Verified':
        return <span className="loi-badge verified">✅ LOI Verified</span>;
      case 'Rejected':
        return <span className="loi-badge rejected">❌ LOI Rejected</span>;
      default:
        return <span className="loi-badge pending">⏳ LOI Pending</span>;
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
                {getLoiBadge(app.loiVerified)}
              </div>
              <div className="card-actions">
                <button
                  className="action-button"
                  onClick={() => {
                    setSelectedId(app.id);
                    setLoiVerified(app.loiVerified || 'Pending');
                    setLoiNotes(app.loiVerificationNotes || '');
                  }}
                >
                  Review Application
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedId && (() => {
        const app = applications.find(a => a.id === selectedId);
        return (
          <div className="decision-modal">
            <div className="modal-content">
              <h2>Review Application - {app?.fullName}</h2>

              {/* LOI Verification Section */}
              <div className="loi-section">
                <h3>LOI Document</h3>
                {app?.loiFile && (
                  <div className="loi-viewer">
                    <button
                      onClick={() => app.loiFile && handleViewLOI(app.loiFile)}
                      className="view-loi-button"
                    >
                      📄 View LOI Document
                    </button>
                  </div>
                )}
                <div className="form-group">
                  <label>LOI Verification Status</label>
                  <select
                    value={loiVerified}
                    onChange={(e) => setLoiVerified(e.target.value as any)}
                    className="form-select"
                  >
                    <option value="Pending">⏳ Pending</option>
                    <option value="Verified">✅ Verified</option>
                    <option value="Rejected">❌ Rejected</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Verification Notes</label>
                  <textarea
                    value={loiNotes}
                    onChange={(e) => setLoiNotes(e.target.value)}
                    rows={2}
                    placeholder="Add notes about LOI verification..."
                  />
                </div>
                <button
                  onClick={handleLOIVerification}
                  className="verify-button"
                  disabled={submitting}
                >
                  {submitting ? 'Updating...' : 'Update LOI Status'}
                </button>
              </div>

              <hr style={{ margin: '25px 0', border: '1px solid #e0e0e0' }} />

              {/* Application Decision Section */}
              <h3>Application Decision</h3>
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
        );
      })()}
    </div>
  );
};

export default FreshApplications;

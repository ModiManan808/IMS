import React, { useState, useEffect, useRef, useContext } from 'react';
import { adminService } from '../../services/adminService';
import { OngoingIntern } from '../../types';
import { Users, FileText, CalendarCheck, Search, Edit2, Save, X, Mail, MailCheck, RefreshCw } from 'lucide-react';
import { formatDate } from '../../utils/dateFormat';
import { ToastContext } from '../../context/ToastContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import './OngoingInterns.css';

interface Stats {
  totalReports: number;
  todayReports: number;
  ongoingInterns: number;
}

const OngoingInterns: React.FC = () => {
  const [interns, setInterns] = useState<OngoingIntern[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIntern, setSelectedIntern] = useState<OngoingIntern | null>(null);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editEndDate, setEditEndDate] = useState('');
  const [updating, setUpdating] = useState(false);
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [pendingCredentialResend, setPendingCredentialResend] = useState<OngoingIntern | null>(null);
  const { showSuccess, showError } = useContext(ToastContext);
  const searchInitialized = useRef(false);
  const requestSeq = useRef(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!searchInitialized.current) {
      searchInitialized.current = true;
      return;
    }

    const timer = setTimeout(() => {
      loadInterns(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const loadData = async () => {
    try {
      const [statsRes] = await Promise.all([
        adminService.getReportStatistics(),
      ]);
      setStats(statsRes.data);
      await loadInterns();
    } catch (error) {
      console.error('Error loading ongoing interns:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInterns = async (query?: string) => {
    const seq = ++requestSeq.current;
    try {
      const internsRes = await adminService.getOngoingInterns(query);
      if (seq !== requestSeq.current) return; // stale — discard
      setInterns(internsRes.data);
    } catch (error) {
      if (seq !== requestSeq.current) return;
      console.error('Error loading ongoing interns:', error);
    }
  };

  const handleUpdateEndDate = async () => {
    if (!selectedIntern || !editEndDate) return;

    const startDate = new Date(selectedIntern.startDate);
    const newEndDate = new Date(editEndDate);
    startDate.setHours(0, 0, 0, 0);
    newEndDate.setHours(0, 0, 0, 0);

    if (newEndDate <= startDate) {
      showError('End date must be after start date');
      return;
    }
    
    setUpdating(true);
    try {
      await adminService.updateInternDates({
        id: selectedIntern.id,
        dateOfLeaving: editEndDate
      });
      showSuccess('End date updated successfully');
      setIsEditing(false);
      // Update local state
      const updatedIntern = { ...selectedIntern, endDate: editEndDate };
      setSelectedIntern(updatedIntern);
      setInterns(interns.map(i => i.id === selectedIntern.id ? updatedIntern : i));
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to update end date');
    } finally {
      setUpdating(false);
    }
  };

  const resendCredentialEmail = async (id: number) => {
    setResendingId(id);
    try {
      const res = await adminService.resendEmail(id, 'credentials');
      showSuccess(res.data.message || 'Credentials email resent successfully!');
      await loadInterns(search);
    } catch (err: any) {
      showError(err.response?.data?.error || 'Failed to resend credentials email');
    } finally {
      setResendingId(null);
    }
  };

  const getCredentialEmailBadge = (intern: OngoingIntern) => {
    const isSent = intern.credentialEmailSent || Boolean(intern.credentialEmailSentAt);

    if (isSent) {
      const sentDate = intern.credentialEmailSentAt
        ? new Date(intern.credentialEmailSentAt).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
          })
        : null;
      return (
        <span className="email-badge email-badge--sent" title={sentDate ? `Sent on ${sentDate}` : 'Credentials sent'}>
          <MailCheck size={13} aria-hidden="true" />
          Credentials Sent{sentDate ? <>&middot; {sentDate}</> : null}
        </span>
      );
    }
    return (
      <span className="email-badge email-badge--unsent">
        <Mail size={13} aria-hidden="true" />
        Credentials Not Sent
      </span>
    );
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="ongoing-interns">
      <h1>Approved &amp; Ongoing Interns</h1>

      {/* ── Statistics Cards ──────────────────────────── */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card stat-card-blue">
            <div className="stat-card-icon"><Users size={22} /></div>
            <div className="stat-card-body">
              <span className="stat-card-value">{stats.ongoingInterns}</span>
              <span className="stat-card-label">Active Interns</span>
            </div>
          </div>
          <div className="stat-card stat-card-green">
            <div className="stat-card-icon"><FileText size={22} /></div>
            <div className="stat-card-body">
              <span className="stat-card-value">{stats.totalReports}</span>
              <span className="stat-card-label">Total Reports</span>
            </div>
          </div>
          <div className="stat-card stat-card-purple">
            <div className="stat-card-icon"><CalendarCheck size={22} /></div>
            <div className="stat-card-body">
              <span className="stat-card-value">{stats.todayReports}</span>
              <span className="stat-card-label">Reports Today</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Search ────────────────────────────────────── */}
      <div className="search-bar-wrapper">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          className="search-bar"
          placeholder="Search by name or application no…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Intern Cards ──────────────────────────────── */}
      {interns.length === 0 ? (
        <div className="empty-state">{search ? 'No interns match your search' : 'No ongoing interns'}</div>
      ) : (
        <div className="interns-list">
          {interns.map((intern) => (
            <div
              key={intern.id}
              className="intern-card"
              onClick={() => setSelectedIntern(intern)}
            >
              <h3 className="intern-link">{intern.hyperlinkText}</h3>
              <div className="intern-stats">
                <div className="stat">
                  <span className="stat-label">Start:</span>
                  <span className="stat-value">{formatDate(intern.startDate)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">End:</span>
                  <span className="stat-value">{formatDate(intern.endDate)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Days Since Start:</span>
                  <span className="stat-value">{intern.daysSinceStart}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Days Attended:</span>
                  <span className="stat-value">{intern.daysAttended}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Attendance:</span>
                  <span className="stat-value">{intern.attendancePct}%</span>
                </div>
              </div>
              <div className="card-email-row" onClick={(e) => e.stopPropagation()}>
                {getCredentialEmailBadge(intern)}
                <button
                  className="resend-email-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPendingCredentialResend(intern);
                  }}
                  disabled={resendingId === intern.id}
                  title="Resend credentials email (generates new password)"
                >
                  <RefreshCw size={13} aria-hidden="true" />
                  {resendingId === intern.id ? 'Sending...' : 'Resend'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Detail Modal ──────────────────────────────── */}
      {selectedIntern && (
        <div className="intern-details-modal" onClick={() => setSelectedIntern(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Intern Details</h2>
            <div className="details-section">
              <h3>{selectedIntern.name}</h3>
              <p><strong>Application No:</strong> {selectedIntern.applicationNo}</p>
              <p><strong>Start Date:</strong> {formatDate(selectedIntern.startDate)} <small>(Read-only)</small></p>
              <div className="edit-date-row">
                <p><strong>End Date:</strong> {isEditing ? (
                  <input 
                    type="date" 
                    value={editEndDate} 
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="edit-date-input"
                  />
                ) : formatDate(selectedIntern.endDate)}</p>
                {isEditing ? (
                  <div className="edit-actions">
                    <button onClick={handleUpdateEndDate} disabled={updating} className="save-date-btn" title="Save">
                      <Save size={16} />
                    </button>
                    <button onClick={() => setIsEditing(false)} className="cancel-date-btn" title="Cancel">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setEditEndDate(selectedIntern.endDate.split('T')[0]);
                      setIsEditing(true);
                    }} 
                    className="edit-date-btn"
                    title="Edit End Date"
                  >
                    <Edit2 size={16} />
                  </button>
                )}
              </div>
              <p><strong>Days Since Start:</strong> {selectedIntern.daysSinceStart}</p>
              <p><strong>Days Attended:</strong> {selectedIntern.daysAttended}</p>
              <p><strong>Attendance %:</strong> {selectedIntern.attendancePct}%</p>
            </div>
            <div className="reports-section">
              <h3>Daily Reports ({selectedIntern.reports.length})</h3>
              <div className="reports-list">
                {selectedIntern.reports.map((report) => (
                  <div key={report.id} className="report-card">
                    <div className="report-header">
                      <span className="report-date">{formatDate(report.reportDate)}</span>
                      <span className="report-domain">{report.domain}</span>
                    </div>
                    <p><strong>Work:</strong> {report.workDescription}</p>
                    {report.toolsUsed && <p><strong>Tools:</strong> {report.toolsUsed}</p>}
                    {report.issuesFaced && <p><strong>Issues:</strong> {report.issuesFaced}</p>}
                  </div>
                ))}
                {selectedIntern.reports.length === 0 && (
                  <p style={{ color: '#999', textAlign: 'center' }}>No reports submitted yet.</p>
                )}
              </div>
            </div>
            <button onClick={() => setSelectedIntern(null)} className="close-button">
              Close
            </button>
          </div>
        </div>
      )}

      {pendingCredentialResend && (
        <ConfirmDialog
          title="Resend credentials email?"
          message={`This will generate a new password for ${pendingCredentialResend.name || pendingCredentialResend.hyperlinkText} and replace the current one once the email is sent. Continue?`}
          type="warning"
          confirmText="Resend"
          cancelText="Cancel"
          onCancel={() => setPendingCredentialResend(null)}
          onConfirm={async () => {
            const intern = pendingCredentialResend;
            setPendingCredentialResend(null);
            if (!intern) return;
            await resendCredentialEmail(intern.id);
          }}
        />
      )}
    </div>
  );
};

export default OngoingInterns;

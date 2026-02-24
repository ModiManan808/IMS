import React, { useState, useEffect } from 'react';
import { internService } from '../../services/internService';
import { DailyReport } from '../../types';
import { Calendar, CheckCircle, Clock, ClipboardList } from 'lucide-react';
import './InternDashboard.css';

const InternDashboard: React.FC = () => {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [todayReportExists, setTodayReportExists] = useState(false);
  const [formData, setFormData] = useState({
    domain: '',
    workDescription: '',
    toolsUsed: '',
    issuesFaced: '',
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await internService.getReports();
      setReports(response.data);

      const today = new Date().toDateString();
      const hasToday = response.data.some((report: DailyReport) => {
        const reportDate = new Date(report.reportDate).toDateString();
        return reportDate === today;
      });
      setTodayReportExists(hasToday);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await internService.submitDailyReport(formData);
      alert('Daily report submitted successfully!');
      setFormData({ domain: '', workDescription: '', toolsUsed: '', issuesFaced: '' });
      setShowForm(false);
      loadReports();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to submit report');
    }
  };

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  if (loading) {
    return <div className="dash-loading">Loading...</div>;
  }

  return (
    <div className="intern-dashboard">

      {/* ── Page Header ─────────────────────────────── */}
      <div className="dash-header">
        <div className="dash-header-left">
          <h1>Daily Status Report</h1>
          <p className="dash-date"><Calendar size={14} aria-hidden="true" /> {todayStr}</p>
        </div>
        <div className="dash-header-right">
          {todayReportExists ? (
            <div className="dash-submitted-badge"><CheckCircle size={15} aria-hidden="true" /> Today's report submitted</div>
          ) : (
            <button
              className="dash-new-btn"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? '✕ Cancel' : '+ Submit New Report'}
            </button>
          )}
        </div>
      </div>

      {/* ── Stats Bar ───────────────────────────────── */}
      <div className="dash-stats">
        <div className="dash-stat-card">
          <span className="dash-stat-value">{reports.length}</span>
          <span className="dash-stat-label">Reports Submitted</span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-value">
            {todayReportExists
              ? <CheckCircle size={22} color="#2e7d32" aria-label="Submitted" />
              : <Clock size={22} color="#e65100" aria-label="Pending" />}
          </span>
          <span className="dash-stat-label">Today's Status</span>
        </div>
        <div className="dash-stat-card">
          <span className="dash-stat-value">
            {reports.length > 0
              ? new Date(reports[0].reportDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
              : '—'}
          </span>
          <span className="dash-stat-label">Latest Report</span>
        </div>
      </div>

      {/* ── New Report Form ──────────────────────────── */}
      {showForm && !todayReportExists && (
        <div className="dash-form-card">
          <h2 className="dash-form-title">Today's Report</h2>
          <form onSubmit={handleSubmit} className="dash-form">
            <div className="dash-form-group">
              <label>Domain *</label>
              <input
                type="text"
                placeholder="e.g. Cybersecurity, ML, Backend..."
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                required
              />
            </div>
            <div className="dash-form-group">
              <label>Work Description with Time *</label>
              <textarea
                placeholder="Describe what you worked on and when..."
                value={formData.workDescription}
                onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
                rows={4}
                required
              />
            </div>
            <div className="dash-form-row">
              <div className="dash-form-group">
                <label>Tools Used</label>
                <textarea
                  placeholder="Tools, frameworks, software..."
                  value={formData.toolsUsed}
                  onChange={(e) => setFormData({ ...formData, toolsUsed: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="dash-form-group">
                <label>Issues Faced / Remarks</label>
                <textarea
                  placeholder="Any blockers, observations..."
                  value={formData.issuesFaced}
                  onChange={(e) => setFormData({ ...formData, issuesFaced: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <button type="submit" className="dash-submit-btn">
              Submit Report
            </button>
          </form>
        </div>
      )}

      {/* ── Reports List ─────────────────────────────── */}
      <div className="dash-reports-section">
        <h2 className="dash-section-title">My Reports <span className="dash-count">{reports.length}</span></h2>
        {reports.length === 0 ? (
          <div className="dash-empty">
            <div className="dash-empty-icon"><ClipboardList size={48} strokeWidth={1.5} aria-hidden="true" /></div>
            <p className="dash-empty-title">No reports yet</p>
            <p className="dash-empty-sub">Submit your first daily report using the button above.</p>
          </div>
        ) : (
          <div className="dash-reports-grid">
            {reports.map((report) => (
              <div key={report.id} className="dash-report-card">
                <div className="dash-report-header">
                  <span className="dash-report-date">
                    {new Date(report.reportDate).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </span>
                  <span className="dash-report-domain">{report.domain}</span>
                </div>
                <p><strong>Work:</strong> {report.workDescription}</p>
                {report.toolsUsed && <p><strong>Tools:</strong> {report.toolsUsed}</p>}
                {report.issuesFaced && <p><strong>Issues:</strong> {report.issuesFaced}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InternDashboard;

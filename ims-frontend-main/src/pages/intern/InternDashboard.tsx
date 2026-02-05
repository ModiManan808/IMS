import React, { useState, useEffect } from 'react';
import { internService } from '../../services/internService';
import { DailyReport } from '../../types';
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

      // Check if today's report already exists (HB-12)
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

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="intern-dashboard">
      <div className="dashboard-header">
        <h1>Daily Status Report</h1>
        {todayReportExists ? (
          <div className="already-submitted">
            ✅ Today's report already submitted
          </div>
        ) : (
          <button className="submit-button" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Submit New Report'}
          </button>
        )}
      </div>

      {showForm && !todayReportExists && (
        <div className="report-form-container">
          <form onSubmit={handleSubmit} className="report-form">
            <div className="form-group">
              <label>Domain *</label>
              <input
                type="text"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Work Description with Time *</label>
              <textarea
                value={formData.workDescription}
                onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
                rows={4}
                required
              />
            </div>
            <div className="form-group">
              <label>Tools Used with Time of Usage</label>
              <textarea
                value={formData.toolsUsed}
                onChange={(e) => setFormData({ ...formData, toolsUsed: e.target.value })}
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Issues Faced/Remarks</label>
              <textarea
                value={formData.issuesFaced}
                onChange={(e) => setFormData({ ...formData, issuesFaced: e.target.value })}
                rows={3}
              />
            </div>
            <button type="submit" className="submit-button">
              Submit Report
            </button>
          </form>
        </div>
      )}

      <div className="reports-section">
        <h2>My Reports ({reports.length})</h2>
        {reports.length === 0 ? (
          <div className="empty-state">No reports submitted yet</div>
        ) : (
          <div className="reports-list">
            {reports.map((report) => (
              <div key={report.id} className="report-card">
                <div className="report-header">
                  <span className="report-date">{new Date(report.reportDate).toLocaleDateString()}</span>
                  <span className="report-domain">{report.domain}</span>
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

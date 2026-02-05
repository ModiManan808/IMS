import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { OngoingIntern } from '../../types';
import './CompletedInterns.css';

const CompletedInterns: React.FC = () => {
  const [interns, setInterns] = useState<OngoingIntern[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntern, setSelectedIntern] = useState<OngoingIntern | null>(null);

  useEffect(() => {
    loadInterns();
  }, []);

  const loadInterns = async () => {
    try {
      const response = await adminService.getCompletedInterns();
      setInterns(response.data);
    } catch (error) {
      console.error('Error loading interns:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="completed-interns">
      <h1>Completed Interns</h1>
      {interns.length === 0 ? (
        <div className="empty-state">No completed interns</div>
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
                  <span className="stat-label">Total Days:</span>
                  <span className="stat-value">{intern.totalDays || intern.daysSinceStart}</span>
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
            </div>
          ))}
        </div>
      )}

      {selectedIntern && (
        <div className="intern-details-modal">
          <div className="modal-content">
            <h2>Intern Details</h2>
            <div className="details-section">
              <h3>{selectedIntern.name}</h3>
              <p><strong>Application No:</strong> {selectedIntern.applicationNo}</p>
              <p><strong>Start Date:</strong> {new Date(selectedIntern.startDate).toLocaleDateString()}</p>
              <p><strong>End Date:</strong> {new Date(selectedIntern.endDate).toLocaleDateString()}</p>
              <p><strong>Total Days:</strong> {selectedIntern.totalDays || selectedIntern.daysSinceStart}</p>
              <p><strong>Days Attended:</strong> {selectedIntern.daysAttended}</p>
              <p><strong>Attendance %:</strong> {selectedIntern.attendancePct}%</p>
            </div>
            <div className="reports-section">
              <h3>Daily Reports ({selectedIntern.reports.length})</h3>
              <div className="reports-list">
                {selectedIntern.reports.map((report) => (
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
            </div>
            <button onClick={() => setSelectedIntern(null)} className="close-button">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompletedInterns;

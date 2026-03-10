import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { OngoingIntern } from '../../types';
import { Users, FileText, CalendarCheck, Search } from 'lucide-react';
import { formatDate } from '../../utils/dateFormat';
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [internsRes, statsRes] = await Promise.all([
        adminService.getOngoingInterns(),
        adminService.getReportStatistics(),
      ]);
      setInterns(internsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading ongoing interns:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = interns.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.applicationNo?.toLowerCase().includes(search.toLowerCase())
  );

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
      {filtered.length === 0 ? (
        <div className="empty-state">{search ? 'No interns match your search' : 'No ongoing interns'}</div>
      ) : (
        <div className="interns-list">
          {filtered.map((intern) => (
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
              <p><strong>Start Date:</strong> {formatDate(selectedIntern.startDate)}</p>
              <p><strong>End Date:</strong> {formatDate(selectedIntern.endDate)}</p>
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
    </div>
  );
};

export default OngoingInterns;

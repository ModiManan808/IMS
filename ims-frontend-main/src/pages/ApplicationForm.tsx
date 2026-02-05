import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { internService } from '../services/internService';
import './ApplicationForm.css';

const ApplicationForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    enrollmentNo: '',
    email: '',
    mobile: '',
  });
  const [loiFile, setLoiFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 1024 * 1024) {
        setError('File size must be less than 1MB');
        return;
      }
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        return;
      }
      setLoiFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!loiFile) {
      setError('Please upload Letter of Intent (PDF)');
      setLoading(false);
      return;
    }

    try {
      await internService.submitApplication({
        ...formData,
        loi: loiFile,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="application-success">
        <div className="success-content">
          <h2>✅ Application Submitted Successfully!</h2>
          <p>Your application has been received. You will receive an email once it's reviewed.</p>
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="application-form-container">
      <div className="application-form">
        <h1>Internship Application</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              maxLength={100}
              required
            />
          </div>
          <div className="form-group">
            <label>Enrollment Number *</label>
            <input
              type="text"
              name="enrollmentNo"
              value={formData.enrollmentNo}
              onChange={handleChange}
              maxLength={50}
              required
            />
          </div>
          <div className="form-group">
            <label>Email ID *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              maxLength={255}
              required
            />
          </div>
          <div className="form-group">
            <label>Mobile Number *</label>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              pattern="[0-9]{10}"
              maxLength={10}
              title="Please enter a valid 10-digit mobile number"
              required
            />
          </div>
          <div className="form-group">
            <label>Letter of Intent (PDF, max 1MB) *</label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              required
            />
            {loiFile && (
              <p className="file-info">
                Selected: {loiFile.name} ({(loiFile.size / 1024).toFixed(2)} KB)
                {loiFile.size > 1024 * 1024 && <span className="file-warning"> ⚠️ Exceeds 1MB!</span>}
              </p>
            )}
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ApplicationForm;

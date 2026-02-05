import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { internService } from '../services/internService';
import './EnrollmentForm.css';

const EnrollmentForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    enrollmentNo: '',
    semester: '',
    program: '',
    department: '',
    organization: '',
    contactNo: '',
    emailAddress: '',
    gender: 'M' as 'M' | 'F' | 'O',
    bloodGroup: '',
    presentAddress: '',
    permanentAddress: '',
  });
  const [files, setFiles] = useState({
    photo: null as File | null,
    sign: null as File | null,
    nda: null as File | null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadFormData = async () => {
    try {
      const response = await internService.getEnrollmentForm(id!);
      setFormData({
        ...formData,
        fullName: response.data.fullName,
        enrollmentNo: response.data.enrollmentNo,
        emailAddress: response.data.email,
      });
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load enrollment form');
    }
  };

  useEffect(() => {
    if (id) {
      loadFormData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (field: 'photo' | 'sign' | 'nda') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 1024 * 1024) {
        setError(`${field} file size must be less than 1MB`);
        return;
      }
      setFiles({ ...files, [field]: file });
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!files.photo || !files.sign || !files.nda) {
      setError('Please upload all required files');
      setLoading(false);
      return;
    }

    try {
      await internService.submitEnrollment(id!, {
        ...formData,
        photo: files.photo,
        sign: files.sign,
        nda: files.nda,
      });
      alert('Enrollment submitted successfully!');
      navigate('/login');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to submit enrollment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="enrollment-form-container">
      <div className="enrollment-form">
        <h1>Enrollment Form</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Enrollment No. *</label>
              <input type="text" name="enrollmentNo" value={formData.enrollmentNo} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Semester *</label>
              <input type="text" name="semester" value={formData.semester} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Program/Project Name *</label>
              <input type="text" name="program" value={formData.program} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Department *</label>
              <input type="text" name="department" value={formData.department} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Organization *</label>
              <input type="text" name="organization" value={formData.organization} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Contact No. *</label>
              <input type="tel" name="contactNo" value={formData.contactNo} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Email Address *</label>
              <input type="email" name="emailAddress" value={formData.emailAddress} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Gender *</label>
              <select name="gender" value={formData.gender} onChange={handleChange} required>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Blood Group *</label>
              <input type="text" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label>Present Address *</label>
            <textarea name="presentAddress" value={formData.presentAddress} onChange={handleChange} required rows={3} />
          </div>

          <div className="form-group">
            <label>Permanent Address *</label>
            <textarea name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} required rows={3} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Passport Size Photo (JPG/PNG, max 1MB) *</label>
              <input type="file" accept=".jpg,.jpeg,.png" onChange={handleFileChange('photo')} required />
              {files.photo && <p className="file-name">Selected: {files.photo.name}</p>}
            </div>
            <div className="form-group">
              <label>E-Signature (JPG/PNG, max 1MB) *</label>
              <input type="file" accept=".jpg,.jpeg,.png" onChange={handleFileChange('sign')} required />
              {files.sign && <p className="file-name">Selected: {files.sign.name}</p>}
            </div>
          </div>

          <div className="form-group">
            <label>Signed NDA (PDF, max 1MB) *</label>
            <input type="file" accept=".pdf" onChange={handleFileChange('nda')} required />
            {files.nda && <p className="file-name">Selected: {files.nda.name}</p>}
          </div>

          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Enrollment'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EnrollmentForm;

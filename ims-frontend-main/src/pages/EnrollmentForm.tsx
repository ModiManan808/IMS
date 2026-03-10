import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { internService } from '../services/internService';
import { CheckCircle } from 'lucide-react';
import './EnrollmentForm.css';

const CONTACT_REGEX = /^[0-9]{10}$/;

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const ALLOWED_PDF_TYPES = ['application/pdf'];

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
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [fileErrors, setFileErrors] = useState({ photo: '', sign: '', nda: '' });
  const [contactError, setContactError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState('');

  // Cleanup object URL on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  const loadFormData = async () => {
    try {
      const response = await internService.getEnrollmentForm(id!);
      setFormData((prev) => ({
        ...prev,
        fullName: response.data.fullName,
        enrollmentNo: response.data.enrollmentNo,
        emailAddress: response.data.email,
      }));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load enrollment form');
    }
  };

  useEffect(() => {
    if (id) {
      loadFormData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'contactNo') {
      if (value.length > 0 && !CONTACT_REGEX.test(value)) {
        setContactError('Contact number must be exactly 10 digits (numbers only).');
      } else {
        setContactError('');
      }
    }
  };

  // Block non-numeric keys for the contact field
  const handleContactKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!allowedKeys.includes(e.key) && !/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleFileChange = (field: 'photo' | 'sign' | 'nda') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    // Size check
    if (file.size > 1024 * 1024) {
      setFileErrors({ ...fileErrors, [field]: 'File size must be less than 1 MB.' });
      return;
    }

    // MIME type check
    if (field === 'photo' || field === 'sign') {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setFileErrors({ ...fileErrors, [field]: 'Only JPG/PNG images are allowed.' });
        return;
      }
    } else if (field === 'nda') {
      if (!ALLOWED_PDF_TYPES.includes(file.type)) {
        setFileErrors({ ...fileErrors, [field]: 'Only PDF files are allowed for the NDA.' });
        return;
      }
    }

    // Clear error and store file
    setFileErrors({ ...fileErrors, [field]: '' });
    setFiles({ ...files, [field]: file });

    // Generate preview for photo only
    if (field === 'photo') {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
      setPhotoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Final contact validation
    if (!CONTACT_REGEX.test(formData.contactNo)) {
      setContactError('Contact number must be exactly 10 digits (numbers only).');
      return;
    }

    if (!files.photo || !files.sign || !files.nda) {
      setError('Please upload all required files (Passport Photo, E-Signature, and Signed NDA).');
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      await internService.submitEnrollment(id!, {
        ...formData,
        photo: files.photo,
        sign: files.sign,
        nda: files.nda,
      });
      setSubmittedName(formData.fullName);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit enrollment');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="enrollment-success-page">
        <div className="success-card">
          <div className="success-icon">
            <CheckCircle size={56} strokeWidth={1.5} />
          </div>
          <h1>Enrollment Submitted!</h1>
          <p className="success-greeting">Dear <strong>{submittedName}</strong>,</p>
          <p className="success-msg">
            Thank you for completing your enrollment. Your details have been successfully
            submitted and are now pending review by the CoE-CS administration team.
          </p>
          <p className="success-email-note">
            You will receive an email with your login credentials once your onboarding
            is finalized. Please keep an eye on your registered email inbox.
          </p>
          <button className="goto-login-button" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

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
              <input
                type="tel"
                name="contactNo"
                value={formData.contactNo}
                onChange={handleChange}
                onKeyDown={handleContactKeyDown}
                pattern="[0-9]{10}"
                maxLength={10}
                inputMode="numeric"
                placeholder="10-digit contact number"
                aria-describedby={contactError ? 'contact-error' : undefined}
                aria-invalid={!!contactError}
                required
              />
              {contactError && (
                <span id="contact-error" className="field-error" role="alert">
                  {contactError}
                </span>
              )}
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

          {/* File uploads row */}
          <div className="form-row">
            {/* Passport Photo — with thumbnail preview */}
            <div className="form-group">
              <label>Passport Size Photo (JPG/PNG, max 1MB) *</label>
              <div className="photo-upload-wrapper">
                {photoPreviewUrl && (
                  <img
                    src={photoPreviewUrl}
                    alt="Passport photo preview"
                    className="photo-preview"
                  />
                )}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleFileChange('photo')}
                  aria-describedby={fileErrors.photo ? 'photo-error' : undefined}
                  aria-invalid={!!fileErrors.photo}
                  required
                />
              </div>
              {fileErrors.photo && (
                <span id="photo-error" className="field-error" role="alert">
                  {fileErrors.photo}
                </span>
              )}
              {files.photo && !fileErrors.photo && (
                <p className="file-name">Selected: {files.photo.name}</p>
              )}
            </div>

            {/* E-Signature */}
            <div className="form-group">
              <label>E-Signature (JPG/PNG, max 1MB) *</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={handleFileChange('sign')}
                aria-describedby={fileErrors.sign ? 'sign-error' : undefined}
                aria-invalid={!!fileErrors.sign}
                required
              />
              {fileErrors.sign && (
                <span id="sign-error" className="field-error" role="alert">
                  {fileErrors.sign}
                </span>
              )}
              {files.sign && !fileErrors.sign && (
                <p className="file-name">Selected: {files.sign.name}</p>
              )}
            </div>
          </div>

          {/* NDA — full width */}
          <div className="form-group">
            <label>Signed NDA (PDF, max 1MB) *</label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange('nda')}
              aria-describedby={fileErrors.nda ? 'nda-error' : undefined}
              aria-invalid={!!fileErrors.nda}
              required
            />
            {fileErrors.nda && (
              <span id="nda-error" className="field-error" role="alert">
                {fileErrors.nda}
              </span>
            )}
            {files.nda && !fileErrors.nda && (
              <p className="file-name">Selected: {files.nda.name}</p>
            )}
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

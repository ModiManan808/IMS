import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { authService } from '../../services/authService';
import { internService } from '../../services/internService';
import { Lock } from 'lucide-react';
import './Profile.css';

interface UserProfile {
    id?: number;
    fullName: string;
    applicationNo: string;
    email: string;
    role: string;
    status?: string;
    department?: string;
    program?: string;
    mobileNo?: string;
    semester?: string;
    organization?: string;
    gender?: string;
    bloodGroup?: string;
    presentAddress?: string;
    permanentAddress?: string;
    dateOfJoining?: string;
    dateOfLeaving?: string;
    passportPhoto?: string;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/** Fetch the passport photo as a blob URL so the JWT auth header is used */
async function fetchPhotoBlob(relativePath: string): Promise<string | null> {
    try {
        const token = localStorage.getItem('token');
        // Normalize Windows backslashes → forward slashes for URL safety,
        // then strip the leading "uploads/" prefix (the backend route is /api/files/<rest>)
        const normalized = relativePath.replace(/\\/g, '/');
        const filePart = normalized.replace(/^uploads\//, '');
        const response = await fetch(`${API_URL}/api/files/${filePart}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return null;
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch {
        return null;
    }
}

function formatDate(dateStr?: string): string {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function genderLabel(g?: string): string {
    if (g === 'M') return 'Male';
    if (g === 'F') return 'Female';
    if (g === 'O') return 'Other';
    return 'N/A';
}

const Profile: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    // Cleanup blob URL on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            if (photoUrl) URL.revokeObjectURL(photoUrl);
        };
    }, [photoUrl]);

    useEffect(() => {
        const localUser = authService.getCurrentUser();
        if (localUser) {
            setProfile({
                fullName: localUser.fullName,
                applicationNo: localUser.applicationNo || '',
                email: localUser.email,
                role: localUser.role,
                status: localUser.status,
            });
        }

        // Fetch full profile from backend (includes passportPhoto + extra fields)
        internService.getProfile().then(async (res) => {
            const data = res.data;
            const fullProfile: UserProfile = {
                id: data.id,
                fullName: data.fullName,
                applicationNo: data.applicationNo || '',
                email: data.personalEmail || localUser?.email || '',
                role: data.role,
                status: data.status,
                department: data.department,
                program: data.program,
                mobileNo: data.mobileNo,
                semester: data.semester,
                organization: data.organization,
                gender: data.gender,
                bloodGroup: data.bloodGroup,
                presentAddress: data.presentAddress,
                permanentAddress: data.permanentAddress,
                dateOfJoining: data.dateOfJoining,
                dateOfLeaving: data.dateOfLeaving,
                passportPhoto: data.passportPhoto,
            };
            setProfile(fullProfile);

            if (data.passportPhoto) {
                const url = await fetchPhotoBlob(data.passportPhoto);
                if (url) setPhotoUrl(url);
            }
        }).catch(() => {
            // Silently fall back to localStorage data already set above
        });
    }, []);

    const getPasswordStrength = () => {
        if (newPassword.length === 0) return '';
        if (newPassword.length < 8) return 'weak';
        if (newPassword.length < 12) return 'medium';
        return 'strong';
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters long');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/api/change-password`,
                { currentPassword, newPassword },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccess('Password changed successfully! You will receive a confirmation email.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                setShowChangePassword(false);
                setSuccess('');
            }, 3000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!profile) {
        return (
            <div className="profile-page" aria-busy="true">
                <div className="profile-loading">
                    <div className="profile-loading-spinner" aria-hidden="true" />
                    <p>Loading profile…</p>
                </div>
            </div>
        );
    }

    const initials = profile.fullName?.charAt(0).toUpperCase() || 'U';

    return (
        <div className="profile-page">
            <div className="profile-card">

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="profile-header">
                    <div className="profile-avatar-wrap">
                        {photoUrl ? (
                            <img
                                src={photoUrl}
                                alt={`Profile photo of ${profile.fullName}`}
                                className="profile-avatar-img"
                            />
                        ) : (
                            <div className="profile-avatar-initials" aria-hidden="true">
                                {initials}
                            </div>
                        )}
                    </div>
                    <h1 className="profile-name">{profile.fullName || 'User'}</h1>
                    <p className="profile-role">{profile.role?.replace('_', ' ') || 'Intern'}</p>
                    <span className={`profile-status-badge status-${(profile.status || 'pending').toLowerCase()}`}>
                        {profile.status || 'Pending'}
                    </span>
                </div>

                {/* ── Details Grid ───────────────────────────────────── */}
                <div className="profile-details">
                    <h2 className="profile-section-title">Personal Information</h2>
                    <div className="profile-grid">

                        <div className="profile-field">
                            <span className="profile-label">Application Number</span>
                            <span className="profile-value">{profile.applicationNo || 'N/A'}</span>
                        </div>

                        <div className="profile-field">
                            <span className="profile-label">Email Address</span>
                            <span className="profile-value profile-value--email">{profile.email || 'N/A'}</span>
                        </div>

                        <div className="profile-field">
                            <span className="profile-label">Mobile Number</span>
                            <span className="profile-value">{profile.mobileNo || 'N/A'}</span>
                        </div>

                        <div className="profile-field">
                            <span className="profile-label">Gender</span>
                            <span className="profile-value">{genderLabel(profile.gender)}</span>
                        </div>

                        <div className="profile-field">
                            <span className="profile-label">Blood Group</span>
                            <span className="profile-value">{profile.bloodGroup || 'N/A'}</span>
                        </div>

                        <div className="profile-field">
                            <span className="profile-label">Semester</span>
                            <span className="profile-value">{profile.semester || 'N/A'}</span>
                        </div>

                        {profile.department && (
                            <div className="profile-field">
                                <span className="profile-label">Department</span>
                                <span className="profile-value">{profile.department}</span>
                            </div>
                        )}

                        {profile.program && (
                            <div className="profile-field">
                                <span className="profile-label">Program / Project</span>
                                <span className="profile-value">{profile.program}</span>
                            </div>
                        )}

                        {profile.organization && (
                            <div className="profile-field">
                                <span className="profile-label">Organization</span>
                                <span className="profile-value">{profile.organization}</span>
                            </div>
                        )}

                        <div className="profile-field">
                            <span className="profile-label">Date of Joining</span>
                            <span className="profile-value">{formatDate(profile.dateOfJoining)}</span>
                        </div>

                        <div className="profile-field">
                            <span className="profile-label">Date of Leaving</span>
                            <span className="profile-value">{formatDate(profile.dateOfLeaving)}</span>
                        </div>

                    </div>

                    {/* Addresses — full width */}
                    {(profile.presentAddress || profile.permanentAddress) && (
                        <>
                            <div className="profile-divider" />
                            <div className="profile-grid">
                                {profile.presentAddress && (
                                    <div className="profile-field profile-field--full">
                                        <span className="profile-label">Present Address</span>
                                        <span className="profile-value">{profile.presentAddress}</span>
                                    </div>
                                )}
                                {profile.permanentAddress && (
                                    <div className="profile-field profile-field--full">
                                        <span className="profile-label">Permanent Address</span>
                                        <span className="profile-value">{profile.permanentAddress}</span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* ── Change Password ────────────────────────────────── */}
                <div className="password-section">
                    <button
                        onClick={() => setShowChangePassword(!showChangePassword)}
                        className="change-password-toggle"
                        aria-expanded={showChangePassword}
                        aria-controls="change-password-form"
                        aria-label={showChangePassword ? 'Cancel changing password' : 'Open change password form'}
                    >
                        <Lock size={15} aria-hidden="true" /> {showChangePassword ? 'Cancel Change Password' : 'Change Password'}
                    </button>

                    {showChangePassword && (
                        <form
                            id="change-password-form"
                            onSubmit={handleChangePassword}
                            className="change-password-form"
                        >
                            <div className="form-group">
                                <label htmlFor="current-password">Current Password</label>
                                <input
                                    id="current-password"
                                    type={showPasswords ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    placeholder="Enter current password"
                                    autoComplete="current-password"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="new-password">New Password (min 8 characters)</label>
                                <input
                                    id="new-password"
                                    type={showPasswords ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    placeholder="Enter new password"
                                    autoComplete="new-password"
                                />
                                {newPassword && (
                                    <div
                                        className={`password-strength password-strength-${getPasswordStrength()}`}
                                        role="status"
                                        aria-live="polite"
                                    >
                                        Strength: {getPasswordStrength()}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirm-password">Confirm New Password</label>
                                <input
                                    id="confirm-password"
                                    type={showPasswords ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="Confirm new password"
                                    autoComplete="new-password"
                                />
                            </div>

                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={showPasswords}
                                        onChange={(e) => setShowPasswords(e.target.checked)}
                                    />
                                    Show passwords
                                </label>
                            </div>

                            {error && <div className="error-message" role="alert">{error}</div>}
                            {success && <div className="success-message" role="status">{success}</div>}

                            <button type="submit" disabled={loading} className="submit-button">
                                {loading ? 'Changing Password…' : 'Change Password'}
                            </button>
                        </form>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Profile;

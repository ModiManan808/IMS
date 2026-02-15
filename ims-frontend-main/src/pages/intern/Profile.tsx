import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { authService } from '../../services/authService';
import './Profile.css';

interface UserProfile {
    fullName: string;
    applicationNo: string;
    email: string;
    role: string;
    status?: string;
}

const Profile: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const user = authService.getCurrentUser();
        if (user) {
            setProfile(user);
        }
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

        // Validation
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
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5586';
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

            // Close form after 3 seconds
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
        return <div className="profile-loading">Loading...</div>;
    }

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-avatar">
                        {profile.fullName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <h2>{profile.fullName || 'User'}</h2>
                    <p className="profile-role">{profile.role || 'N/A'}</p>
                </div>

                <div className="profile-details">
                    <div className="profile-item">
                        <label>Application Number</label>
                        <p>{profile.applicationNo || 'N/A'}</p>
                    </div>

                    <div className="profile-item">
                        <label>Email</label>
                        <p>{profile.email || 'N/A'}</p>
                    </div>

                    <div className="profile-item">
                        <label>Status</label>
                        <p className={`status-badge status-${profile.status?.toLowerCase()}`}>
                            {profile.status || 'N/A'}
                        </p>
                    </div>
                </div>

                {/* Change Password Section */}
                <div className="password-section">
                    <button
                        onClick={() => setShowChangePassword(!showChangePassword)}
                        className="change-password-toggle"
                    >
                        🔒 {showChangePassword ? 'Cancel Change Password' : 'Change Password'}
                    </button>

                    {showChangePassword && (
                        <form onSubmit={handleChangePassword} className="change-password-form">
                            <div className="form-group">
                                <label>Current Password</label>
                                <div className="password-input-group">
                                    <input
                                        type={showPasswords ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                        placeholder="Enter current password"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>New Password (min 8 characters)</label>
                                <div className="password-input-group">
                                    <input
                                        type={showPasswords ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        placeholder="Enter new password"
                                    />
                                </div>
                                {newPassword && (
                                    <div className={`password-strength password-strength-${getPasswordStrength()}`}>
                                        Strength: {getPasswordStrength()}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <div className="password-input-group">
                                    <input
                                        type={showPasswords ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        placeholder="Confirm new password"
                                    />
                                </div>
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

                            {error && <div className="error-message">{error}</div>}
                            {success && <div className="success-message">{success}</div>}

                            <button type="submit" disabled={loading} className="submit-button">
                                {loading ? 'Changing Password...' : 'Change Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;

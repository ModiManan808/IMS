import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './ResetPassword.css';

const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const { token } = useParams<{ token: string }>();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [validationError, setValidationError] = useState('');

    useEffect(() => {
        verifyToken();
    }, [token]);

    const verifyToken = async () => {
        try {
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5586';
            await axios.get(`${API_URL}/api/verify-reset-token/${token}`);
            setTokenValid(true);
        } catch (err: any) {
            setValidationError(err.response?.data?.error || 'Invalid or expired reset link');
            setTokenValid(false);
        } finally {
            setValidating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // VUL-07: Match backend password complexity rules
        const pwdErrors: string[] = [];
        if (password.length < 8) pwdErrors.push('at least 8 characters');
        if (!/[A-Z]/.test(password)) pwdErrors.push('one uppercase letter');
        if (!/[a-z]/.test(password)) pwdErrors.push('one lowercase letter');
        if (!/[0-9]/.test(password)) pwdErrors.push('one number');
        if (!/[^A-Za-z0-9]/.test(password)) pwdErrors.push('one special character (e.g. !@#$%)');
        if (pwdErrors.length > 0) {
            setError(`Password must contain: ${pwdErrors.join(', ')}`);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5586';
            await axios.post(`${API_URL}/api/reset-password/${token}`, { password });
            setSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            console.error('Reset password error:', err);
            setError(err.response?.data?.error || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const getPasswordStrength = (): string => {
        if (password.length === 0) return '';
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        if (score <= 2) return 'weak';
        if (score <= 4) return 'medium';
        return 'strong';
    };

    if (validating) {
        return (
            <div className="login-container">
                <div className="login-background">
                    <div className="background-pattern"></div>
                    <div className="background-dots"></div>
                    <div className="background-hands"></div>
                </div>
                <div className="login-panel">
                    <div className="loading">Validating reset link...</div>
                </div>
            </div>
        );
    }

    if (!tokenValid) {
        return (
            <div className="login-container">
                <div className="login-background">
                    <div className="background-pattern"></div>
                    <div className="background-dots"></div>
                    <div className="background-hands"></div>
                </div>
                <div className="login-panel">
                    <div className="login-form-container">
                        <h1 className="login-title">Invalid Link</h1>
                        <div className="error-message">{validationError}</div>
                        <button
                            onClick={() => navigate('/login')}
                            className="login-button"
                            style={{ marginTop: '20px' }}
                        >
                            Back to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="login-container">
            <div className="login-background">
                <div className="background-pattern"></div>
                <div className="background-dots"></div>
                <div className="background-hands"></div>
            </div>
            <div className="login-panel">
                <div className="login-branding">
                    <div className="nfsu-branding">
                        <img src="/nfsu-logo.png" alt="NFSU Logo" className="login-logo" />
                        <div className="nfsu-text">
                            <h2>National Forensic Sciences University</h2>
                            <p>Knowledge | Wisdom | Fulfilment</p>
                            <p className="institution">An Institution of National Importance</p>
                            <p className="ministry">(Ministry of Home Affairs, Government of India)</p>
                            <p className="sanskrit">विद्या अमृत</p>
                        </div>
                    </div>
                </div>
                <div className="login-form-container">
                    <h1 className="login-title">Reset Password</h1>

                    {success ? (
                        <div className="success-container">
                            <div className="success-message">
                                <div className="success-icon">✓</div>
                                <h3>Password Reset Successful!</h3>
                                <p>Your password has been reset successfully.</p>
                                <p className="note">Redirecting to login page...</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="login-form">
                            <p className="form-description">
                                Please enter your new password below.
                            </p>
                            <div className="form-group password-group">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="New Password (min 8 characters)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                    className="form-input"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                            {password && (
                                <div className={`password-strength ${getPasswordStrength()}`}>
                                    Strength: {getPasswordStrength()}
                                </div>
                            )}
                            <div className="form-group">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Confirm New Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    autoComplete="new-password"
                                    className="form-input"
                                />
                            </div>
                            {error && <div className="error-message">{error}</div>}
                            <div className="form-actions">
                                <button type="submit" className="login-button" disabled={loading}>
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="forgot-password"
                                >
                                    Back to Login
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;

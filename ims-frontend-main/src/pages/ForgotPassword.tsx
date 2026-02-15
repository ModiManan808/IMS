import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ForgotPassword.css';

const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();
    const [userType, setUserType] = useState<'admin' | 'intern'>('intern');
    const [email, setEmail] = useState('');
    const [applicationNo, setApplicationNo] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5586';
            const payload = {
                userType,
                ...(userType === 'admin' ? { email } : { applicationNo })
            };

            console.log('Password reset request:', payload);
            await axios.post(`${API_URL}/api/request-password-reset`, payload);
            setSuccess(true);
        } catch (err: any) {
            console.error('Forgot password error:', err);
            setError(err.response?.data?.error || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

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
                    <h1 className="login-title">Forgot Password</h1>

                    {success ? (
                        <div className="success-container">
                            <div className="success-message">
                                <div className="success-icon">✓</div>
                                <h3>Email Sent!</h3>
                                <p>
                                    If an account exists, a password reset link has been sent to your email.
                                    Please check your inbox and follow the instructions.
                                </p>
                                <p className="note">The link will expire in 30 minutes.</p>
                            </div>
                            <button
                                onClick={() => navigate('/login')}
                                className="login-button"
                            >
                                Back to Login
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="login-form">
                            <p className="form-description">
                                Select your account type and enter your {userType === 'admin' ? 'email address' : 'application number'}.
                            </p>

                            {/* User Type Selection */}
                            <div className="form-group">
                                <label className="field-label">I am a</label>
                                <div className="radio-group">
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            name="userType"
                                            value="admin"
                                            checked={userType === 'admin'}
                                            onChange={(e) => setUserType('admin')}
                                        />
                                        Admin
                                    </label>
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            name="userType"
                                            value="intern"
                                            checked={userType === 'intern'}
                                            onChange={(e) => setUserType('intern')}
                                        />
                                        Intern
                                    </label>
                                </div>
                            </div>

                            {/* Conditional Input */}
                            <div className="form-group">
                                {userType === 'admin' ? (
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="form-input"
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        placeholder="Application Number (e.g., IMS2024001)"
                                        value={applicationNo}
                                        onChange={(e) => setApplicationNo(e.target.value)}
                                        required
                                        className="form-input"
                                    />
                                )}
                            </div>
                            {error && <div className="error-message">{error}</div>}
                            <div className="form-actions">
                                <button type="submit" className="login-button" disabled={loading}>
                                    {loading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPassword;

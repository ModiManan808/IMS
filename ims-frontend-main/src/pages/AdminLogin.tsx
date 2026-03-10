import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, AlertTriangle } from 'lucide-react';
import { authService } from '../services/authService';
import './AdminLogin.css';

const AdminLogin: React.FC = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showError = (msg: string) => {
        setError(msg);
        if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
        errorTimerRef.current = setTimeout(() => setError(''), 30000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await authService.login({
                username,
                password,
                userType: 'admin',
            });

            const user = response.user;
            setError('');

            if (user.role === 'Admin') {
                navigate('/admin/fresh');
            } else {
                showError('Access denied. Admin credentials required.');
            }
        } catch (err: any) {
            console.error('Admin login error:', err);
            const msg =
                err.response?.data?.error ||
                err.message ||
                'Invalid credentials. Please try again.';
            if (err.response?.status === 0 || err.code === 'ERR_NETWORK') {
                showError('Cannot connect to server. Please try again later.');
            } else {
                showError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-panel">
                {/* Left branding side */}
                <div className="admin-branding">
                    <div className="admin-branding-inner">
                        <img src="/nfsu-logo.png" alt="NFSU Logo" className="admin-logo" />
                        <div className="admin-divider" />
                        <div className="admin-badge">
                            <Shield size={18} />
                            <span>Administrator Portal</span>
                        </div>
                    </div>
                </div>

                {/* Right form side */}
                <div className="admin-form-side">
                    <div className="admin-form-header">
                        <div className="admin-icon-wrap">
                            <Shield size={28} />
                        </div>
                        <h1>Admin Login</h1>
                        <p className="admin-subtitle">Secure restricted access</p>
                    </div>

                    <form onSubmit={handleSubmit} className="admin-form">
                        <div className="admin-form-group">
                            <label htmlFor="admin-username">Username</label>
                            <input
                                id="admin-username"
                                type="text"
                                placeholder="Enter admin username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                autoComplete="username"
                                autoFocus
                            />
                        </div>

                        <div className="admin-form-group">
                            <label htmlFor="admin-password">Password</label>
                            <div className="admin-password-wrap">
                                <input
                                    id="admin-password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter admin password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="admin-toggle-pw"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="admin-error">
                                <AlertTriangle size={16} />
                                <span>{error}</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setError('');
                                        if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
                                    }}
                                    aria-label="Dismiss error"
                                >
                                    ✕
                                </button>
                            </div>
                        )}

                        <button type="submit" className="admin-submit-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="admin-spinner" />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    <Shield size={16} />
                                    LOGIN
                                </>
                            )}
                        </button>
                    </form>

                    <div className="admin-security-notice">
                        <AlertTriangle size={13} />
                        This is a secure administrator area. Unauthorized access is strictly prohibited.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;

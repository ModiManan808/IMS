import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { authService } from '../services/authService';
import './Login.css';

const Login: React.FC = () => {
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
    // Auto-dismiss after 30 seconds
    errorTimerRef.current = setTimeout(() => setError(''), 30000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Keep old error visible while new request is in flight
    setLoading(true);

    try {
      const response = await authService.login({ username, password, userType: 'intern' });
      const user = response.user;

      setError('');

      if (user.role?.startsWith('Intern_')) {
        navigate('/intern/dashboard');
      } else {
        showError('Invalid credentials. Please check your application number and password.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Login failed. Please check your credentials.';
      if (err.response?.status === 0 || err.code === 'ERR_NETWORK') {
        showError('Cannot connect to server. Please try again later or contact support.');
      } else {
        showError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <button
        type="button"
        className="back-home-btn"
        onClick={() => navigate('/')}
        aria-label="Back to home page"
      >
        <ChevronLeft size={16} aria-hidden="true" />
        Back to Home
      </button>
      <div className="login-background">
        <div className="background-pattern"></div>
        <div className="background-dots"></div>
        <div className="background-hands"></div>
      </div>
      <div className="login-panel">
        <div className="login-branding">
          <div className="nfsu-branding">
            <img src="/nfsu-logo.png" alt="NFSU Logo" className="login-logo" />
          </div>
        </div>
        <div className="login-form-container">
          <h1 className="login-title">Login</h1>
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <input
                type="text"
                placeholder="Application Number (e.g. IMS2024001)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="form-input"
              />
            </div>
            <div className="form-group password-group">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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
            {error && (
              <div className="error-message">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => { setError(''); if (errorTimerRef.current) clearTimeout(errorTimerRef.current); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c62828', fontWeight: 'bold', fontSize: '16px', lineHeight: '1', padding: '0 0 0 10px', flexShrink: 0 }}
                  aria-label="Dismiss error"
                >✕</button>
              </div>
            )}
            <div className="form-actions">
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Logging in...' : 'LOGIN'}
              </button>
              <button
                type="button"
                className="forgot-password"
                onClick={() => navigate('/forgot-password')}
              >
                Forgot Password ?
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

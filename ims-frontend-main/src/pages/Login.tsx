import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './Login.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'admin' | 'intern'>('intern');
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
      const response = await authService.login({ username, password, userType });
      const user = response.user;

      setError('');

      if (user.role === 'Admin') {
        navigate('/admin/fresh');
      } else if (user.role?.startsWith('Intern_')) {
        navigate('/intern/dashboard');
      } else {
        navigate('/');
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
              <p className="sanskrit">विद्या अमृतं अश्नुते</p>
            </div>
          </div>
        </div>
        <div className="login-form-container">
          <h1 className="login-title">Login</h1>
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>User Type</label>
              <div className="radio-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '30px', marginTop: '5px' }}>
                <label className="radio-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 500, lineHeight: '1' }}>
                  <input
                    type="radio"
                    value="intern"
                    checked={userType === 'intern'}
                    onChange={(e) => setUserType(e.target.value as 'admin' | 'intern')}
                    style={{ width: '16px', height: '16px', margin: 0, cursor: 'pointer', accentColor: '#d32f2f' }}
                  />
                  Intern
                </label>
                <label className="radio-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 500, lineHeight: '1' }}>
                  <input
                    type="radio"
                    value="admin"
                    checked={userType === 'admin'}
                    onChange={(e) => setUserType(e.target.value as 'admin' | 'intern')}
                    style={{ width: '16px', height: '16px', margin: 0, cursor: 'pointer', accentColor: '#d32f2f' }}
                  />
                  Admin
                </label>
              </div>
            </div>
            <div className="form-group">
              <input
                type="text"
                placeholder={userType === 'admin' ? 'Username' : 'Application Number'}
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

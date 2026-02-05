import React, { useState } from 'react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ username, password, userType });
      const user = response.user;

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
      setError(errorMessage);
      if (err.response?.status === 0 || err.code === 'ERR_NETWORK') {
        setError('Cannot connect to server. Please make sure the backend is running on http://localhost:5000');
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
              <p className="sanskrit">विद्या अमृत</p>
            </div>
          </div>
        </div>
        <div className="login-form-container">
          <h1 className="login-title">Login</h1>
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>User Type</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    value="intern"
                    checked={userType === 'intern'}
                    onChange={(e) => setUserType(e.target.value as 'admin' | 'intern')}
                  />
                  Intern
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    value="admin"
                    checked={userType === 'admin'}
                    onChange={(e) => setUserType(e.target.value as 'admin' | 'intern')}
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
            {error && <div className="error-message">{error}</div>}
            <div className="form-actions">
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Logging in...' : 'LOGIN'}
              </button>
              <button type="button" className="forgot-password">Forgot Password ?</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

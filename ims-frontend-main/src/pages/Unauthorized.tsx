import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Unauthorized.css';

const Unauthorized: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="unauthorized-container">
            <div className="unauthorized-content">
                <div className="unauthorized-icon">🚫</div>
                <h1>Access Denied</h1>
                <p>You don't have permission to access this page.</p>
                <div className="unauthorized-actions">
                    <button onClick={() => navigate(-1)} className="btn-secondary">
                        Go Back
                    </button>
                    <button onClick={() => navigate('/login')} className="btn-primary">
                        Return to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;

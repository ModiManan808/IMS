import React, { useEffect, useState } from 'react';
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

    useEffect(() => {
        const user = authService.getCurrentUser();
        if (user) {
            setProfile(user);
        }
    }, []);

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

                <div className="profile-note">
                    <p>💡 <strong>Note:</strong> Profile editing is coming soon. Contact admin for any updates needed.</p>
                </div>
            </div>
        </div>
    );
};

export default Profile;

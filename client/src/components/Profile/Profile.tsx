import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store/store';
import { fetchProfile } from '../../store/profileSlice';
import './Profile.css';

export const Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const profile = useSelector((state: RootState) => state.profile);

  useEffect(() => {
    if (!profile.id) {
      dispatch(fetchProfile('user-12345'));
    }
  }, [dispatch, profile.id]);

  if (profile.loading) {
    return <div className="profile-container loading">Loading profile...</div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-card glass-panel">
        <div className="profile-header">
          <img src={profile.avatarUrl} alt="Avatar" className="profile-avatar" />
          <h2 className="profile-username">{profile.username}</h2>
          <p className="profile-rating">ELO Rating: {profile.eloRating}</p>
        </div>
        
        <div className="profile-stats">
          <div className="stat-box">
            <span className="stat-value">{profile.gamesPlayed}</span>
            <span className="stat-label">Games Played</span>
          </div>
          <div className="stat-box win">
            <span className="stat-value">{profile.gamesWon}</span>
            <span className="stat-label">Won</span>
          </div>
          <div className="stat-box loss">
            <span className="stat-value">{profile.gamesLost}</span>
            <span className="stat-label">Lost</span>
          </div>
          <div className="stat-box coins">
            <span className="stat-value">🪙 {profile.coinsCollected}</span>
            <span className="stat-label">Coins</span>
          </div>
        </div>

        <div className="profile-actions">
          <button className="btn-primary">Edit Profile</button>
          <button className="btn-secondary">Find Match</button>
        </div>
      </div>
    </div>
  );
};

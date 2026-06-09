import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../../store/store';
import { fetchProfile, updateProfile, clearProfileError } from '../../store/profileSlice';
import { useAuth } from '../../contexts/AuthContext';
import './Profile.css';

export const Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const profile = useSelector((state: RootState) => state.profile);
  const { token } = useAuth();

  // Edit modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch profile on mount using the real JWT token
  useEffect(() => {
    if (token && !profile.id) {
      dispatch(fetchProfile(token));
    }
  }, [dispatch, token, profile.id]);

  // Seed edit form whenever edit modal opens
  const openEdit = () => {
    setEditUsername(profile.username);
    setEditAvatarUrl(profile.avatarUrl);
    setSaveSuccess(false);
    dispatch(clearProfileError());
    setIsEditing(true);
  };

  const closeEdit = () => {
    setIsEditing(false);
    setSaveSuccess(false);
    dispatch(clearProfileError());
  };

  const handleSave = async () => {
    if (!token) return;
    const result = await dispatch(
      updateProfile({ token, username: editUsername.trim(), avatarUrl: editAvatarUrl.trim() })
    );
    if (updateProfile.fulfilled.match(result)) {
      setSaveSuccess(true);
      setTimeout(() => {
        setIsEditing(false);
        setSaveSuccess(false);
      }, 1200);
    }
  };

  // Preset DiceBear avatars for quick pick
  const avatarSeeds = ['Striker', 'Queen', 'Puck', 'Carrom', 'Champion', 'Shadow', 'Neon', 'Vortex'];

  if (profile.loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <div className="profile-spinner" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card glass-panel">

        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar-wrapper">
            <img src={profile.avatarUrl} alt="Avatar" className="profile-avatar" />
          </div>
          <h2 className="profile-username">{profile.username || 'Player'}</h2>
          <p className="profile-email">{profile.email}</p>
          <p className="profile-rating">⚡ ELO {profile.eloRating}</p>
        </div>

        {/* Stats grid */}
        <div className="profile-stats">
          <div className="stat-box">
            <span className="stat-value">{profile.gamesPlayed}</span>
            <span className="stat-label">Played</span>
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

        {/* Actions */}
        <div className="profile-actions">
          <button className="btn-primary" onClick={openEdit}>Edit Profile</button>
          <button className="btn-secondary">Find Match</button>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="edit-overlay" onClick={closeEdit}>
          <div className="edit-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <h3 className="edit-title">Edit Profile</h3>

            {/* Username field */}
            <div className="edit-field">
              <label className="edit-label">Username</label>
              <input
                className="edit-input"
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                maxLength={25}
                placeholder="Enter username"
              />
            </div>

            {/* Avatar URL field */}
            <div className="edit-field">
              <label className="edit-label">Avatar URL</label>
              <input
                className="edit-input"
                type="url"
                value={editAvatarUrl}
                onChange={(e) => setEditAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            {/* Quick avatar picker */}
            <div className="edit-field">
              <label className="edit-label">Quick Pick</label>
              <div className="avatar-presets">
                {avatarSeeds.map((seed) => {
                  const url = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
                  return (
                    <img
                      key={seed}
                      src={url}
                      alt={seed}
                      title={seed}
                      className={`avatar-preset ${editAvatarUrl === url ? 'selected' : ''}`}
                      onClick={() => setEditAvatarUrl(url)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Preview */}
            {editAvatarUrl && (
              <div className="edit-preview">
                <img src={editAvatarUrl} alt="Preview" className="preview-avatar" />
                <span className="preview-name">{editUsername || 'Player'}</span>
              </div>
            )}

            {/* Error */}
            {profile.error && (
              <p className="edit-error">{profile.error}</p>
            )}

            {/* Success */}
            {saveSuccess && (
              <p className="edit-success">✅ Profile updated!</p>
            )}

            {/* Buttons */}
            <div className="edit-actions">
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={profile.saving || !editUsername.trim()}
              >
                {profile.saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button className="btn-secondary" onClick={closeEdit}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

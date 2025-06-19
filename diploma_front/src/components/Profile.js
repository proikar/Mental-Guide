import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/authApi';
import { t } from '../utils/i18n';
import './Profile.css';

function Profile({ user, setIsAuth, setUser, settings, onSettingsChange, isSidebarOpen, toggleSidebar }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', createdAt: '', role: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    try {
      setLoading(true);
      await authService.logout();
      setIsAuth(false);
      setUser(null);
      navigate('/login');
    } catch (err) {
      setIsAuth(false);
      setUser(null);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [setIsAuth, setUser, navigate]);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await authService.getProfile();

      if (!profile) {
        throw new Error(t('profileLoadError', settings.language));
      }

      const username = profile.username || profile.email?.split('@')[0] || 'User';

      setFormData({
        username,
        email: profile.email || '',
        createdAt: profile.createdAt
          ? new Date(profile.createdAt).toLocaleDateString(
              settings.language === 'en' ? 'en-US' : 'ru-RU',
              { year: 'numeric', month: 'long', day: 'numeric' }
            )
          : t('dateNotSpecified', settings.language),
        role: profile.role || 'USER'
      });

      setUser(profile);
    } catch (err) {
      setError(err.message || t('profileLoadError', settings.language));
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [setUser, settings.language, handleLogout]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    try {
      if (!formData.username.trim()) {
        throw new Error(t('usernameCannotBeEmpty', settings.language));
      }

      setLoading(true);
      setError(null);

      const updatedProfile = await authService.updateProfile({
        username: formData.username.trim()
      });

      const newUsername =
        updatedProfile.username ||
        updatedProfile.email?.split('@')[0] ||
        'User';

      setFormData(prev => ({
        ...prev,
        username: newUsername
      }));

      setUser(prev => ({
        ...prev,
        ...updatedProfile,
        username: newUsername
      }));

      setIsEditing(false);
    } catch (err) {
      setError(err.message || t('profileUpdateError', settings.language));
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchProfile();
  };

  return (
    <div className={`profile-page-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <div className="profile-content">
        {loading && !isEditing ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>{t('profileLoading', settings.language)}</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <h3>{t('error', settings.language)}</h3>
            <p>{error}</p>
            <div className="button-group">
              <button onClick={fetchProfile} className="retry-btn">
                {t('tryAgain', settings.language)}
              </button>
              <button onClick={handleLogout} className="logout-btn">
                {t('logout', settings.language)}
              </button>
            </div>
          </div>
        ) : (
          <div className="profile-main">
            <div className="profile-cover">
              <div className="profile-avatar-wrapper">
                <div className="profile-avatar-big">
                  {formData.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              <div className="profile-cover-gradient"></div>
            </div>

            <div className="profile-username-row">
              {isEditing ? (
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="profile-input-big"
                  maxLength="30"
                  disabled={loading}
                  autoFocus
                />
              ) : (
                <h2 className="profile-username">{formData.username}</h2>
              )}
              <button
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
                className="profile-edit-btn"
                disabled={loading}
                title={isEditing ? t('save', settings.language) : t('edit', settings.language)}
              >
                {isEditing ? (
                  <span className="material-icons">check</span>
                ) : (
                  <span className="material-icons">edit</span>
                )}
              </button>
              {isEditing && (
                <button
                  onClick={handleCancel}
                  className="profile-cancel-btn"
                  disabled={loading}
                  title={t('cancel', settings.language)}
                >
                  <span className="material-icons">close</span>
                </button>
              )}
            </div>

            <div className="profile-info-cards">
              <div className="profile-info-card">
                <span className="material-icons profile-info-icon">alternate_email</span>
                <div>
                  <div className="profile-info-label">{t('email', settings.language)}</div>
                  <div className="profile-info-value profile-email-value">{formData.email}</div>
                </div>
              </div>
              <div className="profile-info-card">
                <span className="material-icons profile-info-icon">verified_user</span>
                <div>
                  <div className="profile-info-label">{t('role', settings.language)}</div>
                  <div className="profile-info-value">{formData.role}</div>
                </div>
              </div>
              <div className="profile-info-card">
                <span className="material-icons profile-info-icon">event</span>
                <div>
                  <div className="profile-info-label">{t('registrationDate', settings.language)}</div>
                  <div className="profile-info-value">{formData.createdAt}</div>
                </div>
              </div>
            </div>

            <div className="profile-status-card">
              <span className="material-icons profile-status-icon">emoji_nature</span>
              <div>
                <div className="profile-status-label">{t('status', settings.language)}</div>
                <div className="profile-status-value">
                  {t('profileWelcome', settings.language)}, {formData.username}!
                </div>
              </div>
            </div>

            <div className="profile-actions-row">
              <button onClick={handleLogout} className="profile-logout-btn" disabled={loading}>
                <span className="material-icons">logout</span>
                {loading ? t('loggingOut', settings.language) : t('logout', settings.language)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;

import React, { useState, useEffect } from 'react';
import './SettingsModal.css';
import { t } from '../utils/i18n';

const SettingsModal = ({ isOpen, onClose, settings = {}, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState({
    language: 'ru',
    theme: 'light',
    notificationsEnabled: true,
    ...settings,
  });

  useEffect(() => {
    setLocalSettings({
      language: 'ru',
      theme: 'light',
      notificationsEnabled: true,
      ...settings,
    });
  }, [settings, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLocalSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof onSettingsChange === 'function') {
      onSettingsChange(localSettings);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="settings-modal">
        <div className="modal-header">
          <h3 id="settings-title">{t('settings', localSettings.language)}</h3>
          <button onClick={onClose} className="close-btn" aria-label={t('close', localSettings.language)}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          {/* Language selector */}
          <div className="form-group">
            <label htmlFor="language">{t('language', localSettings.language)}:</label>
            <select
              id="language"
              name="language"
              value={localSettings.language}
              onChange={handleChange}
            >
              <option value="ru">{t('russian', localSettings.language)}</option>
              <option value="en">{t('english', localSettings.language)}</option>
              <option value="kz">{t('kazakh', localSettings.language)}</option>
            </select>
          </div>

          {/* Theme selector */}
          <div className="form-group">
            <label htmlFor="theme">{t('theme', localSettings.language)}:</label>
            <select
              id="theme"
              name="theme"
              value={localSettings.theme}
              onChange={handleChange}
            >
              <option value="light">{t('lightTheme', localSettings.language)}</option>
              <option value="dark">{t('darkTheme', localSettings.language)}</option>
              <option value="system">{t('systemTheme', localSettings.language)}</option>
            </select>
          </div>

          {/* Notifications checkbox */}
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="notifications"
              name="notificationsEnabled"
              checked={localSettings.notificationsEnabled}
              onChange={handleChange}
            />
            <label htmlFor="notifications">
              {t('notifications', localSettings.language)}
            </label>
          </div>

          {/* Buttons */}
          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              {t('cancel', localSettings.language)}
            </button>
            <button type="submit" className="save-btn">
              {t('save', localSettings.language)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;

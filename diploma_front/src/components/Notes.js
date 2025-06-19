import React, { useState, useEffect } from 'react';
import { notesService } from '../api/notesApi';
import { t } from '../utils/i18n';
import './Notes.css';

const SORT_OPTIONS = [
  { value: 'newest', label: (lang) => t('sortNewest', lang) },
  { value: 'oldest', label: (lang) => t('sortOldest', lang) },
  { value: 'az', label: (lang) => t('sortAZ', lang) },
  { value: 'za', label: (lang) => t('sortZA', lang) },
];

const sortNotes = (notes, sortType) => {
  switch (sortType) {
    case 'oldest':
      return [...notes].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    case 'az':
      return [...notes].sort((a, b) => a.content.localeCompare(b.content, 'ru', { sensitivity: 'base' }));
    case 'za':
      return [...notes].sort((a, b) => b.content.localeCompare(a.content, 'ru', { sensitivity: 'base' }));
    case 'newest':
    default:
      return [...notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};

const Notes = ({
  user,
  settings,
  sidebarOpen,
  toggleSidebar,
  openSettings
}) => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortType, setSortType] = useState('newest');

  useEffect(() => {
    const loadNotes = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await notesService.getNotes();
        setNotes(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (user) loadNotes();
  }, [user]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setLoading(true);
    setError('');
    try {
      const createdNote = await notesService.addNote(newNote);
      setNotes(prev => [...prev, createdNote]);
      setNewNote('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async (id) => {
    if (!editContent.trim()) return;
    setLoading(true);
    setError('');
    try {
      const updatedNote = await notesService.editNote(id, editContent);
      setNotes(notes.map(note => (note.id === id ? updatedNote : note)));
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (id) => {
    setLoading(true);
    setError('');
    try {
      await notesService.deleteNote(id);
      setNotes(notes.filter(note => note.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent('');
  };

  const sortedNotes = sortNotes(notes, sortType);

  return (
    <div className="notes-page">
      {/* Сайдбар больше не рендерим тут! */}
      <div
        className="notes-content-wrapper"
        style={{
          marginLeft: sidebarOpen ? '260px' : '72px',
          transition: 'margin-left 0.35s cubic-bezier(.77,0,.18,1)',
        }}
      >
        <div className="notes-container">
          <div className="notes-header">
            <h2>{t('myNotes', settings.language)}</h2>
            <div className="notes-sort">
              <label htmlFor="sort">{t('sort', settings.language)}:</label>
              <select
                id="sort"
                value={sortType}
                onChange={e => setSortType(e.target.value)}
                disabled={loading}
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label(settings.language)}</option>
                ))}
              </select>
            </div>
            {/* Кнопка настроек, если нужно: */}
            <button
              className="notes-settings-btn"
              onClick={openSettings}
              title={t('settings', settings.language)}
              aria-label={t('settings', settings.language)}
            >
              ⚙️
            </button>
            {/* Кнопка сайдбара, если нужно на мобильных: */}
            <button
              className="notes-sidebar-toggle-btn"
              onClick={toggleSidebar}
              title={sidebarOpen ? t('closeMenu', settings.language) : t('openMenu', settings.language)}
              aria-label={sidebarOpen ? t('closeMenu', settings.language) : t('openMenu', settings.language)}
            >
              ☰
            </button>
          </div>
          {error && <div className="notes-error">{error}</div>}
          <div className="notes-add-form">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder={t('enterNote', settings.language)}
              disabled={loading}
              maxLength={500}
            />
            <button
              onClick={handleAddNote}
              disabled={loading || !newNote.trim()}
            >
              {loading ? t('adding', settings.language) : t('add', settings.language)}
            </button>
          </div>
          {loading && notes.length === 0 ? (
            <div className="notes-loading">{t('loadingNotes', settings.language)}</div>
          ) : (
            <div className="notes-list">
              {sortedNotes.length === 0 ? (
                <div className="notes-empty">{t('noNotes', settings.language)}</div>
              ) : (
                sortedNotes.map(note => (
                  <div key={note.id} className="notes-item">
                    {editingId === note.id ? (
                      <div className="notes-edit-form">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          disabled={loading}
                          maxLength={500}
                        />
                        <div className="notes-edit-actions">
                          <button
                            onClick={() => handleUpdateNote(note.id)}
                            disabled={loading || !editContent.trim()}
                          >
                            {t('save', settings.language)}
                          </button>
                          <button
                            onClick={cancelEditing}
                            disabled={loading}
                          >
                            {t('cancel', settings.language)}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="notes-content">{note.content}</div>
                        <div className="notes-meta">
                          <span>
                            {note.createdAt
                              ? new Date(note.createdAt).toLocaleString(settings.language === 'en' ? 'en-US' : 'ru-RU', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </span>
                        </div>
                        <div className="notes-actions">
                          <button
                            onClick={() => startEditing(note)}
                            disabled={loading}
                            aria-label={t('editNote', settings.language)}
                            title={t('editNote', settings.language)}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            disabled={loading}
                            aria-label={t('deleteNote', settings.language)}
                            title={t('deleteNote', settings.language)}
                          >
                            🗑️
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notes;

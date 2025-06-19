import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AdminUserDetail.css';

function cleanText(text) {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

export default function AdminUserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Состояния сортировки: true = по возрастанию, false = по убыванию
  const [sortChatsAsc, setSortChatsAsc] = useState(false);
  const [sortNotesAsc, setSortNotesAsc] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const token = localStorage.getItem('isAdmin');

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        const [chatsRes, notesRes] = await Promise.all([
          fetch(`http://localhost:8090/admin/chats/${userId}`, { headers }),
          fetch(`http://localhost:8090/admin/notes/${userId}`, { headers }),
        ]);

        if (!chatsRes.ok || !notesRes.ok) {
          throw new Error('Ошибка при получении данных');
        }

        const chatsData = await chatsRes.json();
        const notesData = await notesRes.json();

        setChats(chatsData);
        setNotes(notesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [userId]);

  // Функция сортировки по дате для чатов
  const sortByDate = (arr, asc) => {
    return [...arr].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return asc ? dateA - dateB : dateB - dateA;
    });
  };

  // Функция сортировки по id для заметок
  const sortById = (arr, asc) => {
    return [...arr].sort((a, b) => {
      if (typeof a.id === 'number' && typeof b.id === 'number') {
        return asc ? a.id - b.id : b.id - a.id;
      } else {
        return asc
          ? String(a.id).localeCompare(String(b.id))
          : String(b.id).localeCompare(String(a.id));
      }
    });
  };

  const sortedChats = sortByDate(chats, sortChatsAsc);
  const sortedNotes = sortById(notes, sortNotesAsc);

  const handleBack = () => navigate('/admin');

  return (
    <div className="user-detail">
      <button onClick={handleBack} className="back-btn">← Назад</button>

      {loading ? (
        <div className="user-detail-loading">Загрузка...</div>
      ) : error ? (
        <div className="user-detail-error">Ошибка: {error}</div>
      ) : (
        <>
          <section className="section-block">
            <h2>История чатов пользователя #{userId}</h2>
            <div className="sort-controls">
              <button
                className={`sort-btn ${sortChatsAsc ? 'active' : ''}`}
                onClick={() => setSortChatsAsc(!sortChatsAsc)}
                aria-label="Сортировать чаты по дате"
              >
                Сортировать по дате {sortChatsAsc ? '↑' : '↓'}
              </button>
            </div>
            <ul className="chat-list">
              {sortedChats.length > 0 ? (
                sortedChats.map((chat) => (
                  <li key={chat.id} className="chat-item">
                    <div><strong>Чат ID:</strong> {chat.id}</div>
                    <div><strong>Входящее сообщение:</strong> {cleanText(chat.input)}</div>
                    <div><strong>Ответ:</strong> {cleanText(chat.response)}</div>
                    <div className="chat-time"><small>{new Date(chat.createdAt).toLocaleString()}</small></div>
                  </li>
                ))
              ) : (
                <li className="empty-state">Нет сообщений</li>
              )}
            </ul>
          </section>

          <section className="section-block">
            <h2>Заметки</h2>
            <div className="sort-controls">
              <button
                className={`sort-btn ${sortNotesAsc ? 'active' : ''}`}
                onClick={() => setSortNotesAsc(!sortNotesAsc)}
                aria-label="Сортировать заметки по id"
              >
                Сортировать по ID {sortNotesAsc ? '↑' : '↓'}
              </button>
            </div>
            <ul className="note-list">
              {sortedNotes.length > 0 ? (
                sortedNotes.map((note) => (
                  <li key={note.id} className="note-item">
                    <div><strong>Заметка ID:</strong> {note.id}</div>
                    <div><strong>{note.title}</strong>: {cleanText(note.content)}</div>
                    {/* Время убрано */}
                  </li>
                ))
              ) : (
                <li className="empty-state">Нет заметок</li>
              )}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

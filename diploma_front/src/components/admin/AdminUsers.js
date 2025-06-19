import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminUsers.css';

export default function AdminUsers({ users, onRefresh }) {
  const navigate = useNavigate();

  // Состояние сортировки
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });

  // Функция для сортировки
  const sortedUsers = useMemo(() => {
    if (!users) return [];
    const sortableItems = [...users];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Для даты и строки форматируем правильно
        if (sortConfig.key === 'createdAt') {
          aValue = aValue ? new Date(aValue) : new Date(0);
          bValue = bValue ? new Date(bValue) : new Date(0);
        } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [users, sortConfig]);

  // Обработчик клика по заголовку для сортировки
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? '▲' : '▼';
    }
    return '';
  };

  const handleUserClick = (userId) => {
    navigate(`/admin/users/${userId}`);
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return 'не указано';
    const date = new Date(dateString);
    if (isNaN(date)) return 'не указано';
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="admin-users">
      <h2>Список пользователей</h2>
      <button onClick={onRefresh} className="refresh-button">Обновить</button>
      <table>
        <thead>
          <tr>
            <th onClick={() => requestSort('id')} className="sortable">
              ID {getSortIndicator('id')}
            </th>
            <th onClick={() => requestSort('username')} className="sortable">
              Имя {getSortIndicator('username')}
            </th>
            <th onClick={() => requestSort('email')} className="sortable">
              Email {getSortIndicator('email')}
            </th>
            <th onClick={() => requestSort('createdAt')} className="sortable">
              Дата регистрации {getSortIndicator('createdAt')}
            </th>
            <th>Активность</th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map(user => (
            <tr
              key={user.id}
              onClick={() => handleUserClick(user.id)}
              className="user-row"
              tabIndex={0}
              role="button"
              aria-pressed="false"
            >
              <td data-label="ID">{user.id}</td>
              <td data-label="Имя">{user.username || '—'}</td>
              <td data-label="Email">{user.email}</td>
              <td data-label="Дата регистрации">{formatDate(user.createdAt)}</td>
              <td data-label="Активность" className={user.active ? 'active' : 'inactive'}>
                {user.active ? 'Активен' : 'Не активен'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

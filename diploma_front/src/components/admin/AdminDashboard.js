// AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminStats from './AdminStats';
import AdminUsers from './AdminUsers';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('isAdmin');
      if (!token) {
        navigate('/admin/login');
        return;
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [usersResponse, statsResponse] = await Promise.all([
        fetch('http://localhost:8090/admin/users', { headers }),
        fetch('http://localhost:8090/admin/stats/summary', { headers })
      ]);

      if (usersResponse.status === 401 || statsResponse.status === 401) {
        localStorage.removeItem('isAdmin');
        navigate('/admin/login');
        return;
      }

      if (!usersResponse.ok) {
        throw new Error(`Users API error: ${usersResponse.status}`);
      }

      if (!statsResponse.ok) {
        throw new Error(`Stats API error: ${statsResponse.status}`);
      }

      const usersData = await usersResponse.json();
      const statsData = await statsResponse.json();

      setUsers(usersData);
      setStats(statsData);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    navigate('/admin/login');
  };

  const handleRefresh = () => {
    fetchData();
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Загрузка данных...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <p>Ошибка: {error}</p>
        <button onClick={handleRefresh} className="refresh-btn">Попробовать снова</button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Административная панель</h1>
        <div className="admin-actions">
          <button onClick={handleRefresh} className="refresh-btn">Обновить</button>
          <button onClick={handleLogout} className="logout-btn">Выйти</button>
        </div>
      </header>

      <AdminStats stats={stats} />
      <AdminUsers users={users} onRefresh={handleRefresh} />
    </div>
  );
}

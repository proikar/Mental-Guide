import './AdminStats.css';

export default function AdminStats({ stats }) {
  return (
    <div className="stats-container">
      <div className="stat-card">
        <h3>Пользователи</h3>
        <p>{stats?.totalUsers || 0}</p>
        <span className="stat-description">Всего зарегистрировано</span>
      </div>
      <div className="stat-card">
        <h3>Диалоги</h3>
        <p>{stats?.totalChats || 0}</p>
        <span className="stat-description">Всего сообщений</span>
      </div>
      <div className="stat-card">
        <h3>Активные</h3>
        <p>{stats?.activeUsers || 0}</p>
        <span className="stat-description">Пользователей за месяц</span>
      </div>
    </div>
  );
}

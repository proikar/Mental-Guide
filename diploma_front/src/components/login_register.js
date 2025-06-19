import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSpring, animated } from 'react-spring';
import { authService, authUtils } from '../api/authApi';
import './login_register.css';

function LogReg({ setIsAuth, setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const err = params.get('error');

    if (token) {
      authUtils.setToken(token);
      setIsAuth(true);
      loadUserProfile();
      navigate('/chat', { replace: true });
    } else if (err) {
      setError(decodeURIComponent(err));
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate, setIsAuth]);

  const loadUserProfile = async () => {
    try {
      const profile = await authService.getProfile();
      setUser({ 
        id: profile.id, 
        username: profile.username, 
        email: profile.email 
      });
    } catch (err) {
      setError('Ошибка загрузки профиля');
      authUtils.removeToken();
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Валидация
    if (!isLogin && !formData.username.trim()) {
      setError('Имя пользователя обязательно');
      setLoading(false);
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Пожалуйста, введите корректный email');
      setLoading(false);
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await authService.login({
          email: formData.email,
          password: formData.password
        });
      } else {
        await authService.register({
          username: formData.username,
          email: formData.email,
          password: formData.password
        });
      }

      const profile = await authService.getProfile();
      setUser({ 
        id: profile.id, 
        username: profile.username, 
        email: profile.email 
      });
      
      setIsAuth(true);
      navigate('/chat', { replace: true });
    } catch (err) {
      setError(
        err.message || 'Произошла ошибка при аутентификации'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLoginRedirect = () => {
    navigate('/admin/login');
  };

  const switchAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({ username: '', email: '', password: '' });
  };

  const leftSpring = useSpring({
    transform: isLogin ? 'translateX(0%)' : 'translateX(100%)',
    config: { tension: 220, friction: 26 },
  });
  
  const rightSpring = useSpring({
    transform: isLogin ? 'translateX(0%)' : 'translateX(-100%)',
    config: { tension: 220, friction: 26 },
  });

  return (
    <div className="auth-wrapper">
      <animated.div className="auth-panel left-panel" style={leftSpring}>
        {isLogin ? (
          <div className="welcome-panel">
            <h1 className="auth-title">Добро пожаловать</h1>
            <p className="auth-subtitle">
              Пожалуйста, войдите в свой аккаунт
            </p>
            <div className="auth-switch-text">
              Нет аккаунта?
              <button
                onClick={switchAuthMode}
                className="auth-switch-btn"
                disabled={loading}
                aria-label="Перейти к регистрации"
              >
                Зарегистрироваться
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <h2 className="form-header">Регистрация</h2>
            {error && <div className="auth-error">{error}</div>}
            <label className="form-label" htmlFor="username">
              Имя пользователя
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Введите имя"
                disabled={loading}
                required
                autoComplete="username"
                className="form-input"
              />
            </label>
            <label className="form-label" htmlFor="email">
              Email
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Введите email"
                disabled={loading}
                required
                autoComplete="email"
                className="form-input"
              />
            </label>
            <label className="form-label" htmlFor="password">
              Пароль
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Минимум 6 символов"
                disabled={loading}
                required
                minLength={6}
                autoComplete="new-password"
                className="form-input"
              />
            </label>
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
              aria-live="polite"
            >
              {loading ? 'Загрузка...' : 'Зарегистрироваться'}
            </button>
          </form>
        )}
      </animated.div>

      <animated.div className="auth-panel right-panel" style={rightSpring}>
        {isLogin ? (
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <h2 className="form-header">Вход</h2>
            {error && <div className="auth-error">{error}</div>}
            <label className="form-label" htmlFor="email">
              Email
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Введите email"
                disabled={loading}
                required
                autoComplete="email"
                className="form-input"
              />
            </label>
            <label className="form-label" htmlFor="password">
              Пароль
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Минимум 6 символов"
                disabled={loading}
                required
                minLength={6}
                autoComplete="current-password"
                className="form-input"
              />
            </label>
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
              aria-live="polite"
            >
              {loading ? 'Загрузка...' : 'Войти'}
            </button>
            <button
              type="button"
              className="admin-login-link"
              onClick={handleAdminLoginRedirect}
              disabled={loading}
            >
              Вход для администратора
            </button>
          </form>
        ) : (
          <div className="welcome-panel">
            <h1 className="auth-title">Добро пожаловать!</h1>
            <p className="auth-subtitle">Уже есть аккаунт?</p>
            <div className="auth-switch-text">
              <button
                onClick={switchAuthMode}
                className="auth-switch-btn"
                disabled={loading}
                aria-label="Перейти ко входу"
              >
                Войти
              </button>
            </div>
          </div>
        )}
      </animated.div>
    </div>
  );
}

export default LogReg;
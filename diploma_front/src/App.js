import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LogReg from './components/login_register';
import Chat from './components/Chat';
import Profile from './components/Profile';
import Notes from './components/Notes';
import MoodTracker from './components/MoodTracker';
import SettingsModal from './components/SettingsModal';
import AdminLogin from './components/admin/AdminLogin';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminUsers from './components/admin/AdminUsers';
import AdminUserDetail from './components/admin/AdminUserDetail';
import LeftSidebar from './components/leftSidebar';
import { initializeAuth, authService } from './api/authApi';
import './App.css';

function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('appSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      language: 'ru',
      theme: 'light',
      notificationsEnabled: true,
    };
  });
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const savedSidebar = localStorage.getItem('sidebarOpen');
    return savedSidebar !== null ? JSON.parse(savedSidebar) : true;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'light');
  }, [settings.theme]);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        const { isAdmin: adminStatus, isUser } = await initializeAuth();
        setIsAdmin(adminStatus);
        
        if (isUser) {
          const profile = await authService.getProfile();
          setUser({
            id: profile.id,
            email: profile.email,
            username: profile.username || profile.email.split('@')[0]
          });
          setIsAuth(true);
        } else {
          setIsAuth(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Ошибка инициализации:', error);
        setIsAuth(false);
        setUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleSettingsChange = (newSettings) => {
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
    setSettings(newSettings);
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const openSettings = () => setSettingsOpen(true);
  const closeSettings = () => setSettingsOpen(false);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Проверка авторизации...</p>
      </div>
    );
  }

  return (
    <>
      <SettingsModal
        isOpen={settingsOpen}
        onClose={closeSettings}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />

      <Router>
        {isAuth && !isAdmin && user && (
          <LeftSidebar
            user={user}
            isOpen={sidebarOpen}
            toggleSidebar={toggleSidebar}
            settings={settings}
            openSettings={openSettings}
          />
        )}

        <div className={`content ${isAuth && !isAdmin ? 'with-sidebar' : ''} ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
          <Routes>
            <Route
              path="/login"
              element={
                isAuth || isAdmin ? (
                  <Navigate to={isAdmin ? '/admin' : '/chat'} replace />
                ) : (
                  <LogReg setIsAuth={setIsAuth} setUser={setUser} />
                )
              }
            />
            <Route
              path="/admin/login"
              element={isAdmin ? <Navigate to="/admin" replace /> : <AdminLogin setIsAdmin={setIsAdmin} />}
            />
            <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <Navigate to="/admin/login" replace />} />
            <Route path="/admin/users" element={isAdmin ? <AdminUsers /> : <Navigate to="/admin/login" replace />} />
            <Route path="/admin/users/:userId" element={isAdmin ? <AdminUserDetail /> : <Navigate to="/admin/login" replace />} />
            <Route
              path="/chat"
              element={isAuth ? 
                <Chat 
                  user={user} 
                  settings={settings} 
                  sidebarOpen={sidebarOpen} 
                  openSettings={openSettings}
                /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/profile"
              element={isAuth ? 
                <Profile 
                  user={user} 
                  setIsAuth={setIsAuth} 
                  setUser={setUser} 
                  settings={settings} 
                  sidebarOpen={sidebarOpen}
                  openSettings={openSettings}
                /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/notes"
              element={isAuth ? 
                <Notes 
                  user={user} 
                  settings={settings} 
                  sidebarOpen={sidebarOpen}
                  openSettings={openSettings}
                /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/mood-tracker"
              element={isAuth ? 
                <MoodTracker 
                  settings={settings} 
                  sidebarOpen={sidebarOpen} 
                  openSettings={openSettings}
                /> : <Navigate to="/login" replace />}
            />
            <Route path="/" element={<Navigate to={isAuth ? '/chat' : '/login'} replace />} />
          </Routes>
        </div>
      </Router>
    </>
  );
}

export default App;
import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./leftSidebar.css";
import Logos from "../images/logo.png";
import { t } from "../utils/i18n";

const LeftSidebar = ({ isOpen, toggleSidebar, settings = {}, openSettings }) => {
  const location = useLocation();
  const lang = settings.language || "ru";

  return (
    <aside className={`sidebar ${isOpen ? "open" : "closed"}`} aria-label="Sidebar navigation">
      {/* Современная кнопка вверху панели */}
      <div className="sidebar-toggle-container">
        <button
          className="menu-toggle"
          onClick={toggleSidebar}
          aria-label={isOpen ? t("closeMenu", lang) : t("openMenu", lang)}
          title={isOpen ? t("closeMenu", lang) : t("openMenu", lang)}
        >
          {isOpen ? "←" : "→"}
        </button>
      </div>

      <div className="sidebar-logo" aria-label={t("appName", lang)}>
        <span className="logo-icon">
          <img src={Logos} alt={t("appName", lang)} />
        </span>
        {isOpen && <span className="logo-text">Mental Guide</span>}
      </div>

      <nav>
        <ul>
          <li className={location.pathname === "/chat" ? "active" : ""}>
            <Link to="/chat" tabIndex={isOpen ? 0 : -1}>
              <span className="nav-icon" role="img" aria-label={t("chat", lang)}>
                💬
              </span>
              {isOpen && <span className="nav-text">{t("chat", lang)}</span>}
            </Link>
          </li>
          <li className={location.pathname === "/profile" ? "active" : ""}>
            <Link to="/profile" tabIndex={isOpen ? 0 : -1}>
              <span className="nav-icon" role="img" aria-label={t("profile", lang)}>
                👤
              </span>
              {isOpen && <span className="nav-text">{t("profile", lang)}</span>}
            </Link>
          </li>
          <li className={location.pathname === "/notes" ? "active" : ""}>
            <Link to="/notes" tabIndex={isOpen ? 0 : -1}>
              <span className="nav-icon" role="img" aria-label={t("notes", lang)}>
                📚
              </span>
              {isOpen && <span className="nav-text">{t("notes", lang)}</span>}
            </Link>
          </li>
          <li className={location.pathname === "/mood-tracker" ? "active" : ""}>
            <Link to="/mood-tracker" tabIndex={isOpen ? 0 : -1}>
              <span className="nav-icon" role="img" aria-label={t("moodTracker", lang)}>
                📊
              </span>
              {isOpen && <span className="nav-text">{t("moodTracker", lang)}</span>}
            </Link>
          </li>
          <li>
            <button
              className="settings-button"
              onClick={openSettings}
              aria-haspopup="dialog"
              tabIndex={isOpen ? 0 : -1}
            >
              <span className="nav-icon" role="img" aria-label={t("settings", lang)}>
                ⚙️
              </span>
              {isOpen && <span className="nav-text">{t("settings", lang)}</span>}
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default LeftSidebar;

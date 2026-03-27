import "./Header.css"

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

export default function Header({ adminOpen, onToggleAdmin, onNewCase, theme, onToggleTheme }) {
  const isDark = theme === "dark"

  return (
    <header className="header">
      <div className="header-left">
        <img
          src="/logos/logo.jpg"
          alt="Logo"
          className="header-logo"
          onError={e => { e.target.style.display = "none" }}
        />
        <div className="header-divider" />
        <span className="header-title">Smart Retain</span>
      </div>
      <div className="header-right">
        <button className="new-case-btn" onClick={onNewCase} title="Nuevo caso">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>Nuevo caso</span>
        </button>
        <button
          className={`admin-toggle ${adminOpen ? "active" : ""}`}
          onClick={onToggleAdmin}
          title={adminOpen ? "Ocultar panel admin" : "Mostrar panel admin"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          <span>Admin</span>
        </button>

        {/* Switch luna/sol */}
        <button
          className={`theme-switch ${isDark ? "dark" : "light"}`}
          onClick={onToggleTheme}
          title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          <span className="switch-knob" />
          <span className="switch-moon"><MoonIcon /></span>
          <span className="switch-sun"><SunIcon /></span>
        </button>
      </div>
    </header>
  )
}

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, Settings, UserCircle, Activity, Menu, Sun, Moon } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const { profile, signOut } = useAuth();
  const location = useLocation();

  // Caso o Supabase não tenha registrado um nome, ele usa "Usuário UUID", então tratamos isso na interface:
  const displayName = profile?.full_name && profile.full_name.includes('-') 
    ? 'Usuário Master' 
    : profile?.full_name || 'Usuário';

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleLogout = async () => {
    await signOut();
  };

  const navItems = [
    { name: 'Painel Geral', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Meus Dados', path: '/meus-dados', icon: <UserCircle size={20} /> },
    { name: 'Configurações', path: '#', icon: <Settings size={20} /> },
  ];

  return (
    <div className="layout-container">
      {/* Sidebar Lateral */}
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header" style={{ justifyContent: isCollapsed ? 'center' : 'space-between' }}>
          <div className="flex-row" style={{ display: isCollapsed ? 'none' : 'flex' }}>
            <Activity size={28} color="hsl(var(--primary))" />
            <h2 className="brand-title" style={{ fontSize: '1.5rem', margin: 0 }}>SysNexo</h2>
          </div>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}
            title="Alternar Menu"
          >
            <Menu size={24} color="hsl(var(--text-muted))" />
          </button>
        </div>

        <div className="user-profile-sm" style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', marginBottom: '2rem', padding: '0 0.5rem' }}>
          <div className="avatar-sm" title={displayName}>
            {displayName[0].toUpperCase()}
          </div>
          {!isCollapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-main))', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {displayName}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'capitalize' }}>
                {profile?.role || 'Visitante'}
              </div>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, idx) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                to={item.path} 
                key={idx} 
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={(e) => { if (item.path === '#') e.preventDefault() }}
                title={isCollapsed ? item.name : undefined}
              >
                {item.icon}
                <span className="nav-label">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer" style={{ padding: isCollapsed ? '1.5rem 0 0 0' : '1.5rem 0 0 0', alignItems: isCollapsed ? 'center' : 'stretch' }}>
          <button className="btn-logout" onClick={handleLogout} title="Sair do sistema">
            <LogOut size={18} />
            {!isCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal (Direita) */}
      <main className="layout-main">
        {/* Topbar Simplificada Flutuante */}
        <header className="topbar-modern">
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'hsl(var(--text-main))' }}>
            {location.pathname === '/dashboard' ? 'Resumo de Atividades' : 'Ficha de Paciente'}
          </div>
          <div className="flex-row">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}
              title="Alternar Tema"
            >
              {isDarkMode ? <Sun size={20} color="hsl(var(--text-muted))" /> : <Moon size={20} color="hsl(var(--text-muted))" />}
            </button>
            <span className="text-muted text-sm">Versão 1.0.0</span>
          </div>
        </header>

        {/* Injeção das Páginas */}
        <div className="layout-body">
          {children}
        </div>
      </main>
    </div>
  );
};

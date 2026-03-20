import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, Settings, Activity, Menu, Sun, Moon, Bell, Users, ChevronDown, ChevronRight, FileText, Contact2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const location = useLocation();
  
  // Caso o Supabase não tenha registrado um nome, ele usa "Usuário UUID", então tratamos isso na interface:
  const formatName = (name: string) => {
    if (!name || name.includes('-')) return 'Usuário';
    const parts = name.trim().split(/\s+/);
    if (parts.length <= 2) return name;
    return `${parts[0]} ${parts[1]}`;
  };

  const displayName = profile?.full_name ? formatName(profile.full_name) : 'Usuário';

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
    ...(profile?.role === 'psicologo' || profile?.role === 'admin' ? [
      { name: 'Meus Pacientes', path: '/pacientes', icon: <Contact2 size={20} /> },
      { name: 'Prontuários', path: '/prontuarios', icon: <FileText size={20} /> },
    ] : []),
    { name: 'Configurações', path: '#', icon: <Settings size={20} />, action: 'openSettings' },
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

        <Link 
          to="/meus-dados" 
          className="user-profile-sm" 
          title="Ver Meus Dados"
          style={{ 
            justifyContent: isCollapsed ? 'center' : 'flex-start', 
            marginBottom: '1.5rem', 
            margin: '0 -0.5rem 1.5rem -0.5rem' 
          }}
        >
          <div className="avatar-sm">
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
        </Link>

        <nav className="sidebar-nav">
          {navItems.map((item, idx) => {
            const isActive = location.pathname === item.path;
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
                <Link 
                  to={item.path} 
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={(e) => { 
                    if (item.path === '#') e.preventDefault();
                    if (item.action === 'openSettings') setIsSettingsOpen(!isSettingsOpen);
                  }}
                  title={isCollapsed ? item.name : undefined}
                  style={item.action === 'openSettings' ? { justifyContent: 'space-between', paddingRight: '0.5rem' } : undefined}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {item.icon}
                    {!isCollapsed && <span className="nav-label">{item.name}</span>}
                  </div>
                  {item.action === 'openSettings' && !isCollapsed && (
                    isSettingsOpen ? <ChevronDown size={18} color="hsl(var(--text-muted))" /> : <ChevronRight size={18} color="hsl(var(--text-muted))" />
                  )}
                </Link>

                {/* Submenu Inline para Configurações */}
                {item.action === 'openSettings' && isSettingsOpen && (
                  <div style={{ 
                    display: 'flex', flexDirection: 'column', gap: '0.25rem', 
                    marginTop: '0.25rem', paddingLeft: isCollapsed ? '0' : '1.5rem',
                    animation: 'fadeIn 0.2s ease-out'
                  }}>
                    <button 
                      onClick={() => setIsDarkMode(!isDarkMode)} 
                      className="nav-item" 
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: isCollapsed ? '0.8rem 0' : '0.6rem 1rem', width: '100%', flexDirection: 'row' }}
                      title="Alternar Tema Escuro"
                    >
                      {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
                      {!isCollapsed && <span className="nav-label">Modo Escuro</span>}
                    </button>
                    
                    <Link 
                      to="/usuarios"
                      className={`nav-item ${location.pathname === '/usuarios' ? 'active' : ''}`} 
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: isCollapsed ? '0.8rem 0' : '0.6rem 1rem', width: '100%', flexDirection: 'row' }}
                      title="Equipe e Acessos"
                    >
                      <Users size={18} />
                      {!isCollapsed && <span className="nav-label">Usuários</span>}
                    </Link>

                    <button   
                      className="nav-item" 
                      style={{ background: 'transparent', border: 'none', cursor: 'not-allowed', fontSize: '0.85rem', padding: isCollapsed ? '0.8rem 0' : '0.6rem 1rem', width: '100%', opacity: 0.5, flexDirection: 'row' }}
                      title="Em breve"
                      disabled
                    >
                      <Bell size={18} />
                      {!isCollapsed && <span className="nav-label">Notificações</span>}
                    </button>
                  </div>
                )}
              </div>
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

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, Settings, Activity, Menu, Sun, Moon, Bell, Users, ChevronDown, ChevronRight, FileText, Contact2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { profile, signOut, viewMode, setViewMode } = useAuth();
  const location = useLocation();
  const [brightness, setBrightness] = useState(1);
  const [isDisplayOpen, setIsDisplayOpen] = useState(false);

  const cycleBrightness = () => {
    setBrightness(prev => {
      if (prev <= 0.5) return 1;
      return prev - 0.25;
    });
  };
  
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
    ...(viewMode === 'psicologo' || viewMode === 'admin' ? [
      { name: 'Meus Pacientes', path: '/pacientes', icon: <Contact2 size={20} /> },
      { name: 'Prontuários', path: '/prontuarios', icon: <FileText size={20} /> },
    ] : []),
    { name: 'Configurações', path: '#', icon: <Settings size={20} />, action: 'openSettings' },
  ];

  return (
    <div className="layout-container" style={{ filter: `brightness(${brightness})` }}>
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
            {location.pathname === '/dashboard' ? 'Resumo de Atividades' : location.pathname.includes('/paciente/') ? 'Ficha de Paciente' : 'Sistema de Gestão'}
          </div>
          <div className="flex-row" style={{ gap: '0.75rem' }}>
            {/* Seletor de Modo Admin */}
            {profile?.role === 'admin' && (
              <div 
                style={{ 
                  display: 'flex', background: 'hsla(var(--primary), 0.1)', 
                  borderRadius: '20px', padding: '2px', border: '1px solid hsla(var(--primary), 0.2)' 
                }}
              >
                {[
                  { mode: 'recepcao', label: 'RECP' },
                  { mode: 'psicologo', label: 'PSI' },
                  { mode: 'admin', label: 'ALL' }
                ].map((m) => (
                  <button
                    key={m.mode}
                    onClick={() => setViewMode(m.mode as any)}
                    style={{
                      background: viewMode === m.mode ? 'hsl(var(--primary))' : 'transparent',
                      color: viewMode === m.mode ? 'white' : 'hsl(var(--text-muted))',
                      border: 'none', borderRadius: '18px', padding: '3px 10px', fontSize: '0.6rem',
                      fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}

            <div 
              style={{
                display: 'flex', alignItems: 'center', background: 'hsla(var(--primary), 0.1)',
                borderRadius: '30px', padding: '1px', border: '1px solid hsla(var(--primary), 0.2)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                gap: isDisplayOpen ? '0.4rem' : '0', overflow: 'hidden'
              }}
            >
              {isDisplayOpen && (
                <div style={{ display: 'flex', gap: '0.2rem', paddingLeft: '0.4rem', animation: 'fadeIn 0.2s' }}>
                  <button 
                    onClick={() => setIsDarkMode(false)} 
                    style={{ 
                      background: !isDarkMode ? 'hsl(var(--bg-card))' : 'transparent', 
                      border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', padding: '5px',
                      boxShadow: !isDarkMode ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.2s'
                    }}
                    title="Modo Claro"
                  >
                    <Sun size={15} color={!isDarkMode ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))'} />
                  </button>
                  <button 
                    onClick={() => setIsDarkMode(true)} 
                    style={{ 
                      background: isDarkMode ? 'hsl(var(--bg-card))' : 'transparent', 
                      border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', padding: '5px',
                      boxShadow: isDarkMode ? 'var(--shadow-sm)' : 'none',
                      transition: 'all 0.2s'
                    }}
                    title="Modo Escuro"
                  >
                    <Moon size={15} color={isDarkMode ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))'} />
                  </button>
                  <div style={{ width: '1px', background: 'hsla(var(--primary), 0.2)', margin: '0 4px' }} />
                  <button 
                    onClick={cycleBrightness}
                    style={{ 
                      background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', 
                      alignItems: 'center', gap: '4px', padding: '2px 6px', fontSize: '0.75rem', fontWeight: 800,
                      color: 'hsl(var(--primary))'
                    }}
                  >
                    {Math.round(brightness * 100)}%
                  </button>
                </div>
              )}
              
              <button 
                onClick={() => setIsDisplayOpen(!isDisplayOpen)}
                style={{ 
                  background: 'hsl(var(--bg-card))', border: 'none', cursor: 'pointer', display: 'flex', 
                  padding: '6px', borderRadius: '50%', boxShadow: 'var(--shadow-md)',
                  transform: isDisplayOpen ? 'rotate(90deg)' : 'none', transition: 'all 0.3s'
                }}
              >
                {isDarkMode ? <Moon size={18} color="hsl(var(--primary))" /> : <Sun size={18} color="hsl(var(--primary))" />}
              </button>
            </div>
            
            <span className="text-muted text-sm" style={{ marginLeft: '0.5rem' }}>v1.1.0</span>
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

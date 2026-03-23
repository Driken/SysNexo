import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, Settings, Activity, Menu, Sun, Moon, Bell, Users, ChevronDown, ChevronRight, FileText, Contact2, Search, Clock } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { BuscaUniversal } from './BuscaUniversal';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { profile, signOut, viewMode, setViewMode } = useAuth();
  const location = useLocation();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string, text: string, time: string, read: boolean }[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);
  const themePanelRef = useRef<HTMLDivElement>(null);
  const notifPanelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const brightnessTextRef = useRef<HTMLSpanElement>(null);
  const [brightness, setBrightness] = useState<number>(() => Number(localStorage.getItem('theme-brightness')) || 100);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themePanelRef.current && !themePanelRef.current.contains(event.target as Node)) {
        setIsThemePanelOpen(false);
      }
      if (notifPanelRef.current && !notifPanelRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

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

  useEffect(() => {
    localStorage.setItem('theme-brightness', brightness.toString());
  }, [brightness]);

  const handleLogout = async () => {
    await signOut();
  };

  // Notificações em tempo real para encaminhamentos
  useEffect(() => {
    if (!profile?.id || (viewMode !== 'psicologo' && viewMode !== 'admin')) return;

    const channel = supabase
      .channel('agendamentos-notif')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agendamentos',
          filter: `psicologo_id=eq.${profile.id}`
        },
        async (payload) => {
          // Só notifica se for um novo registro ou mudança de status para os que interessam
          const isRelevant = payload.eventType === 'INSERT' || 
                           (payload.eventType === 'UPDATE' && payload.new.status !== payload.old.status);

          if (isRelevant) {
            // Buscar nome do paciente
            const { data: pac } = await supabase
              .from('pacientes')
              .select('nome')
              .eq('id', payload.new.paciente_id)
              .single();

            const statusTxt = payload.new.status === 'Em Atendimento' ? 'em atendimento' : 'agendado';
            const msg = `Você tem um novo paciente ${statusTxt}: ${pac?.nome || 'Cadastro novo'}`;
            
            toast.info(msg);
            
            // Adiciona ao histórico do sistema
            setNotifications(prev => [{
              id: payload.new.id + Date.now(),
              text: msg,
              time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              read: false
            }, ...prev].slice(0, 20)); // Limita aos últimos 20
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, viewMode]);

  const navItems = [
    { name: 'Painel Geral', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    ...(viewMode === 'psicologo' || viewMode === 'admin' ? [
      {
        name: 'Sala de Espera',
        path: '/sala-espera',
        icon: <Clock size={20} />
      }
    ] : []),
    ...(viewMode === 'psicologo' || viewMode === 'admin' || viewMode === 'recepcao' ? [
      {
        name: (viewMode === 'recepcao' || viewMode === 'admin') ? 'Pacientes' : 'Meus Pacientes',
        path: '/pacientes',
        icon: <Contact2 size={20} />
      },
      {
        name: (viewMode === 'recepcao' || viewMode === 'admin') ? 'Atendimentos' : 'Prontuários',
        path: (viewMode === 'recepcao' || viewMode === 'admin') ? '/atendimentos' : '/prontuarios',
        icon: <FileText size={20} />
      },
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
                    <Link
                      to="/usuarios"
                      className={`nav-item ${location.pathname === '/usuarios' ? 'active' : ''}`}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', padding: isCollapsed ? '0.8rem 0' : '0.6rem 1rem', width: '100%', flexDirection: 'row' }}
                      title="Equipe e Acessos"
                    >
                      <Users size={18} />
                      {!isCollapsed && <span className="nav-label">Usuários</span>}
                    </Link>

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
        {!isCollapsed && (
          <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid hsla(var(--primary), 0.1)' }}>
            <div
              onClick={() => setIsSearchOpen(true)}
              style={{
                fontSize: '0.7rem', color: 'hsl(var(--text-muted))', display: 'flex',
                alignItems: 'center', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'hsl(var(--primary))'}
              onMouseLeave={e => e.currentTarget.style.color = 'hsl(var(--text-muted))'}
            >
              <Search size={14} />
              <span>Atalho de Busca: <strong>CTRL + K</strong></span>
            </div>
          </div>
        )}
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

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ position: 'relative' }} ref={themePanelRef}>
                <button
                  onClick={() => setIsThemePanelOpen(!isThemePanelOpen)}
                  style={{
                    background: 'hsl(var(--bg-card))', border: 'none', cursor: 'pointer', display: 'flex',
                    padding: '8px', borderRadius: '50%', boxShadow: 'var(--shadow-md)',
                    transition: 'all 0.3s'
                  }}
                  title="Aparência e Brilho"
                >
                  {isDarkMode ? <Moon size={18} color="hsl(var(--primary))" /> : <Sun size={18} color="hsl(var(--primary))" />}
                </button>

                {isThemePanelOpen && (
                  <div style={{
                      position: 'absolute', top: '130%', right: '0',
                      backgroundColor: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-light))',
                      borderRadius: '12px', padding: '0.75rem 1.25rem',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.6)', zIndex: 999999,
                      animation: 'fadeIn 0.2s ease-out',
                      display: 'flex', alignItems: 'center', gap: '1.25rem',
                      whiteSpace: 'nowrap'
                    }}>
                    {/* Botões de Modo */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => setIsDarkMode(false)}
                        style={{
                          padding: '0.4rem 0.75rem', borderRadius: '8px', border: 'none',
                          background: !isDarkMode ? 'hsla(var(--primary), 0.1)' : 'transparent',
                          color: !isDarkMode ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
                          fontWeight: 600, fontSize: '0.8rem'
                        }}
                      >
                        <Sun size={14} /> Claro
                      </button>
                      <button
                        onClick={() => setIsDarkMode(true)}
                        style={{
                          padding: '0.4rem 0.75rem', borderRadius: '8px', border: 'none',
                          background: isDarkMode ? 'hsla(var(--primary), 0.1)' : 'transparent',
                          color: isDarkMode ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
                          fontWeight: 600, fontSize: '0.8rem'
                        }}
                      >
                        <Moon size={14} /> Escuro
                      </button>
                    </div>

                    <div style={{ width: '1px', height: '24px', background: 'hsl(var(--border-light))', opacity: 0.5 }} />

                    {/* Controle de Brilho */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-main))' }}>Brilho: <span ref={brightnessTextRef} style={{ color: 'hsl(var(--primary))' }}>{brightness}%</span></span>
                      <input 
                        type="range" min="30" max="100" defaultValue={brightness} 
                        onInput={(e) => {
                          const val = (e.target as HTMLInputElement).value;
                          if (overlayRef.current) overlayRef.current.style.backgroundColor = `rgba(0, 0, 0, ${1 - Number(val) / 100})`;
                          if (brightnessTextRef.current) brightnessTextRef.current.innerText = `${val}%`;
                        }}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        style={{ width: '100px', accentColor: 'hsl(var(--primary))', cursor: 'pointer', margin: 0 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ position: 'relative' }} ref={notifPanelRef}>
                  <button
                    onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                    style={{
                      background: 'hsl(var(--bg-card))', border: 'none', cursor: 'pointer', display: 'flex',
                      padding: '8px', borderRadius: '50%', boxShadow: 'var(--shadow-md)',
                      position: 'relative'
                    }}
                    title="Ver Notificações"
                  >
                    <Bell size={18} color="hsl(var(--primary))" />
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span style={{
                        position: 'absolute', top: -1, right: -1,
                        width: '10px', height: '10px', background: 'hsl(var(--primary))',
                        borderRadius: '50%', border: '2px solid hsl(var(--card))'
                      }} />
                    )}
                  </button>

                  {isNotificationsOpen && (
                    <div style={{
                      position: 'absolute', top: '130%', right: '-10px', width: '320px',
                      backgroundColor: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border-light))',
                      borderRadius: '12px', padding: '1rem',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.6)', zIndex: 999999,
                      animation: 'fadeIn 0.2s ease-out',
                      display: 'flex', flexDirection: 'column', gap: '1rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'hsl(var(--text-main))' }}>Notificações</span>
                        {notifications.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                               onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                               style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: 'hsl(var(--primary))', fontWeight: 600, padding: 0 }}
                               title="Marcar todas como lidas"
                            >
                               Lidas
                            </button>
                            <button
                               onClick={() => setNotifications([])}
                               style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 600, padding: 0 }}
                               title="Apagar todas as notificações"
                            >
                               Apagar
                            </button>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {notifications.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '1rem', color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>
                            Nenhuma notificação por enquanto.
                          </div>
                        ) : (
                          notifications.slice(0, 3).map(notif => (
                            <div key={notif.id} style={{
                              padding: '0.75rem', background: notif.read ? 'transparent' : 'hsla(var(--primary), 0.05)',
                              borderRadius: '8px', border: '1px solid hsl(var(--border-light))',
                              position: 'relative'
                            }}>
                              <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', lineHeight: '1.4', color: 'hsl(var(--text-main))', whiteSpace: 'normal', wordBreak: 'break-word' }}>{notif.text}</p>
                              <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>{notif.time}</span>
                              {!notif.read && (
                                <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', width: '6px', height: '6px', background: 'hsl(var(--primary))', borderRadius: '50%' }} />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginLeft: 'auto' }}>
              <div
                onClick={() => setIsSearchOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.75rem',
                  background: 'hsla(var(--primary), 0.1)', borderRadius: '8px', fontSize: '0.7rem', color: 'hsl(var(--primary))',
                  fontWeight: 800, border: '1px solid hsla(var(--primary), 0.2)', cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Search size={14} /> BUSCA <span style={{ opacity: 0.6, fontSize: '0.6rem', marginLeft: '0.2rem' }}>CTRL + K</span>
              </div>
              <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.8 }}>v1.2.0</span>
            </div>
          </div>
        </header>

        {/* Injeção das Páginas */}
        <div className="layout-body">
          {children}
        </div>
      </main>

      {/* Busca Universal Global (Atalho Ctrl+K) */}
      {isSearchOpen && createPortal(
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            zIndex: 99999, display: 'flex', justifyContent: 'center', padding: '10vh 1rem 0 1rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSearchOpen(false);
          }}
        >
          <div style={{ width: '100%', maxWidth: '750px', animation: 'fadeInScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <style>{`
               @keyframes fadeInScale {
                 from { opacity: 0; transform: scale(0.95); }
                 to { opacity: 1; transform: scale(1); }
               }
             `}</style>
            <div style={{ position: 'relative' }}>
              <BuscaUniversal isGlobal onClose={() => setIsSearchOpen(false)} />
            </div>
            <div style={{
              marginTop: '1.5rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem'
            }}>
              <span><kbd style={{ background: 'rgba(255,255,255,0.2)', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>ESC</kbd> para fechar</span>
              <span style={{ opacity: 0.5 }}>|</span>
              <span>Atalho Global: <kbd style={{ background: 'rgba(255,255,255,0.2)', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>CTRL + K</kbd></span>
            </div>
          </div>
        </div>,
        document.body
      )}


      {/* Camada de controle de Brilho Global */}
      {createPortal(
        <div 
          ref={overlayRef}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: `rgba(0, 0, 0, ${1 - brightness / 100})`,
            pointerEvents: 'none',
            zIndex: 9999999
          }}
        />,
        document.body
      )}
    </div>
  );
};

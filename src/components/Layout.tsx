import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Activity, Menu, Sun, Moon, Bell, Users, ChevronDown, ChevronRight, Settings, Search, LayoutDashboard, Clock, Contact2, FileText, DollarSign, Plus, PieChart, Truck, Building2, Trash2 } from 'lucide-react';
import { TransactionModal } from './TransactionModal';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BuscaUniversal } from './BuscaUniversal';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { ChatWidget } from './Chat/ChatWidget';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { profile, signOut, viewMode, setViewMode } = useAuth();
  const location = useLocation();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string, text: string, time: string, read: boolean, title: string, tipo: string, link?: string }[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showAdminResetModal, setShowAdminResetModal] = useState(false);
  const [resetData, setResetData] = useState({ email: '', password: 'Abc12345', userId: '' });
  const [isResetting, setIsResetting] = useState(false);
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);
  const themePanelRef = useRef<HTMLDivElement>(null);
  const notifPanelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const brightnessTextRef = useRef<HTMLSpanElement>(null);
  const [brightness, setBrightness] = useState<number>(() => Number(localStorage.getItem('theme-brightness')) || 100);
  const [isFinanceOpen, setIsFinanceOpen] = useState(false);
  const [isNewTransactionModalOpen, setIsNewTransactionModalOpen] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const getSeenCount = () => {
    const val = localStorage.getItem('ctrlK_tutorial_seen');
    if (val === 'true') return 1;
    const count = parseInt(val || '0', 10);
    return isNaN(count) ? 2 : count;
  };

  useEffect(() => {
    if (getSeenCount() < 2) {
      const timer = setTimeout(() => setShowTutorial(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (isSearchOpen) {
      const current = getSeenCount();
      if (current < 2) {
        localStorage.setItem('ctrlK_tutorial_seen', (current + 1).toString());
        setShowTutorial(false);
      }
    }
  }, [isSearchOpen]);

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
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
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

  useEffect(() => {
    if (!profile?.id) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('perfil_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(data.map(n => ({
          id: n.id,
          text: n.mensagem,
          time: new Date(n.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/,?\s+/, ', '),
          read: n.lido,
          title: n.titulo,
          tipo: n.tipo,
          link: n.link
        })));
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel('notificacoes-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `perfil_id=eq.${profile.id}`
        },
        (payload) => {
          const newNotif = {
            id: payload.new.id,
            text: payload.new.mensagem,
            time: new Date(payload.new.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(/,?\s+/, ', '),
            read: payload.new.lido,
            title: payload.new.titulo,
            tipo: payload.new.tipo,
            link: payload.new.link
          };

          toast(newNotif.text, {
            description: newNotif.time,
            action: (newNotif.link && viewMode === 'psicologo') ? {
              label: newNotif.link === '/sala-espera' ? 'Ir para Sala de Espera' : 'Acessar Agora',
              onClick: () => {
                navigate(newNotif.link!);
                supabase.from('notificacoes').update({ lido: true }).eq('id', newNotif.id);
                setNotifications(prev => prev.map(n => n.id === newNotif.id ? { ...n, read: true } : n));
              }
            } : undefined
          });

          setNotifications(prev => [newNotif, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, viewMode]);

  const markAllAsRead = async () => {
    if (!profile?.id) return;
    const { error } = await supabase
      .from('notificacoes')
      .update({ lido: true })
      .eq('perfil_id', profile.id)
      .eq('lido', false);

    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const clearNotifications = async () => {
    if (!profile?.id) return;
    const { error } = await supabase
      .from('notificacoes')
      .delete()
      .eq('perfil_id', profile.id);

    if (!error) {
      setNotifications([]);
    }
  };

  const deleteSelectedNotifications = async () => {
    if (selectedNotifications.length === 0) return;
    const { error } = await supabase
      .from('notificacoes')
      .delete()
      .in('id', selectedNotifications);

    if (!error) {
      setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)));
      setSelectedNotifications([]);
      setIsSelectionMode(false);
    }
  };

  const toggleSelectNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNotifications(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleNotificationClick = async (notif: any) => {
    if (notif.tipo === 'suporte') {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      const foundEmail = notif.text.match(emailRegex);

      if (foundEmail) {
        const email = foundEmail[0];
        setResetData({ email, password: 'Abc12345', userId: '' });
        setShowAdminResetModal(true);
        setIsNotificationsOpen(false);

        await supabase.from('notificacoes').update({ lido: true }).eq('id', notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
        return;
      }
    }

    if (notif.tipo === 'chat' || (notif.link && notif.link.startsWith('chat:'))) {
      const targetId = notif.link?.split(':')[1];
      window.dispatchEvent(new CustomEvent('open-chat', { detail: { userId: targetId } }));
      setIsNotificationsOpen(false);
    }

    if (notif.link) {
      navigate(notif.link);
      setIsNotificationsOpen(false);
    }

    if (!notif.read) {
      await supabase.from('notificacoes').update({ lido: true }).eq('id', notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    }
  };

  const performAdminReset = async () => {
    if (!resetData.email) return;
    setIsResetting(true);

    try {
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', resetData.email)
        .single();

      if (userError || !userData) {
        throw new Error('Usuário não encontrado no sistema.');
      }

      const { error: resetError } = await supabase.rpc('admin_reset_password', {
        target_user_id: userData.id,
        new_password: resetData.password
      });

      if (resetError) throw resetError;

      toast.success('Senha redefinida com sucesso!', {
        description: `O e-mail de acesso é ${resetData.email}`
      });
      setShowAdminResetModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao redefinir senha.');
    } finally {
      setIsResetting(false);
    }
  };

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
    ...(profile?.role === 'admin' ? [
      { name: 'Financeiro', path: '#', icon: <DollarSign size={20} />, action: 'openFinance' }
    ] : []),
    { name: 'Configurações', path: '#', icon: <Settings size={20} />, action: 'openSettings' },
  ];

  return (
    <div className="layout-container">
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
            margin: isCollapsed ? '0 0 1.5rem 0' : '0 -0.5rem 1.5rem -0.5rem'
          }}
        >
          <div translate="no" className="avatar-sm notranslate">
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
            const hasSubmenu = item.action === 'openSettings' || item.action === 'openFinance';
            const isSubmenuOpen = item.action === 'openSettings' ? isSettingsOpen : (item.action === 'openFinance' ? isFinanceOpen : false);

            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
                <Link
                  to={item.path}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={(e) => {
                    if (item.path === '#') e.preventDefault();
                    if (item.action === 'openSettings') setIsSettingsOpen(!isSettingsOpen);
                    if (item.action === 'openFinance') setIsFinanceOpen(!isFinanceOpen);
                  }}
                  title={isCollapsed ? item.name : undefined}
                  style={{
                    justifyContent: isCollapsed ? 'center' : (hasSubmenu ? 'space-between' : 'flex-start'),
                    paddingRight: (hasSubmenu && !isCollapsed) ? '0.5rem' : undefined
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: isCollapsed ? '0' : '1rem' }}>
                    {item.icon}
                    {!isCollapsed && <span className="nav-label">{item.name}</span>}
                  </div>
                  {hasSubmenu && !isCollapsed && (
                    isSubmenuOpen ? <ChevronDown size={18} color="hsl(var(--text-muted))" /> : <ChevronRight size={18} color="hsl(var(--text-muted))" />
                  )}
                </Link>

                {item.action === 'openFinance' && isFinanceOpen && (
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: '0.25rem',
                    marginTop: '0.25rem', paddingLeft: isCollapsed ? '0' : '1.5rem',
                    animation: 'fadeIn 0.2s ease-out'
                  }}>
                    <Link
                      to="/financeiro"
                      className={`nav-item ${location.pathname === '/financeiro' ? 'active' : ''}`}
                      style={{
                        background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem',
                        padding: isCollapsed ? '0.8rem 0' : '0.6rem 1rem', width: '100%', flexDirection: 'row',
                        justifyContent: isCollapsed ? 'center' : 'flex-start', gap: isCollapsed ? '0' : '1rem'
                      }}
                    >
                      <PieChart size={18} />
                      {!isCollapsed && <span className="nav-label">Gestão / Fluxo</span>}
                    </Link>
                    <button
                      onClick={() => setIsNewTransactionModalOpen(true)}
                      className="nav-item"
                      style={{
                        background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem',
                        padding: isCollapsed ? '0.8rem 0' : '0.6rem 1rem', width: '100%', flexDirection: 'row',
                        justifyContent: isCollapsed ? 'center' : 'flex-start', gap: isCollapsed ? '0' : '1rem'
                      }}
                    >
                      <Plus size={18} color="hsl(var(--primary))" />
                      {!isCollapsed && <span className="nav-label" style={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>Nova Transação</span>}
                    </button>
                  </div>
                )}

                {item.action === 'openSettings' && isSettingsOpen && (
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: '0.25rem',
                    marginTop: '0.25rem', paddingLeft: isCollapsed ? '0' : '1.5rem',
                    animation: 'fadeIn 0.2s ease-out'
                  }}>
                    <Link
                      to="/usuarios"
                      className={`nav-item ${location.pathname === '/usuarios' ? 'active' : ''}`}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        padding: isCollapsed ? '0.8rem 0' : '0.6rem 1rem',
                        width: '100%',
                        flexDirection: 'row',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        gap: isCollapsed ? '0' : '1rem'
                      }}
                      title="Equipe e Acessos"
                    >
                      <Users size={18} />
                      {!isCollapsed && <span className="nav-label">Usuários / Equipe</span>}
                    </Link>

                    <Link
                      to="/fornecedores"
                      className={`nav-item ${location.pathname === '/fornecedores' ? 'active' : ''}`}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        padding: isCollapsed ? '0.8rem 0' : '0.6rem 1rem',
                        width: '100%',
                        flexDirection: 'row',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        gap: isCollapsed ? '0' : '1rem'
                      }}
                      title="Gestão de Fornecedores"
                    >
                      <Truck size={18} />
                      {!isCollapsed && <span className="nav-label">Fornecedores</span>}
                    </Link>

                    <Link
                      to="/filiais"
                      className={`nav-item ${location.pathname === '/filiais' ? 'active' : ''}`}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        padding: isCollapsed ? '0.8rem 0' : '0.6rem 1rem',
                        width: '100%',
                        flexDirection: 'row',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        gap: isCollapsed ? '0' : '1rem'
                      }}
                      title="Gestão de Unidades / Filiais"
                    >
                      <Building2 size={18} />
                      {!isCollapsed && <span className="nav-label">Unidades / Filiais</span>}
                    </Link>

                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer" style={{ padding: isCollapsed ? '1.5rem 0 0 0' : '1.5rem 0 0 0', alignItems: isCollapsed ? 'center' : 'stretch' }}>
          <button className="btn-logout" onClick={handleLogout} title="Sair do sistema" style={{ gap: isCollapsed ? '0' : '0.5rem' }}>
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

      <main className="layout-main">
        <header className="topbar-modern">
          <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'hsl(var(--text-main))' }}>
            {location.pathname === '/dashboard' ? 'Resumo de Atividades' : location.pathname.includes('/paciente/') ? 'Ficha de Paciente' : 'Sistema de Gestão'}
          </div>
          <div className="flex-row" style={{ gap: '0.75rem' }}>
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
                  className={`water-drop-hover ${notifications.filter(n => !n.read).length > 0 ? 'notif-arrival-pulse' : ''}`}
                  style={{
                    background: 'hsl(var(--bg-card))', border: 'none', cursor: 'pointer', display: 'flex',
                    padding: '8px', borderRadius: '50%', boxShadow: 'hsla(var(--primary), 0.2) 0 4px 15px',
                    position: 'relative',
                    transition: 'all 0.3s'
                  }}
                  title="Ver Notificações"
                >
                  <Bell size={18} color="hsl(var(--primary))" />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span style={{
                      position: 'absolute', top: '-4px', right: '-4px',
                      minWidth: '18px', height: '18px', background: '#ef4444',
                      borderRadius: '10px', border: '2px solid hsl(var(--bg-card))',
                      color: 'white', fontSize: '0.65rem', fontWeight: 900,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 4px',
                      boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)'
                    }}>
                      {notifications.filter(n => !n.read).length > 99 ? '99+' : notifications.filter(n => !n.read).length}
                    </span>
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
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'hsl(var(--text-main))' }}>Notificações ({notifications.length})</span>
                      {notifications.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                          {!isSelectionMode ? (
                            <>
                              <button
                                onClick={markAllAsRead}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: 'hsl(var(--primary))', fontWeight: 600, padding: 0 }}
                                title="Marcar todas como lidas"
                              >
                                Lidas
                              </button>
                              <button
                                onClick={clearNotifications}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 600, padding: 0 }}
                                title="Apagar todas as notificações"
                              >
                                Apagar
                              </button>
                              <button
                                onClick={() => setIsSelectionMode(true)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 600, padding: 0 }}
                                title="Selecionar notificações para excluir"
                              >
                                Selecionar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={deleteSelectedNotifications}
                                disabled={selectedNotifications.length === 0}
                                style={{ 
                                  background: 'transparent', border: 'none', cursor: selectedNotifications.length > 0 ? 'pointer' : 'default', 
                                  fontSize: '0.7rem', color: selectedNotifications.length > 0 ? 'hsl(var(--destructive))' : 'hsl(var(--text-muted))', 
                                  fontWeight: 600, padding: 0, opacity: selectedNotifications.length > 0 ? 1 : 0.5 
                                }}
                              >
                                Excluir ({selectedNotifications.length})
                              </button>
                              <button
                                onClick={() => {
                                  setIsSelectionMode(false);
                                  setSelectedNotifications([]);
                                }}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 600, padding: 0 }}
                              >
                                Cancelar
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }} className="custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '1rem', color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>
                          Nenhuma notificação por enquanto.
                        </div>
                      ) : (
                        notifications.slice(0, 20).map(notif => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            style={{
                              padding: '0.75rem',
                              background: notif.read ? 'transparent' : 'hsla(var(--primary), 0.05)',
                              borderRadius: '8px',
                              border: notif.read ? '1px solid hsl(var(--border-light))' : '1px solid hsla(var(--primary), 0.2)',
                              position: 'relative',
                              cursor: (notif.tipo === 'suporte' || notif.link) ? 'pointer' : 'default',
                              transition: 'all 0.2s',
                              borderLeft: '3px solid hsl(var(--primary))'
                            }}
                            onMouseEnter={(e) => {
                              if (notif.link || notif.tipo === 'suporte') {
                                e.currentTarget.style.backgroundColor = 'hsla(var(--primary), 0.08)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (notif.link || notif.tipo === 'suporte') {
                                e.currentTarget.style.backgroundColor = notif.read ? 'transparent' : 'hsla(var(--primary), 0.05)';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }
                            }}
                          >
                            <div style={{ display: 'flex', gap: isSelectionMode ? '0.75rem' : '0', alignItems: 'flex-start' }}>
                              {isSelectionMode && (
                                <div 
                                  onClick={(e) => toggleSelectNotification(notif.id, e)}
                                  style={{ 
                                    marginTop: '0.2rem',
                                    width: '16px', height: '16px', 
                                    borderRadius: '4px', border: `1px solid ${selectedNotifications.includes(notif.id) ? 'hsl(var(--primary))' : 'hsl(var(--border-light))'}`,
                                    background: selectedNotifications.includes(notif.id) ? 'hsl(var(--primary))' : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', transition: 'all 0.2s'
                                  }}
                                >
                                  {selectedNotifications.includes(notif.id) && <div style={{ width: '8px', height: '8px', borderRadius: '1px', background: 'white' }} />}
                                </div>
                              )}
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', color: 'hsl(var(--primary))', marginBottom: '0.15rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  {notif.title}
                                  {notif.tipo === 'suporte' && <Settings size={12} />}
                                </div>
                                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', lineHeight: '1.4', color: 'hsl(var(--text-main))', whiteSpace: 'normal', wordBreak: 'break-word' }}>{notif.text}</p>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                                  <span style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))' }}>{notif.time}</span>
                                </div>
                              </div>
                            </div>

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
                  transition: 'all 0.2s', position: 'relative'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Search size={14} /> BUSCA <span style={{ opacity: 0.6, fontSize: '0.6rem', marginLeft: '0.2rem' }}>CTRL + K</span>

                {/* Tutorial Interativo do Ctrl+K posicionado saindo do botão */}
                {showTutorial && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 15px)', right: '0',
                    backgroundColor: 'hsl(var(--primary))', color: 'white',
                    padding: '1rem', borderRadius: '12px',
                    boxShadow: '0 10px 35px rgba(0,0,0,0.3)', zIndex: 999999,
                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                    animation: 'slideDownFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    width: '300px', cursor: 'default'
                  }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <style>{`
                      @keyframes slideDownFadeIn {
                        0% { opacity: 0; transform: translateY(-10px); }
                        100% { opacity: 1; transform: translateY(0); }
                      }
                    `}</style>
                    {/* Triângulo do tooltip apontando pro botão */}
                    <div style={{
                      position: 'absolute', top: '-8px', right: '40px',
                      width: '0', height: '0',
                      borderLeft: '8px solid transparent',
                      borderRight: '8px solid transparent',
                      borderBottom: '8px solid hsl(var(--primary))'
                    }}></div>

                    <div style={{ color: 'white', marginTop: '2px' }}>
                      <Search size={22} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px', textTransform: 'none', lineHeight: 1.2 }}>Dica rápida!</div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.9, lineHeight: 1.4, fontWeight: 500, textTransform: 'none' }}>
                        Pressione <kbd style={{ background: 'rgba(0,0,0,0.3)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)' }}>CTRL + K</kbd> para buscar pacientes rapidamente.
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTutorial(false);
                        const current = getSeenCount();
                        localStorage.setItem('ctrlK_tutorial_seen', (current + 1).toString());
                      }}
                      style={{
                        background: 'transparent', border: 'none', color: 'white',
                        cursor: 'pointer', padding: '0.2rem',
                        opacity: 0.7, fontWeight: 800, fontSize: '1rem',
                        marginTop: '-4px', marginRight: '-4px'
                      }}
                      title="Fechar dica"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <span className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.8 }}>v1.2.0</span>
            </div>
          </div>
        </header>

        {/* Injeção das Páginas */}
        <div className="layout-body">
          {children}
        </div>

        {/* Modal Financeiro Global (Acessível via Sidebar) */}
        <TransactionModal
          isOpen={isNewTransactionModalOpen}
          onClose={() => setIsNewTransactionModalOpen(false)}
          onSave={() => {
            setIsNewTransactionModalOpen(false);
            // Como as páginas usam Realtime, elas devem se atualizar sozinhas, 
            // ou podemos disparar um evento global se necessário.
            window.dispatchEvent(new CustomEvent('finance_updated'));
          }}
        />
      </main>

      {/* Busca Universal Global (Atalho Ctrl+K) */}
      {isSearchOpen && createPortal(
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            zIndex: 99999, display: 'flex', justifyContent: 'center', padding: '10vh 1rem 10vh 1rem',
            cursor: 'pointer', overflowY: 'auto'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSearchOpen(false);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()} // Garante que o clique interno não feche a modal
            style={{
              width: '100%', maxWidth: '750px',
              height: 'fit-content', // Garante que a caixa não se expanda no eixo Y e bloqueie o clique fora
              cursor: 'default',
              animation: 'fadeInScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
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
              <span>Clique fora ou <kbd style={{ background: 'rgba(255,255,255,0.2)', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>ESC</kbd> para fechar</span>
              <span style={{ opacity: 0.5 }}>|</span>
              <span>Atalho Global: <kbd style={{ background: 'rgba(255,255,255,0.2)', padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>CTRL + K</kbd></span>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Admin: Reset de Senha via Suporte */}
      {showAdminResetModal && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999999, padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '2rem', animation: 'modalEntry 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <h2 style={{ color: 'hsl(var(--text-main))', marginBottom: '0.5rem', fontSize: '1.25rem' }}>Atender Solicitação</h2>
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Redefina a senha do usuário que solicitou ajuda.
            </p>

            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label className="input-label">E-mail do Usuário</label>
              <input
                className="form-input"
                readOnly
                value={resetData.email}
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>

            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label className="input-label">Nova Senha Provisória</label>
              <input
                className="form-input"
                type="text"
                value={resetData.password}
                onChange={(e) => setResetData({ ...resetData, password: e.target.value })}
                placeholder="Defina a nova senha"
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowAdminResetModal(false)}
                className="btn"
                style={{ flex: 1, background: 'transparent', border: '1px solid hsl(var(--border-light))', color: 'hsl(var(--text-muted))' }}
              >
                Cancelar
              </button>
              <button
                onClick={performAdminReset}
                disabled={isResetting}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {isResetting ? 'Processando...' : 'Resetar Senha'}
              </button>
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
            zIndex: 99999999
          }}
        />,
        document.body
      )}
      <ChatWidget />
    </div>
  );
};

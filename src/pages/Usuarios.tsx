import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, Users, Shield, CheckCircle, Info, Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UsuariosModal } from '../components/UsuariosModal';

export const Usuarios: React.FC = () => {
  const { profile } = useAuth();
  const [equipe, setEquipe] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: 'name' | 'email' | 'role') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  useEffect(() => {
    carregarEquipe();
    carregarPacientes();
  }, []);

  const carregarPacientes = async () => {
    const { data } = await supabase
      .from('pacientes')
      .select('*')
      .order('nome', { ascending: true });
    if (data) setPacientes(data.map(p => ({ ...p, full_name: p.nome, role: 'paciente', is_active: true })));
  };

  const carregarEquipe = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('is_active', { ascending: false })
      .order('created_at', { ascending: false });
    if (data) setEquipe(data);
  };

  const handleEdit = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleInativar = async (user: any) => {
    const novoStatus = !user.is_active;
    const confirmMsg = novoStatus ? `Deseja reativar o usuário ${user.full_name}?` : `Deseja inativar o usuário ${user.full_name}?`;

    if (window.confirm(confirmMsg)) {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: novoStatus })
        .eq('id', user.id);

      if (error) {
        alert('Erro ao atualizar status: ' + error.message);
      } else {
        carregarEquipe();
      }
    }
  };

  const handleExcluir = async (user: any) => {
    if (window.confirm(`ATENÇÃO: Deseja REALMENTE excluir o perfil de ${user.full_name}? Esta ação não pode ser desfeita.`)) {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      if (error) {
        alert('Erro ao excluir: ' + error.message);
      } else {
        alert('Perfil excluído com sucesso!');
        carregarEquipe();
      }
    }
  };


  const rolesInfo = [
    {
      id: 'admin',
      label: 'Administrador Geral',
      desc: 'Acesso total ao sistema, gestão de faturamento e usuários.',
      color: '#fee2e2',
      textColor: '#b91c1c'
    },
    {
      id: 'psicologo',
      label: 'Psicólogo Clínico',
      desc: 'Acesso aos prontuários, lista de espera e agenda própria.',
      color: '#e0e7ff',
      textColor: '#4338ca'
    },
    {
      id: 'recepcao',
      label: 'Recepção / Atendimento',
      desc: 'Agendamentos, cadastro de pacientes e triagem inicial.',
      color: '#dcfce7',
      textColor: '#15803d'
    },
  ];

  return (
    <div className="layout-body" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className="dashboard-header border-bottom" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="dashboard-title flex-row">
            <Users size={28} /> Gestão de Equipe
          </h1>
          <p className="text-muted">Visualize e gerencie todos os acessos do sistema.</p>
        </div>

        <button className="btn btn-primary" onClick={handleCreate} style={{ width: 'auto' }}>
          <UserPlus size={18} /> Adicionar Membro
        </button>
      </div>

      <div className="flex-row" style={{ alignItems: 'stretch', gap: '2rem', flexWrap: 'wrap' }}>

        {/* Lado Esquerdo: Lista */}
        <div style={{ flex: '1 1 600px' }}>
          <div className="glass-card" style={{ 
            padding: '0.5rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', 
            flexWrap: 'wrap', alignItems: 'center', background: 'hsla(var(--bg-main), 0.6)',
            borderColor: 'hsl(var(--border-light))', borderStyle: 'solid', borderWidth: '1px'
          }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--primary))', opacity: 0.6 }} />
              <input
                type="text"
                placeholder="Pesquisar por nome, e-mail ou CPF..."
                className="form-input"
                style={{ 
                  paddingLeft: '2.75rem', height: '40px', border: 'none', 
                  background: 'transparent', width: '100%', fontSize: '0.9rem'
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.25rem', padding: '0.25rem', background: 'hsla(var(--primary), 0.05)', borderRadius: 'var(--radius-md)' }}>
              {[
                { id: 'all', label: 'Todos' },
                { id: 'admin', label: 'Admins' },
                { id: 'psicologo', label: 'Psicólogos' },
                { id: 'recepcao', label: 'Recepção' },
                { id: 'paciente', label: 'Pacientes' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setRoleFilter(cat.id)}
                  style={{
                    padding: '0.4rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: roleFilter === cat.id ? 'white' : 'transparent',
                    color: roleFilter === cat.id ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                    boxShadow: roleFilter === cat.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
            {/* Cabeçalho da Tabela */}
            <div style={{ 
              display: 'flex', alignItems: 'center', padding: '1rem 1.5rem', 
              background: 'hsla(var(--primary), 0.05)', borderBottom: '1px solid hsl(var(--border-light))',
              gap: '1rem', fontWeight: 700, fontSize: '0.85rem', color: 'hsl(var(--text-muted))',
              textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              <div 
                onClick={() => handleSort('name')} 
                style={{ flex: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: sortBy === 'name' ? 'hsl(var(--primary))' : 'inherit' }}
              >
                Colaborador {sortBy === 'name' ? (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} opacity={0.3} />}
              </div>
              <div 
                onClick={() => handleSort('email')} 
                style={{ flex: 1.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: sortBy === 'email' ? 'hsl(var(--primary))' : 'inherit' }}
              >
                E-mail {sortBy === 'email' ? (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} opacity={0.3} />}
              </div>
              <div 
                onClick={() => handleSort('role')} 
                style={{ width: '120px', textAlign: 'center', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: sortBy === 'role' ? 'hsl(var(--primary))' : 'inherit' }}
              >
                Função {sortBy === 'role' ? (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} opacity={0.3} />}
              </div>
              <div style={{ width: '40px' }}></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[...equipe, ...pacientes]
                .filter(u => {
                  // Primeiro: Filtro de Hierarquia (Admin vê tudo, outros veem par)
                  let accessMatch = false;
                  if (profile?.role === 'admin') accessMatch = true;
                  else if (u.role === 'admin') accessMatch = false;
                  else accessMatch = (u.role === profile?.role);

                  if (!accessMatch) return false;

                  // Segundo: Filtro de Pesquisa (Nome, Email, CPF)
                  const search = searchTerm.toLowerCase();
                  const searchMatch = !searchTerm ||
                    (u.full_name?.toLowerCase().includes(search)) ||
                    (u.email?.toLowerCase().includes(search)) ||
                    (u.cpf?.replace(/\D/g, '').includes(search.replace(/\D/g, '')));

                  if (!searchMatch) return false;

                  const roleMatch = roleFilter === 'all' || u.role === roleFilter;

                  return roleMatch;
                })
                .sort((a, b) => {
                  let comparison = 0;
                  if (sortBy === 'name') {
                    comparison = (a.full_name || '').localeCompare(b.full_name || '');
                  } else if (sortBy === 'email') {
                    comparison = (a.email || '').localeCompare(b.email || '');
                  } else if (sortBy === 'role') {
                    comparison = (a.role || '').localeCompare(b.role || '');
                  }
                  return sortOrder === 'asc' ? comparison : -comparison;
                })
                .map(u => (
                  <div key={u.id} style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1rem 1.5rem', background: u.is_active === false ? 'hsla(0, 0%, 50%, 0.05)' : 'transparent',
                    borderBottom: '1px solid hsl(var(--border-light))',
                    transition: 'all 0.2s', opacity: u.is_active === false ? 0.7 : 1,
                    cursor: u.role === 'paciente' ? 'default' : 'pointer'
                  }} onClick={() => u.role !== 'paciente' && handleEdit(u)}>
                    
                    {/* Coluna 1: Nome */}
                    <div style={{ flex: 2, display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div className="avatar-sm" style={{
                        width: '36px', height: '36px', fontSize: '0.9rem',
                        filter: u.is_active === false ? 'grayscale(1)' : 'none',
                        flexShrink: 0
                      }}>
                        {u.role === 'paciente' ? 'P' : (u.full_name || 'U')[0].toUpperCase()}
                      </div>
                      <div style={{
                        fontWeight: 600, color: 'hsl(var(--text-main))', fontSize: '0.95rem',
                        textDecoration: u.is_active === false ? 'line-through' : 'none',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {u.full_name || 'Usuário'}
                      </div>
                    </div>

                    {/* Coluna 2: Email */}
                    <div style={{ flex: 1.5, fontSize: '0.85rem', color: 'hsl(var(--text-muted))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.role === 'paciente' ? `CPF: ${u.cpf || 'N/I'}` : (u.email || 'Sem Email')}
                    </div>

                    {/* Coluna 3: Função */}
                    <div style={{ width: '120px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: '0.7rem', fontWeight: 700, padding: '0.3rem 0.6rem', borderRadius: '12px',
                        background: u.role === 'admin' ? '#fee2e2' : u.role === 'psicologo' ? '#e0e7ff' : u.role === 'recepcao' ? '#dcfce7' : 'hsla(var(--primary), 0.1)',
                        color: u.role === 'admin' ? '#b91c1c' : u.role === 'psicologo' ? '#4338ca' : u.role === 'recepcao' ? '#15803d' : 'hsl(var(--primary))',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                        display: 'inline-block', width: '90px'
                      }}>
                        {u.role === 'paciente' ? 'Paciente' : (u.role || 'user').substring(0, 10)}
                      </span>
                    </div>

                    <div style={{ width: '40px' }}></div>
                  </div>
                ))}
              {equipe.length === 0 && (
                <div className="text-center" style={{ padding: '4rem 1rem' }}>
                  <Users size={48} color="hsl(var(--border-light))" style={{ marginBottom: '1rem' }} />
                  <p className="text-muted">Carregando lista de colaboradores...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lado Direito: Info de Níveis */}
        <div style={{ flex: '1 1 350px' }}>
          <div className="glass-card" style={{ padding: '1.5rem', background: 'hsla(var(--primary), 0.02)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={20} color="hsl(var(--primary))" /> Níveis de Acesso
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {rolesInfo.map(r => (
                <div key={r.id} style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ marginTop: '0.2rem' }}>
                    <CheckCircle size={18} color={r.textColor} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: r.textColor, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{r.label}</div>
                    <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', lineHeight: 1.4 }}>{r.desc}</p>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ marginTop: '0.2rem' }}>
                    <CheckCircle size={18} color="hsl(var(--primary))" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'hsl(var(--primary))', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Paciente Externo</div>
                    <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', lineHeight: 1.4 }}>Pessoas cadastradas para atendimento. Não possuem acesso ao sistema.</p>
                  </div>
                </div>
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', borderRadius: 'var(--radius-sm)', background: 'white', border: '1px dashed hsl(var(--border-light))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'hsl(var(--text-main))', fontWeight: 600, fontSize: '0.85rem' }}>
                <Info size={16} /> Dica de Segurança
              </div>
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                Recomendamos que cada profissional tenha seu próprio acesso. Nunca compartilhe a senha de Administrador.
              </p>
            </div>
          </div>
        </div>

      </div>

      <UsuariosModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          carregarEquipe();
        }}
        userToEdit={selectedUser}
        onDelete={handleExcluir}
        onInactivate={handleInativar}
      />
    </div>
  );
};

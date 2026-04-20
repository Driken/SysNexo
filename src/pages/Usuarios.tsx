import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, Users, Search, ArrowUp, ArrowDown, ArrowUpDown, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UsuariosModal } from '../components/UsuariosModal';
import { toast } from 'sonner';

export const Usuarios: React.FC = () => {
  const { profile } = useAuth();
  const [equipe, setEquipe] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Estado para Modal de Confirmação de Exclusão Customizado
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
  }, []);

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
        toast.error('Erro ao atualizar status: ' + error.message);
      } else {
        toast.success(novoStatus ? 'Membro reativado!' : 'Membro inativado com sucesso.');
        carregarEquipe();
      }
    }
  };

  // Abre o modal customizado em vez do confirm do navegador
  const promptExcluir = (user: any) => {
    setUserToDelete(user);
  };

  // Executa a exclusão de fato
  const confirmExcluir = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);

    const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userToDelete.id });

    if (error) {
      if (error.code === '23503') {
        toast.error('Não é possível excluir pois existem registros vinculados a este perfil.');
      } else {
        toast.error('Erro ao excluir: ' + error.message);
      }
    } else {
      toast.success(`Perfil excluído com sucesso!`);
      setEquipe(prev => prev.filter(m => m.id !== userToDelete.id));
      carregarEquipe();
      setSelectedUser(null);
      setIsModalOpen(false);
    }
    
    setIsDeleting(false);
    setUserToDelete(null);
  };

  return (
    <div className="layout-body" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className="dashboard-header border-bottom" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="dashboard-title flex-row">
            <Users size={28} /> Gestão de Equipe
          </h1>
          <p className="text-muted">Visualize e adicione novos usuários ao sistema.</p>
        </div>

        <button className="btn btn-primary" onClick={handleCreate} style={{ width: 'auto' }}>
          <UserPlus size={18} /> Adicionar Membro
        </button>
      </div>

      <div className="flex-row" style={{ alignItems: 'stretch', gap: '2rem', flexWrap: 'wrap' }}>
        {/* Lista de Usuários que agora ocupa 100% (Info de Níveis removido) */}
        <div style={{ flex: '1 1 100%' }}>
          <div className="glass-card" style={{
            padding: '0.5rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem',
            flexWrap: 'wrap', alignItems: 'center', background: 'hsla(var(--bg-main), 0.6)',
            borderColor: 'hsl(var(--border-light))', borderStyle: 'solid', borderWidth: '1px'
          }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--primary))', opacity: 0.6 }} />
              <input
                type="text"
                placeholder="Pesquisar por nome ou e-mail..."
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
                { id: 'recepcao', label: 'Recepção' }
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
              {[...equipe]
                .filter(u => {
                  let accessMatch = false;
                  if (profile?.role === 'admin') accessMatch = true;
                  else if (u.role === 'admin') accessMatch = false;
                  else accessMatch = (u.role === profile?.role);

                  if (!accessMatch) return false;

                  const search = searchTerm.toLowerCase();
                  const searchMatch = !searchTerm ||
                    (u.full_name?.toLowerCase().includes(search)) ||
                    (u.email?.toLowerCase().includes(search));

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
                    cursor: u.role === 'admin' ? 'default' : 'pointer'
                  }} onClick={() => u.role !== 'admin' && handleEdit(u)}>

                    {/* Coluna 1: Nome */}
                    <div style={{ flex: 2, display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div translate="no" className="avatar-sm notranslate" style={{
                        width: '36px', height: '36px', fontSize: '0.9rem',
                        filter: u.is_active === false ? 'grayscale(1)' : 'none',
                        flexShrink: 0
                      }}>
                        {(u.full_name || 'U')[0].toUpperCase()}
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
                      {u.email || 'Sem Email'}
                    </div>

                    {/* Coluna 3: Função */}
                    <div style={{ width: '120px', textAlign: 'center' }}>
                      <span translate="no" className="notranslate" style={{
                        fontSize: '0.7rem', fontWeight: 700, padding: '0.3rem 0.6rem', borderRadius: '12px',
                        background: u.role === 'admin' ? '#fee2e2' : u.role === 'psicologo' ? '#e0e7ff' : u.role === 'recepcao' ? '#dcfce7' : 'hsla(var(--primary), 0.1)',
                        color: u.role === 'admin' ? '#b91c1c' : u.role === 'psicologo' ? '#4338ca' : u.role === 'recepcao' ? '#15803d' : 'hsl(var(--primary))',
                        textTransform: 'uppercase', letterSpacing: '0.5px',
                        display: 'inline-block', width: '90px'
                      }}>
                        {u.role || 'user'}
                      </span>
                    </div>

                    <div style={{ width: '40px' }}></div>
                  </div>
                ))}
              {equipe.length === 0 && (
                <div className="text-center" style={{ padding: '4rem 1rem' }}>
                  <Users size={48} color="hsl(var(--border-light))" style={{ marginBottom: '1rem' }} />
                  <p className="text-muted">Nenhum colaborador encontrado...</p>
                </div>
              )}
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
        onDelete={promptExcluir}
        onInactivate={handleInativar}
      />

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {userToDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000, animation: 'fadeIn 0.2s ease-out'
        }}>
          <div className="glass-card" style={{
            width: '100%', maxWidth: '400px', margin: '1rem', padding: '0',
            overflow: 'hidden', animation: 'slideUp 0.3s ease-out',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid hsl(var(--border-light))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fee2e2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#b91c1c', fontWeight: 700 }}>
                <AlertTriangle size={24} />
                <span>Excluir Usuário?</span>
              </div>
              <button 
                onClick={() => setUserToDelete(null)} 
                style={{ background: 'transparent', border: 'none', color: '#b91c1c', cursor: 'pointer', padding: '0.25rem' }}
                disabled={isDeleting}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <p style={{ margin: '0 0 1rem 0', color: 'hsl(var(--text-main))', lineHeight: 1.5 }}>
                Você está prestes a excluir permanentemente o perfil de <strong>{userToDelete.full_name}</strong>.
              </p>
              <p style={{ margin: 0, color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                Esta ação não pode ser desfeita.
              </p>
            </div>

            <div style={{ padding: '1.25rem', background: 'hsla(var(--primary), 0.02)', borderTop: '1px solid hsl(var(--border-light))', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                style={{ width: 'auto', minWidth: '100px' }}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={confirmExcluir}
                disabled={isDeleting}
                style={{ background: '#ef4444', borderColor: '#dc2626', width: 'auto', minWidth: '100px' }}
              >
                {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

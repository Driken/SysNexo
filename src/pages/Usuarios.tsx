import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, Users, AlertTriangle, Shield, CheckCircle, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Usuarios: React.FC = () => {
  const { } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [role, setRole] = useState<'admin'|'recepcao'|'psicologo'>('recepcao');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'create'>('list');
  const [equipe, setEquipe] = useState<any[]>([]);

  useEffect(() => {
    if (view === 'list') {
      carregarEquipe();
    }
  }, [view]);

  const carregarEquipe = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setEquipe(data);
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          cpf: cpf
        }
      }
    });

    setLoading(false);

    if (error) {
      alert(`Erro ao cadastrar usuário: ${error.message}`);
    } else {
      alert('Usuário cadastrado com sucesso!');
      setFullName('');
      setCpf('');
      setEmail('');
      setPassword('');
      setView('list');
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
            {view === 'create' ? <UserPlus size={28} /> : <Users size={28} />} 
            {view === 'create' ? 'Novo Usuário' : 'Gestão de Equipe'}
          </h1>
          <p className="text-muted">
            {view === 'create' 
              ? 'Preencha os dados do novo integrante da clínica.' 
              : 'Visualize e gerencie todos os acessos do sistema.'}
          </p>
        </div>
        
        {view === 'list' && (
          <button className="btn btn-primary" onClick={() => setView('create')} style={{ width: 'auto' }}>
            <UserPlus size={18} /> Adicionar Membro
          </button>
        )}
      </div>

      <div className="flex-row" style={{ alignItems: 'stretch', gap: '2rem', flexWrap: 'wrap' }}>
        
        {/* Lado Esquerdo: Lista ou Formulário */}
        <div style={{ flex: '1 1 600px' }}>
          {view === 'list' ? (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {equipe.map(u => (
                  <div key={u.id} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '1.25rem', background: 'hsl(var(--bg-main))', 
                    border: '1px solid hsl(var(--border-light))', borderRadius: 'var(--radius-md)',
                    transition: 'transform 0.2s', cursor: 'default'
                  }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div className="avatar-sm" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                        {(u.full_name || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'hsl(var(--text-main))', fontSize: '1rem' }}>{u.full_name || 'Usuário'}</div>
                        <div style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>{u.cpf ? `CPF: ${u.cpf}` : 'Sem CPF'}</div>
                      </div>
                    </div>
                    <span style={{ 
                      fontSize: '0.75rem', fontWeight: 700, padding: '0.4rem 0.8rem', borderRadius: '20px',
                      background: u.role === 'admin' ? '#fee2e2' : u.role === 'psicologo' ? '#e0e7ff' : '#dcfce7',
                      color: u.role === 'admin' ? '#b91c1c' : u.role === 'psicologo' ? '#4338ca' : '#15803d',
                      textTransform: 'uppercase', letterSpacing: '0.5px'
                    }}>
                      {u.role}
                    </span>
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
          ) : (
            <div className="glass-card" style={{ padding: '2rem' }}>
              <form onSubmit={handleCadastro} className="flex-col">
                <div style={{ background: 'hsla(45, 100%, 50%, 0.1)', color: '#b45309', padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <AlertTriangle size={20} style={{ flexShrink: 0 }} /> 
                  <span><strong>Importante:</strong> Ao finalizar, um convite será enviado (ou o acesso imediato será criado). Salve a senha temporária para passar ao usuário.</span>
                </div>

                <div className="input-group">
                  <label className="input-label">Nome Completo</label>
                  <input 
                    className="form-input" 
                    required 
                    placeholder="Ex: Dr. Pedro Almeida"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                  />
                </div>

                <div className="flex-row" style={{ gap: '1rem' }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">CPF</label>
                    <input 
                      className="form-input" 
                      required 
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={e => setCpf(e.target.value)}
                    />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">Email de Acesso</label>
                    <input 
                      type="email"
                      className="form-input" 
                      required 
                      placeholder="email@clinica.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-row" style={{ gap: '1rem' }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">Senha Temporária</label>
                    <input 
                      type="password"
                      className="form-input" 
                      required 
                      placeholder="Mín. 6 caracteres"
                      minLength={6}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">Nível de Acesso</label>
                    <select 
                      className="form-input" 
                      value={role} 
                      onChange={e => setRole(e.target.value as any)}
                    >
                      <option value="recepcao">Recepção</option>
                      <option value="psicologo">Psicólogo</option>
                      <option value="admin">Administrador Geral</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setView('list')} disabled={loading} style={{ width: 'auto' }}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: 'auto' }}>
                    {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
                  </button>
                </div>
              </form>
            </div>
          )}
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
    </div>
  );
};

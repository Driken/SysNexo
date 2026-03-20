import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, X, AlertTriangle, Users, ArrowLeft } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const UsuariosModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [role, setRole] = useState<'admin'|'recepcao'|'psicologo'>('recepcao');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'list' | 'create'>('list');
  const [equipe, setEquipe] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && view === 'list') {
      carregarEquipe();
    }
  }, [isOpen, view]);

  const carregarEquipe = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setEquipe(data);
  };

  if (!isOpen) return null;

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Registra o usuário no Supabase Auth.
    // O trigger no banco vai criar o Profile na tabela profiles automaticamente.
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
      alert('Usuário cadastrado com sucesso! Aviso: O sistema pode ter feito login com a nova conta automaticamente.');
      setFullName('');
      setCpf('');
      setEmail('');
      setPassword('');
      setView('list');
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
      background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', 
      justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)'
    }} onClick={onClose}>
      <div className="glass-card" onClick={(e) => e.stopPropagation()} style={{ width: '500px', maxWidth: '90%', padding: '2rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="dashboard-title flex-row" style={{ color: 'hsl(var(--text-main))', margin: 0, fontSize: '1.5rem' }}>
            {view === 'create' ? <UserPlus size={24} color="hsl(var(--primary))" /> : <Users size={24} color="hsl(var(--primary))" />} 
            {view === 'create' ? 'Cadastrar Usuário' : 'Equipe SysNexo'}
          </h2>
          <button onClick={() => { onClose(); setView('list'); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <X size={24} color="hsl(var(--text-muted))" />
          </button>
        </div>

        {view === 'list' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
              <button className="btn btn-primary" onClick={() => setView('create')} style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                <UserPlus size={18} /> Novo Usuário
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
              {equipe.map(u => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-main)', border: '1px solid hsl(var(--border-light))', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'hsl(var(--text-main))', marginBottom: '0.2rem' }}>{u.full_name || 'Usuário'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>{u.cpf ? `CPF: ${u.cpf}` : 'Sem CPF'}</div>
                  </div>
                  <span style={{ 
                    fontSize: '0.75rem', fontWeight: 600, padding: '0.3rem 0.6rem', borderRadius: '20px',
                    background: u.role === 'admin' ? '#fee2e2' : u.role === 'psicologo' ? '#e0e7ff' : '#dcfce7',
                    color: u.role === 'admin' ? '#b91c1c' : u.role === 'psicologo' ? '#4338ca' : '#15803d',
                    textTransform: 'uppercase'
                  }}>
                    {u.role}
                  </span>
                </div>
              ))}
              {equipe.length === 0 && <span className="text-muted text-sm text-center" style={{ padding: '2rem' }}>Carregando equipe...</span>}
            </div>
          </div>
        ) : (
          <form onSubmit={handleCadastro} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#fef3c7', color: '#b45309', padding: '0.75rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <AlertTriangle size={16} /> <span>Aviso: Após criar, o sistema pode fazer login automaticamente na nova conta criada.</span>
            </div>

            <div className="input-group">
              <label className="input-label">Nome Completo</label>
              <input 
                className="form-input" 
                required 
                placeholder="Dr. João Silva"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">CPF (Obrigatório)</label>
              <input 
                className="form-input" 
                required 
                placeholder="000.000.000-00"
                value={cpf}
                onChange={e => setCpf(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Email de Acesso (Login)</label>
              <input 
                type="email"
                className="form-input" 
                required 
                placeholder="joao@sysnexo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Senha Temporária</label>
              <input 
                type="password"
                className="form-input" 
                required 
                placeholder="Minimo 6 caracteres"
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Nível de Acesso (Cargo)</label>
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

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setView('list')} disabled={loading} style={{ width: 'auto' }}>
                <ArrowLeft size={18} /> Voltar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginLeft: '1rem' }}>
                {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

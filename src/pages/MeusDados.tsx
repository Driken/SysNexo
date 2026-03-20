import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { UserCircle, Save } from 'lucide-react';

export const MeusDados: React.FC = () => {
  const { profile, updateProfile, session } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Seta o valor inicial
  useEffect(() => {
    if (profile?.full_name && !profile.full_name.includes('-')) {
      setFullName(profile.full_name);
    }
    if (profile?.cpf) {
      setCpf(profile.cpf);
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, cpf: cpf || null })
      .eq('id', profile.id);

    if (error) {
      setMessage('Erro ao tentar atualizar o perfil.');
      console.error(error);
    } else {
      updateProfile({ full_name: fullName, cpf: cpf || undefined });
      setMessage('Perfil atualizado com sucesso!');
    }
    
    setSaving(false);
  };

  const roleDict: Record<string, string> = {
    'admin': 'Administrador Geral',
    'recepcao': 'Recepção / Atendimento',
    'psicologo': 'Psicólogo Clínico'
  };
  const displayRole = roleDict[profile?.role || ''] || 'Visitante';

  return (
    <div className="layout-body" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className="dashboard-header border-bottom" style={{ marginBottom: '2rem' }}>
        <h1 className="dashboard-title flex-row"><UserCircle size={28} /> Meus Dados</h1>
        <p className="text-muted">Gerencie as informações da sua conta e preferências.</p>
      </div>

      <div className="glass-card" style={{ maxWidth: '600px', padding: '2rem' }}>
        <form onSubmit={handleSave} className="flex-col">
          
          <div className="input-group">
            <label className="input-label">Nome Completo</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Digite seu nome completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">CPF</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Email de Acesso (Login)</label>
            <input 
              type="email" 
              className="form-input" 
              value={session?.user?.email || ''}
              disabled
              style={{ opacity: 0.7, cursor: 'not-allowed' }}
              title="O email de acesso não pode ser alterado por aqui"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Cargo / Nível de Acesso (Gerenciado pelo Admin)</label>
            <input 
              type="text" 
              className="form-input" 
              value={displayRole}
              disabled
              style={{ opacity: 0.7, cursor: 'not-allowed' }}
            />
          </div>

          {message && (
            <div style={{ 
              padding: '1rem', 
              borderRadius: 'var(--radius-sm)', 
              background: message.includes('Erro') ? '#fee2e2' : 'hsla(var(--primary), 0.1)', 
              color: message.includes('Erro') ? '#b91c1c' : 'hsl(var(--primary))',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}>
              {message}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving || !fullName || !cpf} style={{ width: 'auto' }}>
              <Save size={18} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, ArrowLeft, Trash2, UserMinus, UserCheck, AlertTriangle, Key, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  userToEdit?: any;
  onSave: () => void;
  onCancel: () => void;
  onDelete: (user: any) => void;
  onInactivate: (user: any) => void;
}

export const UserForm: React.FC<Props> = ({
  userToEdit, onSave, onCancel, onDelete, onInactivate
}) => {
  const { profile: loggedProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [role, setRole] = useState<'admin' | 'recepcao' | 'psicologo'>('recepcao');
  const [loading, setLoading] = useState(false);

  // States para Redefinição Manual
  const [isResetting, setIsResetting] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      setFullName(userToEdit.full_name || '');
      setCpf(userToEdit.cpf || '');
      setEmail(userToEdit.email || '');
      setRole(userToEdit.role || 'recepcao');
    } else {
      setFullName('');
      setCpf('');
      setEmail('');
      setPassword('');
      setRole('recepcao');
    }
    setIsResetting(false);
    setNewPass('');
    setConfirmPass('');
  }, [userToEdit]);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    val = val.replace(/(\d{3})(\d)/, '$1.$2');
    val = val.replace(/(\d{3})(\d)/, '$1.$2');
    val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    setCpf(val);
  };

  const handleManualReset = async () => {
    if (!newPass || newPass.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPass !== confirmPass) {
      alert('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada. Recarregue a página.');

      const { error } = await supabase.rpc('admin_reset_password', {
        target_user_id: userToEdit.id,
        new_password: newPass
      });

      if (error) throw error;

      alert('Senha redefinida com sucesso!');
      setIsResetting(false);
      setNewPass('');
      setConfirmPass('');
    } catch (error: any) {
      alert(`Erro ao redefinir: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isResetting) return;
    setLoading(true);

    if (userToEdit) {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          role: role,
          cpf: cpf,
          email: email
        })
        .eq('id', userToEdit.id);

      setLoading(false);
      if (error) {
        alert(`Erro ao atualizar: ${error.message}`);
      } else {
        alert('Usuário atualizado com sucesso!');
        onSave();
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
            cpf: cpf,
            email: email
          }
        }
      });

      setLoading(false);
      if (error) {
        alert(`Erro ao cadastrar: ${error.message}`);
      } else {
        alert('Usuário cadastrado com sucesso!');
        onSave();
      }
    }
  };

  return (
    <div className="glass-card" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={onCancel} className="btn btn-outline" style={{ padding: '0.5rem', width: 'auto' }}>
          <ArrowLeft size={20} />
        </button>
        <h2 style={{ margin: 0 }}>{userToEdit ? 'Editar Colaborador' : 'Novo Cadastro'}</h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {!userToEdit && (
          <div style={{ background: '#fef3c7', color: '#b45309', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <AlertTriangle size={20} style={{ flexShrink: 0 }} />
            <span>Aviso: O cadastro cria uma conta oficial de acesso ao sistema. O e-mail informado será o login.</span>
          </div>
        )}

        {!isResetting ? (
          <>
            <div className="input-group">
              <label className="input-label">Nome Completo</label>
              <input className="form-input" required value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>

            <div className="input-group">
              <label className="input-label">CPF</label>
              <input className="form-input" required value={cpf} onChange={handleCpfChange} />
            </div>

            <div className="input-group">
              <label className="input-label">E-mail (Login de Acesso)</label>
              <input type="email" className="form-input" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            {!userToEdit && (
              <div className="input-group">
                <label className="input-label">Senha Temporária</label>
                <input type="password" className="form-input" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Cargo / Nível de Acesso</label>
              <select className="form-input" value={role} onChange={e => setRole(e.target.value as any)}>
                <option value="recepcao">Recepção</option>
                <option value="psicologo">Psicólogo</option>
                <option value="admin">Administrador Geral</option>
              </select>
            </div>
          </>
        ) : (
          <div style={{
            padding: '1.5rem', borderRadius: '12px', background: 'hsla(var(--primary), 0.05)',
            border: '1px solid hsla(var(--primary), 0.1)', display: 'flex', flexDirection: 'column', gap: '1rem'
          }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--primary))' }}>
              <Key size={18} /> Redefinir Senha de {userToEdit.full_name}
            </h3>

            <div className="input-group">
              <label className="input-label">Nova Senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  autoFocus
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Confirmar Nova Senha</label>
              <input
                type={showPass ? 'text' : 'password'}
                className="form-input"
                value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
                placeholder="Repita a senha"
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setIsResetting(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancelar</button>
              <button type="button" onClick={handleManualReset} disabled={loading} className="btn btn-primary" style={{ flex: 1.5 }}>
                {loading ? 'Salvando...' : 'Confirmar Nova Senha'}
              </button>
            </div>
          </div>
        )}

        {userToEdit && !isResetting && (
          <div style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid hsl(var(--border-light))' }}>
            <h4 style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '1rem' }}>Gerenciamento de Conta</h4>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => onInactivate(userToEdit)} className="btn btn-outline" style={{ flex: 1, gap: '0.5rem' }}>
                {userToEdit.is_active === false ? <UserCheck size={16} /> : <UserMinus size={16} />}
                {userToEdit.is_active === false ? 'Reativar' : 'Inativar'}
              </button>

              {loggedProfile?.role === 'admin' && (
                <button type="button" onClick={() => setIsResetting(true)} className="btn btn-outline" style={{ flex: 1, gap: '0.5rem', color: 'hsl(var(--primary))' }}>
                  <Key size={16} /> Redefinir Senha
                </button>
              )}

              <button type="button" onClick={() => onDelete(userToEdit)} className="btn btn-outline" style={{ flex: 1, gap: '0.5rem', color: '#ef4444', borderColor: '#fee2e2' }}>
                <Trash2 size={16} /> Excluir
              </button>
            </div>
          </div>
        )}

        {!isResetting && (
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>
              <Save size={18} /> {loading ? 'Processando...' : userToEdit ? 'Salvar Edição' : 'Concluir Cadastro'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

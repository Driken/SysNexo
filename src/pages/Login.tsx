import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const navigate = useNavigate();
  const { session } = useAuth();
  
  useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.message || 'Erro ao fazer login.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-form-container glass-card">
        <div>
          <h1 className="brand-title">SysNexo</h1>
          <p className="brand-subtitle">Gestão Clínica Inteligente & Humanizada</p>
        </div>
        
        {errorMsg && <div className="alert-error">{errorMsg}</div>}
        
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label" htmlFor="email">E-mail de Acesso</label>
            <input 
              className="form-input"
              type="email" 
              id="email" 
              placeholder="exemplo@clinica.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <label className="input-label" htmlFor="password">Senha</label>
            <input 
              className="form-input"
              type="password" 
              id="password" 
              placeholder="Sua senha secreta" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn btn-primary mt-4" disabled={loading}>
            {loading ? 'Entrando...' : (
              <>
                Acessar Plataforma
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
        
        <div className="text-center mt-4">
          <p className="text-sm text-muted">
            Problemas para acessar? Contate o Sup. Admin.
          </p>
        </div>
      </div>
    </div>
  );
};

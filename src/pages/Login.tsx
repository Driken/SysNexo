import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowRight, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  let robotMessage = "Olá! Sou o PsicoBot. Pronto para o plantão?";
  
  let robotAction: 'idle' | 'email' | 'password' | 'peeking' | 'error' = 'idle';

  if (loading) {
    robotMessage = "Analisando credenciais no sistema... aguarde!";
    robotAction = 'idle';
  } else if (errorMsg) {
    robotMessage = "Ops, não consegui te validar! Vamos tentar de novo?";
    robotAction = 'error';
  } else if (showPassword) {
    robotMessage = "Escondendo nada, hein? Tô de olho nessa senha!";
    robotAction = 'peeking';
  } else if (focusedField === 'password') {
    robotMessage = "Pode ficar tranquilo, estou com os olhos fechados!";
    robotAction = 'password';
  } else if (focusedField === 'email') {
    robotMessage = "Anotando o seu e-mail para validar na recepção...";
    robotAction = 'email';
  }

  const renderRobot = () => (
    <svg width="65" height="75" viewBox="0 0 100 110" style={{ overflow: 'visible', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.2))' }}>
      {/* Antena do Robozinho */}
      <line x1="50" y1="20" x2="50" y2="2" stroke="hsl(var(--primary))" strokeWidth="4" />
      <circle cx="50" cy="2" r="6" fill="hsl(var(--primary))" />
      
      {/* Rosto Quadrado de Robozinho */}
      <rect x="15" y="20" width="70" height="70" rx="15" fill="hsl(var(--bg-card))" stroke="hsl(var(--primary))" strokeWidth="4" />
      
      {/* Parafusos nos cantos */}
      <circle cx="25" cy="30" r="2" fill="hsl(var(--primary))" opacity="0.5" />
      <circle cx="75" cy="30" r="2" fill="hsl(var(--primary))" opacity="0.5" />
      <circle cx="25" cy="80" r="2" fill="hsl(var(--primary))" opacity="0.5" />
      <circle cx="75" cy="80" r="2" fill="hsl(var(--primary))" opacity="0.5" />

      {/* Óculos Redondos (Charme de Psicólogo) */}
      <circle cx="33" cy="50" r="14" fill="transparent" stroke="hsl(var(--text-main))" strokeWidth="3" />
      <circle cx="67" cy="50" r="14" fill="transparent" stroke="hsl(var(--text-main))" strokeWidth="3" />
      <line x1="47" y1="50" x2="53" y2="50" stroke="hsl(var(--text-main))" strokeWidth="3" />
      
      {/* Olhinhos Brilhantes interativos */}
      {robotAction === 'idle' && (
        <>
          <circle cx="33" cy="50" r="4" fill="hsl(var(--primary))" />
          <circle cx="67" cy="50" r="4" fill="hsl(var(--primary))" />
        </>
      )}
      {robotAction === 'email' && (
        <>
          {/* Olhando para o teclado/input (baixo) */}
          <circle cx="28" cy="55" r="4" fill="hsl(var(--primary))" />
          <circle cx="62" cy="55" r="4" fill="hsl(var(--primary))" />
        </>
      )}
      {robotAction === 'error' && (
        <>
          {/* Circuito dando erro (olhos de x) */}
          <line x1="28" y1="45" x2="38" y2="55" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
          <line x1="38" y1="45" x2="28" y2="55" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" />
          <circle cx="67" cy="50" r="4" fill="hsl(var(--primary))" />
        </>
      )}
      {robotAction === 'password' && (
        <>
          {/* Mãozinhas Robóticas Articuladas (Tombadas para cobrir melhor o rosto) */}
          <g transform="translate(19, 36) rotate(15, 14, 14)">
            {/* Base da mão */}
            <rect x="0" y="8" width="28" height="14" rx="4" fill="hsl(var(--primary))" />
            {/* Dedos mecânicos fofos */}
            <rect x="2" y="0" width="6" height="12" rx="3" fill="hsl(var(--primary))" />
            <rect x="11" y="-2" width="6" height="14" rx="3" fill="hsl(var(--primary))" />
            <rect x="20" y="0" width="6" height="12" rx="3" fill="hsl(var(--primary))" />
          </g>
          <g transform="translate(53, 36) rotate(-15, 14, 14)">
            {/* Base da mão */}
            <rect x="0" y="8" width="28" height="14" rx="4" fill="hsl(var(--primary))" />
            {/* Dedos mecânicos fofos */}
            <rect x="2" y="0" width="6" height="12" rx="3" fill="hsl(var(--primary))" />
            <rect x="11" y="-2" width="6" height="14" rx="3" fill="hsl(var(--primary))" />
            <rect x="20" y="0" width="6" height="12" rx="3" fill="hsl(var(--primary))" />
          </g>
        </>
      )}
      {robotAction === 'peeking' && (
        <>
           {/* Abrindo a mãozinha e espiando de um lado */}
           <circle cx="33" cy="50" r="4" fill="hsl(var(--primary))" />
           <g transform="translate(53, 36) rotate(-15, 14, 14)">
            {/* Base da mão */}
            <rect x="0" y="8" width="28" height="14" rx="4" fill="hsl(var(--primary))" />
            {/* Dedos mecânicos fofos */}
            <rect x="2" y="0" width="6" height="12" rx="3" fill="hsl(var(--primary))" />
            <rect x="11" y="-2" width="6" height="14" rx="3" fill="hsl(var(--primary))" />
            <rect x="20" y="0" width="6" height="12" rx="3" fill="hsl(var(--primary))" />
          </g>
        </>
      )}
      
      {/* Boquinha Digital LED */}
      {robotAction === 'error' ? (
        <path d="M 40 75 Q 50 65 60 75" stroke="hsl(var(--primary))" strokeWidth="3" fill="transparent" strokeLinecap="round" />
      ) : robotAction === 'password' ? (
        <circle cx="50" cy="72" r="3" fill="hsl(var(--primary))" />
      ) : (
        <path d="M 38 72 Q 50 80 62 72" stroke="hsl(var(--primary))" strokeWidth="3" fill="transparent" strokeLinecap="round" />
      )}
    </svg>
  );
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
    <div className="auth-wrapper" style={{ position: 'relative' }}>
      {/* Botão de Modo Escuro / Claro */}
      <button 
        onClick={toggleTheme}
        style={{
          position: 'absolute', top: '20px', right: '20px', zIndex: 100,
          background: 'hsla(var(--bg-card), 0.8)', backdropFilter: 'blur(8px)',
          border: '1px solid hsl(var(--border-light))', borderRadius: '50%', 
          width: '45px', height: '45px', display: 'flex', alignItems: 'center', 
          justifyContent: 'center', cursor: 'pointer', color: 'hsl(var(--text-main))', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'all 0.2s'
        }}
        title="Alternar Tema (Dark/Light)"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="auth-form-container glass-card" style={{ position: 'relative' }}>
        
        {/* Robozinho Interativo */}
        <div className="robot-container">
          <div style={{
            background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--primary))',
            padding: '12px 18px', borderRadius: '20px 20px 0 20px',
            fontSize: '0.85rem', color: 'hsl(var(--text-main))', fontWeight: 600,
            boxShadow: '0 8px 25px rgba(0,0,0,0.3)', marginBottom: '8px',
            maxWidth: '180px', textAlign: 'center', position: 'relative'
          }}>
            {robotMessage}
            <div style={{
              position: 'absolute', bottom: '-8px', right: '15px',
              borderWidth: '9px 9px 0', borderStyle: 'solid',
              borderColor: 'hsl(var(--primary)) transparent transparent transparent'
            }} />
          </div>
          <div style={{ fontSize: '3rem', filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.4))' }}>
            {renderRobot()}
          </div>
        </div>

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
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              required
            />
          </div>
          
          <div className="input-group">
            <label className="input-label" htmlFor="password">Senha</label>
            <div style={{ position: 'relative' }}>
              <input 
                className="form-input"
                type={showPassword ? "text" : "password"} 
                id="password" 
                placeholder="Sua senha secreta" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                required
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                title={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
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

import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowRight, Eye, EyeOff, Sun, Moon, Mail, ShieldCheck, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

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
  } else if (rememberMe) {
    robotMessage = "Entendido! Deixarei as chaves prontas para sua volta.";
    robotAction = 'idle';
  }

  const renderRobot = () => (
    <svg width="65" height="75" viewBox="0 0 100 110" style={{ overflow: 'visible', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.2))' }}>
      {/* Antena do Robozinho com Símbolo Psi (Identidade Visual) */}
      <line x1="50" y1="20" x2="50" y2="10" stroke="hsl(var(--primary))" strokeWidth="3" />
      <g transform="translate(50, 6) scale(0.7)">
        <path d="M -12 -10 Q -12 2 0 2 Q 12 2 12 -10" stroke="hsl(var(--primary))" strokeWidth="4" fill="none" strokeLinecap="round" />
        <line x1="0" y1="-14" x2="0" y2="8" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" />
      </g>

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
          {rememberMe ? (
            <path d="M 62 52 Q 67 44 72 52" stroke="hsl(var(--primary))" strokeWidth="3" fill="transparent" strokeLinecap="round" />
          ) : (
            <circle cx="67" cy="50" r="4" fill="hsl(var(--primary))" />
          )}
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
      {/* Mãos do Robozinho - Sempre visíveis com animação de transição */}
      {/* Mão Esquerda */}
      <g style={{ 
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: robotAction === 'password' 
          ? 'translate(19px, 36px) rotate(15deg)' 
          : 'translate(-15px, 45px) rotate(0deg)',
        transformOrigin: '28px 14px',
        animation: robotAction === 'idle' ? 'subtleWaveLeft 3s infinite ease-in-out' : 'none'
      }}>
        <rect x="0" y="8" width="28" height="14" rx="4" fill="hsl(var(--primary))" />
        <rect x="2" y="0" width="6" height="12" rx="3" fill="hsl(var(--primary))" />
        <rect x="11" y="-2" width="6" height="14" rx="3" fill="hsl(var(--primary))" />
        <rect x="20" y="0" width="6" height="12" rx="3" fill="hsl(var(--primary))" />
      </g>

      {/* Mão Direita */}
      <g style={{ 
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: (robotAction === 'password' || robotAction === 'peeking')
          ? 'translate(53px, 36px) rotate(-15deg)' 
          : 'translate(87px, 45px) rotate(0deg)',
        transformOrigin: '0px 14px',
        animation: robotAction === 'idle' ? 'subtleWaveRight 3s infinite ease-in-out' : 'none'
      }}>
        <rect x="0" y="8" width="28" height="14" rx="4" fill="hsl(var(--primary))" />
        <rect x="2" y="0" width="6" height="12" rx="3" fill="hsl(var(--primary))" />
        <rect x="11" y="-2" width="6" height="14" rx="3" fill="hsl(var(--primary))" />
        <rect x="20" y="0" width="6" height="12" rx="3" fill="hsl(var(--primary))" />
      </g>

      {robotAction === 'peeking' && (
        <circle cx="33" cy="50" r="4" fill="hsl(var(--primary))" />
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
      // Configurar persistência ANTES do login
      if (!rememberMe) {
        sessionStorage.setItem('supabase_use_session_only', 'true');
      } else {
        sessionStorage.removeItem('supabase_use_session_only');
      }

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

  const handleResetByEmail = async () => {
    if (!forgotEmail) {
      toast.error('Por favor, insira seu e-mail.');
      return;
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      toast.success('E-mail de redefinição enviado!');
      setShowForgotModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar e-mail.');
    }
  };

  const handleResetByAdmin = async () => {
    if (!forgotEmail) {
      toast.error('Informe seu e-mail para que o admin te identifique.');
      return;
    }
    
    try {
      // Usamos uma RPC (Functions) do banco para contornar restrições de RLS 
      // pois o usuário ainda não está logado aqui.
      const { error } = await supabase.rpc('solicitacao_reset_admin', { target_email: forgotEmail });
      
      if (error) throw error;
      
      toast.info('Solicitação enviada ao administrador!');
      setShowForgotModal(false);
    } catch (err: any) {
      toast.error('Erro ao notificar administrador.');
    }
  };

  return (
    <div className="auth-wrapper" style={{ position: 'relative', paddingTop: '100px' }}>
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
        <div style={{
          position: 'absolute', top: '-65px', right: '15px', zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          animation: 'floatRobot 3s infinite ease-in-out',
          transition: 'all 0.3s'
        }}>
          <style>{`
            @keyframes floatRobot {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-5px); }
            }
            @keyframes subtleWaveLeft {
              0%, 100% { transform: translate(-15px, 45px) rotate(0deg); }
              50% { transform: translate(-15px, 42px) rotate(0deg); }
            }
            @keyframes subtleWaveRight {
              0%, 100% { transform: translate(87px, 45px) rotate(0deg); }
              50% { transform: translate(87px, 42px) rotate(0deg); }
            }
            .custom-checkbox-container {
              display: flex;
              align-items: center;
              gap: 0.6rem;
              cursor: pointer;
              user-select: none;
              transition: all 0.2s;
            }
            .custom-checkbox-container:hover {
              color: hsl(var(--primary));
            }
            .checkbox-box {
              width: 18px;
              height: 18px;
              border: 2px solid hsl(var(--border-light));
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s;
              background: transparent;
            }
            input:checked + .checkbox-box {
              background: hsl(var(--primary));
              border-color: hsl(var(--primary));
            }
            .checkbox-box svg {
              display: none;
              color: white;
            }
            input:checked + .checkbox-box svg {
              display: block;
            }
          `}</style>
          <div style={{
            background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--primary))',
            padding: '10px 15px', borderRadius: '18px 18px 0 18px',
            fontSize: '0.8rem', color: 'hsl(var(--text-main))', fontWeight: 600,
            boxShadow: '0 8px 20px rgba(0,0,0,0.25)', marginBottom: '25px',
            maxWidth: '160px', textAlign: 'center', position: 'relative',
            marginRight: '20px'
          }}>
            {robotMessage}
            <div style={{
              position: 'absolute', bottom: '-20px', right: '5px',
              borderWidth: '20px 8px 0', borderStyle: 'solid',
              borderColor: 'hsl(var(--primary)) transparent transparent transparent'
            }} />
          </div>
          <div style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.3))' }}>
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

          <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '1.5rem', color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
            <label className="custom-checkbox-container" style={{ fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ display: 'none' }}
              />
              <div className="checkbox-box">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              Manter conectado
            </label>
            <button 
              type="button" 
              onClick={() => {
                setForgotEmail(email);
                setShowForgotModal(true);
              }}
              style={{ background: 'transparent', border: 'none', color: 'hsl(var(--primary))', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Esqueceu a senha?
            </button>
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

      {/* Modal de Recuperação de Senha */}
      {showForgotModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div className="glass-card" style={{ 
            width: '100%', maxWidth: '400px', position: 'relative', 
            padding: '2rem', animation: 'modalEntry 0.3s ease-out' 
          }}>
            <style>{`
              @keyframes modalEntry {
                from { opacity: 0; transform: scale(0.95) translateY(10px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
              }
            `}</style>
            <button 
              onClick={() => setShowForgotModal(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))' }}
            >
              <X size={20} />
            </button>
            
            <h2 style={{ marginBottom: '0.5rem', color: 'hsl(var(--text-main))', fontSize: '1.5rem' }}>Recuperar Acesso</h2>
            <p style={{ color: 'hsl(var(--text-muted))', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
              Selecione o método de redefinição desejado.
            </p>

            <div className="input-group">
               <label className="input-label">E-mail da Conta</label>
               <input 
                 className="form-input"
                 type="email" 
                 value={forgotEmail} 
                 onChange={(e) => setForgotEmail(e.target.value)}
                 placeholder="Digite seu e-mail"
               />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginTop: '1.5rem' }}>
               <button 
                 onClick={handleResetByEmail}
                 className="btn" 
                 style={{ 
                   background: 'hsl(var(--primary))', color: 'white', 
                   display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                   padding: '12px'
                 }}
               >
                 <Mail size={18} />
                 Receber E-mail
               </button>
               
               <button 
                 onClick={handleResetByAdmin}
                 className="btn" 
                 style={{ 
                   background: 'transparent', border: '1px solid hsl(var(--primary))', color: 'hsl(var(--primary))',
                   display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                   padding: '12px'
                 }}
               >
                 <ShieldCheck size={18} />
                 Solicitar suporte Admin
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

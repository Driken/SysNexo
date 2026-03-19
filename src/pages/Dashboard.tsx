import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User } from 'lucide-react';
import { BuscaUniversal } from '../components/BuscaUniversal';

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();

  const displayName = profile?.full_name && profile.full_name.includes('-') 
    ? 'Usuário' 
    : profile?.full_name || 'Usuário';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div className="dashboard-header" style={{ marginBottom: 0 }}>
        <h1 className="dashboard-title">Olá, {displayName.split(' ')[0]}!</h1>
        <p className="text-muted">Bem-vindo(a) ao sistema de gestão clínica.</p>
      </div>

          <BuscaUniversal />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {profile?.role === 'recepcao' || profile?.role === 'admin' ? (
              <div className="glass-card">
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={20} />
                  Módulo de Recepção (Sprint 3)
                </h3>
                <p className="text-muted text-sm">
                  Em breve: Histórico de datas, agendamentos e visualização simplificada sem dados sensíveis.
                </p>
              </div>
            ) : null}

            {profile?.role === 'psicologo' || profile?.role === 'admin' ? (
              <div className="glass-card">
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={20} />
                  Módulo do Psicólogo (Sprint 4)
                </h3>
                <p className="text-muted text-sm">
                  Em breve: Prontuário, notas de evolução e histórico das sessões (sigilo garantido).
                </p>
              </div>
            ) : null}
      </div>
    </div>
  );
};

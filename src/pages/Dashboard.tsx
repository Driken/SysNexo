import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BuscaUniversal } from '../components/BuscaUniversal';
import { FilaDeEspera } from '../components/FilaDeEspera';
import { PainelPsicologo } from '../components/PainelPsicologo';

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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {profile?.role === 'recepcao' || profile?.role === 'admin' ? (
              <FilaDeEspera />
            ) : null}

            {profile?.role === 'psicologo' || profile?.role === 'admin' ? (
              <PainelPsicologo />
            ) : null}
      </div>
    </div>
  );
};

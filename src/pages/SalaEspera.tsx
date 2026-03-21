import React from 'react';
import { PainelPsicologo } from '../components/PainelPsicologo';
import { Clock } from 'lucide-react';

export const SalaEspera: React.FC = () => {
  return (
    <div className="layout-body" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className="dashboard-header border-bottom">
        <h1 className="dashboard-title flex-row"><Clock size={28} /> Sala de Espera</h1>
        <p className="text-muted">Maneje sua fila de atendimentos do dia. Aceite pacientes e inicie sessões diretamente por aqui.</p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <PainelPsicologo />
      </div>
    </div>
  );
};

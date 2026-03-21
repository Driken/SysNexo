import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FilaDeEspera } from '../components/FilaDeEspera';
import { Activity, CalendarPlus } from 'lucide-react';

export const Atendimentos: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="layout-body" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className="dashboard-header border-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="dashboard-title flex-row"><Activity size={28} /> Gestão de Atendimentos</h1>
          <p className="text-muted">Acompanhe a fila em tempo real, gerencie chamados e consulte o histórico de produtividade do dia.</p>
        </div>
        
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/atendimentos/agendar')}
          style={{ width: 'auto', marginBottom: '0.5rem' }}
        >
          <CalendarPlus size={18} /> Agendar Atendimento
        </button>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <FilaDeEspera />
      </div>
    </div>
  );
};

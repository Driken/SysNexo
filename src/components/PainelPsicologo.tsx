import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Agendamento } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { User, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PainelPsicologo: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) carregarAgenda();
  }, [profile]);

  const carregarAgenda = async () => {
    setLoading(true);
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from('agendamentos')
      .select('*, paciente:pacientes(id, nome)')
      .eq('psicologo_id', profile?.id)
      .gte('data_hora', startOfDay.toISOString())
      .lte('data_hora', endOfDay.toISOString())
      .order('data_hora', { ascending: true });

    if (data) {
      setAgendamentos(data as unknown as Agendamento[]);
    }
    setLoading(false);
  };

  if (loading) return <div>Carregando sua agenda...</div>;

  return (
    <div className="glass-card" style={{ flex: 1, borderLeft: '4px solid hsl(var(--primary))' }}>
      <h3 className="flex-row" style={{ marginBottom: '1rem', color: 'hsl(var(--primary))' }}>
        <Activity size={20} /> Meus Pacientes Hoje
      </h3>
      
      {agendamentos.length === 0 ? (
        <p className="text-muted text-sm">Nenhum paciente marcado para hoje.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {agendamentos.map(agenda => (
            <div key={agenda.id} style={{ 
              padding: '1rem', 
              border: '1px solid', 
              borderColor: agenda.status === 'Aguardando' ? 'hsl(var(--primary))' : 'hsl(var(--border-light))',
              background: agenda.status === 'Aguardando' ? 'hsla(var(--primary), 0.05)' : 'transparent',
              borderRadius: 'var(--radius-sm)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{agenda.paciente?.nome || 'Desconhecido'}</h4>
                  <p className="text-muted text-sm" style={{ margin: 0 }}>
                    {new Date(agenda.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • Status: <strong>{agenda.status}</strong>
                  </p>
                </div>
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '0.4rem 1rem', width: 'auto' }}
                  onClick={() => navigate(`/paciente/${agenda.paciente?.id}`)}
                >
                  <User size={16} style={{ marginRight: '0.3rem' }}/> Abrir Prontuário
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

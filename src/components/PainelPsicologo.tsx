import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Agendamento } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { User, Activity, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
      .order('created_at', { ascending: true });

    if (data) {
      setAgendamentos(data as unknown as Agendamento[]);
    }
    setLoading(false);
  };

  const aceitarAtendimento = async (id: string, pacienteId: string) => {
    const { error } = await supabase
      .from('agendamentos')
      .update({ 
        status: 'Em Atendimento',
        inicio_atendimento: new Date().toISOString()
      })
      .eq('id', id);

    if (!error) {
      toast.success('Atendimento iniciado!');
      carregarAgenda();
      navigate(`/paciente/${pacienteId}`);
    } else {
      toast.error('Erro ao iniciar atendimento');
    }
  };

  const sessoesPendentes = agendamentos.filter(a => a.status !== 'Finalizado');
  const sessoesFinalizadas = agendamentos.filter(a => a.status === 'Finalizado');

  if (loading) return <div>Carregando sua agenda...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* SEÇÃO 1: FILA DE ATENDIMENTO */}
      <div className="glass-card" style={{ flex: 1, borderLeft: '4px solid hsl(var(--primary))' }}>
        <h3 className="flex-row" style={{ marginBottom: '1.5rem', color: 'hsl(var(--primary))' }}>
          <Clock size={20} /> Fila de Atendimento (Ordem de Chegada)
        </h3>

        {sessoesPendentes.length === 0 ? (
          <p className="text-center" style={{ padding: '2rem', color: 'hsl(var(--text-muted))', border: '1px dashed hsl(var(--border-light))', borderRadius: '12px' }}>
            Nenhum paciente aguardando no momento.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {sessoesPendentes.map((agenda, index) => (
              <div key={agenda.id} style={{
                padding: '1.25rem',
                border: '1px solid',
                borderColor: agenda.status === 'Aguardando' ? 'hsl(var(--primary))' : 'hsl(var(--border-light))',
                background: agenda.status === 'Aguardando' ? 'hsla(var(--primary), 0.05)' : 'transparent',
                borderRadius: 'var(--radius-md)',
                position: 'relative'
              }}>
                <div style={{ position: 'absolute', top: '1rem', left: '-12px', width: '24px', height: '24px', background: 'hsl(var(--primary))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 800, border: '3px solid hsl(var(--bg-card))', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                  {index + 1}
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '0.5rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'hsl(var(--text-main))' }}>{agenda.paciente?.nome || 'Desconhecido'}</h4>
                    <p className="text-muted text-sm" style={{ margin: '0.25rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={14} /> Chegada: {new Date(agenda.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • 
                      <span style={{ 
                        color: agenda.status === 'Aguardando' ? 'hsl(var(--primary))' : '#10b981',
                        fontWeight: 700 
                      }}> Status: {agenda.status}</span>
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {agenda.status === 'Aguardando' && (
                      <button
                        className="btn btn-primary pulse-btn"
                        style={{ 
                          padding: '0.7rem 1.75rem', 
                          width: 'auto', 
                          background: '#10b981', 
                          border: 'none',
                          fontWeight: 800,
                          fontSize: '0.9rem',
                          boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                        onClick={() => aceitarAtendimento(agenda.id, agenda.paciente_id)}
                      >
                        <CheckCircle2 size={18} /> INICIAR SESSÃO
                      </button>
                    )}

                    {agenda.status === 'Em Atendimento' && (
                      <button
                        className="btn btn-secondary"
                        style={{ 
                          padding: '0.7rem 1.75rem', 
                          width: 'auto', 
                          borderColor: 'hsl(var(--primary))',
                          color: 'hsl(var(--primary))',
                          background: 'hsla(var(--primary), 0.1)',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                        onClick={() => navigate(`/paciente/${agenda.paciente?.id}`)}
                      >
                        <Activity size={18} /> CONTINUAR PRONTUÁRIO
                      </button>
                    )}
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 1rem', width: 'auto', borderRadius: '8px' }}
                      onClick={() => navigate(`/paciente/${agenda.paciente?.id}`)}
                    >
                      <User size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEÇÃO 2: ATENDIMENTOS FINALIZADOS */}
      {sessoesFinalizadas.length > 0 && (
        <div className="glass-card" style={{ opacity: 0.8 }}>
          <h3 className="flex-row" style={{ marginBottom: '1.5rem', color: 'hsl(var(--text-muted))' }}>
            <CheckCircle2 size={20} /> Finalizados Hoje
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {sessoesFinalizadas.map(agenda => (
              <div key={agenda.id} style={{
                padding: '1rem',
                background: 'hsla(var(--bg-main), 0.5)',
                border: '1px solid hsl(var(--border-light))',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h5 style={{ margin: 0, color: 'hsl(var(--text-muted))' }}>{agenda.paciente?.nome}</h5>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                    Concluído às {new Date(agenda.fim_atendimento || agenda.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.6rem', width: 'auto', fontSize: '0.75rem' }}
                  onClick={() => navigate(`/paciente/${agenda.paciente?.id}`)}
                >
                  Ver Ficha
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

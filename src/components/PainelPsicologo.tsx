import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Agendamento } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { User, Activity, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const PainelPsicologo: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarTodos, setMostrarTodos] = useState(false);

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
      // Opcional: navegar para o prontuário
      navigate(`/paciente/${pacienteId}`);
    } else {
      toast.error('Erro ao iniciar atendimento');
    }
  };

  const finalizarAtendimento = async (id: string) => {
    const { error } = await supabase
      .from('agendamentos')
      .update({ 
        status: 'Finalizado',
        fim_atendimento: new Date().toISOString()
      })
      .eq('id', id);

    if (!error) {
      toast.success('Atendimento finalizado!');
      carregarAgenda();
    } else {
      toast.error('Erro ao finalizar atendimento');
    }
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
          {(mostrarTodos ? agendamentos : agendamentos.slice(0, 2)).map(agenda => (
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
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(agenda.status === 'Aguardando' || agenda.status === 'Agendado') && (
                    <button
                      className="btn btn-primary pulse-btn"
                      style={{ 
                        padding: '0.6rem 1.5rem', 
                        width: 'auto', 
                        background: '#10b981', 
                        borderColor: '#10b981',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                      }}
                      onClick={() => aceitarAtendimento(agenda.id, agenda.paciente_id)}
                    >
                      <CheckCircle2 size={18} /> ACEITAR AGORA
                    </button>
                  )}

                  {agenda.status === 'Em Atendimento' && (
                    <button
                      className="btn btn-secondary"
                      style={{ 
                        padding: '0.6rem 1.5rem', 
                        width: 'auto', 
                        borderColor: 'hsl(var(--primary))',
                        color: 'hsl(var(--primary))',
                        background: 'hsla(var(--primary), 0.05)',
                        fontWeight: 700
                      }}
                      onClick={() => finalizarAtendimento(agenda.id)}
                    >
                      Finalizar Sessão
                    </button>
                  )}
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 1rem', width: 'auto' }}
                    onClick={() => navigate(`/paciente/${agenda.paciente?.id}`)}
                  >
                    <User size={16} style={{ marginRight: '0.3rem' }} /> Prontuário
                  </button>
                </div>
              </div>
            </div>
          ))}
          {agendamentos.length > 2 && (
            <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid hsl(var(--border-light))' }}>
              <button 
                onClick={() => setMostrarTodos(!mostrarTodos)}
                style={{ 
                  background: 'transparent',
                  border: 'none',
                  color: 'hsl(var(--primary))', 
                  fontWeight: 700, 
                  cursor: 'pointer',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  padding: '0.5rem 0'
                }}>
                {mostrarTodos ? (
                  <>Menos pacientes <ChevronUp size={16} /></>
                ) : (
                  <>Ver todos os pacientes do dia ({agendamentos.length}) <ChevronDown size={16} /></>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Agendamento, AgendamentoStatus } from '../lib/supabase';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '../contexts/AuthContext';

interface FilaDeEsperaProps {
  isCompact?: boolean;
}

export const FilaDeEspera: React.FC<FilaDeEsperaProps> = ({ isCompact = false }) => {
  const { profile } = useAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'fila' | 'historico'>('fila');

  useEffect(() => {
    carregarFila();
  }, []);

  const carregarFila = async () => {
    setLoading(true);

    // Pega o início e fim do dia atual
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from('agendamentos')
      .select('*, paciente:pacientes(nome), psicologo:profiles!psicologo_id(full_name)')
      .gte('data_hora', startOfDay.toISOString())
      .lte('data_hora', endOfDay.toISOString())
      .order('data_hora', { ascending: true });

    if (data) {
      setAgendamentos(data as unknown as Agendamento[]);
    }
    setLoading(false);
  };

  const atualizarStatus = async (id: string, novoStatus: AgendamentoStatus) => {
    const updateData: any = { status: novoStatus };

    if (novoStatus === 'Em Atendimento') {
      updateData.inicio_atendimento = new Date().toISOString();
    } else if (novoStatus === 'Finalizado') {
      updateData.fim_atendimento = new Date().toISOString();
    }

    const { error } = await supabase
      .from('agendamentos')
      .update(updateData)
      .eq('id', id);

    if (!error) {
      toast.success('Status atualizado!');
      carregarFila();
    } else {
      console.error(error);
      toast.error('Erro ao atualizar status');
    }
  };

  const calcularDuracao = (inicio?: string | null, fim?: string | null) => {
    if (!inicio || !fim) return null;
    const start = new Date(inicio).getTime();
    const end = new Date(fim).getTime();
    const diffMs = end - start;
    const diffMins = Math.round(diffMs / 60000);
    return diffMins > 0 ? `${diffMins} min` : '< 1 min';
  };

  const filaAtiva = agendamentos.filter(a => ['Agendado', 'Aguardando', 'Em Atendimento'].includes(a.status));
  const historicoHoje = agendamentos.filter(a => ['Finalizado', 'Faltou'].includes(a.status));

  if (loading) return <div>Carregando fila...</div>;

  return (
    <div className="glass-card" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
      {!isCompact ? (
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid hsl(var(--border-light))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="flex-row" style={{ margin: 0, color: 'hsl(var(--primary))', fontSize: '1.1rem' }}>
            <Clock size={20} /> Controle Diário
          </h3>

          <div style={{
            display: 'flex',
            background: 'hsla(var(--primary), 0.05)',
            padding: '2px',
            borderRadius: '10px',
            border: '1px solid hsla(var(--primary), 0.1)'
          }}>
            <button
              onClick={() => setActiveTab('fila')}
              style={{
                background: activeTab === 'fila' ? 'hsl(var(--primary))' : 'transparent',
                color: activeTab === 'fila' ? 'white' : 'hsl(var(--text-muted))',
                border: 'none', padding: '0.4rem 0.9rem', borderRadius: '8px', cursor: 'pointer',
                fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.2s',
                boxShadow: activeTab === 'fila' ? '0 2px 4px hsla(var(--primary), 0.3)' : 'none'
              }}
            >
              Fila Ativa ({filaAtiva.length})
            </button>
            <button
              onClick={() => setActiveTab('historico')}
              style={{
                background: activeTab === 'historico' ? 'hsl(var(--primary))' : 'transparent',
                color: activeTab === 'historico' ? 'white' : 'hsl(var(--text-muted))',
                border: 'none', padding: '0.4rem 0.9rem', borderRadius: '8px', cursor: 'pointer',
                fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.2s',
                boxShadow: activeTab === 'historico' ? '0 2px 4px hsla(var(--primary), 0.3)' : 'none'
              }}
            >
              Finalizados ({historicoHoje.length})
            </button>
          </div>
        </div>
      ) : (
        <h3 className="flex-row" style={{ padding: '1.5rem 1.5rem 0 1.5rem', marginBottom: '1rem', color: 'hsl(var(--primary))' }}>
          <Clock size={20} /> Fila de Hoje na Recepção
        </h3>
      )}

      <div style={{ padding: isCompact ? 0 : '1.5rem', maxHeight: isCompact ? 'none' : '500px', overflowY: isCompact ? 'visible' : 'auto' }}>
        {(isCompact ? agendamentos : (activeTab === 'fila' ? filaAtiva : historicoHoje)).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <p className="text-muted text-sm">
              {isCompact ? 'Nenhum agendamento para hoje.' : (activeTab === 'fila' ? 'Ninguém aguardando no momento.' : 'Nenhum atendimento finalizado hoje.')}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(isCompact ? agendamentos : (activeTab === 'fila' ? filaAtiva : historicoHoje)).map(agenda => (
              <div key={agenda.id} style={{
                padding: '1rem',
                border: '1px solid hsl(var(--border-light))',
                borderRadius: '12px',
                background: agenda.status === 'Em Atendimento' ? 'hsla(var(--primary), 0.05)' : 'transparent',
                borderColor: agenda.status === 'Em Atendimento' ? 'hsl(var(--primary))' : 'hsl(var(--border-light))',
                transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>{agenda.paciente?.nome || 'Desconhecido'}</h4>
                      {agenda.status === 'Em Atendimento' && (
                        <span style={{
                          fontSize: '0.65rem', animation: 'pulse 1.5s infinite',
                          background: 'hsl(var(--primary))', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px'
                        }}>AO VIVO</span>
                      )}
                    </div>
                    <p className="text-muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', fontWeight: 500 }}>
                      {new Date(agenda.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • Dr(a). {agenda.psicologo?.full_name || '...'}
                    </p>

                    {!isCompact && activeTab === 'historico' && agenda.status === 'Finalizado' && (
                      <div style={{
                        marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem',
                        fontSize: '0.7rem', fontWeight: 700
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'hsl(var(--text-muted))' }}>
                          Início: {agenda.inicio_atendimento ? new Date(agenda.inicio_atendimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'hsl(var(--text-muted))' }}>
                          Fim: {agenda.fim_atendimento ? new Date(agenda.fim_atendimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'hsl(var(--primary))' }}>
                          Total: <strong>{calcularDuracao(agenda.inicio_atendimento, agenda.fim_atendimento)}</strong>
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ marginLeft: '1rem' }}>
                    <select
                      value={agenda.status}
                      onChange={(e) => atualizarStatus(agenda.id, e.target.value as AgendamentoStatus)}
                      className="form-input"
                      style={{
                        padding: '0.3rem 0.6rem',
                        height: 'auto',
                        width: 'auto',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        borderRadius: '8px',
                        background: agenda.status === 'Aguardando' ? 'hsla(var(--primary), 0.1)' : undefined,
                        color: agenda.status === 'Aguardando' ? 'hsl(var(--primary))' : 'inherit',
                      }}
                    >
                      <option value="Agendado">Agendado</option>
                      <option value="Aguardando">Chamado</option>
                      {(profile?.role === 'admin' || profile?.role === 'psicologo') && (
                        <>
                          <option value="Em Atendimento">Em Atendimento</option>
                          <option value="Finalizado">Finalizado</option>
                        </>
                      )}
                      <option value="Faltou">Faltou</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

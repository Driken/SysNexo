import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Agendamento, AgendamentoStatus } from '../lib/supabase';
import { Clock } from 'lucide-react';

export const FilaDeEspera: React.FC = () => {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

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
    const { error } = await supabase
      .from('agendamentos')
      .update({ status: novoStatus })
      .eq('id', id);
    
    if (!error) {
      carregarFila();
    } else {
      console.error(error);
      alert('Erro ao atualizar status');
    }
  };

  if (loading) return <div>Carregando fila...</div>;

  return (
    <div className="glass-card" style={{ flex: 1 }}>
      <h3 className="flex-row" style={{ marginBottom: '1rem', color: 'hsl(var(--primary))' }}>
        <Clock size={20} /> Fila de Hoje na Recepção
      </h3>
      
      {agendamentos.length === 0 ? (
        <p className="text-muted text-sm">Nenhum agendamento para hoje.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {agendamentos.map(agenda => (
            <div key={agenda.id} style={{ padding: '1rem', border: '1px solid hsl(var(--border-light))', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{agenda.paciente?.nome || 'Desconhecido'}</h4>
                  <p className="text-muted text-sm" style={{ margin: 0 }}>
                    {new Date(agenda.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • Dr(a). {agenda.psicologo?.full_name || '...'}
                  </p>
                </div>
                <div>
                  <select 
                    value={agenda.status} 
                    onChange={(e) => atualizarStatus(agenda.id, e.target.value as AgendamentoStatus)}
                    className="form-input"
                    style={{ 
                      padding: '0.2rem 0.5rem', 
                      height: 'auto', 
                      width: 'auto',
                      fontWeight: 600,
                      background: agenda.status === 'Aguardando' ? 'hsla(var(--primary), 0.1)' : undefined,
                      color: agenda.status === 'Aguardando' ? 'hsl(var(--primary))' : undefined,
                    }}
                  >
                    <option value="Agendado">Agendado</option>
                    <option value="Aguardando">Aguardando na Recepção</option>
                    <option value="Em Atendimento">Em Atendimento</option>
                    <option value="Finalizado">Finalizado</option>
                    <option value="Faltou">Faltou</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

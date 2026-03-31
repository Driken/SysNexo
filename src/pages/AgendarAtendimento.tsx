import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Profile, Paciente, AgendamentoStatus } from '../lib/supabase';
import { UserCheck, ChevronLeft, CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

export const AgendarAtendimento: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [psicologos, setPsicologos] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [selectedPaciente, setSelectedPaciente] = useState('');
  const [selectedPsicologo, setSelectedPsicologo] = useState('');
  const [status, setStatus] = useState<AgendamentoStatus>('Aguardando');
  const [dataHora, setDataHora] = useState(new Date().toISOString().slice(0, 16));

  useEffect(() => {
    carregarDados();

    // Se vier do cadastro com um paciente específico
    const state = location.state as { pacienteId?: string };
    if (state?.pacienteId) {
      setSelectedPaciente(state.pacienteId);
    }
  }, [location]);

  const carregarDados = async () => {
    setFetching(true);
    const { data: pData } = await supabase.from('pacientes').select('*').order('nome');
    const { data: uData } = await supabase.from('profiles').select('*').in('role', ['psicologo', 'admin']).eq('is_active', true);

    if (pData) setPacientes(pData);
    if (uData) setPsicologos(uData);
    setFetching(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaciente || !selectedPsicologo) {
      toast.error('Selecione o paciente e o profissional.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('agendamentos').insert([{
      paciente_id: selectedPaciente,
      psicologo_id: selectedPsicologo,
      data_hora: new Date(dataHora).toISOString(),
      status: status
    }]);

    if (!error) {
      toast.success('Agendamento realizado com sucesso!');

      // Criar Notificação de Encaminhamento
      const p = pacientes.find(x => x.id === selectedPaciente);
      const psic = psicologos.find(x => x.id === selectedPsicologo);

      if (p && psic) {
        // Pega primeiro e segundo nome do paciente
        const nomesPac = p.nome.split(' ');
        const nomeResumidoPac = nomesPac.slice(0, 2).join(' ');

        const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
        const idsToNotify = new Set([selectedPsicologo, ...(admins?.map(a => a.id) || [])]);

        const notifs = Array.from(idsToNotify).map(perfilId => ({
          perfil_id: perfilId,
          titulo: 'Paciente Encaminhado',
          mensagem: `Paciente: ${nomeResumidoPac} encaminhado para ${psic.full_name}`,
          tipo: 'atendimento',
          lido: false,
          link: '/sala-espera'
        }));

        await supabase.from('notificacoes').insert(notifs);
      }

      navigate('/atendimentos');
    } else {
      toast.error('Erro ao agendar.');
    }
    setLoading(false);
  };

  return (
    <div className="layout-body" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className="dashboard-header border-bottom">
        <button
          onClick={() => navigate('/atendimentos')}
          className="btn-text"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', padding: 0 }}
        >
          <ChevronLeft size={20} /> Voltar para Gestão de Atendimentos
        </button>
        <h1 className="dashboard-title flex-row"><CalendarPlus size={28} /> Novo Agendamento</h1>
        <p className="text-muted">Preencha os dados abaixo para registrar um novo atendimento ou colocar alguém na fila.</p>
      </div>

      <div className="glass-card" style={{ maxWidth: '800px', margin: '2rem auto', padding: '2.5rem' }}>
        {fetching ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>Carregando dados...</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-col" style={{ gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="input-group">
                <label className="input-label">Paciente</label>
                <select
                  className="form-input"
                  value={selectedPaciente}
                  onChange={e => setSelectedPaciente(e.target.value)}
                  required
                >
                  <option value="">Selecione o paciente...</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Profissional (Psicólogo)</label>
                <select
                  className="form-input"
                  value={selectedPsicologo}
                  onChange={e => setSelectedPsicologo(e.target.value)}
                  required
                >
                  <option value="">Selecione o profissional...</option>
                  {psicologos.map(psic => (
                    <option key={psic.id} value={psic.id}>{psic.full_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="input-group">
                <label className="input-label">Data e Hora</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={dataHora}
                  onChange={e => setDataHora(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label">Status Inicial</label>
                <select
                  className="form-input"
                  value={status}
                  onChange={e => setStatus(e.target.value as AgendamentoStatus)}
                >
                  <option value="Aguardando">Encaminhar (Aguardando Psicólogo)</option>
                  <option value="Agendado">Somente Agendado</option>
                  {(profile?.role === 'admin' || profile?.role === 'psicologo') && (
                    <option value="Em Atendimento">Em Atendimento Direto</option>
                  )}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem', borderTop: '1px solid hsl(var(--border-light))', paddingTop: '2rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/atendimentos')} style={{ width: 'auto' }}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: 'auto', padding: '0.75rem 2rem' }}>
                <UserCheck size={20} /> {loading ? 'Agendando...' : 'Confirmar e Abrir Fila'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, Paciente, AgendamentoStatus } from '../lib/supabase';
import { Calendar, UserCheck, X } from 'lucide-react';
import { toast } from 'sonner';

interface AgendamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialPacienteId?: string;
}

export const AgendamentoModal: React.FC<AgendamentoModalProps> = ({ isOpen, onClose, onSuccess, initialPacienteId }) => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [psicologos, setPsicologos] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedPaciente, setSelectedPaciente] = useState('');
  const [selectedPsicologo, setSelectedPsicologo] = useState('');
  const [status, setStatus] = useState<AgendamentoStatus>('Aguardando');
  const [dataHora, setDataHora] = useState(new Date().toISOString().slice(0, 16));

  useEffect(() => {
    if (isOpen) {
      carregarDados();
      if (initialPacienteId) {
        setSelectedPaciente(initialPacienteId);
      }
    }
  }, [isOpen, initialPacienteId]);

  const carregarDados = async () => {
    const { data: pData } = await supabase.from('pacientes').select('*').order('nome');
    const { data: uData } = await supabase.from('profiles').select('*').in('role', ['psicologo', 'admin']).eq('is_active', true);
    
    if (pData) setPacientes(pData);
    if (uData) setPsicologos(uData);
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
      onSuccess();
      onClose();
    } else {
      toast.error('Erro ao agendar.');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2 className="flex-row"><Calendar size={24} /> Novo Agendamento / Chamado</h2>
          <button className="btn-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-col" style={{ gap: '1.25rem', marginTop: '1.5rem' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                <option value="Aguardando">Chamado (Recepção)</option>
                <option value="Agendado">Somente Agendado</option>
                <option value="Em Atendimento">Em Atendimento</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ width: 'auto' }}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: 'auto' }}>
              <UserCheck size={18} /> {loading ? 'Agendando...' : 'Confirmar Agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

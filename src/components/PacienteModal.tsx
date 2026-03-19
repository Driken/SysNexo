import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import type { Paciente } from '../lib/supabase';
import { X } from 'lucide-react';

interface PacienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (paciente: Paciente) => void;
}

export const PacienteModal: React.FC<PacienteModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [cartaoSus, setCartaoSus] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Mask CPF
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    
    val = val.replace(/(\d{3})(\d)/, '$1.$2');
    val = val.replace(/(\d{3})(\d)/, '$1.$2');
    val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    
    setCpf(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase
        .from('pacientes')
        .insert([{
          nome,
          cpf,
          data_nascimento: dataNascimento,
          cartao_sus: cartaoSus ? cartaoSus : null
        }])
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          throw new Error('CPF ou Cartão SUS já cadastrado.');
        }
        throw error;
      }

      onSuccess(data as Paciente);
      
      // Limpa form
      setNome('');
      setCpf('');
      setDataNascimento('');
      setCartaoSus('');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao cadastrar paciente');
    } finally {
      setLoading(false);
    }
  };

  // Renderiza via Portal para escapar do Stacking Context (Bug de Z-Index do CSS)
  return createPortal(
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(4px)'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '500px', background: 'var(--bg-card)', color: 'hsl(var(--text-main))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>Novo Paciente</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} color="hsl(var(--text-muted))" />
          </button>
        </div>

        {errorMsg && <div className="alert-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="flex-col">
          <div className="input-group">
            <label className="input-label">Nome Completo *</label>
            <input className="form-input" required value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Maria da Silva" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">CPF *</label>
              <input className="form-input" required value={cpf} onChange={handleCpfChange} placeholder="000.000.000-00" />
            </div>
            
            <div className="input-group">
              <label className="input-label">Data de Nascimento *</label>
              <input className="form-input" type="date" required value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Cartão SUS (Opcional)</label>
            <input className="form-input" value={cartaoSus} onChange={e => setCartaoSus(e.target.value)} placeholder="Apenas números..." />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

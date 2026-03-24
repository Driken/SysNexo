import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { X, Save, DollarSign, ArrowUpRight, ArrowDownLeft, Calendar, Tag, CreditCard, User, Hash } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  transactionToEdit?: any;
}

export const TransactionModal: React.FC<Props> = ({
  isOpen, onClose, onSave, transactionToEdit
}) => {
  const { profile } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [pacientes, setPacientes] = useState<any[]>([]);

  // Form State
  const [tipo, setTipo] = useState<'receita' | 'despesa'>('receita');
  const [valor, setValor] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState<'pago' | 'pendente'>('pago');
  const [categoria, setCategoria] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [pacienteId, setPacienteId] = useState('');
  const [parcelas, setParcelas] = useState('1');

  useEffect(() => {
    if (isOpen) {
      carregarPacientes();
      if (transactionToEdit) {
        setTipo(transactionToEdit.tipo);
        setValor(transactionToEdit.valor.toString());
        setData(transactionToEdit.data);
        setDescricao(transactionToEdit.descricao);
        setStatus(transactionToEdit.status);
        setCategoria(transactionToEdit.categoria || '');
        setFormaPagamento(transactionToEdit.forma_pagamento || '');
        setPacienteId(transactionToEdit.paciente_id || '');
        setParcelas(transactionToEdit.parcelas?.toString() || '1');
      } else {
        setTipo('receita');
        setValor('');
        setData(new Date().toISOString().split('T')[0]);
        setDescricao('');
        setStatus('pago');
        setCategoria('');
        setFormaPagamento('');
        setPacienteId('');
        setParcelas('1');
      }
    }
  }, [isOpen, transactionToEdit]);

  const carregarPacientes = async () => {
    const { data } = await supabase.from('pacientes').select('id, nome').order('nome');
    if (data) setPacientes(data);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        tipo,
        valor: parseFloat(valor),
        data,
        descricao,
        status,
        categoria,
        forma_pagamento: formaPagamento,
        paciente_id: tipo === 'receita' ? (pacienteId || null) : null,
        psicologo_id: profile?.id,
        parcelas: parseInt(parcelas) || 1
      };

      if (transactionToEdit) {
        const { error } = await supabase
          .from('transacoes')
          .update(payload)
          .eq('id', transactionToEdit.id);
        if (error) throw error;
        toast.success('Transação atualizada!');
      } else {
        const { error } = await supabase
          .from('transacoes')
          .insert(payload);
        if (error) throw error;
        toast.success('Transação registrada com sucesso!');
      }

      onSave();
      onClose();
    } catch (error: any) {
      toast.error('Erro ao salvar transação: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const categoriasReceita = ['Sessão Individual', 'Sessão Grupo', 'Avaliação Psicológica', 'Laudo/Relatório', 'Palestra', 'Outros'];
  const categoriasDespesa = ['Aluguel', 'Energia/Água', 'Internet', 'Marketing', 'Limpeza', 'Impostos', 'Salários', 'Pró-labore', 'Software/SaaS', 'Outros'];

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem'
      }}
    >
      <div
        ref={modalRef}
        className="glass-card"
        style={{
          width: '100%', maxWidth: '600px', padding: 0, overflow: 'hidden',
          animation: 'fadeInScale 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <style>{`
          @keyframes fadeInScale {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        `}</style>

        {/* Header */}
        <div style={{
          padding: '1.5rem', background: tipo === 'receita' ? 'hsla(142, 70%, 45%, 0.1)' : 'hsla(0, 84%, 60%, 0.1)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--border-light))'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: tipo === 'receita' ? 'hsl(142, 70%, 45%)' : 'hsl(0, 84%, 60%)', color: 'white'
            }}>
              {tipo === 'receita' ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{transactionToEdit ? 'Editar registro' : 'Nova transação'}</h2>
              <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', margin: 0 }}>
                {tipo === 'receita' ? 'Entrada de valores / Faturamento' : 'Saída de valores / Despesas'}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
          {/* Toggle Tipo */}
          {!transactionToEdit && (
            <div style={{ display: 'flex', background: 'hsl(var(--bg-main))', padding: '4px', borderRadius: '12px', marginBottom: '2rem' }}>
              <button
                type="button"
                onClick={() => setTipo('receita')}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700,
                  transition: 'all 0.2s', background: tipo === 'receita' ? 'white' : 'transparent',
                  color: tipo === 'receita' ? 'hsl(142, 70%, 45%)' : 'hsl(var(--text-muted))',
                  boxShadow: tipo === 'receita' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                RECEITA
              </button>
              <button
                type="button"
                onClick={() => setTipo('despesa')}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700,
                  transition: 'all 0.2s', background: tipo === 'despesa' ? 'white' : 'transparent',
                  color: tipo === 'despesa' ? 'hsl(0, 84%, 60%)' : 'hsl(var(--text-muted))',
                  boxShadow: tipo === 'despesa' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                DESPESA
              </button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Valor */}
            <div className="input-group" style={{ gridColumn: 'span 1' }}>
              <label className="input-label flex-row"><DollarSign size={14} /> Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                className="form-input"
                placeholder="0,00"
                value={valor}
                onChange={e => setValor(e.target.value)}
                style={{ fontSize: '1.25rem', fontWeight: 700 }}
              />
            </div>

            {/* Data */}
            <div className="input-group" style={{ gridColumn: 'span 1' }}>
              <label className="input-label flex-row"><Calendar size={14} /> Data</label>
              <input
                type="date"
                required
                className="form-input"
                value={data}
                onChange={e => setData(e.target.value)}
              />
            </div>

            {/* Descrição */}
            <div className="input-group" style={{ gridColumn: 'span 2' }}>
              <label className="input-label">Descrição</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Ex: Sessão Quinzenal, Aluguel da Sala..."
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
              />
            </div>

            {/* Categoria */}
            <div className="input-group">
              <label className="input-label flex-row"><Tag size={14} /> Categoria</label>
              <select
                className="form-input"
                required
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
              >
                <option value="">Selecione...</option>
                {(tipo === 'receita' ? categoriasReceita : categoriasDespesa).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Forma Pagamento */}
            <div className="input-group">
              <label className="input-label flex-row"><CreditCard size={14} /> Forma de Pagamento</label>
              <select
                className="form-input"
                required
                value={formaPagamento}
                onChange={e => setFormaPagamento(e.target.value)}
              >
                <option value="">Selecione...</option>
                {['Pix', 'Dinheiro', 'Cartão Crédito', 'Cartão Débito', 'Transferência', 'Boleto'].map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Paciente (Só se for Receita) */}
            {tipo === 'receita' && (
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label className="input-label flex-row"><User size={14} /> Paciente Vinculado (Opcional)</label>
                <select
                  className="form-input"
                  value={pacienteId}
                  onChange={e => setPacienteId(e.target.value)}
                >
                  <option value="">Nenhum</option>
                  {pacientes.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Status e Parcelas */}
            <div className="input-group">
              <label className="input-label">Status</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setStatus('pago')}
                  style={{
                    flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid hsl(var(--border-light))', cursor: 'pointer',
                    background: status === 'pago' ? 'hsla(142, 70%, 45%, 0.1)' : 'transparent',
                    color: status === 'pago' ? 'hsl(142, 70%, 45%)' : 'hsl(var(--text-muted))',
                    borderColor: status === 'pago' ? 'hsl(142, 70%, 45%)' : 'hsl(var(--border-light))',
                    fontWeight: 600, fontSize: '0.8rem'
                  }}
                >
                  Efetivado
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('pendente')}
                  style={{
                    flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid hsl(var(--border-light))', cursor: 'pointer',
                    background: status === 'pendente' ? 'hsla(38, 92%, 50%, 0.1)' : 'transparent',
                    color: status === 'pendente' ? 'hsl(38, 92%, 50%)' : 'hsl(var(--text-muted))',
                    borderColor: status === 'pendente' ? 'hsl(38, 92%, 50%)' : 'hsl(var(--border-light))',
                    fontWeight: 600, fontSize: '0.8rem'
                  }}
                >
                  Pendente
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label flex-row"><Hash size={14} /> Parcelas</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={parcelas}
                onChange={e => setParcelas(e.target.value)}
              />
            </div>
          </div>

          <div style={{ borderTop: '1px solid hsl(var(--border-light))', marginTop: '2rem', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ width: 'auto' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: 'auto', minWidth: '180px' }}>
              {loading ? 'Processando...' : <span className="flex-row"><Save size={18} /> Salvar Transação</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Calendar, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Paciente } from '../lib/supabase';
import { PacienteModal } from './PacienteModal';
import { useNavigate } from 'react-router-dom';

export const BuscaUniversal: React.FC = () => {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // Debounce lógico para evitar muitas requisições
  useEffect(() => {
    const fn = setTimeout(() => {
      buscarPacientes(query);
    }, 400);

    return () => clearTimeout(fn);
  }, [query]);

  const buscarPacientes = async (q: string) => {
    if (!q.trim() || q.length < 3) {
      setResultados([]);
      return;
    }
    
    setLoading(true);

    // Simplificação de busca universal usando o operador or do Supabase
    // Vamos buscar se bate em nome, cpf ou cartao sus
    const unmasked = q.replace(/\D/g, ''); 
    
    const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .or(`nome.ilike.%${q}%,cpf.ilike.%${unmasked}%,cartao_sus.ilike.%${unmasked}%`)
        .limit(10);

    if (error) {
      console.error('Erro na busca', error);
    } else {
      setResultados(data as Paciente[]);
    }
    
    setLoading(false);
  };

  const handlePacienteCriado = (paciente: Paciente) => {
    // Adiciona paciente criado ao resultado atual para feedback imediato
    setResultados((prev) => [paciente, ...prev]);
  };

  return (
    <div className="glass-card" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
          <Search size={24} color="hsl(var(--primary))" /> 
          Busca Inteligente de Pacientes
        </h3>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
          <UserPlus size={18} /> Novo Paciente
        </button>
      </div>

      <div className="input-group" style={{ position: 'relative' }}>
        <input 
          className="form-input" 
          style={{ paddingLeft: '3rem', fontSize: '1.1rem' }}
          placeholder="Busque por Nome, CPF ou Cartão SUS..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Search size={22} color="hsl(var(--text-muted))" style={{ position: 'absolute', left: '1rem', top: '1.4rem' }} />
      </div>

      {loading && <div style={{ color: 'hsl(var(--text-muted))', marginTop: '1rem' }}>Pesquisando no banco de dados...</div>}

      {/* Lista de Resultados */}
      {resultados.length > 0 && (
        <div style={{ 
          marginTop: '1.5rem', 
          background: 'var(--bg-card)', 
          borderRadius: 'var(--radius-md)', 
          border: '1px solid hsl(var(--border-light))',
          overflow: 'hidden'
        }}>
          {resultados.map((pac, idx) => (
            <div key={pac.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '1.2rem',
              borderBottom: idx === resultados.length - 1 ? 'none' : '1px solid hsl(var(--border-light))',
              transition: 'background 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--bg-main))')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div>
                <h4 style={{ margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {pac.nome}
                </h4>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                  <span style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <CreditCard size={14} /> CPF: {pac.cpf}
                  </span>
                  <span style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <Calendar size={14} /> Nasc: {new Date(pac.data_nascimento).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ width: 'auto', padding: '0.5rem 1rem' }}
                onClick={() => navigate(`/paciente/${pac.id}`)}
              >
                Selecionar ➔
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal Reutilizavel */}
      <PacienteModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handlePacienteCriado} 
      />
    </div>
  );
};

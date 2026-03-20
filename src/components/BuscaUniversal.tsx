import React, { useState, useEffect, useRef } from 'react';
import { Search, UserPlus, Calendar, CreditCard, Filter, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Paciente } from '../lib/supabase';
import { PacienteModal } from './PacienteModal';
import { useNavigate } from 'react-router-dom';

export const BuscaUniversal: React.FC = () => {
  const [query, setQuery] = useState('');
  const [filtros, setFiltros] = useState<string[]>(['Nome', 'CPF', 'SUS', 'Nascimento']);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [resultados, setResultados] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const filterRef = useRef<HTMLDivElement>(null);

  // Fecha filtro ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  // Debounce lógico para evitar muitas requisições
  useEffect(() => {
    const fn = setTimeout(() => {
      buscarPacientes(query);
    }, 400);

    return () => clearTimeout(fn);
  }, [query, filtros]);

  const buscarPacientes = async (q: string) => {
    if (!q.trim() || q.length < 3) {
      setResultados([]);
      return;
    }
    
    setLoading(true);

    // Simplificação de busca universal usando o operador or do Supabase
    // Vamos buscar se bate em nome, cpf ou cartao sus
    const unmasked = q.replace(/\D/g, ''); 
    
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const dateMatch = q.match(dateRegex);
    let yyyy, mm, dd;
    
    if (dateMatch) {
      [, dd, mm, yyyy] = dateMatch;
    }

    let queryBuilder = supabase.from('pacientes').select('*');

    const orFilters: string[] = [];
    
    if (filtros.includes('Nome')) {
      orFilters.push(`nome.ilike.%${q}%`);
    }
    
    if (filtros.includes('CPF')) {
      orFilters.push(`cpf.ilike.%${unmasked}%`);
      orFilters.push(`cpf.ilike.%${q}%`);
    }

    if (filtros.includes('SUS')) {
      orFilters.push(`cartao_sus.ilike.%${unmasked}%`);
      orFilters.push(`cartao_sus.ilike.%${q}%`);
    }

    if (filtros.includes('Nascimento') && dateMatch) {
      orFilters.push(`data_nascimento.eq.${yyyy}-${mm}-${dd}`);
    }

    if (orFilters.length > 0) {
      queryBuilder = queryBuilder.or(orFilters.join(','));
    } else {
      setResultados([]);
      setLoading(false);
      return;
    }

    const { data, error } = await queryBuilder.limit(10);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const toggleFiltro = (f: string) => {
    setFiltros(prev => 
      prev.includes(f) 
        ? prev.filter(item => item !== f) 
        : [...prev, f]
    );
  };


  return (
    <div className="glass-card" style={{ marginBottom: '2rem', position: 'relative', zIndex: isFilterOpen ? 10 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
            <Search size={24} color="hsl(var(--primary))" /> 
            Busca de Pacientes
          </h3>
          
          <div style={{ position: 'relative' }} ref={filterRef}>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={!isFilterOpen && filtros.length > 0 ? 'pulse-filter' : ''}
              style={{ 
                width: '40px', 
                height: '40px',
                padding: 0,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isFilterOpen ? 'hsl(var(--primary))' : 'hsla(var(--primary), 0.1)',
                border: isFilterOpen ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                outline: 'none',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isFilterOpen) e.currentTarget.style.background = 'hsla(var(--primary), 0.2)';
              }}
              onMouseLeave={(e) => {
                if (!isFilterOpen) e.currentTarget.style.background = 'hsla(var(--primary), 0.1)';
              }}
              title="Filtrar por nome, CPF, SUS ou Nascimento"
            >
              <Filter size={20} color={isFilterOpen ? '#fff' : 'hsl(var(--primary))'} />
            </button>

            {isFilterOpen && (
              <div 
                style={{
                  position: 'absolute',
                  top: '120%',
                  left: 0,
                  width: '240px',
                  background: 'hsl(var(--bg-card))',
                  border: '1px solid hsl(var(--border-light))',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-xl)',
                  padding: '1.25rem',
                  zIndex: 1000,
                  animation: 'fadeIn 0.2s ease-out'
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', color: 'hsl(var(--text-main))' }}>
                  Filtrar busca por:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {['Nome', 'CPF', 'SUS', 'Nascimento'].map(f => (
                    <label key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'hsla(var(--primary), 0.1)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <div 
                        onClick={() => toggleFiltro(f)}
                        style={{ 
                          width: '20px', height: '20px', borderRadius: '4px', 
                          border: '2px solid', 
                          borderColor: filtros.includes(f) ? 'hsl(var(--primary))' : 'hsl(var(--border-light))',
                          background: filtros.includes(f) ? 'hsl(var(--primary))' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.1s'
                        }}
                      >
                        {filtros.includes(f) && <Check size={14} color="white" />}
                      </div>
                      <span style={{ fontSize: '0.95rem', fontWeight: 500, color: filtros.includes(f) ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))' }}>{f === 'SUS' ? 'Cartão SUS' : f}</span>
                      <input type="checkbox" style={{ display: 'none' }} checked={filtros.includes(f)} onChange={() => toggleFiltro(f)} />
                    </label>
                  ))}
                </div>
                
                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid hsl(var(--border-light))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    onClick={() => setFiltros(['Nome', 'CPF', 'SUS', 'Nascimento'])}
                    style={{ background: 'transparent', border: 'none', color: 'hsl(var(--primary))', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Marcar Todos
                  </button>
                  <button 
                    onClick={() => setIsFilterOpen(false)}
                    style={{ background: 'transparent', border: 'none', color: 'hsl(var(--text-muted))', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ width: 'auto', padding: '0.5rem 1rem' }}>
          <UserPlus size={18} /> Novo Paciente
        </button>
      </div>

      <div className="input-group" style={{ position: 'relative' }}>
          <input 
            className="form-input" 
            style={{ paddingLeft: '3rem', fontSize: '1.1rem' }}
            placeholder="Digite o nome, CPF ou cartão SUS para buscar..." 
            value={query}
            onChange={handleInputChange}
          />
          <Search size={22} color="hsl(var(--text-muted))" style={{ position: 'absolute', left: '1rem', top: '1.1rem' }} />
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

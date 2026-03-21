import React, { useState, useEffect, useRef } from 'react';
import { Search, UserPlus, Filter, UserCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Paciente } from '../lib/supabase';
import { PacienteModal } from './PacienteModal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SearchResult extends Paciente {
  ultimoAtendimento?: {
    data: string;
    psicologo_nome: string;
  }
}

interface BuscaUniversalProps {
  isGlobal?: boolean;
  onClose?: () => void;
}

export const BuscaUniversal: React.FC<BuscaUniversalProps> = ({ isGlobal, onClose }) => {
  const { profile, viewMode } = useAuth();
  const [query, setQuery] = useState('');
  const [filtros, setFiltros] = useState<string[]>(['Nome', 'CPF', 'SUS', 'Nascimento']);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [resultados, setResultados] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const filterRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Foco automático ao abrir em modo global
  useEffect(() => {
    if (isGlobal) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isGlobal]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFilterOpen(false);
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isFilterOpen]);

  useEffect(() => {
    const fn = setTimeout(() => {
      buscarPacientes(query);
    }, 400);
    return () => clearTimeout(fn);
  }, [query, filtros]);

  const buscarPacientes = async (q: string) => {
    if (!q.trim() || q.length < 2) {
      setResultados([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unmasked = q.replace(/\D/g, '');
    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const dateMatch = q.match(dateRegex);
    let yyyy, mm, dd;
    if (dateMatch) [, dd, mm, yyyy] = dateMatch;

    let queryBuilder = supabase.from('pacientes').select('*');
    const orFilters: string[] = [];
    if (filtros.includes('Nome')) {
      const terms = q.split(' ').filter(t => t.length > 0);
      const normalizedQuery = q.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      // Busca pela frase exata (com e sem acento)
      orFilters.push(`nome.ilike.%${q}%`);
      if (normalizedQuery !== q) {
        orFilters.push(`nome.ilike.%${normalizedQuery}%`);
      }

      // Busca combinada: Se o usuário digitar "João Silva", busca por João%Silva
      if (terms.length > 1) {
        const combined = terms.join('%');
        orFilters.push(`nome.ilike.%${combined}%`);

        const normCombined = terms.map(t => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "")).join('%');
        if (normCombined !== combined) {
          orFilters.push(`nome.ilike.%${normCombined}%`);
        }
      }
    }

    if (filtros.includes('CPF') && unmasked) {
      orFilters.push(`cpf.ilike.%${unmasked}%`);
    }

    if (filtros.includes('SUS') && unmasked) {
      orFilters.push(`cartao_sus.ilike.%${unmasked}%`);
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

    const { data: pData, error } = await queryBuilder.limit(10);

    if (!error && pData) {
      const results: SearchResult[] = pData;

      if (viewMode === 'recepcao' || viewMode === 'admin') {
        const enhancedResults = await Promise.all(results.map(async (p) => {
          const { data: dataAtend } = await supabase
            .from('atendimentos')
            .select('data_atendimento, psicologo:profiles!psicologo_id(full_name)')
            .eq('paciente_id', p.id)
            .order('data_atendimento', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (dataAtend) {
            return {
              ...p,
              ultimoAtendimento: {
                data: (dataAtend as any).data_atendimento,
                psicologo_nome: (dataAtend as any).psicologo?.full_name || 'Profissional não identificado'
              }
            };
          }
          return p;
        }));
        setResultados(enhancedResults);
      } else if (viewMode === 'psicologo') {
        const { data: myAttendances } = await supabase
          .from('atendimentos')
          .select('paciente_id')
          .eq('psicologo_id', profile?.id);

        const myPatientIds = new Set(myAttendances?.map(a => a.paciente_id) || []);
        setResultados(results.filter(p => myPatientIds.has(p.id)));
      } else {
        setResultados(results);
      }
    }

    setLoading(false);
  };

  const toggleFiltro = (f: string) => {
    setFiltros(prev =>
      prev.includes(f) ? prev.filter(item => item !== f) : [...prev, f]
    );
  };

  const handlePacienteCriado = (paciente: Paciente) => {
    setResultados((prev) => [paciente, ...prev]);
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (onClose) onClose();
  };

  return (
    <div className="glass-card" style={{
      marginBottom: isGlobal ? 0 : '2rem',
      position: 'relative',
      zIndex: isFilterOpen ? 10 : 1,
      boxShadow: isGlobal ? '0 0 0 1px hsla(var(--primary), 0.2), var(--shadow-2xl)' : 'var(--shadow-md)',
      padding: isGlobal ? '1.5rem' : '1.5rem 2rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
            <Search size={24} color="hsl(var(--primary))" />
            {viewMode === 'recepcao' ? 'Triagem e Histórico' : 'Busca de Prontuários'}
          </h3>

          <div style={{ position: 'relative' }} ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={!isFilterOpen && filtros.length > 0 ? 'pulse-filter' : ''}
              style={{
                width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isFilterOpen ? 'hsl(var(--primary))' : 'hsla(var(--primary), 0.1)',
                border: 'none', cursor: 'pointer', transition: 'all 0.3s'
              }}
            >
              <Filter size={18} color={isFilterOpen ? '#fff' : 'hsl(var(--primary))'} />
            </button>

            {isFilterOpen && (
              <div
                style={{
                  position: 'absolute', top: '120%', left: 0, width: '220px', background: 'hsl(var(--bg-card))',
                  border: '1px solid hsl(var(--border-light))', borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-xl)', padding: '1rem', zIndex: 2000, animation: 'fadeIn 0.2s'
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Filtros Ativos</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {['Nome', 'CPF', 'SUS', 'Nascimento'].map(f => (
                    <label key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input type="checkbox" checked={filtros.includes(f)} onChange={() => toggleFiltro(f)} />
                      {f === 'SUS' ? 'Cartão SUS' : f}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {(viewMode === 'recepcao' || viewMode === 'admin') && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
            <UserPlus size={18} /> Novo Paciente
          </button>
        )}
      </div>

      <div className="input-group" style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          className="form-input"
          style={{
            paddingLeft: '3rem',
            fontSize: '1.1rem',
            background: 'hsla(var(--bg-main), 0.5)',
            border: isGlobal ? '1px solid hsl(var(--primary))' : '1px solid hsl(var(--border-light))'
          }}
          placeholder={viewMode === 'recepcao' ? "Verificar histórico (Nome, CPF ou SUS)..." : "Buscar paciente encaminhado / histórico..."}
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <Search size={22} color="hsl(var(--text-muted))" style={{ position: 'absolute', left: '1rem', top: '0.85rem' }} />
      </div>

      {loading && <div style={{ color: 'hsl(var(--text-muted))', marginTop: '1rem', fontSize: '0.9rem' }}>Consultando base de dados...</div>}

      {resultados.length > 0 && (
        <div style={{ marginTop: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--border-light))', overflow: 'hidden' }}>
          {resultados.map((pac, idx) => (
            <div key={pac.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem',
              borderBottom: idx === resultados.length - 1 ? 'none' : '1px solid hsl(var(--border-light))',
              background: 'hsl(var(--bg-card))'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                  <h4 style={{ margin: 0 }}>{pac.nome}</h4>
                  <span style={{ fontSize: '0.7rem', background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>ID {pac.id.substring(0, 5)}</span>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                  <span>CPF: {pac.cpf}</span>
                  <span>SUS: {pac.cartao_sus || 'N/I'}</span>
                </div>

                {pac.ultimoAtendimento && (
                  <div style={{ marginTop: '0.75rem', padding: '0.6rem', background: 'hsla(var(--secondary), 0.05)', borderRadius: '8px', borderLeft: '3px solid hsl(var(--secondary))', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <UserCircle size={14} color="hsl(var(--secondary))" />
                    <span style={{ fontSize: '0.8rem' }}>
                      Última consulta em <strong>{new Date(pac.ultimoAtendimento.data).toLocaleDateString()}</strong> com <strong>{pac.ultimoAtendimento.psicologo_nome}</strong>
                    </span>
                  </div>
                )}
              </div>

              <button
                className="btn btn-secondary"
                style={{ width: 'auto', padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}
                onClick={() => handleNavigate(`/paciente/${pac.id}`)}
              >
                {viewMode === 'recepcao' ? 'Ver Histórico' : 'Abrir Prontuário'}
              </button>
            </div>
          ))}
        </div>
      )}

      {query.length >= 3 && !loading && resultados.length === 0 && (
        <div style={{ marginTop: '1.5rem', textAlign: 'center', padding: '2rem', background: 'hsla(var(--bg-main), 0.3)', borderRadius: '12px', border: '1px dashed hsl(var(--border-light))' }}>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Nenhum paciente {viewMode === 'psicologo' ? 'encaminhado' : ''} encontrado com este critério.</p>
        </div>
      )}

      <PacienteModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={handlePacienteCriado} />
    </div>
  );
};

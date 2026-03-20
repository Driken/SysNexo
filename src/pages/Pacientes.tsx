import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Paciente } from '../lib/supabase';
import { Search, UserPlus, Calendar, CreditCard, ChevronRight, Contact2, Filter, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PacienteModal } from '../components/PacienteModal';

export const Pacientes: React.FC = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>(['Nome', 'CPF', 'SUS']);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    carregarPacientes();
  }, []);

  const carregarPacientes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .order('nome', { ascending: true });

    if (!error && data) {
      setPacientes(data);
    }
    setLoading(false);
  };

  const toggleFilter = (f: string) => {
    setActiveFilters(prev => 
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    );
  };

  const filteredPacientes = pacientes.filter(p => {
    if (!searchTerm.trim()) return true;
    
    const term = searchTerm.toLowerCase();
    const matchNome = activeFilters.includes('Nome') && p.nome.toLowerCase().includes(term);
    const matchCpf = activeFilters.includes('CPF') && p.cpf.replace(/\D/g, '').includes(term.replace(/\D/g, ''));
    const matchSus = activeFilters.includes('SUS') && p.cartao_sus?.includes(term);

    return matchNome || matchCpf || matchSus;
  });

  return (
    <div className="layout-body" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className="dashboard-header border-bottom" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="dashboard-title flex-row"><Contact2 size={28} /> Meus Pacientes</h1>
          <p className="text-muted">Lista completa de pacientes cadastrados na clínica.</p>
        </div>
        
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ width: 'auto' }}>
          <UserPlus size={18} /> Novo Paciente
        </button>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="input-group" style={{ position: 'relative', margin: 0 }}>
            <input 
              className="form-input" 
              style={{ paddingLeft: '3rem', fontSize: '1.05rem' }}
              placeholder="Digite sua busca aqui..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={22} color="hsl(var(--text-muted))" style={{ position: 'absolute', left: '1rem', top: '0.85rem' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-muted))', marginRight: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={14} /> Buscar por:
            </span>
            {['Nome', 'CPF', 'SUS'].map(f => (
              <button
                key={f}
                onClick={() => toggleFilter(f)}
                style={{
                  padding: '0.4rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: '1px solid',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease',
                  background: activeFilters.includes(f) ? 'hsla(var(--primary), 0.1)' : 'transparent',
                  borderColor: activeFilters.includes(f) ? 'hsl(var(--primary))' : 'hsl(var(--border-light))',
                  color: activeFilters.includes(f) ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))',
                }}
              >
                {activeFilters.includes(f) && <Check size={12} />}
                {f}
              </button>
            ))}
          </div>

        </div>
      </div>

      {loading ? (
        <div className="text-center" style={{ padding: '3rem' }}>
          <div className="pulse-filter" style={{ width: '40px', height: '40px', margin: '0 auto 1rem auto', borderRadius: '50%', background: 'hsl(var(--primary))' }}></div>
          <p className="text-muted">Carregando lista de pacientes...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredPacientes.map(p => (
            <div 
              key={p.id} 
              className="glass-card" 
              style={{ 
                padding: '1.5rem', 
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '1px solid hsl(var(--border-light))',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={() => navigate(`/paciente/${p.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'hsl(var(--primary))';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'hsl(var(--border-light))';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <div className="avatar-sm" style={{ 
                  width: '50px', height: '50px', fontSize: '1.2rem', 
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))' 
                }}>
                  {p.nome[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'hsl(var(--text-main))', fontSize: '1.05rem', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {p.nome}
                    <ChevronRight size={16} color="hsl(var(--text-muted))" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CreditCard size={14} /> <strong>CPF:</strong> {p.cpf}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={14} /> <strong>Nasc:</strong> {new Date(p.data_nascimento).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredPacientes.length === 0 && (
            <div className="glass-card text-center" style={{ gridColumn: '1 / -1', padding: '4rem 2rem', borderStyle: 'dashed' }}>
              <Search size={48} color="hsl(var(--border-light))" style={{ marginBottom: '1rem' }} />
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '1.1rem', fontWeight: 500 }}>
                Nenhum paciente encontrado com esses critérios.
              </p>
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Tente ajustar os filtros ou os termos da busca.
              </p>
            </div>
          )}
        </div>
      )}

      <PacienteModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={carregarPacientes} 
      />
    </div>
  );
};


import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Paciente } from '../lib/supabase';
import { Search, UserPlus, Calendar, CreditCard, ChevronRight, Contact2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PacienteModal } from '../components/PacienteModal';

export const Pacientes: React.FC = () => {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredPacientes = pacientes.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cpf.includes(searchTerm) ||
    p.cartao_sus?.includes(searchTerm)
  );

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

      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div className="input-group" style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <input 
            className="form-input" 
            style={{ paddingLeft: '3rem' }}
            placeholder="Filtrar por nome, CPF ou SUS..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={22} color="hsl(var(--text-muted))" style={{ position: 'absolute', left: '1rem', top: '1.1rem' }} />
        </div>

        {loading ? (
          <div className="text-center" style={{ padding: '3rem' }}>Carregando lista de pacientes...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {filteredPacientes.map(p => (
              <div 
                key={p.id} 
                className="nav-item" 
                style={{ 
                  flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem', 
                  padding: '1.25rem', background: 'hsl(var(--bg-main))', 
                  border: '1px solid hsl(var(--border-light))', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/paciente/${p.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 600, color: 'hsl(var(--text-main))', fontSize: '1.1rem' }}>{p.nome}</div>
                  <ChevronRight size={18} color="hsl(var(--text-muted))" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                  <span className="flex-row" style={{ gap: '0.5rem' }}><CreditCard size={14} /> CPF: {p.cpf}</span>
                  <span className="flex-row" style={{ gap: '0.5rem' }}><Calendar size={14} /> Nasc: {new Date(p.data_nascimento).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            ))}
            {filteredPacientes.length === 0 && (
              <div className="text-center" style={{ gridColumn: '1 / -1', padding: '3rem' }}>
                <p className="text-muted">Nenhum paciente encontrado com esses termos.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <PacienteModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={carregarPacientes} 
      />
    </div>
  );
};

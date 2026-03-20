import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Paciente, Atendimento } from '../lib/supabase';
import { FileText, Search, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PacienteComUltimoAtendimento extends Paciente {
  ultimo_atendimento?: Atendimento | null;
}

export const Prontuarios: React.FC = () => {
  const [pacientes, setPacientes] = useState<PacienteComUltimoAtendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    carregarProntuarios();
  }, []);

  const carregarProntuarios = async () => {
    setLoading(true);
    
    // Lista todos os pacientes
    const { data: pData, error: pError } = await supabase
      .from('pacientes')
      .select('*')
      .order('nome', { ascending: true });

    if (!pError && pData) {
      // Busca o último atendimento de cada paciente
      const { data: aData, error: aError } = await supabase
        .from('atendimentos')
        .select('*')
        .order('data_atendimento', { ascending: false });

      if (!aError && aData) {
        const prontuariosMap = pData.map(p => {
          const ultimo = aData.find(a => a.paciente_id === p.id);
          return { ...p, ultimo_atendimento: ultimo || null };
        });
        setPacientes(prontuariosMap);
      } else {
        setPacientes(pData.map(p => ({ ...p, ultimo_atendimento: null })));
      }
    }
    setLoading(false);
  };

  const filtered = pacientes.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cpf.includes(searchTerm)
  );

  return (
    <div className="layout-body" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className="dashboard-header border-bottom">
        <h1 className="dashboard-title flex-row"><FileText size={28} /> Prontuários e Evoluções</h1>
        <p className="text-muted">Acesso rápido às evoluções e históricos clínicos dos seus pacientes.</p>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', marginTop: '2rem' }}>
        <div className="input-group" style={{ position: 'relative', marginBottom: '1.5rem' }}>
          <input 
            className="form-input" 
            style={{ paddingLeft: '3rem' }}
            placeholder="Buscar por nome ou CPF do paciente..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={22} color="hsl(var(--text-muted))" style={{ position: 'absolute', left: '1rem', top: '1.1rem' }} />
        </div>

        {loading ? (
          <div className="text-center" style={{ padding: '3rem' }}>Carregando dados dos prontuários...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map(p => (
              <div 
                key={p.id} 
                className="nav-item" 
                style={{ 
                  justifyContent: 'space-between', padding: '1.5rem', 
                  background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border-light))', 
                  borderRadius: 'var(--radius-md)', cursor: 'pointer' 
                }}
                onClick={() => navigate(`/paciente/${p.id}`)}
              >
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <div className="avatar-sm" style={{ width: '48px', height: '48px', fontSize: '1.25rem' }}>
                    {p.nome[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'hsl(var(--text-main))', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{p.nome}</div>
                    <div className="flex-row" style={{ gap: '1rem', fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>
                      <span className="flex-row" style={{ gap: '0.4rem' }}><Clock size={14}/> Última Evolução: {p.ultimo_atendimento ? new Date(p.ultimo_atendimento.data_atendimento).toLocaleDateString('pt-BR') : 'Sem registros'}</span>
                      {p.ultimo_atendimento && (
                        <span style={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>ID: {p.ultimo_atendimento.id.substring(0, 8)}...</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex-row" style={{ color: 'hsl(var(--primary))', fontWeight: 600, fontSize: '0.9rem', gap: '0.5rem' }}>
                  Acessar Ficha <ChevronRight size={18} />
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center" style={{ padding: '3rem' }}>O paciente buscado não foi encontrado.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

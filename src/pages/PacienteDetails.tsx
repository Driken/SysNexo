import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Paciente, Atendimento } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, User, Plus, FileText, AlertCircle, Clock, ChevronUp } from 'lucide-react';
import { useAutoSave } from '../hooks/useAutoSave';

interface SessaoProps extends Atendimento {
  psicologo: { full_name: string } | null;
}

export const PacienteDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [sessoes, setSessoes] = useState<SessaoProps[]>([]);
  const [loading, setLoading] = useState(true);

  // States do Prontuario (Apenas para Psicologos)
  const [novaNota, setNovaNota, clearNota] = useAutoSave(`draft_nota_${id}`, '', 1000);
  const [novoPlano, setNovoPlano, clearPlano] = useAutoSave(`draft_plano_${id}`, '', 1000);
  const [salvando, setSalvando] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [dataSelecao, setDataSelecao] = useState(new Date().toISOString().substring(0, 10));
  const [horaSelecao, setHoraSelecao] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));


  useEffect(() => {
    if (id) carregarDados();
  }, [id]);

  const carregarDados = async () => {
    setLoading(true);
    
    // Busca info base
    const { data: pData } = await supabase.from('pacientes').select('*').eq('id', id).single();
    if (pData) setPaciente(pData);

    // Busca timeline de atendimentos 
    // Como a Recepcao tem select = authenticated, ela ve as linhas mas sem as notas,
    // que pelo RLS poderia restringir (Pela Policy nao restringe select no banco, entao filtraremos pelo frontend/Role tambem pra MVP Seguro, Porem LGPD exige bloqueio por Row/Col Level na database ou View).
    // Aqui usaremos o filtro logico por Role da sessao atual baseada no PRD:
    const { data: sData, error } = await supabase
      .from('atendimentos')
      .select('*, psicologo:profiles!psicologo_id(full_name)')
      .eq('paciente_id', id)
      .order('data_atendimento', { ascending: false });

    if (!error && sData) {
      setSessoes(sData as SessaoProps[]);
    }
    
    setLoading(false);
  };

  const isClinico = profile?.role === 'admin' || profile?.role === 'psicologo';
  const ultimaVisita = sessoes.length > 0 ? sessoes[0] : null;

  const salvarSessao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setSalvando(true);
    const { data, error } = await supabase.from('atendimentos').insert([{
      paciente_id: id,
      psicologo_id: profile.id,
      data_atendimento: new Date(`${dataSelecao}T${horaSelecao}`).toISOString(),
      notas_evolucao: novaNota,
      plano_proximo_encontro: novoPlano
    }]).select('*, psicologo:profiles!psicologo_id(full_name)').single();
    
    if (!error && data) {
      setSessoes([data as SessaoProps, ...sessoes]);
      clearNota();
      clearPlano();
    } else {
      console.error(error);
      alert("Erro ao salvar o prontuário. Reveja suas permissões.");
    }
    setSalvando(false);
  };

  if (loading) return <div className="page-content text-center">Carregando dados...</div>;
  if (!paciente) return <div className="page-content text-center">Paciente não encontrado. <button onClick={() => navigate(-1)} className="btn btn-secondary mt-4">Voltar</button></div>;

  return (
    <div>
      <div className="dashboard-header border-bottom">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')} style={{ padding: '0.5rem', width: 'auto' }} title="Voltar ao Painel">
            <ArrowLeft size={18} />
          </button>
          <h1 className="dashboard-title flex-row" style={{ margin: 0 }}><User size={28} /> {paciente.nome}</h1>
        </div>
            <p className="flex-row text-muted" style={{ gap: '1.5rem', marginTop: '0.5rem' }}>
              <span>CPF: {paciente.cpf}</span>
              <span>Nasc: {new Date(paciente.data_nascimento).toLocaleDateString()}</span>
              {paciente.cartao_sus && <span>SUS: {paciente.cartao_sus}</span>}
              <span style={{ 
                background: sessoes.length > 0 ? 'hsla(var(--primary), 0.1)' : '#fef3c7', 
                color: sessoes.length > 0 ? 'hsl(var(--primary))' : '#b45309', 
                padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600}}>
                {sessoes.length > 0 ? 'Paciente Recorrente' : 'Paciente Novo'}
              </span>
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isClinico ? '2fr 1fr' : '1fr', gap: '2rem', marginTop: '2rem' }}>
            
            {/* Coluna Principal: Linha do Tempo e Historico */}
            <div className="flex-col">
              
              {!isClinico && ultimaVisita && (
                <div className="glass-card" style={{ marginBottom: '1.5rem', background: 'hsl(var(--bg-main))' }}>
                  <h3 style={{ marginBottom: '0.5rem', color: 'hsl(var(--primary))' }}>Resumo da Última Visita</h3>
                  <p style={{ margin: 0, fontWeight: 500 }}>
                    Data: {new Date(ultimaVisita.data_atendimento).toLocaleDateString('pt-BR')} às {new Date(ultimaVisita.data_atendimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p style={{ color: 'hsl(var(--text-muted))', margin: '0.2rem 0 0 0' }}>
                    Profissional responsável: Dr(a). {ultimaVisita.psicologo?.full_name || 'Desconhecido'}
                  </p>
                </div>
              )}

              {isClinico && ultimaVisita && (
                <div className="glass-card" style={{ background: 'hsl(var(--primary-light))', borderLeft: '4px solid hsl(var(--primary))', padding: '1.5rem', marginBottom: '1.5rem' }}>
                  <h3 className="flex-row" style={{ color: 'hsl(var(--primary))', marginBottom: '1rem' }}>
                    <AlertCircle size={20}/> Resumo da Última Sessão ({new Date(ultimaVisita.data_atendimento).toLocaleDateString('pt-BR')})
                  </h3>
                  
                  {ultimaVisita.notas_evolucao && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong style={{ color: 'hsl(var(--text-main))' }}>O que foi abordado:</strong>
                      <p style={{ color: 'hsl(var(--text-muted))', marginTop: '0.2rem' }}>{ultimaVisita.notas_evolucao}</p>
                    </div>
                  )}

                  {ultimaVisita.plano_proximo_encontro && (
                    <div>
                      <strong style={{ color: 'hsl(var(--text-main))' }}>Plano / Indicações para hoje:</strong>
                      <p style={{ color: 'hsl(var(--text-muted))', marginTop: '0.2rem', fontWeight: 500 }}>"{ultimaVisita.plano_proximo_encontro}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Formulário de Prontuário Novo (Só Psicologo) */}
              {isClinico && (
                <div className="glass-card" style={{ marginTop: '1rem', padding: 0, overflow: 'hidden' }}>
                  <button 
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'hsla(var(--primary), 0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    style={{ 
                      width: '100%', padding: '1.5rem', background: 'transparent', border: 'none', 
                      cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      textAlign: 'left', transition: 'background 0.2s'
                    }}
                  >
                    <h3 className="flex-row" style={{ margin: 0 }}><FileText size={20} /> Registrar Novo Atendimento</h3>
                    {isFormOpen ? <ChevronUp size={20} color="hsl(var(--text-muted))" /> : <Plus size={20} color="hsl(var(--primary))" />}
                  </button>
                  
                  {isFormOpen && (
                    <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', animation: 'fadeIn 0.2s ease-out' }}>
                      <form onSubmit={async (e) => {
                        await salvarSessao(e);
                        setIsFormOpen(false);
                      }} className="flex-col" style={{ gap: '1.5rem' }}>
                        
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-end' }}>
                          <div className="input-group" style={{ width: '120px', flexShrink: 0 }}>
                            <label className="input-label">Horário</label>
                            <input 
                              type="time" 
                              className="form-input" 
                              value={horaSelecao}
                              onChange={e => setHoraSelecao(e.target.value)}
                              required
                              style={{ padding: '0.6rem 0.8rem', textAlign: 'center' }}
                            />
                          </div>
                          
                          <div className="input-group" style={{ width: '160px', flexShrink: 0 }}>
                            <label className="input-label">Data</label>
                            <input 
                              type="date" 
                              className="form-input" 
                              value={dataSelecao}
                              onChange={e => setDataSelecao(e.target.value)}
                              required
                              style={{ padding: '0.6rem 0.8rem' }}
                            />
                          </div>
                        </div>

                        <div className="input-group">
                          <label className="input-label">Plano para Próximo Encontro</label>
                          <input 
                            className="form-input" 
                            placeholder="Defina o foco clínico para a próxima sessão..."
                            value={novoPlano}
                            onChange={e => setNovoPlano(e.target.value)}
                            style={{ padding: '0.6rem 0.8rem' }}
                          />
                        </div>

                        <div className="input-group">
                          <label className="input-label">Evolução da Sessão (Sigilo Clínico)</label>
                          <textarea 
                            className="form-input" 
                            rows={6} 
                            required
                            placeholder="Descreva o andamento do processo terapêutico, observações e evolução de hoje..."
                            value={novaNota}
                            onChange={e => setNovaNota(e.target.value)}
                            style={{ fontSize: '0.95rem', resize: 'vertical' }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                          <button type="submit" className="btn btn-primary" disabled={salvando} style={{ width: 'auto', padding: '0.75rem 2rem' }}>
                            <Plus size={18} /> {salvando ? 'Salvando...' : 'Finalizar e Salvar'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Sidebar Direita: Histórico de Consultas (Sprint 3 e 4) */}
            <div className="flex-col">
              <div className="glass-card">
                <h3 className="flex-row" style={{ marginBottom: '1.5rem' }}><Clock size={20}/> Linha do Tempo</h3>
                
                {sessoes.length === 0 ? (
                  <p className="text-muted text-sm">Nenhum atendimento registrado ainda.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Agrupamento por Data */}
                    {Object.entries(
                      sessoes.reduce((acc: any, sessao) => {
                        const date = new Date(sessao.data_atendimento).toLocaleDateString('pt-BR');
                        if (!acc[date]) acc[date] = [];
                        acc[date].push(sessao);
                        return acc;
                      }, {})
                    ).map(([date, items]: [string, any]) => (
                      <div key={date}>
                        <div style={{ 
                          fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--primary))', 
                          textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem',
                          background: 'hsla(var(--primary), 0.05)', padding: '0.2rem 0.5rem', 
                          borderRadius: '4px', width: 'fit-content'
                        }}>
                          {date}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                          {items.map((sessao: any) => (
                            <div key={sessao.id} style={{ borderLeft: '2px solid hsl(var(--border-light))', paddingLeft: '1rem', position: 'relative' }}>
                              <div style={{ position: 'absolute', left: '-5px', top: '5px', width: '8px', height: '8px', borderRadius: '50%', background: 'hsl(var(--primary))' }} />
                              
                              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                às {new Date(sessao.data_atendimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                                Psicólogo: {sessao.psicologo?.full_name || 'Desconhecido'}
                              </div>
                              
                              {isClinico && sessao.notas_evolucao && (
                                <div style={{ background: 'hsl(var(--bg-main))', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                                  <strong>Notas:</strong> {sessao.notas_evolucao}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

      </div>
    </div>
  );
};

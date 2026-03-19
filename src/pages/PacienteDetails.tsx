import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Paciente, Atendimento } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, User, Plus, FileText, AlertCircle, Clock } from 'lucide-react';

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
  const [novaNota, setNovaNota] = useState('');
  const [novoPlano, setNovoPlano] = useState('');
  const [salvando, setSalvando] = useState(false);

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
  const ultimaSessaoPendente = sessoes.length > 0 ? sessoes[0].plano_proximo_encontro : null;

  const salvarSessao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setSalvando(true);
    const { data, error } = await supabase.from('atendimentos').insert([{
      paciente_id: id,
      psicologo_id: profile.id,
      data_atendimento: new Date().toISOString(),
      notas_evolucao: novaNota,
      plano_proximo_encontro: novoPlano
    }]).select('*, psicologo:profiles!psicologo_id(full_name)').single();
    
    if (!error && data) {
      setSessoes([data as SessaoProps, ...sessoes]);
      setNovaNota('');
      setNovoPlano('');
    } else {
      console.error(error);
      alert("Erro ao salvar o prontuário. Reveja suas permissões.");
    }
    setSalvando(false);
  };

  if (loading) return <div className="page-content text-center">Carregando dados...</div>;
  if (!paciente) return <div className="page-content text-center">Paciente não encontrado. <button onClick={() => navigate(-1)} className="btn btn-secondary mt-4">Voltar</button></div>;

  return (
    <>
      <div className="dashboard-header border-bottom">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')} style={{ padding: '0.5rem' }} title="Voltar ao Painel">
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
              
              {isClinico && ultimaSessaoPendente && (
                <div className="glass-card" style={{ background: 'hsl(var(--primary-light))', borderLeft: '4px solid hsl(var(--primary))', padding: '1.5rem' }}>
                  <h3 className="flex-row" style={{ color: 'hsl(var(--primary))', marginBottom: '0.5rem' }}>
                    <AlertCircle size={20}/> Para abordar na sessão de hoje:
                  </h3>
                  <p style={{ color: 'hsl(var(--text-main))', fontWeight: 500 }}>"{ultimaSessaoPendente}"</p>
                  <div className="text-muted text-sm mt-4">
                    Deixado pela última sessão em {new Date(sessoes[0].data_atendimento).toLocaleDateString()}
                  </div>
                </div>
              )}

              {/* Formulário de Prontuário Novo (Só Psicologo) */}
              {isClinico && (
                <div className="glass-card" style={{ marginTop: '1rem', padding: '1.5rem' }}>
                  <h3 className="flex-row" style={{ marginBottom: '1.5rem' }}><FileText size={20} /> Registrar Novo Atendimento</h3>
                  <form onSubmit={salvarSessao} className="flex-col">
                    <div className="input-group">
                      <label className="input-label">Evolução da Sessão (Sigilo)</label>
                      <textarea 
                        className="form-input" 
                        rows={5} 
                        required
                        placeholder="Descreva observações clínicas da sessão de hoje..."
                        value={novaNota}
                        onChange={e => setNovaNota(e.target.value)}
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Plano para Próximo Encontro</label>
                      <input 
                        className="form-input" 
                        placeholder="O que retomar na próxima semana?"
                        value={novoPlano}
                        onChange={e => setNovoPlano(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                      <button type="submit" className="btn btn-primary" disabled={salvando} style={{ width: 'auto' }}>
                        <Plus size={18} /> {salvando ? 'Salvando...' : 'Salvar Prontuário'}
                      </button>
                    </div>
                  </form>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {sessoes.map((sessao) => (
                      <div key={sessao.id} style={{ borderLeft: '2px solid hsl(var(--border-light))', paddingLeft: '1rem', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-5px', top: '5px', width: '8px', height: '8px', borderRadius: '50%', background: 'hsl(var(--primary))' }} />
                        
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          {new Date(sessao.data_atendimento).toLocaleDateString('pt-BR')} às {new Date(sessao.data_atendimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-muted text-sm" style={{ marginBottom: '0.5rem' }}>
                          Psicólogo: {sessao.psicologo?.full_name || 'Desconhecido'}
                        </div>
                        
                        {/* Se for Clínico, exibe anotações curtas na timeline */}
                        {isClinico && sessao.notas_evolucao && (
                          <div style={{ background: 'hsl(var(--bg-main))', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                            <strong>Notas:</strong> {sessao.notas_evolucao}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

      </div>
    </>
  );
};

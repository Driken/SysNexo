import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Wallet,
  PieChart,
  History,
  Trash2,
  Edit2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { TransactionModal } from '../components/TransactionModal';

export const Financeiro: React.FC = () => {
  const { } = useAuth();
  const [transacoes, setTransacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [meta, setMeta] = useState(() => Number(localStorage.getItem('meta_financeira')) || 5000);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [metricas, setMetricas] = useState({
    saldo: 0,
    aReceber: 0,
    aPagar: 0,
    mensal: 0,
    distribuicao: { sessoes: 0, avaliacoes: 0, outros: 0 },
    progressoMeta: 0
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transacoes')
        .select(`
          *,
          pacientes (nome),
          fornecedores (nome)
        `)
        .order('data', { ascending: false });

      if (error) throw error;

      if (data) {
        setTransacoes(data);
        
        // Calcular Métricas
        const hoje = new Date();
        
        const calcMetricas = data.reduce((acc, t) => {
          const valor = Number(t.valor);
          const dataTransacao = new Date(t.data);
          const mesAtual = dataTransacao.getMonth() === hoje.getMonth() && dataTransacao.getFullYear() === hoje.getFullYear();
          
          if (t.tipo === 'receita') {
            if (t.status === 'pago') acc.saldo += valor;
            else if (t.status === 'pendente') acc.aReceber += valor;
            
            if (mesAtual && t.status === 'pago') {
              acc.mensal += valor;
              
              // Distribuição (apenas para o que foi pago no mês ou geral? Vamos fazer do mês atual)
              if (t.categoria?.includes('Sessão')) acc.distribuicao.sessoes += valor;
              else if (t.categoria?.includes('Avaliação') || t.categoria?.includes('Laudo')) acc.distribuicao.avaliacoes += valor;
              else acc.distribuicao.outros += valor;
            }
          } else {
            if (t.status === 'pago') acc.saldo -= valor;
            else if (t.status === 'pendente') acc.aPagar += valor;
          }
          
          return acc;
        }, { saldo: 0, aReceber: 0, aPagar: 0, mensal: 0, distribuicao: { sessoes: 0, avaliacoes: 0, outros: 0 }, progressoMeta: 0 });

        // Calcular porcentagens e progresso da meta
        calcMetricas.progressoMeta = Math.min(Math.round((calcMetricas.mensal / meta) * 100), 100);
        
        // Transformar valores em porcentagens para a UI
        const distTotal = (calcMetricas.distribuicao.sessoes + calcMetricas.distribuicao.avaliacoes + calcMetricas.distribuicao.outros);
        
        if (distTotal > 0) {
          calcMetricas.distribuicao.sessoes = Math.round((calcMetricas.distribuicao.sessoes / distTotal) * 100);
          calcMetricas.distribuicao.avaliacoes = Math.round((calcMetricas.distribuicao.avaliacoes / distTotal) * 100);
          calcMetricas.distribuicao.outros = 100 - calcMetricas.distribuicao.sessoes - calcMetricas.distribuicao.avaliacoes;
        } else {
          calcMetricas.distribuicao.sessoes = 0;
          calcMetricas.distribuicao.avaliacoes = 0;
          calcMetricas.distribuicao.outros = 0;
        }

        setMetricas(calcMetricas);
      }
    } catch (error: any) {
      toast.error('Erro ao carregar dados financeiros: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (transacoes.length === 0) {
      toast.error('Não há dados para exportar.');
      return;
    }
    const headers = ['Data', 'Tipo', 'Descricao', 'Valor', 'Status', 'Categoria', 'Forma Pagamento', 'Vinculo (Paciente/Fornecedor)'];
    const csvRows = transacoes.map(t => [
      t.data,
      t.tipo,
      `"${t.descricao}"`,
      t.valor,
      t.status,
      t.categoria || '',
      t.forma_pagamento || '',
      `"${t.pacientes?.nome || t.fornecedores?.nome || ''}"`
    ]);

    const csvContent = [headers, ...csvRows].map(e => e.join(',')).join('\n');
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Relatório CSV gerado com sucesso!');
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Deseja realmente excluir esta transação?')) {
      const { error } = await supabase.from('transacoes').delete().eq('id', id);
      if (error) toast.error('Erro ao excluir: ' + error.message);
      else {
        toast.success('Transação excluída!');
        carregarDados();
      }
    }
  };

  useEffect(() => {
    localStorage.setItem('meta_financeira', meta.toString());
    carregarDados();
  }, [meta]);

  useEffect(() => {
    const handleUpdate = () => carregarDados();
    window.addEventListener('finance_updated', handleUpdate);
    return () => window.removeEventListener('finance_updated', handleUpdate);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago': return { bg: 'hsla(142, 70%, 45%, 0.1)', text: 'hsl(142, 70%, 35%)' };
      case 'pendente': return { bg: 'hsla(38, 92%, 50%, 0.1)', text: 'hsl(38, 92%, 40%)' };
      case 'cancelado': return { bg: 'hsla(0, 84%, 60%, 0.1)', text: 'hsl(0, 84%, 50%)' };
      default: return { bg: 'gray', text: 'white' };
    }
  };

  return (
    <div className="layout-body" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className="dashboard-header border-bottom" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="dashboard-title flex-row">
            <DollarSign size={28} /> Financeiro
          </h1>
          <p className="text-muted">Gerencie receitas, despesas e o fluxo de caixa da clínica.</p>
        </div>

        <div className="flex-row" style={{ gap: '0.75rem' }}>
          <button className="btn" onClick={handleExport} style={{ background: 'hsla(var(--primary), 0.1)', color: 'hsl(var(--primary))' }}>
            <Download size={18} /> Exportar
          </button>
          <button className="btn btn-primary" onClick={() => { setSelectedTransaction(null); setIsModalOpen(true); }}>
            <Plus size={18} /> Nova Transação
          </button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05 }}>
            <Wallet size={80} />
          </div>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: '0.5rem' }}>Saldo em Caixa</p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: metricas.saldo >= 0 ? 'hsl(var(--text-main))' : 'hsl(0, 84%, 60%)' }}>
            {formatCurrency(metricas.saldo)}
          </h2>
          <div style={{ marginTop: '1rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'hsl(142, 70%, 45%)' }}>
            <TrendingUp size={14} /> <span>+12% em relação ao mês anterior</span>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid hsl(38, 92%, 50%)' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: '0.5rem' }}>A Receber</p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'hsl(38, 92%, 40%)' }}>
            {formatCurrency(metricas.aReceber)}
          </h2>
          <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Total pendente de pacientes</p>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid hsl(0, 84%, 60%)' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: '0.5rem' }}>A Pagar</p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'hsl(0, 84%, 50%)' }}>
            {formatCurrency(metricas.aPagar)}
          </h2>
          <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Contas e despesas fixas</p>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', background: 'hsla(var(--primary), 0.05)', borderColor: 'hsla(var(--primary), 0.2)' }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'hsl(var(--primary))', marginBottom: '0.5rem' }}>Faturamento Mensal (Líquido)</p>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'hsl(var(--primary))' }}>
            {formatCurrency(metricas.mensal)}
          </h2>
          <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Referente a {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="flex-row" style={{ alignItems: 'flex-start', gap: '2rem' }}>
        {/* Lista de Transações */}
        <div style={{ flex: 1 }}>
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid hsl(var(--border-light))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => setFiltroTipo('todos')}
                  style={{ 
                    padding: '0.4rem 1rem', borderRadius: '8px', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    background: filtroTipo === 'todos' ? 'hsl(var(--primary))' : 'transparent',
                    color: filtroTipo === 'todos' ? 'white' : 'hsl(var(--text-muted))'
                  }}
                >
                  Todos
                </button>
                <button 
                  onClick={() => setFiltroTipo('receita')}
                  style={{ 
                    padding: '0.4rem 1rem', borderRadius: '8px', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    background: filtroTipo === 'receita' ? 'hsla(142, 70%, 45%, 0.1)' : 'transparent',
                    color: filtroTipo === 'receita' ? 'hsl(142, 70%, 35%)' : 'hsl(var(--text-muted))'
                  }}
                >
                  Receitas
                </button>
                <button 
                  onClick={() => setFiltroTipo('despesa')}
                  style={{ 
                    padding: '0.4rem 1rem', borderRadius: '8px', border: 'none', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    background: filtroTipo === 'despesa' ? 'hsla(0, 84%, 60%, 0.1)' : 'transparent',
                    color: filtroTipo === 'despesa' ? 'hsl(0, 84%, 50%)' : 'hsl(var(--text-muted))'
                  }}
                >
                  Despesas
                </button>
              </div>

              <div style={{ position: 'relative', minWidth: '240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                <input 
                  type="text" 
                  placeholder="Buscar descrição ou categoria..." 
                  className="form-input" 
                  style={{ paddingLeft: '2.5rem', height: '36px', fontSize: '0.85rem' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'hsla(var(--primary), 0.02)', textAlign: 'left', fontSize: '0.75rem', color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>
                  <th style={{ padding: '1rem' }}>Data</th>
                  <th style={{ padding: '1rem' }}>Descrição</th>
                  <th style={{ padding: '1rem' }}>Categoria</th>
                  <th style={{ padding: '1rem' }}>Valor</th>
                  <th style={{ padding: '1rem' }}>Status</th>
                  <th style={{ padding: '1rem' }}></th>
                </tr>
              </thead>
              <tbody>
                {transacoes
                  .filter(t => {
                    const matchTipo = filtroTipo === 'todos' || t.tipo === filtroTipo;
                    const matchSearch = t.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                       t.categoria?.toLowerCase().includes(searchTerm.toLowerCase());
                    return matchTipo && matchSearch;
                  })
                  .map((t) => {
                    const statusStyle = getStatusColor(t.status);
                    return (
                      <tr key={t.id} 
                        onClick={() => { setSelectedTransaction(t); setIsModalOpen(true); }}
                        style={{ borderBottom: '1px solid hsl(var(--border-light))', transition: 'all 0.2s', cursor: 'pointer' }}
                        className="list-item-hover"
                      >
                        <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600 }}>{new Date(t.data).toLocaleDateString('pt-BR')}</span>
                            <span style={{ fontSize: '0.7rem', color: 'hsl(var(--text-muted))' }}>{new Date(t.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ 
                              width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: t.tipo === 'receita' ? 'hsla(142, 70%, 45%, 0.1)' : 'hsla(0, 84%, 60%, 0.1)',
                              color: t.tipo === 'receita' ? 'hsl(142, 70%, 45%)' : 'hsl(0, 84%, 60%)'
                            }}>
                              {t.tipo === 'receita' ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.descricao}</div>
                              {t.pacientes?.nome && (
                                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--primary))', fontWeight: 500 }}>Paciente: {t.pacientes.nome}</div>
                              )}
                              {t.fornecedores?.nome && (
                                <div style={{ fontSize: '0.75rem', color: 'hsl(0, 84%, 50%)', fontWeight: 500 }}>Fornecedor: {t.fornecedores.nome}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'hsla(var(--primary), 0.05)', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
                            {t.categoria || 'Geral'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', fontWeight: 700, fontSize: '0.95rem', color: t.tipo === 'receita' ? 'hsl(142, 70%, 35%)' : 'hsl(0, 84%, 50%)' }}>
                          {t.tipo === 'receita' ? '+' : '-'} {formatCurrency(t.valor)}
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', padding: '0.25rem 0.6rem', borderRadius: '12px',
                            backgroundColor: statusStyle.bg, color: statusStyle.text
                          }}>
                            {t.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedTransaction(t); setIsModalOpen(true); }}
                              style={{ background: 'transparent', border: 'none', color: 'hsl(var(--text-muted))', cursor: 'pointer' }}
                              title="Editar"
                            >
                               <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={(e) => handleDelete(e, t.id)}
                              style={{ background: 'transparent', border: 'none', color: 'hsl(0, 84%, 60%)', cursor: 'pointer' }}
                              title="Excluir"
                            >
                               <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                {transacoes.length === 0 && !loading && (
                   <tr>
                     <td colSpan={6} style={{ textAlign: 'center', padding: '4rem 1rem', color: 'hsl(var(--text-muted))' }}>
                        <History size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                        <p>Nenhuma transação encontrada.</p>
                     </td>
                   </tr>
                )}
              </tbody>
            </table>

            <div style={{ padding: '1rem', borderTop: '1px solid hsl(var(--border-light))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Mostrando {transacoes.length} registros</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button title="Anterior" style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid hsl(var(--border-light))', background: 'white', cursor: 'pointer' }}><ChevronLeft size={16} /></button>
                <button title="Próximo" style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid hsl(var(--border-light))', background: 'white', cursor: 'pointer' }}><ChevronRight size={16} /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Financeira */}
        <div style={{ width: '300px' }}>
          <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart size={18} color="hsl(var(--primary))" /> Distribuição Geral
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                  <span>Sessões</span>
                  <span style={{ fontWeight: 700 }}>{metricas.distribuicao.sessoes}%</span>
                </div>
                <div style={{ height: '6px', background: 'hsla(var(--primary), 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${metricas.distribuicao.sessoes}%`, height: '100%', background: 'hsl(var(--primary))', transition: 'width 1s ease-out' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                  <span>Avaliações / Laudos</span>
                  <span style={{ fontWeight: 700 }}>{metricas.distribuicao.avaliacoes}%</span>
                </div>
                <div style={{ height: '6px', background: 'hsla(var(--primary), 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${metricas.distribuicao.avaliacoes}%`, height: '100%', background: 'hsl(142, 70%, 45%)', transition: 'width 1s ease-out' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                  <span>Outros</span>
                  <span style={{ fontWeight: 700 }}>{metricas.distribuicao.outros}%</span>
                </div>
                <div style={{ height: '6px', background: 'hsla(var(--primary), 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${metricas.distribuicao.outros}%`, height: '100%', background: 'hsl(var(--text-muted))', transition: 'width 1s ease-out' }} />
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.65rem', color: 'hsl(var(--text-muted))', marginTop: '1rem', fontStyle: 'italic' }}>Baseado no faturamento líquido do mês atual.</p>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, #4338ca 100%)', color: 'white', border: 'none', position: 'relative', overflow: 'hidden' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'white' }}>Meta Mensal</h3>
            <p style={{ fontSize: '0.8rem', opacity: 0.9, marginBottom: '1.25rem' }}>
              {metricas.progressoMeta >= 100 
                ? 'Parabéns! Você bateu sua meta de faturamento!' 
                : `Você atingiu ${metricas.progressoMeta}% da sua meta de ${formatCurrency(meta)}.`}
            </p>
            <div style={{ position: 'relative', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <div style={{ fontSize: '2.5rem', fontWeight: 800, zIndex: 2 }}>{metricas.progressoMeta}%</div>
               
               {/* Gráfico Circular Dinâmico com SVG Conérico */}
               <svg style={{ position: 'absolute', width: '110px', height: '110px', transform: 'rotate(-90deg)', zIndex: 1 }}>
                 <circle
                   cx="55" cy="55" r="48"
                   fill="transparent"
                   stroke="rgba(255,255,255,0.15)"
                   strokeWidth="10"
                 />
                 <circle
                   cx="55" cy="55" r="48"
                   fill="transparent"
                   stroke="white"
                   strokeWidth="10"
                   strokeDasharray={2 * Math.PI * 48}
                   strokeDashoffset={2 * Math.PI * 48 * (1 - metricas.progressoMeta / 100)}
                   strokeLinecap="round"
                   style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                 />
               </svg>
            </div>
            <button 
              onClick={() => setIsGoalModalOpen(true)}
              style={{ 
                width: '100%', marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', border: 'none', 
                background: 'white', color: 'hsl(var(--primary))', fontWeight: 700, cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Ver Detalhes
            </button>
          </div>
        </div>
      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={carregarDados}
        transactionToEdit={selectedTransaction}
      />

      {/* Modal de Gestão de Meta */}
      {isGoalModalOpen && (
        <div 
          onClick={() => setIsGoalModalOpen(false)}
          style={{ 
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem'
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="glass-card" 
            style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}
          >
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <TrendingUp size={20} color="hsl(var(--primary))" /> Gerenciar Meta Mensal
            </h3>
            
            <div className="input-group">
              <label className="input-label">Meta de Faturamento (R$)</label>
              <input 
                type="number" 
                className="form-input" 
                value={meta} 
                onChange={e => setMeta(Number(e.target.value))}
                style={{ fontSize: '1.5rem', fontWeight: 800, textAlign: 'center' }}
              />
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'hsla(var(--primary), 0.05)', borderRadius: '12px' }}>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', margin: 0 }}>
                Status atual: <strong>{formatCurrency(metricas.mensal)}</strong> recebidos de <strong>{formatCurrency(meta)}</strong> planejados.
              </p>
              {meta > metricas.mensal && (
                <p style={{ fontSize: '0.85rem', color: 'hsl(var(--primary))', fontWeight: 700, margin: '0.5rem 0 0 0' }}>
                  Faltam {formatCurrency(meta - metricas.mensal)} para atingir o objetivo.
                </p>
              )}
            </div>

            <button 
              onClick={() => {
                setIsGoalModalOpen(false);
                toast.success('Meta atualizada com sucesso!');
              }}
              className="btn btn-primary" 
              style={{ marginTop: '2rem' }}
            >
              Confirmar Meta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

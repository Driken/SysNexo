import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BuscaUniversal } from '../components/BuscaUniversal';
import { FilaDeEspera } from '../components/FilaDeEspera';
import { PainelPsicologo } from '../components/PainelPsicologo';
import { supabase } from '../lib/supabase';
import { Users, ClipboardList, Calendar, ChevronRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Stats {
  pacientesTotal: number;
  atendimentosTotal: number;
  consultasHoje: number;
  recentes: any[];
}

export const Dashboard: React.FC = () => {
  const { profile, viewMode } = useAuth();
  const [stats, setStats] = useState<Stats>({
    pacientesTotal: 0,
    atendimentosTotal: 0,
    consultasHoje: 0,
    recentes: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { count: pCount } = await supabase.from('pacientes').select('*', { count: 'exact', head: true });
      const { count: aCount } = await supabase.from('atendimentos').select('*', { count: 'exact', head: true });

      const today = new Date().toISOString().split('T')[0];
      const { count: hCount } = await supabase.from('atendimentos')
        .select('*', { count: 'exact', head: true })
        .gte('data_atendimento', `${today}T00:00:00`)
        .lte('data_atendimento', `${today}T23:59:59`);

      const { data: recentData } = await supabase
        .from('atendimentos')
        .select('*, paciente:pacientes(nome)')
        .order('data_atendimento', { ascending: false })
        .limit(3);

      setStats({
        pacientesTotal: pCount || 0,
        atendimentosTotal: aCount || 0,
        consultasHoje: hCount || 0,
        recentes: (recentData as any[]) || []
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const displayName = profile?.full_name && profile.full_name.includes('-')
    ? 'Usuário'
    : profile?.full_name || 'Usuário';

  const StatCard = ({ title, value, icon: Icon, color, bg }: any) => (
    <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderTop: `4px solid ${color}` }}>
      <div style={{ background: bg, color: color, padding: '0.75rem', borderRadius: '12px' }}>
        <Icon size={24} />
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>{title}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'hsl(var(--text-main))' }}>{value}</div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.4s ease-out' }}>

      <div className="dashboard-header" style={{ marginBottom: 0 }}>
        <h1 className="dashboard-title">Olá, {displayName.split(' ')[0]}!</h1>
        <p className="text-muted">Bem-vindo(a) ao sistema de gestão clínica.</p>
      </div>

      {/* Mini-Widgets de Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <StatCard
          title="Pacientes Ativos"
          value={loading ? '...' : stats.pacientesTotal}
          icon={Users}
          color="hsl(var(--primary))"
          bg="hsla(var(--primary), 0.1)"
        />
        <StatCard
          title="Total Atendimentos"
          value={loading ? '...' : stats.atendimentosTotal}
          icon={ClipboardList}
          color="hsl(var(--secondary))"
          bg="hsla(var(--secondary), 0.1)"
        />
        <StatCard
          title="Consultas Hoje"
          value={loading ? '...' : stats.consultasHoje}
          icon={Calendar}
          color="#15803d"
          bg="#dcfce7"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '2rem', alignItems: 'flex-start' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <BuscaUniversal />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {viewMode === 'recepcao' || viewMode === 'admin' ? (
              <FilaDeEspera isCompact />
            ) : null}

            {viewMode === 'psicologo' || viewMode === 'admin' ? (
              <PainelPsicologo />
            ) : null}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
            <Clock size={20} color="hsl(var(--primary))" /> Recém Atendidos
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats.recentes.length === 0 ? (
              <div className="text-center" style={{ padding: '1rem' }}>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>Nenhum atendimento recente.</p>
              </div>
            ) : (
              stats.recentes.map((item: any) => (
                <Link key={item.id} to={`/paciente/${item.paciente_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="list-item-hover" style={{
                    padding: '0.85rem', borderRadius: '12px', background: 'hsla(var(--bg-main), 0.4)',
                    border: '1px solid hsl(var(--border-light))', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {item.paciente?.nome || 'Paciente'}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{new Date(item.data_atendimento).toLocaleDateString()}</div>
                    </div>
                    <ChevronRight size={16} color="hsl(var(--primary))" style={{ flexShrink: 0 }} />
                  </div>
                </Link>
              ))
            )}
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid hsl(var(--border-light))' }}>
            <Link to="/pacientes" className="text-sm" style={{ color: 'hsl(var(--primary))', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Ver todos os pacientes <ChevronRight size={14} />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BuscaUniversal } from '../components/BuscaUniversal';
import { FilaDeEspera } from '../components/FilaDeEspera';
import { PainelPsicologo } from '../components/PainelPsicologo';
import { supabase } from '../lib/supabase';
import { Users, ClipboardList, Calendar } from 'lucide-react';

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
        <BuscaUniversal />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%' }}>
          {viewMode === 'recepcao' || viewMode === 'admin' ? (
            <FilaDeEspera />
          ) : null}

          {viewMode === 'psicologo' || viewMode === 'admin' ? (
            <PainelPsicologo />
          ) : null}
        </div>
      </div>
    </div>
  );
};

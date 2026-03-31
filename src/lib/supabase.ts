import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials not found. Please check your .env file.");
}

// Adaptador de storage híbrido para suportar "Manter Conectado"
const smartStorage = {
  getItem: (key: string) => {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    // Se o flag de sessão temporária estiver ativo, usamos sessionStorage
    if (sessionStorage.getItem('supabase_use_session_only') === 'true') {
      sessionStorage.setItem(key, value);
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
      sessionStorage.removeItem(key);
    }
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: smartStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Cliente secundário para cadastro de usuários (não substitui a sessão do admin logado)
export const supabaseAdminAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});
export type UserRole = 'admin' | 'recepcao' | 'psicologo';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  cpf?: string;
  created_at: string;
}

export interface Paciente {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  cartao_sus: string | null;
  created_at: string;
}

export type AgendamentoStatus = 'Aguardando' | 'Em Atendimento' | 'Faltou' | 'Finalizado' | 'Agendado';

export interface Agendamento {
  id: string;
  paciente_id: string;
  psicologo_id: string;
  data_hora: string;
  status: AgendamentoStatus;
  inicio_atendimento?: string | null;
  fim_atendimento?: string | null;
  created_at: string;
  paciente?: Paciente;
  psicologo?: Profile;
}

export interface Atendimento {
  id: string;
  paciente_id: string;
  psicologo_id: string;
  data_atendimento: string;
  notas_evolucao: string | null;
  plano_proximo_encontro: string | null;
  created_at: string;
}

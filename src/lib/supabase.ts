import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials not found. Please check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'admin' | 'recepcao' | 'psicologo';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
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

export interface Atendimento {
  id: string;
  paciente_id: string;
  psicologo_id: string;
  data_atendimento: string;
  notas_evolucao: string | null;
  plano_proximo_encontro: string | null;
  created_at: string;
}

-- Supabase Schema para PsiManager

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Criar ENUM para Role se não existir
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('admin', 'recepcao', 'psicologo');
  end if;
end
$$;

-- Tabela Profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  role user_role default 'recepcao'::user_role not null,
  cpf text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS em Profiles
alter table public.profiles enable row level security;

create policy "Perfis visíveis para usuários autenticados" 
  on profiles for select using (auth.role() = 'authenticated');

create policy "Usuários podem atualizar seu próprio perfil" 
  on profiles for update using (auth.uid() = id);

-- Trigger para criar Profile ao registrar
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, cpf)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuário ' || new.id), 
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'recepcao'::public.user_role),
    new.raw_user_meta_data->>'cpf'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Removendo trigger anterior e adicionando de novo
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Tabela Pacientes
create table if not exists public.pacientes (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  cpf text unique not null,
  data_nascimento date not null,
  cartao_sus text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.pacientes enable row level security;

create policy "Pacientes visíveis para autenticados" 
  on pacientes for select using (auth.role() = 'authenticated');
create policy "Pacientes inseridos por autenticados" 
  on pacientes for insert with check (auth.role() = 'authenticated');
create policy "Pacientes atualizados por autenticados" 
  on pacientes for update using (auth.role() = 'authenticated');

-- Tabela Atendimentos
create table if not exists public.atendimentos (
  id uuid default gen_random_uuid() primary key,
  paciente_id uuid references public.pacientes on delete cascade not null,
  psicologo_id uuid references public.profiles on delete set null not null,
  data_atendimento timestamp with time zone not null,
  notas_evolucao text,
  plano_proximo_encontro text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.atendimentos enable row level security;

create policy "Todos os usuários autenticados podem ver os dados de base do atendimento"
  on atendimentos for select using (auth.role() = 'authenticated');

create policy "Apenas admin e psicologos podem inserir"
  on atendimentos for insert with check (
    exists (
      select 1 from profiles where id = auth.uid() and role in ('admin', 'psicologo')
    )
  );

create policy "Apenas admin e o psicólogo dono podem editar notas"
  on atendimentos for update using (
    exists (
      select 1 from profiles where id = auth.uid() and role = 'admin'
    ) or auth.uid() = psicologo_id
  );

-- Criar ENUM para Status de Agendamento se não existir
do $$
begin
  if not exists (select 1 from pg_type where typname = 'agendamento_status') then
    create type agendamento_status as enum ('Aguardando', 'Em Atendimento', 'Faltou', 'Finalizado', 'Agendado');
  end if;
end
$$;

-- Tabela Agendamentos
create table if not exists public.agendamentos (
  id uuid default gen_random_uuid() primary key,
  paciente_id uuid references public.pacientes on delete cascade not null,
  psicologo_id uuid references public.profiles on delete set null not null,
  data_hora timestamp with time zone not null,
  status agendamento_status default 'Agendado'::agendamento_status not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.agendamentos enable row level security;

create policy "Todos os autenticados podem ver os agendamentos"
  on agendamentos for select using (auth.role() = 'authenticated');

create policy "Todos os autenticados podem inserir gerenciar agendamentos" 
  on agendamentos for all using (auth.role() = 'authenticated');

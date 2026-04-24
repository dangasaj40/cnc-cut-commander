-- Enum de papéis
create type public.app_role as enum ('admin', 'supervisor', 'viewer');

-- Tabela de perfis
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null default '',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Tabela de papéis
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

-- Função de verificação de papel (security definer evita recursão em RLS)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

-- Operadores
create table public.operadores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  matricula text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.operadores enable row level security;

-- Produção
create table public.producao (
  id uuid primary key default gen_random_uuid(),
  peca text not null,
  nesting text,
  painel text,
  balsa text,
  operador_id uuid references public.operadores(id) on delete set null,
  quantidade integer not null default 1,
  peso_unitario numeric(10,2),
  peso_total numeric(12,2),
  data date not null default current_date,
  hora_inicio timestamptz,
  hora_fim timestamptz,
  tempo_total_segundos integer,
  observacoes text,
  avulsa boolean not null default false,
  criado_por uuid references auth.users(id),
  atualizado_por uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.producao enable row level security;
create index producao_data_idx on public.producao(data desc);
create index producao_operador_idx on public.producao(operador_id);

-- Ocorrências
create table public.ocorrencias (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  descricao text not null,
  data timestamptz not null default now(),
  usuario_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.ocorrencias enable row level security;

-- Trigger updated_at
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated before update on public.profiles
  for each row execute function public.tg_set_updated_at();
create trigger producao_updated before update on public.producao
  for each row execute function public.tg_set_updated_at();

-- Trigger de criação automática de perfil no signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome) values (new.id, coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)));
  -- primeiro usuário vira admin, demais viewer
  if (select count(*) from public.user_roles) = 0 then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'viewer');
  end if;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== RLS =====

-- profiles
create policy "profiles select self or admin" on public.profiles for select to authenticated
  using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));
create policy "profiles update self or admin" on public.profiles for update to authenticated
  using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));
create policy "profiles admin insert" on public.profiles for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));
create policy "profiles admin delete" on public.profiles for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- user_roles
create policy "roles select authenticated" on public.user_roles for select to authenticated using (true);
create policy "roles admin manage" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- operadores
create policy "operadores select authenticated" on public.operadores for select to authenticated using (true);
create policy "operadores supervisor insert" on public.operadores for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'supervisor'));
create policy "operadores supervisor update" on public.operadores for update to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'supervisor'));
create policy "operadores admin delete" on public.operadores for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- producao
create policy "producao select authenticated" on public.producao for select to authenticated using (true);
create policy "producao supervisor insert" on public.producao for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'supervisor'));
create policy "producao supervisor update" on public.producao for update to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'supervisor'));
create policy "producao admin delete" on public.producao for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- ocorrencias
create policy "ocorrencias select authenticated" on public.ocorrencias for select to authenticated using (true);
create policy "ocorrencias supervisor insert" on public.ocorrencias for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'supervisor'));
create policy "ocorrencias admin delete" on public.ocorrencias for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));
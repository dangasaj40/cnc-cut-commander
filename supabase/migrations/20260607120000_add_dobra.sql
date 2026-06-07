-- Tabela de registro de peças dobradas (Setor de Dobra)
create table public.dobra (
  id uuid primary key default gen_random_uuid(),
  peca text not null,
  nesting text,
  painel text,
  dimensional text,
  espessura_mm text,
  peso_kg numeric,
  quantidade integer not null default 1,
  operador_id uuid references public.operadores_dobra(id) on delete set null,
  operador_nome text,
  data date not null default current_date,
  observacoes text,
  criado_por uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dobra enable row level security;

create index dobra_peca_idx on public.dobra(peca);
create index dobra_data_idx on public.dobra(data desc);
create index dobra_operador_idx on public.dobra(operador_id);

create trigger dobra_updated before update on public.dobra
  for each row execute function public.tg_set_updated_at();

create policy "dobra select authenticated" on public.dobra
  for select to authenticated using (true);

create policy "dobra supervisor insert" on public.dobra
  for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'supervisor'));

create policy "dobra supervisor update" on public.dobra
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'supervisor'));

create policy "dobra admin delete" on public.dobra
  for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

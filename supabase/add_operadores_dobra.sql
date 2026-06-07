-- Tabela de operadores exclusivos do setor de dobra
create table public.operadores_dobra (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.operadores_dobra enable row level security;

create index operadores_dobra_nome_idx on public.operadores_dobra(nome);
create index operadores_dobra_ativo_idx on public.operadores_dobra(ativo);

-- Todos autenticados podem ver
create policy "operadores_dobra select" on public.operadores_dobra
  for select to authenticated using (true);

-- Apenas admins e supervisores podem inserir/atualizar/deletar
create policy "operadores_dobra write" on public.operadores_dobra
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'supervisor'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'supervisor'));

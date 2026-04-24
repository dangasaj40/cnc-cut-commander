-- Tabela de catálogo de peças (dados do Excel)
create table public.catalogo_pecas (
  id uuid primary key default gen_random_uuid(),
  tipo_balsa text,
  tempo_corte_total numeric,
  quantidade_base integer,
  peca text not null,
  dimensional text,
  espessura_mm text,
  peso_kg numeric,
  bloco text,
  painel text,
  nesting text,
  created_at timestamptz not null default now()
);

-- Habilitar RLS
alter table public.catalogo_pecas enable row level security;

-- Política de leitura para todos autenticados
create policy "catalogo_pecas select authenticated" on public.catalogo_pecas for select to authenticated using (true);

-- Índices para busca rápida
create index catalogo_nesting_idx on public.catalogo_pecas(nesting);
create index catalogo_painel_idx on public.catalogo_pecas(painel);

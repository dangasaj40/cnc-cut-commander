-- ─────────────────────────────────────────────────────────────────────────────
-- Migração: Adiciona campo "balsa" ao setor de Dobra
-- Permite associar um lote de dobra a uma balsa (ex: RAKE-13, BOX-15)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.dobra
  add column if not exists balsa text;

-- Índice para acelerar buscas por balsa
create index if not exists dobra_balsa_idx on public.dobra(balsa);

-- ─────────────────────────────────────────────────────────────────────────────
-- Migração: Tipo de Máquina no Setor de Dobra
-- Cada operador é vinculado a uma máquina: PRENSA ou DOBRADEIRA
-- O campo é denormalizado na tabela dobra para facilitar filtros e dashboards.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Adiciona maquina à tabela de operadores do setor de dobra
alter table public.operadores_dobra
  add column if not exists maquina text
    check (maquina in ('PRENSA', 'DOBRADEIRA'))
    not null default 'DOBRADEIRA';

-- Índice para filtros por máquina nos operadores
create index if not exists operadores_dobra_maquina_idx
  on public.operadores_dobra(maquina);

-- 2. Adiciona maquina à tabela dobra (denormalizado do operador, gravado no INSERT)
alter table public.dobra
  add column if not exists maquina text
    check (maquina in ('PRENSA', 'DOBRADEIRA'));

-- Índice para filtros por máquina no histórico
create index if not exists dobra_maquina_idx
  on public.dobra(maquina);

-- Índice composto para filtros data + maquina (consulta mais comum)
create index if not exists dobra_data_maquina_idx
  on public.dobra(data desc, maquina);

-- 3. Backfill retroativo
-- Atualiza os registros antigos usando a máquina do operador cadastrado
update public.dobra d
set maquina = o.maquina
from public.operadores_dobra o
where d.operador_id = o.id
  and d.maquina is null;

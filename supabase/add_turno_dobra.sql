-- ─────────────────────────────────────────────────────────────────────────────
-- Migração: Adiciona campo "turno" ao setor de Dobra
-- Turno é fixo por operador (D = Diurno, N = Noturno)
-- e denormalizado na tabela dobra para facilitar consultas e filtros.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Adiciona turno à tabela de operadores do setor de dobra
alter table public.operadores_dobra
  add column if not exists turno text
    check (turno in ('D', 'N'))
    not null default 'D';

-- Índice para filtros por turno nos operadores
create index if not exists operadores_dobra_turno_idx
  on public.operadores_dobra(turno);

-- 2. Adiciona turno à tabela dobra (denormalizado do operador, gravado no INSERT)
--    Isso evita JOINs nas consultas do histórico e facilita filtros por turno.
alter table public.dobra
  add column if not exists turno text
    check (turno in ('D', 'N'));

-- Índice composto para filtros de data + turno (padrão de consulta mais comum)
create index if not exists dobra_data_turno_idx
  on public.dobra(data desc, turno);

-- 3. Atualização Retroativa (Backfill)
-- Atualiza os registros antigos que ficaram com turno NULL usando o turno do operador cadastrado
update public.dobra d
set turno = o.turno
from public.operadores_dobra o
where d.operador_id = o.id
  and d.turno is null;


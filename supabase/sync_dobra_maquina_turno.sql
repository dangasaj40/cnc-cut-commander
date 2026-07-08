-- ─────────────────────────────────────────────────────────────────────────────
-- Script: Sincronização e Gatilho para Turno e Máquina dos Operadores de Dobra
-- 1. Sincroniza retroativamente todos os registros da tabela dobra com a máquina e o turno atuais dos operadores.
-- 2. Cria um trigger (gatilho) no banco para que qualquer alteração futura no operador atualize automaticamente seu histórico.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Executa a sincronização retroativa
update public.dobra d
set 
  turno = o.turno,
  maquina = o.maquina
from public.operadores_dobra o
where d.operador_id = o.id;

-- 2. Criação da função de sincronização automática
create or replace function public.sync_operador_changes_to_dobra()
returns trigger as $$
begin
  update public.dobra
  set 
    turno = coalesce(new.turno, turno),
    maquina = coalesce(new.maquina, maquina)
  where operador_id = new.id;
  return new;
end;
$$ language plpgsql security definer;

-- 3. Criação do Trigger associado
drop trigger if exists on_operador_update_sync_dobra on public.operadores_dobra;
create trigger on_operador_update_sync_dobra
  after update of turno, maquina on public.operadores_dobra
  for each row
  execute function public.sync_operador_changes_to_dobra();

-- ─────────────────────────────────────────────────────────────────────────────
-- Migração: Paradas de Máquina no Setor de Dobra
-- Registra manutenções e paradas da Prensa e Dobradeira
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.paradas_dobra (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    maquina text NOT NULL CHECK (maquina IN ('PRENSA', 'DOBRADEIRA')),
    operador_id uuid REFERENCES public.operadores_dobra(id) ON DELETE SET NULL,
    operador_nome text NOT NULL,
    motivo text NOT NULL,
    data_inicio timestamp with time zone NOT NULL DEFAULT now(),
    data_fim timestamp with time zone,
    duracao_minutos numeric DEFAULT 0,
    observacao text,
    status text NOT NULL DEFAULT 'Em aberto' CHECK (status IN ('Em aberto', 'Finalizada')),
    criado_por uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now()
);

-- Índices para filtros rápidos
CREATE INDEX IF NOT EXISTS paradas_dobra_maquina_idx ON public.paradas_dobra(maquina);
CREATE INDEX IF NOT EXISTS paradas_dobra_status_idx ON public.paradas_dobra(status);
CREATE INDEX IF NOT EXISTS paradas_dobra_data_idx ON public.paradas_dobra(data_inicio DESC);

-- RLS e Segurança
ALTER TABLE public.paradas_dobra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for all" ON public.paradas_dobra
    FOR SELECT USING (true);

CREATE POLICY "Enable all for authenticated" ON public.paradas_dobra
    FOR ALL USING (auth.role() = 'authenticated');

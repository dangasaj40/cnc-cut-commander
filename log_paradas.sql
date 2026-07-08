-- Tabela para registro detalhado de paradas de máquina
CREATE TABLE IF NOT EXISTS public.log_paradas (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    id_balsa text REFERENCES public.balsas(id_balsa),
    maquina text NOT NULL,
    operador text NOT NULL,
    motivo text NOT NULL,
    data_inicio timestamp with time zone DEFAULT now(),
    data_fim timestamp with time zone,
    duracao_minutos numeric DEFAULT 0,
    observacao text,
    status text DEFAULT 'Em aberto' -- 'Em aberto' ou 'Finalizada'
);

-- RLS e Segurança
ALTER TABLE public.log_paradas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for all" ON public.log_paradas FOR SELECT USING (true);
CREATE POLICY "Enable all for authenticated" ON public.log_paradas FOR ALL USING (auth.role() = 'authenticated');

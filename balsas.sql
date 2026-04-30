-- Copie e cole este código no SQL Editor do Supabase para criar a tabela de Balsas (Projetos)

CREATE TABLE IF NOT EXISTS public.balsas (
    id_balsa text PRIMARY KEY,
    tipo_balsa text NOT NULL,
    nome_balsa text NOT NULL,
    data_cadastro timestamp with time zone DEFAULT now(),
    total_nestings numeric DEFAULT 0,
    emitidos numeric DEFAULT 0,
    finalizados numeric DEFAULT 0,
    pendentes numeric DEFAULT 0,
    percentual_concluido numeric DEFAULT 0,
    status_balsa text DEFAULT 'Não iniciado'
);

-- Configuração de Segurança (RLS)
ALTER TABLE public.balsas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.balsas 
FOR SELECT USING (true);

CREATE POLICY "Enable all access for authenticated users" ON public.balsas 
FOR ALL USING (auth.role() = 'authenticated');

-- Adicionar colunas de versão e data no Catálogo
ALTER TABLE public.catalogo_pecas 
ADD COLUMN IF NOT EXISTS versao integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS data_importacao timestamptz DEFAULT now();

-- Adicionar colunas de versão e data na Produção (Histórico)
ALTER TABLE public.producao 
ADD COLUMN IF NOT EXISTS versao integer,
ADD COLUMN IF NOT EXISTS data_importacao timestamptz;

-- Comentários para documentação
COMMENT ON COLUMN public.catalogo_pecas.versao IS 'Versão incremental do plano de nesting';
COMMENT ON COLUMN public.producao.versao IS 'Versão do nesting no momento da produção';

-- Liberar permissões de INSERT e DELETE para usuários autenticados (necessário para importação)
CREATE POLICY "catalogo_pecas insert authenticated" ON public.catalogo_pecas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "catalogo_pecas delete authenticated" ON public.catalogo_pecas FOR DELETE TO authenticated USING (true);
CREATE POLICY "catalogo_pecas update authenticated" ON public.catalogo_pecas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

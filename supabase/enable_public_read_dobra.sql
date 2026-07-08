-- ============================================================
-- Habilitar leitura pública (anônima) para link de compartilhamento
-- Execute no painel Supabase > SQL Editor
-- ============================================================

-- Tabela dobra: leitura anônima
ALTER TABLE dobra ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dobra' AND policyname = 'public_read_dobra'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY public_read_dobra ON dobra
        FOR SELECT TO anon USING (true);
    $policy$;
  END IF;
END;
$$;

-- Tabela operadores: leitura anônima
ALTER TABLE operadores ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'operadores' AND policyname = 'public_read_operadores'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY public_read_operadores ON operadores
        FOR SELECT TO anon USING (true);
    $policy$;
  END IF;
END;
$$;

-- Tabela paradas_dobra: leitura anônima
ALTER TABLE paradas_dobra ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'paradas_dobra' AND policyname = 'public_read_paradas'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY public_read_paradas ON paradas_dobra
        FOR SELECT TO anon USING (true);
    $policy$;
  END IF;
END;
$$;

-- =========================================================
-- FIX: Settings Table - Sync entre dispositivos
-- Executar no SQL Editor do Supabase
-- =========================================================

-- 1. Garantir que a tabela existe
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Ativar RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas (se existirem)
DROP POLICY IF EXISTS "Public read settings" ON public.settings;
DROP POLICY IF EXISTS "Admins manage settings" ON public.settings;

-- 4. Criar políticas corrigidas
-- Leitura pública (qualquer utilizador pode ler o link do Telegram)
CREATE POLICY "Public read settings" ON public.settings
  FOR SELECT USING (true);

-- Admins podem gerir (INSERT + UPDATE + DELETE)
-- IMPORTANTE: FOR ALL precisa de USING + WITH CHECK para cobrir INSERT
CREATE POLICY "Admins insert settings" ON public.settings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Admins update settings" ON public.settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true)
  );

CREATE POLICY "Admins delete settings" ON public.settings
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true)
  );

-- 5. Ativar Realtime para a tabela settings
-- (necessário para que outros dispositivos recebam updates em tempo real)
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;

-- 6. Garantir dados iniciais existem
INSERT INTO public.settings (key, value)
VALUES 
    ('globalTelegramLink', ''),
    ('globalTelegramButtonText', 'DM TELEGRAM')
ON CONFLICT (key) DO NOTHING;

-- 7. Trigger para auto updated_at (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS tr_settings_updated_at ON public.settings;
CREATE TRIGGER tr_settings_updated_at 
    BEFORE UPDATE ON public.settings 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

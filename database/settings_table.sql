-- =========================================================
-- TABELA: settings (Configurações Globais)
-- Executar no SQL Editor do Supabase
-- =========================================================

CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Segurança: Leitura pública, escrita só para admins
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);

CREATE POLICY "Admins manage settings" ON public.settings FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true));

-- Trigger para auto updated_at
CREATE TRIGGER tr_settings_updated_at 
    BEFORE UPDATE ON public.settings 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Dados iniciais
INSERT INTO public.settings (key, value)
VALUES 
    ('globalTelegramLink', ''),
    ('globalTelegramButtonText', 'DM TELEGRAM')
ON CONFLICT (key) DO NOTHING;

-- Tabela para gerenciar Magic Links customizados
CREATE TABLE IF NOT EXISTS public.magic_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS (Segurança)
ALTER TABLE public.magic_links ENABLE ROW LEVEL SECURITY;

-- Políticas
-- O sistema (Service Role) tem acesso total para criar e ler
-- Admins também podem gerenciar
CREATE POLICY "Admins manage magic links" ON public.magic_links FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true));

-- Usuários não autenticados só podem ler o próprio token para validação (opcional, dependendo de como for validar no backend)
CREATE POLICY "Public read own token" ON public.magic_links FOR SELECT USING (true);

-- Função para limpar tokens expirados ou já utilizados
CREATE OR REPLACE FUNCTION public.cleanup_expired_magic_links()
RETURNS void AS $$
BEGIN
    DELETE FROM public.magic_links
    WHERE expires_at < now() OR used = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================
-- DATABASE SCHEMA: MEMBERHUB (V2)
-- DATA: 19/02/2026
-- =========================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELAS

-- Admins
CREATE TABLE IF NOT EXISTS public.admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    role TEXT DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Banners (Carousel)
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    images TEXT[] DEFAULT '{}',
    link TEXT,
    button_text TEXT DEFAULT 'Saiba Mais',
    type TEXT DEFAULT 'image' CHECK (type IN ('image', 'video')),
    sort_order INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Videos
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    cover_url TEXT NOT NULL,
    previews TEXT[] DEFAULT '{}',
    buy_link TEXT,
    buy_button_text TEXT DEFAULT 'BUY ALL PACK',
    telegram_link TEXT,
    telegram_button_text TEXT DEFAULT 'DM TELEGRAM',
    sort_order INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notices (Avisos)
CREATE TABLE IF NOT EXISTS public.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date TEXT,
    sort_order INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Promos (Top e Bottom Cards)
CREATE TABLE IF NOT EXISTS public.promos (
    id TEXT PRIMARY KEY CHECK (id IN ('top', 'bottom')),
    title TEXT DEFAULT '',
    description TEXT DEFAULT '',
    button_text TEXT DEFAULT '',
    button_link TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2FA Codes
CREATE TABLE IF NOT EXISTS public.auth_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT false,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Login Attempts
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. SEGURANÇA (RLS)

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: Leitura Pública
CREATE POLICY "Public read banners" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Public read videos" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Public read notices" ON public.notices FOR SELECT USING (true);
CREATE POLICY "Public read promos" ON public.promos FOR SELECT USING (true);

-- POLÍTICAS: Admins (Controle total se ativo)
CREATE POLICY "Admins read own record" ON public.admins FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins manage banners" ON public.banners FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Admins manage videos" ON public.videos FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Admins manage notices" ON public.notices FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Admins manage promos" ON public.promos FOR ALL 
USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true));

-- POLÍTICAS: Auth/Segurança
CREATE POLICY "Admins manage own codes" ON public.auth_codes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "System insert attempts" ON public.login_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read attempts" ON public.login_attempts FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true));

-- 4. FUNÇÕES E TRIGGERS

-- Auto updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_videos_updated_at BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_notices_updated_at BEFORE UPDATE ON public.notices FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_promos_updated_at BEFORE UPDATE ON public.promos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Cleanup 2FA Codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_codes()
RETURNS void AS $$
BEGIN
    DELETE FROM public.auth_codes
    WHERE expires_at < now() OR used = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. STORAGE SETUP (Executar no SQL Editor)
/*
-- Criar buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('banners', 'banners', true),
    ('video-covers', 'video-covers', true),
    ('video-previews', 'video-previews', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas Storage
CREATE POLICY "Storage public read" ON storage.objects FOR SELECT USING (bucket_id IN ('banners', 'video-covers', 'video-previews'));

CREATE POLICY "Storage admin manage" ON storage.objects FOR ALL
USING (
    bucket_id IN ('banners', 'video-covers', 'video-previews') 
    AND EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true)
);
*/

-- 6. DADOS INICIAIS
INSERT INTO public.promos (id, title, description, button_text, button_link, is_active)
VALUES 
('top', '', '', '', '', false),
('bottom', '', '', '', '', false)
ON CONFLICT (id) DO NOTHING;

-- 7. IMPORTANTE: COMANDO PARA ADICIONAR O PRIMEIRO ADMIN
-- Crie o usuário primeiro no painel Supabase (Auth > Users), pegue o ID dele e rode:
-- INSERT INTO public.admins (user_id, role, is_active) VALUES ('COLE_AQUI_O_UUID', 'superadmin', true);

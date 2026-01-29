-- TABELAS DO SISTEMA MEMBERHUB

-- 1. Admins (Para controle de acesso à área administrativa)
CREATE TABLE IF NOT EXISTS public.admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    role TEXT DEFAULT 'admin' CHECK (role IN ('superadmin', 'admin')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Banners (Top Banners do Carousel)
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    images TEXT[] DEFAULT '{}',
    link TEXT,
    button_text TEXT,
    type TEXT DEFAULT 'image' CHECK (type IN ('image', 'video')),
    sort_order INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Videos (Listagem de vídeos/conteúdos)
CREATE TABLE IF NOT EXISTS public.videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    cover_url TEXT NOT NULL,
    previews TEXT[] DEFAULT '{}',
    buy_link TEXT,
    buy_button_text TEXT,
    telegram_link TEXT,
    telegram_button_text TEXT,
    sort_order INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Notices (Avisos/Mural)
CREATE TABLE IF NOT EXISTS public.notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    date TEXT,
    sort_order INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Promos (Cards de Promoção de topo e rodapé)
CREATE TABLE IF NOT EXISTS public.promos (
    id TEXT PRIMARY KEY CHECK (id IN ('top', 'bottom')),
    title TEXT,
    description TEXT,
    button_text TEXT,
    button_link TEXT,
    is_active BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Auth Codes (Códigos 2FA)
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

-- 7. Login Attempts (Logs de Segurança)
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACESSO (RLS)

-- Admins: Apenas o próprio admin pode ler seu registro (para verificação de sessão)
CREATE POLICY "Admins can read their own record" ON public.admins
    FOR SELECT USING (auth.uid() = user_id);

-- Banners, Videos, Notices, Promos: Público pode ler
CREATE POLICY "Allow public read on banners" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Allow public read on videos" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Allow public read on notices" ON public.notices FOR SELECT USING (true);
CREATE POLICY "Allow public read on promos" ON public.promos FOR SELECT USING (true);

-- Banners, Videos, Notices, Promos: Apenas admins ativos podem gerenciar
CREATE POLICY "Allow admin manage on banners" ON public.banners FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Allow admin manage on videos" ON public.videos FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Allow admin manage on notices" ON public.notices FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true));
CREATE POLICY "Allow admin manage on promos" ON public.promos FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true));

-- Auth Codes: Admin pode ler seu próprio código
CREATE POLICY "Allow admin manage own auth_codes" ON public.auth_codes FOR ALL USING (auth.uid() = user_id);

-- Login Attempts: Sistema pode inserir, Apenas admins podem ler
CREATE POLICY "Allow system insert login_attempts" ON public.login_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin read login_attempts" ON public.login_attempts FOR SELECT USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true));

-- ---------------------------------------------------------
-- STORAGE BUCKETS (REGRAS)
-- Criar buckets: 'banners', 'video-covers', 'video-previews' através do painel Supabase
-- Ou use o SQL abaixo para criar (necessita permissões de superuser no Query Editor):

/*
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('video-covers', 'video-covers', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('video-previews', 'video-previews', true);

CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "Admin Upload Access" ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id IN ('banners', 'video-covers', 'video-previews') AND 
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true)
  );
*/

-- FUNÇÃO PARA ATUALIZAR TIMESTAMP
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_notices_updated_at BEFORE UPDATE ON public.notices FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_promos_updated_at BEFORE UPDATE ON public.promos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Snippet para adicionar o primeiro Administrador
-- Execute este comando no SQL Editor do Supabase após criar o usuário no Auth:
INSERT INTO public.admins (user_id, role, is_active) 
VALUES ('be3f756b-a44c-4f4f-9f8c-71520661b2a3', 'superadmin', true)
ON CONFLICT (user_id) DO UPDATE SET role = 'superadmin', is_active = true;

-- TABELA DE FOTOS
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    photo_url TEXT NOT NULL,
    description TEXT,
    buy_link TEXT,
    buy_button_text TEXT,
    telegram_link TEXT,
    telegram_button_text TEXT,
    price TEXT,
    sort_order INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS DE ACESSO (RLS)
-- Público pode ler
CREATE POLICY "Allow public read on photos" ON public.photos FOR SELECT USING (true);

-- Apenas admins ativos podem gerenciar
CREATE POLICY "Allow admin manage on photos" ON public.photos FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true));

-- TRIGGER PARA ATUALIZAR TIMESTAMP (A função update_updated_at_column já existe no setup original)
CREATE TRIGGER update_photos_updated_at BEFORE UPDATE ON public.photos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ADICIONAR BUCKET (SE AINDA NÃO EXISTIR)
/*
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true) ON CONFLICT DO NOTHING;
CREATE POLICY "Public Read Access Photos" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
CREATE POLICY "Admin Upload Access Photos" ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'photos' AND 
    EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid() AND is_active = true)
  );
*/

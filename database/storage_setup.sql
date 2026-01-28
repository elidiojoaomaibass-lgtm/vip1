-- SCRIPT PARA CRIAR BUCKETS DE STORAGE NO SUPABASE
-- Execute este script no SQL Editor do Supabase

-- 1. Criar os buckets (se não existirem)
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('banners', 'banners', true),
    ('video-covers', 'video-covers', true),
    ('video-previews', 'video-previews', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Configurar Políticas de Segurança (RLS) para o Storage
-- Nota: Removemos todas as políticas existentes para esses buckets antes de criar as novas para evitar conflitos

-- Permissão: Qualquer pessoa pode ver os arquivos (Leitura Pública)
CREATE POLICY "Public Read Access" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('banners', 'video-covers', 'video-previews'));

-- Permissão de Inserção: Apenas Admins Autenticados e Ativos
CREATE POLICY "Admin Insert Access" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id IN ('banners', 'video-covers', 'video-previews') 
    AND EXISTS (
        SELECT 1 FROM public.admins 
        WHERE user_id = auth.uid() 
        AND is_active = true
    )
);

-- Permissão de Deleção: Apenas Admins Autenticados e Ativos
CREATE POLICY "Admin Delete Access" 
ON storage.objects FOR DELETE 
USING (
    bucket_id IN ('banners', 'video-covers', 'video-previews') 
    AND EXISTS (
        SELECT 1 FROM public.admins 
        WHERE user_id = auth.uid() 
        AND is_active = true
    )
);

-- Permissão de Atualização (Update): Apenas Admins Autenticados e Ativos
CREATE POLICY "Admin Update Access" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id IN ('banners', 'video-covers', 'video-previews') 
    AND EXISTS (
        SELECT 1 FROM public.admins 
        WHERE user_id = auth.uid() 
        AND is_active = true
    )
);

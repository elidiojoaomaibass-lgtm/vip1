import { supabase } from './supabase';

export interface UploadResult {
  url: string | null;
  error: string | null;
  path?: string;
}

export const uploadService = {
  /**
   * Upload de imagem para bucket de banners
   */
  uploadBannerImage: async (file: File): Promise<UploadResult> => {
    return uploadService.uploadFile(file, 'banners');
  },

  /**
   * Upload de capa de vídeo
   */
  uploadVideoCover: async (file: File): Promise<UploadResult> => {
    return uploadService.uploadFile(file, 'video-covers');
  },

  /**
   * Upload de vídeo de preview
   */
  uploadVideoPreview: async (file: File): Promise<UploadResult> => {
    return uploadService.uploadFile(file, 'video-previews');
  },

  /**
   * Upload genérico de arquivo
   */
  uploadFile: async (file: File, bucket: string): Promise<UploadResult> => {
    if (!supabase) {
      return { url: null, error: 'Supabase não configurado' };
    }

    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log(`[Storage] Iniciando upload para bucket "${bucket}":`, fileName);

      // Upload do arquivo
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'application/octet-stream'
        });

      if (uploadError) {
        console.error('Upload error detail:', uploadError);
        let errorMessage = 'Erro ao fazer upload';

        if (uploadError.message === 'Bucket not found') {
          errorMessage = `Bucket "${bucket}" não encontrado no Supabase.`;
        } else if (uploadError.message.includes('Payload too large')) {
          errorMessage = 'Arquivo muito grande para o limite do Supabase.';
        } else {
          errorMessage = `Erro Supabase: ${uploadError.message}`;
        }

        return { url: null, error: errorMessage };
      }

      // Obter URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      console.log(`[Storage] Upload concluído com sucesso:`, publicUrl);

      return {
        url: publicUrl,
        error: null,
        path: filePath
      };
    } catch (err: any) {
      console.error('Storage catch error:', err);
      return { url: null, error: `Erro inesperado: ${err.message}` };
    }
  },

  /**
   * Deletar arquivo do storage
   */
  deleteFile: async (bucket: string, path: string): Promise<{ error: string | null }> => {
    if (!supabase) {
      return { error: 'Supabase não configurado' };
    }

    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  },

  /**
   * Deletar por URL (Tenta extrair bucket e path)
   */
  deleteFileByUrl: async (url: string): Promise<{ error: string | null }> => {
    if (!supabase || !url || !url.includes('supabase.co/storage')) {
      return { error: null }; // Ignora se não for URL do Supabase
    }

    try {
      // Formato esperado: .../public/BUCKET_NAME/FILE_PATH
      const parts = url.split('/public/');
      if (parts.length < 2) return { error: null };

      const pathParts = parts[1].split('/');
      const bucket = pathParts[0];
      const filePath = pathParts.slice(1).join('/');

      return await uploadService.deleteFile(bucket, filePath);
    } catch (err: any) {
      console.error('Error deleting by URL:', err);
      return { error: err.message };
    }
  },

  /**
   * Obter URL otimizada de imagem com transformação
   * (redimensionamento automático)
   */
  getOptimizedImageUrl: (url: string, width?: number, height?: number): string => {
    if (!url) return '';

    // Se já é uma URL do Supabase Storage
    if (url.includes('supabase.co/storage')) {
      const params = [];
      if (width) params.push(`width=${width}`);
      if (height) params.push(`height=${height}`);
      params.push('quality=80');

      if (params.length > 0) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}${params.join('&')}`;
      }
    }

    return url;
  },

  /**
   * Validar tipo de arquivo
   */
  validateFileType: (file: File, allowedTypes: string[]): { valid: boolean; error: string | null } => {
    if (!allowedTypes.includes(file.type)) {
      // Tentar validar pela extensão se o mime type for vazio ou estranho
      const ext = file.name.split('.').pop()?.toLowerCase();
      const videoExts = ['mp4', 'webm', 'mov'];
      const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

      if (allowedTypes.some(t => t.startsWith('video/')) && ext && videoExts.includes(ext)) {
        return { valid: true, error: null };
      }
      if (allowedTypes.some(t => t.startsWith('image/')) && ext && imageExts.includes(ext)) {
        return { valid: true, error: null };
      }

      return {
        valid: false,
        error: `Tipo de arquivo não permitido (${file.type || 'desconhecido'}). Aceitos: ${allowedTypes.join(', ')}`
      };
    }
    return { valid: true, error: null };
  },

  /**
   * Validar tamanho de arquivo
   */
  validateFileSize: (file: File, maxSizeMB: number): { valid: boolean; error: string | null } => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo permitido: ${maxSizeMB}MB`
      };
    }
    return { valid: true, error: null };
  },

  /**
   * Validar imagem antes do upload
   */
  validateImage: (file: File): { valid: boolean; error: string | null } => {
    // Validar tipo
    const typeValidation = uploadService.validateFileType(file, [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif'
    ]);
    if (!typeValidation.valid) return typeValidation;

    // Validar tamanho (10MB)
    return uploadService.validateFileSize(file, 10);
  },

  /**
   * Validar vídeo antes do upload
   */
  validateVideo: (file: File): { valid: boolean; error: string | null } => {
    // Validar tipo
    const typeValidation = uploadService.validateFileType(file, [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-matroska', // .mkv
      'video/avi'
    ]);
    if (!typeValidation.valid) return typeValidation;

    // Validar tamanho (500MB)
    return uploadService.validateFileSize(file, 500);
  }
};

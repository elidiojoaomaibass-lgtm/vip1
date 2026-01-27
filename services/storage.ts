
import { Banner, VideoCard, PromoCard, Notice } from '../types';
import { supabase } from './supabase';

const BANNERS_KEY = 'vh_banners';
const VIDEOS_KEY = 'vh_videos';
const PROMO_KEY = 'vh_promo';
const BOTTOM_PROMO_KEY = 'vh_bottom_promo';
const NOTICES_KEY = 'vh_notices';

// Dados vazios para produção
const DEFAULT_BANNERS: Banner[] = [];
const DEFAULT_VIDEOS: VideoCard[] = [];
const DEFAULT_NOTICES: Notice[] = [];

const DEFAULT_PROMO: PromoCard = {
  title: '',
  description: '',
  buttonText: '',
  buttonLink: '',
  isActive: false
};

const DEFAULT_BOTTOM_PROMO: PromoCard = {
  title: '',
  description: '',
  buttonText: '',
  buttonLink: '',
  isActive: false
};

const safeSaveLocal = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`[Storage] Storage limit exceeded for ${key}.`);
  }
};

// ==========================================
// HELPERS DE MAPEAMENTO (CamelCase <-> SnakeCase)
// ==========================================

const mapBannerToDb = (b: Banner, index: number) => ({
  id: b.id,
  image_url: b.imageUrl,
  link: b.link,
  button_text: b.buttonText,
  type: b.type || 'image',
  sort_order: index,
  updated_at: new Date().toISOString()
});

const mapBannerFromDb = (b: any): Banner => ({
  id: b.id,
  imageUrl: b.image_url,
  link: b.link,
  buttonText: b.button_text,
  type: b.type
});

const mapVideoToDb = (v: VideoCard, index: number) => ({
  id: v.id,
  title: v.title,
  cover_url: v.coverUrl,
  previews: v.previews,
  buy_link: v.buyLink,
  buy_button_text: v.buyButtonText,
  telegram_link: v.telegramLink,
  telegram_button_text: v.telegramButtonText,
  sort_order: index,
  updated_at: new Date().toISOString()
});

const mapVideoFromDb = (v: any): VideoCard => ({
  id: v.id,
  title: v.title,
  coverUrl: v.cover_url,
  previews: v.previews || [],
  buyLink: v.buy_link,
  buyButtonText: v.buy_button_text,
  telegramLink: v.telegram_link,
  telegramButtonText: v.telegram_button_text
});

const mapNoticeToDb = (n: Notice, index: number) => ({
  id: n.id,
  title: n.title,
  content: n.content,
  date: n.date,
  sort_order: index,
  updated_at: new Date().toISOString()
});

const mapNoticeFromDb = (n: any): Notice => ({
  id: n.id,
  title: n.title,
  content: n.content,
  date: n.date,
  sort_order: n.sort_order
});

const mapPromoToDb = (p: PromoCard, id: string) => ({
  id: id,
  title: p.title,
  description: p.description,
  button_text: p.buttonText,
  button_link: p.buttonLink,
  is_active: p.isActive,
  updated_at: new Date().toISOString()
});

const mapPromoFromDb = (p: any): PromoCard => ({
  title: p.title || '',
  description: p.description || '',
  buttonText: p.button_text || '',
  buttonLink: p.button_link || '',
  isActive: p.is_active || false
});

export const storageService = {
  // ========== BANNERS ==========
  getBanners: async (): Promise<Banner[]> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('sort_order', { ascending: true });
        
      if (!error && data) {
        return data.map(mapBannerFromDb);
      }
    }
    const data = localStorage.getItem(BANNERS_KEY);
    return data ? JSON.parse(data) : DEFAULT_BANNERS;
  },

  saveBanners: async (banners: Banner[]) => {
    // Salvar localmente como backup/otimização
    safeSaveLocal(BANNERS_KEY, banners);
    
    if (supabase) {
      try {
        // Buscar IDs existentes para limpar deletados
        const { data: existing } = await supabase.from('banners').select('id');
        const existingIds = existing?.map(b => b.id) || [];
        
        // UPSERT todos os banners mapeados
        const payload = banners.map((b, idx) => mapBannerToDb(b, idx));
        
        if (payload.length > 0) {
          const { error } = await supabase.from('banners').upsert(payload, {
            onConflict: 'id'
          });
          if (error) console.error("Error upserting banners:", error);
        }
        
        // Deletar banners removidos
        const currentIds = banners.map(b => b.id);
        const toDelete = existingIds.filter(id => !currentIds.includes(id));
        if (toDelete.length > 0) {
          await supabase.from('banners').delete().in('id', toDelete);
        }
      } catch (err) {
        console.error("Error saving banners:", err);
      }
    }
  },

  // ========== VIDEOS ==========
  getVideos: async (): Promise<VideoCard[]> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('sort_order', { ascending: true });
        
      if (!error && data) {
        return data.map(mapVideoFromDb);
      }
    }
    const data = localStorage.getItem(VIDEOS_KEY);
    return data ? JSON.parse(data) : DEFAULT_VIDEOS;
  },

  saveVideos: async (videos: VideoCard[]) => {
    safeSaveLocal(VIDEOS_KEY, videos);
    
    if (supabase) {
      try {
        // Estratégia simples: Deletar tudo e reinserir para garantir ordem (cuidado em prod massivo, mas ok aqui)
        // Ou melhor: Upsert igual banners
        const { data: existing } = await supabase.from('videos').select('id');
        const existingIds = existing?.map(v => v.id) || [];
        
        const payload = videos.map((v, idx) => mapVideoToDb(v, idx));
        
        if (payload.length > 0) {
           const { error } = await supabase.from('videos').upsert(payload, { onConflict: 'id' });
           if (error) console.error("Error upserting videos:", error);
        }

        const currentIds = videos.map(v => v.id);
        const toDelete = existingIds.filter(id => !currentIds.includes(id));
        if (toDelete.length > 0) {
          await supabase.from('videos').delete().in('id', toDelete);
        }
      } catch (err) {
        console.error("Error saving videos:", err);
      }
    }
  },

  // ========== NOTICES ==========
  getNotices: async (): Promise<Notice[]> => {
    if (supabase) {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('sort_order', { ascending: true });
        
      if (!error && data) {
        return data.map(mapNoticeFromDb);
      }
    }
    const data = localStorage.getItem(NOTICES_KEY);
    return data ? JSON.parse(data) : DEFAULT_NOTICES;
  },

  saveNotices: async (notices: Notice[]) => {
    safeSaveLocal(NOTICES_KEY, notices);
    
    if (supabase) {
      try {
        const { data: existing } = await supabase.from('notices').select('id');
        const existingIds = existing?.map(n => n.id) || [];
        
        const payload = notices.map((n, idx) => mapNoticeToDb(n, idx));
        
        if (payload.length > 0) {
          const { error } = await supabase.from('notices').upsert(payload, { onConflict: 'id' });
          if (error) console.error("Error upserting notices:", error);
        }
        
        const currentIds = notices.map(n => n.id);
        const toDelete = existingIds.filter(id => !currentIds.includes(id));
        if (toDelete.length > 0) {
          await supabase.from('notices').delete().in('id', toDelete);
        }
      } catch (err) {
        console.error("Error saving notices:", err);
      }
    }
  },

  // ========== PROMO CARDS ==========
  getPromoCard: async (): Promise<PromoCard> => {
    // Tenta Supabase PRIMEIRO (Fonte da verdade)
    if (supabase) {
      const { data, error } = await supabase
        .from('promos')
        .select('*')
        .eq('id', 'top')
        .single();
        
      if (!error && data) {
        return mapPromoFromDb(data);
      }
    }
    
    // Fallback LocalStorage
    try {
      const stored = localStorage.getItem(PROMO_KEY);
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    
    return DEFAULT_PROMO;
  },

  savePromoCard: async (promo: PromoCard) => {
    safeSaveLocal(PROMO_KEY, promo);
    if (supabase) {
      const payload = mapPromoToDb(promo, 'top');
      const { error } = await supabase.from('promos').upsert(payload);
      if (error) console.error("Erro ao salvar Promo Top no Supabase:", error);
    }
  },

  getBottomPromoCard: async (): Promise<PromoCard> => {
    // Tenta Supabase PRIMEIRO
    if (supabase) {
      const { data, error } = await supabase
        .from('promos')
        .select('*')
        .eq('id', 'bottom')
        .single();
        
      if (!error && data) {
        return mapPromoFromDb(data);
      }
    }

    // Fallback LocalStorage
    try {
      const stored = localStorage.getItem(BOTTOM_PROMO_KEY);
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    
    return DEFAULT_BOTTOM_PROMO;
  },

  saveBottomPromoCard: async (promo: PromoCard) => {
    safeSaveLocal(BOTTOM_PROMO_KEY, promo);
    if (supabase) {
      const payload = mapPromoToDb(promo, 'bottom');
      const { error } = await supabase.from('promos').upsert(payload);
      if (error) console.error("Erro ao salvar Promo Bottom no Supabase:", error);
    }
  },
  // ========== DELETE METHODS ==========
  deleteBanner: async (id: string) => {
    if (supabase) {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (error) console.error("Error deleting banner:", error);
    }
    // Also remove from local storage
    try {
      const stored = localStorage.getItem(BANNERS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        safeSaveLocal(BANNERS_KEY, parsed.filter((b: any) => b.id !== id));
      }
    } catch(e) {}
  },

  deleteVideo: async (id: string) => {
    if (supabase) {
      const { error } = await supabase.from('videos').delete().eq('id', id);
      if (error) console.error("Error deleting video:", error);
    }
    try {
      const stored = localStorage.getItem(VIDEOS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        safeSaveLocal(VIDEOS_KEY, parsed.filter((v: any) => v.id !== id));
      }
    } catch(e) {}
  },

  deleteNotice: async (id: string) => {
    if (supabase) {
      const { error } = await supabase.from('notices').delete().eq('id', id);
      if (error) console.error("Error deleting notice:", error);
    }
    try {
      const stored = localStorage.getItem(NOTICES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        safeSaveLocal(NOTICES_KEY, parsed.filter((n: any) => n.id !== id));
      }
    } catch(e) {}
  },

  // ========== REALTIME SYNC ==========
  subscribeToChanges: (callbacks: {
    onBannersChange?: (banners: Banner[]) => void;
    onVideosChange?: (videos: VideoCard[]) => void;
    onNoticesChange?: (notices: Notice[]) => void;
    onPromosChange?: () => void;
  }) => {
    if (!supabase) return () => {};

    const channels: any[] = [];

    // Banners subscription
    if (callbacks.onBannersChange) {
      const bannersChannel = supabase
        .channel('banners-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, async () => {
          const { data } = await supabase.from('banners').select('*').order('sort_order', { ascending: true });
          if (data) {
            const mapped = data.map(mapBannerFromDb);
            safeSaveLocal(BANNERS_KEY, mapped);
            callbacks.onBannersChange!(mapped);
          }
        })
        .subscribe();
      channels.push(bannersChannel);
    }

    // Videos subscription
    if (callbacks.onVideosChange) {
      const videosChannel = supabase
        .channel('videos-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, async () => {
          const { data } = await supabase.from('videos').select('*').order('sort_order', { ascending: true });
          if (data) {
            const mapped = data.map(mapVideoFromDb);
            safeSaveLocal(VIDEOS_KEY, mapped);
            callbacks.onVideosChange!(mapped);
          }
        })
        .subscribe();
      channels.push(videosChannel);
    }

    // Notices subscription
    if (callbacks.onNoticesChange) {
      const noticesChannel = supabase
        .channel('notices-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notices' }, async () => {
          const { data } = await supabase.from('notices').select('*').order('sort_order', { ascending: true });
          if (data) {
            const mapped = data.map(mapNoticeFromDb);
            safeSaveLocal(NOTICES_KEY, mapped);
            callbacks.onNoticesChange!(mapped);
          }
        })
        .subscribe();
      channels.push(noticesChannel);
    }

    // Promos subscription
    if (callbacks.onPromosChange) {
      const promosChannel = supabase
        .channel('promos-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'promos' }, () => {
          // Apenas notifica que mudou, o app recarrega os dados
          callbacks.onPromosChange!();
        })
        .subscribe();
      channels.push(promosChannel);
    }

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }
};

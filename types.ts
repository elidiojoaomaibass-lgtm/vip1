
export interface Banner {
  id: string;
  images: string[]; // URLs das imagens ou vídeos
  link: string;
  buttonText: string;
  type?: 'image' | 'video';
}

export interface PromoCard {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  isActive: boolean;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
  sort_order?: number;
}

export interface VideoCard {
  id: string;
  title?: string;
  coverUrl: string;
  previews: string[]; // Max 3 preview URLs
  buyLink?: string;
  buyButtonText?: string;
  telegramLink?: string;
  telegramButtonText?: string;
}

export type View = 'home' | 'admin' | 'video-detail' | 'notice' | 'login';

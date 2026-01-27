
import React, { useState, useEffect, useRef } from 'react';
import { Banner, VideoCard, PromoCard } from '../types';
import { Play, ExternalLink, Send, Pause, Volume2, VolumeX, ShoppingCart, Sparkles, Eye } from 'lucide-react';

interface VideoPlayerProps {
  video: VideoCard;
  isDarkMode: boolean;
}

const VideoFeedItem: React.FC<VideoPlayerProps> = ({ video, isDarkMode }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  const [views, setViews] = useState(() => Math.floor(Math.random() * 800) + 150);
  const [sales, setSales] = useState(() => Math.floor(Math.random() * 120) + 45);

  const videoUrl = video.previews && video.previews.length > 0 ? video.previews[0] : '';

  useEffect(() => {
    const viewInterval = setInterval(() => {
      setViews(prev => prev + Math.floor(Math.random() * 4) + 1);
    }, 4500);

    const salesInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setSales(prev => prev + 1);
      }
    }, 15000);

    return () => {
      clearInterval(viewInterval);
      clearInterval(salesInterval);
    };
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className={`p-4 rounded-2xl border transition-all duration-500 group animate-in fade-in slide-in-from-bottom-4 shadow-sm ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-100'}`}>
      <div 
        className={`relative aspect-video rounded-2xl overflow-hidden shadow-md bg-black border transition-all ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}
        onClick={togglePlay}
      >
        <video 
          ref={videoRef}
          src={videoUrl} 
          poster={video.coverUrl}
          playsInline 
          className="w-full h-full object-contain"
          onEnded={() => setIsPlaying(false)}
        />
        
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 scale-90 group-hover:scale-100 transition-transform">
              <Play size={28} fill="white" className="ml-1" />
            </div>
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex gap-1.5">
            <button 
              onClick={togglePlay}
              className="p-2 bg-black/60 backdrop-blur-md rounded-xl text-white hover:bg-violet-600 transition-colors"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} fill="white" />}
            </button>
            <button 
              onClick={toggleMute}
              className="p-2 bg-black/60 backdrop-blur-md rounded-xl text-white hover:bg-violet-600 transition-colors"
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <h3 className={`text-base font-black uppercase tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          {video.title || 'PREMIUM PACK'}
        </h3>
        
        <div className="flex items-center gap-4 py-1">
          <div className="flex items-center gap-1.5">
            <Eye size={12} className="text-zinc-400" />
            <span className={`text-[11px] font-normal ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              <span className="tabular-nums">{views}</span> <span className="font-bold">Views</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShoppingCart size={12} className="text-emerald-500" />
            <span className={`text-[11px] font-normal ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              <span className="tabular-nums">{sales}</span> <span className="font-bold">Sales</span>
            </span>
          </div>
        </div>
      </div>

      {(video.buyLink || video.telegramLink) && (
        <div className="flex gap-2 mt-4">
          {video.buyLink && (
            <a 
              href={video.buyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
            >
              <ShoppingCart size={14} />
              {video.buyButtonText || 'BUY ALL PACK'}
            </a>
          )}
          {video.telegramLink && (
            <a 
              href={video.telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all active:scale-[0.98] ${isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700' : 'bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200'}`}
            >
              <Send size={14} className="text-sky-500" />
              {video.telegramButtonText || 'DM TELEGRAM'}
            </a>
          )}
        </div>
      )}
    </div>
  );
};

interface Props {
  banners: Banner[];
  videos: VideoCard[];
  promoCard: PromoCard;
  bottomPromoCard?: PromoCard;
  isDarkMode: boolean;
  isLoading?: boolean;
}



export const HomeView: React.FC<Props> = ({ 
  banners, 
  videos, 
  promoCard, 
  bottomPromoCard, 
  isDarkMode,
  isLoading = false 
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const autoPlayRef = useRef<any>(null);

  useEffect(() => {
    if (isLoading || banners.length <= 1) return;

    const startAutoPlay = () => {
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % banners.length);
      }, 5000);
    };

    startAutoPlay();

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [banners.length, isLoading]);

  const hasValidLink = (link: string | undefined) => {
    if (!link) return false;
    const trimmed = link.trim();
    return trimmed !== '' && trimmed !== '#' && trimmed !== 'https://' && trimmed !== 'http://';
  };

  const validBanners = (banners || []).filter(b => b.imageUrl);



  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <section className="px-4 pt-4 relative w-full min-h-[40px]">
        {validBanners.length > 0 ? (
          <div className={`relative overflow-hidden rounded-3xl shadow-xl aspect-video ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
            <div 
              className="flex h-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {validBanners.map((banner) => {
                const isVideo = banner.imageUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i) || (banner.type === 'video' && !banner.imageUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i));
                
                return (
                <div key={banner.id} className="min-w-full h-full relative flex flex-col items-center overflow-hidden">
                  {isVideo ? (
                    <video src={banner.imageUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img 
                      src={banner.imageUrl} 
                      alt="Banner" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/600x400/1e1e1e/FFF?text=Image+Error';
                      }}
                    />
                  )}
                  {hasValidLink(banner.link) && (
                    <div className="absolute inset-0 flex flex-col justify-end p-6 bg-gradient-to-t from-black/70 via-transparent to-transparent">
                      <div className="animate-in slide-in-from-bottom-4 duration-500">
                        <a href={banner.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-violet-600/30 transition-all active:scale-95 group">
                          {banner.buttonText}
                          <ExternalLink size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
              })}
            </div>
            {validBanners.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
                {validBanners.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-6 bg-violet-600' : 'w-1.5 bg-white/40'}`} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={`w-full aspect-video rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-zinc-500 gap-2 transition-colors ${isDarkMode ? 'bg-zinc-800/10 border-zinc-800/30' : 'bg-zinc-50 border-zinc-200'}`}>
            <Sparkles size={20} className="opacity-20" />
            <p className="text-[9px] font-black uppercase tracking-widest opacity-40">No active banners</p>
          </div>
        )}
      </section>

      {promoCard.isActive && (
        <section className="px-4">
          <div className={`p-6 rounded-3xl border transition-all shadow-xl ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-100'}`}>
             <div className="flex items-center gap-2 mb-3">
               <h3 className={`font-black text-sm uppercase tracking-[0.2em] ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{promoCard.title}</h3>
             </div>
             <p className={`text-xs leading-relaxed mb-6 font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
               {promoCard.description}
             </p>
             <a href={promoCard.buttonLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full py-4 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-[0.98] shadow-lg">
               {promoCard.buttonText}
             </a>
          </div>
        </section>
      )}

      <section className="px-6 py-2 text-center">
        <h1 className={`text-2xl font-black tracking-tighter leading-tight uppercase ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          All packages available<br />
          <span className="text-violet-600 text-sm font-bold tracking-normal italic opacity-90">Click to view previews</span>
        </h1>
      </section>

      <section className="px-4">
        <div className="flex flex-col gap-8">
          {(videos || []).map((video) => (
            <VideoFeedItem key={video.id} video={video} isDarkMode={isDarkMode} />
          ))}
        </div>
      </section>

      {bottomPromoCard?.isActive && (
        <section className="px-4 pt-4 pb-12">
          <div className={`p-6 rounded-3xl border transition-all shadow-xl ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-100'}`}>
             <div className="flex items-center gap-2 mb-3">
               <h3 className={`font-black text-sm uppercase tracking-[0.2em] ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{bottomPromoCard.title}</h3>
             </div>
             <p className={`text-xs leading-relaxed mb-6 font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
               {bottomPromoCard.description}
             </p>
             <a href={bottomPromoCard.buttonLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full py-4 bg-violet-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-[0.98] shadow-lg shadow-violet-600/20">
               {bottomPromoCard.buttonText}
               <ExternalLink size={14} className="opacity-70" />
             </a>
          </div>
        </section>
      )}
    </div>
  );
};

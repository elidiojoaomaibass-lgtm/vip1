
import React, { useState, useEffect, useRef } from 'react';
import { Banner, VideoCard, PromoCard, PhotoCard, GlobalSettings } from '../types';
import { Play, ExternalLink, Send, Pause, Volume2, VolumeX, ShoppingCart, Sparkles, Eye, X, CreditCard, Gift, Bitcoin, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Skeleton } from './Skeleton';

// ─── Payment Methods Modal ────────────────────────────────────────────────────

interface PaymentMethod {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  badge?: string;
}

const convertPriceToBRL = (priceStr?: string) => {
  if (!priceStr) return '';
  const num = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return priceStr;
  // Assume a taxa de 5.00 BRL para 1 USD
  return `R$ ${(num * 5.0).toFixed(2).replace('.', ',')}`;
};

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'gift_card',
    label: 'Gift Card',
    icon: <Gift className="w-5 h-5" />,
    color: 'text-white',
    gradientFrom: '#EC4899',
    gradientTo: '#BE185D',
  },
  {
    id: 'paypal',
    label: 'PayPal',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M19.554 9.488c.121.563.106 1.246-.04 2.051-.582 2.978-2.485 4.45-5.765 4.45H13.1a.705.705 0 0 0-.637.407l-.803 4.96-.227 1.402a.37.37 0 0 1-.366.31H8.517a.353.353 0 0 1-.348-.407l.099-.607.96-6.07.062-.344a.705.705 0 0 1 .636-.407h1.29c2.962 0 5.021-1.317 5.762-4.164.301-1.122.332-2.123.154-2.967.44.155.806.45 1.077.854.308.45.488 1.025.547 1.532z"/>
        <path d="M18.27 6.705a5.345 5.345 0 0 0-.886-.067H12.04c-.295 0-.55.19-.625.477l-1.27 7.808c-.05.314.187.592.5.592h2.972l.745-4.72.024-.163a.645.645 0 0 1 .625-.477h1.303c2.552 0 4.55-1.037 5.131-4.04a3.8 3.8 0 0 0-.079-2.143 2.8 2.8 0 0 0-1.25-.903 4.5 4.5 0 0 0-.946-.364z"/>
        <path d="M10.64 6.715a.645.645 0 0 1 .625-.477h5.343c.633 0 1.22.04 1.757.126a5.04 5.04 0 0 1 .886.272A3.6 3.6 0 0 1 20.5 7.7c.318-2.025-.003-3.405-1.094-4.652C18.265 1.746 16.276 1 13.77 1H6.862a.725.725 0 0 0-.715.613L3.017 20.238a.436.436 0 0 0 .431.505h3.141l1.256-7.972 1.795-6.056z"/>
      </svg>
    ),
    color: 'text-white',
    gradientFrom: '#003087',
    gradientTo: '#009cde',
    badge: 'Seguro',
  },
  {
    id: 'cashapp_bitcoin',
    label: 'CashApp',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M14.25 2.5a.75.75 0 0 0-1.5 0V4h-1.5c-2.071 0-3.75 1.679-3.75 3.75 0 2.013 1.595 3.657 3.587 3.743L12 11.5h1.5v3H12a2.25 2.25 0 0 1-2.25-2.25.75.75 0 0 0-1.5 0A3.75 3.75 0 0 0 12 16h.75v1.5a.75.75 0 0 0 1.5 0V16h.75A3.75 3.75 0 0 0 18.75 12.25c0-2.013-1.595-3.657-3.587-3.744L14.25 8.5H12.75V5.5H14a2.25 2.25 0 0 1 2.25 2.25.75.75 0 0 0 1.5 0A3.75 3.75 0 0 0 14 2.5h-.75V1a.75.75 0 0 0-1.5 0v1.5z"/>
      </svg>
    ),
    color: 'text-white',
    gradientFrom: '#00D632',
    gradientTo: '#00a028',
  },
  {
    id: 'binance',
    label: 'Binance',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 1.5L8.25 5.25 12 9l3.75-3.75L12 1.5zM6 7.5L2.25 11.25 6 15l3.75-3.75L6 7.5zm12 0l-3.75 3.75L18 15l3.75-3.75L18 7.5zM12 13.5l-3.75 3.75L12 21l3.75-3.75L12 13.5z"/>
      </svg>
    ),
    color: 'text-[#1E2026]',
    gradientFrom: '#F3BA2F',
    gradientTo: '#d4a017',
    badge: 'Crypto',
  },
  {
    id: 'pix',
    label: 'Pix',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2.2c-.4 0-.8.1-1.1.4L1.7 10.9c-.6.6-.6 1.5 0 2.1l9.2 8.3c.3.3.7.4 1.1.4s.8-.1 1.1-.4l9.2-8.3c.6-.6.6-1.5 0-2.1L13.1 2.6c-.3-.3-.7-.4-1.1-.4zm0 3.2L19.4 12 12 18.6 4.6 12 12 5.4zm0 2.3L7.7 12l4.3 4.3 4.3-4.3L12 7.7z"/>
      </svg>
    ),
    color: 'text-emerald-500',
    gradientFrom: '#10b981',
    gradientTo: '#059669',
    badge: 'Instantâneo',
  },
  {
    id: 'crypto',
    label: 'Crypto',
    icon: <Bitcoin className="w-5 h-5" />,
    color: 'text-white',
    gradientFrom: '#7C3AED',
    gradientTo: '#4F46E5',
    badge: 'Any coin',
  },
  {
    id: 'credit_debit_card',
    label: 'Credit or Debit Card',
    icon: <CreditCard className="w-5 h-5" />,
    color: 'text-white',
    gradientFrom: '#0EA5E9',
    gradientTo: '#0284C7',
  },
];

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  telegramLink: string;
  itemName: string;
  itemPrice?: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, isDarkMode, telegramLink, itemName, itemPrice }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelected(null);
      setConfirming(false);
    }
  }, [isOpen]);

  const handleSelect = (methodId: string) => {
    setSelected(methodId);
  };

  const handleConfirm = () => {
    if (!selected) return;
    const method = PAYMENT_METHODS.find(m => m.id === selected);
    if (!method) return;

    setConfirming(true);
    const cleanUrl = ensureAbsoluteUrl(telegramLink);
    const isPix = method.id === 'pix';
    const priceText = itemPrice ? ` (${isPix ? convertPriceToBRL(itemPrice) : itemPrice})` : '';
    const message = isPix
      ? `Olá! 👋\n\nEu quero comprar "${itemName}"${priceText}.\n\n💵 Forma de pagamento: ${method.label}\n\nPor favor, envie as instruções de pagamento. 🚀`
      : `Hi! 👋\n\nI want to buy "${itemName}"${priceText}.\n\n💵 Payment method: ${method.label}\n\nPlease provide payment instructions. 🚀`;
    const finalUrl = `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}text=${encodeURIComponent(message)}`;

    setTimeout(() => {
      window.open(finalUrl, '_blank', 'noopener,noreferrer');
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Sheet */}
      <div
        className={`relative w-full max-w-lg rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-8 duration-300 ${
          isDarkMode ? 'bg-zinc-950 border-t border-zinc-800' : 'bg-white border-t border-zinc-100'
        }`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className={`w-10 h-1 rounded-full ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-200'}`} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-4">
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${
              isDarkMode ? 'text-zinc-500' : 'text-zinc-400'
            }`}>{selected === 'pix' ? 'Checkout Seguro' : 'Secure Checkout'}</p>
            <h2 className={`text-lg font-black tracking-tight ${
              isDarkMode ? 'text-white' : 'text-zinc-900'
            }`}>{selected === 'pix' ? '💵 Forma de Pagamento' : '💵 Payment Method'}</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDarkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Item info */}
        <div className={`mx-5 mb-4 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between ${
          isDarkMode ? 'bg-zinc-900 text-zinc-300' : 'bg-zinc-50 text-zinc-600'
        }`}>
          <span className="truncate mr-3 uppercase tracking-wide">{itemName}</span>
          {itemPrice && (
            <span className="text-violet-500 font-black shrink-0">{selected === 'pix' ? convertPriceToBRL(itemPrice) : itemPrice}</span>
          )}
        </div>

        {/* Payment methods list */}
        <div className="px-5 pb-2 flex flex-col gap-2.5 max-h-[50vh] overflow-y-auto">
          {PAYMENT_METHODS.map((method) => {
            const isActive = selected === method.id;
            return (
              <button
                key={method.id}
                onClick={() => handleSelect(method.id)}
                className={`relative flex items-center gap-4 p-3.5 rounded-2xl border-2 transition-all duration-200 text-left ${
                  isActive
                    ? 'border-violet-500 shadow-lg shadow-violet-500/20 scale-[1.01]'
                    : isDarkMode
                      ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/60'
                      : 'border-zinc-100 hover:border-zinc-200 bg-white'
                }`}
              >
                {/* Icon pill */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                  style={{ background: `linear-gradient(135deg, ${method.gradientFrom}, ${method.gradientTo})` }}
                >
                  <span className={method.color}>{method.icon}</span>
                </div>

                {/* Label */}
                <div className="flex-1 min-w-0">
                  <p className={`font-black text-sm tracking-tight ${
                    isDarkMode ? 'text-white' : 'text-zinc-900'
                  }`}>{method.label}</p>
                  {method.badge && (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-violet-400">{method.badge}</span>
                  )}
                </div>

                {/* Check or arrow */}
                {isActive ? (
                  <CheckCircle2 className="text-violet-500 shrink-0" size={20} />
                ) : (
                  <ChevronRight className={`shrink-0 opacity-30 ${
                    isDarkMode ? 'text-white' : 'text-zinc-900'
                  }`} size={18} />
                )}
              </button>
            );
          })}
        </div>

        {/* Confirm CTA */}
        <div className="px-5 pt-4 pb-8">
          <button
            onClick={handleConfirm}
            disabled={!selected || confirming}
            className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 ${
              selected && !confirming
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xl shadow-violet-600/30 active:scale-[0.98] hover:from-violet-500 hover:to-indigo-500'
                : isDarkMode
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
            }`}
          >
            {confirming ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                {selected === 'pix' ? 'Redirecionando...' : 'Redirecting...'}
              </>
            ) : (
              <>
                <Send size={14} />
                {selected 
                  ? (selected === 'pix' ? `Pagar com ${PAYMENT_METHODS.find(m => m.id === selected)?.label}` : `Pay with ${PAYMENT_METHODS.find(m => m.id === selected)?.label}`) 
                  : 'Select a payment method'}
              </>
            )}
          </button>
          <p className={`text-center text-[9px] mt-3 font-medium ${
            isDarkMode ? 'text-zinc-600' : 'text-zinc-400'
          }`}>{selected === 'pix' ? '🔒 Você será redirecionado para o nosso Telegram seguro para concluir o pedido' : "🔒 You'll be redirected to our secure Telegram to complete the order"}</p>
        </div>
      </div>
    </div>
  );
};

const ensureAbsoluteUrl = (url: string): string => {
  if (!url) return '';
  const trimmed = url.trim();

  // Já tem protocolo completo (https://t.me/... ou https://...)
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // Começa com t.me/ ou telegram.me/ sem protocolo
  if (/^(t\.me|telegram\.me)\//i.test(trimmed)) return `https://${trimmed}`;

  // Username com @ (ex: @elite_18_vip)
  if (trimmed.startsWith('@')) return `https://t.me/${trimmed.slice(1)}`;

  // Username puro sem @ e sem domínio (ex: elite_18_vip)
  // Detecta: só letras, números e underscores — típico de username do Telegram
  if (/^[a-zA-Z0-9_]{3,}$/.test(trimmed)) return `https://t.me/${trimmed}`;

  // Fallback: adiciona https:// e deixa o browser decidir
  return `https://${trimmed}`;
};

const getTelegramUrlWithMessage = (url?: string, buttonText?: string, folderName?: string, folderPrice?: string) => {
  if (!url) return '';
  const cleanUrl = ensureAbsoluteUrl(url);
  if (!cleanUrl.toLowerCase().includes('t.me') && !cleanUrl.toLowerCase().includes('telegram')) return cleanUrl;
  if (cleanUrl.toLowerCase().includes('text=')) return cleanUrl;
  
  if (buttonText?.toUpperCase().trim() === 'PAY PROMOTION $289') {
    const message = `Hi! 👋\n\nI'm interested in taking advantage of this opportunity and securing lifetime access to over 40 exclusive packages and the VIP group.\n\nI see the price is US$289. Can you explain how I can make the payment and activate access? 🚀`;
    return `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}text=${encodeURIComponent(message)}`;
  }

  if (folderName) {
    const priceText = folderPrice ? ` (for ${folderPrice})` : '';
    const message = `Hello! I want to buy "${folderName}🔥" ${priceText}. Please provide payment instructions.`;
    return `${cleanUrl}${cleanUrl.includes('?') ? '&' : '?'}text=${encodeURIComponent(message)}`;
  }

  return cleanUrl;
};

// ─── VideoFeedItem ────────────────────────────────────────────────────────────

interface VideoPlayerProps {
  video: VideoCard;
  isDarkMode: boolean;
  globalSettings?: GlobalSettings;
}

const VideoFeedItem: React.FC<VideoPlayerProps> = ({ video, isDarkMode, globalSettings }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  const [views, setViews] = useState(() => Math.floor(Math.random() * 800) + 150);
  const [sales, setSales] = useState(() => Math.floor(Math.random() * 120) + 45);

  // Garantir que previews seja um array válido
  const validPreviews = Array.isArray(video.previews)
    ? video.previews.filter(url => url && url.length > 0)
    : [];

  const currentVideoUrl = validPreviews.length > 0
    ? validPreviews[currentPreviewIndex]
    : '';

  const isUrlImage = (url: string) => {
    return url.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i);
  };

  const isCurrentPreviewImage = isUrlImage(currentVideoUrl);

  useEffect(() => {
    // Resetar índice quando o vídeo mudar
    setCurrentPreviewIndex(0);
  }, [video.id]);

  useEffect(() => {
    // Se mudar o índice e estiver tocando, carregar e tocar o próximo
    if (isPlaying && videoRef.current && !isCurrentPreviewImage) {
      videoRef.current.src = currentVideoUrl;
      videoRef.current.play().catch(() => setIsPlaying(false));
    }

    // Se for imagem e estiver "tocando", podemos simular um tempo e pular
    if (isPlaying && isCurrentPreviewImage) {
      const timer = setTimeout(() => {
        handleVideoEnd();
      }, 3000); // Fica 3 segundos na imagem
      return () => clearTimeout(timer);
    }
  }, [currentPreviewIndex, currentVideoUrl, isPlaying, isCurrentPreviewImage]);

  const handleVideoEnd = () => {
    if (validPreviews.length > 1) {
      if (currentPreviewIndex < validPreviews.length - 1) {
        // Se não for o último, avança
        setCurrentPreviewIndex(currentPreviewIndex + 1);
      } else {
        // Se for o último, para e volta para o primeiro (sem tocar)
        setIsPlaying(false);
        setCurrentPreviewIndex(0);
      }
    } else {
      setIsPlaying(false);
    }
  };

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

  const [progress, setProgress] = useState(0);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      const currentTime = videoRef.current.currentTime;
      if (duration > 0) {
        setProgress((currentTime / duration) * 100);
      }
    }
  };

  return (
    <div className={`p-4 rounded-2xl border transition-all duration-500 group animate-in fade-in slide-in-from-bottom-4 shadow-sm ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-100'}`}>
      <div
        className={`relative aspect-video rounded-2xl overflow-hidden shadow-md bg-black border transition-all ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}
        onClick={togglePlay}
      >
        {isCurrentPreviewImage ? (
          <img
            src={currentVideoUrl}
            className="w-full h-full object-contain bg-black"
            alt="Preview"
          />
        ) : (
          <video
            ref={videoRef}
            src={currentVideoUrl}
            // Only show poster if not playing (prevents flicker between videos)
            poster={!isPlaying ? video.coverUrl : undefined}
            playsInline
            muted={isMuted}
            className="w-full h-full object-contain bg-black"
            onEnded={handleVideoEnd}
            onTimeUpdate={handleTimeUpdate}
          />
        )}

        {/* Indicadores de Progresso (Story-like) */}
        {isPlaying && validPreviews.length > 1 && (
          <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
            {validPreviews.map((_, idx) => (
              <div
                key={idx}
                className="h-0.5 rounded-full flex-1 bg-white/20 overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-all duration-100 ease-linear"
                  style={{
                    width: idx < currentPreviewIndex ? '100%' : idx === currentPreviewIndex ? `${isCurrentPreviewImage ? '100' : progress}%` : '0%',
                    transition: (idx === currentPreviewIndex && isCurrentPreviewImage) ? 'width 3s linear' : 'none'
                  }}
                />
              </div>
            ))}
          </div>
        )}

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

      {(video.buyLink || video.telegramLink || globalSettings?.globalTelegramLink) && (
        <BuyButtonWithModal item={video} isDarkMode={isDarkMode} globalTelegramLink={globalSettings?.globalTelegramLink} />
      )}
    </div>
  );
};

// ─── PhotoFeedItem ──────────────────────────────────────────────────────────────
interface PhotoFeedItemProps {
  photo: PhotoCard;
  isDarkMode: boolean;
  globalSettings?: GlobalSettings;
}

const PhotoFeedItem: React.FC<PhotoFeedItemProps> = ({ photo, isDarkMode, globalSettings }) => {
  const [views, setViews] = useState(Math.floor(Math.random() * 5000) + 1000);
  const [sales, setSales] = useState(Math.floor(Math.random() * 100) + 10);

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

  return (
    <div className={`p-4 rounded-2xl border transition-all duration-500 group animate-in fade-in slide-in-from-bottom-4 shadow-sm ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-100'}`}>
      <div className={`relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md bg-black border transition-all ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
        <img src={photo.photoUrl} className="w-full h-full object-contain bg-black" alt="Preview" />
      </div>

      <div className="mt-4 space-y-1">
        <h3 className={`text-base font-black uppercase tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          {photo.title || 'PREMIUM PHOTO'}
        </h3>
        {photo.description && (
          <p className={`text-xs ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>{photo.description}</p>
        )}

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

      {(photo.buyLink || photo.telegramLink || globalSettings?.globalTelegramLink) && (
        <BuyButtonWithModal item={photo} isDarkMode={isDarkMode} globalTelegramLink={globalSettings?.globalTelegramLink} />
      )}
    </div>
  );
};

// ─── BuyButtonWithModal ───────────────────────────────────────────────────────

interface BuyButtonWithModalProps {
  item: VideoCard | PhotoCard;
  isDarkMode: boolean;
  globalTelegramLink?: string;
}

const BuyButtonWithModal: React.FC<BuyButtonWithModalProps> = ({ item, isDarkMode, globalTelegramLink }) => {
  const [modalOpen, setModalOpen] = useState(false);

  // Use individual telegramLink or fallback to globalTelegramLink
  const telegramLink = item.telegramLink || globalTelegramLink || '';

  // Show BUY button only when there's a telegram link to send the order to
  const hasTelegramLink = !!telegramLink;

  return (
    <>
      <div className="flex gap-2 mt-4">
        {/* BUY button → opens payment method modal (only if telegramLink exists) */}
        {hasTelegramLink && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-red-600/20"
          >
            <ShoppingCart size={14} />
            {item.buyButtonText || 'BUY NOW'}
          </button>
        )}


      </div>

      {hasTelegramLink && (
        <PaymentModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          isDarkMode={isDarkMode}
          telegramLink={telegramLink}
          itemName={item.title || 'PREMIUM PACK'}
          itemPrice={item.price}
        />
      )}
    </>
  );
};

// ─── HomeView Props ───────────────────────────────────────────────────────────

interface Props {
  banners: Banner[];
  videos: VideoCard[];
  photos: PhotoCard[];
  promoCard: PromoCard;
  bottomPromoCard?: PromoCard;
  globalSettings?: GlobalSettings;
  isDarkMode: boolean;
  isLoading?: boolean;
}


const PurchaseToast: React.FC<{ isDarkMode: boolean; videos: VideoCard[] }> = ({ isDarkMode, videos }) => {
  const [show, setShow] = useState(false);
  const [purchase, setPurchase] = useState<{ name: string; folder: string; time: string } | null>(null);

  const names = [
    'John D.', 'David R.', 'Michael S.', 'James B.', 'Robert L.', 
    'Thomas H.', 'Tyler B.', 'Kevin J.', 'Mark W.', 'Aarav P.',
    'Arjun M.', 'Rahul G.', 'Sai K.', 'Ishaan V.', 'Advait R.',
    'Hans G.', 'Erik S.', 'Paolo M.', 'Marco F.', 'Chris T.'
  ];

  const times = ['just now', '2 mins ago', '5 mins ago', '10 mins ago', '1 min ago'];

  useEffect(() => {
    const triggerNotification = () => {
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomTime = times[Math.floor(Math.random() * times.length)];
      
      let randomFolder = 'VIP ACCESS';
      if (videos && videos.length > 0) {
        const randomVideo = videos[Math.floor(Math.random() * videos.length)];
        randomFolder = randomVideo.title || 'PREMIUM PACK';
      }

      setPurchase({ name: randomName, folder: randomFolder, time: randomTime });
      setShow(true);

      setTimeout(() => setShow(false), 6000);
    };

    const initialDelay = setTimeout(triggerNotification, 10000);

    const interval = setInterval(() => {
      triggerNotification();
    }, Math.floor(Math.random() * 20000) + 30000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [videos]);

  if (!purchase) return null;

  return (
    <div className={`fixed bottom-24 left-4 right-4 md:left-6 md:right-auto md:max-w-xs z-[100] transition-all duration-700 transform ${show ? 'translate-x-0 opacity-100 scale-100' : '-translate-x-full opacity-0 scale-90'}`}>
      <div className={`p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center gap-4 ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/90 border-zinc-100'}`}>
        <div className="w-12 h-12 rounded-xl bg-violet-600/10 flex items-center justify-center text-violet-500 shadow-inner">
          <ShoppingCart size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{purchase.name}</span>
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className={`text-[11px] font-medium truncate ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Purchased <span className="text-violet-500 font-bold">{purchase.folder}</span>
          </p>
          <p className="text-[9px] text-zinc-500 mt-0.5 font-bold uppercase tracking-tighter opacity-70 italic">{purchase.time}</p>
        </div>
        <button onClick={() => setShow(false)} className="p-1 text-zinc-500 hover:text-zinc-400 transition-colors">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export const HomeView: React.FC<Props> = ({
  banners,
  videos,
  photos,
  promoCard,
  bottomPromoCard,
  globalSettings,
  isDarkMode,
  isLoading = false
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const autoPlayRef = useRef<any>(null);
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [bottomPromoModalOpen, setBottomPromoModalOpen] = useState(false);

  const allSlides = React.useMemo(() => {
    const validBanners = (banners || []).filter(b => b.images && b.images.length > 0);
    return validBanners.flatMap(b => b.images.map((img, idx) => ({
      ...b,
      imageUrl: img,
      slideId: `${b.id}-${idx}`
    })));
  }, [banners]);

  useEffect(() => {
    // Reset slide index if out of bounds
    if (currentSlide >= allSlides.length && allSlides.length > 0) {
      setCurrentSlide(0);
    }
  }, [allSlides.length, currentSlide]);

  useEffect(() => {
    if (isLoading || allSlides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % allSlides.length);
    }, 4000); // 4 segundos para uma navegação mais dinâmica

    return () => clearInterval(interval);
  }, [allSlides.length, isLoading]);

  const hasValidLink = (link: string | undefined) => {
    if (!link) return false;
    const trimmed = link.trim();
    return trimmed !== '' && trimmed !== '#' && trimmed !== 'https://' && trimmed !== 'http://';
  };

  // Removido filter redundante pois já foi feito acima

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Banner Skeleton */}
        <section className="px-4 pt-4 relative w-full">
          <Skeleton className="w-full aspect-video rounded-3xl" isDarkMode={isDarkMode} />
        </section>

        {/* Promo Skeleton */}
        <section className="px-4">
          <Skeleton className="h-40 w-full rounded-3xl" isDarkMode={isDarkMode} />
        </section>

        {/* Title Skeleton */}
        <section className="px-6 py-2 flex flex-col items-center gap-2">
          <Skeleton className="h-8 w-48 rounded-lg" isDarkMode={isDarkMode} />
          <Skeleton className="h-4 w-32 rounded-lg" isDarkMode={isDarkMode} />
        </section>

        {/* Video Grid Skeleton */}
        <section className="px-4">
          <div className="flex flex-col gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`p-4 rounded-2xl border ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                <Skeleton className="w-full aspect-video rounded-2xl mb-4" isDarkMode={isDarkMode} />
                <Skeleton className="h-6 w-3/4 rounded-lg mb-2" isDarkMode={isDarkMode} />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-1/4 rounded-lg" isDarkMode={isDarkMode} />
                  <Skeleton className="h-4 w-1/4 rounded-lg" isDarkMode={isDarkMode} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <section className="px-4 pt-4 relative w-full min-h-[40px]">
        {allSlides.length > 0 ? (
          <div className={`relative overflow-hidden rounded-3xl shadow-xl aspect-video ${isDarkMode ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
            {allSlides.length > 1 && (
              <div className="absolute top-4 left-4 right-4 flex gap-1.5 z-20">
                {allSlides.map((_, i) => (
                  <div key={i} className="h-1 rounded-full flex-1 bg-white/20 overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-[4000ms] ease-linear"
                      style={{
                        width: i === currentSlide ? '100%' : i < currentSlide ? '100%' : '0%',
                        transition: i === currentSlide ? 'width 4000ms linear' : 'none'
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            <div
              className="flex h-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {allSlides.map((banner) => {
                const isVideo = banner.imageUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i) || (banner.type === 'video' && !banner.imageUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i));

                return (
                  <div key={banner.slideId} className="min-w-full h-full relative flex flex-col items-center overflow-hidden">
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
                          <a href={getTelegramUrlWithMessage(banner.link, banner.buttonText, banner.buttonText, banner.price)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-600/30 transition-all active:scale-95 group">
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
            {/* Indicadores de bolinha removidos em favor da barra de progresso superior style Instagram Stories */}
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
            <button
              onClick={() => setPromoModalOpen(true)}
              className="flex items-center justify-center gap-3 w-full py-4 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-[0.98] shadow-lg shadow-sky-500/30"
            >
              <ShoppingCart size={14} />
              {promoCard.buttonText}
            </button>
          </div>
        </section>
      )}

      <PaymentModal
        isOpen={promoModalOpen}
        onClose={() => setPromoModalOpen(false)}
        isDarkMode={isDarkMode}
        telegramLink={promoCard.buttonLink || ''}
        itemName={promoCard.title || 'VIP PROMOTION'}
        itemPrice={promoCard.price}
      />

      <section className="px-6 py-2 text-center">
        <h1 className={`text-2xl font-black tracking-tighter leading-tight uppercase ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          All packages available<br />
          <span className="text-violet-600 text-sm font-bold tracking-normal italic opacity-90">Click to view previews</span>
        </h1>
      </section>

      <section className="px-4">
        <div className="flex flex-col gap-8">
          {(videos || []).map((video) => (
            <VideoFeedItem key={video.id} video={video} isDarkMode={isDarkMode} globalSettings={globalSettings} />
          ))}
          {(photos || []).map((photo) => (
            <PhotoFeedItem key={photo.id} photo={photo} isDarkMode={isDarkMode} globalSettings={globalSettings} />
          ))}
        </div>
      </section>

      {bottomPromoCard?.isActive && (
        <section className="px-4 pt-4 pb-12">
          <div className={`p-6 rounded-2xl border transition-all shadow-xl ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-100'}`}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className={`font-black text-sm uppercase tracking-[0.2em] ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{bottomPromoCard.title}</h3>
            </div>
            <p className={`text-xs leading-relaxed mb-6 font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {bottomPromoCard.description}
            </p>
            <button
              onClick={() => setBottomPromoModalOpen(true)}
              className="flex items-center justify-center gap-3 w-full py-4 bg-sky-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-[0.98] shadow-lg shadow-sky-500/30 hover:bg-sky-400"
            >
              <ShoppingCart size={14} />
              {bottomPromoCard.buttonText}
            </button>
          </div>
        </section>
      )}

      <PaymentModal
        isOpen={bottomPromoModalOpen}
        onClose={() => setBottomPromoModalOpen(false)}
        isDarkMode={isDarkMode}
        telegramLink={bottomPromoCard?.buttonLink || ''}
        itemName={bottomPromoCard?.title || 'VIP PROMOTION'}
        itemPrice={bottomPromoCard?.price}
      />

      <PurchaseToast isDarkMode={isDarkMode} videos={videos} />
    </div>
  );
};

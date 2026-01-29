
import React, { useState } from 'react';
import { Banner, VideoCard, PromoCard, Notice } from '../types';
import { uploadService } from '../services/storageUpload';
import { storageService } from '../services/storage';
import { checkConnection, isSupabaseConfigured } from '../services/supabase';
import {
  Plus,
  Trash2,
  Edit2,
  Image as ImageIcon,
  Video,
  X,
  Link,
  PlayCircle,
  Type,
  AlignLeft,
  Sparkles,
  Layout,
  Bell,
  FileUp,
  MousePointer2,
  Layers,
  Upload
} from 'lucide-react';

interface Props {
  banners: Banner[];
  setBanners: (banners: Banner[]) => void;
  videos: VideoCard[];
  setVideos: (videos: VideoCard[]) => void;
  promoCard: PromoCard;
  setPromoCard: (promo: PromoCard) => void;
  bottomPromoCard: PromoCard;
  setBottomPromoCard: (promo: PromoCard) => void;
  notices: Notice[];
  setNotices: (notices: Notice[]) => void;
  onBack: () => void;
  isDarkMode: boolean;
}

export const AdminView: React.FC<Props> = ({
  banners, setBanners,
  videos, setVideos,
  promoCard, setPromoCard,
  bottomPromoCard, setBottomPromoCard,
  notices, setNotices,
  onBack, isDarkMode
}) => {
  const [tab, setTab] = useState<'banners' | 'videos' | 'notices' | 'promo'>('banners');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'offline'>('checking');

  React.useEffect(() => {
    const check = async () => {
      if (!isSupabaseConfigured) {
        setConnectionStatus('offline');
        return;
      }
      const isConnected = await checkConnection();
      setConnectionStatus(isConnected ? 'connected' : 'offline');
    };
    check();
  }, []);

  const [formBanner, setFormBanner] = useState<Partial<Banner>>({
    images: ['', '', '', '', ''], buttonText: 'Saiba Mais', link: '', type: 'image'
  });
  const [formVideo, setFormVideo] = useState<Partial<VideoCard>>({
    title: '', coverUrl: '', previews: [''], buyLink: '', buyButtonText: 'BUY ALL PACK', telegramLink: '', telegramButtonText: 'DM TELEGRAM'
  });
  const [formNotice, setFormNotice] = useState<Partial<Notice>>({
    title: '', content: '', date: new Date().toLocaleDateString('pt-BR')
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, target: 'banner' | 'video-cover' | number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset para permitir selecionar o mesmo arquivo novamente se der erro
    event.target.value = '';

    setIsUploading(true);

    try {
      // Validar arquivo
      if (target === 'banner') {
        // Se for upload de banner, verificar o tipo selecionado no formulário
        if (formBanner.type === 'video') {
          const validation = uploadService.validateVideo(file);
          if (!validation.valid) {
            alert(validation.error);
            setIsUploading(false);
            return;
          }
        } else {
          // Padrão ou Imagem
          const validation = uploadService.validateImage(file);
          if (!validation.valid) {
            alert(validation.error);
            setIsUploading(false);
            return;
          }
        }
      } else if (target === 'video-cover') {
        // Capas de vídeo são sempre imagens
        const validation = uploadService.validateImage(file);
        if (!validation.valid) {
          alert(validation.error);
          setIsUploading(false);
          return;
        }
      } else {
        // Preview de vídeo (target numérico) - Aceitar Imagem ou Vídeo para maior flexibilidade
        const isImage = file.type.startsWith('image/');
        const validation = isImage
          ? uploadService.validateImage(file)
          : uploadService.validateVideo(file);

        if (!validation.valid) {
          alert(validation.error);
          setIsUploading(false);
          return;
        }
      }

      // Upload para Supabase Storage
      let result;
      if (target === 'banner' || (typeof target === 'number' && tab === 'banners')) {
        // Usa o bucket 'banners' para todas as fotos do carrossel
        result = await uploadService.uploadBannerImage(file);
      } else if (target === 'video-cover') {
        result = await uploadService.uploadVideoCover(file);
      } else {
        result = await uploadService.uploadVideoPreview(file);
      }

      if (result.error || !result.url) {
        alert(result.error || 'Erro ao fazer upload');
        setIsUploading(false);
        return;
      }

      // Atualizar estado com URL do Supabase
      if (typeof target === 'number' && tab === 'banners') {
        const newImages = [...(formBanner.images || ['', '', '', '', ''])];
        const oldUrl = newImages[target];
        newImages[target] = result.url!;
        setFormBanner(p => ({ ...p, images: newImages }));
        if (oldUrl) await uploadService.deleteFileByUrl(oldUrl);
      } else if (target === 'banner') {
        const newImages = [...(formBanner.images || ['', '', '', '', ''])];
        const oldUrl = newImages[0];
        newImages[0] = result.url!;
        setFormBanner(p => ({ ...p, images: newImages }));
        if (oldUrl) await uploadService.deleteFileByUrl(oldUrl);
      } else if (target === 'video-cover') {
        const oldUrl = formVideo.coverUrl;
        setFormVideo(p => ({ ...p, coverUrl: result.url! }));
        if (oldUrl) await uploadService.deleteFileByUrl(oldUrl);
      } else if (typeof target === 'number') {
        const newPreviews = [...(formVideo.previews || ['', '', ''])];
        const oldUrl = newPreviews[target];
        newPreviews[target] = result.url!;
        setFormVideo(p => ({ ...p, previews: newPreviews }));
        if (oldUrl) await uploadService.deleteFileByUrl(oldUrl);
      }

      setIsUploading(false);
    } catch (err: any) {
      alert('Erro ao fazer upload: ' + err.message);
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    let result: { synced: boolean; error?: string } = { synced: false };

    if (tab === 'banners') {
      const validImages = (formBanner.images || []).filter(url => typeof url === 'string' && url.trim() !== '');
      if (validImages.length === 0) return;

      let newBanners;
      if (editingId) newBanners = banners.map(b => b.id === editingId ? { ...b, ...formBanner, images: validImages } as Banner : b);
      else newBanners = [...banners, { id: crypto.randomUUID(), images: validImages, buttonText: formBanner.buttonText || 'Saiba Mais', link: formBanner.link || '', type: formBanner.type || 'image' }];

      setBanners(newBanners);
      result = await storageService.saveBanners(newBanners);

    } else if (tab === 'videos') {
      if (!formVideo.coverUrl) return;
      // Filter safe strings only
      const validPreviews = (formVideo.previews || []).filter(url => typeof url === 'string' && url.trim() !== '');
      let newVideos;
      if (editingId) newVideos = videos.map(v => v.id === editingId ? { ...v, ...formVideo, previews: validPreviews } as VideoCard : v);
      else newVideos = [...videos, { id: crypto.randomUUID(), title: formVideo.title || 'Premium Video', coverUrl: formVideo.coverUrl!, previews: validPreviews, buyLink: formVideo.buyLink || '', buyButtonText: formVideo.buyButtonText || 'BUY ALL PACK', telegramLink: formVideo.telegramLink || '', telegramButtonText: formVideo.telegramButtonText || 'DM TELEGRAM' }];

      setVideos(newVideos);
      result = await storageService.saveVideos(newVideos);

    } else if (tab === 'notices') {
      if (!formNotice.title || !formNotice.content) return;
      let newNotices;
      if (editingId) newNotices = notices.map(n => n.id === editingId ? { ...n, ...formNotice } as Notice : n);
      else newNotices = [...notices, { id: crypto.randomUUID(), title: formNotice.title!, content: formNotice.content!, date: formNotice.date || new Date().toLocaleDateString('pt-BR') }];

      setNotices(newNotices);
      result = await storageService.saveNotices(newNotices);
    }

    closeModal();

    if (!result.synced) {
      alert(`⚠️ ATENÇÃO: Os dados foram salvos APENAS NO SEU NAVEGADOR.\n\nMotivo do erro: ${result.error || 'Erro desconhecido de conexão'}\n\nOutros usuários NÃO verão essas alterações até que isso seja resolvido.`);
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setFormBanner({ images: ['', '', '', '', ''], buttonText: 'Saiba Mais', link: '', type: 'image' });
    setFormVideo({ title: '', coverUrl: '', previews: [''], buyLink: '', buyButtonText: 'BUY ALL PACK', telegramLink: '', telegramButtonText: 'DM TELEGRAM' });
    setFormNotice({ title: '', content: '', date: new Date().toLocaleDateString('pt-BR') });
  };

  const startEditBanner = (b: Banner) => {
    setEditingId(b.id);
    const current = b.images || [];
    const safeImages = [
      current[0] || '',
      current[1] || '',
      current[2] || '',
      current[3] || '',
      current[4] || ''
    ];
    setFormBanner({ ...b, images: safeImages });
    setTab('banners');
    setShowAddModal(true);
  };
  const startEditVideo = (v: VideoCard) => {
    setEditingId(v.id);
    // Ensure always 3 slots for inputs
    const current = v.previews || [];
    const safePreviews = [
      current[0] || '',
      current[1] || '',
      current[2] || ''
    ];
    setFormVideo({ ...v, previews: safePreviews });
    setTab('videos');
    setShowAddModal(true);
  };
  const startEditNotice = (n: Notice) => { setEditingId(n.id); setFormNotice({ ...n }); setTab('notices'); setShowAddModal(true); };

  const navItems: { id: 'banners' | 'videos' | 'notices' | 'promo'; label: string; icon: any; count?: number }[] = [
    { id: 'banners', label: 'Banners', icon: ImageIcon, count: banners.length },
    { id: 'videos', label: 'Vídeos', icon: Video, count: videos.length },
    { id: 'notices', label: 'Avisos', icon: Bell, count: notices.length },
    { id: 'promo', label: 'Promoção', icon: Sparkles },
  ];

  const PromoSection = ({ title, data, onSave, icon: Icon, isDarkMode }: { title: string, data: PromoCard, onSave: (p: PromoCard) => void, icon: any, isDarkMode: boolean }) => {
    const [localData, setLocalData] = React.useState(data);
    const [isDirty, setIsDirty] = React.useState(false);

    // Sincronizar apenas quando o dado externo mudar drasticamente ou na primeira carga
    // Evitamos atualizar enquanto o usuário digita para não perder foco ou cursor
    React.useEffect(() => {
      if (!isDirty) {
        setLocalData(data);
      }
    }, [data, isDirty]);

    const handleChange = (field: keyof PromoCard, value: any) => {
      setLocalData(prev => ({ ...prev, [field]: value }));
      setIsDirty(true);
    };

    const handleSave = async () => {
      onSave(localData);
      let result;
      if (title.includes('Superior')) {
        result = await storageService.savePromoCard(localData);
      } else {
        result = await storageService.saveBottomPromoCard(localData);
      }

      if (result && !result.synced) {
        alert(`⚠️ Salvo apenas localmente (Offline).\nErro: ${result.error || 'Desconhecido'}`);
      }

      setIsDirty(false);
    };

    return (
      <div className={`p-6 rounded-xl border ${isDarkMode ? 'border-zinc-800 bg-zinc-900/40' : 'border-zinc-200 bg-white shadow-sm'} space-y-5 mb-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-zinc-800 text-violet-500' : 'bg-zinc-100 text-violet-600'}`}><Icon size={18} /></div>
            <h3 className={`font-black text-xs uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest animate-pulse">Não Salvo</span>
            )}
            <button
              onClick={() => {
                const newData = { ...localData, isActive: !localData.isActive };
                setLocalData(newData);
                onSave(newData); // Toggle salva imediatamente
                setIsDirty(false);
              }}
              className={`px-4 py-2 rounded-full text-[10px] font-black tracking-widest transition-all ${localData.isActive ? 'bg-violet-600 text-white shadow-lg' : isDarkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-100 text-zinc-400'}`}
            >
              {localData.isActive ? 'ATIVADO' : 'DESATIVADO'}
            </button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1"><Type size={10} /> TÍTULO</label>
              <input type="text" className={`w-full border rounded-xl px-5 py-4 outline-none text-xs font-black transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-violet-600' : 'bg-white border-zinc-200 text-zinc-900 focus:border-violet-600'}`} value={localData.title} onChange={(e) => handleChange('title', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1"><AlignLeft size={10} /> DESCRIÇÃO</label>
              <textarea rows={2} className={`w-full border rounded-xl px-5 py-4 outline-none text-xs transition-all resize-none ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-violet-600' : 'bg-white border-zinc-200 text-zinc-900 focus:border-violet-600'}`} value={localData.description} onChange={(e) => handleChange('description', e.target.value)} />
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1"><MousePointer2 size={10} /> TEXTO BOTÃO</label>
              <input type="text" className={`w-full border rounded-xl px-5 py-4 outline-none text-xs font-black transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-violet-600' : 'bg-white border-zinc-200 text-zinc-900 focus:border-violet-600'}`} value={localData.buttonText} onChange={(e) => handleChange('buttonText', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1"><Link size={10} /> LINK BOTÃO</label>
              <input type="text" className={`w-full border rounded-xl px-5 py-4 outline-none text-xs transition-all ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-violet-600' : 'bg-white border-zinc-200 text-zinc-900 focus:border-violet-600'}`} value={localData.buttonLink} onChange={(e) => handleChange('buttonLink', e.target.value)} />
            </div>
          </div>
        </div>
        {isDirty && (
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Sparkles size={14} /> Salvar Alterações
            </button>
          </div>
        )}
      </div>
    );
  };

  const handleNewItem = () => {
    setEditingId(null);
    // Explicitly reset forms based on current tab to ensure clean state
    if (tab === 'banners') {
      setFormBanner({ imageUrl: '', buttonText: 'Saiba Mais', link: '', type: 'image' });
    } else if (tab === 'videos') {
      // Initialize with 3 empty slots for safety
      setFormVideo({
        title: '',
        coverUrl: '',
        previews: ['', '', ''],
        buyLink: '',
        buyButtonText: 'BUY ALL PACK',
        telegramLink: '',
        telegramButtonText: 'DM TELEGRAM'
      });
    } else if (tab === 'notices') {
      setFormNotice({ title: '', content: '', date: new Date().toLocaleDateString('pt-BR') });
    }
    setShowAddModal(true);
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)] animate-in fade-in duration-700">
      {/* Sidebar */}
      <aside className={`hidden md:flex flex-col w-64 border-r p-6 gap-2 transition-colors ${isDarkMode ? 'border-zinc-800 bg-zinc-950/20' : 'border-zinc-200 bg-zinc-50'}`}>
        <div className="mb-8 flex flex-col gap-1 px-4">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] italic">Gerenciamento</span>
        </div>

        <div className={`mx-4 mb-6 p-3 rounded-xl border flex items-center gap-3 ${connectionStatus === 'connected' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
          <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500 animate-pulse'}`} />
          <div className="flex flex-col">
            <span className={`text-[9px] font-black uppercase tracking-widest ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
              {connectionStatus === 'checking' ? 'VERIFICANDO...' : connectionStatus === 'connected' ? 'ONLINE (SYNC)' : 'OFFLINE (LOCAL)'}
            </span>
            {connectionStatus === 'offline' && <span className="text-[8px] text-red-500 font-bold">Verifique .env na Vercel</span>}
          </div>
        </div>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex items-center justify-between px-4 py-4 rounded-xl transition-all group ${tab === item.id ? 'bg-violet-600 text-white shadow-xl shadow-violet-600/20' : isDarkMode ? 'text-zinc-500 hover:bg-zinc-800' : 'text-zinc-500 hover:bg-zinc-200'}`}
          >
            <div className="flex items-center gap-3">
              <item.icon size={18} className={tab === item.id ? 'text-white' : 'group-hover:text-violet-500 transition-colors'} />
              <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
            </div>
            {item.count !== undefined && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tab === item.id ? 'bg-white/20 text-white' : isDarkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-200 text-zinc-600'}`}>{item.count}</span>
            )}
          </button>
        ))}
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 p-4 md:p-10 space-y-8 transition-colors ${isDarkMode ? 'bg-zinc-900/10' : 'bg-zinc-100/30'}`}>
        <div className={`md:hidden flex items-center gap-2 mb-4 px-2`}>
          <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
            {connectionStatus === 'connected' ? 'ONLINE SYNC' : 'OFFLINE MODE'}
          </span>
        </div>

        <div className={`md:hidden flex p-1 rounded-xl border transition-colors ${isDarkMode ? 'bg-zinc-800/50 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'} mb-4`}>
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)} className={`flex-1 py-3 flex items-center justify-center rounded-xl transition-all ${tab === item.id ? 'bg-violet-600 text-white' : isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              <item.icon size={16} />
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className={`text-2xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{tab}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-violet-600 animate-pulse"></span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Painel de Controle Ativo</span>
            </div>
          </div>
          {tab !== 'promo' && (
            <button
              onClick={handleNewItem}
              className="flex items-center gap-3 bg-violet-600 text-white px-6 py-4 rounded-xl text-[10px] font-black shadow-2xl shadow-violet-600/30 active:scale-95 transition-all hover:bg-violet-500"
            >
              <Plus size={18} /> NOVO ITEM
            </button>
          )}
        </div>

        {/* Content Grid */}
        <div className={`grid gap-4 ${tab === 'promo' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {tab === 'banners' && banners.map((b) => {
            const firstImage = b.images?.[0] || '';
            const isVideo = firstImage.match(/\.(mp4|webm|mov)(\?.*)?$/i) || (b.type === 'video' && !firstImage.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i));

            return (
              <div key={b.id} className={`group relative p-4 rounded-xl border transition-all ${isDarkMode ? 'border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900/60' : 'border-zinc-200 bg-white hover:border-violet-500/30 shadow-sm'}`}>
                <div className="aspect-video rounded-xl overflow-hidden mb-4 bg-black relative">
                  {isVideo ? (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-900"><PlayCircle size={32} className="text-white/20" /></div>
                  ) : (
                    <img
                      src={firstImage}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://placehold.co/600x400/1e1e1e/FFF?text=Image+Error';
                        e.currentTarget.parentElement?.classList.add('border-2', 'border-red-500');
                      }}
                    />
                  )}
                  <div className="absolute top-2 right-2 bg-violet-600 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg">
                    {b.images?.length || 0} FOTOS
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 px-2 py-1">
                    <p className="text-[8px] text-zinc-400 truncate">{firstImage}</p>
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => startEditBanner(b)} className="p-3 bg-white text-zinc-900 rounded-full hover:scale-110 transition-transform"><Edit2 size={20} /></button>
                    <button onClick={async () => { if (confirm('Excluir banner?')) { await storageService.deleteBanner(b.id); setBanners(banners.filter(x => x.id !== b.id)); } }} className="p-3 bg-violet-600 text-white rounded-full hover:scale-110 transition-transform"><Trash2 size={20} /></button>
                  </div>
                </div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">Botão:</p>
                <p className={`text-sm font-black uppercase ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{b.buttonText}</p>
              </div>
            );
          })}

          {tab === 'videos' && videos.map((v) => (
            <div key={v.id} className={`group relative p-4 rounded-xl border transition-all ${isDarkMode ? 'border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900/60' : 'border-zinc-200 bg-white shadow-sm'}`}>
              <div className="aspect-video rounded-xl overflow-hidden mb-4 relative">
                <img
                  src={v.coverUrl}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://placehold.co/600x400/1e1e1e/FFF?text=Cover+Error';
                    e.currentTarget.parentElement?.classList.add('border-2', 'border-red-500');
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 px-2 py-1">
                  <p className="text-[8px] text-zinc-400 truncate">{v.coverUrl}</p>
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => startEditVideo(v)} className="p-3 bg-white text-zinc-900 rounded-full hover:scale-110 transition-transform"><Edit2 size={20} /></button>
                  <button onClick={async () => { if (confirm('Excluir vídeo?')) { await storageService.deleteVideo(v.id); setVideos(videos.filter(x => x.id !== v.id)); } }} className="p-3 bg-violet-600 text-white rounded-full hover:scale-110 transition-transform"><Trash2 size={20} /></button>
                </div>
              </div>
              <h4 className={`text-sm font-black uppercase ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{v.title || 'Untitled Pack'}</h4>
              <p className="text-[10px] text-zinc-500 font-bold mt-1 uppercase tracking-widest">{(v.previews || []).length} Vídeo de Preview</p>
            </div>
          ))}

          {tab === 'notices' && notices.map((n) => (
            <div key={n.id} className={`p-6 rounded-xl border transition-all flex flex-col ${isDarkMode ? 'border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900' : 'border-zinc-200 bg-white hover:bg-zinc-50 shadow-sm'}`}>
              <div className="flex justify-between items-start mb-4">
                <h4 className={`text-sm font-black uppercase leading-tight flex-1 mr-4 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>{n.title}</h4>
                <div className="flex gap-1">
                  <button onClick={() => startEditNotice(n)} className="p-2 text-zinc-500 hover:text-violet-500 transition-colors"><Edit2 size={16} /></button>
                  <button onClick={async () => { if (confirm('Excluir aviso?')) { await storageService.deleteNotice(n.id); setNotices(notices.filter(x => x.id !== n.id)); } }} className="p-2 text-zinc-500 hover:text-violet-500 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
              <p className={`text-xs line-clamp-3 mb-6 flex-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-600'}`}>{n.content}</p>
              <div className={`flex items-center gap-2 pt-4 border-t ${isDarkMode ? 'border-zinc-800' : 'border-zinc-100'}`}>
                <Bell size={12} className="text-violet-500" />
                <span className="text-[10px] font-bold text-zinc-500">{n.date}</span>
              </div>
            </div>
          ))}

          {tab === 'promo' && (
            <div className="animate-in slide-in-from-bottom-4 duration-500 max-w-4xl w-full">
              <PromoSection title="Banner Superior" data={promoCard} onSave={setPromoCard} icon={Layout} isDarkMode={isDarkMode} />
              <PromoSection title="Banner Rodapé" data={bottomPromoCard} onSave={setBottomPromoCard} icon={Layers} isDarkMode={isDarkMode} />
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={closeModal} />
          <div className={`relative w-full max-w-2xl border rounded-xl p-8 space-y-8 max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-2xl font-black uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                  {editingId ? 'Editar' : 'Criar'} {tab.slice(0, -1)}
                </h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Preencha todos os campos obrigatórios</p>
              </div>
              <button onClick={closeModal} className={`p-3 rounded-full transition-colors ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-500 hover:text-zinc-900'}`}><X size={24} /></button>
            </div>

            <div className="space-y-6">
              {tab === 'banners' && (
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic ml-1">Tipo de Mídia Padrão</label>
                      <div className={`flex p-1 border rounded-xl ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'}`}>
                        <button onClick={() => setFormBanner(p => ({ ...p, type: 'image' }))} className={`flex-1 py-3 rounded-xl text-[10px] font-black ${formBanner.type === 'image' ? 'bg-white text-zinc-900 shadow-xl' : 'text-zinc-500'}`}>IMAGEM</button>
                        <button onClick={() => setFormBanner(p => ({ ...p, type: 'video' }))} className={`flex-1 py-3 rounded-xl text-[10px] font-black ${formBanner.type === 'video' ? 'bg-white text-zinc-900 shadow-xl' : 'text-zinc-500'}`}>VÍDEO</button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic ml-1">Fotos do Carrossel (Até 5)</label>
                      {[0, 1, 2, 3, 4].map((index) => (
                        <div key={index} className="relative group">
                          <input
                            type="text"
                            readOnly
                            placeholder={`Upload Foto ${index + 1}`}
                            className={`w-full border rounded-xl px-5 py-4 outline-none text-[10px] pr-14 cursor-default ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-violet-600' : 'bg-white border-zinc-200 text-zinc-900 focus:border-violet-600'}`}
                            value={formBanner.images?.[index] || ''}
                          />
                          <label className={`absolute right-2 top-2 p-2 bg-violet-600 text-white rounded-xl transition-all cursor-pointer hover:bg-violet-500 shadow-lg`}>
                            {isUploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={20} />}
                            <input
                              type="file"
                              className="hidden"
                              accept={formBanner.type === 'image' ? 'image/*' : 'video/*'}
                              onChange={(e) => handleFileUpload(e, index)}
                              disabled={isUploading}
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic ml-1">Botão</label>
                      <input type="text" placeholder="Texto do Botão" className={`w-full border rounded-xl px-5 py-4 outline-none text-xs font-black ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-violet-600' : 'bg-white border-zinc-200 text-zinc-900 focus:border-violet-600'}`} value={formBanner.buttonText} onChange={(e) => setFormBanner(p => ({ ...p, buttonText: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic ml-1">Link</label>
                      <input type="text" placeholder="https://..." className={`w-full border rounded-xl px-5 py-4 outline-none text-xs ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-violet-600' : 'bg-white border-zinc-200 text-zinc-900 focus:border-violet-600'}`} value={formBanner.link} onChange={(e) => setFormBanner(p => ({ ...p, link: e.target.value }))} />
                    </div>
                    <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'} mt-4`}>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase leading-tight">
                        * Todas as fotos cadastradas acima aparecerão sequencialmente no topo do app.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'videos' && (
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic ml-1">Nome do Pacote</label>
                      <input type="text" placeholder="Título" className={`w-full border rounded-xl px-5 py-4 outline-none text-xs font-black ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-violet-600' : 'bg-white border-zinc-200 text-zinc-900 focus:border-violet-600'}`} value={formVideo.title} onChange={(e) => setFormVideo(p => ({ ...p, title: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic ml-1">Capa (Upload)</label>
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          placeholder="Clique no ícone para Upload"
                          className={`w-full border rounded-xl px-5 py-4 outline-none text-xs pr-14 cursor-default ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-violet-600' : 'bg-white border-zinc-200 text-zinc-900 focus:border-violet-600'}`}
                          value={formVideo.coverUrl}
                        />
                        <label className="absolute right-2 top-2 p-2 bg-violet-600 text-white rounded-xl transition-all cursor-pointer hover:bg-violet-500 shadow-lg shadow-violet-600/20"><FileUp size={20} /><input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'video-cover')} /></label>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {/* Previews (Multi-Video) */}
                    <div className="md:col-span-2 space-y-3">
                      <label className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">Previews (.MP4) - Sequenciais</label>

                      {[0, 1, 2].map((index) => (
                        <div key={index} className="relative">
                          <input
                            type="text"
                            readOnly
                            placeholder={`Upload Preview ${index + 1}`}
                            className={`w-full border rounded-xl px-5 py-4 outline-none text-xs pr-14 cursor-default ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-violet-600' : 'bg-white border-zinc-200 text-zinc-900 focus:border-violet-600'}`}
                            value={formVideo.previews?.[index] || ''}
                          />
                          <label className={`absolute right-2 top-2 p-2 bg-violet-600 text-white rounded-xl transition-all cursor-pointer hover:bg-violet-500`}>
                            {isUploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload size={20} />}
                            <input
                              type="file"
                              accept="video/*,image/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, index)} // Passando index numérico
                              disabled={isUploading}
                            />
                          </label>
                        </div>
                      ))}
                      <p className="text-[9px] text-zinc-400 font-medium ml-2">
                        * O vídeo 1 toca primeiro. Quando acabar, toca o 2, depois o 3.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">Link Compra</label>
                        <input type="text" className={`w-full border rounded-xl px-4 py-3 outline-none text-[10px] ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-violet-600' : 'bg-white border-zinc-200 text-zinc-900 focus:border-violet-600'}`} value={formVideo.buyLink} onChange={(e) => setFormVideo(p => ({ ...p, buyLink: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">Link Telegram</label>
                        <input type="text" className={`w-full border rounded-xl px-4 py-3 outline-none text-[10px] ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-violet-600' : 'bg-white border-zinc-200 text-zinc-900 focus:border-violet-600'}`} value={formVideo.telegramLink} onChange={(e) => setFormVideo(p => ({ ...p, telegramLink: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'notices' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic ml-1">Título</label>
                    <input type="text" className={`w-full border rounded-xl px-5 py-4 outline-none text-xs font-black ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-violet-600' : 'bg-white border-zinc-200 text-zinc-900 focus:border-violet-600'}`} value={formNotice.title} onChange={(e) => setFormNotice(p => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic ml-1">Conteúdo</label>
                    <textarea rows={6} className={`w-full border rounded-xl px-5 py-4 outline-none text-xs transition-all resize-none ${isDarkMode ? 'bg-zinc-950 border-zinc-800 text-white focus:border-violet-600' : 'bg-white border-zinc-200 text-zinc-900 focus:border-violet-600'}`} value={formNotice.content} onChange={(e) => setFormNotice(p => ({ ...p, content: e.target.value }))} />
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <button onClick={closeModal} className={`flex-1 py-5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-500 hover:text-zinc-900'}`}>Cancelar</button>
                <button onClick={handleSave} disabled={isUploading} className="flex-1 py-5 bg-violet-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-violet-600/30 flex items-center justify-center gap-2 hover:bg-violet-500 active:scale-95 transition-all">
                  {isUploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (editingId ? 'Salvar Alterações' : 'Criar Item')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

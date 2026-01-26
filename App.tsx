
import React, { useState, useEffect } from 'react';
import { Banner, VideoCard, View, PromoCard, Notice } from './types';
import { storageService } from './services/storage';
import { authService } from './services/auth';
import { HomeView } from './components/HomeView';
import { AdminView } from './components/AdminView';
import { NoticeView } from './components/NoticeView';
import { LoginView } from './components/LoginView';
import { FloatingMenu } from './components/FloatingMenu';
import { AgeVerificationPopup } from './components/AgeVerificationPopup';
import { 
  ChevronLeft,
  LogOut
} from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Define light mode as default
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('vh_theme');
    // Se não houver tema salvo, retorna false (light mode padrão)
    return savedTheme === null ? false : savedTheme === 'dark';
  });

  const [isAgeVerified, setIsAgeVerified] = useState(() => {
    return sessionStorage.getItem('vh_age_verified') === 'true';
  });

  const [banners, setBanners] = useState<Banner[]>([]);
  const [videos, setVideos] = useState<VideoCard[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [promoCard, setPromoCard] = useState<PromoCard>({ title: '', description: '', buttonText: '', buttonLink: '', isActive: false });
  const [bottomPromoCard, setBottomPromoCard] = useState<PromoCard>({ title: '', description: '', buttonText: '', buttonLink: '', isActive: false });

  // Verificar sessão ao carregar
  useEffect(() => {
    const checkSession = async () => {
      const { user } = await authService.getSession();
      if (user) {
        setIsAuthenticated(true);
      }
      setIsCheckingAuth(false);
    };
    checkSession();
  }, []);

  useEffect(() => {
    const initData = async () => {
      setIsLoadingData(true);
      try {
        const [b, v, pTop, pBottom, n] = await Promise.all([
          storageService.getBanners(),
          storageService.getVideos(),
          storageService.getPromoCard(),
          storageService.getBottomPromoCard(),
          storageService.getNotices()
        ]);
        setBanners(b);
        setVideos(v);
        setPromoCard(pTop);
        setBottomPromoCard(pBottom);
        setNotices(n);
      } finally {
        // Reduzir delay para produção
        setTimeout(() => {
          setIsLoadingData(false);
        }, 500);
      }
    };
    initData();
  }, []);

  // Sincronização em tempo real com Supabase
  useEffect(() => {
    const unsubscribe = storageService.subscribeToChanges({
      onBannersChange: (newBanners) => {
        setBanners(newBanners);
      },
      onVideosChange: (newVideos) => {
        setVideos(newVideos);
      },
      onNoticesChange: (newNotices) => {
        setNotices(newNotices);
      },
      onPromosChange: async () => {
        const [pTop, pBottom] = await Promise.all([
          storageService.getPromoCard(),
          storageService.getBottomPromoCard()
        ]);
        setPromoCard(pTop);
        setBottomPromoCard(pBottom);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('vh_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const handleUpdateBanners = (newBanners: Banner[]) => {
    setBanners(newBanners);
    storageService.saveBanners(newBanners);
  };

  const handleUpdateVideos = (newVideos: VideoCard[]) => {
    setVideos(newVideos);
    storageService.saveVideos(newVideos);
  };

  const handleUpdateNotices = (newNotices: Notice[]) => {
    setNotices(newNotices);
    storageService.saveNotices(newNotices);
  };

  const handleUpdatePromo = (newPromo: PromoCard) => {
    setPromoCard(newPromo);
    storageService.savePromoCard(newPromo);
  };

  const handleUpdateBottomPromo = (newPromo: PromoCard) => {
    setBottomPromoCard(newPromo);
    storageService.saveBottomPromoCard(newPromo);
  };

  const handleAgeVerify = () => {
    setIsAgeVerified(true);
    sessionStorage.setItem('vh_age_verified', 'true');
  };

  const theme = {
    bgMain: isDarkMode ? 'bg-zinc-950' : 'bg-zinc-100',
    bgFrame: isDarkMode ? 'bg-zinc-900' : 'bg-white',
    bgHeader: isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/80 border-zinc-200',
    textPrimary: isDarkMode ? 'text-white' : 'text-zinc-900',
    textSecondary: isDarkMode ? 'text-zinc-400' : 'text-zinc-500',
    bgIcon: isDarkMode ? 'bg-zinc-800/50 hover:bg-zinc-800 border-zinc-700/30' : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200',
    navBg: isDarkMode ? 'bg-zinc-900/95 border-zinc-800/50' : 'bg-white/95 border-zinc-200'
  };

  const goToAdmin = () => {
    if (isAuthenticated) {
      setCurrentView('admin');
    } else {
      setCurrentView('login');
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setCurrentView('home');
  };

  return (
    <div className={`flex justify-center min-h-screen selection:bg-violet-500/30 transition-all duration-500 ${theme.bgMain}`}>
      {/* Container Principal */}
      <div className={`w-full ${currentView === 'admin' ? 'max-w-6xl' : 'max-w-md'} ${theme.bgFrame} min-h-screen flex flex-col relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.1)] ${isDarkMode ? 'border-zinc-800/50' : 'border-zinc-200/50'} border-x transition-all duration-500`}>
        
        {/* Camada 1: Carregamento Esqueleto (Sempre primeiro) */}
        {isLoadingData ? (
          <div className="flex flex-col h-full">
            <header className={`h-16 border-b flex items-center px-4 animate-pulse ${theme.bgHeader}`}>
              <div className="w-32 h-6 bg-zinc-200 dark:bg-zinc-800 rounded-lg mx-auto" />
            </header>
            <main className="p-4 space-y-6">
              <div className="w-full aspect-video rounded-3xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="h-32 w-full rounded-3xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              <div className="space-y-4">
                <div className="w-full aspect-video rounded-3xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                <div className="w-full aspect-video rounded-3xl bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
              </div>
            </main>
          </div>
        ) : (
          <>
            {/* Camada 2: Conteúdo Real (Sempre visível) */}
            <>
              {/* Camada 3: Popup de Verificação de Idade (Overlay não-bloqueante) */}
              {!isAgeVerified && currentView !== 'admin' && currentView !== 'login' && (
                <AgeVerificationPopup onVerify={handleAgeVerify} isDarkMode={isDarkMode} />
              )}
              
              {/* Conteúdo Principal */}
              <header className={`h-16 backdrop-blur-xl border-b flex items-center px-4 sticky top-0 z-50 transition-colors ${theme.bgHeader}`}>
                  <div className="absolute left-4 z-10">
                    {currentView !== 'home' && (
                      <button 
                        onClick={() => setCurrentView('home')}
                        className={`p-2 rounded-full transition-all active:scale-90 ${theme.bgIcon} ${theme.textSecondary}`}
                      >
                        <ChevronLeft size={20} />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 flex justify-center items-center h-full">
                    <h1 className={`${theme.textPrimary} font-black tracking-tighter text-xl leading-tight uppercase italic`}>
                      {currentView === 'home' ? 'HOTHUB' : currentView === 'admin' ? 'ADMIN DASHBOARD' : currentView === 'login' ? 'SECURE LOGIN' : 'DETAILS'}
                    </h1>
                  </div>
                  
                  <div className="absolute right-4 z-10 flex items-center gap-2">
                     {currentView === 'admin' && isAuthenticated && (
                       <button 
                         onClick={handleLogout}
                         className={`p-2 rounded-full transition-all active:scale-90 ${theme.bgIcon} ${theme.textSecondary} hover:text-red-500`}
                         title="Sair"
                       >
                         <LogOut size={18} />
                       </button>
                     )}
                     <button 
                       onClick={() => setIsDarkMode(!isDarkMode)}
                       className={`p-2 rounded-full transition-all active:scale-90 text-[10px] font-bold uppercase tracking-widest ${theme.bgIcon} ${theme.textSecondary}`}
                     >
                       {isDarkMode ? '🌞' : '🌙'}
                     </button>
                  </div>
                </header>

                <main className="flex-1 overflow-y-auto pb-4 scroll-smooth no-scrollbar transition-all duration-700">
                  {currentView === 'home' && (
                    <HomeView 
                      banners={banners} 
                      videos={videos} 
                      promoCard={promoCard}
                      bottomPromoCard={bottomPromoCard}
                      isDarkMode={isDarkMode}
                      isLoading={isLoadingData}
                    />
                  )}
                  {currentView === 'notice' && (
                    <NoticeView notices={notices} isDarkMode={isDarkMode} />
                  )}
                  {currentView === 'login' && (
                    <LoginView 
                      onLoginSuccess={() => {
                        setIsAuthenticated(true);
                        setCurrentView('admin');
                      }}
                      onBack={() => setCurrentView('home')}
                      isDarkMode={isDarkMode}
                    />
                  )}
                  {currentView === 'admin' && isAuthenticated && (
                    <AdminView 
                      banners={banners} 
                      setBanners={handleUpdateBanners} 
                      videos={videos} 
                      setVideos={handleUpdateVideos} 
                      promoCard={promoCard}
                      setPromoCard={handleUpdatePromo}
                      bottomPromoCard={bottomPromoCard}
                      setBottomPromoCard={handleUpdateBottomPromo}
                      notices={notices}
                      setNotices={handleUpdateNotices}
                      onBack={() => setCurrentView('home')} 
                      isDarkMode={isDarkMode} 
                    />
                  )}

                  {currentView === 'admin' && !isAuthenticated && (
                    <div className="flex flex-col items-center justify-center py-20">
                       <p className="text-violet-500 font-bold uppercase tracking-widest">Acesso Negado</p>
                       <button onClick={() => setCurrentView('login')} className="mt-4 text-xs font-black uppercase text-zinc-500 underline">Ir para Login</button>
                    </div>
                  )}

                  {(currentView === 'home' || currentView === 'notice') && (
                    <footer className={`mt-4 py-8 px-6 border-t flex flex-col items-center gap-1.5 text-center transition-colors ${isDarkMode ? 'border-zinc-800/50 bg-zinc-950/10' : 'border-zinc-100 bg-zinc-50/50'}`}>
                      <div 
                        className="flex items-center justify-center gap-1.5 cursor-pointer select-none active:opacity-60 transition-opacity group"
                        onClick={goToAdmin}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full border border-violet-500 flex items-center justify-center text-[7px] font-bold text-violet-500 group-hover:bg-violet-500/10 transition-colors`}>18</div>
                        <span className="text-[9px] font-bold text-violet-500 uppercase tracking-widest">Administrative Dashboard Access</span>
                      </div>
                      <p className={`text-[8px] font-medium tracking-tight ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        © 2025 HotHub. All rights reserved.
                      </p>
                    </footer>
                  )}
                </main>

                {(currentView === 'home' || currentView === 'notice') && (
                  <FloatingMenu 
                    onNavigate={(v) => setCurrentView(v)} 
                    isDarkMode={isDarkMode}
                  />
                )}
              </>
          </>
        )}
      </div>
    </div>
  );
};

export default App;

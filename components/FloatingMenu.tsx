
import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Home, Bell, MessageCircle, ArrowUpRight, Layers } from 'lucide-react';

interface Props {
  onNavigate: (view: 'home' | 'admin' | 'video-detail' | 'notice') => void;
  isDarkMode: boolean;
  supportLink?: string;
}

export const FloatingMenu: React.FC<Props> = ({ onNavigate, isDarkMode, supportLink = 'https://t.me/usercyres' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const menuItems = [
    { label: 'HOME', icon: <Home size={18} />, action: () => onNavigate('home') },
    { label: 'NOTICE', icon: <Bell size={18} />, action: () => onNavigate('notice') },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[100]" ref={menuRef}>
      {/* Balloon Menu */}
      {isOpen && (
        <div className="absolute bottom-24 right-0 w-48 animate-in zoom-in-95 slide-in-from-bottom-10 duration-300 origin-bottom-right">
          {/* Balloon Body */}
          <div className={`relative rounded-[2.5rem] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border backdrop-blur-xl ${isDarkMode ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white/95 border-zinc-100'}`}>
            <div className="flex flex-col gap-1">
              {menuItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    item.action();
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between w-full p-4 rounded-[1.8rem] transition-all active:scale-95 group ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-300 hover:text-white' : 'hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-violet-500">{item.icon}</span>
                    <span className="font-black text-[10px] tracking-[0.2em] uppercase italic">{item.label}</span>
                  </div>
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
          
          {/* Balloon Arrow/Tail */}
          <div className={`absolute -bottom-2 right-6 w-5 h-5 rotate-45 border-r border-b ${isDarkMode ? 'bg-zinc-900/95 border-zinc-800' : 'bg-white/95 border-zinc-100'}`}></div>
        </div>
      )}

      {/* Main Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90 relative overflow-hidden group shadow-[0_25px_50px_-12px_rgba(0,0,0,0.2)] ${
          isOpen 
            ? 'bg-violet-600 rotate-90' 
            : isDarkMode ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900 text-white'
        }`}
      >
        {isOpen ? (
          <X size={28} className="text-white" />
        ) : (
          <Layers size={28} />
        )}
        
        {/* Glow Effect on Hover */}
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </button>
    </div>
  );
};

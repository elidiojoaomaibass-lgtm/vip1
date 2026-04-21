
import React from 'react';
import { Notice } from '../types';
import { Bell, Calendar } from 'lucide-react';

interface Props {
  notices: Notice[];
  isDarkMode: boolean;
}

export const NoticeView: React.FC<Props> = ({ notices, isDarkMode }) => {
  return (
    <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center py-6">
        <div className="w-12 h-12 bg-violet-600/10 rounded-full flex items-center justify-center mx-auto mb-3">
          <Bell className="text-violet-600" size={24} />
        </div>
        <h2 className={`text-xl font-black uppercase italic tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          NOTICES & POLICIES
        </h2>
        <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
          Last updates from the administration
        </p>
      </div>

      <div className="space-y-4">
        {notices.map((notice) => (
          <div 
            key={notice.id}
            className={`p-6 rounded-2xl border transition-all ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-black text-sm uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                {notice.title}
              </h3>
              <div className="flex items-center gap-1.5 opacity-40">
                <Calendar size={12} />
                <span className="text-[10px] font-bold">{notice.date}</span>
              </div>
            </div>
            <p className={`text-xs leading-relaxed whitespace-pre-wrap font-medium ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {notice.content}
            </p>
          </div>
        ))}

        {notices.length === 0 && (
          <div className="text-center py-20 opacity-30">
            <Bell size={40} className="mx-auto mb-4 text-violet-600" />
            <p className="text-sm font-bold uppercase tracking-widest">No notices available.</p>
          </div>
        )}
      </div>
    </div>
  );
};

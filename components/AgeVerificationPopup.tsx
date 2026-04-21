
import React from 'react';

interface Props {
  onVerify: () => void;
  isDarkMode: boolean;
}

export const AgeVerificationPopup: React.FC<Props> = ({ onVerify, isDarkMode }) => {
  const handleExit = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <div className={`fixed inset-0 z-[10000] flex items-center justify-center p-6 overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-black' : 'bg-zinc-100/95'}`}>
      {/* Soft Background Glow */}
      <div className={`absolute inset-0 opacity-80 ${isDarkMode ? 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black' : 'bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-zinc-200 to-zinc-300'}`} />
      
      {/* Main Container */}
      <div className={`relative w-full max-w-[400px] rounded-[3rem] p-8 border shadow-2xl animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center text-center transition-all ${isDarkMode ? 'bg-[#121212] border-zinc-800/50 shadow-black/50' : 'bg-white border-zinc-200 shadow-zinc-300'}`}>
        
        {/* Header - Italic Heavy Typography */}
        <h2 className={`text-2xl md:text-3xl font-[900] italic uppercase tracking-tighter mb-6 ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
          RESTRICTED ACCESS
        </h2>

        {/* Description Text */}
        <p className={`text-[15px] leading-relaxed font-medium mb-10 max-w-[280px] ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
          You must be at least <span className="text-violet-600 font-bold">18 years old</span> to enter this site. By entering, you agree to our terms of service.
        </p>

        {/* Action Buttons */}
        <div className="w-full space-y-3 px-2">
          <button
            onClick={onVerify}
            className="w-full py-5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black text-[13px] uppercase tracking-[0.1em] transition-all active:scale-[0.97] shadow-lg shadow-violet-900/20"
          >
            YES, I AM 18+
          </button>
          
          <button
            onClick={handleExit}
            className={`w-full py-5 rounded-2xl font-black text-[13px] uppercase tracking-[0.1em] transition-all active:scale-[0.97] border ${isDarkMode ? 'bg-[#1c1c1c] hover:bg-[#252525] text-zinc-500 border-zinc-800/50' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500 border-zinc-200'}`}
          >
            NO
          </button>
        </div>
        
        {/* Footer Text */}
        <p className={`mt-10 text-[9px] font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-zinc-700' : 'text-zinc-400'}`}>
          ADULT CONTENT WARNING
        </p>
      </div>
    </div>
  );
};

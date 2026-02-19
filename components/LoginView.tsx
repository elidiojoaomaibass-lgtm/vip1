
import React, { useState } from 'react';
import { Mail, Lock, LogIn, ChevronLeft, ShieldAlert, Shield, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/auth';

interface Props {
  onLoginSuccess: () => void;
  onBack: () => void;
  isDarkMode: boolean;
}

export const LoginView: React.FC<Props> = ({ onLoginSuccess, onBack, isDarkMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await authService.loginStep1(email, password);

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      if (result.requiresTwoFactor) {
        // Mostrar tela de 2FA
        setShowTwoFactor(true);
        setIsLoading(false);
      }
    } catch (err: any) {
      setError('Erro ao conectar ao servidor');
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error: resetError } = await authService.resetPassword(email);
      if (resetError) {
        setError(resetError);
        setIsLoading(false);
        return;
      }

      setResetSent(true);
      setIsLoading(false);
    } catch (err: any) {
      setError('Erro ao enviar email');
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (twoFactorCode.length !== 6) {
      setError('O código deve ter 6 dígitos');
      setIsLoading(false);
      return;
    }

    try {
      const { user, error: loginError } = await authService.loginStep2(email, password, twoFactorCode);

      if (loginError || !user) {
        setError(loginError || 'Código inválido');
        setIsLoading(false);
        return;
      }

      // Sucesso - redirecionar para admin
      onLoginSuccess();
    } catch (err: any) {
      setError('Erro ao validar código');
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowTwoFactor(false);
    setShowForgotPassword(false);
    setResetSent(false);
    setTwoFactorCode('');
    setError('');
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
      <div className={`w-full p-8 rounded-[2.5rem] border transition-all shadow-2xl ${isDarkMode ? 'bg-zinc-800/30 border-zinc-800 shadow-black/50' : 'bg-white border-zinc-100 shadow-zinc-200'}`}>

        {!showTwoFactor && !showForgotPassword ? (
          /* TELA DE LOGIN */
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-violet-600/20">
                <Lock className="text-white" size={28} />
              </div>
              <h2 className={`text-xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                Admin Login
              </h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                Restricted Access
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                    type="email"
                    required
                    placeholder="admin@gmail.com"
                    className={`w-full pl-11 pr-4 py-4 rounded-2xl outline-none text-sm transition-all border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white focus:border-violet-600' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-violet-600'}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-[9px] font-black text-violet-500 uppercase tracking-widest hover:underline"
                  >
                    Esqueceu?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className={`w-full pl-11 pr-12 py-4 rounded-2xl outline-none text-sm transition-all border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white focus:border-violet-600' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-violet-600'}`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-violet-600 transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 animate-shake">
                  <ShieldAlert size={16} />
                  <p className="text-[10px] font-bold uppercase tracking-tight">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-violet-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={18} />
                    Próximo
                  </>
                )}
              </button>
            </form>

            <button
              onClick={onBack}
              className={`w-full mt-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              <ChevronLeft size={18} />
              Voltar para Home
            </button>
          </>
        ) : showForgotPassword ? (
          /* TELA DE ESQUECI SENHA */
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-amber-500/20">
                <Mail className="text-white" size={28} />
              </div>
              <h2 className={`text-xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                Recuperar Senha
              </h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1 text-center">
                Insira seu e-mail para receber o link
              </p>
            </div>

            {resetSent ? (
              <div className="text-center space-y-6 py-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-500">
                  <p className="text-[11px] font-bold uppercase tracking-widest">E-mail enviado!</p>
                  <p className="text-[9px] mt-1 opacity-80">Verifique sua caixa de entrada para redefinir a senha.</p>
                </div>
                <button
                  onClick={handleBackToLogin}
                  className="w-full py-4 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95"
                >
                  Voltar ao Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                      type="email"
                      required
                      placeholder="seu-email@gmail.com"
                      className={`w-full pl-11 pr-4 py-4 rounded-2xl outline-none text-sm transition-all border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white focus:border-violet-600' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-violet-600'}`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 animate-shake">
                    <ShieldAlert size={16} />
                    <p className="text-[10px] font-bold uppercase tracking-tight">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Enviar Link de Recuperação'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className={`w-full py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  Cancelar e Voltar
                </button>
              </form>
            )}
          </>
        ) : (
          /* TELA DE 2FA */
          <>
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-green-600/20">
                <Shield className="text-white" size={28} />
              </div>
              <h2 className={`text-xl font-black italic uppercase tracking-tighter ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>
                Verificação 2FA
              </h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1 text-center">
                Código enviado para {email}
              </p>
            </div>

            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Código de 6 Dígitos</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="000000"
                    className={`w-full pl-11 pr-4 py-4 rounded-2xl outline-none text-xl font-mono text-center tracking-[0.5em] transition-all border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white focus:border-green-600' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-green-600'}`}
                    value={twoFactorCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setTwoFactorCode(value);
                    }}
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                <p className="text-[9px] text-zinc-500 ml-1">
                  ✉️ Código enviado para seu email. Verifique sua caixa de entrada ou spam.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 animate-shake">
                  <ShieldAlert size={16} />
                  <p className="text-[10px] font-bold uppercase tracking-tight">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || twoFactorCode.length !== 6}
                className="w-full py-4 bg-green-600 hover:bg-green-500 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-green-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Shield size={18} />
                    Verificar Código
                  </>
                )}
              </button>
            </form>

            <button
              onClick={handleBackToLogin}
              disabled={isLoading}
              className={`w-full mt-4 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              <ChevronLeft size={18} />
              Voltar ao Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

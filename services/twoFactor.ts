import { supabase } from './supabase';

export const twoFactorService = {
  /**
   * Enviar código OTP via email (Supabase envia automaticamente)
   */
  sendCode: async (email: string, _userId: string): Promise<{ code: string | null; error: string | null }> => {
    if (!supabase) {
      return { code: null, error: 'Supabase não configurado' };
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Só permite utilizadores já existentes
        },
      });

      if (error) {
        console.error('Erro ao enviar OTP:', error);
        return { code: null, error: 'Erro ao enviar código de verificação por email' };
      }

      console.log(`📧 Código OTP enviado para ${email} via Supabase`);
      return { code: 'sent', error: null };
    } catch (err: any) {
      return { code: null, error: err.message };
    }
  },

  /**
   * Validar código OTP recebido por email
   */
  validateCode: async (email: string, code: string): Promise<{ valid: boolean; error: string | null }> => {
    if (!supabase) {
      return { valid: false, error: 'Supabase não configurado' };
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'email',
      });

      if (error || !data.session) {
        console.error('Erro ao validar OTP:', error);
        return { valid: false, error: 'Código inválido ou expirado' };
      }

      return { valid: true, error: null };
    } catch (err: any) {
      return { valid: false, error: 'Erro ao validar código' };
    }
  },
};

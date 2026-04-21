import { supabase } from './supabase';

interface TwoFactorCode {
  code: string;
  expiresAt: Date;
}

export const twoFactorService = {
  /**
   * Gerar código de 6 dígitos
   */
  generateCode: (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  /**
   * Salvar código no banco e enviar por email (simulado)
   */
  sendCode: async (email: string, userId: string): Promise<{ code: string | null; error: string | null }> => {
    if (!supabase) {
      return { code: null, error: 'Supabase não configurado' };
    }

    try {
      const code = twoFactorService.generateCode();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Expira em 10 minutos

      // Salvar código no banco
      const { error: insertError } = await supabase
        .from('auth_codes')
        .insert({
          user_id: userId,
          email: email,
          code: code,
          expires_at: expiresAt.toISOString(),
          used: false,
          ip_address: 'browser', // Pode ser melhorado para pegar IP real
          user_agent: navigator.userAgent
        });

      if (insertError) {
        console.error('Erro ao salvar código:', insertError);
        return { code: null, error: 'Erro ao gerar código de verificação' };
      }

      // Simular envio de email (em produção, usar SendGrid, AWS SES, etc)
      console.log(`📧 Código 2FA para ${email}: ${code}`);
      console.log(`⏰ Expira em: ${expiresAt.toLocaleString()}`);
      
      // Mostrar código no console para desenvolvimento
      alert(`CÓDIGO 2FA (DESENVOLVIMENTO):\n\n${code}\n\nEm produção, este código seria enviado por email.\nExpira em 10 minutos.`);

      return { code, error: null };
    } catch (err: any) {
      return { code: null, error: err.message };
    }
  },

  /**
   * Validar código
   */
  validateCode: async (email: string, code: string): Promise<{ valid: boolean; error: string | null }> => {
    if (!supabase) {
      return { valid: false, error: 'Supabase não configurado' };
    }

    try {
      // Buscar código não usado e não expirado
      const { data, error } = await supabase
        .from('auth_codes')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return { valid: false, error: 'Código inválido ou expirado' };
      }

      // Marcar código como usado
      await supabase
        .from('auth_codes')
        .update({ used: true })
        .eq('id', data.id);

      return { valid: true, error: null };
    } catch (err: any) {
      return { valid: false, error: 'Erro ao validar código' };
    }
  },

  /**
   * Registrar tentativa de login
   */
  logLoginAttempt: async (email: string, success: boolean, errorMessage?: string): Promise<void> => {
    if (!supabase) return;

    try {
      await supabase
        .from('login_attempts')
        .insert({
          email,
          success,
          ip_address: 'browser',
          user_agent: navigator.userAgent,
          error_message: errorMessage || null
        });
    } catch (err) {
      console.error('Erro ao registrar tentativa de login:', err);
    }
  },

  /**
   * Limpar códigos expirados
   */
  cleanupExpiredCodes: async (): Promise<void> => {
    if (!supabase) return;

    try {
      await supabase.rpc('cleanup_expired_codes');
    } catch (err) {
      console.error('Erro ao limpar códigos:', err);
    }
  }
};

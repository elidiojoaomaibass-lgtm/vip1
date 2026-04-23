import { supabase } from './supabase';
import { twoFactorService } from './twoFactor';

export interface User {
  id: string;
  email: string;
  role: string;
}

export interface LoginStep1Result {
  requiresTwoFactor: boolean;
  userId?: string;
  email?: string;
  error?: string;
}

export const authService = {
  /**
   * PASSO 1: Login com email e senha → Envia código por email
   */
  loginStep1: async (email: string, password: string): Promise<LoginStep1Result> => {
    if (!supabase) {
      return { requiresTwoFactor: false, error: 'Supabase não configurado' };
    }

    try {
      // Primeiro: validar se email e senha estão corretos
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Auth error:', authError);
        return { requiresTwoFactor: false, error: 'Email ou senha incorretos' };
      }

      if (!authData.user) {
        return { requiresTwoFactor: false, error: 'Usuário não encontrado' };
      }

      // Verificar se é admin
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', authData.user.id)
        .eq('is_active', true)
        .single();

      if (adminError || !adminData) {
        await supabase.auth.signOut();
        return { requiresTwoFactor: false, error: 'Acesso não autorizado. Este usuário não é um administrador.' };
      }

      // Enviar código OTP usando o serviço customizado ANTES de fazer logout (para o RLS permitir)
      const { error: otpError } = await twoFactorService.sendCode(email, authData.user.id);

      // Credenciais válidas e código gerado! Agora fazer logout temporário
      await supabase.auth.signOut();

      if (otpError) {
        console.error('OTP error:', otpError);
        return { requiresTwoFactor: false, error: 'Erro ao enviar código de verificação' };
      }

      // Sucesso! Código enviado por email
      return {
        requiresTwoFactor: true,
        email: email
      };
    } catch (err: any) {
      console.error('Login error:', err);
      return { requiresTwoFactor: false, error: 'Erro ao fazer login. Tente novamente.' };
    }
  },

  /**
   * PASSO 2: Validar código OTP e completar login
   */
  loginStep2: async (email: string, _password: string, code: string): Promise<{ user: User | null; error: string | null }> => {
    if (!supabase) {
      return { user: null, error: 'Supabase não configurado' };
    }

    try {
      // Verificar o código OTP — o verifyOtp já cria a sessão automaticamente
      const { valid, error: verifyError } = await twoFactorService.validateCode(email, code);

      if (!valid || verifyError) {
        return { user: null, error: verifyError || 'Código inválido ou expirado' };
      }

      // Sessão já criada pelo verifyOtp — buscar sessão atual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return { user: null, error: 'Erro ao obter sessão após verificação' };
      }

      // Verificar se é admin
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single();

      if (adminError || !adminData) {
        await supabase.auth.signOut();
        return { user: null, error: 'Acesso não autorizado' };
      }

      // Login completo!
      return {
        user: {
          id: session.user.id,
          email: session.user.email!,
          role: adminData.role
        },
        error: null
      };
    } catch (err: any) {
      console.error('Login step 2 error:', err);
      return { user: null, error: 'Erro ao validar código. Tente novamente.' };
    }
  },

  /**
   * Logout
   */
  logout: async (): Promise<{ error: string | null }> => {
    if (!supabase) {
      return { error: 'Supabase não configurado' };
    }

    try {
      // Limpar sessão local
      sessionStorage.removeItem('admin_session');
      localStorage.removeItem('admin_session');

      const { error } = await supabase.auth.signOut();
      if (error) {
        return { error: error.message };
      }
      return { error: null };
    } catch (err: any) {
      return { error: err.message };
    }
  },

  /**
   * Verificar se há sessão ativa
   */
  getSession: async (): Promise<{ user: User | null; error: string | null }> => {
    if (!supabase) {
      return { user: null, error: 'Supabase não configurado' };
    }

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        return { user: null, error: null };
      }

      // Verificar se ainda é admin
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single();

      if (adminError || !adminData) {
        await supabase.auth.signOut();
        return { user: null, error: 'Acesso revogado' };
      }

      return {
        user: {
          id: session.user.id,
          email: session.user.email!,
          role: adminData.role
        },
        error: null
      };
    } catch (err: any) {
      return { user: null, error: err.message };
    }
  },

  /**
   * Verificar se usuário é admin
   */
  isAdmin: async (): Promise<boolean> => {
    const { user } = await authService.getSession();
    return user !== null;
  },

  /**
   * Enviar e-mail de recuperação de senha
   */
  resetPassword: async (email: string): Promise<{ error: string | null }> => {
    if (!supabase) {
      return { error: 'Supabase não configurado' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}`,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err: any) {
      console.error('Reset password error:', err);
      return { error: 'Erro ao enviar email de recuperação' };
    }
  }
};

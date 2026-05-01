import { supabase } from '../lib/supabase';
import { AuthError, Session, User } from '@supabase/supabase-js';

const checkConfig = () => {
  if (!import.meta.env.VITE_SUPABASE_URL) {
    throw new Error('Configure o VITE_SUPABASE_URL nas Secrets e reinicie a página.');
  }
};

export const AuthController = {
  async signIn(email: string): Promise<{ error: AuthError | null }> {
    checkConfig();
    return await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth-callback.html`,
      },
    });
  },

  async signInWithPassword(email: string, password: string) {
    checkConfig();
    return await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
  },

  async signUp(email: string, password: string, name: string) {
    checkConfig();
    return await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name,
        },
        emailRedirectTo: window.location.origin,
      },
    });
  },

  async resetPassword(email: string) {
    checkConfig();
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#type=recovery`,
    });
  },

  async updatePassword(password: string) {
    checkConfig();
    return await supabase.auth.updateUser({ password });
  },

  async signOut(): Promise<{ error: AuthError | null }> {
    checkConfig();
    return await supabase.auth.signOut();
  },

  async getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    checkConfig();
    const { data, error } = await supabase.auth.getSession();
    return { session: data.session, error };
  },

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    checkConfig();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return subscription;
  }
};

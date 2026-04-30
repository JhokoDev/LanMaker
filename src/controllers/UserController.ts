import { supabase } from '../lib/supabase';
import { User } from '../models';

const checkConfig = () => {
  if (!import.meta.env.VITE_SUPABASE_URL) {
    throw new Error('Configure o VITE_SUPABASE_URL nas Secrets e reinicie a página.');
  }
};

export const UserController = {
  async getAll(): Promise<User[]> {
    checkConfig();
    const { data, error } = await supabase.from('users').select('*').order('name');
    if (error) throw error;
    return data as User[];
  },
  
  async create(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
    checkConfig();
    const { data, error } = await supabase.from('users').insert(user).select().single();
    if (error) throw error;
    return data as User;
  }
};

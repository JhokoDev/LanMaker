import { supabase } from '../lib/supabase';
import { Equipment } from '../models';

const checkConfig = () => {
  if (!import.meta.env.VITE_SUPABASE_URL) {
    throw new Error('Configure o VITE_SUPABASE_URL nas Secrets e reinicie a página.');
  }
};

export const EquipmentController = {
  async getAll(): Promise<Equipment[]> {
    checkConfig();
    const { data, error } = await supabase.from('equipments').select('*').order('asset_tag');
    if (error) throw error;
    return data as Equipment[];
  },
  
  async create(equipment: Omit<Equipment, 'id' | 'created_at'>): Promise<Equipment> {
    checkConfig();
    const { data, error } = await supabase.from('equipments').insert(equipment).select().single();
    if (error) throw error;
    return data as Equipment;
  },

  async updateStatus(id: string, status: Equipment['status']): Promise<void> {
    checkConfig();
    const { error } = await supabase.from('equipments').update({ status }).eq('id', id);
    if (error) throw error;
  }
};

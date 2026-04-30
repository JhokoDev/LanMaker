import { supabase } from '../lib/supabase';
import { Loan } from '../models';
import { EquipmentController } from './EquipmentController';

const checkConfig = () => {
  if (!import.meta.env.VITE_SUPABASE_URL) {
    throw new Error('Configure o VITE_SUPABASE_URL nas Secrets e reinicie a página.');
  }
};

export const LoanController = {
  async getAll(): Promise<Loan[]> {
    checkConfig();
    const { data, error } = await supabase.from('loans').select('*').order('borrowed_at', { ascending: false });
    if (error) throw error;
    return data as Loan[];
  },

  async create(loanReq: Omit<Loan, 'id' | 'status' | 'returned_at'>): Promise<Loan> {
    checkConfig();
    const { data: createdLoan, error } = await supabase.from('loans').insert({ ...loanReq, status: 'active' }).select().single();
    if (error) throw error;
    
    await EquipmentController.updateStatus(createdLoan.equipment_id, 'in_use');
    return createdLoan as Loan;
  },

  async returnLoan(loanId: string, equipmentId: string): Promise<void> {
    checkConfig();
    const { error: loanErr } = await supabase
      .from('loans')
      .update({ status: 'returned', returned_at: new Date().toISOString() })
      .eq('id', loanId);
      
    if (loanErr) throw loanErr;
    await EquipmentController.updateStatus(equipmentId, 'available');
  }
};

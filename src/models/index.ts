export type User = {
  id: string;
  name: string;
  document_id: string;
  email: string;
  role: 'admin' | 'user';
  created_at?: string;
};

export type Equipment = {
  id: string;
  asset_tag: string;
  equipment_type: 'notebook' | 'celular' | 'tablet';
  model: string;
  status: 'available' | 'in_use' | 'maintenance';
  condition: string;
  created_at?: string;
};

export type Loan = {
  id: string;
  user_id: string;
  equipment_id: string;
  borrowed_at: string;
  expected_return_at: string;
  returned_at?: string;
  status: 'active' | 'returned' | 'overdue';
};

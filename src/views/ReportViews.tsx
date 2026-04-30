import React, { useEffect, useState } from 'react';
import { LoanController } from '../controllers/LoanController';
import { EquipmentController } from '../controllers/EquipmentController';
import { UserController } from '../controllers/UserController';
import { Loan, Equipment, User } from '../models';
import { format, differenceInMilliseconds } from 'date-fns';
import { BarChart3, TrendingUp, Users } from 'lucide-react';

export function ReportViews() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [ls, eqs, usrs] = await Promise.all([
        LoanController.getAll(),
        EquipmentController.getAll(),
        UserController.getAll()
      ]);
      setLoans(ls);
      setEquipments(eqs);
      setUsers(usrs);
    } catch (err: any) {
      console.error(err);
      // Let it remain empty array if it fails (likely no supabase configured)
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-500 font-medium">Buscando banco de dados para relatórios...</div>;

  const totalLoans = loans.length;
  const returnedLoans = loans.filter(l => l.status === 'returned').length;
  
  // Calculate average loan duration for returned loans
  const totalDurationMs = loans
    .filter(l => l.status === 'returned' && l.returned_at)
    .reduce((acc, l) => acc + differenceInMilliseconds(new Date(l.returned_at!), new Date(l.borrowed_at)), 0);
    
  const avgHours = returnedLoans > 0 ? (totalDurationMs / returnedLoans / (1000 * 60 * 60)).toFixed(1) : '0';

  // Find most borrowed notebooks
  const eqCounts: Record<string, number> = {};
  loans.forEach(l => {
    eqCounts[l.equipment_id] = (eqCounts[l.equipment_id] || 0) + 1;
  });

  const topEquipments = Object.entries(eqCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => {
      const eq = equipments.find(n => n.id === id);
      return { tag: eq?.asset_tag || 'Desconhecido', model: eq?.model, count };
    });

  // Find active users (most loans)
  const userCounts: Record<string, number> = {};
  loans.forEach(l => {
    userCounts[l.user_id] = (userCounts[l.user_id] || 0) + 1;
  });

  const topUsers = Object.entries(userCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => {
      const u = users.find(user => user.id === id);
      return { name: u?.name || 'Desconhecido', doc: u?.document_id, count };
    });

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 border-b border-slate-200 pb-4 flex items-center">
        <BarChart3 className="mr-3 text-teal-600" /> Relatórios de Uso
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
          <div className="p-3 bg-teal-50 rounded-full mb-3 text-teal-600"><TrendingUp /></div>
          <h3 className="text-slate-500 font-semibold text-sm uppercase tracking-wider">Total de Locações</h3>
          <p className="text-3xl font-bold text-slate-900">{totalLoans}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
          <div className="p-3 bg-blue-50 rounded-full mb-3 text-blue-600"><BarChart3 /></div>
          <h3 className="text-slate-500 font-semibold text-sm uppercase tracking-wider">Tempo Médio</h3>
          <p className="text-3xl font-bold text-slate-900">{avgHours} <span className="text-lg text-slate-400">h</span></p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
          <div className="p-3 bg-purple-50 rounded-full mb-3 text-purple-600"><Users /></div>
          <h3 className="text-slate-500 font-semibold text-sm uppercase tracking-wider">Usuários Atendidos</h3>
          <p className="text-3xl font-bold text-slate-900">{Object.keys(userCounts).length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white border text-left border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-slate-50/80 p-4 border-b border-slate-100">
             <h3 className="font-bold text-slate-800">Equipamentos Mais Utilizados</h3>
          </div>
          <ul className="divide-y divide-slate-100">
             {topEquipments.length === 0 ? <li className="p-4 text-slate-500 font-medium">Nenhum dado de empréstimo.</li> : 
             topEquipments.map((eq, i) => (
               <li key={i} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                 <div>
                   <p className="font-semibold text-slate-900 font-mono">{eq.tag}</p>
                   <p className="text-xs text-slate-500 font-medium">{eq.model}</p>
                 </div>
                 <div className="bg-teal-50 text-teal-800 font-bold px-3 py-1.5 rounded-lg text-xs uppercase tracking-wide border border-teal-100">
                   {eq.count} usos
                 </div>
               </li>
             ))}
          </ul>
        </div>

        <div className="bg-white border text-left border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-slate-50/80 p-4 border-b border-slate-100">
             <h3 className="font-bold text-slate-800">Usuários Mais Ativos</h3>
          </div>
          <ul className="divide-y divide-slate-100">
             {topUsers.length === 0 ? <li className="p-4 text-slate-500 font-medium">Nenhum dado de empréstimo.</li> :
             topUsers.map((u, i) => (
               <li key={i} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                 <div>
                   <p className="font-semibold text-slate-900">{u.name}</p>
                   <p className="text-xs text-slate-500 font-mono">{u.doc}</p>
                 </div>
                 <div className="bg-blue-50 text-blue-800 font-bold px-3 py-1.5 rounded-lg text-xs uppercase tracking-wide border border-blue-100">
                   {u.count} ret.
                 </div>
               </li>
             ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

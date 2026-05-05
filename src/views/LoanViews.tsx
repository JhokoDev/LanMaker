import React, { useEffect, useState } from 'react';
import { LoanController } from '../controllers/LoanController';
import { EquipmentController } from '../controllers/EquipmentController';
import { UserController } from '../controllers/UserController';
import { Loan, Equipment, User } from '../models';
import { format, formatDistanceToNow, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, CheckCircle, AlertCircle, Plus, Laptop, Smartphone, Tablet } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function LoanViews() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [loans, setLoans] = useState<Loan[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Form
  const [isAdding, setIsAdding] = useState(false);
  const [newLoan, setNewLoan] = useState({ user_id: '', equipment_id: '', hours: 2, purpose: '' });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setErrorMsg('');
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
      setErrorMsg('Erro ao comunicar com o banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoan.user_id || !newLoan.equipment_id) return;
    
    setErrorMsg('');
    try {
      const borrowedAt = new Date();
      const expectedReturn = new Date(borrowedAt.getTime() + newLoan.hours * 3600 * 1000);

      await LoanController.create({
        user_id: newLoan.user_id,
        equipment_id: newLoan.equipment_id,
        borrowed_at: borrowedAt.toISOString(),
        expected_return_at: expectedReturn.toISOString(),
        purpose: newLoan.purpose || undefined,
      });
      
      setIsAdding(false);
      setNewLoan({ user_id: '', equipment_id: '', hours: 2, purpose: '' });
      load();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao registrar empréstimo.');
    }
  };

  const returnLoan = async (loanId: string, equipmentId: string) => {
    try {
      await LoanController.returnLoan(loanId, equipmentId);
      load();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao devolver equipamento.');
    }
  };

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || id;
  const getEquipment = (id: string) => equipments.find(e => e.id === id);
  const getAvailableEqs = () => equipments.filter(n => n.status === 'available');

  const getStatusBadge = (loan: Loan) => {
    if (loan.status === 'returned') {
      return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium flex items-center w-max"><CheckCircle className="w-3 h-3 mr-1" /> Devolvido</span>;
    }
    
    const isOverdue = isPast(new Date(loan.expected_return_at));
    if (isOverdue) {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium flex items-center w-max"><AlertCircle className="w-3 h-3 mr-1" /> Atrasado</span>;
    }

    return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium flex items-center w-max"><Clock className="w-3 h-3 mr-1" /> Ativo</span>;
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case 'celular': return <Smartphone className="h-4 w-4 text-gray-500" />;
      case 'tablet': return <Tablet className="h-4 w-4 text-gray-500" />;
      default: return <Laptop className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {isAdmin ? 'Controle de Empréstimos' : 'Meus Empréstimos'}
        </h1>
        {isAdmin && (
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Empréstimo</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-100 border border-red-300 text-red-800 rounded-xl text-sm">
          {errorMsg}
        </div>
      )}

      {isAdding && (
        <form onSubmit={add} className="bg-white p-5 rounded-2xl border border-teal-200 shadow-md mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Equipamento</label>
              <select required value={newLoan.equipment_id} onChange={e => setNewLoan({...newLoan, equipment_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white">
                <option value="">Selecione...</option>
                {getAvailableEqs().map(e => <option key={e.id} value={e.id}>{e.equipment_type.toUpperCase()} - {e.asset_tag} - {e.model}</option>)}
              </select>
              {getAvailableEqs().length === 0 && <p className="text-red-500 text-xs mt-1">Nenhum equipamento disponível no banco de dados.</p>}
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Usuário</label>
              <select required value={newLoan.user_id} onChange={e => setNewLoan({...newLoan, user_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white">
                <option value="">Selecione...</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name} (Mat.: {u.document_id})</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Finalidade (Opcional)</label>
              <input type="text" maxLength={100} value={newLoan.purpose} onChange={e => setNewLoan({...newLoan, purpose: e.target.value})} placeholder="P. ex: Prova, Aula de Programação, etc." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="w-full md:w-32">
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Tempo (Horas)</label>
              <input type="number" min="1" max="12" required value={newLoan.hours} onChange={e => setNewLoan({...newLoan, hours: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="w-full md:w-auto pb-0">
              <button type="submit" className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">Registrar</button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Equipamento</th>
                <th className="px-6 py-4 font-semibold">Usuário</th>
                <th className="px-6 py-4 font-semibold">Finalidade</th>
                <th className="px-6 py-4 font-semibold">Retirada</th>
                <th className="px-6 py-4 font-semibold">Devolução Prev.</th>
                <th className="px-6 py-4 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Buscando banco de dados...</td></tr>
              ) : loans.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Nenhum empréstimo registrado no banco.</td></tr>
              ) : (
                loans.map(loan => {
                  const eq = getEquipment(loan.equipment_id);
                  return (
                  <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">{getStatusBadge(loan)}</td>
                    <td className="px-6 py-4 font-mono font-medium text-gray-900 flex items-center gap-2">
                       {getIcon(eq?.equipment_type)} 
                       {eq?.asset_tag || loan.equipment_id}
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-medium">{getUserName(loan.user_id)}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{loan.purpose || '-'}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {format(new Date(loan.borrowed_at), "dd/MM/yy HH:mm")}
                      <br/>
                      <span className="text-gray-400 italic">Há {formatDistanceToNow(new Date(loan.borrowed_at), { locale: ptBR })}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                       {loan.returned_at ? (
                         <span className="text-emerald-600 font-semibold">
                           Devolvido às {format(new Date(loan.returned_at), "HH:mm")}
                         </span>
                       ) : (
                         <>
                           {format(new Date(loan.expected_return_at), "dd/MM/yy HH:mm")}
                           <br/>
                           <span className={isPast(new Date(loan.expected_return_at)) ? 'text-red-500 font-semibold' : 'text-gray-400'}>
                             {isPast(new Date(loan.expected_return_at)) 
                              ? `Atrasado` 
                              : `Em ${formatDistanceToNow(new Date(loan.expected_return_at), { locale: ptBR })}`}
                           </span>
                         </>
                       )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {loan.status !== 'returned' && (
                        <button 
                          onClick={() => returnLoan(loan.id, loan.equipment_id)}
                          className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Devolver
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

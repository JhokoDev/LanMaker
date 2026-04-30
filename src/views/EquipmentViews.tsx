import React, { useEffect, useState } from 'react';
import { EquipmentController } from '../controllers/EquipmentController';
import { Equipment } from '../models';
import { Search, Plus, Laptop, Smartphone, Tablet } from 'lucide-react';

export function EquipmentViews() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [term, setTerm] = useState('');

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newEqp, setNewEqp] = useState<{
    asset_tag: string;
    equipment_type: 'notebook' | 'celular' | 'tablet';
    model: string;
    condition: string;
  }>({ asset_tag: '', equipment_type: 'notebook', model: '', condition: '' });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await EquipmentController.getAll();
      setEquipments(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro ao carregar equipamentos do banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEqp.asset_tag || !newEqp.model) return;
    
    setErrorMsg('');
    try {
      await EquipmentController.create({ 
        asset_tag: newEqp.asset_tag,
        equipment_type: newEqp.equipment_type,
        model: newEqp.model, 
        condition: newEqp.condition, 
        status: 'available' 
      });
      setIsAdding(false);
      setNewEqp({ asset_tag: '', equipment_type: 'notebook', model: '', condition: '' });
      load();
    } catch(err: any) {
       console.error(err);
       setErrorMsg(err.message || 'Erro ao cadastrar equipamento.');
    }
  };

  const filtered = equipments.filter(eq => 
    eq.asset_tag.toLowerCase().includes(term.toLowerCase()) || 
    eq.model.toLowerCase().includes(term.toLowerCase())
  );

  const statusColors = {
    'available': 'bg-emerald-100 text-emerald-800',
    'in_use': 'bg-blue-100 text-blue-800',
    'maintenance': 'bg-red-100 text-red-800'
  };
  
  const statusLabels = {
    'available': 'Disponível',
    'in_use': 'Em Uso',
    'maintenance': 'Manutenção'
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'celular': return <Smartphone className="h-4 w-4 text-gray-500" />;
      case 'tablet': return <Tablet className="h-4 w-4 text-gray-500" />;
      default: return <Laptop className="h-4 w-4 text-gray-500" />;
    }
  };

  const typeLabels = {
    'notebook': 'Notebook',
    'celular': 'Celular',
    'tablet': 'Tablet'
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">Equipamentos</h1>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-[#00825b] hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Cadastrar Equipamento</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {isAdding && (
        <form onSubmit={add} className="bg-white p-6 rounded-2xl border border-teal-100 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tipo</label>
            <select 
              value={newEqp.equipment_type} 
              onChange={e => setNewEqp({...newEqp, equipment_type: e.target.value as any})}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50 text-slate-800 font-medium"
            >
              <option value="notebook">Notebook</option>
              <option value="celular">Celular</option>
              <option value="tablet">Tablet</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Patrimônio</label>
            <input required value={newEqp.asset_tag} onChange={e => setNewEqp({...newEqp, asset_tag: e.target.value})} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50" placeholder="Ex: NB-105" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Modelo</label>
            <input required value={newEqp.model} onChange={e => setNewEqp({...newEqp, model: e.target.value})} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50" placeholder="Ex: Dell Inspiron" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Condição</label>
            <input value={newEqp.condition} onChange={e => setNewEqp({...newEqp, condition: e.target.value})} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-slate-50" placeholder="Ex: Novo, Tela riscada..." />
          </div>
          <div className="flex items-end pb-1">
            <button type="submit" className="w-full md:w-auto bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-xl font-semibold transition-colors">Salvar</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center">
          <Search className="h-5 w-5 text-slate-400 mr-2" />
          <input 
            type="text" 
            placeholder="Buscar patrimônio ou modelo..." 
            value={term}
            onChange={e => setTerm(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none text-slate-700"
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-semibold">
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Patrimônio</th>
                <th className="px-6 py-4">Modelo</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Condição</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Buscando do banco de dados...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Nenhum equipamento cadastrado ou encontrado.</td></tr>
              ) : (
                filtered.map(eq => (
                  <tr key={eq.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                         <div className="p-1.5 bg-slate-100 rounded-md">
                           {getIcon(eq.equipment_type)}
                         </div>
                         <span className="font-medium text-slate-700">{typeLabels[eq.equipment_type] || eq.equipment_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold text-slate-900">{eq.asset_tag}</td>
                    <td className="px-6 py-4">{eq.model}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                        eq.status === 'available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        eq.status === 'in_use' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {statusLabels[eq.status] || eq.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 truncate max-w-xs">{eq.condition || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

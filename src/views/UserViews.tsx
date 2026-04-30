import React, { useEffect, useState } from 'react';
import { UserController } from '../controllers/UserController';
import { User } from '../models';
import { Search, UserPlus } from 'lucide-react';

export function UserViews() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [term, setTerm] = useState('');

  // Form
  const [isAdding, setIsAdding] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', document_id: '', email: '' });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await UserController.getAll();
      setUsers(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.document_id) return;
    
    setErrorMsg('');
    try {
      await UserController.create(newUser);
      setIsAdding(false);
      setNewUser({ name: '', document_id: '', email: '' });
      load();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao criar usuário.');
    }
  };

  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(term.toLowerCase()) || 
    (u.document_id && u.document_id.toLowerCase().includes(term.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(term.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Usuários</h1>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          <span>Cadastrar Usuário</span>
        </button>
      </div>
      
      {errorMsg && (
        <div className="p-4 bg-red-100 border border-red-300 text-red-800 rounded-xl text-sm">
          {errorMsg}
        </div>
      )}

      {isAdding && (
        <form onSubmit={add} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Nome</label>
            <input required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Nome Completo" />
          </div>
          <div className="flex-2 md:w-48">
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Documento (RA/CPF)</label>
            <input required value={newUser.document_id} onChange={e => setNewUser({...newUser, document_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="000000" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Email</label>
            <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="exemplo@edu.br (opcional)" />
          </div>
          <div className="flex items-end pb-1">
            <button type="submit" className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">Salvar</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center">
          <Search className="h-5 w-5 text-gray-400 mr-2" />
          <input 
            type="text" 
            placeholder="Buscar por nome, documento ou email..." 
            value={term}
            onChange={e => setTerm(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm w-full outline-none"
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4 font-semibold">Nome</th>
                <th className="px-6 py-4 font-semibold">Documento</th>
                <th className="px-6 py-4 font-semibold">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">Buscando dados no banco...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">Nenhum usuário cadastrado.</td></tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">{u.document_id || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{u.email || '-'}</td>
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

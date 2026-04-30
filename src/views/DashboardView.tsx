import React, { useEffect, useState } from 'react';
import { EquipmentController } from '../controllers/EquipmentController';
import { Equipment } from '../models';
import { Laptop, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function DashboardView() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const eqs = await EquipmentController.getAll();
      setEquipments(eqs);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao carregar os dados.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse flex space-x-4"><div className="flex-1 space-y-4 py-1"><div className="h-4 bg-gray-200 rounded w-3/4"></div><div className="space-y-2"><div className="h-4 bg-gray-200 rounded"></div><div className="h-4 bg-gray-200 rounded w-5/6"></div></div></div></div>;
  }

  const available = equipments.filter(n => n.status === 'available').length;
  const inUse = equipments.filter(n => n.status === 'in_use').length;
  const maintenance = equipments.filter(n => n.status === 'maintenance').length;
  
  const stats = [
    { label: 'Disponíveis', value: available, icon: CheckCircle, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Em Uso', value: inUse, icon: Laptop, color: 'bg-blue-100 text-blue-600' },
    { label: 'Em Manutenção', value: maintenance, icon: AlertTriangle, color: 'bg-red-100 text-red-600' },
    { label: 'Total Físico', value: equipments.length, icon: Clock, color: 'bg-gray-100 text-gray-600' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900">Visão Geral</h1>
      
      {errorMsg && (
        <div className="p-4 bg-red-100 border border-red-300 text-red-800 rounded-xl text-sm mb-4">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
            <div className={`p-4 rounded-xl ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <p className="text-3xl font-semibold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {isAdmin && (
        <div className="mt-8 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Acesso Rápido</h2>
          <p className="text-gray-500 mb-6">Utilize o menu lateral para gerenciar o laboratório de informática. Os dados são salvos diretamente no Supabase.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-1">Para emprestar um equipamento:</h3>
              <ol className="list-decimal ml-4 text-sm text-gray-600 space-y-1">
                <li>Cadastre o usuário na aba <b>Usuários</b>.</li>
                <li>Acesse a aba <b>Empréstimos</b>.</li>
                <li>Selecione um equipamento disponível e o usuário.</li>
              </ol>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-1">Para adicionar estoque (Equipamentos):</h3>
              <ol className="list-decimal ml-4 text-sm text-gray-600 space-y-1">
                <li>Acesse a aba <b>Equipamentos</b>.</li>
                <li>Clique no botão "Cadastrar Equipamento".</li>
                <li>Insira o tipo, etiqueta de patrimônio e modelo.</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

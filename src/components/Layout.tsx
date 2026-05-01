import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Laptop, Users, CalendarSync, BarChart3, Menu, X, LogOut, PanelLeftClose, UserCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, signOut } = useAuth();

  const isAdmin = profile?.role === 'admin';

  const navItems = isAdmin ? [
    { name: 'Painel', path: '/', icon: LayoutDashboard },
    { name: 'Equipamentos', path: '/notebooks', icon: Laptop },
    { name: 'Usuários', path: '/users', icon: Users },
    { name: 'Empréstimos', path: '/loans', icon: CalendarSync },
    { name: 'Relatórios', path: '/reports', icon: BarChart3 },
  ] : [
    { name: 'Painel', path: '/', icon: LayoutDashboard },
    { name: 'Meus Empréstimos', path: '/loans', icon: CalendarSync },
  ];

  const hasSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 w-full bg-white border-b border-gray-200 z-50 flex items-center justify-between p-4">
        <div className="flex items-center space-x-2 text-teal-700">
          <div className="p-1.5 bg-teal-50 rounded-lg">
             <Laptop className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold text-slate-800">LanMaker</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 -mr-2 text-gray-600 focus:outline-none">
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo area */}
        <div className="p-6 flex items-center space-x-3 mb-2">
          <div className="p-2 bg-teal-50 rounded-xl text-teal-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-slate-800 leading-tight">LanMaker</span>
            <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">{isAdmin ? 'Administrador' : 'Área do Aluno'}</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-semibold ${
                  isActive 
                    ? 'bg-[#00825b] text-white shadow-md shadow-teal-700/20' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <item.icon className={`h-5 w-5 ${/* Keeping icons simple */ ''}`} />
              <span className="text-[15px]">{item.name}</span>
            </NavLink>
          ))}
        </nav>
        
        {/* Bottom Actions */}
        <div className="p-4 space-y-1.5 pb-6">
          <NavLink 
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => 
              `w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors font-semibold truncate ${
                isActive 
                  ? 'bg-teal-50 text-teal-700' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <UserCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-[15px] truncate">{profile?.name || 'Meu Perfil'}</span>
          </NavLink>
          
          <button onClick={signOut} className="w-full flex items-center space-x-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-semibold">
            <LogOut className="h-5 w-5" />
            <span className="text-[15px]">Sair da Conta</span>
          </button>

          <div className="pt-2">
            <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-[#d5ede1] text-[#00825b] hover:bg-[#c2e5d5] rounded-xl transition-colors font-bold">
              <PanelLeftClose className="h-5 w-5" />
              <span>Recolher</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50 pt-20 md:pt-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto h-full">
          {!hasSupabaseUrl && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-xl flex items-start space-x-3 text-sm">
              <span className="font-bold flex-shrink-0">Atenção:</span>
              <p>
                O banco de dados (Supabase) não está configurado. O sistema foi reescrito na arquitetura MVC para não usar mais dados falsos.
                <strong> Você precisa adicionar VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas suas variáveis de ambiente</strong> e inicializar as tabelas via <strong>supabase-schema.sql</strong>.
              </p>
            </div>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  );
}


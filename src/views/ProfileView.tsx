import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'motion/react';
import { User, Mail, Shield, Calendar, UserCircle, Save, Loader2, Key } from 'lucide-react';
import { UserController } from '../controllers/UserController';
import { AuthController } from '../controllers/AuthController';
import { toast } from 'sonner';

export function ProfileView() {
  const { profile, user, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [documentId, setDocumentId] = useState(profile?.document_id || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (documentId && !/^\d{12}$/.test(documentId)) {
      toast.error('A matrícula deve conter exatamente 12 dígitos numéricos.');
      return;
    }

    setIsUpdating(true);
    try {
      await UserController.update(profile.id, {
        name,
        document_id: documentId
      });
      await refreshProfile();
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao atualizar perfil: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    setIsChangingPassword(true);
    try {
      const { error } = await AuthController.resetPassword(profile.email);
      if (error) throw error;
      toast.success('Link de redefinição de senha enviado para seu e-mail!');
    } catch (error: any) {
      toast.error('Erro ao solicitar troca de senha: ' + error.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Meu Perfil</h1>
        <p className="text-slate-500 mt-1">Gerencie suas informações pessoais e configurações de conta.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Lado Esquerdo: Info Resumida */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
            <div className="w-24 h-24 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserCircle className="h-12 w-12 text-teal-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
            <p className="text-sm text-teal-600 font-bold uppercase tracking-wider mt-1">
              {profile.role === 'admin' ? 'Administrador' : 'Usuário'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest">Detalhes da Conta</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-slate-600">
                <Mail className="h-4 w-4" />
                <span className="text-sm truncate">{profile.email}</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-600">
                <Shield className="h-4 w-4" />
                <span className="text-sm capitaize">{profile.role}</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-600">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Membro desde {profile.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR') : '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Formulário de Edição */}
        <div className="md:col-span-2 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <User className="h-5 w-5 text-teal-600" />
              Informações Pessoais
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Nome Completo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    placeholder="Seu nome"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Matrícula</label>
                  <input
                    type="text"
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-mono"
                    placeholder="12 dígitos"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-70"
                >
                  {isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-500" />
              Segurança
            </h3>
            <p className="text-sm text-slate-500 mb-6">Mantenha sua conta segura alterando sua senha periodicamente.</p>
            
            <button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-70"
            >
              {isChangingPassword ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
              <span>Solicitar Troca de Senha por E-mail</span>
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

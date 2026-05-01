import React, { useState } from 'react';
import { LogIn, Beaker, ShieldCheck, Globe, Loader2, Mail, Lock, UserPlus, Clock } from 'lucide-react';
import { AuthController } from '../controllers/AuthController';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Logo } from '../components/Logo';

export function LoginView() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const loadingRef = React.useRef(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Check if Supabase is properly configured
  const isSupabaseConfigured = 
    import.meta.env.VITE_SUPABASE_URL && 
    import.meta.env.VITE_SUPABASE_URL !== 'your-project-url' &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    import.meta.env.VITE_SUPABASE_ANON_KEY !== 'your-anon-key';

  // Sync ref with state
  React.useEffect(() => {
    loadingRef.current = isLoggingIn;
  }, [isLoggingIn]);

  // Listen for popup messages
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SUPABASE_AUTH_SUCCESS') {
        toast.success('Login realizado com sucesso!');
        // The AuthProvider will detect the session change automatically
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Check for recovery hash on mount
  React.useEffect(() => {
    if (window.location.hash.includes('type=recovery')) {
      setMode('reset');
    }
  }, []);

  // Lockout countdown timer
  React.useEffect(() => {
    if (lockoutSeconds <= 0) return;
    
    const timer = setInterval(() => {
      setLockoutSeconds(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSupabaseConfigured) {
      toast.error('Configuração do Supabase ausente!', {
        description: 'Você precisa configurar as chaves do Supabase nos Secrets do AI Studio para que o login funcione.'
      });
      return;
    }

    if (isLoggingIn) return;
    
    if (mode === 'forgot') {
      if (!email) {
        toast.error('Por favor, informe seu e-mail.');
        return;
      }
      setIsLoggingIn(true);
      try {
        const { error } = await AuthController.resetPassword(email);
        if (error) throw error;
        toast.success('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
        setMode('login');
      } catch (error: any) {
        toast.error(`Erro: ${error.message}`);
      } finally {
        setIsLoggingIn(false);
      }
      return;
    }

    if (mode === 'reset') {
      if (!password) {
        toast.error('Por favor, informe a nova senha.');
        return;
      }
      setIsLoggingIn(true);
      try {
        const { error } = await AuthController.updatePassword(password);
        if (error) throw error;
        toast.success('Senha atualizada com sucesso!');
        setMode('login');
        window.location.hash = '';
      } catch (error: any) {
        toast.error(`Erro: ${error.message}`);
      } finally {
        setIsLoggingIn(false);
      }
      return;
    }

    if (!email || !password || (mode === 'register' && !name)) {
      toast.error('Por favor, preencha todos os campos.');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsLoggingIn(true);
    console.log(`[Auth] Starting ${mode} for ${email}`);
    
    // Add a safety timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      if (loadingRef.current) {
        console.warn("[Auth] Operation timed out after 15s");
        setIsLoggingIn(false);
        toast.error("A operação está demorando mais que o esperado.", {
          description: "Verifique sua conexão ou se as chaves do Supabase estão corretas."
        });
      }
    }, 15000);

    try {
      if (mode === 'login') {
        console.log("[Auth] Attempting login...");
        const { error } = await AuthController.signInWithPassword(email, password);
        if (error) throw error;
        console.log("[Auth] Login successful");
        toast.success('Login realizado com sucesso!');
      } else if (mode === 'register') {
        console.log("[Auth] Attempting registration for:", email);
        const { data: signUpData, error: signUpError } = await AuthController.signUp(email, password, name);
        
        if (signUpError) {
          console.error("[Auth] SignUp error:", signUpError);
          throw signUpError;
        }
        
        const user = signUpData.user;
        const session = signUpData.session;

        // If identities is empty, the email might already be registered
        if (user && (!user.identities || user.identities.length === 0)) {
          console.log("[Auth] User already exists in Supabase");
          toast.info('Este e-mail já está cadastrado. Tente fazer login ou recuperar a senha.');
          setMode('login');
        } else if (session) {
          console.log("[Auth] User created and logged in automatically.");
          toast.success('Conta criada e logada com sucesso!');
          // AuthProvider will handle the session change
        } else {
          console.log("[Auth] User created in Auth. Switching to login mode.");
          toast.success('Conta criada com sucesso!', {
            description: 'Verifique seu e-mail para confirmar o cadastro. Se não encontrar, veja na pasta de Spam.'
          });
          setMode('login');
        }
      }
    } catch (error: any) {
      console.error("[Auth] Caught error:", error);
      const message = error.message || '';
      
      if (message === 'Invalid login credentials') {
        toast.error('E-mail ou senha incorretos.', {
          description: 'Verifique se digitou corretamente ou se já confirmou seu e-mail.'
        });
      } else if (message.includes('For security purposes, you can only request this after')) {
        const seconds = parseInt(message.match(/\d+/)?.[0] || '60');
        setLockoutSeconds(seconds);
        toast.error(`Muitas tentativas! Por segurança, aguarde ${seconds} segundos.`);
      } else if (message === 'Email not confirmed') {
        toast.error('E-mail não confirmado.', {
          description: 'Verifique sua caixa de entrada (e spam) para o link de ativação.'
        });
      } else if (message === 'email rate limit exceeded') {
        toast.error('Limite de e-mails excedido. Tente novamente em alguns minutos.');
      } else if (message.includes('User already registered')) {
        toast.error('Este e-mail já está em uso. Tente fazer login.');
        setMode('login');
      } else {
        toast.error(`Erro: ${message}`);
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoggingIn(false);
      console.log("[Auth] Auth operation finished, isLoggingIn set to false");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FBFDF9] p-0 sm:p-4 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full sm:max-w-md h-full sm:h-auto min-h-screen sm:min-h-0 bg-white sm:elevation-1 sm:rounded-3xl p-6 sm:p-8 flex flex-col justify-center gap-6 sm:gap-8 border-none sm:border border-slate-100"
      >
        <div className="text-center space-y-3">
          <div className="inline-flex bg-teal-500/10 rounded-3xl p-4 sm:p-5 mb-1 sm:mb-4 shadow-sm overflow-hidden mx-auto transition-transform hover:scale-105">
            <Logo size={72} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">LanMaker</h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium">Gestão Inteligente de Laboratórios</p>
          </div>
        </div>

        <div className="flex p-1 bg-slate-50 rounded-xl">
          <button 
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'login' || mode === 'forgot' || mode === 'reset' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-400'}`}
          >
            Entrar
          </button>
          <button 
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'register' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-400'}`}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <AnimatePresence mode="wait">
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1"
              >
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nome Completo</label>
                <div className="relative">
                  <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-teal-500/30 transition-all"
                    placeholder="Seu nome"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {mode !== 'reset' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-teal-500/30 transition-all"
                  placeholder="exemplo@gmail.com"
                />
              </div>
            </div>
          )}

          {mode !== 'forgot' && (
            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-slate-400 uppercase">{mode === 'reset' ? 'Nova Senha' : 'Senha'}</label>
                {mode === 'login' && (
                  <button 
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[10px] font-bold text-teal-600 hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-teal-500/30 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoggingIn || lockoutSeconds > 0}
            className="w-full flex items-center justify-center gap-3 bg-teal-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-teal-500 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : lockoutSeconds > 0 ? (
              <Clock className="w-5 h-5" />
            ) : (
              mode === 'login' ? <LogIn className="w-5 h-5" /> : 
              mode === 'register' ? <UserPlus className="w-5 h-5" /> :
              mode === 'forgot' ? <Mail className="w-5 h-5" /> :
              <Lock className="w-5 h-5" />
            )}
            {lockoutSeconds > 0 ? `Aguarde ${lockoutSeconds}s` : (
              mode === 'login' ? (isLoggingIn ? 'Entrando...' : 'Entrar') : 
              mode === 'register' ? (isLoggingIn ? 'Cadastrando...' : 'Criar Conta') :
              mode === 'forgot' ? (isLoggingIn ? 'Enviando...' : 'Recuperar Senha') :
              (isLoggingIn ? 'Redefinindo...' : 'Redefinir Senha')
            )}
          </button>
          
          {(mode === 'forgot' || mode === 'reset') && (
            <button 
              type="button"
              onClick={() => setMode('login')}
              className="w-full text-center text-xs font-bold text-slate-400 hover:text-teal-600 transition-colors"
            >
              Voltar para o Login
            </button>
          )}
        </form>

        {lockoutSeconds > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pt-2 text-center"
          >
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
              Por favor espere {lockoutSeconds}s para tentar novamente
            </p>
          </motion.div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-xl">
            <ShieldCheck className="text-teal-600 w-4 h-4" />
            <p className="text-[10px] font-bold text-slate-600 uppercase">Seguro</p>
          </div>
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl">
            <Globe className="text-blue-600 w-4 h-4" />
            <p className="text-[10px] font-bold text-slate-600 uppercase">Global</p>
          </div>
        </div>

        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-2">
          <p className="text-[11px] text-amber-700 leading-relaxed">
            <span className="font-bold">Atenção:</span> O LanMaker exige confirmação de e-mail por padrão. Se você não receber o e-mail, verifique o <span className="font-bold">Spam</span>.
          </p>
        </div>
      </motion.div>
    </div>
  );
}


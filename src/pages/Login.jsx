import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoFitness, IoLogoGoogle, IoMailOutline, IoLockClosedOutline } from 'react-icons/io5';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/stores';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, register, error, loading, clearError } = useAuthStore();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      navigate('/');
    } catch {
      // Error is handled in store
    }
  };

  const handleGoogleLogin = async () => {
    clearError();
    try {
      await loginWithGoogle();
      navigate('/');
    } catch {
      // Error is handled in store
    }
  };

  return (
    <div className="min-h-screen min-h-dvh flex flex-col bg-slate-950 safe-area-top overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[20%] left-[10%] w-32 h-32 bg-emerald-500/10 rounded-full blur-[60px]" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        {/* Logo Section */}
        <div className="mb-12 text-center animate-fadeIn group">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000" />
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 bg-white dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/20 dark:border-slate-700/50">
              <IoFitness className="w-12 h-12 sm:w-14 sm:h-14 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter">
            FIT<span className="text-blue-500">TRAK</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm font-bold uppercase tracking-[0.3em]">Premium Fitness Ecosystem</p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-sm bg-white dark:bg-slate-900/80 backdrop-blur-xl rounded-[3rem] shadow-2xl shadow-blue-500/10 p-8 sm:p-10 animate-scale-in border border-white/20 dark:border-slate-800/50">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isRegister ? 'Nueva Cuenta' : 'Bienvenido'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
              {isRegister ? 'Comienza tu transformación' : 'Accede a tu panel'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-bold animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative group">
              <IoMailOutline className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" />
              <Input
                type="email"
                placeholder="Email corporativo o personal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-800 transition-all font-medium"
                required
              />
            </div>

            <div className="relative group">
              <IoLockClosedOutline className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10" />
              <Input
                type="password"
                placeholder="Contraseña segura"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-transparent focus:bg-white dark:focus:bg-slate-800 transition-all font-medium"
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 rounded-2xl premium-gradient text-white font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
              loading={loading}
            >
              {isRegister ? 'Registrarme' : 'Entrar'}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white dark:bg-slate-900 text-slate-400 text-[10px] font-black uppercase tracking-widest">o continúa con</span>
            </div>
          </div>

          <button
            type="button"
            className="w-full h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center gap-3 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <IoLogoGoogle className="w-5 h-5 text-rose-500" />
            <span>Google ID</span>
          </button>

          <p className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 mt-8 tracking-wide">
            {isRegister ? '¿YA TIENES CUENTA?' : '¿ERES NUEVO AQUÍ?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                clearError();
              }}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors underline decoration-2 underline-offset-4"
            >
              {isRegister ? 'INICIA SESIÓN' : 'ÚNETE AHORA'}
            </button>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="py-8 text-center relative z-10">
        <p className="text-slate-500 dark:text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">
          FitTrak <span className="text-blue-500/50">PRO</span> • Versión 2.0.0 Alpha
        </p>
      </div>
    </div>
  );
}

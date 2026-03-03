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
    <div className="min-h-screen min-h-dvh flex flex-col bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 safe-area-top">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/30 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
        {/* Logo */}
        <div className="mb-8 text-center animate-fade-in">
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-blue-900/30">
            <IoFitness className="w-12 h-12 sm:w-14 sm:h-14 text-blue-600" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">FitTrack</h1>
          <p className="text-blue-200 mt-2 text-lg">Tu companero fitness</p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl shadow-black/20 p-6 sm:p-8 animate-scale-in">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
            {isRegister ? 'Crear cuenta' : 'Bienvenido'}
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <IoMailOutline className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
              <Input
                type="email"
                placeholder="Correo electronico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12"
                required
              />
            </div>

            <div className="relative">
              <IoLockClosedOutline className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
              <Input
                type="password"
                placeholder="Contrasena"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12"
                required
                minLength={6}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-lg font-semibold"
              loading={loading}
            >
              {isRegister ? 'Crear cuenta' : 'Iniciar sesion'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-gray-400 text-sm">o continua con</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-14 text-base font-medium"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <IoLogoGoogle className="w-5 h-5 mr-3 text-red-500" />
            Google
          </Button>

          <p className="text-center text-sm text-gray-500 mt-6">
            {isRegister ? 'Ya tienes cuenta?' : 'No tienes cuenta?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                clearError();
              }}
              className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
            >
              {isRegister ? 'Inicia sesion' : 'Registrate'}
            </button>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 text-center relative z-10">
        <p className="text-blue-300/70 text-sm">
          FitTrack Pro v1.0.0
        </p>
      </div>
    </div>
  );
}

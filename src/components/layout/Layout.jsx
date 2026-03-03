import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  IoFitnessOutline,
  IoFitness,
  IoHomeOutline,
  IoHome,
  IoLogOutOutline,
  IoNutritionOutline,
  IoNutrition,
  IoPersonOutline,
  IoPerson,
  IoWaterOutline,
  IoWater,
  IoMoonOutline,
  IoSunnyOutline,
  IoPlayCircle,
  IoTimeOutline,
} from 'react-icons/io5';
import { Modal, Button } from '@/components/ui';
import { useAuthStore, useUserStore, useWorkoutStore } from '@/stores';

const navItems = [
  { to: '/', label: 'Inicio', icon: IoHomeOutline, activeIcon: IoHome },
  { to: '/nutrition', label: 'Nutricion', icon: IoNutritionOutline, activeIcon: IoNutrition },
  { to: '/workouts', label: 'Entrenos', icon: IoFitnessOutline, activeIcon: IoFitness },
  { to: '/water', label: 'Agua', icon: IoWaterOutline, activeIcon: IoWater },
  { to: '/profile', label: 'Perfil', icon: IoPersonOutline, activeIcon: IoPerson },
];

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { darkMode, toggleDarkMode } = useUserStore();
  const { activeSession } = useWorkoutStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const userId = user?.uid;
  const hasActiveSession = Boolean(activeSession?.id);
  const isOnWorkoutPage = location.pathname === '/workouts';

  // Session timer
  useEffect(() => {
    if (!activeSession?.startTime) {
      setSessionElapsed(0);
      return;
    }
    const startTime = new Date(activeSession.startTime).getTime();
    const tick = () => setSessionElapsed(Math.floor((Date.now() - startTime) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeSession?.startTime]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setShowLogoutModal(false);
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen min-h-dvh bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-lg mx-auto px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
              <IoFitnessOutline className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.15em] text-blue-600 dark:text-blue-400 font-bold">FitTrack Pro</p>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium truncate">{user?.email || 'Atleta'}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => toggleDarkMode(userId)}
              className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl text-slate-600 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all outline-none"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <IoSunnyOutline className="w-5 h-5" /> : <IoMoonOutline className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="inline-flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-2xl text-slate-600 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 transition-all active:scale-95"
            >
              <IoLogOutOutline className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Active Session Floating Banner - shows when NOT on workouts page */}
      {hasActiveSession && !isOnWorkoutPage && (
        <div className="sticky top-[57px] sm:top-[65px] z-30">
          <button
            onClick={() => navigate('/workouts')}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2.5 flex items-center justify-between gap-3 active:opacity-90 transition-opacity"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <IoPlayCircle className="w-5 h-5" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-black truncate">{activeSession.routineName}</p>
                <p className="text-[10px] opacity-80">Entrenamiento en curso</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <IoTimeOutline className="w-4 h-4 opacity-80" />
              <span className="text-sm font-mono font-bold tabular-nums">{formatDuration(sessionElapsed)}</span>
            </div>
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 sm:pb-28">
        <div className="max-w-lg mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/70 z-50 safe-area-bottom">
        <div className="flex justify-around items-center max-w-lg mx-auto px-2 sm:px-4 pt-1.5 sm:pt-2 pb-3 sm:pb-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center py-1 transition-all duration-300 relative ${isActive
                  ? 'text-blue-600 dark:text-blue-300'
                  : 'text-slate-500 dark:text-slate-200 hover:text-slate-700 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => {
                const IconComponent = isActive ? item.activeIcon : item.icon;
                return (
                  <>
                    <div className={`relative p-1.5 sm:p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-500/20' : ''}`}>
                      <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`} />
                      {isActive && (
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                      )}
                      {/* Pulsing dot for active session on workouts tab */}
                      {item.to === '/workouts' && hasActiveSession && !isActive && (
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                      )}
                    </div>
                    <span className={`text-[9px] sm:text-[10px] mt-1 sm:mt-1.5 font-bold tracking-tight transition-all ${isActive ? 'opacity-100 scale-100' : 'opacity-80 scale-95'}`}>
                      {item.label}
                    </span>
                  </>
                );
              }}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Logout confirmation */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => (!isLoggingOut ? setShowLogoutModal(false) : null)}
        title="Cerrar sesion"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/35 rounded-2xl text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800/40">
            <IoLogOutOutline className="w-6 h-6" />
            <div>
              <p className="font-semibold">Estas por salir</p>
              <p className="text-sm text-red-600/80 dark:text-red-200/85">Se cerrara tu cuenta en este dispositivo.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowLogoutModal(false)}
              disabled={isLoggingOut}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleLogout}
              loading={isLoggingOut}
            >
              Cerrar sesion
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

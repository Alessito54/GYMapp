import { useState } from 'react';
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
  IoSunnyOutline
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

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { darkMode, toggleDarkMode } = useUserStore();
  const { activeSession } = useWorkoutStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const userId = user?.uid;
  const hideLayoutForActiveWorkout = Boolean(activeSession?.id) && location.pathname === '/workouts';

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
      {/* Top Bar - Hidden during active workout */}
      {!hideLayoutForActiveWorkout && (
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50">
          <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <IoFitnessOutline className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400 font-bold">FitTrack Pro</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-1">{user?.email || 'Atleta'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleDarkMode(userId)}
                className="inline-flex items-center justify-center w-11 h-11 rounded-2xl text-slate-600 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all outline-none"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <IoSunnyOutline className="w-5 h-5" /> : <IoMoonOutline className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowLogoutModal(true)}
                className="inline-flex items-center justify-center w-11 h-11 rounded-2xl text-slate-600 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-600 dark:hover:text-rose-400 transition-all active:scale-95"
              >
                <IoLogOutOutline className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto ${!hideLayoutForActiveWorkout ? 'pb-32' : ''}`}>
        <div className="max-w-lg mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation - Hidden during active workout */}
      {!hideLayoutForActiveWorkout && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/70 z-50 safe-area-bottom">
          <div className="flex justify-around items-center max-w-lg mx-auto px-4 pt-2 pb-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center py-1 transition-all duration-300 ${isActive
                    ? 'text-indigo-600 dark:text-indigo-300'
                    : 'text-slate-500 dark:text-slate-200 hover:text-slate-700 dark:hover:text-white'
                  }`
                }
              >
                {({ isActive }) => {
                  const IconComponent = isActive ? item.activeIcon : item.icon;
                  return (
                    <>
                      <div className={`relative p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-500/20' : ''}`}>
                        <IconComponent className={`w-6 h-6 transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`} />
                        {isActive && (
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                        )}
                      </div>
                      <span className={`text-[10px] mt-1.5 font-bold tracking-tight transition-all ${isActive ? 'opacity-100 scale-100' : 'opacity-80 scale-95'}`}>
                        {item.label}
                      </span>
                    </>
                  );
                }}
              </NavLink>
            ))}
          </div>
        </nav>
      )}

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

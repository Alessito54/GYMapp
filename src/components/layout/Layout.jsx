import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
import { useAuthStore, useUserStore } from '@/stores';

const navItems = [
  { to: '/', label: 'Inicio', icon: IoHomeOutline, activeIcon: IoHome },
  { to: '/nutrition', label: 'Nutricion', icon: IoNutritionOutline, activeIcon: IoNutrition },
  { to: '/workouts', label: 'Entrenos', icon: IoFitnessOutline, activeIcon: IoFitness },
  { to: '/water', label: 'Agua', icon: IoWaterOutline, activeIcon: IoWater },
  { to: '/profile', label: 'Perfil', icon: IoPersonOutline, activeIcon: IoPerson },
];

export default function Layout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { darkMode, toggleDarkMode, initDarkMode } = useUserStore();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    initDarkMode();
  }, [initDarkMode]);

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
    <div className="flex flex-col min-h-screen min-h-dvh bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <IoFitnessOutline className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-blue-600 dark:text-blue-400 font-semibold">FitTrack</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium line-clamp-1">{user?.email || 'Atleta'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <IoSunnyOutline className="w-5 h-5" /> : <IoMoonOutline className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setShowLogoutModal(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <IoLogOutOutline className="w-5 h-5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-24 overflow-y-auto overflow-x-hidden">
        <div className="max-w-lg mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 px-2 pt-2 safe-area-bottom z-50">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-4 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 active-scale-95'
                }`
              }
            >
              {({ isActive }) => {
                const IconComponent = isActive ? item.activeIcon : item.icon;
                return (
                  <>
                    <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className={`text-[11px] mt-1 font-medium ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`}>
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
          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-2xl text-red-700 dark:text-red-400">
            <IoLogOutOutline className="w-6 h-6" />
            <div>
              <p className="font-semibold">Estas por salir</p>
              <p className="text-sm text-red-600/80 dark:text-red-400/80">Se cerrara tu cuenta en este dispositivo.</p>
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

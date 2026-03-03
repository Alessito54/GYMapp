import { NavLink, Outlet } from 'react-router-dom';
import { 
  IoHomeOutline, 
  IoHome,
  IoNutritionOutline, 
  IoNutrition,
  IoFitnessOutline, 
  IoFitness,
  IoWaterOutline, 
  IoWater,
  IoPersonOutline, 
  IoPerson 
} from 'react-icons/io5';

const navItems = [
  { to: '/', label: 'Inicio', icon: IoHomeOutline, activeIcon: IoHome },
  { to: '/nutrition', label: 'Nutricion', icon: IoNutritionOutline, activeIcon: IoNutrition },
  { to: '/workouts', label: 'Entrenos', icon: IoFitnessOutline, activeIcon: IoFitness },
  { to: '/water', label: 'Agua', icon: IoWaterOutline, activeIcon: IoWater },
  { to: '/profile', label: 'Perfil', icon: IoPersonOutline, activeIcon: IoPerson },
];

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen min-h-dvh bg-gray-50">
      {/* Main Content */}
      <main className="flex-1 pb-24 overflow-y-auto overflow-x-hidden">
        <div className="max-w-lg mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 px-2 pt-2 safe-area-bottom z-50">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center py-2 px-4 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-400 hover:text-gray-600 active:scale-95'
                }`
              }
            >
              {({ isActive }) => {
                const IconComponent = isActive ? item.activeIcon : item.icon;
                return (
                  <>
                    <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-blue-100' : ''}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className={`text-[11px] mt-1 font-medium ${isActive ? 'text-blue-600' : ''}`}>
                      {item.label}
                    </span>
                  </>
                );
              }}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

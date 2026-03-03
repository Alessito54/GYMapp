import { Link } from 'react-router-dom';
import {
  IoFlameOutline,
  IoWaterOutline,
  IoBarbell,
  IoTrendingUp,
  IoChevronForward,
  IoSparkles
} from 'react-icons/io5';
import { Card, ProgressRing, ProgressBar } from '@/components/ui';
import { useUserStore, useWaterStore, useNutritionStore, useWorkoutStore } from '@/stores';

export default function Dashboard() {
  const { profile } = useUserStore();
  const { getTodayProgress } = useWaterStore();
  const { getTodaySummary } = useNutritionStore();
  const { getRecentSessions } = useWorkoutStore();
  const stats = useUserStore((state) => state.getStats());

  const waterProgress = getTodayProgress();
  const nutritionSummary = getTodaySummary();
  const recentSessions = getRecentSessions(3);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos dias';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="px-4 py-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <header className="pt-2">
        <p className="text-gray-500 text-sm">{greeting()}</p>
        <h1 className="text-2xl font-bold text-gray-900 mt-0.5">
          {profile?.name || 'Atleta'} 💪
        </h1>
      </header>

      {/* Today's Summary Card */}
      <Card className="overflow-hidden shadow-lg">
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-5">
          <div className="flex items-center gap-2 text-white/80 mb-2">
            <IoSparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Resumen de hoy</span>
          </div>
          <p className="text-white text-3xl font-bold">
            {nutritionSummary.totals.calories} <span className="text-lg font-normal">kcal</span>
          </p>
          <p className="text-white/60 text-sm mt-1">
            de {stats?.targetCalories || 2500} kcal objetivo
          </p>

          {/* Progress bar */}
          <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/90 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((nutritionSummary.totals.calories / (stats?.targetCalories || 2500)) * 100, 100)}%` }}
            />
          </div>
        </div>
        <Card.Body className="p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-blue-50 rounded-2xl">
              <p className="text-xl font-bold text-blue-600">
                {nutritionSummary.totals.protein}g
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Proteina</p>
            </div>
            <div className="p-3 bg-green-50 rounded-2xl">
              <p className="text-xl font-bold text-green-600">
                {nutritionSummary.totals.carbs}g
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Carbos</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-2xl">
              <p className="text-xl font-bold text-amber-600">
                {nutritionSummary.totals.fat}g
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Grasas</p>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        {/* Water Card */}
        <Link to="/water" className="active-scale-98 transition-transform">
          <Card className="p-4 hover:shadow-lg transition-all duration-200 h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                <IoWaterOutline className="w-5 h-5 text-cyan-600" />
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {waterProgress.consumed}ml
              </span>
            </div>
            <ProgressBar
              progress={waterProgress.progress}
              color="bg-cyan-500"
              height="h-2"
            />
            <p className="text-sm font-semibold mt-3 text-gray-800">Hidratacion</p>
            <p className="text-xs text-gray-400">{Math.round(waterProgress.progress * 100)}% completado</p>
          </Card>
        </Link>

        {/* Workout Card */}
        <Link to="/workouts" className="active-scale-98 transition-transform">
          <Card className="p-4 hover:shadow-lg transition-all duration-200 h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <IoBarbell className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {recentSessions.length}/5
              </span>
            </div>
            <ProgressBar
              progress={recentSessions.length / 5}
              color="bg-purple-500"
              height="h-2"
            />
            <p className="text-sm font-semibold mt-3 text-gray-800">Entrenos</p>
            <p className="text-xs text-gray-400">{recentSessions.length} esta semana</p>
          </Card>
        </Link>
      </div>

      {/* Macros Progress */}
      <Card className="shadow-sm">
        <Card.Header className="pb-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Macronutrientes</h2>
            <Link to="/nutrition" className="text-blue-600 text-sm flex items-center gap-1 font-medium active:opacity-70">
              Ver mas <IoChevronForward className="w-4 h-4" />
            </Link>
          </div>
        </Card.Header>
        <Card.Body className="space-y-4 pt-2">
          <MacroProgress
            label="Proteina"
            current={nutritionSummary.totals.protein}
            target={stats?.macros?.protein || 150}
            color="bg-blue-500"
          />
          <MacroProgress
            label="Carbohidratos"
            current={nutritionSummary.totals.carbs}
            target={stats?.macros?.carbs || 250}
            color="bg-green-500"
          />
          <MacroProgress
            label="Grasas"
            current={nutritionSummary.totals.fat}
            target={stats?.macros?.fat || 70}
            color="bg-amber-500"
          />
        </Card.Body>
      </Card>

      {/* Recent Workouts */}
      {recentSessions.length > 0 && (
        <Card className="shadow-sm">
          <Card.Header className="pb-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Entrenamientos recientes</h2>
              <Link to="/workouts" className="text-blue-600 text-sm flex items-center gap-1 font-medium active:opacity-70">
                Ver todos <IoChevronForward className="w-4 h-4" />
              </Link>
            </div>
          </Card.Header>
          <Card.Body className="space-y-2 pt-2">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <IoBarbell className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{session.routineName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(session.startTime).toLocaleDateString('es-ES', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      })}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-gray-500 font-medium flex-shrink-0">{session.duration} min</span>
              </div>
            ))}
          </Card.Body>
        </Card>
      )}

      {/* Stats Overview */}
      {stats && (
        <Card className="shadow-sm">
          <Card.Header className="pb-2">
            <div className="flex items-center gap-2">
              <IoTrendingUp className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold text-gray-900">Tus metricas</h2>
            </div>
          </Card.Header>
          <Card.Body className="pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
                <p className="text-3xl font-bold text-blue-600">{stats.bmi}</p>
                <p className="text-xs text-gray-500 mt-1">IMC</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
                <p className="text-3xl font-bold text-green-600">{stats.tdee}</p>
                <p className="text-xs text-gray-500 mt-1">TDEE (kcal)</p>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

function MacroProgress({ label, current, target, color }) {
  const progress = Math.min(current / target, 1);
  const percentage = Math.round(progress * 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="text-gray-900 font-semibold">{current}g <span className="text-gray-400 font-normal">/ {target}g</span></span>
      </div>
      <div className="relative">
        <ProgressBar progress={progress} color={color} height="h-2.5" />
        <span className="absolute right-0 -top-6 text-xs text-gray-400">{percentage}%</span>
      </div>
    </div>
  );
}

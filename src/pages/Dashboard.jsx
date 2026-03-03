import { Link } from 'react-router-dom';
import {
  IoFlameOutline,
  IoWaterOutline,
  IoBarbell,
  IoTrendingUp,
  IoChevronForward,
  IoSparkles,
  IoFitnessOutline,
  IoTrashOutline,
  IoCalendarOutline
} from 'react-icons/io5';
import { Card, ProgressRing, ProgressBar } from '@/components/ui';
import { useAuthStore, useUserStore, useWaterStore, useNutritionStore, useWorkoutStore } from '@/stores';

export default function Dashboard() {
  const { user } = useAuthStore();
  const { profile, getStats } = useUserStore();
  const { getTodayProgress } = useWaterStore();
  const { getTodaySummary } = useNutritionStore();
  const { getRecentSessions, sessions, deleteSession } = useWorkoutStore();
  const stats = getStats();
  const userId = user?.uid;

  const waterProgress = getTodayProgress();
  const nutritionSummary = getTodaySummary();
  const recentSessions = getRecentSessions(4);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos dias';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="px-5 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <header className="flex items-end justify-between px-1">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{greeting()}</p>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Hola, <span className="text-gradient">{profile?.name || 'Atleta'}</span>
          </h1>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <IoSparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
        </div>
      </header>

      {/* Today's Summary Card */}
      <Card className="overflow-hidden border-none shadow-2xl shadow-indigo-500/10 active-scale-98 transition-transform cursor-default">
        <div className="premium-gradient p-7 relative overflow-hidden">
          {/* Decorative background circle */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />

          <div className="flex items-center gap-2 text-white/70 mb-3">
            <IoFlameOutline className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Energia de hoy</span>
          </div>

          <div className="flex items-baseline gap-2">
            <p className="text-white text-5xl font-black tracking-tighter">
              {nutritionSummary.totals.calories}
            </p>
            <span className="text-white/60 text-lg font-medium">kcal</span>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs text-white/80 font-bold px-1">
              <span>{Math.round((nutritionSummary.totals.calories / (stats?.targetCalories || 2500)) * 100)}% del objetivo</span>
              <span>{stats?.targetCalories || 2500} kcal</span>
            </div>
            <div className="h-3 bg-black/20 rounded-full p-0.5 overflow-hidden ring-1 ring-white/10">
              <div
                className="h-full bg-white rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_rgba(255,255,255,0.5)]"
                style={{ width: `${Math.min((nutritionSummary.totals.calories / (stats?.targetCalories || 2500)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <Card.Body className="p-6 bg-white dark:bg-slate-800/50 backdrop-blur-sm">
          <div className="grid grid-cols-3 gap-4">
            <QuickStat
              label="Proteina"
              value={`${nutritionSummary.totals.protein}g`}
              color="bg-indigo-50 dark:bg-indigo-500/10"
              textColor="text-indigo-600 dark:text-indigo-400"
            />
            <QuickStat
              label="Carbos"
              value={`${nutritionSummary.totals.carbs}g`}
              color="bg-emerald-50 dark:bg-emerald-500/10"
              textColor="text-emerald-600 dark:text-emerald-400"
            />
            <QuickStat
              label="Grasas"
              value={`${nutritionSummary.totals.fat}g`}
              color="bg-rose-50 dark:bg-rose-500/10"
              textColor="text-rose-600 dark:text-rose-400"
            />
          </div>
        </Card.Body>
      </Card>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-5">
        <Link to="/water" className="active-scale-95 transition-all">
          <Card className="p-5 border-none shadow-xl shadow-cyan-500/5 dark:shadow-cyan-900/10 h-full group">
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 bg-cyan-50 dark:bg-cyan-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ring-1 ring-cyan-500/10">
                <IoWaterOutline className="w-6 h-6 text-cyan-500" />
              </div>
              <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/50 px-2 py-1 rounded-lg">
                {waterProgress.consumed}ml
              </span>
            </div>
            <ProgressBar
              progress={waterProgress.progress}
              color="bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
              height="h-2"
            />
            <div className="mt-4">
              <p className="text-sm font-black text-slate-800 dark:text-white">Agua</p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter mt-0.5">
                {Math.round(waterProgress.progress * 100)}% del dia
              </p>
            </div>
          </Card>
        </Link>

        <Link to="/workouts" className="active-scale-95 transition-all">
          <Card className="p-5 border-none shadow-xl shadow-indigo-500/5 dark:shadow-indigo-900/10 h-full group">
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ring-1 ring-indigo-500/10">
                <IoBarbell className="w-6 h-6 text-indigo-500" />
              </div>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-1 rounded-lg">
                {recentSessions.length}/5
              </span>
            </div>
            <ProgressBar
              progress={recentSessions.length / 5}
              color="bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]"
              height="h-2"
            />
            <div className="mt-4">
              <p className="text-sm font-black text-slate-800 dark:text-white">Rutinas</p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter mt-0.5">
                {recentSessions.length} completadas
              </p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Activity Calendar (Hevy Style) */}
      <Card className="p-6 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <IoCalendarOutline className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Actividad Reciente</h2>
          </div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Últimas 12 semanas</p>
        </header>
        <ActivityCalendar sessions={sessions} />
      </Card>

      {/* Macros Detail */}
      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-black/20">
        <Card.Header className="pb-4 border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Mis Macros</h2>
            <Link to="/nutrition" className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-indigo-600 dark:text-indigo-400 transition-colors">
              <IoChevronForward className="w-5 h-5" />
            </Link>
          </div>
        </Card.Header>
        <Card.Body className="space-y-6 pt-2">
          <MacroProgress
            label="Proteina"
            current={nutritionSummary.totals.protein}
            target={stats?.macros?.protein || 150}
            color="bg-indigo-500"
          />
          <MacroProgress
            label="Carbos"
            current={nutritionSummary.totals.carbs}
            target={stats?.macros?.carbs || 250}
            color="bg-emerald-500"
          />
          <MacroProgress
            label="Grasas"
            current={nutritionSummary.totals.fat}
            target={stats?.macros?.fat || 70}
            color="bg-rose-500"
          />
        </Card.Body>
      </Card>

      {/* Recent History Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Historial Reciente</h2>
          <Link to="/workouts" className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Ver Todos</Link>
        </div>

        <div className="space-y-3">
          {recentSessions.length === 0 ? (
            <p className="text-center py-6 text-slate-400 text-sm font-medium">Aún no hay entrenamientos registrados.</p>
          ) : (
            recentSessions.map((session) => (
              <Card key={session.id} className="p-4 border-none shadow-md shadow-slate-200/50 dark:shadow-black/20 active-scale-98 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                      <IoFitnessOutline className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 dark:text-white">{session.routineName}</p>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter mt-0.5">
                        {new Date(session.startTime).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} • {session.duration} min
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSession(session.id, userId)}
                    className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/10 text-rose-500 hover:bg-rose-100 transition-colors"
                  >
                    <IoTrashOutline className="w-5 h-5" />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function QuickStat({ label, value, color, textColor }) {
  return (
    <div className={`p-4 ${color} rounded-[2rem] text-center border border-slate-100 dark:border-white/5 shadow-sm dark:shadow-none`}>
      <p className={`text-xl font-black ${textColor} leading-tight`}>{value}</p>
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function MacroProgress({ label, current, target, color }) {
  const progress = Math.min(current / target, 1);
  return (
    <div className="group">
      <div className="flex justify-between items-end mb-2.5 px-0.5">
        <div>
          <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</span>
          <p className="text-base font-black text-slate-800 dark:text-white">
            {current}g <span className="text-xs text-slate-400 font-bold ml-1 tracking-normal">/ {target}g</span>
          </p>
        </div>
        <span className="text-sm font-black text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-lg">
          {Math.round(progress * 100)}%
        </span>
      </div>
      <ProgressBar progress={progress} color={color} height="h-3" rounded="rounded-xl" />
    </div>
  );
}
function ActivityCalendar({ sessions }) {
  const today = new Date();
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const weekdays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // Create 12 weeks of data (84 days)
  const daysCount = 84;
  const days = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const hasWorkout = sessions?.some(s => s.startTime.startsWith(dateStr));

    days.push({
      date: d,
      dateLabel: d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      active: hasWorkout,
      month: months[d.getMonth()]
    });
  }

  // Group into weeks (columns)
  const columns = [];
  for (let i = 0; i < daysCount; i += 7) {
    columns.push(days.slice(i, i + 7));
  }

  // Get month labels based on the first day of each week
  const monthLabels = [];
  columns.forEach((week, weekIdx) => {
    const firstDay = week[0].date;
    // Only add month label if it's the first week or the first day of the month falls in this week
    // This logic needs to be adjusted for 12 columns to ensure proper spacing
    if (weekIdx === 0 || firstDay.getDate() <= 7) { // Simplified condition, might need fine-tuning for exact month start alignment
      monthLabels.push({ index: weekIdx, label: months[firstDay.getMonth()] });
    }
  });

  return (
    <div className="flex flex-col gap-2">
      {/* Months header */}
      <div className="flex ml-6 h-4 relative">
        {monthLabels.map((m, idx) => (
          <span
            key={idx}
            className="absolute text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter"
            style={{ left: `${(m.index / 12) * 100}%` }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        {/* Weekdays column */}
        <div className="flex flex-col justify-between py-0.5 h-[120px] sm:h-[140px]">
          {weekdays.map((day, idx) => (
            <span key={idx} className="text-[7px] sm:text-[8px] font-bold text-slate-300 dark:text-slate-600">
              {day}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 grid grid-cols-12 gap-1 sm:gap-1.5 h-[120px] sm:h-[140px]">
          {columns.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col justify-between gap-1 sm:gap-1.5">
              {week.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  className={`flex-1 aspect-square rounded-[3px] sm:rounded-[4px] transition-all duration-300 relative group cursor-help ${day.active
                      ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.3)]'
                      : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all font-bold shadow-xl border border-slate-700">
                    {day.dateLabel} {day.active ? '• Entrenamiento ✓' : ''}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

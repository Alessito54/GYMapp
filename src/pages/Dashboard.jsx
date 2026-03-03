import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IoFlameOutline,
  IoWaterOutline,
  IoBarbell,
  IoChevronForward,
  IoSparkles,
  IoFitnessOutline,
  IoTrashOutline,
  IoCalendarOutline,
  IoChevronBack
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
    <div className="px-4 sm:px-5 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <header className="flex items-end justify-between px-1">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">{greeting()}</p>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Hola, <span className="text-gradient">{profile?.name || 'Atleta'}</span>
          </h1>
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <IoSparkles className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 animate-pulse" />
        </div>
      </header>

      {/* Today's Summary Card */}
      <Card className="overflow-hidden border-none shadow-2xl shadow-blue-500/15 active-scale-98 transition-transform cursor-default">
        <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 p-5 sm:p-7 relative overflow-hidden">
          {/* Decorative background circle */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />

          <div className="flex items-center gap-2 text-white/70 mb-3">
            <IoFlameOutline className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Energia de hoy</span>
          </div>

          <div className="flex items-baseline gap-2">
            <p className="text-white text-4xl sm:text-5xl font-black tracking-tighter">
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

        <Card.Body className="p-4 sm:p-6 bg-white dark:bg-slate-800/50 backdrop-blur-sm">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <QuickStat
              label="Proteina"
              value={`${nutritionSummary.totals.protein}g`}
              color="bg-blue-100 dark:bg-blue-900/30"
              textColor="text-blue-700 dark:text-blue-300"
            />
            <QuickStat
              label="Carbos"
              value={`${nutritionSummary.totals.carbs}g`}
              color="bg-emerald-100 dark:bg-emerald-900/30"
              textColor="text-emerald-700 dark:text-emerald-300"
            />
            <QuickStat
              label="Grasas"
              value={`${nutritionSummary.totals.fat}g`}
              color="bg-rose-100 dark:bg-rose-900/30"
              textColor="text-rose-700 dark:text-rose-300"
            />
          </div>
        </Card.Body>
      </Card>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        <Link to="/water" className="active-scale-95 transition-all">
          <Card className="p-4 sm:p-5 border-slate-200/60 dark:border-slate-700/60 shadow-xl shadow-blue-500/5 dark:shadow-blue-900/10 h-full group">
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/40 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ring-1 ring-sky-500/20">
                <IoWaterOutline className="w-6 h-6 text-sky-600 dark:text-sky-400" />
              </div>
              <span className="text-xs font-black text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-900/50 px-2 py-1 rounded-lg">
                {waterProgress.consumed}ml
              </span>
            </div>
            <ProgressBar
              progress={waterProgress.progress}
              color="bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.4)]"
              height="h-2"
            />
            <div className="mt-4">
              <p className="text-sm font-black text-slate-800 dark:text-white">Agua</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter mt-0.5">
                {Math.round(waterProgress.progress * 100)}% del dia
              </p>
            </div>
          </Card>
        </Link>

        <Link to="/workouts" className="active-scale-95 transition-all">
          <Card className="p-4 sm:p-5 border-slate-200/60 dark:border-slate-700/60 shadow-xl shadow-blue-500/5 dark:shadow-blue-900/10 h-full group">
            <div className="flex items-center justify-between mb-5">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ring-1 ring-blue-500/20">
                <IoBarbell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-black text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded-lg">
                {recentSessions.length}/5
              </span>
            </div>
            <ProgressBar
              progress={recentSessions.length / 5}
              color="bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]"
              height="h-2"
            />
            <div className="mt-4">
              <p className="text-sm font-black text-slate-800 dark:text-white">Rutinas</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter mt-0.5">
                {recentSessions.length} completadas
              </p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Activity Calendar */}
      <Card className="p-4 sm:p-6 border-slate-200/60 dark:border-slate-700/60 bg-white dark:bg-slate-900/60">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IoCalendarOutline className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white tracking-tight">Calendario de Actividad</h2>
          </div>
        </header>
        <ActivityCalendar sessions={sessions} />
      </Card>

      {/* Macros Detail */}
      <Card className="border-slate-200/60 dark:border-slate-700/60 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
        <Card.Header className="pb-4 border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Mis Macros</h2>
            <Link to="/nutrition" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-blue-600 dark:text-blue-400 transition-colors">
              <IoChevronForward className="w-5 h-5" />
            </Link>
          </div>
        </Card.Header>
        <Card.Body className="space-y-6 pt-2">
          <MacroProgress
            label="Proteina"
            current={nutritionSummary.totals.protein}
            target={stats?.macros?.protein || 150}
            color="bg-blue-500"
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
          <Link to="/workouts" className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest hover:underline decoration-2 underline-offset-4">Ver Todos</Link>
        </div>

        <div className="space-y-3">
          {recentSessions.length === 0 ? (
            <p className="text-center py-6 text-slate-400 dark:text-slate-500 text-sm font-medium">Aún no hay entrenamientos registrados.</p>
          ) : (
            recentSessions.map((session) => (
              <Card key={session.id} className="p-4 border-slate-200/60 dark:border-slate-700/60 shadow-md shadow-slate-200/50 dark:shadow-black/20 active-scale-98 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center border border-blue-100 dark:border-blue-800/50">
                      <IoFitnessOutline className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 dark:text-white">{session.routineName}</p>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter mt-0.5">
                        {new Date(session.startTime).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} • {session.duration} min
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteSession(session.id, userId)}
                    className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
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
    <div className={`p-3 sm:p-4 ${color} rounded-2xl sm:rounded-[2rem] text-center border border-slate-200/30 dark:border-white/5 shadow-sm dark:shadow-none`}>
      <p className={`text-lg sm:text-xl font-black ${textColor} leading-tight`}>{value}</p>
      <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">{label}</p>
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
        <span className="text-sm font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-lg">
          {Math.round(progress * 100)}%
        </span>
      </div>
      <ProgressBar progress={progress} color={color} height="h-3" rounded="rounded-xl" />
    </div>
  );
}
function ActivityCalendar({ sessions }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const weekdays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get first day of month (0 = Sunday, adjust for Monday start)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  // Adjust for Monday start (0 = Monday, 6 = Sunday)
  let startDay = firstDayOfMonth.getDay() - 1;
  if (startDay < 0) startDay = 6;

  // Generate calendar days
  const calendarDays = [];

  // Add empty slots for days before the 1st
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }

  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = date.toISOString().split('T')[0];
    const hasWorkout = sessions?.some(s => s.startTime && s.startTime.startsWith(dateStr));
    const isToday = date.toDateString() === today.toDateString();
    const isFuture = date > today;

    calendarDays.push({
      day,
      date,
      dateStr,
      hasWorkout: hasWorkout && !isFuture,
      isToday,
      isFuture
    });
  }

  // Navigation handlers
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Check if we can go to next month (don't go past current month)
  const canGoNext = currentYear < today.getFullYear() ||
    (currentYear === today.getFullYear() && currentMonth < today.getMonth());

  // Count workouts in current month
  const workoutsThisMonth = calendarDays.filter(d => d && d.hasWorkout).length;

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrevMonth}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
        >
          <IoChevronBack className="w-5 h-5" />
        </button>

        <div className="text-center">
          <button
            onClick={goToToday}
            className="group"
          >
            <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {months[currentMonth]} {currentYear}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {workoutsThisMonth} {workoutsThisMonth === 1 ? 'entrenamiento' : 'entrenamientos'}
            </p>
          </button>
        </div>

        <button
          onClick={goToNextMonth}
          disabled={!canGoNext}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <IoChevronForward className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1">
        {weekdays.map((day, idx) => (
          <div key={idx} className="h-8 flex items-center justify-center">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">
              {day}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => (
          <div
            key={idx}
            className={`aspect-square rounded-xl flex items-center justify-center relative group transition-all ${day === null
                ? ''
                : day.isToday
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : day.hasWorkout
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : day.isFuture
                      ? 'bg-slate-50 dark:bg-slate-900/20 text-slate-300 dark:text-slate-700'
                      : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
          >
            {day && (
              <>
                <span className={`text-sm font-bold ${day.isToday ? 'font-black' : ''}`}>
                  {day.day}
                </span>

                {/* Workout indicator dot */}
                {day.hasWorkout && !day.isToday && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)]" />
                )}

                {/* Today's workout indicator */}
                {day.hasWorkout && day.isToday && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
                )}

                {/* Tooltip */}
                {!day.isFuture && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-all font-bold shadow-xl">
                    {day.day} {months[currentMonth].slice(0, 3)} {day.hasWorkout ? '• ✓ Entreno' : ''}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-lg bg-blue-500" />
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Hoy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 relative">
            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
          </div>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Con entreno</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-lg bg-slate-100 dark:bg-slate-800/60" />
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Sin entreno</span>
        </div>
      </div>
    </div>
  );
}

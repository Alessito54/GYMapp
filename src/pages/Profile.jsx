import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IoPersonCircleOutline,
  IoLogOutOutline,
  IoScaleOutline,
  IoBodyOutline,
  IoFitnessOutline,
  IoSettingsOutline,
  IoChevronForward,
  IoSaveOutline,
  IoCheckmarkCircle,
  IoSparkles,
  IoTrophyOutline,
  IoFlameOutline,
  IoTrendingUpOutline,
  IoTrendingDownOutline,
  IoBarbell,
  IoAddOutline,
  IoTrashOutline,
  IoStatsChartOutline,
  IoCalendarOutline,
} from 'react-icons/io5';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, Button, Input, Modal, ProgressBar, Badge } from '@/components/ui';
import { useAuthStore, useUserStore, useWorkoutStore } from '@/stores';

const ACTIVITY_LEVELS = [
  { value: 'SEDENTARY', label: 'Sedentario', desc: 'Poco o nada de ejercicio' },
  { value: 'LIGHTLY_ACTIVE', label: 'Ligeramente activo', desc: '1-3 dias/semana' },
  { value: 'MODERATELY_ACTIVE', label: 'Moderadamente activo', desc: '3-5 dias/semana' },
  { value: 'VERY_ACTIVE', label: 'Muy activo', desc: '6-7 dias/semana' },
  { value: 'EXTREMELY_ACTIVE', label: 'Extremadamente activo', desc: 'Atleta profesional' },
];

const GOALS = [
  { value: 'WEIGHT_LOSS', label: 'Perder peso', desc: 'Deficit calorico' },
  { value: 'MAINTENANCE', label: 'Mantener peso', desc: 'Balance calorico' },
  { value: 'MUSCLE_GAIN', label: 'Ganar musculo', desc: 'Superavit calorico' },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { profile, setProfile, updateProfile, getStats, weightHistory, addWeightEntry, deleteWeightEntry, getWeightProgress } = useUserStore();
  const { sessions, folders } = useWorkoutStore();
  const stats = getStats();
  const weightProgress = getWeightProgress();
  const userId = user?.uid;

  // Calculate workout stats
  const totalWorkouts = sessions?.length || 0;
  const totalRoutines = folders?.reduce((acc, f) => acc + (f.routines?.length || 0), 0) || 0;
  const thisWeekWorkouts = sessions?.filter(s => {
    const sessionDate = new Date(s.startTime || s.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessionDate >= weekAgo;
  }).length || 0;

  const [isEditing, setIsEditing] = useState(!profile);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState(profile?.weight || 70);
  const [newWeightDate, setNewWeightDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    gender: profile?.gender || 'MALE',
    birthDate: profile?.birthDate || '1990-01-01',
    weight: profile?.weight || 70,
    height: profile?.height || 170,
    activityLevel: profile?.activityLevel || 'MODERATELY_ACTIVE',
    goal: profile?.goal || 'MUSCLE_GAIN',
    targetWeight: profile?.targetWeight || profile?.weight || 70,
  });

  const handleAddWeight = async () => {
    await addWeightEntry({ weight: parseFloat(newWeight), date: newWeightDate }, userId);
    // Also update profile weight to the latest
    await updateProfile({ weight: parseFloat(newWeight) }, userId);
    setShowWeightModal(false);
    setNewWeight(parseFloat(newWeight));
  };

  const handleDeleteWeight = async (entryId) => {
    await deleteWeightEntry(entryId, userId);
  };

  // Format weight data for chart
  const chartData = weightProgress?.entries?.map(entry => ({
    date: new Date(entry.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    peso: entry.weight,
    fullDate: entry.date,
  })) || [];

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (profile) {
      updateProfile(formData, userId);
    } else {
      setProfile(formData, userId);
    }
    setIsEditing(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutModal(false);
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Setup view (no profile yet or editing)
  if (!profile || isEditing) {
    return (
      <div className="px-5 py-8 space-y-10 animate-fade-in pb-32 bg-slate-50/50 dark:bg-slate-950/50 min-h-screen">
        <header className="px-1 relative">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
              <IoSettingsOutline className="w-8 h-8 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none mb-1">
                {profile ? 'Mi Perfil' : 'Bienvenido'}
              </h1>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                {profile ? 'Ajusta tus parámetros' : 'Configura tu cuenta'}
              </p>
            </div>
          </div>
        </header>

        {/* Section 1: Personal Info - Elevated */}
        <section className="space-y-6 relative z-10">
          <div className="flex items-center gap-2 px-1 text-slate-400">
            <IoPersonCircleOutline className="w-4 h-4" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Datos Personales</h3>
          </div>
          <Card className="border-none bg-white dark:bg-slate-900 shadow-2xl shadow-blue-500/5 overflow-hidden rounded-[2.5rem]">
            <Card.Body className="p-8 space-y-8">
              <Input
                label="Nombre completo"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ej: Alessandro"
                className="h-14 rounded-2xl font-bold"
              />

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Género</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: 'MALE', label: 'Hombre', icon: '♂️' },
                    { val: 'FEMALE', label: 'Mujer', icon: '♀️' },
                    { val: 'OTHER', label: 'Otro', icon: '⚧️' }
                  ].map((g) => (
                    <button
                      key={g.val}
                      onClick={() => handleChange('gender', g.val)}
                      className={`relative py-5 rounded-2xl transition-all duration-500 overflow-hidden ${formData.gender === g.val
                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 -translate-y-1'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                    >
                      {formData.gender === g.val && (
                        <div className="absolute top-0 right-0 w-8 h-8 bg-white/20 rounded-bl-2xl flex items-center justify-center">
                          <IoCheckmarkCircle className="w-4 h-4" />
                        </div>
                      )}
                      <span className="block text-2xl mb-1">{g.icon}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest">{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Fecha de nacimiento"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
                className="h-14 rounded-2xl font-bold"
              />
            </Card.Body>
          </Card>
        </section>

        {/* Section 2: Metrics - High Contrast */}
        <section className="space-y-6 relative z-10">
          <div className="flex items-center gap-2 px-1 text-slate-400">
            <IoBodyOutline className="w-4 h-4" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Métricas de Base</h3>
          </div>
          <Card className="border-none bg-white dark:bg-slate-900 shadow-2xl shadow-blue-500/5 overflow-hidden rounded-[2.5rem]">
            <Card.Body className="p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="relative">
                  <Input
                    label="Peso Inicial"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleChange('weight', parseFloat(e.target.value) || 0)}
                    className="h-16 rounded-2xl font-black text-xl pl-6"
                  />
                  <div className="absolute right-4 top-[3.7rem] text-[10px] font-black text-slate-400 uppercase tracking-widest">KG</div>
                </div>
                <div className="relative">
                  <Input
                    label="Estatura"
                    type="number"
                    value={formData.height}
                    onChange={(e) => handleChange('height', parseInt(e.target.value) || 0)}
                    className="h-16 rounded-2xl font-black text-xl pl-6"
                  />
                  <div className="absolute right-4 top-[3.7rem] text-[10px] font-black text-slate-400 uppercase tracking-widest">CM</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </section>

        {/* Section 3: Activity Level - Modern Selectors */}
        <section className="space-y-6 relative z-10">
          <div className="flex items-center gap-2 px-1 text-slate-400">
            <IoFitnessOutline className="w-4 h-4" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Nivel de Esfuerzo</h3>
          </div>
          <div className="space-y-3">
            {ACTIVITY_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => handleChange('activityLevel', level.value)}
                className={`w-full p-6 rounded-[2rem] text-left transition-all duration-500 relative overflow-hidden group border-2 ${formData.activityLevel === level.value
                  ? 'bg-blue-600 border-blue-600 text-white shadow-2xl shadow-blue-500/30 translate-x-1'
                  : 'bg-white dark:bg-slate-900 border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-100 dark:hover:border-slate-800 shadow-sm'
                  }`}
              >
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className={`font-black text-sm uppercase tracking-[0.1em] ${formData.activityLevel === level.value ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                      {level.label}
                    </p>
                    <p className={`text-[10px] font-bold mt-1 uppercase tracking-widest ${formData.activityLevel === level.value ? 'text-blue-100' : 'text-slate-400'}`}>
                      {level.desc}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${formData.activityLevel === level.value ? 'bg-white/20 text-white rotate-0' : 'bg-slate-50 dark:bg-slate-800 text-slate-300'
                    }`}>
                    {formData.activityLevel === level.value ? <IoCheckmarkCircle className="w-6 h-6" /> : <IoChevronForward className="w-4 h-4" />}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Section 4: Goals - Premium Cards */}
        <section className="space-y-6 relative z-10">
          <div className="flex items-center gap-2 px-1 text-slate-400">
            <IoSparkles className="w-4 h-4" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Tu Meta Principal</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {GOALS.map((goal) => (
              <button
                key={goal.value}
                onClick={() => handleChange('goal', goal.value)}
                className={`w-full p-6 rounded-[2.2rem] text-left transition-all duration-500 relative overflow-hidden group border-2 ${formData.goal === goal.value
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xl shadow-emerald-500/30 translate-y-[-2px]'
                  : 'bg-white dark:bg-slate-900 border-transparent text-slate-500 dark:text-slate-400 hover:border-slate-100 dark:hover:border-slate-800 shadow-sm'
                  }`}
              >
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className={`font-black text-sm uppercase tracking-[0.1em] ${formData.goal === goal.value ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                      {goal.label}
                    </p>
                    <p className={`text-[10px] font-bold mt-1 uppercase tracking-widest ${formData.goal === goal.value ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {goal.desc}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${formData.goal === goal.value ? 'bg-white/20 text-white shadow-inner' : 'bg-slate-50 dark:bg-slate-800 text-slate-300'
                    }`}>
                    {formData.goal === goal.value ? <IoCheckmarkCircle className="w-7 h-7" /> : <IoChevronForward className="w-4 h-4" />}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Section 5: Target Weight - Precision Focus */}
        {formData.goal !== 'MAINTENANCE' && (
          <section className="space-y-6 relative z-10">
            <div className="flex items-center gap-2 px-1 text-slate-400">
              {formData.goal === 'WEIGHT_LOSS' ? (
                <IoTrendingDownOutline className="w-4 h-4" />
              ) : (
                <IoTrendingUpOutline className="w-4 h-4" />
              )}
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Hito de Peso</h3>
            </div>
            <Card className="border-none bg-white dark:bg-slate-900 shadow-2xl shadow-blue-500/5 overflow-hidden rounded-[2.5rem]">
              <Card.Body className="p-8">
                <div className="relative">
                  <Input
                    label={formData.goal === 'WEIGHT_LOSS' ? 'Peso Objetivo' : 'Peso Deseado'}
                    type="number"
                    value={formData.targetWeight}
                    onChange={(e) => handleChange('targetWeight', parseFloat(e.target.value) || 0)}
                    className="h-16 rounded-2xl font-black text-xl pl-6"
                  />
                  <div className="absolute right-4 top-[3.7rem] text-[10px] font-black text-slate-400 uppercase tracking-widest">KG</div>
                </div>
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    {formData.goal === 'WEIGHT_LOSS'
                      ? `Faltan ${Math.abs(formData.weight - formData.targetWeight).toFixed(1)} kg para tu meta`
                      : `Faltan ${Math.abs(formData.targetWeight - formData.weight).toFixed(1)} kg para tu meta`
                    }
                  </p>
                </div>
              </Card.Body>
            </Card>
          </section>
        )}

        {/* Action Buttons - Sticky Float */}
        <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent dark:from-slate-950 dark:via-slate-950/90 z-50 backdrop-blur-sm">
          <div className="max-w-lg mx-auto flex gap-4">
            {profile && (
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 h-16 rounded-[1.5rem] border-2 border-slate-200 dark:border-slate-800 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 dark:hover:bg-slate-900 transition-all"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handleSave}
              className={`h-16 rounded-[1.5rem] premium-gradient text-white font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 ${profile ? 'flex-[2.5]' : 'w-full'}`}
              disabled={!formData.name}
            >
              <IoSaveOutline className="w-5 h-5" />
              {profile ? 'Actualizar Perfil' : 'Finalizar Perfil'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Profile view
  return (
    <div className="px-4 sm:px-6 py-8 sm:py-10 space-y-8 sm:space-y-10 animate-fade-in pb-32">
      {/* Dynamic Glassmorphism Header */}
      <header className="relative p-8 rounded-[3rem] overflow-hidden group">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl z-0" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl animate-pulse delay-700" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-end gap-6">
          <div className="relative group/avatar">
            <div className="absolute -inset-1.5 bg-gradient-to-tr from-blue-600 via-violet-600 to-cyan-500 rounded-[2.5rem] blur opacity-40 group-hover/avatar:opacity-75 transition duration-500"></div>
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-[2.2rem] bg-white dark:bg-slate-800 flex items-center justify-center shadow-2xl ring-4 ring-white/10 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
              <IoPersonCircleOutline className="w-16 h-16 sm:w-20 sm:h-20 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          <div className="text-center sm:text-left flex-1">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2 leading-none uppercase">
              {profile.name}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <Badge variant="secondary" className="px-3 py-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-none text-[10px] font-black uppercase tracking-widest">
                {user?.email?.split('@')[0] || 'Member'}
              </Badge>
              <div className="flex items-center gap-1 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-100/50 dark:bg-slate-800/50 px-3 py-1 rounded-full backdrop-blur-sm">
                <IoCalendarOutline className="w-3 h-3" />
                Diciembre 2023
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Dashboard Grid */}
      <div className="grid grid-cols-3 gap-4 relative z-10">
        {[
          {
            label: 'Semana',
            count: thisWeekWorkouts,
            icon: IoFlameOutline,
            color: 'text-orange-500',
            bg: 'bg-orange-50 dark:bg-orange-950/30',
            border: 'border-orange-100 dark:border-orange-900/20'
          },
          {
            label: 'Sesiones',
            count: totalWorkouts,
            icon: IoTrophyOutline,
            color: 'text-violet-500',
            bg: 'bg-violet-50 dark:bg-violet-950/30',
            border: 'border-violet-100 dark:border-violet-900/20'
          },
          {
            label: 'Rutinas',
            count: totalRoutines,
            icon: IoBarbell,
            color: 'text-cyan-500',
            bg: 'bg-cyan-50 dark:bg-cyan-950/30',
            border: 'border-cyan-100 dark:border-cyan-900/20'
          }
        ].map((item, idx) => (
          <Card key={idx} className={`border-none ${item.bg} shadow-xl shadow-slate-100 dark:shadow-none group overflow-hidden`}>
            <Card.Body className="p-4 sm:p-6 text-center relative">
              <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 rounded-full -mr-6 -mt-6 transform transition-transform group-hover:scale-150" />
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-slate-900/50 ${item.color} flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-all duration-300`}>
                <item.icon className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-none mb-1">{item.count}</p>
              <p className="text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{item.label}</p>
            </Card.Body>
          </Card>
        ))}
      </div>

      {/* Premium Weight Goal Progress */}
      {profile.goal !== 'MAINTENANCE' && profile.targetWeight && profile.targetWeight !== profile.weight && (
        <Card className="border-none bg-white dark:bg-slate-900 shadow-2xl shadow-blue-500/5 overflow-hidden relative z-10">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-blue-500 to-violet-500" />
          <Card.Body className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${profile.goal === 'WEIGHT_LOSS' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500'
                  }`}>
                  {profile.goal === 'WEIGHT_LOSS' ? <IoTrendingDownOutline className="w-6 h-6" /> : <IoTrendingUpOutline className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Tu Objetivo</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    {profile.goal === 'WEIGHT_LOSS' ? 'Reducción de Peso' : 'Ganancia Muscular'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                  {Math.abs(profile.targetWeight - profile.weight).toFixed(1)}
                  <span className="text-xs font-bold text-slate-400 ml-1">KG</span>
                </p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Restantes</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{profile.weight} kg</span>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Meta: {profile.targetWeight} kg</span>
              </div>
              <div className="relative h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-1 shadow-inner">
                <div
                  className={`h-full rounded-full shadow-lg transition-all duration-1000 ${profile.goal === 'WEIGHT_LOSS' ? 'premium-gradient' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    }`}
                  style={{ width: `${Math.min(100, Math.max(5, (1 - Math.abs(profile.targetWeight - profile.weight) / 10) * 100))}%` }}
                />
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Body Stats Horizontal Scroll or Grid */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 relative z-10">
          {[
            { label: 'Peso', value: profile.weight, unit: 'KG', icon: IoScaleOutline, gradient: 'from-blue-500 to-blue-600' },
            { label: 'IMC', value: stats.bmi, unit: 'IDX', icon: IoBodyOutline, gradient: 'from-emerald-500 to-emerald-600' },
            { label: 'TDEE', value: stats.tdee, unit: 'KCAL', icon: IoFitnessOutline, gradient: 'from-rose-500 to-rose-600' }
          ].map((stat, idx) => (
            <div key={idx} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition duration-500 rounded-3xl blur-sm" />
              <Card className="border-none bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none h-full overflow-hidden">
                <Card.Body className="p-4 sm:p-5 flex flex-col items-center text-center">
                  <div className={`w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1">{stat.value}</p>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Modern Nutritional Plan & Macros */}
      {stats && (
        <Card className="border-none bg-white dark:bg-slate-900 shadow-2xl shadow-blue-500/5 overflow-hidden relative group z-10 p-8">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -mr-24 -mt-24 z-0" />

          <div className="flex items-center justify-between mb-8 relative z-10">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Plan Nutricional</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Sugerencia basada en tu IMC y TDEE</p>
            </div>
            <div className="px-4 py-1.5 bg-blue-600 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-blue-500/20 animate-pulse">
              AI Optimizer
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 relative z-10 text-center">
            {[
              { label: 'Proteína', value: stats.macros.protein, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/40', barColor: 'bg-blue-600' },
              { label: 'Carbos', value: stats.macros.carbs, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/40', barColor: 'bg-emerald-500' },
              { label: 'Grasas', value: stats.macros.fat, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/40', barColor: 'bg-amber-500' }
            ].map((macro, idx) => (
              <div key={idx} className={`${macro.bg} rounded-[2rem] p-5 border border-white/10 dark:border-slate-800 transition-all hover:-translate-y-1`}>
                <p className={`text-2xl font-black ${macro.color} leading-none mb-1`}>{macro.value}g</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{macro.label}</p>
                <div className="mt-3 h-1 w-8 mx-auto rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className={`h-full ${macro.barColor} w-2/3`} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-950/50 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 flex items-center justify-between group/cal">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm group-hover/cal:scale-110 transition-transform">
                <IoFlameOutline className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kcal Diarias</p>
                <p className="text-xs font-bold text-slate-500">Estimación de mantenimiento</p>
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
              {stats.targetCalories}
              <span className="text-sm font-bold text-slate-400 ml-1">KCAL</span>
            </p>
          </div>
        </Card>
      )}

      {/* Elevated Weight Tracking Section */}
      <div className="space-y-6 relative z-10">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-slate-400">
            <IoStatsChartOutline className="w-4 h-4" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em]">Registro de Peso</h3>
          </div>
          <button
            onClick={() => setShowWeightModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform"
          >
            <IoAddOutline className="w-3.5 h-3.5" />
            Registrar
          </button>
        </div>

        <Card className="border-none bg-white dark:bg-slate-900 shadow-2xl shadow-blue-500/5 overflow-hidden">
          <Card.Body className="p-0">
            {/* Chart Area with Gradient */}
            <div className="p-8 pb-0">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                    {weightProgress?.currentWeight || profile.weight}
                    <span className="text-sm font-bold text-slate-400 ml-1">kg</span>
                  </p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Peso actual</p>
                </div>
                {weightProgress && (
                  <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${weightProgress.change <= 0 ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600'
                    }`}>
                    {weightProgress.change <= 0 ? <IoTrendingDownOutline /> : <IoTrendingUpOutline />}
                    {Math.abs(weightProgress.change)} kg
                  </div>
                )}
              </div>

              {chartData.length > 1 ? (
                <div className="h-41 -mx-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }}
                        dy={10}
                      />
                      <YAxis
                        domain={['dataMin - 1', 'dataMax + 1']}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 'bold' }}
                        dx={-5}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          border: 'none',
                          borderRadius: '16px',
                          padding: '12px',
                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                          backdropFilter: 'blur(8px)'
                        }}
                        labelStyle={{ color: '#94a3b8', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', marginBottom: 4 }}
                        itemStyle={{ color: '#fff', fontWeight: '900', fontSize: 16 }}
                        formatter={(value) => [`${value} kg`]}
                      />
                      <Line
                        type="monotone"
                        dataKey="peso"
                        stroke="#2563eb"
                        strokeWidth={4}
                        dot={{ fill: '#2563eb', strokeWidth: 4, stroke: '#fff', r: 4 }}
                        activeDot={{ fill: '#2563eb', strokeWidth: 4, stroke: '#fff', r: 6 }}
                        animationDuration={2000}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950/50 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                  <IoScaleOutline className="w-10 h-10 text-slate-200 dark:text-slate-800 mb-2" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Insuficientes datos</p>
                </div>
              )}
            </div>

            {/* Quick Stats Footer */}
            <div className="bg-slate-50/50 dark:bg-slate-950/30 p-8 grid grid-cols-3 gap-4 border-t border-slate-50 dark:border-slate-800/50">
              {[
                { label: 'Inicial', value: weightProgress?.startWeight || '-', color: 'text-slate-400' },
                { label: 'Actual', value: weightProgress?.currentWeight || profile.weight, color: 'text-blue-600 dark:text-blue-400' },
                { label: 'Meta', value: profile.targetWeight || '-', color: 'text-emerald-500' }
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <p className={`text-xl font-black ${s.color} leading-none mb-1`}>{s.value}</p>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Entries List */}
            {weightHistory?.length > 0 && (
              <div className="p-8 pt-0 space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Últimos Registros</p>
                <div className="space-y-2">
                  {[...weightHistory].reverse().slice(0, 3).map((entry) => (
                    <div key={entry.id} className="group/item flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/50 rounded-[1.5rem] border border-transparent hover:border-slate-200 dark:hover:border-slate-800 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm">
                          <IoCalendarOutline className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white leading-none mb-1">{entry.weight} kg</p>
                          <p className="text-[10px] text-slate-400 uppercase font-black">
                            {new Date(entry.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteWeight(entry.id)}
                        className="opacity-0 group-hover/item:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all"
                      >
                        <IoTrashOutline className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Redesigned Add Weight Modal */}
      <Modal isOpen={showWeightModal} onClose={() => setShowWeightModal(false)} title="Nuevo Registro" size="sm">
        <div className="space-y-8 p-2">
          <div className="relative p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-violet-600 text-center overflow-hidden shadow-2xl shadow-blue-500/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <IoScaleOutline className="w-12 h-12 text-white/50 absolute top-4 left-4 rotate-12" />

            <div className="relative z-10">
              <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/20">
                <IoScaleOutline className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">Actualizar Peso</h3>
              <p className="text-xs text-blue-100/60 font-medium uppercase tracking-[0.1em]">Mantén tu progreso al día</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <Input
                label="Peso Actual"
                type="number"
                step="0.1"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder="70.5"
                className="text-lg font-black h-14 rounded-2xl"
              />
              <div className="absolute right-4 top-[3.2rem] text-[10px] font-black text-slate-400">KG</div>
            </div>

            <Input
              label="Fecha del Registro"
              type="date"
              value={newWeightDate}
              onChange={(e) => setNewWeightDate(e.target.value)}
              className="font-black h-14 rounded-2xl"
            />

            <Button
              onClick={handleAddWeight}
              className="w-full h-16 premium-gradient shadow-2xl shadow-blue-500/30 rounded-2xl text-lg font-black uppercase tracking-widest"
              disabled={!newWeight}
            >
              Confirmar Registro
            </Button>
          </div>
        </div>
      </Modal>

      {/* Account Management Menu */}
      <div className="space-y-6 relative z-10">
        <div className="flex items-center gap-2 px-1 text-slate-400">
          <IoSettingsOutline className="w-4 h-4" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em]">Configuración</h3>
        </div>

        <Card className="border-none bg-white dark:bg-slate-900 shadow-2xl shadow-blue-500/5 overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
          <button
            onClick={() => setIsEditing(true)}
            className="w-full flex items-center justify-between p-8 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
          >
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300">
                <IoSettingsOutline className="w-7 h-7 text-blue-600 dark:text-blue-400 group-hover:text-white" />
              </div>
              <div className="text-left">
                <span className="block font-black text-slate-900 dark:text-white text-lg tracking-tight">Editar Preferencias</span>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Metas, Medidas e Información</span>
              </div>
            </div>
            <IoChevronForward className="w-6 h-6 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
          </button>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-between p-8 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all group"
          >
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-600 transition-all duration-300">
                <IoLogOutOutline className="w-7 h-7 text-rose-600 dark:text-rose-400 group-hover:text-white" />
              </div>
              <div className="text-left">
                <span className="block font-black text-rose-600 dark:text-rose-400 text-lg tracking-tight">Cerrar Sesión</span>
                <span className="text-[10px] text-rose-400/60 font-black uppercase tracking-widest mt-1">Desconectar tu cuenta de forma segura</span>
              </div>
            </div>
            <IoChevronForward className="w-6 h-6 text-rose-300 group-hover:translate-x-1 transition-all" />
          </button>
        </Card>
      </div>

      <Modal
        isOpen={showLogoutModal}
        onClose={() => (!isLoggingOut ? setShowLogoutModal(false) : null)}
        title="Cerrar sesión"
        size="sm"
      >
        <div className="space-y-6">
          <div className="p-6 bg-rose-50 dark:bg-rose-900/30 rounded-[2rem] text-center border border-rose-100 dark:border-rose-800/40">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-700/40">
              <IoLogOutOutline className="w-8 h-8 text-rose-600 dark:text-rose-300" />
            </div>
            <p className="text-xl font-black text-slate-900 dark:text-white mb-2">¿Deseas salir?</p>
            <p className="text-sm text-slate-600 dark:text-slate-200">Tu progreso se mantiene sincronizado en la nube.</p>
          </div>

          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1 h-14"
              onClick={() => setShowLogoutModal(false)}
              disabled={isLoggingOut}
            >
              Quedarme
            </Button>
            <Button
              variant="danger"
              className="flex-1 h-14"
              onClick={handleLogout}
              loading={isLoggingOut}
            >
              Salir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

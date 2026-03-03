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
import { Card, Button, Input, Modal, ProgressBar } from '@/components/ui';
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
      <div className="px-5 py-8 space-y-8 animate-fadeIn pb-32">
        <header className="px-1">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
              <IoSettingsOutline className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {profile ? 'Editar Perfil' : 'Configurar Perfil'}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                {profile ? 'Actualiza tus datos' : 'Comencemos tu viaje'}
              </p>
            </div>
          </div>
        </header>

        {/* Section 1: Personal Info */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1 text-slate-400">
            <IoPersonCircleOutline className="w-4 h-4" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em]">Información Personal</h3>
          </div>
          <Card className="border-slate-200/60 dark:border-slate-700/60 shadow-lg shadow-slate-200/50 dark:shadow-black/20">
            <Card.Body className="p-6 space-y-6">
              <Input
                label="Nombre completo"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ej: Alessandro"
              />

              <div>
                <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-3 px-1 uppercase tracking-widest">Género</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: 'MALE', label: 'Hombre', icon: '♂' },
                    { val: 'FEMALE', label: 'Mujer', icon: '♀' },
                    { val: 'OTHER', label: 'Otro', icon: '⚧' }
                  ].map((g) => (
                    <button
                      key={g.val}
                      onClick={() => handleChange('gender', g.val)}
                      className={`py-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${formData.gender === g.val
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 -translate-y-1'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                    >
                      <span className="block text-lg mb-1">{g.icon}</span>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Fecha de nacimiento"
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
              />
            </Card.Body>
          </Card>
        </section>

        {/* Section 2: Body Metrics */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1 text-slate-400">
            <IoBodyOutline className="w-4 h-4" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em]">Medidas Corporales</h3>
          </div>
          <Card className="border-slate-200/60 dark:border-slate-700/60 shadow-lg shadow-slate-200/50 dark:shadow-black/20">
            <Card.Body className="p-6">
              <div className="grid grid-cols-2 gap-5">
                <div className="relative">
                  <Input
                    label="Peso Actual"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleChange('weight', parseFloat(e.target.value) || 0)}
                  />
                  <div className="absolute right-4 top-[3.2rem] text-xs font-black text-slate-400 pointer-events-none">KG</div>
                </div>
                <div className="relative">
                  <Input
                    label="Estatura"
                    type="number"
                    value={formData.height}
                    onChange={(e) => handleChange('height', parseInt(e.target.value) || 0)}
                  />
                  <div className="absolute right-4 top-[3.2rem] text-xs font-black text-slate-400 pointer-events-none">CM</div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </section>

        {/* Section 3: Activity Level */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1 text-slate-400">
            <IoFitnessOutline className="w-4 h-4" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em]">Nivel de Actividad</h3>
          </div>
          <div className="space-y-3">
            {ACTIVITY_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => handleChange('activityLevel', level.value)}
                className={`w-full p-5 rounded-3xl text-left transition-all duration-300 relative overflow-hidden group ${formData.activityLevel === level.value
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 ring-4 ring-blue-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-800'
                  }`}
              >
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className={`font-black text-sm uppercase tracking-wide ${formData.activityLevel === level.value ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                      {level.label}
                    </p>
                    <p className={`text-xs mt-1 ${formData.activityLevel === level.value ? 'text-blue-100' : 'text-slate-400'}`}>
                      {level.desc}
                    </p>
                  </div>
                  {formData.activityLevel === level.value && (
                    <IoCheckmarkCircle className="w-6 h-6 text-white animate-scale-in" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Section 4: Goals */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1 text-slate-400">
            <IoSparkles className="w-4 h-4" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em]">Tu Objetivo Principal</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {GOALS.map((goal) => (
              <button
                key={goal.value}
                onClick={() => handleChange('goal', goal.value)}
                className={`w-full p-5 rounded-3xl text-left transition-all duration-300 relative overflow-hidden ${formData.goal === goal.value
                  ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 ring-4 ring-emerald-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-800'
                  }`}
              >
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className={`font-black text-sm uppercase tracking-wide ${formData.goal === goal.value ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                      {goal.label}
                    </p>
                    <p className={`text-xs mt-1 ${formData.goal === goal.value ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {goal.desc}
                    </p>
                  </div>
                  {formData.goal === goal.value && (
                    <IoCheckmarkCircle className="w-6 h-6 text-white animate-scale-in" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Section 5: Target Weight */}
        {formData.goal !== 'MAINTENANCE' && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1 text-slate-400">
              {formData.goal === 'WEIGHT_LOSS' ? (
                <IoTrendingDownOutline className="w-4 h-4" />
              ) : (
                <IoTrendingUpOutline className="w-4 h-4" />
              )}
              <h3 className="text-xs font-black uppercase tracking-[0.2em]">Peso Meta</h3>
            </div>
            <Card className="border-slate-200/60 dark:border-slate-700/60 shadow-lg shadow-slate-200/50 dark:shadow-black/20">
              <Card.Body className="p-6">
                <div className="relative">
                  <Input
                    label={formData.goal === 'WEIGHT_LOSS' ? 'Peso objetivo' : 'Peso deseado'}
                    type="number"
                    value={formData.targetWeight}
                    onChange={(e) => handleChange('targetWeight', parseFloat(e.target.value) || 0)}
                  />
                  <div className="absolute right-4 top-[3.2rem] text-xs font-black text-slate-400 pointer-events-none">KG</div>
                </div>
                <p className="text-xs text-slate-400 mt-3 px-1">
                  {formData.goal === 'WEIGHT_LOSS' 
                    ? `Diferencia: ${Math.abs(formData.weight - formData.targetWeight).toFixed(1)} kg por perder`
                    : `Diferencia: ${Math.abs(formData.targetWeight - formData.weight).toFixed(1)} kg por ganar`
                  }
                </p>
              </Card.Body>
            </Card>
          </section>
        )}

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent dark:from-slate-950 dark:via-slate-950 z-50">
          <div className="max-w-lg mx-auto flex gap-4">
            {profile && (
              <Button
                variant="ghost"
                onClick={() => setIsEditing(false)}
                className="flex-1 h-14 border-2 border-slate-200 dark:border-slate-800 text-slate-500"
              >
                Cancelar
              </Button>
            )}
            <Button
              onClick={handleSave}
              className={`h-14 shadow-xl ${profile ? 'flex-[2]' : 'w-full'}`}
              disabled={!formData.name}
              variant="primary"
            >
              <IoSaveOutline className="w-5 h-5 mr-2" />
              Guardar Perfil
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Profile view
  return (
    <div className="px-4 sm:px-5 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Header */}
      <header className="flex items-center gap-4 sm:gap-6 pt-2 px-1">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-[2rem] bg-blue-600 flex items-center justify-center shadow-xl">
            <IoPersonCircleOutline className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
          </div>
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate">{profile.name}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-1 truncate">{user?.email || 'Miembro Fit'}</p>
        </div>
      </header>

      {/* Workout Stats */}
      <Card className="border-slate-200/60 dark:border-slate-700/60 shadow-xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden relative z-10">
        <Card.Body className="p-0">
          <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800">
            <div className="p-4 sm:p-5 text-center group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-orange-50 dark:bg-orange-900/30 text-orange-500 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <IoFlameOutline className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{thisWeekWorkouts}</p>
              <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Esta semana</p>
            </div>
            <div className="p-5 text-center group">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-500 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <IoTrophyOutline className="w-5 h-5" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{totalWorkouts}</p>
              <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Total sesiones</p>
            </div>
            <div className="p-4 sm:p-5 text-center group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-cyan-50 dark:bg-cyan-900/30 text-cyan-500 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <IoBarbell className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{totalRoutines}</p>
              <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Rutinas creadas</p>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Weight Goal Progress */}
      {profile.goal !== 'MAINTENANCE' && profile.targetWeight && profile.targetWeight !== profile.weight && (
        <Card className="border-slate-200/60 dark:border-slate-700/60 shadow-xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden relative z-10">
          <Card.Body className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {profile.goal === 'WEIGHT_LOSS' ? (
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center">
                    <IoTrendingDownOutline className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 flex items-center justify-center">
                    <IoTrendingUpOutline className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <p className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                    {profile.goal === 'WEIGHT_LOSS' ? 'Objetivo: Perder peso' : 'Objetivo: Ganar músculo'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {Math.abs(profile.targetWeight - profile.weight).toFixed(1)} kg {profile.goal === 'WEIGHT_LOSS' ? 'por perder' : 'por ganar'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">{profile.weight} kg</span>
              <span className="text-xs font-bold text-slate-500">{profile.targetWeight} kg</span>
            </div>
            <ProgressBar 
              value={0} 
              max={100} 
              color={profile.goal === 'WEIGHT_LOSS' ? 'rose' : 'emerald'}
              className="h-3"
            />
            <p className="text-[10px] text-slate-400 text-center mt-3">
              Actualiza tu peso regularmente para ver tu progreso
            </p>
          </Card.Body>
        </Card>
      )}

      {/* Body Stats Cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 relative z-10">
          {[
            { label: 'Peso', value: profile.weight, unit: 'kg', icon: IoScaleOutline, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
            { label: 'IMC', value: stats.bmi, unit: '', icon: IoBodyOutline, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
            { label: 'TDEE', value: stats.tdee, unit: 'kcal', icon: IoFitnessOutline, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/30' }
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="border-none shadow-xl shadow-slate-200/50 dark:shadow-black/20 group">
                <Card.Body className="p-5 text-center">
                  <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label} <span className="lowercase">{stat.unit}</span></p>
                </Card.Body>
              </Card>
            );
          })}
        </div>
      )}

      {/* Macros Recommendation */}
      {stats && (
        <Card className="border-slate-200/60 dark:border-slate-700/60 shadow-2xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden relative group z-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-16 -mt-16 z-0" />
          <Card.Header className="pt-8 px-8 border-none bg-transparent relative z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Plan Nutricional</h2>
              <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full">Automático</span>
            </div>
          </Card.Header>
          <Card.Body className="p-8 pt-6 relative z-10">
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: 'Proteína', value: stats.macros.protein, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50/50 dark:bg-blue-900/20' },
                { label: 'Carbos', value: stats.macros.carbs, color: 'text-emerald-500', bg: 'bg-emerald-50/50 dark:bg-emerald-900/20' },
                { label: 'Grasas', value: stats.macros.fat, color: 'text-amber-500', bg: 'bg-amber-50/50 dark:bg-amber-900/20' }
              ].map((macro) => (
                <div key={macro.label} className={`${macro.bg} rounded-[1.5rem] p-5 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all`}>
                  <p className={`text-2xl font-black ${macro.color}`}>{macro.value}g</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{macro.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Objetivo diario</p>
              <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.targetCalories} <span className="text-xs text-slate-400 font-bold ml-1">kcal</span></p>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Weight Tracking Section */}
      <h2 className="text-sm font-black text-slate-400 dark:text-slate-300 uppercase tracking-[0.2em] px-1 -mb-4 relative z-10">Registro de Peso</h2>
      <Card className="border-slate-200/60 dark:border-slate-700/60 shadow-2xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden relative z-10">
        <Card.Body className="p-6">
          {/* Header with Add Button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-violet-50 dark:bg-violet-900/30 text-violet-500 flex items-center justify-center">
                <IoStatsChartOutline className="w-5 h-5" />
              </div>
              <div>
                <p className="font-black text-slate-900 dark:text-white text-sm">Progreso de Peso</p>
                {weightProgress && (
                  <p className={`text-xs font-bold ${weightProgress.change > 0 ? 'text-rose-500' : weightProgress.change < 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {weightProgress.change > 0 ? '+' : ''}{weightProgress.change} kg desde inicio
                  </p>
                )}
              </div>
            </div>
            <Button onClick={() => setShowWeightModal(true)} className="h-10 px-4">
              <IoAddOutline className="w-5 h-5 mr-1" />
              Registrar
            </Button>
          </div>

          {/* Weight Chart */}
          {chartData.length > 1 ? (
            <div className="h-48 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    dy={10}
                  />
                  <YAxis 
                    domain={['dataMin - 2', 'dataMax + 2']}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    dx={-5}
                    tickFormatter={(v) => `${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '10px 14px',
                    }}
                    labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}
                    itemStyle={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}
                    formatter={(value) => [`${value} kg`, 'Peso']}
                  />
                  {profile?.targetWeight && (
                    <ReferenceLine 
                      y={profile.targetWeight} 
                      stroke="#10b981" 
                      strokeDasharray="5 5"
                      strokeWidth={2}
                    />
                  )}
                  <Line 
                    type="monotone" 
                    dataKey="peso" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', strokeWidth: 0, r: 4 }}
                    activeDot={{ fill: '#8b5cf6', strokeWidth: 0, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-10 text-center">
              <IoScaleOutline className="w-12 h-12 mx-auto text-slate-200 dark:text-slate-700 mb-3" />
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Sin datos suficientes</p>
              <p className="text-xs text-slate-400 mt-1">Registra al menos 2 pesos para ver la gráfica</p>
            </div>
          )}

          {/* Weight Stats Summary */}
          {weightProgress && (
            <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="text-center">
                <p className="text-lg font-black text-slate-900 dark:text-white">{weightProgress.startWeight}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Inicio</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-violet-600 dark:text-violet-400">{weightProgress.currentWeight}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Actual</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-emerald-500">{profile?.targetWeight || '-'}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Meta</p>
              </div>
            </div>
          )}

          {/* Recent Entries List */}
          {weightHistory && weightHistory.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Últimos registros</p>
              <div className="space-y-2 max-h-40 overflow-auto">
                {[...weightHistory].reverse().slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                        <IoCalendarOutline className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 dark:text-white text-sm">{entry.weight} kg</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(entry.date).toLocaleDateString('es-ES', { 
                            day: 'numeric', 
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteWeight(entry.id)}
                      className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center justify-center transition-colors"
                    >
                      <IoTrashOutline className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add Weight Modal */}
      <Modal isOpen={showWeightModal} onClose={() => setShowWeightModal(false)} title="Registrar Peso" size="sm">
        <div className="space-y-5">
          <div className="p-6 bg-violet-50 dark:bg-violet-900/20 rounded-3xl text-center">
            <div className="w-16 h-16 rounded-3xl bg-violet-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/30">
              <IoScaleOutline className="w-8 h-8 text-white" />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">Registra tu peso actual para llevar un seguimiento de tu progreso.</p>
          </div>

          <Input
            label="Peso (kg)"
            type="number"
            step="0.1"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            placeholder="70.5"
          />

          <Input
            label="Fecha"
            type="date"
            value={newWeightDate}
            onChange={(e) => setNewWeightDate(e.target.value)}
          />

          <Button onClick={handleAddWeight} className="w-full h-14" disabled={!newWeight}>
            <IoSaveOutline className="w-5 h-5 mr-2" />
            Guardar Registro
          </Button>
        </div>
      </Modal>

      {/* Menu Options */}
      <h2 className="text-sm font-black text-slate-400 dark:text-slate-300 uppercase tracking-[0.2em] px-1 -mb-4">Gestion</h2>
      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        <button
          onClick={() => setIsEditing(true)}
          className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all group"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <IoSettingsOutline className="w-6 h-6 text-slate-600 dark:text-slate-200" />
            </div>
            <div className="text-left">
              <span className="block font-black text-slate-900 dark:text-white tracking-tight">Preferencias</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-300 font-bold uppercase tracking-widest">Información personal y metas</span>
            </div>
          </div>
          <IoChevronForward className="w-6 h-6 text-slate-400 dark:text-slate-300 group-hover:text-blue-500 dark:group-hover:text-blue-300 group-hover:translate-x-1 transition-all" />
        </button>

        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center justify-between p-6 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all group"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <IoLogOutOutline className="w-6 h-6 text-rose-600 dark:text-rose-300" />
            </div>
            <div className="text-left">
              <span className="block font-black text-rose-600 dark:text-rose-300 tracking-tight">Cerrar Sesión</span>
              <span className="text-[10px] text-rose-500/80 dark:text-rose-200/80 font-bold uppercase tracking-widest">Salir de tu cuenta</span>
            </div>
          </div>
          <IoChevronForward className="w-6 h-6 text-rose-400 dark:text-rose-300 group-hover:translate-x-1 transition-all" />
        </button>
      </Card>

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

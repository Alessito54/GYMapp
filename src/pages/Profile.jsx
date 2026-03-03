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
  IoSaveOutline
} from 'react-icons/io5';
import { Card, Button, Input, Modal } from '@/components/ui';
import { useAuthStore, useUserStore } from '@/stores';

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
  const { profile, setProfile, updateProfile, getStats } = useUserStore();
  const stats = getStats();
  const userId = user?.uid;

  const [isEditing, setIsEditing] = useState(!profile);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    gender: profile?.gender || 'MALE',
    birthDate: profile?.birthDate || '1990-01-01',
    weight: profile?.weight || 70,
    height: profile?.height || 170,
    activityLevel: profile?.activityLevel || 'MODERATELY_ACTIVE',
    goal: profile?.goal || 'MUSCLE_GAIN',
  });

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

  // Setup view (no profile yet)
  if (!profile || isEditing) {
    return (
      <div className="px-5 py-6 space-y-6 animate-fadeIn">
        <header className="pt-2 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <IoSettingsOutline className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {profile ? 'Editar perfil' : 'Configurar perfil'}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                {profile ? 'Actualiza tu información' : 'Ingresa tus datos para comenzar'}
              </p>
            </div>
          </div>
        </header>

        <Card className="shadow-lg shadow-slate-200/50 dark:shadow-black/20 border-slate-100 dark:border-slate-800">
          <Card.Body className="space-y-6 p-6">
            <Input
              label="Nombre"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Tu nombre"
            />

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 px-1">Género</label>
              <div className="grid grid-cols-3 gap-3">
                {['MALE', 'FEMALE', 'OTHER'].map((g) => (
                  <button
                    key={g}
                    onClick={() => handleChange('gender', g)}
                    className={`py-3.5 px-4 rounded-xl text-sm font-semibold transition-all active-scale-95 ${formData.gender === g
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                  >
                    {g === 'MALE' ? 'Hombre' : g === 'FEMALE' ? 'Mujer' : 'Otro'}
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

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Peso (kg)"
                type="number"
                value={formData.weight}
                onChange={(e) => handleChange('weight', parseFloat(e.target.value) || 0)}
              />
              <Input
                label="Altura (cm)"
                type="number"
                value={formData.height}
                onChange={(e) => handleChange('height', parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 px-1">Nivel de actividad</label>
              <div className="space-y-2">
                {ACTIVITY_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => handleChange('activityLevel', level.value)}
                    className={`w-full p-4 rounded-xl text-left transition-all active-scale-98 ${formData.activityLevel === level.value
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-500 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-2 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                  >
                    <p className="font-semibold text-slate-900 dark:text-white">{level.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{level.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 px-1">Objetivo</label>
              <div className="space-y-2">
                {GOALS.map((goal) => (
                  <button
                    key={goal.value}
                    onClick={() => handleChange('goal', goal.value)}
                    className={`w-full p-4 rounded-xl text-left transition-all active-scale-98 ${formData.goal === goal.value
                      ? 'bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-500 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/80 border-2 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                  >
                    <p className="font-semibold text-slate-900 dark:text-white">{goal.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{goal.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </Card.Body>
        </Card>

        <div className="space-y-3 mt-2">
          <Button
            onClick={handleSave}
            className="w-full h-14"
            disabled={!formData.name}
          >
            <IoSaveOutline className="w-5 h-5 mr-2" />
            Guardar perfil
          </Button>

          {profile && (
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="w-full h-12"
            >
              Cancelar
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Profile view
  return (
    <div className="px-5 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <header className="flex items-center gap-6 pt-2 px-1">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-[2rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative w-24 h-24 rounded-[2rem] bg-indigo-600 flex items-center justify-center shadow-xl">
            <IoPersonCircleOutline className="w-14 h-14 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{profile.name}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{user?.email || 'Miembro Fit'}</p>
        </div>
      </header>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Peso', value: profile.weight, unit: 'kg', icon: IoScaleOutline, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
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
        <Card className="border-none shadow-2xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-16 -mt-16" />
          <Card.Header className="pt-8 px-8 border-none bg-transparent">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Plan Nutricional</h2>
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full">Automático</span>
            </div>
          </Card.Header>
          <Card.Body className="p-8 pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: 'Proteína', value: stats.macros.protein, color: 'text-indigo-500', bg: 'bg-indigo-50/50 dark:bg-indigo-900/20' },
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

      {/* Menu Options */}
      <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-1 -mb-4">Gestion</h2>
      <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        <button
          onClick={() => setIsEditing(true)}
          className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all group"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
              <IoSettingsOutline className="w-6 h-6 text-slate-600" />
            </div>
            <div className="text-left">
              <span className="block font-black text-slate-900 dark:text-white tracking-tight">Preferencias</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Información personal y metas</span>
            </div>
          </div>
          <IoChevronForward className="w-6 h-6 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
        </button>

        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center justify-between p-6 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all group"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <IoLogOutOutline className="w-6 h-6 text-rose-500" />
            </div>
            <div className="text-left">
              <span className="block font-black text-rose-500 tracking-tight">Cerrar Sesión</span>
              <span className="text-[10px] text-rose-400/60 font-bold uppercase tracking-widest">Salir de tu cuenta</span>
            </div>
          </div>
          <IoChevronForward className="w-6 h-6 text-rose-300 group-hover:translate-x-1 transition-all" />
        </button>
      </Card>

      <Modal
        isOpen={showLogoutModal}
        onClose={() => (!isLoggingOut ? setShowLogoutModal(false) : null)}
        title="Cerrar sesión"
        size="sm"
      >
        <div className="space-y-6">
          <div className="p-6 bg-rose-50 dark:bg-rose-950/20 rounded-[2rem] text-center">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-4 border border-rose-100 dark:border-rose-900/50">
              <IoLogOutOutline className="w-8 h-8 text-rose-500" />
            </div>
            <p className="text-xl font-black text-slate-900 dark:text-white mb-2">¿Deseas salir?</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Tu progreso se mantiene sincronizado en la nube.</p>
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

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
      updateProfile(formData);
    } else {
      setProfile(formData);
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
      <div className="px-4 py-6 space-y-6 animate-fadeIn">
        <header className="pt-2">
          <div className="flex items-center gap-2">
            <IoSettingsOutline className="w-6 h-6 text-gray-700" />
            <h1 className="text-2xl font-bold text-gray-900">
              {profile ? 'Editar perfil' : 'Configurar perfil'}
            </h1>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">
            {profile ? 'Actualiza tu informacion' : 'Ingresa tus datos para comenzar'}
          </p>
        </header>

        <Card className="shadow-sm">
          <Card.Body className="space-y-5">
            <Input
              label="Nombre"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Tu nombre"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Genero</label>
              <div className="grid grid-cols-3 gap-2">
                {['MALE', 'FEMALE', 'OTHER'].map((g) => (
                  <button
                    key={g}
                    onClick={() => handleChange('gender', g)}
                    className={`py-3 px-4 rounded-2xl text-sm font-medium transition-all active-scale-95 ${formData.gender === g
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Nivel de actividad</label>
              <div className="space-y-2">
                {ACTIVITY_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => handleChange('activityLevel', level.value)}
                    className={`w-full p-4 rounded-2xl text-left transition-all active-scale-98 ${formData.activityLevel === level.value
                        ? 'bg-blue-50 border-2 border-blue-500 shadow-sm'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                  >
                    <p className="font-medium text-gray-900">{level.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{level.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Objetivo</label>
              <div className="space-y-2">
                {GOALS.map((goal) => (
                  <button
                    key={goal.value}
                    onClick={() => handleChange('goal', goal.value)}
                    className={`w-full p-4 rounded-2xl text-left transition-all active-scale-98 ${formData.goal === goal.value
                        ? 'bg-green-50 border-2 border-green-500 shadow-sm'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                  >
                    <p className="font-medium text-gray-900">{goal.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{goal.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </Card.Body>
        </Card>

        <Button
          onClick={handleSave}
          className="w-full"
          disabled={!formData.name}
        >
          <IoSaveOutline className="w-5 h-5 mr-2" />
          Guardar perfil
        </Button>

        {profile && (
          <Button
            variant="ghost"
            onClick={() => setIsEditing(false)}
            className="w-full"
          >
            Cancelar
          </Button>
        )}
      </div>
    );
  }

  // Profile view
  return (
    <div className="px-4 py-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <header className="flex items-center gap-4 pt-2">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <IoPersonCircleOutline className="w-10 h-10 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
          <p className="text-gray-500 text-sm">{user?.email || 'Usuario'}</p>
        </div>
      </header>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <Card className="text-center p-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-2">
              <IoScaleOutline className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xl font-bold text-gray-900">{profile.weight}</p>
            <p className="text-xs text-gray-500">kg</p>
          </Card>
          <Card className="text-center p-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-2">
              <IoBodyOutline className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.bmi}</p>
            <p className="text-xs text-gray-500">IMC</p>
          </Card>
          <Card className="text-center p-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mx-auto mb-2">
              <IoFitnessOutline className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-xl font-bold text-gray-900">{stats.tdee}</p>
            <p className="text-xs text-gray-500">TDEE</p>
          </Card>
        </div>
      )}

      {/* Macros */}
      {stats && (
        <Card className="shadow-sm">
          <Card.Header>
            <h2 className="font-semibold text-gray-900">Macros recomendados</h2>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-blue-50 rounded-2xl">
                <p className="text-xl font-bold text-blue-600">{stats.macros.protein}g</p>
                <p className="text-xs text-gray-500 mt-0.5">Proteina</p>
              </div>
              <div className="p-3 bg-green-50 rounded-2xl">
                <p className="text-xl font-bold text-green-600">{stats.macros.carbs}g</p>
                <p className="text-xs text-gray-500 mt-0.5">Carbos</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl">
                <p className="text-xl font-bold text-amber-600">{stats.macros.fat}g</p>
                <p className="text-xs text-gray-500 mt-0.5">Grasas</p>
              </div>
            </div>
            <p className="text-center text-sm text-gray-500 mt-4">
              Objetivo diario: <span className="font-semibold text-gray-900">{stats.targetCalories} kcal</span>
            </p>
          </Card.Body>
        </Card>
      )}

      {/* Menu Options */}
      <Card className="shadow-sm overflow-hidden">
        <button
          onClick={() => setIsEditing(true)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <IoSettingsOutline className="w-5 h-5 text-gray-600" />
            </div>
            <span className="font-medium text-gray-900">Editar perfil</span>
          </div>
          <IoChevronForward className="w-5 h-5 text-gray-400" />
        </button>

        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center justify-between p-4 hover:bg-red-50 active:bg-red-100 transition-colors border-t border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <IoLogOutOutline className="w-5 h-5 text-red-600" />
            </div>
            <span className="font-medium text-red-600">Cerrar sesion</span>
          </div>
          <IoChevronForward className="w-5 h-5 text-gray-400" />
        </button>
      </Card>

      <Modal
        isOpen={showLogoutModal}
        onClose={() => (!isLoggingOut ? setShowLogoutModal(false) : null)}
        title="Cerrar sesion"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-2xl text-red-700">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <IoLogOutOutline className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold">¿Deseas cerrar sesion?</p>
              <p className="text-sm text-red-600/80">Se cerrara tu sesion y volveras a la pantalla de acceso.</p>
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

import { useState, useEffect } from 'react';
import {
  IoAddOutline,
  IoFolderOutline,
  IoChevronForward,
  IoPlayCircle,
  IoTimeOutline,
  IoBarbell,
  IoCheckmarkCircle,
  IoClose,
  IoTrashOutline,
  IoCreateOutline,
  IoSparkles,
  IoSearchOutline,
  IoLibraryOutline,
  IoBookOutline,
  IoAlertCircleOutline,
  IoBookmarkOutline,
  IoLayers,
  IoSettingsOutline,
  IoSaveOutline,
} from 'react-icons/io5';
import { Card, Button, Input, Modal, Badge, ProgressBar } from '@/components/ui';
import { useWorkoutStore, useAuthStore, MUSCLE_GROUPS } from '@/stores';
import { getWorkoutRecommendation, generateCompletePlan } from '@/config/gemini';

const GOAL_OPTIONS = [
  { value: 'MUSCLE_GAIN', label: 'Ganancia muscular' },
  { value: 'WEIGHT_LOSS', label: 'Perdida de peso' },
  { value: 'STRENGTH', label: 'Fuerza' },
  { value: 'ENDURANCE', label: 'Resistencia' },
];

const FOLDER_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'
];

const EQUIPMENT = [
  'Mancuernas', 'Barra', 'Maquinas', 'Poleas', 'Peso corporal', 'Bandas elasticas'
];

const SERIES_TYPES = [
  { value: 'simple',   label: 'Simple',   short: '1x',  color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  { value: 'biserie',  label: 'Bi-serie', short: '2x',  color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  { value: 'triserie', label: 'Tri-serie',short: '3x',  color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'drop',     label: 'Drop set', short: 'Drop',color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'circuito', label: 'Circuito', short: 'Cir', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
];

function ExerciseLibraryModal({ isOpen, onClose, onSelect, library }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMuscle, setFilterMuscle] = useState('');

  // Only show muscle groups that actually exist in the library
  const presentGroups = [...new Set(library.map(e => e.muscleGroup).filter(Boolean))].sort();

  const filteredLibrary = library.filter(e => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.muscleGroup && e.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesMuscle = !filterMuscle || e.muscleGroup === filterMuscle;
    return matchesSearch && matchesMuscle;
  });

  const handleClose = () => { setSearchTerm(''); setFilterMuscle(''); onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Biblioteca de Ejercicios" size="md">
      <div className="space-y-3">
        <div className="relative">
          <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar ejercicio o músculo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          />
        </div>

        {presentGroups.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterMuscle('')}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide transition-all ${!filterMuscle ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              Todos
            </button>
            {presentGroups.map(mg => (
              <button
                key={mg}
                onClick={() => setFilterMuscle(prev => prev === mg ? '' : mg)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide transition-all ${filterMuscle === mg ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                {mg}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {filteredLibrary.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <IoBookOutline className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium text-sm">{library.length === 0 ? 'La biblioteca está vacía' : 'Sin resultados'}</p>
              <p className="text-xs mt-1 opacity-70">{library.length === 0 ? 'Guarda ejercicios desde tus rutinas' : 'Prueba otro filtro o búsqueda'}</p>
            </div>
          ) : (
            filteredLibrary.map((exercise, idx) => (
              <button
                key={idx}
                onClick={() => { onSelect(exercise); handleClose(); }}
                className="w-full p-4 flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-blue-500/5 transition-all group text-left"
              >
                <div>
                  <p className="font-black text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {exercise.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px] uppercase font-black px-2 py-0.5">
                      {exercise.muscleGroup || 'General'}
                    </Badge>
                  </div>
                </div>
                <IoAddOutline className="w-6 h-6 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}

function LibraryManagementModal({ isOpen, onClose, library, onUpdate, onDelete, userId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMuscle, setFilterMuscle] = useState('');
  const [editingExercise, setEditingExercise] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const presentGroups = [...new Set(library.map(e => e.muscleGroup).filter(Boolean))].sort();

  const filteredLibrary = library.filter(e => {
    const matchesSearch =
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.muscleGroup && e.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesMuscle = !filterMuscle || e.muscleGroup === filterMuscle;
    return matchesSearch && matchesMuscle;
  });

  const handleClose = () => {
    setSearchTerm('');
    setFilterMuscle('');
    setEditingExercise(null);
    setDeleteConfirm(null);
    onClose();
  };

  const handleSaveEdit = async () => {
    if (editingExercise) {
      await onUpdate(editingExercise.id, {
        name: editingExercise.name,
        muscleGroup: editingExercise.muscleGroup,
        unit: editingExercise.unit,
        restSeconds: editingExercise.restSeconds
      }, userId);
      setEditingExercise(null);
    }
  };

  const handleConfirmDelete = async (id) => {
    await onDelete(id, userId);
    setDeleteConfirm(null);
  };

  // Edit Exercise View
  if (editingExercise) {
    return (
      <Modal isOpen={isOpen} onClose={() => setEditingExercise(null)} title="Editar Ejercicio" size="md">
        <div className="space-y-5">
          <Input
            label="Nombre del ejercicio"
            value={editingExercise.name}
            onChange={(e) => setEditingExercise({ ...editingExercise, name: e.target.value })}
            placeholder="Ej: Press de banca"
          />

          <div>
            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-3 px-1 uppercase tracking-widest">
              Grupo muscular
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MUSCLE_GROUPS.map(mg => (
                <button
                  key={mg}
                  onClick={() => setEditingExercise({ ...editingExercise, muscleGroup: mg })}
                  className={`p-3 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${
                    editingExercise.muscleGroup === mg
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {mg}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-3 px-1 uppercase tracking-widest">
              Unidad de medida
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['kg', 'lbs', 'seg'].map(unit => (
                <button
                  key={unit}
                  onClick={() => setEditingExercise({ ...editingExercise, unit })}
                  className={`p-3 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${
                    editingExercise.unit === unit
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Descanso (segundos)"
            type="number"
            value={editingExercise.restSeconds || 60}
            onChange={(e) => setEditingExercise({ ...editingExercise, restSeconds: parseInt(e.target.value) || 60 })}
            placeholder="60"
          />

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-12"
              onClick={() => setEditingExercise(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="flex-1 h-12"
              onClick={handleSaveEdit}
              disabled={!editingExercise.name}
            >
              <IoSaveOutline className="w-5 h-5 mr-2" />
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  // Delete Confirmation View
  if (deleteConfirm) {
    return (
      <Modal isOpen={isOpen} onClose={() => setDeleteConfirm(null)} title="Eliminar Ejercicio" size="sm">
        <div className="space-y-5">
          <div className="p-6 bg-rose-50 dark:bg-rose-900/30 rounded-2xl text-center">
            <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4 border border-rose-200 dark:border-rose-700/40">
              <IoTrashOutline className="w-7 h-7 text-rose-600 dark:text-rose-400" />
            </div>
            <p className="text-lg font-black text-slate-900 dark:text-white mb-2">¿Eliminar "{deleteConfirm.name}"?</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Este ejercicio se eliminará permanentemente de tu biblioteca.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-12" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button variant="danger" className="flex-1 h-12" onClick={() => handleConfirmDelete(deleteConfirm.id)}>
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  // Main Library List View
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Gestionar Biblioteca" size="md">
      <div className="space-y-3">
        <div className="relative">
          <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar ejercicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          />
        </div>

        {presentGroups.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterMuscle('')}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide transition-all ${!filterMuscle ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              Todos
            </button>
            {presentGroups.map(mg => (
              <button
                key={mg}
                onClick={() => setFilterMuscle(prev => prev === mg ? '' : mg)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide transition-all ${filterMuscle === mg ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                {mg}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
          {filteredLibrary.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <IoLibraryOutline className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium text-sm">{library.length === 0 ? 'Biblioteca vacía' : 'Sin resultados'}</p>
              <p className="text-xs mt-1 opacity-70">{library.length === 0 ? 'Los ejercicios guardados aparecerán aquí' : 'Prueba otro filtro'}</p>
            </div>
          ) : (
            filteredLibrary.map((exercise) => (
              <div
                key={exercise.id}
                className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 dark:text-white truncate">
                      {exercise.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge variant="secondary" className="text-[9px] uppercase font-black px-2 py-0.5">
                        {exercise.muscleGroup || 'General'}
                      </Badge>
                      {exercise.unit && (
                        <Badge className="text-[9px] uppercase font-bold px-2 py-0.5 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          {exercise.unit}
                        </Badge>
                      )}
                      {exercise.restSeconds && (
                        <Badge className="text-[9px] font-bold px-2 py-0.5 bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                          <IoTimeOutline className="w-3 h-3 mr-0.5 inline" />
                          {exercise.restSeconds}s
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-3">
                    <button
                      onClick={() => setEditingExercise({ ...exercise })}
                      className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center"
                    >
                      <IoCreateOutline className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(exercise)}
                      className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors flex items-center justify-center"
                    >
                      <IoTrashOutline className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs text-slate-400 text-center font-medium">
            {library.length} ejercicio{library.length !== 1 ? 's' : ''} en biblioteca
          </p>
        </div>
      </div>
    </Modal>
  );
}

const EXPERIENCE_OPTIONS = [
  { value: 'beginner', label: 'Principiante', desc: 'Menos de 6 meses' },
  { value: 'intermediate', label: 'Intermedio', desc: '6 meses - 2 años' },
  { value: 'advanced', label: 'Avanzado', desc: 'Más de 2 años' },
];

const DAYS_OPTIONS = [2, 3, 4, 5, 6];
const WEEKS_OPTIONS = [4, 6, 8, 12, 16];

function AICompletePlanModal({ isOpen, onClose, onCreatePlan, userId }) {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    goals: '',
    weeks: 8,
    daysPerWeek: 4,
    preferences: '',
    experience: 'intermediate'
  });

  const handleClose = () => {
    setStep(1);
    setError(null);
    setFormData({ goals: '', weeks: 8, daysPerWeek: 4, preferences: '', experience: 'intermediate' });
    onClose();
  };

  const handleGenerate = async () => {
    if (!formData.goals.trim()) {
      setError('Por favor describe tus metas');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const plan = await generateCompletePlan(formData);
      await onCreatePlan(plan, userId);
      handleClose();
    } catch (err) {
      setError(err.message || 'Error generando el plan');
    } finally {
      setIsGenerating(false);
    }
  };

  // Step 1: Goals description
  if (step === 1) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Crea tu Plan con IA" size="md">
        <div className="space-y-6">
          <div className="p-5 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-3xl border border-violet-100 dark:border-violet-800/30">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center flex-shrink-0">
                <IoSparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm">Genera un plan completo</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  La IA creará una meta con rutinas profesionales divididas por grupos musculares según tus objetivos.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-3 px-1 uppercase tracking-widest">
              ¿Cuáles son tus metas?
            </label>
            <textarea
              value={formData.goals}
              onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
              placeholder="Ej: Quiero ganar masa muscular en el tren superior, especialmente pecho y espalda. También quiero mejorar mi fuerza general y definir abdominales..."
              className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all resize-none h-32"
            />
            <p className="text-[10px] text-slate-400 mt-2 px-1">Sé específico: menciona qué músculos quieres trabajar, tus objetivos de peso, fuerza, etc.</p>
          </div>

          <Button onClick={() => setStep(2)} className="w-full h-14" disabled={!formData.goals.trim()}>
            Continuar
            <IoChevronForward className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </Modal>
    );
  }

  // Step 2: Configuration
  if (step === 2) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Configura tu Plan" size="md">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-3 px-1 uppercase tracking-widest">
              Nivel de experiencia
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFormData({ ...formData, experience: opt.value })}
                  className={`p-4 rounded-2xl text-center transition-all ${
                    formData.experience === opt.value
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <p className="text-xs font-black uppercase tracking-wide">{opt.label}</p>
                  <p className={`text-[9px] mt-1 ${formData.experience === opt.value ? 'text-violet-200' : 'text-slate-400'}`}>{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-3 px-1 uppercase tracking-widest">
              Días por semana
            </label>
            <div className="flex gap-2">
              {DAYS_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setFormData({ ...formData, daysPerWeek: d })}
                  className={`flex-1 py-4 rounded-2xl text-lg font-black transition-all ${
                    formData.daysPerWeek === d
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-3 px-1 uppercase tracking-widest">
              Duración del programa
            </label>
            <div className="flex gap-2">
              {WEEKS_OPTIONS.map((w) => (
                <button
                  key={w}
                  onClick={() => setFormData({ ...formData, weeks: w })}
                  className={`flex-1 py-3 rounded-2xl text-center transition-all ${
                    formData.weeks === w
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <p className="text-sm font-black">{w}</p>
                  <p className={`text-[9px] ${formData.weeks === w ? 'text-violet-200' : 'text-slate-400'}`}>semanas</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12">
              Atrás
            </Button>
            <Button onClick={() => setStep(3)} className="flex-[2] h-12">
              Continuar
              <IoChevronForward className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  // Step 3: Preferences & Generate
  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Preferencias" size="md">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-3 px-1 uppercase tracking-widest">
            Preferencias especiales (opcional)
          </label>
          <textarea
            value={formData.preferences}
            onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
            placeholder="Ej: Prefiero días de brazo completo (bíceps + tríceps juntos), me gusta empezar con ejercicios compuestos, no tengo acceso a poleas..."
            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-violet-500 focus:outline-none transition-all resize-none h-28"
          />
        </div>

        {/* Summary */}
        <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl space-y-3">
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Resumen del plan</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-slate-400 uppercase">Experiencia</p>
              <p className="font-black text-slate-800 dark:text-white text-sm">{EXPERIENCE_OPTIONS.find(e => e.value === formData.experience)?.label}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase">Días/semana</p>
              <p className="font-black text-slate-800 dark:text-white text-sm">{formData.daysPerWeek} días</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase">Duración</p>
              <p className="font-black text-slate-800 dark:text-white text-sm">{formData.weeks} semanas</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase">Rutinas</p>
              <p className="font-black text-slate-800 dark:text-white text-sm">{formData.daysPerWeek} rutinas</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-900/30 rounded-2xl">
            <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12" disabled={isGenerating}>
            Atrás
          </Button>
          <Button onClick={handleGenerate} className="flex-[2] h-14 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700" disabled={isGenerating}>
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Generando...
              </>
            ) : (
              <>
                <IoSparkles className="w-5 h-5 mr-2" />
                Generar Plan con IA
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function Workouts() {
  const { user } = useAuthStore();
  const userId = user?.uid;
  const [view, setView] = useState('folders');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isAddFolderOpen, setIsAddFolderOpen] = useState(false);
  const [isEditFolderOpen, setIsEditFolderOpen] = useState(false);
  const [isDeleteFolderOpen, setIsDeleteFolderOpen] = useState(false);
  const [isAddRoutineOpen, setIsAddRoutineOpen] = useState(false);
  const [isEditRoutineOpen, setIsEditRoutineOpen] = useState(false);
  const [isDeleteRoutineOpen, setIsDeleteRoutineOpen] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isLibraryManagementOpen, setIsLibraryManagementOpen] = useState(false);
  const [isAIPlanModalOpen, setIsAIPlanModalOpen] = useState(false);

  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  const [newFolderGoal, setNewFolderGoal] = useState('MUSCLE_GAIN');

  const {
    folders,
    addFolder,
    updateFolder,
    deleteFolder,
    getRoutinesByFolder,
    addRoutine,
    updateRoutine,
    deleteRoutine,
    startSession,
    activeSession,
    updateSessionExercise,
    completeSession,
    cancelSession,
    exerciseLibrary,
    updateExerciseInLibrary,
    deleteExerciseFromLibrary
  } = useWorkoutStore();

  const handleCompleteWorkout = async (sessionUserId, feedback = {}) => {
    await completeSession(sessionUserId || userId, feedback);
  };

  if (activeSession && activeSession.id && activeSession.exercises) {
    return (
      <ActiveSessionView
        session={activeSession}
        userId={userId}
        onUpdateExercise={updateSessionExercise}
        onComplete={handleCompleteWorkout}
        onCancel={cancelSession}
      />
    );
  }

  const handleAddFolder = () => {
    if (!newFolderName.trim()) return;
    addFolder({
      name: newFolderName,
      color: newFolderColor,
      goal: newFolderGoal,
    }, userId);
    resetFolderForm();
    setIsAddFolderOpen(false);
  };

  const handleEditFolder = () => {
    if (!newFolderName.trim() || !selectedFolder) return;
    updateFolder(selectedFolder.id, {
      name: newFolderName,
      color: newFolderColor,
      goal: newFolderGoal,
    }, userId);
    setSelectedFolder({ ...selectedFolder, name: newFolderName, color: newFolderColor, goal: newFolderGoal });
    resetFolderForm();
    setIsEditFolderOpen(false);
  };

  const handleDeleteFolder = () => {
    if (!selectedFolder) return;
    deleteFolder(selectedFolder.id, userId);
    setSelectedFolder(null);
    setView('folders');
    setIsDeleteFolderOpen(false);
  };

  const openEditFolder = () => {
    if (!selectedFolder) return;
    setNewFolderName(selectedFolder.name);
    setNewFolderColor(selectedFolder.color);
    setNewFolderGoal(selectedFolder.goal);
    setIsEditFolderOpen(true);
  };

  const resetFolderForm = () => {
    setNewFolderName('');
    setNewFolderColor(FOLDER_COLORS[0]);
    setNewFolderGoal('MUSCLE_GAIN');
  };

  const handleSelectFolder = (folder) => {
    setSelectedFolder(folder);
    setView('routines');
  };

  const handleCreateAIPlan = async (plan, planUserId) => {
    // Validate plan has required fields
    if (!plan?.planName || !plan?.routines?.length) {
      console.error('[handleCreateAIPlan] Invalid plan received:', plan);
      return;
    }

    // Create the folder/goal
    const newFolder = {
      id: Date.now().toString(),
      name: plan.planName,
      color: plan.color || FOLDER_COLORS[Math.floor(Math.random() * FOLDER_COLORS.length)],
      goal: plan.goal || 'MUSCLE_GAIN',
      createdAt: new Date().toISOString()
    };
    
    // Add folder
    await addFolder(newFolder, planUserId);
    
    // Add each routine to the folder
    for (const routine of plan.routines) {
      if (!routine.name || !routine.exercises?.length) {
        console.warn('[handleCreateAIPlan] Skipping invalid routine:', routine);
        continue;
      }
      
      const newRoutine = {
        ...routine,
        folderId: newFolder.id,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        lastPerformed: null,
        // Ensure exercises have muscleGroup
        exercises: routine.exercises.map(ex => ({
          ...ex,
          muscleGroup: ex.muscleGroup || routine.focusMuscles?.[0] || 'Full Body',
          unit: ex.unit || 'kg'
        }))
      };
      await addRoutine(newRoutine, planUserId);
    }
  };

  const handleStartWorkout = (routineId) => {
    startSession(routineId, userId);
  };

  const openEditRoutine = (routine) => {
    setSelectedRoutine(routine);
    setIsEditRoutineOpen(true);
  };

  const openDeleteRoutine = (routine) => {
    setSelectedRoutine(routine);
    setIsDeleteRoutineOpen(true);
  };

  const handleDeleteRoutine = () => {
    if (!selectedRoutine) return;
    deleteRoutine(selectedRoutine.id, userId);
    setSelectedRoutine(null);
    setIsDeleteRoutineOpen(false);
  };

  // Routines view
  if (view === 'routines' && selectedFolder) {
    const routines = getRoutinesByFolder(selectedFolder.id);

    return (
      <div className="px-5 py-8 space-y-8 animate-fadeIn">
        <header className="flex items-center justify-between px-1">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('folders')}
              className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 active:scale-95 transition-all"
            >
              <IoChevronForward className="w-5 h-5 transform rotate-180" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{selectedFolder.name}</h1>
              <p className="text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                {routines.length} {routines.length === 1 ? 'Rutina' : 'Rutinas'} • {selectedFolder.goal?.replace('_', ' ') || 'GENERAL'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={openEditFolder} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors">
              <IoCreateOutline className="w-5 h-5" />
            </button>
            <button onClick={() => setIsDeleteFolderOpen(true)} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-rose-600 transition-colors">
              <IoTrashOutline className="w-5 h-5" />
            </button>
          </div>
        </header>

        {routines.length === 0 ? (
          <Card className="text-center py-16 border-slate-200/60 dark:border-slate-700/60 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
            <div className="w-20 h-20 rounded-3xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-6 ring-4 ring-blue-500/10">
              <IoBarbell className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Sin rutinas todavia</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-8 max-w-[200px] mx-auto">Comienza agregando una rutina manual o usa nuestra IA.</p>
            <div className="flex flex-col gap-3 max-w-xs mx-auto px-6">
              <Button onClick={() => setIsAddRoutineOpen(true)} className="h-14">
                <IoAddOutline className="w-5 h-5 mr-2" />
                Nueva Rutina
              </Button>
              <Button variant="secondary" onClick={() => setIsAIModalOpen(true)} className="h-14">
                <IoSparkles className="w-5 h-5 mr-2" />
                Generar con IA
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {routines?.map((routine) => (
              <RoutineCard
                key={routine.id}
                routine={routine}
                onEdit={() => openEditRoutine(routine)}
                onDelete={() => openDeleteRoutine(routine)}
                onStart={() => handleStartWorkout(routine.id)}
              />
            ))}
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <Button onClick={() => setIsAddRoutineOpen(true)} className="flex-1 h-14" variant="secondary">
            <IoAddOutline className="w-5 h-5 mr-2" />
            Manual
          </Button>
          <Button onClick={() => setIsAIModalOpen(true)} className="flex-1 h-14" variant="primary">
            <IoSparkles className="w-5 h-5 mr-2" />
            IA Fit
          </Button>
        </div>

        {/* Edit Folder Modal */}
        <Modal isOpen={isEditFolderOpen} onClose={() => setIsEditFolderOpen(false)} title="Editar carpeta">
          <div className="space-y-4">
            <Input label="Nombre" placeholder="Ej: Push Pull Legs" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Color</label>
              <div className="flex gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button key={color} onClick={() => setNewFolderColor(color)} className={`w-10 h-10 rounded-full transition-transform ${newFolderColor === color ? 'scale-110 ring-2 ring-offset-2 ring-gray-400' : ''}`} style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Objetivo</label>
              <select value={newFolderGoal} onChange={(e) => setNewFolderGoal(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500">
                {GOAL_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>
            <Button onClick={handleEditFolder} className="w-full" disabled={!newFolderName.trim()}>Guardar cambios</Button>
          </div>
        </Modal>

        {/* Delete Folder Confirmation */}
        <Modal isOpen={isDeleteFolderOpen} onClose={() => setIsDeleteFolderOpen(false)} title="Eliminar carpeta" size="sm">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-2xl text-red-700 dark:text-red-400">
              <IoAlertCircleOutline className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Esta accion no se puede deshacer</p>
                <p className="text-sm text-red-600/80 dark:text-red-400/80">Se eliminaran todas las rutinas dentro de esta carpeta.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setIsDeleteFolderOpen(false)}>Cancelar</Button>
              <Button variant="danger" className="flex-1" onClick={handleDeleteFolder}>Eliminar</Button>
            </div>
          </div>
        </Modal>

        {/* Delete Routine Confirmation */}
        <Modal isOpen={isDeleteRoutineOpen} onClose={() => setIsDeleteRoutineOpen(false)} title="Eliminar rutina" size="sm">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-2xl text-red-700 dark:text-red-400">
              <IoAlertCircleOutline className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Eliminar "{selectedRoutine?.name}"?</p>
                <p className="text-sm text-red-600/80 dark:text-red-400/80">Esta accion no se puede deshacer.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setIsDeleteRoutineOpen(false)}>Cancelar</Button>
              <Button variant="danger" className="flex-1" onClick={handleDeleteRoutine}>Eliminar</Button>
            </div>
          </div>
        </Modal>

        {/* Add Routine Modal */}
        <AddRoutineModal isOpen={isAddRoutineOpen} onClose={() => setIsAddRoutineOpen(false)} folderId={selectedFolder.id} onSave={(routine) => addRoutine(routine, userId)} />

        {/* Edit Routine Modal */}
        {selectedRoutine && (
          <EditRoutineModal isOpen={isEditRoutineOpen} onClose={() => { setIsEditRoutineOpen(false); setSelectedRoutine(null); }} routine={selectedRoutine} onSave={(id, routine) => updateRoutine(id, routine, userId)} />
        )}

        {/* AI Generate Modal */}
        <AIGenerateModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} folderId={selectedFolder.id} folderGoal={selectedFolder.goal} onSave={(routine) => addRoutine(routine, userId)} userId={userId} />
      </div>
    );
  }

  // Folders view (default)
  return (
    <div className="px-5 py-8 space-y-8 animate-fadeIn">
      <header className="px-1 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Mis <span className="text-gradient">Metas</span></h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Organiza tu progreso por objetivos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAIPlanModalOpen(true)}
            className="p-3 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105 transition-all"
            title="Crear plan con IA"
          >
            <IoSparkles className="w-6 h-6" />
          </button>
          <button
            onClick={() => setIsLibraryManagementOpen(true)}
            className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-all"
            title="Gestionar biblioteca de ejercicios"
          >
            <IoLibraryOutline className="w-6 h-6" />
          </button>
        </div>
      </header>

      {folders.length === 0 ? (
        <Card className="text-center py-16 border-slate-200/60 dark:border-slate-700/60 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
          <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center mx-auto mb-8 ring-8 ring-violet-500/10">
            <IoSparkles className="w-12 h-12 text-violet-600 dark:text-violet-400" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Comienza tu viaje fitness</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-8 max-w-[260px] mx-auto">Deja que la IA cree tu plan personalizado o crea tus metas manualmente.</p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto px-6">
            <Button onClick={() => setIsAIPlanModalOpen(true)} className="h-14 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
              <IoSparkles className="w-5 h-5 mr-2" />
              Crear Plan con IA
            </Button>
            <Button variant="secondary" onClick={() => setIsAddFolderOpen(true)} className="h-14">
              <IoAddOutline className="w-5 h-5 mr-2" />
              Crear Manual
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {folders.map((folder) => {
            const routines = getRoutinesByFolder(folder.id);
            const routineCount = routines.length;
            return (
              <Card
                key={folder.id}
                className="group relative overflow-hidden border-slate-200/60 dark:border-slate-700/60 shadow-xl shadow-slate-200/50 dark:shadow-black/20 active-scale-98 transition-all duration-300 cursor-pointer"
                onClick={() => handleSelectFolder(folder)}
              >
                <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: folder.color }} />
                <Card.Body className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-5 min-w-0">
                      <div className="w-16 h-16 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500" style={{ backgroundColor: `${folder.color}20` }}>
                        <IoFolderOutline className="w-8 h-8" style={{ color: folder.color }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white truncate tracking-tight">{folder.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{routineCount} {routineCount === 1 ? 'Rutina' : 'Rutinas'}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">{folder.goal?.replace('_', ' ') || 'GENERAL'}</span>
                        </div>
                      </div>
                    </div>
                    <IoChevronForward className="w-6 h-6 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </Card.Body>
              </Card>
            );
          })}

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setIsAIPlanModalOpen(true)}
              className="flex flex-col items-center justify-center gap-2 p-6 rounded-3xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-2 border-dashed border-violet-300 dark:border-violet-700 hover:border-violet-500 hover:from-violet-500/20 hover:to-purple-500/20 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-all">
                <IoSparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-sm font-black text-violet-600 dark:text-violet-400">Crear con IA</span>
            </button>
            <button
              onClick={() => setIsAddFolderOpen(true)}
              className="flex flex-col items-center justify-center gap-2 p-6 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-slate-900/50 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-blue-500 transition-all">
                <IoAddOutline className="w-6 h-6 text-slate-400 group-hover:text-white" />
              </div>
              <span className="text-sm font-black text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300">Nueva Meta</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Folder Modal */}
      <Modal isOpen={isAddFolderOpen} onClose={() => { setIsAddFolderOpen(false); resetFolderForm(); }} title="Nueva Meta de Entrenamiento">
        <div className="space-y-6">
          <Input label="Nombre de la meta" placeholder="Ej: Ganar Masa Muscular" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} />
          <div>
            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-3 px-1 uppercase tracking-widest">Identificador Visual</label>
            <div className="flex flex-wrap gap-4 px-1">
              {FOLDER_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewFolderColor(color)}
                  className={`w-12 h-12 rounded-2xl transition-all duration-300 shadow-sm ${newFolderColor === color ? 'scale-125 ring-4 ring-blue-500 ring-offset-4 dark:ring-offset-slate-900' : 'hover:scale-110 opacity-70'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-3 px-1 uppercase tracking-widest">Objetivo Principal</label>
            <div className="grid grid-cols-2 gap-3">
              {GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setNewFolderGoal(opt.value)}
                  className={`p-4 rounded-2xl text-xs font-black uppercase tracking-tighter border-2 transition-all ${newFolderGoal === opt.value ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/25' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleAddFolder} className="w-full h-14" disabled={!newFolderName.trim()}>Crear Meta de Entrenamiento</Button>
        </div>
      </Modal>

      {/* Library Management Modal */}
      <LibraryManagementModal
        isOpen={isLibraryManagementOpen}
        onClose={() => setIsLibraryManagementOpen(false)}
        library={exerciseLibrary}
        onUpdate={updateExerciseInLibrary}
        onDelete={deleteExerciseFromLibrary}
        userId={userId}
      />

      {/* AI Complete Plan Modal */}
      <AICompletePlanModal
        isOpen={isAIPlanModalOpen}
        onClose={() => setIsAIPlanModalOpen(false)}
        onCreatePlan={handleCreateAIPlan}
        userId={userId}
      />
    </div>
  );
}

function ActiveSessionView({ session, userId, onUpdateExercise, onComplete, onCancel }) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [savedIndices, setSavedIndices] = useState(new Set());
  const { saveExerciseToLibrary } = useWorkoutStore();
  const librarySaved = savedIndices.has(currentExerciseIndex);

  useEffect(() => {
    let timer;
    if (showRestTimer && restTimeLeft > 0) {
      timer = setInterval(() => {
        setRestTimeLeft((prev) => {
          if (prev <= 1) {
            setShowRestTimer(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showRestTimer]);

  if (!session?.exercises || !session.exercises[currentExerciseIndex]) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-slate-950">
        <IoAlertCircleOutline className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Error de sesión</h2>
        <p className="text-slate-400 mb-6">No se pudieron cargar los ejercicios del entrenamiento.</p>
        <Button onClick={onCancel} variant="danger">Cancelar entrenamiento</Button>
      </div>
    );
  }

  const currentExercise = session.exercises[currentExerciseIndex];

  const handleSetComplete = (setIndex) => {
    onUpdateExercise(currentExerciseIndex, setIndex, { completed: true }, userId);
    // Trigger rest timer
    const restTime = currentExercise.restSeconds || 60;
    setRestTimeLeft(restTime);
    setShowRestTimer(true);
  };

  const handleSetUpdate = (setIndex, field, value) => {
    onUpdateExercise(currentExerciseIndex, setIndex, { [field]: value }, userId);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-5 py-10 animate-fadeIn">
      <header className="flex items-start justify-between mb-10 px-1">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white">{session.routineName}</h1>
          <p className="text-blue-400 text-xs font-bold flex items-center gap-1.5 uppercase tracking-widest mt-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
            Entrenamiento en Curso
          </p>
        </div>
        <button onClick={() => setShowCancelModal(true)} className="w-12 h-12 flex items-center justify-center bg-slate-900 rounded-2xl border border-slate-800 active:scale-95 transition-all">
          <IoClose className="w-7 h-7 text-slate-400" />
        </button>
      </header>

      <div className="flex gap-1.5 mb-10 px-1">
        {session.exercises.map((_, idx) => (
          <div
            key={idx}
            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${idx < currentExerciseIndex
              ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
              : idx === currentExerciseIndex
                ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]'
                : 'bg-slate-800'
              }`}
          />
        ))}
      </div>

      <Card className="bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden active-scale-98 transition-transform">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16" />

        <Card.Body className="p-8">
          <div className="mb-8">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h2 className="text-4xl font-black text-white leading-tight">{currentExercise.name}</h2>
              <button
                onClick={async () => {
                  await saveExerciseToLibrary({ name: currentExercise.name, muscleGroup: currentExercise.muscleGroup, unit: currentExercise.unit, restSeconds: currentExercise.restSeconds }, userId);
                  setSavedIndices(prev => new Set(prev).add(currentExerciseIndex));
                }}
                disabled={librarySaved}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${librarySaved ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 hover:bg-blue-900/40 hover:text-blue-400 border border-slate-700'}`}
              >
                <IoBookmarkOutline className="w-4 h-4" />
                {librarySaved ? 'Guardado' : 'Biblioteca'}
              </button>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full ring-1 ring-blue-500/20">
                {currentExercise.sets.length} Series
              </span>
              <span className="px-3 py-1 bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                Meta: {currentExercise.reps} Reps
              </span>
              {currentExercise.seriesType && currentExercise.seriesType !== 'simple' && (() => {
                const st = SERIES_TYPES.find(s => s.value === currentExercise.seriesType);
                return st ? (
                  <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${st.color}`}>
                    <IoLayers className="inline w-3 h-3 mr-1" />{st.label}
                  </span>
                ) : null;
              })()}
            </div>
          </div>

          <div className="space-y-4">
            {currentExercise.sets.map((set, setIndex) => (
              <div key={setIndex} className={`p-6 rounded-[2rem] transition-all duration-300 border ${set.completed ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700/50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Serie {setIndex + 1}</span>
                  {set.completed ? (
                    <div className="bg-emerald-500 rounded-full p-1 shadow-[0_0_12px_rgba(16,185,129,0.5)]">
                      <IoCheckmarkCircle className="w-7 h-7 text-white" />
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSetComplete(setIndex)}
                      className="text-xs font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Completar
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Carga</p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={set.weight}
                        onChange={(e) => handleSetUpdate(setIndex, 'weight', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-white font-black text-center focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        disabled={set.unit === 'barra'}
                      />
                      <select
                        value={set.unit}
                        onChange={(e) => handleSetUpdate(setIndex, 'unit', e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-2xl px-2 py-3 text-blue-400 font-bold text-center text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                        <option value="barra">—</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">Repeticiones</p>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={set.reps || currentExercise.reps}
                      onChange={(e) => handleSetUpdate(setIndex, 'reps', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-white font-black text-center focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 p-8 pb-safe bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
        <div className="max-w-lg mx-auto flex gap-4">
          <Button
            variant="ghost"
            onClick={() => setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1))}
            disabled={currentExerciseIndex === 0}
            className="flex-1 h-16 border-2 border-slate-800 text-slate-400"
          >
            Anterior
          </Button>
          {currentExerciseIndex < session.exercises.length - 1 ? (
            <Button onClick={() => setCurrentExerciseIndex(currentExerciseIndex + 1)} className="flex-[2] h-16 bg-blue-600 hover:bg-blue-500 text-white font-black">
              Siguiente Ejercicio
            </Button>
          ) : (
            <Button onClick={() => setShowFinishModal(true)} variant="success" className="flex-[2] h-16 premium-gradient">
              Finalizar Rutina
            </Button>
          )}
        </div>
      </div>

      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancelar entrenamiento" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600">Se perdera tu progreso actual. Estas seguro?</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowCancelModal(false)}>Continuar</Button>
            <Button variant="danger" className="flex-1" onClick={onCancel}>Cancelar</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showFinishModal} onClose={() => setShowFinishModal(false)} title="Finalizar entrenamiento" size="sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-2xl text-green-700">
            <IoCheckmarkCircle className="w-6 h-6" />
            <p className="font-semibold">Excelente trabajo!</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowFinishModal(false)}>Seguir</Button>
            <Button variant="success" className="flex-1" onClick={() => onComplete(userId, { rating: 5 })}>Finalizar</Button>
          </div>
        </div>
      </Modal>

      {/* Rest Timer Overlay */}
      {showRestTimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-slate-900 border border-blue-500/30 rounded-[3rem] p-10 text-center shadow-2xl shadow-blue-500/20">
            <IoTimeOutline className="w-16 h-16 text-blue-500 mx-auto mb-6 animate-pulse" />
            <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-2">Descansa</h3>
            <p className="text-7xl font-black text-white tracking-tighter mb-10">
              {Math.floor(restTimeLeft / 60)}:{(restTimeLeft % 60).toString().padStart(2, '0')}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => setRestTimeLeft(prev => prev + 30)}
                className="h-14 border-slate-700 text-slate-300"
              >
                +30s
              </Button>
              <Button
                onClick={() => setShowRestTimer(false)}
                className="h-14 bg-blue-600 hover:bg-blue-500"
              >
                Omitir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddRoutineModal({ isOpen, onClose, folderId, onSave }) {
  const { user } = useAuthStore();
  const { exerciseLibrary } = useWorkoutStore();
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState([{ name: '', sets: 3, reps: '10-12', weight: 0, unit: 'kg', muscleGroup: 'Pecho' }]);
  const [showLibrary, setShowLibrary] = useState(false);

  const handleAddExercise = () => setExercises([...exercises, { name: '', sets: 3, reps: '10-12', weight: 0, unit: 'kg', muscleGroup: 'Pecho' }]);

  const handleUpdateExercise = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  const handleSelectFromLibrary = (exercise) => {
    const newExercise = {
      name: exercise.name,
      sets: exercise.sets || 3,
      reps: exercise.reps || '10-12',
      weight: exercise.weight || 0,
      unit: exercise.unit || 'kg',
      muscleGroup: exercise.muscleGroup || 'Pecho',
      restSeconds: exercise.restSeconds || 60
    };
    setExercises([...exercises.filter(e => e.name !== ''), newExercise]);
    setShowLibrary(false);
  };

  const handleRemoveExercise = (index) => setExercises(exercises.filter((_, i) => i !== index));

  const { saveExerciseToLibrary } = useWorkoutStore();

  const handleSave = async () => {
    if (!name.trim() || exercises.some(e => !e.name.trim())) return;

    // Save unique exercises to library
    for (const exercise of exercises) {
      if (exercise.name.trim()) {
        await saveExerciseToLibrary({
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          unit: exercise.unit,
          restSeconds: exercise.restSeconds
        }, user?.uid);
      }
    }

    onSave({ folderId, name, exercises: exercises.map((e, i) => ({ ...e, order: i })) }, user?.uid);
    setName('');
    setExercises([{ name: '', sets: 3, reps: '10-12', weight: 0, unit: 'kg', muscleGroup: 'Pecho' }]);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Nueva rutina" size="lg">
        <div className="space-y-4">
          <Input label="Nombre de la rutina" placeholder="Ej: Push Day" value={name} onChange={(e) => setName(e.target.value)} />
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 px-1">Ejercicios</label>
              <button
                onClick={() => setShowLibrary(true)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                <IoLibraryOutline className="w-4 h-4" />
                Biblioteca
              </button>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {exercises.map((exercise, index) => (
                <div key={index} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <Input
                      placeholder="Nombre"
                      value={exercise.name}
                      onChange={(e) => handleUpdateExercise(index, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <select
                      value={exercise.muscleGroup}
                      onChange={(e) => handleUpdateExercise(index, 'muscleGroup', e.target.value)}
                      className="px-3 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm h-[56px] focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    >
                      {MUSCLE_GROUPS.map(mg => <option key={mg} value={mg}>{mg}</option>)}
                    </select>
                    {exercises.length > 1 && (
                      <button onClick={() => handleRemoveExercise(index)} className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors">
                        <IoTrashOutline className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <Input label="Series" type="number" value={exercise.sets} onChange={(e) => handleUpdateExercise(index, 'sets', parseInt(e.target.value) || 0)} />
                    <Input label="Reps" placeholder="10-12" value={exercise.reps} onChange={(e) => handleUpdateExercise(index, 'reps', e.target.value)} />
                    <Input label="Peso" type="number" value={exercise.weight} onChange={(e) => handleUpdateExercise(index, 'weight', parseFloat(e.target.value) || 0)} />
                    <Input label="Desc. (s)" type="number" value={exercise.restSeconds || 60} onChange={(e) => handleUpdateExercise(index, 'restSeconds', parseInt(e.target.value) || 0)} />
                    <div className="pt-7">
                      <select
                        value={exercise.unit || 'kg'}
                        onChange={(e) => handleUpdateExercise(index, 'unit', e.target.value)}
                        className="w-full px-2 py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm h-[56px] focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      >
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                        <option value="barra">—</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 self-center">Tipo:</span>
                    {SERIES_TYPES.map(st => (
                      <button key={st.value} type="button" onClick={() => handleUpdateExercise(index, 'seriesType', st.value)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${(exercise.seriesType || 'simple') === st.value ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" onClick={handleAddExercise} className="w-full mt-4 h-14 border-dashed border-2 border-slate-200 dark:border-slate-800">
              <IoAddOutline className="w-5 h-5 mr-1" />
              Agregar ejercicio manual
            </Button>
          </div>
          <Button onClick={handleSave} className="w-full h-16 premium-gradient mt-4">Guardar rutina</Button>
        </div>
      </Modal>

      <ExerciseLibraryModal
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        onSelect={handleSelectFromLibrary}
        library={exerciseLibrary}
      />
    </>
  );
}

function EditRoutineModal({ isOpen, onClose, routine, onSave }) {
  const { user } = useAuthStore();
  const { exerciseLibrary, saveExerciseToLibrary } = useWorkoutStore();
  const [name, setName] = useState(routine.name);
  const [exercises, setExercises] = useState(routine.exercises || []);
  const [showLibrary, setShowLibrary] = useState(false);

  const handleAddExercise = () => setExercises([...exercises, { name: '', sets: 3, reps: '10-12', weight: 0, unit: 'kg', muscleGroup: 'Pecho', restSeconds: 60 }]);

  const handleUpdateExercise = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  const handleSelectFromLibrary = (exercise) => {
    const newExercise = {
      name: exercise.name,
      sets: exercise.sets || 3,
      reps: exercise.reps || '10-12',
      weight: exercise.weight || 0,
      unit: exercise.unit || 'kg',
      muscleGroup: exercise.muscleGroup || 'Pecho',
      restSeconds: exercise.restSeconds || 60
    };
    setExercises([...exercises.filter(e => e.name !== ''), newExercise]);
    setShowLibrary(false);
  };

  const handleRemoveExercise = (index) => setExercises(exercises.filter((_, i) => i !== index));

  const handleSave = async () => {
    if (!name.trim() || exercises.some(e => !e.name.trim())) return;

    // Save unique exercises to library
    for (const exercise of exercises) {
      if (exercise.name.trim()) {
        await saveExerciseToLibrary({
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          unit: exercise.unit,
          restSeconds: exercise.restSeconds
        }, user?.uid);
      }
    }

    onSave(routine.id, { name, exercises: exercises.map((e, i) => ({ ...e, order: i })) }, user?.uid);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Editar rutina" size="lg">
        <div className="space-y-4">
          <Input label="Nombre de la rutina" placeholder="Ej: Push Day" value={name} onChange={(e) => setName(e.target.value)} />
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 px-1">Ejercicios</label>
              <button
                onClick={() => setShowLibrary(true)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                <IoLibraryOutline className="w-4 h-4" />
                Biblioteca
              </button>
            </div>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {exercises.map((exercise, index) => (
                <div key={index} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <Input
                      placeholder="Nombre"
                      value={exercise.name}
                      onChange={(e) => handleUpdateExercise(index, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <select
                      value={exercise.muscleGroup || 'Pecho'}
                      onChange={(e) => handleUpdateExercise(index, 'muscleGroup', e.target.value)}
                      className="px-3 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm h-[56px] focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    >
                      {MUSCLE_GROUPS.map(mg => <option key={mg} value={mg}>{mg}</option>)}
                    </select>
                    {exercises.length > 1 && (
                      <button onClick={() => handleRemoveExercise(index)} className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors">
                        <IoTrashOutline className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <Input label="Series" type="number" value={exercise.sets} onChange={(e) => handleUpdateExercise(index, 'sets', parseInt(e.target.value) || 0)} />
                    <Input label="Reps" placeholder="10-12" value={exercise.reps} onChange={(e) => handleUpdateExercise(index, 'reps', e.target.value)} />
                    <Input label="Peso" type="number" value={exercise.weight} onChange={(e) => handleUpdateExercise(index, 'weight', parseFloat(e.target.value) || 0)} />
                    <Input label="Desc. (s)" type="number" value={exercise.restSeconds || 60} onChange={(e) => handleUpdateExercise(index, 'restSeconds', parseInt(e.target.value) || 0)} />
                    <div className="pt-7">
                      <select
                        value={exercise.unit || 'kg'}
                        onChange={(e) => handleUpdateExercise(index, 'unit', e.target.value)}
                        className="w-full px-2 py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm h-[56px] focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                      >
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                        <option value="barra">—</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 self-center">Tipo:</span>
                    {SERIES_TYPES.map(st => (
                      <button key={st.value} type="button" onClick={() => handleUpdateExercise(index, 'seriesType', st.value)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all ${(exercise.seriesType || 'simple') === st.value ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" onClick={handleAddExercise} className="w-full mt-4 h-14 border-dashed border-2 border-slate-200 dark:border-slate-800">
              <IoAddOutline className="w-5 h-5 mr-1" />
              Agregar ejercicio manual
            </Button>
          </div>
          <Button onClick={handleSave} className="w-full h-16 premium-gradient mt-4">Guardar cambios</Button>
        </div>
      </Modal>

      <ExerciseLibraryModal
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        onSelect={handleSelectFromLibrary}
        library={exerciseLibrary}
      />
    </>
  );
}

function AIGenerateModal({ isOpen, onClose, folderId, folderGoal, onSave, userId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(['Mancuernas', 'Barra']);
  const [duration, setDuration] = useState(45);
  const [experience, setExperience] = useState('INTERMEDIATE');
  const [aiRoutine, setAiRoutine] = useState(null);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [error, setError] = useState(null);
  const [retryCountdown, setRetryCountdown] = useState(0);

  useEffect(() => {
    if (retryCountdown <= 0) return;
    const timer = setTimeout(() => setRetryCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [retryCountdown]);

  const toggleMuscle = (muscle) => setSelectedMuscles(prev => prev.includes(muscle) ? prev.filter(m => m !== muscle) : [...prev, muscle]);
  const toggleEquipment = (eq) => setSelectedEquipment(prev => prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq]);
  const toggleExercise = (idx) => setSelectedExercises(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);

  const handleGenerate = async () => {
    if (selectedMuscles.length === 0) {
      setError('Selecciona al menos un grupo muscular');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await getWorkoutRecommendation({ goal: folderGoal, experience, equipment: selectedEquipment, duration, focusMuscles: selectedMuscles });
      setAiRoutine(result);
      setSelectedExercises(result.exercises.map((_, i) => i)); // Select all by default
    } catch (err) {
      const msg = err.message || 'No se pudo generar la rutina. Verifica tu conexión e intenta de nuevo.';
      setError(msg);
      const secondsMatch = msg.match(/(\d+) segundos/);
      if (secondsMatch) setRetryCountdown(parseInt(secondsMatch[1]));
      console.error('AI Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRoutine = () => {
    if (!aiRoutine) return;
    onSave({
      folderId,
      name: aiRoutine.name,
      description: aiRoutine.description,
      exercises: aiRoutine.exercises
        .filter((_, i) => selectedExercises.includes(i))
        .map((e, i) => ({ 
          name: e.name, 
          muscleGroup: e.muscleGroup || selectedMuscles[0] || 'Full Body',
          sets: e.sets, 
          reps: e.reps, 
          weight: 0, 
          restSeconds: e.restSeconds, 
          notes: e.notes, 
          order: i 
        })),
      aiGenerated: true,
    }, userId);
    setAiRoutine(null);
    setSelectedMuscles([]);
    onClose();
  };

  const handleClose = () => {
    setAiRoutine(null);
    setError(null);
    setRetryCountdown(0);
    setSelectedMuscles([]);
    onClose();
  };

  if (aiRoutine) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Rutina generada" size="lg">
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/30 dark:to-sky-900/20 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <IoSparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-gray-900 dark:text-white">{aiRoutine.name}</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{aiRoutine.description}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Duracion estimada: {aiRoutine.estimatedDuration} min</p>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {aiRoutine.exercises.map((ex, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${selectedExercises.includes(idx) ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700' : 'bg-gray-50 dark:bg-slate-800 border-transparent opacity-60'}`}
                onClick={() => toggleExercise(idx)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-white">{ex.name}</p>
                    {ex.muscleGroup && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                        {ex.muscleGroup}
                      </span>
                    )}
                  </div>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${selectedExercises.includes(idx) ? 'bg-purple-600 border-purple-600' : 'border-gray-300 dark:border-slate-600'}`}>
                    {selectedExercises.includes(idx) && <IoCheckmarkCircle className="w-4 h-4 text-white" />}
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400">{ex.sets} series x {ex.reps} reps • {ex.restSeconds}s descanso</p>
                {ex.notes && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{ex.notes}</p>}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setAiRoutine(null); setSelectedExercises([]); }}>Regenerar</Button>
            <Button className="flex-1" onClick={handleSaveRoutine} disabled={selectedExercises.length === 0}>
              Guardar {selectedExercises.length} ejercicios
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Generar con IA" size="lg">
      <div className="space-y-4">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-xl border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">{retryCountdown > 0 ? '⏱' : error.includes('24 horas') ? '🚫' : '⚠️'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
                {retryCountdown > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 bg-red-200 dark:bg-red-800 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-red-500 dark:bg-red-400 rounded-full transition-all duration-1000" style={{ width: `${(retryCountdown / (retryCountdown + 1)) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-red-600 dark:text-red-300 tabular-nums whitespace-nowrap">{retryCountdown}s</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Grupos musculares</label>
          <div className="flex flex-wrap gap-2">
            {MUSCLE_GROUPS.map((muscle) => (
              <button key={muscle} onClick={() => toggleMuscle(muscle)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedMuscles.includes(muscle) ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}>{muscle}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Equipamiento</label>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT.map((eq) => (
              <button key={eq} onClick={() => toggleEquipment(eq)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedEquipment.includes(eq) ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}>{eq}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Duracion (min)</label>
            <select value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200">
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
              <option value={90}>90 min</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Experiencia</label>
            <select value={experience} onChange={(e) => setExperience(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200">
              <option value="BEGINNER">Principiante</option>
              <option value="INTERMEDIATE">Intermedio</option>
              <option value="ADVANCED">Avanzado</option>
            </select>
          </div>
        </div>
        <Button onClick={handleGenerate} className="w-full" loading={isLoading} disabled={isLoading || retryCountdown > 0}>
          <IoSparkles className="w-5 h-5 mr-2" />
          {isLoading ? 'Generando...' : 'Generar rutina'}
        </Button>
      </div>
    </Modal>
  );
}
function RoutineCard({ routine, onEdit, onDelete, onStart }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [savedToLib, setSavedToLib] = useState({});
  const [addAllStatus, setAddAllStatus] = useState(null); // null | 'saving' | { added: number, skipped: number }
  const { saveExerciseToLibrary, exerciseLibrary } = useWorkoutStore();
  const { user } = useAuthStore();

  const handleSaveToLibrary = async (ex, idx) => {
    await saveExerciseToLibrary({
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      unit: ex.unit,
      restSeconds: ex.restSeconds,
      sets: ex.sets,
      reps: ex.reps,
    }, user?.uid);
    setSavedToLib(prev => ({ ...prev, [idx]: true }));
  };

  const handleAddAllToLibrary = async () => {
    if (!routine.exercises?.length) return;
    
    setAddAllStatus('saving');
    let added = 0;
    let skipped = 0;
    
    for (let idx = 0; idx < routine.exercises.length; idx++) {
      const ex = routine.exercises[idx];
      const exists = exerciseLibrary.some(e => e.name.toLowerCase() === ex.name.toLowerCase());
      
      if (!exists) {
        await saveExerciseToLibrary({
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          unit: ex.unit,
          restSeconds: ex.restSeconds,
          sets: ex.sets,
          reps: ex.reps,
        }, user?.uid);
        added++;
        setSavedToLib(prev => ({ ...prev, [idx]: true }));
      } else {
        skipped++;
        setSavedToLib(prev => ({ ...prev, [idx]: true }));
      }
    }
    
    setAddAllStatus({ added, skipped });
    
    // Clear status after 3 seconds
    setTimeout(() => setAddAllStatus(null), 3000);
  };

  return (
    <Card className="p-4 border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden group">
      <Card.Body className="p-0">
        <div className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-white truncate tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{routine.name}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                {routine.exercises?.length || 0} EJERCICIOS
                {routine.lastPerformed && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span>ULTIMO: {new Date(routine.lastPerformed).toLocaleDateString('es-ES')}</span>
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all active:scale-95"
              >
                <IoCreateOutline className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-600 transition-all active:scale-95"
              >
                <IoTrashOutline className="w-5 h-5" />
              </button>
              <button
                onClick={onStart}
                className="w-12 h-12 rounded-2xl premium-gradient flex items-center justify-center text-white shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
              >
                <IoPlayCircle className="w-7 h-7" />
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors"
          >
            <span>{isExpanded ? 'Ocultar ejercicios' : 'Ver ejercicios'}</span>
            <IoChevronForward className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {isExpanded && (
          <div className="bg-slate-50/50 dark:bg-slate-900/50 p-6 space-y-3 animate-fadeIn border-t border-slate-100 dark:border-slate-800">
            {/* Add All to Library Button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/50 dark:border-slate-700/50 mb-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {routine.exercises?.length || 0} ejercicios en esta rutina
              </p>
              <button
                onClick={handleAddAllToLibrary}
                disabled={addAllStatus === 'saving' || (addAllStatus && typeof addAllStatus === 'object')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  addAllStatus === 'saving' 
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 cursor-wait'
                    : addAllStatus && typeof addAllStatus === 'object'
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50 active:scale-95'
                }`}
              >
                <IoBookmarkOutline className="w-4 h-4" />
                {addAllStatus === 'saving' 
                  ? 'Guardando...' 
                  : addAllStatus && typeof addAllStatus === 'object'
                    ? `${addAllStatus.added} añadidos${addAllStatus.skipped > 0 ? ` · ${addAllStatus.skipped} ya existían` : ''}`
                    : 'Añadir todos a biblioteca'
                }
              </button>
            </div>

            {routine.exercises?.map((ex, idx) => {
              const st = SERIES_TYPES.find(s => s.value === (ex.seriesType || 'simple'));
              return (
                <div key={idx} className="flex items-center justify-between group/ex p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 flex-shrink-0 group-hover/ex:bg-blue-500 transition-colors" />
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200 truncate">{ex.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{ex.sets} series × {ex.reps} reps</p>
                        {st && st.value !== 'simple' && (
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide ${st.color}`}>
                            {st.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSaveToLibrary(ex, idx)}
                    disabled={savedToLib[idx]}
                    className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${savedToLib[idx] ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 opacity-0 group-hover/ex:opacity-100'}`}
                  >
                    <IoBookmarkOutline className="w-3.5 h-3.5" />
                    {savedToLib[idx] ? 'Guardado' : 'Biblioteca'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

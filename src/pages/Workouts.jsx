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
  IoBookOutline
} from 'react-icons/io5';
import { Card, Button, Input, Modal, Badge } from '@/components/ui';
import { useWorkoutStore, useAuthStore, MUSCLE_GROUPS } from '@/stores';
import { getWorkoutRecommendation } from '@/config/gemini';

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

function ExerciseLibraryModal({ isOpen, onClose, onSelect, library }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLibrary = library.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.muscleGroup && e.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Biblioteca de Ejercicios" size="md">
      <div className="space-y-4">
        <div className="relative">
          <IoSearchOutline className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar ejercicio o músculo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {filteredLibrary.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <IoBookOutline className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium text-sm">No se encontraron ejercicios</p>
            </div>
          ) : (
            filteredLibrary.map((exercise, idx) => (
              <button
                key={idx}
                onClick={() => onSelect(exercise)}
                className="w-full p-4 flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5 transition-all group text-left"
              >
                <div>
                  <p className="font-black text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {exercise.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px] uppercase font-black px-2 py-0.5">
                      {exercise.muscleGroup || 'Pecho'}
                    </Badge>
                  </div>
                </div>
                <IoAddOutline className="w-6 h-6 text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </button>
            ))
          )}
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
    exerciseLibrary
  } = useWorkoutStore();

  if (activeSession) {
    return (
      <ActiveSessionView
        session={activeSession}
        userId={userId}
        onUpdateExercise={updateSessionExercise}
        onComplete={completeSession}
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
              <p className="text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                {routines.length} {routines.length === 1 ? 'Rutina' : 'Rutinas'} • {selectedFolder.goal.replace('_', ' ')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={openEditFolder} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 transition-colors">
              <IoCreateOutline className="w-5 h-5" />
            </button>
            <button onClick={() => setIsDeleteFolderOpen(true)} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-rose-600 transition-colors">
              <IoTrashOutline className="w-5 h-5" />
            </button>
          </div>
        </header>

        {routines.length === 0 ? (
          <Card className="text-center py-16 border-none shadow-xl shadow-slate-200/50 dark:shadow-black/20">
            <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-6 ring-4 ring-indigo-500/5">
              <IoBarbell className="w-10 h-10 text-indigo-500" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Sin rutinas todavia</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 max-w-[200px] mx-auto">Comienza agregando una rutina manual o usa nuestra IA.</p>
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
            {routines.map((routine) => (
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
              <div className="flex gap-2">
                {FOLDER_COLORS.map((color) => (
                  <button key={color} onClick={() => setNewFolderColor(color)} className={`w-10 h-10 rounded-full transition-transform ${newFolderColor === color ? 'scale-110 ring-2 ring-offset-2 ring-gray-400' : ''}`} style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Objetivo</label>
              <select value={newFolderGoal} onChange={(e) => setNewFolderGoal(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500">
                {GOAL_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
              </select>
            </div>
            <Button onClick={handleEditFolder} className="w-full" disabled={!newFolderName.trim()}>Guardar cambios</Button>
          </div>
        </Modal>

        {/* Delete Folder Confirmation */}
        <Modal isOpen={isDeleteFolderOpen} onClose={() => setIsDeleteFolderOpen(false)} title="Eliminar carpeta" size="sm">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-2xl text-red-700">
              <IoAlertCircleOutline className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Esta accion no se puede deshacer</p>
                <p className="text-sm text-red-600/80">Se eliminaran todas las rutinas dentro de esta carpeta.</p>
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
            <div className="flex items-start gap-3 p-3 bg-red-50 rounded-2xl text-red-700">
              <IoAlertCircleOutline className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Eliminar "{selectedRoutine?.name}"?</p>
                <p className="text-sm text-red-600/80">Esta accion no se puede deshacer.</p>
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
      <header className="px-1">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Mis <span className="text-gradient">Metas</span></h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Organiza tu progreso por objetivos</p>
      </header>

      {folders.length === 0 ? (
        <Card className="text-center py-20 border-none shadow-xl shadow-slate-200/50 dark:shadow-black/20">
          <div className="w-24 h-24 rounded-[2.5rem] bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mx-auto mb-8 ring-8 ring-indigo-500/5">
            <IoFolderOutline className="w-12 h-12 text-indigo-500" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Comienza tu viaje</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 max-w-[220px] mx-auto">Crea carpetas para organizar tus diferentes metas de entrenamiento.</p>
          <Button onClick={() => setIsAddFolderOpen(true)} className="px-10 h-14">
            <IoAddOutline className="w-6 h-6 mr-2" />
            Nueva Meta
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {folders.map((folder) => {
            const routines = getRoutinesByFolder(folder.id);
            const routineCount = routines.length;
            return (
              <Card
                key={folder.id}
                className="group relative overflow-hidden border-none shadow-xl shadow-slate-200/50 dark:shadow-black/20 active-scale-98 transition-all duration-300 cursor-pointer"
                onClick={() => handleSelectFolder(folder)}
              >
                <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: folder.color }} />
                <Card.Body className="p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-5 min-w-0">
                      <div className="w-16 h-16 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500" style={{ backgroundColor: `${folder.color}15` }}>
                        <IoFolderOutline className="w-8 h-8" style={{ color: folder.color }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white truncate tracking-tight">{folder.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{routineCount} {routineCount === 1 ? 'Rutina' : 'Rutinas'}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{folder.goal.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                    <IoChevronForward className="w-6 h-6 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </Card.Body>
              </Card>
            );
          })}

          <button
            onClick={() => setIsAddFolderOpen(true)}
            className="flex items-center justify-center gap-3 p-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all duration-300 group"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all">
              <IoAddOutline className="w-7 h-7 text-slate-400 group-hover:text-white" />
            </div>
            <span className="text-lg font-black text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">Nueva Meta</span>
          </button>
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
                  className={`w-12 h-12 rounded-2xl transition-all duration-300 shadow-sm ${newFolderColor === color ? 'scale-125 ring-4 ring-indigo-500 ring-offset-4 dark:ring-offset-slate-900' : 'hover:scale-110 opacity-70'}`}
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
                  className={`p-4 rounded-2xl text-xs font-black uppercase tracking-tighter border-2 transition-all ${newFolderGoal === opt.value ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 dark:text-slate-400'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={handleAddFolder} className="w-full h-14" disabled={!newFolderName.trim()}>Crear Meta de Entrenamiento</Button>
        </div>
      </Modal>
    </div>
  );
}

function ActiveSessionView({ session, userId, onUpdateExercise, onComplete, onCancel }) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const currentExercise = session.exercises[currentExerciseIndex];

  useEffect(() => {
    let timer;
    if (showRestTimer && restTimeLeft > 0) {
      timer = setInterval(() => {
        setRestTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (restTimeLeft === 0) {
      setShowRestTimer(false);
    }
    return () => clearInterval(timer);
  }, [showRestTimer, restTimeLeft]);

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
          <p className="text-indigo-400 text-xs font-bold flex items-center gap-1.5 uppercase tracking-widest mt-1">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
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
                ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                : 'bg-slate-800'
              }`}
          />
        ))}
      </div>

      <Card className="bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden active-scale-98 transition-transform">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16" />

        <Card.Body className="p-8">
          <div className="mb-8">
            <h2 className="text-4xl font-black text-white mb-2 leading-tight">{currentExercise.name}</h2>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full ring-1 ring-indigo-500/20">
                {currentExercise.sets.length} Series
              </span>
              <span className="px-3 py-1 bg-slate-800 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                Meta: {currentExercise.reps} Reps
              </span>
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
                      className="text-xs font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
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
                        className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-white font-black text-center focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        disabled={set.unit === 'barra'}
                      />
                      <select
                        value={set.unit}
                        onChange={(e) => handleSetUpdate(setIndex, 'unit', e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-2xl px-2 py-3 text-indigo-400 font-bold text-center text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
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
                      type="number"
                      value={set.reps || currentExercise.reps}
                      onChange={(e) => handleSetUpdate(setIndex, 'reps', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-white font-black text-center focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
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
            <Button onClick={() => setCurrentExerciseIndex(currentExerciseIndex + 1)} className="flex-[2] h-16 bg-white text-slate-950 hover:bg-slate-100">
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
          <div className="w-full max-w-sm bg-slate-900 border border-indigo-500/30 rounded-[3rem] p-10 text-center shadow-2xl shadow-indigo-500/20">
            <IoTimeOutline className="w-16 h-16 text-indigo-500 mx-auto mb-6 animate-pulse" />
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
                className="h-14 bg-indigo-600 hover:bg-indigo-500"
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
                className="text-xs font-bold text-indigo-500 flex items-center gap-1 hover:text-indigo-600 transition-colors"
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
                      className="px-3 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm h-[56px] focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
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
                        className="w-full px-2 py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm h-[56px] focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                      >
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                        <option value="barra">—</option>
                      </select>
                    </div>
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
                className="text-xs font-bold text-indigo-500 flex items-center gap-1 hover:text-indigo-600 transition-colors"
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
                      className="px-3 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm h-[56px] focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
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
                        className="w-full px-2 py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm h-[56px] focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                      >
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                        <option value="barra">—</option>
                      </select>
                    </div>
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
      setError('No se pudo generar la rutina. Verifica tu conexion e intenta de nuevo.');
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
        .map((e, i) => ({ name: e.name, sets: e.sets, reps: e.reps, weight: 0, restSeconds: e.restSeconds, notes: e.notes, order: i })),
      aiGenerated: true,
    }, userId);
    setAiRoutine(null);
    setSelectedMuscles([]);
    onClose();
  };

  const handleClose = () => {
    setAiRoutine(null);
    setError(null);
    setSelectedMuscles([]);
    onClose();
  };

  if (aiRoutine) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Rutina generada" size="lg">
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <IoSparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-gray-900">{aiRoutine.name}</h3>
            </div>
            <p className="text-sm text-gray-600">{aiRoutine.description}</p>
            <p className="text-xs text-gray-500 mt-2">Duracion estimada: {aiRoutine.estimatedDuration} min</p>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {aiRoutine.exercises.map((ex, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${selectedExercises.includes(idx) ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-transparent opacity-60'}`}
                onClick={() => toggleExercise(idx)}
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{ex.name}</p>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${selectedExercises.includes(idx) ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                    {selectedExercises.includes(idx) && <IoCheckmarkCircle className="w-4 h-4 text-white" />}
                  </div>
                </div>
                <p className="text-sm text-gray-500">{ex.sets} series x {ex.reps} reps • {ex.restSeconds}s descanso</p>
                {ex.notes && <p className="text-xs text-gray-400 mt-1">{ex.notes}</p>}
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
        {error && <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Grupos musculares</label>
          <div className="flex flex-wrap gap-2">
            {MUSCLE_GROUPS.map((muscle) => (
              <button key={muscle} onClick={() => toggleMuscle(muscle)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedMuscles.includes(muscle) ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{muscle}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Equipamiento</label>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT.map((eq) => (
              <button key={eq} onClick={() => toggleEquipment(eq)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedEquipment.includes(eq) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{eq}</button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duracion (min)</label>
            <select value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white">
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
              <option value={90}>90 min</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Experiencia</label>
            <select value={experience} onChange={(e) => setExperience(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white">
              <option value="BEGINNER">Principiante</option>
              <option value="INTERMEDIATE">Intermedio</option>
              <option value="ADVANCED">Avanzado</option>
            </select>
          </div>
        </div>
        <Button onClick={handleGenerate} className="w-full" loading={isLoading} disabled={isLoading}>
          <IoSparkles className="w-5 h-5 mr-2" />
          {isLoading ? 'Generando...' : 'Generar rutina'}
        </Button>
      </div>
    </Modal>
  );
}
function RoutineCard({ routine, onEdit, onDelete, onStart }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="p-4 border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden group">
      <Card.Body className="p-0">
        <div className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-white truncate tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{routine.name}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 flex items-center gap-2">
                {routine.exercises?.length || 0} EJERCICIOS
                {routine.lastPerformed && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                    <span>ULTIMO: {new Date(routine.lastPerformed).toLocaleDateString('es-ES')}</span>
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all active:scale-95"
              >
                <IoCreateOutline className="w-5 h-5" />
              </button>
              <button
                onClick={onStart}
                className="w-12 h-12 rounded-2xl premium-gradient flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 active:scale-95 transition-all"
              >
                <IoPlayCircle className="w-7 h-7" />
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-500 transition-colors"
          >
            <span>{isExpanded ? 'Ocultar ejercicios' : 'Ver ejercicios'}</span>
            <IoChevronForward className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {isExpanded && (
          <div className="bg-slate-50/50 dark:bg-slate-900/50 p-6 space-y-4 animate-fadeIn border-t border-slate-100 dark:border-slate-800">
            {routine.exercises.map((ex, idx) => (
              <div key={idx} className="flex items-center justify-between group/ex">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/50 group-hover/ex:bg-indigo-500 transition-colors" />
                  <div>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">{ex.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{ex.sets} series x {ex.reps} reps</p>
                  </div>
                </div>
                {/* Individual start button for exercise */}
                <button
                  onClick={() => onStart()} // For now just starts the routine, but shows intent
                  className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 opacity-0 group-hover/ex:opacity-100 transition-all hover:bg-indigo-100"
                >
                  Entrenar
                </button>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

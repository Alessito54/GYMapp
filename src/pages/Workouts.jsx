import { useState } from 'react';
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
  IoAlertCircleOutline
} from 'react-icons/io5';
import { Card, Button, Input, Modal } from '@/components/ui';
import { useWorkoutStore } from '@/stores';
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

const MUSCLE_GROUPS = [
  'Pecho', 'Espalda', 'Hombros', 'Biceps', 'Triceps', 'Piernas', 'Core', 'Gluteos'
];

const EQUIPMENT = [
  'Mancuernas', 'Barra', 'Maquinas', 'Poleas', 'Peso corporal', 'Bandas elasticas'
];

export default function Workouts() {
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
    cancelSession
  } = useWorkoutStore();

  if (activeSession) {
    return (
      <ActiveSessionView
        session={activeSession}
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
    });
    resetFolderForm();
    setIsAddFolderOpen(false);
  };

  const handleEditFolder = () => {
    if (!newFolderName.trim() || !selectedFolder) return;
    updateFolder(selectedFolder.id, {
      name: newFolderName,
      color: newFolderColor,
      goal: newFolderGoal,
    });
    setSelectedFolder({ ...selectedFolder, name: newFolderName, color: newFolderColor, goal: newFolderGoal });
    resetFolderForm();
    setIsEditFolderOpen(false);
  };

  const handleDeleteFolder = () => {
    if (!selectedFolder) return;
    deleteFolder(selectedFolder.id);
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
    startSession(routineId);
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
    deleteRoutine(selectedRoutine.id);
    setSelectedRoutine(null);
    setIsDeleteRoutineOpen(false);
  };

  // Routines view
  if (view === 'routines' && selectedFolder) {
    const routines = getRoutinesByFolder(selectedFolder.id);

    return (
      <div className="px-4 py-6 space-y-6 animate-fadeIn">
        <header className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setView('folders')}
              className="p-2 -ml-2 hover:bg-gray-100 active:bg-gray-200 rounded-xl transition-colors"
            >
              <IoChevronForward className="w-5 h-5 transform rotate-180 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedFolder.name}</h1>
              <p className="text-gray-500 text-sm">{routines.length} rutinas</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={openEditFolder} className="w-10 h-10">
              <IoCreateOutline className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsDeleteFolderOpen(true)} className="w-10 h-10 text-red-500">
              <IoTrashOutline className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {routines.length === 0 ? (
          <Card className="text-center py-12 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <IoBarbell className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-gray-500 mb-4">No hay rutinas en esta carpeta</p>
            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              <Button onClick={() => setIsAddRoutineOpen(true)}>
                <IoAddOutline className="w-5 h-5 mr-2" />
                Crear rutina
              </Button>
              <Button variant="outline" onClick={() => setIsAIModalOpen(true)}>
                <IoSparkles className="w-5 h-5 mr-2" />
                Generar con IA
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {routines.map((routine) => (
              <Card key={routine.id} className="overflow-hidden shadow-sm">
                <Card.Body>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 mr-3">
                      <h3 className="font-semibold text-gray-900 truncate">{routine.name}</h3>
                      <p className="text-sm text-gray-500">
                        {routine.exercises?.length || 0} ejercicios
                        {routine.lastPerformed && (
                          <span className="block sm:inline sm:ml-2 text-xs">
                            Ultimo: {new Date(routine.lastPerformed).toLocaleDateString('es-ES')}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditRoutine(routine)} className="w-9 h-9">
                        <IoCreateOutline className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteRoutine(routine)} className="w-9 h-9 text-red-500">
                        <IoTrashOutline className="w-4 h-4" />
                      </Button>
                      <Button onClick={() => handleStartWorkout(routine.id)} size="sm" className="flex-shrink-0">
                        <IoPlayCircle className="w-5 h-5 sm:mr-1" />
                        <span className="hidden sm:inline">Iniciar</span>
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <Button onClick={() => setIsAddRoutineOpen(true)} className="flex-1" variant="outline">
            <IoAddOutline className="w-5 h-5 mr-2" />
            Nueva rutina
          </Button>
          <Button onClick={() => setIsAIModalOpen(true)} className="flex-1" variant="secondary">
            <IoSparkles className="w-5 h-5 mr-2" />
            IA
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
        <AddRoutineModal isOpen={isAddRoutineOpen} onClose={() => setIsAddRoutineOpen(false)} folderId={selectedFolder.id} onSave={addRoutine} />

        {/* Edit Routine Modal */}
        {selectedRoutine && (
          <EditRoutineModal isOpen={isEditRoutineOpen} onClose={() => { setIsEditRoutineOpen(false); setSelectedRoutine(null); }} routine={selectedRoutine} onSave={updateRoutine} />
        )}

        {/* AI Generate Modal */}
        <AIGenerateModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} folderId={selectedFolder.id} folderGoal={selectedFolder.goal} onSave={addRoutine} />
      </div>
    );
  }

  // Folders view (default)
  return (
    <div className="px-4 py-6 space-y-6 animate-fadeIn">
      <header className="pt-2">
        <div className="flex items-center gap-2">
          <IoBarbell className="w-6 h-6 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Entrenamientos</h1>
        </div>
        <p className="text-gray-500 text-sm mt-0.5">Organiza tus rutinas en carpetas</p>
      </header>

      {folders.length === 0 ? (
        <Card className="text-center py-12 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <IoFolderOutline className="w-8 h-8 text-blue-500" />
          </div>
          <p className="text-gray-500 mb-4">Crea tu primera carpeta de rutinas</p>
          <Button onClick={() => setIsAddFolderOpen(true)}>
            <IoAddOutline className="w-5 h-5 mr-2" />
            Nueva carpeta
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {folders.map((folder) => {
            const routineCount = getRoutinesByFolder(folder.id).length;
            return (
              <Card key={folder.id} className="cursor-pointer hover:shadow-lg active-scale-95 transition-all duration-200" onClick={() => handleSelectFolder(folder)}>
                <Card.Body className="text-center py-5">
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-sm" style={{ backgroundColor: `${folder.color}15` }}>
                    <IoFolderOutline className="w-7 h-7" style={{ color: folder.color }} />
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate text-sm">{folder.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{routineCount} rutinas</p>
                </Card.Body>
              </Card>
            );
          })}
          <Card className="cursor-pointer hover:shadow-md active-scale-95 transition-all duration-200 border-2 border-dashed border-gray-200 bg-gray-50/50" onClick={() => setIsAddFolderOpen(true)}>
            <Card.Body className="text-center flex flex-col items-center justify-center h-full py-8">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-2">
                <IoAddOutline className="w-6 h-6 text-gray-400" />
              </div>
              <span className="text-gray-500 text-sm font-medium">Nueva</span>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Add Folder Modal */}
      <Modal isOpen={isAddFolderOpen} onClose={() => { setIsAddFolderOpen(false); resetFolderForm(); }} title="Nueva carpeta">
        <div className="space-y-4">
          <Input label="Nombre de la carpeta" placeholder="Ej: Push Pull Legs" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} />
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
          <Button onClick={handleAddFolder} className="w-full" disabled={!newFolderName.trim()}>Crear carpeta</Button>
        </div>
      </Modal>
    </div>
  );
}

function ActiveSessionView({ session, onUpdateExercise, onComplete, onCancel }) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const currentExercise = session.exercises[currentExerciseIndex];

  const handleSetComplete = (setIndex) => {
    onUpdateExercise(currentExerciseIndex, setIndex, { completed: true });
  };

  const handleSetUpdate = (setIndex, field, value) => {
    onUpdateExercise(currentExerciseIndex, setIndex, { [field]: value });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">{session.routineName}</h1>
          <p className="text-gray-400 text-sm flex items-center gap-1">
            <IoTimeOutline className="w-4 h-4" />
            En progreso
          </p>
        </div>
        <button onClick={() => setShowCancelModal(true)} className="p-2 hover:bg-gray-800 rounded-lg">
          <IoClose className="w-6 h-6" />
        </button>
      </header>

      <div className="flex gap-1 mb-6">
        {session.exercises.map((_, idx) => (
          <div key={idx} className={`h-1 flex-1 rounded-full ${idx < currentExerciseIndex ? 'bg-green-500' : idx === currentExerciseIndex ? 'bg-blue-500' : 'bg-gray-700'}`} />
        ))}
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <Card.Body>
          <h2 className="text-2xl font-bold mb-2">{currentExercise.name}</h2>
          <p className="text-gray-400 mb-6">{currentExercise.sets.length} series x {currentExercise.reps} reps</p>

          <div className="space-y-3">
            {currentExercise.sets.map((set, setIndex) => (
              <div key={setIndex} className={`p-4 rounded-xl ${set.completed ? 'bg-green-900/30' : 'bg-gray-700'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">Serie {setIndex + 1}</span>
                  {set.completed ? (
                    <IoCheckmarkCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <Button size="sm" onClick={() => handleSetComplete(setIndex)}>Completar</Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500">Peso (kg)</label>
                    <input type="number" value={set.weight} onChange={(e) => handleSetUpdate(setIndex, 'weight', parseFloat(e.target.value) || 0)} className="w-full bg-gray-600 rounded-lg px-3 py-2 text-white" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Reps</label>
                    <input type="number" value={set.reps || currentExercise.reps} onChange={(e) => handleSetUpdate(setIndex, 'reps', parseInt(e.target.value) || 0)} className="w-full bg-gray-600 rounded-lg px-3 py-2 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      <div className="flex gap-4 mt-6">
        <Button variant="secondary" onClick={() => setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1))} disabled={currentExerciseIndex === 0} className="flex-1">Anterior</Button>
        {currentExerciseIndex < session.exercises.length - 1 ? (
          <Button onClick={() => setCurrentExerciseIndex(currentExerciseIndex + 1)} className="flex-1">Siguiente</Button>
        ) : (
          <Button onClick={() => setShowFinishModal(true)} variant="success" className="flex-1">Finalizar</Button>
        )}
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
            <Button variant="success" className="flex-1" onClick={() => onComplete({ rating: 5 })}>Finalizar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function AddRoutineModal({ isOpen, onClose, folderId, onSave }) {
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState([{ name: '', sets: 3, reps: '10-12', weight: 0 }]);

  const handleAddExercise = () => setExercises([...exercises, { name: '', sets: 3, reps: '10-12', weight: 0 }]);
  const handleUpdateExercise = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };
  const handleRemoveExercise = (index) => setExercises(exercises.filter((_, i) => i !== index));
  const handleSave = () => {
    if (!name.trim() || exercises.some(e => !e.name.trim())) return;
    onSave({ folderId, name, exercises: exercises.map((e, i) => ({ ...e, order: i })) });
    setName('');
    setExercises([{ name: '', sets: 3, reps: '10-12', weight: 0 }]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva rutina" size="lg">
      <div className="space-y-4">
        <Input label="Nombre de la rutina" placeholder="Ej: Push Day" value={name} onChange={(e) => setName(e.target.value)} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ejercicios</label>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {exercises.map((exercise, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Input placeholder="Nombre del ejercicio" value={exercise.name} onChange={(e) => handleUpdateExercise(index, 'name', e.target.value)} className="flex-1" />
                  {exercises.length > 1 && (
                    <button onClick={() => handleRemoveExercise(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                      <IoTrashOutline className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input type="number" placeholder="Series" value={exercise.sets} onChange={(e) => handleUpdateExercise(index, 'sets', parseInt(e.target.value) || 0)} />
                  <Input placeholder="Reps" value={exercise.reps} onChange={(e) => handleUpdateExercise(index, 'reps', e.target.value)} />
                  <Input type="number" placeholder="Peso" value={exercise.weight} onChange={(e) => handleUpdateExercise(index, 'weight', parseFloat(e.target.value) || 0)} />
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" onClick={handleAddExercise} className="w-full mt-2">
            <IoAddOutline className="w-5 h-5 mr-1" />
            Agregar ejercicio
          </Button>
        </div>
        <Button onClick={handleSave} className="w-full">Guardar rutina</Button>
      </div>
    </Modal>
  );
}

function EditRoutineModal({ isOpen, onClose, routine, onSave }) {
  const [name, setName] = useState(routine.name);
  const [exercises, setExercises] = useState(routine.exercises || []);

  const handleAddExercise = () => setExercises([...exercises, { name: '', sets: 3, reps: '10-12', weight: 0 }]);
  const handleUpdateExercise = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };
  const handleRemoveExercise = (index) => setExercises(exercises.filter((_, i) => i !== index));
  const handleSave = () => {
    if (!name.trim() || exercises.some(e => !e.name.trim())) return;
    onSave(routine.id, { name, exercises: exercises.map((e, i) => ({ ...e, order: i })) });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar rutina" size="lg">
      <div className="space-y-4">
        <Input label="Nombre de la rutina" placeholder="Ej: Push Day" value={name} onChange={(e) => setName(e.target.value)} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ejercicios</label>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {exercises.map((exercise, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Input placeholder="Nombre del ejercicio" value={exercise.name} onChange={(e) => handleUpdateExercise(index, 'name', e.target.value)} className="flex-1" />
                  {exercises.length > 1 && (
                    <button onClick={() => handleRemoveExercise(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                      <IoTrashOutline className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input type="number" placeholder="Series" value={exercise.sets} onChange={(e) => handleUpdateExercise(index, 'sets', parseInt(e.target.value) || 0)} />
                  <Input placeholder="Reps" value={exercise.reps} onChange={(e) => handleUpdateExercise(index, 'reps', e.target.value)} />
                  <Input type="number" placeholder="Peso" value={exercise.weight} onChange={(e) => handleUpdateExercise(index, 'weight', parseFloat(e.target.value) || 0)} />
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" onClick={handleAddExercise} className="w-full mt-2">
            <IoAddOutline className="w-5 h-5 mr-1" />
            Agregar ejercicio
          </Button>
        </div>
        <Button onClick={handleSave} className="w-full">Guardar cambios</Button>
      </div>
    </Modal>
  );
}

function AIGenerateModal({ isOpen, onClose, folderId, folderGoal, onSave }) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(['Mancuernas', 'Barra']);
  const [duration, setDuration] = useState(45);
  const [experience, setExperience] = useState('INTERMEDIATE');
  const [aiRoutine, setAiRoutine] = useState(null);
  const [error, setError] = useState(null);

  const toggleMuscle = (muscle) => setSelectedMuscles(prev => prev.includes(muscle) ? prev.filter(m => m !== muscle) : [...prev, muscle]);
  const toggleEquipment = (eq) => setSelectedEquipment(prev => prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq]);

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
      exercises: aiRoutine.exercises.map((e, i) => ({ name: e.name, sets: e.sets, reps: e.reps, weight: 0, restSeconds: e.restSeconds, notes: e.notes, order: i })),
      aiGenerated: true,
    });
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
              <div key={idx} className="p-3 bg-gray-50 rounded-xl">
                <p className="font-medium text-gray-900">{ex.name}</p>
                <p className="text-sm text-gray-500">{ex.sets} series x {ex.reps} reps • {ex.restSeconds}s descanso</p>
                {ex.notes && <p className="text-xs text-gray-400 mt-1">{ex.notes}</p>}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setAiRoutine(null)}>Regenerar</Button>
            <Button className="flex-1" onClick={handleSaveRoutine}>Guardar rutina</Button>
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

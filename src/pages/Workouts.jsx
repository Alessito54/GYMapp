import { useState } from 'react';
import { 
  IoAddOutline,
  IoFolderOutline,
  IoChevronForward,
  IoPlayCircle,
  IoTimeOutline,
  IoBarbell,
  IoCheckmarkCircle,
  IoClose
} from 'react-icons/io5';
import { Card, Button, Input, Modal } from '@/components/ui';
import { useWorkoutStore } from '@/stores';

const GOAL_OPTIONS = [
  { value: 'MUSCLE_GAIN', label: 'Ganancia muscular' },
  { value: 'WEIGHT_LOSS', label: 'Perdida de peso' },
  { value: 'STRENGTH', label: 'Fuerza' },
  { value: 'ENDURANCE', label: 'Resistencia' },
];

const FOLDER_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'
];

export default function Workouts() {
  const [view, setView] = useState('folders'); // folders, routines, session
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isAddFolderOpen, setIsAddFolderOpen] = useState(false);
  const [isAddRoutineOpen, setIsAddRoutineOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  const [newFolderGoal, setNewFolderGoal] = useState('MUSCLE_GAIN');

  const { 
    folders, 
    addFolder, 
    getRoutinesByFolder,
    addRoutine,
    startSession,
    activeSession,
    updateSessionExercise,
    completeSession,
    cancelSession
  } = useWorkoutStore();

  // Active Session View
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
    setNewFolderName('');
    setIsAddFolderOpen(false);
  };

  const handleSelectFolder = (folder) => {
    setSelectedFolder(folder);
    setView('routines');
  };

  const handleStartWorkout = (routineId) => {
    startSession(routineId);
  };

  // Routines view
  if (view === 'routines' && selectedFolder) {
    const routines = getRoutinesByFolder(selectedFolder.id);
    
    return (
      <div className="px-4 py-6 space-y-6 animate-fadeIn">
        <header className="flex items-center gap-3 pt-2">
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
        </header>

        {routines.length === 0 ? (
          <Card className="text-center py-12 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <IoBarbell className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-gray-500 mb-4">No hay rutinas en esta carpeta</p>
            <Button onClick={() => setIsAddRoutineOpen(true)}>
              <IoAddOutline className="w-5 h-5 mr-2" />
              Crear rutina
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {routines.map((routine) => (
              <Card key={routine.id} className="overflow-hidden shadow-sm active:scale-98 transition-transform">
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
                    <Button 
                      onClick={() => handleStartWorkout(routine.id)}
                      size="sm"
                      className="flex-shrink-0"
                    >
                      <IoPlayCircle className="w-5 h-5 sm:mr-1" />
                      <span className="hidden sm:inline">Iniciar</span>
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}

        <Button 
          onClick={() => setIsAddRoutineOpen(true)}
          className="w-full"
          variant="outline"
        >
          <IoAddOutline className="w-5 h-5 mr-2" />
          Nueva rutina
        </Button>

        {/* Add Routine Modal */}
        <AddRoutineModal 
          isOpen={isAddRoutineOpen}
          onClose={() => setIsAddRoutineOpen(false)}
          folderId={selectedFolder.id}
          onSave={addRoutine}
        />
      </div>
    );
  }

  // Folders view (default)
  return (
    <div className="px-4 py-6 space-y-6 animate-fadeIn">
      <header className="pt-2">
        <h1 className="text-2xl font-bold text-gray-900">Entrenamientos 🏋️</h1>
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
              <Card 
                key={folder.id}
                className="cursor-pointer hover:shadow-lg active:scale-95 transition-all duration-200"
                onClick={() => handleSelectFolder(folder)}
              >
                <Card.Body className="text-center py-5">
                  <div 
                    className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: `${folder.color}15` }}
                  >
                    <IoFolderOutline 
                      className="w-7 h-7" 
                      style={{ color: folder.color }}
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900 truncate text-sm">{folder.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{routineCount} rutinas</p>
                </Card.Body>
              </Card>
            );
          })}
          
          {/* Add folder button */}
          <Card 
            className="cursor-pointer hover:shadow-md active:scale-95 transition-all duration-200 border-2 border-dashed border-gray-200 bg-gray-50/50"
            onClick={() => setIsAddFolderOpen(true)}
          >
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
      <Modal
        isOpen={isAddFolderOpen}
        onClose={() => setIsAddFolderOpen(false)}
        title="Nueva carpeta"
      >
        <div className="space-y-4">
          <Input
            label="Nombre de la carpeta"
            placeholder="Ej: Push Pull Legs"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
            <div className="flex gap-2">
              {FOLDER_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewFolderColor(color)}
                  className={`w-10 h-10 rounded-full transition-transform ${
                    newFolderColor === color ? 'scale-110 ring-2 ring-offset-2 ring-gray-400' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Objetivo</label>
            <select
              value={newFolderGoal}
              onChange={(e) => setNewFolderGoal(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white"
            >
              {GOAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <Button onClick={handleAddFolder} className="w-full" disabled={!newFolderName.trim()}>
            Crear carpeta
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// Active Session Component
function ActiveSessionView({ session, onUpdateExercise, onComplete, onCancel }) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const currentExercise = session.exercises[currentExerciseIndex];

  const handleSetComplete = (setIndex) => {
    onUpdateExercise(currentExerciseIndex, setIndex, { completed: true });
  };

  const handleFinish = () => {
    if (confirm('Finalizar entrenamiento?')) {
      onComplete({ rating: 5 });
    }
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
        <button 
          onClick={() => confirm('Cancelar entrenamiento?') && onCancel()}
          className="p-2 hover:bg-gray-800 rounded-lg"
        >
          <IoClose className="w-6 h-6" />
        </button>
      </header>

      {/* Exercise Progress */}
      <div className="flex gap-1 mb-6">
        {session.exercises.map((_, idx) => (
          <div 
            key={idx}
            className={`h-1 flex-1 rounded-full ${
              idx < currentExerciseIndex ? 'bg-green-500' :
              idx === currentExerciseIndex ? 'bg-blue-500' :
              'bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Current Exercise */}
      <Card className="bg-gray-800 border-gray-700">
        <Card.Body>
          <h2 className="text-2xl font-bold mb-2">{currentExercise.name}</h2>
          <p className="text-gray-400 mb-6">
            {currentExercise.sets.length} series x {currentExercise.reps} reps
          </p>

          {/* Sets */}
          <div className="space-y-3">
            {currentExercise.sets.map((set, setIndex) => (
              <div 
                key={setIndex}
                className={`flex items-center justify-between p-4 rounded-xl ${
                  set.completed ? 'bg-green-900/30' : 'bg-gray-700'
                }`}
              >
                <span className="text-gray-400">Serie {setIndex + 1}</span>
                <div className="flex items-center gap-4">
                  <span>{set.weight} kg x {set.reps || currentExercise.reps}</span>
                  {set.completed ? (
                    <IoCheckmarkCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <Button 
                      size="sm" 
                      onClick={() => handleSetComplete(setIndex)}
                    >
                      Completar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Navigation */}
      <div className="flex gap-4 mt-6">
        <Button 
          variant="secondary"
          onClick={() => setCurrentExerciseIndex(Math.max(0, currentExerciseIndex - 1))}
          disabled={currentExerciseIndex === 0}
          className="flex-1"
        >
          Anterior
        </Button>
        {currentExerciseIndex < session.exercises.length - 1 ? (
          <Button 
            onClick={() => setCurrentExerciseIndex(currentExerciseIndex + 1)}
            className="flex-1"
          >
            Siguiente
          </Button>
        ) : (
          <Button 
            onClick={handleFinish}
            variant="success"
            className="flex-1"
          >
            Finalizar
          </Button>
        )}
      </div>
    </div>
  );
}

// Add Routine Modal Component
function AddRoutineModal({ isOpen, onClose, folderId, onSave }) {
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState([
    { name: '', sets: 3, reps: '10-12', weight: 0 }
  ]);

  const handleAddExercise = () => {
    setExercises([...exercises, { name: '', sets: 3, reps: '10-12', weight: 0 }]);
  };

  const handleUpdateExercise = (index, field, value) => {
    const updated = [...exercises];
    updated[index][field] = value;
    setExercises(updated);
  };

  const handleRemoveExercise = (index) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim() || exercises.some(e => !e.name.trim())) return;
    
    onSave({
      folderId,
      name,
      exercises: exercises.map((e, i) => ({ ...e, order: i })),
    });
    
    setName('');
    setExercises([{ name: '', sets: 3, reps: '10-12', weight: 0 }]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva rutina" size="lg">
      <div className="space-y-4">
        <Input
          label="Nombre de la rutina"
          placeholder="Ej: Push Day"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ejercicios</label>
          <div className="space-y-3">
            {exercises.map((exercise, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Nombre del ejercicio"
                    value={exercise.name}
                    onChange={(e) => handleUpdateExercise(index, 'name', e.target.value)}
                    className="flex-1"
                  />
                  {exercises.length > 1 && (
                    <button
                      onClick={() => handleRemoveExercise(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <IoClose className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    placeholder="Series"
                    value={exercise.sets}
                    onChange={(e) => handleUpdateExercise(index, 'sets', parseInt(e.target.value) || 0)}
                  />
                  <Input
                    placeholder="Reps"
                    value={exercise.reps}
                    onChange={(e) => handleUpdateExercise(index, 'reps', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Peso (kg)"
                    value={exercise.weight}
                    onChange={(e) => handleUpdateExercise(index, 'weight', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <Button 
            variant="ghost" 
            onClick={handleAddExercise}
            className="w-full mt-2"
          >
            <IoAddOutline className="w-5 h-5 mr-1" />
            Agregar ejercicio
          </Button>
        </div>

        <Button onClick={handleSave} className="w-full">
          Guardar rutina
        </Button>
      </div>
    </Modal>
  );
}

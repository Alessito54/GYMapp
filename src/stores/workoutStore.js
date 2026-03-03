import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWorkoutStore = create(
  persist(
    (set, get) => ({
      folders: [],
      routines: [],
      sessions: [],
      activeSession: null,

      // Folders
      addFolder: (folder) => {
        set((state) => ({
          folders: [
            ...state.folders,
            { ...folder, id: Date.now().toString(), createdAt: new Date().toISOString() },
          ],
        }));
      },

      updateFolder: (folderId, updates) => {
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === folderId ? { ...f, ...updates } : f
          ),
        }));
      },

      deleteFolder: (folderId) => {
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== folderId),
          routines: state.routines.filter((r) => r.folderId !== folderId),
        }));
      },

      // Routines
      addRoutine: (routine) => {
        set((state) => ({
          routines: [
            ...state.routines,
            { 
              ...routine, 
              id: Date.now().toString(), 
              createdAt: new Date().toISOString(),
              lastPerformed: null,
            },
          ],
        }));
      },

      updateRoutine: (routineId, updates) => {
        set((state) => ({
          routines: state.routines.map((r) =>
            r.id === routineId ? { ...r, ...updates } : r
          ),
        }));
      },

      deleteRoutine: (routineId) => {
        set((state) => ({
          routines: state.routines.filter((r) => r.id !== routineId),
        }));
      },

      getRoutinesByFolder: (folderId) => {
        return get().routines.filter((r) => r.folderId === folderId);
      },

      // Sessions
      startSession: (routineId) => {
        const routine = get().routines.find((r) => r.id === routineId);
        if (!routine) return null;

        const session = {
          id: Date.now().toString(),
          routineId,
          routineName: routine.name,
          startTime: new Date().toISOString(),
          exercises: routine.exercises.map((ex) => ({
            ...ex,
            sets: Array(ex.sets).fill().map(() => ({
              reps: 0,
              weight: ex.weight || 0,
              completed: false,
            })),
          })),
          status: 'active',
        };

        set({ activeSession: session });
        return session;
      },

      updateSessionExercise: (exerciseIndex, setIndex, updates) => {
        set((state) => {
          if (!state.activeSession) return state;

          const exercises = [...state.activeSession.exercises];
          exercises[exerciseIndex].sets[setIndex] = {
            ...exercises[exerciseIndex].sets[setIndex],
            ...updates,
          };

          return {
            activeSession: { ...state.activeSession, exercises },
          };
        });
      },

      completeSession: (feedback = {}) => {
        const { activeSession } = get();
        if (!activeSession) return null;

        const endTime = new Date().toISOString();
        const startTime = new Date(activeSession.startTime);
        const duration = Math.round((new Date(endTime) - startTime) / 1000 / 60);

        const completedSession = {
          ...activeSession,
          endTime,
          duration,
          status: 'completed',
          ...feedback,
        };

        set((state) => ({
          sessions: [...state.sessions, completedSession],
          activeSession: null,
          routines: state.routines.map((r) =>
            r.id === activeSession.routineId
              ? { ...r, lastPerformed: endTime }
              : r
          ),
        }));

        return completedSession;
      },

      cancelSession: () => {
        set({ activeSession: null });
      },

      getRecentSessions: (limit = 10) => {
        return get()
          .sessions
          .slice(-limit)
          .reverse();
      },

      getSessionsByDateRange: (startDate, endDate) => {
        return get().sessions.filter((s) => {
          const date = new Date(s.startTime);
          return date >= new Date(startDate) && date <= new Date(endDate);
        });
      },
    }),
    {
      name: 'workout-storage',
    }
  )
);

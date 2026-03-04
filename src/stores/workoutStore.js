import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, getDoc, setDoc, collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export const MUSCLE_GROUPS = [
  'Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps',
  'Piernas', 'Glúteos', 'Abdominales', 'Cardio', 'Full Body'
];

export const useWorkoutStore = create(
  persist(
    (set, get) => ({
      folders: [],
      routines: [],
      sessions: [],
      activeSession: null,
      exerciseLibrary: [],

      // Helper to clean data for Firebase (removes undefined)
      _clean: (obj) => {
        if (!obj) return obj;
        return JSON.parse(JSON.stringify(obj));
      },

      // Sync Global Config (Folders, Routines, Library)
      saveGlobalToFirebase: async (userId) => {
        if (!userId) return;
        const { folders, routines, exerciseLibrary } = get();
        try {
          await setDoc(doc(db, 'users', userId, 'data', 'workout_config'), get()._clean({
            folders,
            routines,
            exerciseLibrary: exerciseLibrary || [],
            lastSynced: new Date().toISOString()
          }));
        } catch (e) {
          console.error('Error saving workout config:', e);
        }
      },

      // Sync Session (Granular)
      saveSessionToFirebase: async (userId, session) => {
        if (!userId || !session) return;
        try {
          await setDoc(doc(db, 'users', userId, 'sessions', session.id), get()._clean({
            ...session,
            lastUpdated: new Date().toISOString()
          }));
        } catch (e) {
          console.error('Error saving session:', e);
        }
      },

      loadFromFirebase: async (userId) => {
        if (!userId) return;
        try {
          console.log('Loading workout data from Firebase...');

          // Load Config - Always set state from Firebase (source of truth)
          const configSnap = await getDoc(doc(db, 'users', userId, 'data', 'workout_config'));
          const data = configSnap.exists() ? configSnap.data() : {};

          // Always overwrite local state with Firebase data
          set({
            folders: data.folders || [],
            routines: data.routines || [],
            exerciseLibrary: data.exerciseLibrary || []
          });

          // Load Active Session (from sessions subcollection where status is active)
          const sessionsRef = collection(db, 'users', userId, 'sessions');
          const activeQuery = query(sessionsRef, where('status', '==', 'active'));
          const activeSnap = await getDocs(activeQuery);

          if (!activeSnap.empty) {
            set({ activeSession: activeSnap.docs[0].data() });
          } else {
            set({ activeSession: null });
          }

          // Load Recent Sessions for history
          const recentQuery = query(sessionsRef, where('status', '==', 'completed'));
          const recentSnap = await getDocs(recentQuery);
          const loadedSessions = recentSnap.docs.map(d => d.data());
          set({ sessions: loadedSessions });

          console.log('Workout data loaded successfully');
        } catch (e) {
          console.error('Error loading workout data:', e);
        }
      },

      addFolder: async (folder, userId) => {
        const newFolder = { ...folder, id: Date.now().toString(), createdAt: new Date().toISOString() };
        set((state) => ({
          folders: [...state.folders, newFolder],
        }));
        if (userId) await get().saveGlobalToFirebase(userId);
      },

      updateFolder: async (folderId, updates, userId) => {
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === folderId ? { ...f, ...updates } : f
          ),
        }));
        if (userId) await get().saveGlobalToFirebase(userId);
      },

      deleteFolder: async (folderId, userId) => {
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== folderId),
          routines: state.routines.filter((r) => r.folderId !== folderId),
        }));
        if (userId) await get().saveGlobalToFirebase(userId);
      },

      addRoutine: async (routine, userId) => {
        const newRoutine = {
          ...routine,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          lastPerformed: null,
        };
        set((state) => ({
          routines: [...state.routines, newRoutine],
        }));
        if (userId) await get().saveGlobalToFirebase(userId);
      },

      updateRoutine: async (routineId, updates, userId) => {
        set((state) => ({
          routines: state.routines.map((r) =>
            r.id === routineId ? { ...r, ...updates } : r
          ),
        }));
        if (userId) await get().saveGlobalToFirebase(userId);
      },

      deleteRoutine: async (routineId, userId) => {
        set((state) => ({
          routines: state.routines.filter((r) => r.id !== routineId),
        }));
        if (userId) await get().saveGlobalToFirebase(userId);
      },

      completeSession: async (userId, feedback = {}) => {
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

        set((state) => {
          let updatedRoutines = state.routines;

          if (feedback.updateBaseRoutine) {
            updatedRoutines = updatedRoutines.map((r) => {
              if (r.id === activeSession.routineId) {
                return {
                  ...r,
                  lastPerformed: endTime,
                  exercises: completedSession.exercises.map(ex => ({
                    ...ex,
                    sets: ex.sets.length,
                    reps: ex.sets[0]?.reps || 10,
                  }))
                };
              }
              return r;
            });
          } else {
            updatedRoutines = updatedRoutines.map((r) =>
              r.id === activeSession.routineId
                ? { ...r, lastPerformed: endTime }
                : r
            );
          }

          return {
            sessions: [...state.sessions, completedSession],
            activeSession: null,
            routines: updatedRoutines,
          };
        });

        if (userId) {
          await get().saveSessionToFirebase(userId, completedSession);
          await get().saveGlobalToFirebase(userId);
        }
        return completedSession;
      },

      deleteSession: async (sessionId, userId) => {
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== sessionId),
        }));
        if (userId) {
          try {
            await deleteDoc(doc(db, 'users', userId, 'sessions', sessionId));
          } catch (e) {
            console.error('Error deleting session:', e);
          }
        }
      },

      saveExerciseToLibrary: async (exercise, userId) => {
        const { exerciseLibrary } = get();
        if (exerciseLibrary.some(e => e.name.toLowerCase() === exercise.name.toLowerCase())) return;

        set((state) => ({
          exerciseLibrary: [...(state.exerciseLibrary || []), { ...exercise, id: Date.now().toString() }]
        }));
        if (userId) await get().saveGlobalToFirebase(userId);
      },

      updateExerciseInLibrary: async (exerciseId, updates, userId) => {
        set((state) => ({
          exerciseLibrary: state.exerciseLibrary.map(e =>
            e.id === exerciseId ? { ...e, ...updates } : e
          )
        }));
        if (userId) await get().saveGlobalToFirebase(userId);
      },

      deleteExerciseFromLibrary: async (exerciseId, userId) => {
        set((state) => ({
          exerciseLibrary: state.exerciseLibrary.filter(e => e.id !== exerciseId)
        }));
        if (userId) await get().saveGlobalToFirebase(userId);
      },

      cancelSession: async (userId) => {
        const session = get().activeSession;
        set({ activeSession: null });
        // Delete the active session from Firebase so it doesn't reload
        if (userId && session?.id) {
          try {
            await deleteDoc(doc(db, 'users', userId, 'sessions', session.id));
          } catch (e) {
            console.error('Error deleting cancelled session:', e);
          }
        }
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

      getRoutinesByFolder: (folderId) => {
        return get().routines.filter((r) => r.folderId === folderId);
      },

      startSession: async (routineId, userId) => {
        const routine = get().routines.find((r) => r.id === routineId);
        if (!routine) return null;

        const startTime = new Date().toISOString();
        const newSession = {
          id: Date.now().toString(),
          routineId,
          routineName: routine.name,
          startTime,
          endTime: null,
          status: 'active',
          exercises: routine.exercises.map((ex) => ({
            ...ex,
            restSeconds: ex.restSeconds || 60,
            sets: Array(ex.sets).fill().map(() => ({
              reps: '',
              weight: '',
              unit: ex.unit || 'kg',
              completed: false,
            })),
          })),
        };

        set({ activeSession: newSession });
        if (userId) await get().saveSessionToFirebase(userId, newSession);
        return newSession;
      },

      updateSessionExercise: async (exerciseIndex, setIndex, updates, userId) => {
        const { activeSession } = get();
        if (!activeSession) return;

        const updatedSession = { ...activeSession };
        updatedSession.exercises[exerciseIndex].sets[setIndex] = {
          ...updatedSession.exercises[exerciseIndex].sets[setIndex],
          ...updates
        };

        set({ activeSession: updatedSession });
        if (userId) await get().saveSessionToFirebase(userId, updatedSession);
      },

      addExerciseToActiveSession: async (exercise, insertIndex, userId) => {
        const { activeSession } = get();
        if (!activeSession) return;

        const updatedSession = { ...activeSession };
        const newEx = {
          ...exercise,
          restSeconds: exercise.restSeconds || 60,
          sets: Array(exercise.sets || 3).fill().map(() => ({
            reps: '',
            weight: '',
            unit: exercise.unit || 'kg',
            completed: false,
          })),
        };

        if (insertIndex !== undefined) {
          updatedSession.exercises.splice(insertIndex, 0, newEx);
        } else {
          updatedSession.exercises.push(newEx);
        }

        set({ activeSession: updatedSession });
        if (userId) await get().saveSessionToFirebase(userId, updatedSession);
      },

      removeExerciseFromActiveSession: async (exerciseIndex, userId) => {
        const { activeSession } = get();
        if (!activeSession) return;

        const updatedSession = { ...activeSession };
        updatedSession.exercises.splice(exerciseIndex, 1);

        set({ activeSession: updatedSession });
        if (userId) await get().saveSessionToFirebase(userId, updatedSession);
      },

      replaceExerciseInActiveSession: async (exerciseIndex, newExercise, userId) => {
        const { activeSession } = get();
        if (!activeSession) return;

        const updatedSession = { ...activeSession };
        updatedSession.exercises[exerciseIndex] = {
          ...newExercise,
          restSeconds: newExercise.restSeconds || 60,
          sets: Array(newExercise.sets || 3).fill().map(() => ({
            reps: '',
            weight: '',
            unit: newExercise.unit || 'kg',
            completed: false,
          })),
        };

        set({ activeSession: updatedSession });
        if (userId) await get().saveSessionToFirebase(userId, updatedSession);
      },

    }),
    {
      name: 'workout-storage',
      version: 2,
      migrate: (persistedState, version) => {
        if (version < 2) {
          return {
            folders: [],
            routines: [],
            sessions: [],
            activeSession: null,
            exerciseLibrary: []
          };
        }
        return persistedState;
      },
      // Don't persist activeSession — it comes from Firebase only
      // This prevents stale cancelled sessions from reappearing on reload
      partialize: (state) => ({
        folders: state.folders,
        routines: state.routines,
        sessions: state.sessions,
        exerciseLibrary: state.exerciseLibrary,
      }),
    }
  )
);

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

const getTodayKey = () => new Date().toISOString().split('T')[0];

export const useWaterStore = create(
  persist(
    (set, get) => ({
      targetMl: 2500,
      glassSize: 250,
      logs: {}, // { '2026-03-02': { entries: [], total: 0 } }

      // Sync Config (Global)
      saveConfigToFirebase: async (userId) => {
        if (!userId) return;
        const { targetMl, glassSize } = get();
        try {
          await setDoc(doc(db, 'users', userId, 'data', 'water_config'), {
            targetMl,
            glassSize,
            lastSynced: new Date().toISOString()
          });
        } catch (e) {
          console.error('Error saving water config:', e);
        }
      },

      // Sync Day Logs (Granular)
      saveDayToFirebase: async (userId, date, dayLog) => {
        if (!userId || !date) return;
        try {
          await setDoc(doc(db, 'users', userId, 'water', date), {
            ...dayLog,
            lastUpdated: new Date().toISOString()
          });
        } catch (e) {
          console.error('Error saving daily water log:', e);
        }
      },

      loadFromFirebase: async (userId) => {
        if (!userId) return;
        try {
          console.log('Loading water data from Firebase...');

          // Load Config
          const configSnap = await getDoc(doc(db, 'users', userId, 'data', 'water_config'));
          if (configSnap.exists()) {
            const data = configSnap.data();
            set({
              targetMl: data.targetMl || 2500,
              glassSize: data.glassSize || 250,
            });
          }

          // Load Today's Logs
          const today = getTodayKey();
          const todaySnap = await getDoc(doc(db, 'users', userId, 'water', today));
          if (todaySnap.exists()) {
            const data = todaySnap.data();
            set((state) => ({
              logs: { ...state.logs, [today]: { entries: data.entries || [], total: data.total || 0 } }
            }));
          }

          console.log('Water data loaded successfully');
        } catch (e) {
          console.error('Error loading water data:', e);
        }
      },

      setTarget: async (targetMl, userId) => {
        set({ targetMl });
        if (userId) await get().saveConfigToFirebase(userId);
      },
      setGlassSize: async (glassSize, userId) => {
        set({ glassSize });
        if (userId) await get().saveConfigToFirebase(userId);
      },

      addWater: async (userId, ml = null) => {
        const today = getTodayKey();
        const amount = ml || get().glassSize;
        const time = new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        });

        let updatedLog;
        set((state) => {
          const todayLog = state.logs[today] || { entries: [], total: 0 };
          updatedLog = {
            entries: [...todayLog.entries, { time, ml: amount }],
            total: todayLog.total + amount,
          };
          return {
            logs: {
              ...state.logs,
              [today]: updatedLog,
            },
          };
        });
        if (userId) await get().saveDayToFirebase(userId, today, updatedLog);
      },

      removeLastEntry: async (userId) => {
        const today = getTodayKey();
        let updatedLog;
        set((state) => {
          const todayLog = state.logs[today];
          if (!todayLog || todayLog.entries.length === 0) return state;

          const entries = todayLog.entries.slice(0, -1);
          const total = entries.reduce((sum, e) => sum + e.ml, 0);

          updatedLog = { entries, total };
          return {
            logs: {
              ...state.logs,
              [today]: updatedLog,
            },
          };
        });
        if (userId && updatedLog) await get().saveDayToFirebase(userId, today, updatedLog);
      },

      getTodayProgress: () => {
        const { logs, targetMl } = get();
        const today = getTodayKey();
        const todayLog = logs[today] || { entries: [], total: 0 };

        return {
          consumed: todayLog.total,
          target: targetMl,
          progress: Math.min(todayLog.total / targetMl, 1),
          remaining: Math.max(targetMl - todayLog.total, 0),
          entries: todayLog.entries,
        };
      },

      getWeekProgress: () => {
        const { logs, targetMl } = get();
        const result = [];

        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const key = date.toISOString().split('T')[0];
          const dayLog = logs[key] || { total: 0 };

          result.push({
            date: key,
            day: date.toLocaleDateString('es-ES', { weekday: 'short' }),
            total: dayLog.total,
            progress: dayLog.total / targetMl,
          });
        }

        return result;
      },
    }),
    {
      name: 'water-storage',
    }
  )
);

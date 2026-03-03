import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const getTodayKey = () => new Date().toISOString().split('T')[0];

export const useWaterStore = create(
  persist(
    (set, get) => ({
      targetMl: 2500,
      glassSize: 250,
      logs: {}, // { '2026-03-02': { entries: [], total: 0 } }

      setTarget: (targetMl) => set({ targetMl }),
      setGlassSize: (glassSize) => set({ glassSize }),

      addWater: (ml = null) => {
        const today = getTodayKey();
        const amount = ml || get().glassSize;
        const time = new Date().toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });

        set((state) => {
          const todayLog = state.logs[today] || { entries: [], total: 0 };
          return {
            logs: {
              ...state.logs,
              [today]: {
                entries: [...todayLog.entries, { time, ml: amount }],
                total: todayLog.total + amount,
              },
            },
          };
        });
      },

      removeLastEntry: () => {
        const today = getTodayKey();
        set((state) => {
          const todayLog = state.logs[today];
          if (!todayLog || todayLog.entries.length === 0) return state;

          const entries = todayLog.entries.slice(0, -1);
          const total = entries.reduce((sum, e) => sum + e.ml, 0);

          return {
            logs: {
              ...state.logs,
              [today]: { entries, total },
            },
          };
        });
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

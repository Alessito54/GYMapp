import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export const useUserStore = create(
  persist(
    (set, get) => ({
      profile: null,
      darkMode: false,
      weightHistory: [],
      settings: {
        waterReminder: { enabled: true, intervalMinutes: 60 },
        units: { weight: 'kg', height: 'cm' },
        notifications: { push: true, email: false },
      },

      // Helper to clean data for Firebase (removes undefined)
      _clean: (obj) => {
        if (!obj) return obj;
        const clean = JSON.parse(JSON.stringify(obj));
        return clean;
      },

      setDarkMode: async (enabled, userId) => {
        set({ darkMode: enabled });
        if (enabled) {
          document.documentElement.classList.add('dark');
          document.documentElement.style.colorScheme = 'dark';
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.style.colorScheme = 'light';
        }
        if (userId) {
          try {
            await setDoc(doc(db, 'users', userId), get()._clean({ darkMode: enabled }), { merge: true });
          } catch (e) {
            console.error('Error saving dark mode:', e);
          }
        }
      },

      toggleDarkMode: async (userId) => {
        const newValue = !get().darkMode;
        set({ darkMode: newValue });
        if (newValue) {
          document.documentElement.classList.add('dark');
          document.documentElement.style.colorScheme = 'dark';
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.style.colorScheme = 'light';
        }
        if (userId) {
          try {
            await setDoc(doc(db, 'users', userId), get()._clean({ darkMode: newValue }), { merge: true });
          } catch (e) {
            console.error('Error toggling dark mode:', e);
          }
        }
      },

      setProfile: async (profile, userId) => {
        set({ profile });
        if (userId) {
          try {
            await setDoc(doc(db, 'users', userId), get()._clean({ profile }), { merge: true });
          } catch (e) {
            console.error('Error saving profile:', e);
          }
        }
      },

      updateProfile: async (updates, userId) => {
        set((state) => ({
          profile: { ...state.profile, ...updates },
        }));
        if (userId) {
          try {
            await updateDoc(doc(db, 'users', userId), get()._clean({
              'profile': { ...get().profile, ...updates }
            }));
          } catch (e) {
            console.error('Error updating profile:', e);
          }
        }
      },

      updateSettings: async (updates, userId) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
        if (userId) {
          try {
            await updateDoc(doc(db, 'users', userId), get()._clean({
              'settings': { ...get().settings, ...updates }
            }));
          } catch (e) {
            console.error('Error updating settings:', e);
          }
        }
      },

      // Weight tracking
      addWeightEntry: async (entry, userId) => {
        const newEntry = {
          ...entry,
          id: Date.now().toString(),
          date: entry.date || new Date().toISOString().split('T')[0],
        };
        set((state) => ({
          weightHistory: [...(state.weightHistory || []), newEntry].sort((a, b) => 
            new Date(a.date) - new Date(b.date)
          ),
        }));
        if (userId) {
          try {
            await setDoc(doc(db, 'users', userId), get()._clean({ 
              weightHistory: get().weightHistory 
            }), { merge: true });
          } catch (e) {
            console.error('Error saving weight entry:', e);
          }
        }
      },

      deleteWeightEntry: async (entryId, userId) => {
        set((state) => ({
          weightHistory: (state.weightHistory || []).filter((e) => e.id !== entryId),
        }));
        if (userId) {
          try {
            await setDoc(doc(db, 'users', userId), get()._clean({ 
              weightHistory: get().weightHistory 
            }), { merge: true });
          } catch (e) {
            console.error('Error deleting weight entry:', e);
          }
        }
      },

      getWeightProgress: () => {
        const { weightHistory, profile } = get();
        if (!weightHistory || weightHistory.length === 0) return null;

        const sorted = [...weightHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const change = last.weight - first.weight;
        const targetWeight = profile?.targetWeight;
        
        let progressToGoal = null;
        if (targetWeight && first.weight !== targetWeight) {
          const totalNeeded = targetWeight - first.weight;
          const achieved = last.weight - first.weight;
          progressToGoal = Math.min(100, Math.max(0, (achieved / totalNeeded) * 100));
        }

        return {
          startWeight: first.weight,
          currentWeight: last.weight,
          change: Math.round(change * 10) / 10,
          progressToGoal,
          entries: sorted,
        };
      },

      loadUserData: async (userId) => {
        if (!userId) return;
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const data = userDoc.data();
            set({
              profile: data.profile || null,
              settings: data.settings || get().settings,
              darkMode: data.darkMode !== undefined ? data.darkMode : get().darkMode,
              weightHistory: data.weightHistory || [],
            });
            if (data.darkMode) {
              document.documentElement.classList.add('dark');
              document.documentElement.style.colorScheme = 'dark';
            } else {
              document.documentElement.classList.remove('dark');
              document.documentElement.style.colorScheme = 'light';
            }
          }
        } catch (e) {
          console.error('Error loading user data:', e);
        }
      },

      // Calculate stats based on profile
      getStats: () => {
        const { profile } = get();
        if (!profile) return null;

        const { weight, height, birthDate, gender, activityLevel, goal } = profile;

        // BMI
        const heightM = height / 100;
        const bmi = weight / (heightM * heightM);

        // Age
        const age = new Date().getFullYear() - new Date(birthDate).getFullYear();

        // BMR (Mifflin-St Jeor)
        let bmr;
        if (gender === 'MALE') {
          bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
          bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        }

        // TDEE multipliers
        const activityMultipliers = {
          SEDENTARY: 1.2,
          LIGHTLY_ACTIVE: 1.375,
          MODERATELY_ACTIVE: 1.55,
          VERY_ACTIVE: 1.725,
          EXTREMELY_ACTIVE: 1.9,
        };

        const tdee = bmr * (activityMultipliers[activityLevel] || 1.55);

        // Target calories based on goal
        let targetCalories;
        switch (goal) {
          case 'WEIGHT_LOSS':
            targetCalories = tdee - 500;
            break;
          case 'MUSCLE_GAIN':
            targetCalories = tdee + 300;
            break;
          default:
            targetCalories = tdee;
        }

        // Macros (moderate protein approach)
        const protein = Math.round(weight * 2); // 2g per kg
        const fat = Math.round((targetCalories * 0.25) / 9); // 25% from fat
        const carbs = Math.round((targetCalories - protein * 4 - fat * 9) / 4);

        return {
          bmi: Math.round(bmi * 10) / 10,
          bmr: Math.round(bmr),
          tdee: Math.round(tdee),
          targetCalories: Math.round(targetCalories),
          macros: { protein, carbs, fat },
        };
      },

      clearProfile: () => set({ profile: null }),
    }),
    {
      name: 'user-storage',
      onRehydrateStorage: () => (state) => {
        // Apply dark mode class after rehydrating from localStorage
        if (state?.darkMode) {
          document.documentElement.classList.add('dark');
          document.documentElement.style.colorScheme = 'dark';
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.style.colorScheme = 'light';
        }
      },
    }
  )
);

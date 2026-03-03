import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export const useUserStore = create(
  persist(
    (set, get) => ({
      profile: null,
      darkMode: false,
      settings: {
        waterReminder: { enabled: true, intervalMinutes: 60 },
        units: { weight: 'kg', height: 'cm' },
        notifications: { push: true, email: false },
      },

      setDarkMode: async (enabled, userId) => {
        set({ darkMode: enabled });
        if (enabled) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        if (userId) {
          try {
            await setDoc(doc(db, 'users', userId), { darkMode: enabled }, { merge: true });
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
        } else {
          document.documentElement.classList.remove('dark');
        }
        if (userId) {
          try {
            await setDoc(doc(db, 'users', userId), { darkMode: newValue }, { merge: true });
          } catch (e) {
            console.error('Error toggling dark mode:', e);
          }
        }
      },

      setProfile: async (profile, userId) => {
        set({ profile });
        if (userId) {
          try {
            await setDoc(doc(db, 'users', userId), { profile }, { merge: true });
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
            await updateDoc(doc(db, 'users', userId), {
              'profile': { ...get().profile, ...updates }
            });
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
            await updateDoc(doc(db, 'users', userId), {
              'settings': { ...get().settings, ...updates }
            });
          } catch (e) {
            console.error('Error updating settings:', e);
          }
        }
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
              darkMode: data.darkMode !== undefined ? data.darkMode : get().darkMode
            });
            if (data.darkMode) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
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

      // Initialize dark mode on app load
      initDarkMode: () => {
        const { darkMode } = get();
        if (darkMode) {
          document.documentElement.classList.add('dark');
        }
      },
    }),
    {
      name: 'user-storage',
    }
  )
);

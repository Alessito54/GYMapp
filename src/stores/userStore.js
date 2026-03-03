import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

      setDarkMode: (enabled) => {
        set({ darkMode: enabled });
        if (enabled) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      toggleDarkMode: () => {
        const newValue = !get().darkMode;
        set({ darkMode: newValue });
        if (newValue) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      setProfile: (profile) => set({ profile }),

      updateProfile: (updates) => 
        set((state) => ({
          profile: { ...state.profile, ...updates },
        })),

      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),

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

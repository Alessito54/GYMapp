import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

const getTodayKey = () => new Date().toISOString().split('T')[0];

export const useNutritionStore = create(
  persist(
    (set, get) => ({
      meals: {}, // { '2026-03-02': { BREAKFAST: [], LUNCH: [], DINNER: [], SNACK: [] } }
      plans: [],
      activePlanId: null,

      // Sync Plans (Global)
      savePlansToFirebase: async (userId) => {
        if (!userId) return;
        const { plans, activePlanId } = get();
        try {
          await setDoc(doc(db, 'users', userId, 'data', 'nutrition_config'), {
            plans,
            activePlanId,
            lastSynced: new Date().toISOString()
          });
        } catch (e) {
          console.error('Error saving nutrition config:', e);
        }
      },

      // Sync Day Meals (Granular)
      saveDayToFirebase: async (userId, date, dayMeals) => {
        if (!userId || !date) return;
        try {
          await setDoc(doc(db, 'users', userId, 'meals', date), {
            meals: dayMeals,
            lastUpdated: new Date().toISOString()
          });
        } catch (e) {
          console.error('Error saving daily meals:', e);
        }
      },

      loadFromFirebase: async (userId) => {
        if (!userId) return;
        try {
          console.log('Loading nutrition data from Firebase...');

          // Load Plans
          const configSnap = await getDoc(doc(db, 'users', userId, 'data', 'nutrition_config'));
          if (configSnap.exists()) {
            const data = configSnap.data();
            set({
              plans: data.plans || [],
              activePlanId: data.activePlanId || null
            });
          }

          // Load Today's Meals
          const today = getTodayKey();
          const todaySnap = await getDoc(doc(db, 'users', userId, 'meals', today));
          if (todaySnap.exists()) {
            const data = todaySnap.data();
            set((state) => ({
              meals: { ...state.meals, [today]: data.meals || {} }
            }));
          }

          console.log('Nutrition data loaded successfully');
        } catch (e) {
          console.error('Error loading nutrition data:', e);
        }
      },

      // Add a meal entry
      addMeal: async (mealType, foods, userId, date = null) => {
        const key = date || getTodayKey();
        let updatedDayMeals;

        set((state) => {
          const dayMeals = state.meals[key] || {
            BREAKFAST: [],
            LUNCH: [],
            DINNER: [],
            SNACK: [],
          };

          updatedDayMeals = {
            ...dayMeals,
            [mealType]: [...dayMeals[mealType], ...foods],
          };

          return {
            meals: {
              ...state.meals,
              [key]: updatedDayMeals,
            },
          };
        });

        if (userId) await get().saveDayToFirebase(userId, key, updatedDayMeals);
      },

      // Remove a food item
      removeMealItem: async (mealType, index, userId, date = null) => {
        const key = date || getTodayKey();
        let updatedDayMeals;

        set((state) => {
          const dayMeals = state.meals[key];
          if (!dayMeals) return state;

          const updatedMeal = [...dayMeals[mealType]];
          updatedMeal.splice(index, 1);

          updatedDayMeals = {
            ...dayMeals,
            [mealType]: updatedMeal,
          };

          return {
            meals: {
              ...state.meals,
              [key]: updatedDayMeals,
            },
          };
        });

        if (userId && updatedDayMeals) await get().saveDayToFirebase(userId, key, updatedDayMeals);
      },

      // Get today's nutrition summary
      getTodaySummary: () => {
        const { meals } = get();
        const today = getTodayKey();
        const dayMeals = meals[today] || {
          BREAKFAST: [],
          LUNCH: [],
          DINNER: [],
          SNACK: [],
        };

        const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

        Object.values(dayMeals).forEach((mealFoods) => {
          mealFoods.forEach((food) => {
            totals.calories += food.calories || 0;
            totals.protein += food.protein || 0;
            totals.carbs += food.carbs || 0;
            totals.fat += food.fat || 0;
          });
        });

        return {
          meals: dayMeals,
          totals: {
            calories: Math.round(totals.calories),
            protein: Math.round(totals.protein),
            carbs: Math.round(totals.carbs),
            fat: Math.round(totals.fat),
          },
        };
      },

      // Meal type labels
      getMealTypeLabel: (type) => {
        const labels = {
          BREAKFAST: 'Desayuno',
          LUNCH: 'Almuerzo',
          DINNER: 'Cena',
          SNACK: 'Snack',
        };
        return labels[type] || type;
      },

      // Plans management
      addPlan: async (plan, userId) => {
        set((state) => ({
          plans: [...state.plans, { ...plan, id: Date.now().toString() }],
        }));
        if (userId) await get().savePlansToFirebase(userId);
      },

      setActivePlan: async (planId, userId) => {
        set({ activePlanId: planId });
        if (userId) await get().savePlansToFirebase(userId);
      },

      getActivePlan: () => {
        const { plans, activePlanId } = get();
        return plans.find((p) => p.id === activePlanId) || null;
      },
    }),
    {
      name: 'nutrition-storage',
    }
  )
);

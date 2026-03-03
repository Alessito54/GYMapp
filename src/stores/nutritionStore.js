import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const getTodayKey = () => new Date().toISOString().split('T')[0];

export const useNutritionStore = create(
  persist(
    (set, get) => ({
      meals: {}, // { '2026-03-02': { BREAKFAST: [], LUNCH: [], DINNER: [], SNACK: [] } }
      plans: [],
      activePlanId: null,

      // Add a meal entry
      addMeal: (mealType, foods, date = null) => {
        const key = date || getTodayKey();
        
        set((state) => {
          const dayMeals = state.meals[key] || {
            BREAKFAST: [],
            LUNCH: [],
            DINNER: [],
            SNACK: [],
          };

          return {
            meals: {
              ...state.meals,
              [key]: {
                ...dayMeals,
                [mealType]: [...dayMeals[mealType], ...foods],
              },
            },
          };
        });
      },

      // Remove a food item
      removeMealItem: (mealType, index, date = null) => {
        const key = date || getTodayKey();
        
        set((state) => {
          const dayMeals = state.meals[key];
          if (!dayMeals) return state;

          const updatedMeal = [...dayMeals[mealType]];
          updatedMeal.splice(index, 1);

          return {
            meals: {
              ...state.meals,
              [key]: {
                ...dayMeals,
                [mealType]: updatedMeal,
              },
            },
          };
        });
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
      addPlan: (plan) => {
        set((state) => ({
          plans: [...state.plans, { ...plan, id: Date.now().toString() }],
        }));
      },

      setActivePlan: (planId) => set({ activePlanId: planId }),

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

import { useState } from 'react';
import {
  IoAddCircle,
  IoSparkles,
  IoTrashOutline,
  IoRestaurantOutline,
  IoCafeOutline,
  IoFastFoodOutline,
  IoIceCreamOutline,
  IoCreateOutline,
  IoCheckmarkCircle
} from 'react-icons/io5';
import { Card, Button, Input, Modal } from '@/components/ui';
import { useNutritionStore, useUserStore, useAuthStore } from '@/stores';
import { calculateNutrition } from '@/config/gemini';

const MEAL_TYPES = [
  { type: 'BREAKFAST', label: 'Desayuno', icon: IoCafeOutline, color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300' },
  { type: 'LUNCH', label: 'Almuerzo', icon: IoRestaurantOutline, color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300' },
  { type: 'DINNER', label: 'Cena', icon: IoFastFoodOutline, color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300' },
  { type: 'SNACK', label: 'Snack', icon: IoIceCreamOutline, color: 'bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-300' },
];

export default function Nutrition() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState(null);
  const [foodInput, setFoodInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const { getTodaySummary, addMeal, removeMealItem, getMealTypeLabel } = useNutritionStore();
  const { user } = useAuthStore();
  const getStats = useUserStore((state) => state.getStats);
  const stats = getStats();
  const { meals, totals } = getTodaySummary();

  const targetCalories = stats?.targetCalories || 2500;
  const caloriesRemaining = targetCalories - totals.calories;

  const handleOpenModal = (mealType) => {
    setSelectedMealType(mealType);
    setIsModalOpen(true);
    setFoodInput('');
    setAiResult(null);
  };

  const handleAnalyzeFood = async () => {
    if (!foodInput.trim()) return;

    setIsLoading(true);
    try {
      const result = await calculateNutrition(foodInput);
      setAiResult(result);
    } catch (error) {
      console.error('Error analyzing food:', error);
      alert('No se pudo analizar el alimento. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFood = () => {
    if (!aiResult || !selectedMealType) return;

    addMeal(selectedMealType, [{
      name: aiResult.food,
      portion: aiResult.portion,
      calories: aiResult.calories,
      protein: aiResult.protein,
      carbs: aiResult.carbs,
      fat: aiResult.fat,
      aiGenerated: true,
    }], user?.uid);

    setIsModalOpen(false);
    setAiResult(null);
    setFoodInput('');
  };

  return (
    <div className="px-5 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <header className="px-1">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Mi <span className="text-gradient">Nutricion</span></h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Registra tu combustible diario</p>
      </header>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 text-white border-none shadow-2xl shadow-blue-500/30 overflow-hidden group">
        <Card.Body className="p-8 relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24 group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -ml-16 -mb-16" />

          <div className="text-center relative z-10">
            <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mb-3">Calorias restantes</p>
            <div className="flex items-center justify-center gap-2 mb-2">
              <p className="text-6xl font-black tracking-tighter">
                {caloriesRemaining > 0 ? caloriesRemaining : 0}
              </p>
              <span className="text-lg font-bold text-white/60 mt-4">kcal</span>
            </div>

            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="h-1.5 w-32 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min((totals.calories / targetCalories) * 100, 100)}%` }}
                />
              </div>
              <p className="text-[10px] font-black text-white/80 uppercase tracking-widest">
                {Math.round((totals.calories / targetCalories) * 100)}% META
              </p>
            </div>
          </div>

          {/* Macro summary */}
          <div className="grid grid-cols-3 gap-4 mt-10 relative z-10">
            {[
              { label: 'Proteina', value: totals.protein, color: 'bg-sky-300' },
              { label: 'Carbos', value: totals.carbs, color: 'bg-amber-300' },
              { label: 'Grasas', value: totals.fat, color: 'bg-rose-300' }
            ].map((macro) => (
              <div key={macro.label} className="bg-white/10 backdrop-blur-md rounded-[1.5rem] p-4 border border-white/10 flex flex-col items-center">
                <p className="text-lg font-black text-white">{macro.value}g</p>
                <p className="text-white/80 text-[9px] font-black uppercase tracking-widest mt-1">{macro.label}</p>
                <div className={`h-1.5 w-8 ${macro.color} rounded-full mt-2`} />
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Meals */}
      <div className="space-y-6">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-1">Comidas de Hoy</h2>
        <div className="space-y-4">
          {MEAL_TYPES.map((mealType) => {
            const MealIcon = mealType.icon;
            const mealCalories = meals[mealType.type].reduce((sum, f) => sum + f.calories, 0);

            return (
              <Card key={mealType.type} className="shadow-sm border-slate-100 group">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl ${mealType.color.replace('100', '50').replace('600', '500')} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                        <MealIcon className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{mealType.label}</h3>
                        <p className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest mt-0.5">
                          {mealCalories} kcal totales
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenModal(mealType.type)}
                      className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all active:scale-95 shadow-sm"
                    >
                      <IoAddCircle className="w-8 h-8" />
                    </button>
                  </div>

                  {meals[mealType.type].length > 0 && (
                    <div className="mt-6 space-y-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                      {meals[mealType.type].map((food, index) => (
                        <div
                          key={index}
                          className="group/item flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
                        >
                          <div className="flex-1 min-w-0 mr-4">
                            <p className="font-black text-slate-800 dark:text-slate-200 text-sm truncate">{food.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                              {food.portion} • <span className="text-emerald-500">{food.calories} kcal</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="hidden sm:flex items-center gap-3 text-[9px] font-black uppercase tracking-widest">
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 rounded-md">P:{food.protein}g</span>
                              <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-200 rounded-md">C:{food.carbs}g</span>
                            </div>
                            <button
                              onClick={() => removeMealItem(mealType.type, index, user?.uid)}
                              className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
                            >
                              <IoTrashOutline className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Add Food Modal internals are updated because Modal.jsx was updated, but we can polish the inner content */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Agregar a ${getMealTypeLabel(selectedMealType)}`}
      >
        <div className="space-y-6">
          <Input
            label="¿Qué has comido?"
            placeholder="Ej: 2 huevos revueltos con aguacate"
            value={foodInput}
            onChange={(e) => setFoodInput(e.target.value)}
          />

          <Button
            onClick={handleAnalyzeFood}
            loading={isLoading}
            disabled={!foodInput.trim()}
            className="w-full h-14 premium-gradient"
          >
            <IoSparkles className="w-5 h-5 mr-2" />
            Analizar con IA Fit
          </Button>

          {aiResult && (
            <div className="animate-slide-up">
              <Card className="p-6 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl" />

                <h4 className="text-xl font-black text-slate-900 dark:text-white mb-1">{aiResult.food}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Porcion: {aiResult.portion}</p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { label: 'Calorias', value: aiResult.calories, color: 'text-emerald-600 dark:text-emerald-400', unit: '' },
                    { label: 'Proteina', value: aiResult.protein, color: 'text-blue-600 dark:text-blue-400', unit: 'g' },
                    { label: 'Carbos', value: aiResult.carbs, color: 'text-amber-600 dark:text-amber-400', unit: 'g' },
                    { label: 'Grasas', value: aiResult.fat, color: 'text-rose-600 dark:text-rose-400', unit: 'g' }
                  ].map((item) => (
                    <div key={item.label} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-600 shadow-sm text-center">
                      <p className={`text-2xl font-black ${item.color}`}>{item.value}{item.unit}</p>
                      <p className="text-[9px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest mt-1">{item.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mb-6 px-2">
                  <p className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">Confianza IA</p>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${aiResult.confidence * 100}%` }} />
                    </div>
                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-tighter">{Math.round(aiResult.confidence * 100)}%</span>
                  </div>
                </div>

                <Button
                  onClick={handleAddFood}
                  className="w-full h-14"
                  variant="primary"
                >
                  <IoCheckmarkCircle className="w-5 h-5 mr-2" />
                  Confirmar y Agregar
                </Button>
              </Card>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

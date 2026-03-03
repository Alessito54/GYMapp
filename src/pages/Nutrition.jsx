import { useState } from 'react';
import {
  IoAddCircle,
  IoSparkles,
  IoTrashOutline,
  IoRestaurantOutline,
  IoCafeOutline,
  IoFastFoodOutline,
  IoIceCreamOutline,
  IoCheckmarkCircle,
  IoFlameOutline,
  IoNutritionOutline,
  IoTrendingUpOutline
} from 'react-icons/io5';
import { Card, Button, Input, Modal, ProgressRing } from '@/components/ui';
import { useNutritionStore, useUserStore, useAuthStore } from '@/stores';
import { calculateNutrition } from '@/config/gemini';

const MEAL_TYPES = [
  { type: 'BREAKFAST', label: 'Desayuno', icon: IoCafeOutline, color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300', gradient: 'from-amber-500 to-orange-500' },
  { type: 'LUNCH', label: 'Almuerzo', icon: IoRestaurantOutline, color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300', gradient: 'from-emerald-500 to-teal-500' },
  { type: 'DINNER', label: 'Cena', icon: IoFastFoodOutline, color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300', gradient: 'from-blue-500 to-indigo-500' },
  { type: 'SNACK', label: 'Snack', icon: IoIceCreamOutline, color: 'bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-300', gradient: 'from-pink-500 to-rose-500' },
];

const QUICK_FOODS = [
  { name: 'Manzana', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, portion: '1 mediana', emoji: '🍎' },
  { name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, portion: '1 mediana', emoji: '🍌' },
  { name: 'Huevo cocido', calories: 78, protein: 6, carbs: 0.6, fat: 5, portion: '1 unidad', emoji: '🥚' },
  { name: 'Pechuga de pollo', calories: 165, protein: 31, carbs: 0, fat: 3.6, portion: '100g', emoji: '🍗' },
  { name: 'Arroz blanco', calories: 206, protein: 4.3, carbs: 45, fat: 0.4, portion: '1 taza', emoji: '🍚' },
  { name: 'Avena', calories: 154, protein: 5, carbs: 27, fat: 2.5, portion: '1/2 taza', emoji: '🥣' },
];

export default function Nutrition() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState(null);
  const [foodInput, setFoodInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [inputMode, setInputMode] = useState('AI'); // 'AI' | 'MANUAL' | 'QUICK'
  const [manualData, setManualData] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    portion: ''
  });

  const { getTodaySummary, addMeal, removeMealItem } = useNutritionStore();
  const { user } = useAuthStore();
  const getStats = useUserStore((state) => state.getStats);
  const stats = getStats();
  const { totals, meals } = getTodaySummary();

  const targetCalories = stats?.targetCalories || 2500;
  const targetProtein = stats?.macros?.protein || 150;
  const caloriesRemaining = targetCalories - totals.calories;
  const proteinProgress = Math.min((totals.protein / targetProtein) * 100, 100);
  
  const getMealTypeInfo = (type) => MEAL_TYPES.find(m => m.type === type);

  const handleOpenModal = (mealType) => {
    setSelectedMealType(mealType);
    setIsModalOpen(true);
    setInputMode('AI');
    setFoodInput('');
    setAiResult(null);
    setManualData({ name: '', calories: '', protein: '', carbs: '', fat: '', portion: '' });
  };

  const [aiError, setAiError] = useState(null);

  const handleAnalyzeFood = async () => {
    if (!foodInput.trim()) return;

    setIsLoading(true);
    setAiError(null);
    try {
      const result = await calculateNutrition(foodInput);
      setAiResult(result);
    } catch (error) {
      console.error('Error analyzing food:', error);
      setAiError(error.message || 'No se pudo analizar el alimento. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdd = (food) => {
    if (!selectedMealType) return;
    addMeal(selectedMealType, [{
      name: food.name,
      portion: food.portion,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      aiGenerated: false,
    }], user?.uid);
    setIsModalOpen(false);
  };

  const handleAddFood = () => {
    if (inputMode === 'AI') {
      if (!aiResult || !selectedMealType) return;
      addMeal(selectedMealType, [{
        name: aiResult.food,
        portion: aiResult.portion,
        calories: Number(aiResult.calories),
        protein: Number(aiResult.protein),
        carbs: Number(aiResult.carbs),
        fat: Number(aiResult.fat),
        aiGenerated: true,
      }], user?.uid);
    } else {
      // Manual
      if (!manualData.name || !manualData.calories || !selectedMealType) return;
      addMeal(selectedMealType, [{
        name: manualData.name,
        portion: manualData.portion || '1 porcion',
        calories: Number(manualData.calories),
        protein: Number(manualData.protein) || 0,
        carbs: Number(manualData.carbs) || 0,
        fat: Number(manualData.fat) || 0,
        aiGenerated: false,
      }], user?.uid);
    }

    setIsModalOpen(false);
    setAiResult(null);
    setFoodInput('');
    setManualData({ name: '', calories: '', protein: '', carbs: '', fat: '', portion: '' });
  };

  return (
    <div className="px-4 sm:px-5 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-fadeIn pb-24">
      {/* Header */}
      <header className="px-1">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Mi <span className="text-gradient">Nutricion</span></h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Registra tu combustible diario</p>
      </header>

      {/* Summary Card - Redesigned */}
      <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-none shadow-2xl shadow-slate-900/50 overflow-hidden relative">
        <Card.Body className="p-0">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -ml-24 -mb-24" />
          
          {/* Main stats row */}
          <div className="relative z-10 p-5 sm:p-8 flex items-center justify-between gap-4 sm:gap-6">
            {/* Progress Ring */}
            <div className="flex-shrink-0">
              <ProgressRing 
                progress={Math.min((totals.calories / targetCalories) * 100, 100)} 
                size={120} 
                strokeWidth={10}
                className="text-blue-500"
              >
                <div className="text-center">
                  <IoFlameOutline className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                  <p className="text-2xl font-black text-white tracking-tighter">{totals.calories}</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">kcal</p>
                </div>
              </ProgressRing>
            </div>

            {/* Stats Info */}
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Objetivo Diario</p>
                <p className="text-2xl sm:text-3xl font-black text-white tracking-tighter">{targetCalories} <span className="text-base sm:text-lg text-slate-500">kcal</span></p>
              </div>
              <div className="flex items-center gap-2">
                <IoTrendingUpOutline className={`w-5 h-5 ${caloriesRemaining > 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
                <p className={`text-sm font-bold ${caloriesRemaining > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {caloriesRemaining > 0 ? `${caloriesRemaining} restantes` : `${Math.abs(caloriesRemaining)} excedidas`}
                </p>
              </div>
            </div>
          </div>

          {/* Macros bar */}
          <div className="relative z-10 px-8 pb-8">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Proteína', value: totals.protein, target: targetProtein, color: 'bg-sky-500', progress: proteinProgress },
                { label: 'Carbos', value: totals.carbs, target: Math.round(targetCalories * 0.45 / 4), color: 'bg-amber-500', progress: 0 },
                { label: 'Grasas', value: totals.fat, target: Math.round(targetCalories * 0.3 / 9), color: 'bg-rose-500', progress: 0 }
              ].map((macro, idx) => (
                <div key={macro.label} className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{macro.label}</p>
                    <IoNutritionOutline className={`w-3.5 h-3.5 ${idx === 0 ? 'text-sky-400' : idx === 1 ? 'text-amber-400' : 'text-rose-400'}`} />
                  </div>
                  <p className="text-xl font-black text-white">{macro.value}<span className="text-xs text-slate-500 ml-0.5">g</span></p>
                  <div className="h-1 bg-slate-700 rounded-full mt-2 overflow-hidden">
                    <div className={`h-full ${macro.color} rounded-full transition-all duration-500`} style={{ width: `${Math.min((macro.value / macro.target) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
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

{/* Add Food Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setAiError(null);
          setAiResult(null);
          setFoodInput('');
          setManualData({ name: '', calories: '', protein: '', carbs: '', fat: '', portion: '' });
        }}
        title={`Agregar a ${getMealTypeInfo(selectedMealType)?.label || 'Comida'}`}
      >
        <div className="space-y-6">
          {/* Mode Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {[
              { key: 'AI', label: '✨ IA' },
              { key: 'QUICK', label: '⚡ Rapido' },
              { key: 'MANUAL', label: '✏️ Manual' }
            ].map((mode) => (
              <button
                key={mode.key}
                onClick={() => setInputMode(mode.key)}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${inputMode === mode.key
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* AI Mode */}
          {inputMode === 'AI' && (
            <div className="space-y-6 animate-fadeIn">
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

              {aiError && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl">
                  <p className="text-rose-600 dark:text-rose-400 text-sm font-semibold">{aiError}</p>
                </div>
              )}

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
          )}

          {/* Quick Mode */}
          {inputMode === 'QUICK' && (
            <div className="space-y-4 animate-fadeIn">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 px-1">Alimentos comunes - toca para agregar</p>
              <div className="grid grid-cols-2 gap-3">
                {QUICK_FOODS.map((food) => (
                  <button
                    key={food.name}
                    onClick={() => handleQuickAdd(food)}
                    className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all text-left group active:scale-95"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{food.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-800 dark:text-slate-200 text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{food.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{food.portion}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-black">
                      <span className="text-emerald-600 dark:text-emerald-400">{food.calories} kcal</span>
                      <span className="text-slate-400">P:{food.protein}g</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manual Mode */}
          {inputMode === 'MANUAL' && (
            <div className="space-y-6 animate-fadeIn">
              <Input
                label="Nombre del alimento"
                placeholder="Ej: Plato de pasta"
                value={manualData.name}
                onChange={(e) => setManualData({ ...manualData, name: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Calorías"
                  type="number"
                  placeholder="0"
                  value={manualData.calories}
                  onChange={(e) => setManualData({ ...manualData, calories: e.target.value })}
                />
                <Input
                  label="Porción (Opcional)"
                  placeholder="Ej: 1 plato"
                  value={manualData.portion}
                  onChange={(e) => setManualData({ ...manualData, portion: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Proteína (g)"
                  type="number"
                  placeholder="0"
                  value={manualData.protein}
                  onChange={(e) => setManualData({ ...manualData, protein: e.target.value })}
                />
                <Input
                  label="Carbos (g)"
                  type="number"
                  placeholder="0"
                  value={manualData.carbs}
                  onChange={(e) => setManualData({ ...manualData, carbs: e.target.value })}
                />
                <Input
                  label="Grasas (g)"
                  type="number"
                  placeholder="0"
                  value={manualData.fat}
                  onChange={(e) => setManualData({ ...manualData, fat: e.target.value })}
                />
              </div>
              <Button
                onClick={handleAddFood}
                disabled={!manualData.name || !manualData.calories}
                className="w-full h-14 bg-blue-600 hover:bg-blue-500"
              >
                <IoCheckmarkCircle className="w-5 h-5 mr-2" />
                Agregar Comida
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

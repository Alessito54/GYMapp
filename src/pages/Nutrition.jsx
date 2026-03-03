import { useState } from 'react';
import {
  IoAddCircle,
  IoSparkles,
  IoTrashOutline,
  IoRestaurantOutline,
  IoCafeOutline,
  IoFastFoodOutline,
  IoIceCreamOutline
} from 'react-icons/io5';
import { Card, Button, Input, Modal } from '@/components/ui';
import { useNutritionStore, useUserStore } from '@/stores';
import { calculateNutrition } from '@/config/gemini';

const MEAL_TYPES = [
  { type: 'BREAKFAST', label: 'Desayuno', icon: IoCafeOutline, color: 'bg-yellow-100 text-yellow-600' },
  { type: 'LUNCH', label: 'Almuerzo', icon: IoRestaurantOutline, color: 'bg-green-100 text-green-600' },
  { type: 'DINNER', label: 'Cena', icon: IoFastFoodOutline, color: 'bg-blue-100 text-blue-600' },
  { type: 'SNACK', label: 'Snack', icon: IoIceCreamOutline, color: 'bg-pink-100 text-pink-600' },
];

export default function Nutrition() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState(null);
  const [foodInput, setFoodInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const { getTodaySummary, addMeal, removeMealItem, getMealTypeLabel } = useNutritionStore();
  const stats = useUserStore((state) => state.getStats());
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
    }]);

    setIsModalOpen(false);
    setAiResult(null);
    setFoodInput('');
  };

  return (
    <div className="px-4 py-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <header className="pt-2">
        <h1 className="text-2xl font-bold text-gray-900">Nutricion 🍎</h1>
        <p className="text-gray-500 text-sm mt-0.5">Registra tus comidas del dia</p>
      </header>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 text-white shadow-lg overflow-hidden">
        <Card.Body className="relative">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
          <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl" />

          <div className="text-center relative">
            <p className="text-white/80 text-sm mb-1">Calorias restantes</p>
            <p className="text-5xl font-bold mb-2">
              {caloriesRemaining > 0 ? caloriesRemaining : 0}
            </p>
            <p className="text-white/60 text-sm">
              {totals.calories} consumidas de {targetCalories}
            </p>

            {/* Progress bar */}
            <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/90 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((totals.calories / targetCalories) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Macro summary */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-white/20 relative">
            <div className="text-center p-2 bg-white/10 rounded-xl">
              <p className="text-xl font-bold">{totals.protein}g</p>
              <p className="text-white/70 text-xs">Proteina</p>
            </div>
            <div className="text-center p-2 bg-white/10 rounded-xl">
              <p className="text-xl font-bold">{totals.carbs}g</p>
              <p className="text-white/70 text-xs">Carbos</p>
            </div>
            <div className="text-center p-2 bg-white/10 rounded-xl">
              <p className="text-xl font-bold">{totals.fat}g</p>
              <p className="text-white/70 text-xs">Grasas</p>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Meals */}
      <div className="space-y-4">
        {MEAL_TYPES.map((mealType) => {
          const MealIcon = mealType.icon;
          return (
            <Card key={mealType.type} className="shadow-sm">
              <Card.Header className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${mealType.color} flex items-center justify-center`}>
                      <MealIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{mealType.label}</h3>
                      <p className="text-xs text-gray-500">
                        {meals[mealType.type].reduce((sum, f) => sum + f.calories, 0)} kcal
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenModal(mealType.type)}
                    className="w-10 h-10 active-scale-95"
                  >
                    <IoAddCircle className="w-7 h-7 text-blue-600" />
                  </Button>
                </div>
              </Card.Header>

              {meals[mealType.type].length > 0 && (
                <Card.Body className="pt-0 p-3">
                  <div className="space-y-2">
                    {meals[mealType.type].map((food, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                      >
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="font-medium text-gray-900 text-sm truncate">{food.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {food.portion} • {food.calories} kcal
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right text-[11px] text-gray-500 hidden sm:block">
                            <span className="text-blue-600 font-medium">P:{food.protein}g</span>
                            <span className="mx-1 text-gray-300">|</span>
                            <span className="text-green-600 font-medium">C:{food.carbs}g</span>
                            <span className="mx-1 text-gray-300">|</span>
                            <span className="text-amber-600 font-medium">G:{food.fat}g</span>
                          </div>
                          <button
                            onClick={() => removeMealItem(mealType.type, index)}
                            className="p-2 text-red-500 hover:bg-red-100 active:bg-red-200 rounded-xl transition-colors"
                          >
                            <IoTrashOutline className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              )}
            </Card>
          );
        })}
      </div>

      {/* Add Food Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Agregar a ${getMealTypeLabel(selectedMealType)}`}
      >
        <div className="space-y-5">
          <Input
            label="Describe tu comida"
            placeholder="Ej: 2 huevos revueltos con tostada integral"
            value={foodInput}
            onChange={(e) => setFoodInput(e.target.value)}
          />

          <Button
            onClick={handleAnalyzeFood}
            loading={isLoading}
            disabled={!foodInput.trim()}
            className="w-full"
          >
            <IoSparkles className="w-5 h-5 mr-2" />
            Analizar con IA
          </Button>

          {aiResult && (
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
              <Card.Body>
                <h4 className="font-semibold text-gray-900 mb-2">{aiResult.food}</h4>
                <p className="text-sm text-gray-600 mb-3">Porcion: {aiResult.portion}</p>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-white p-3 rounded-xl text-center shadow-sm">
                    <p className="font-bold text-xl text-gray-900">{aiResult.calories}</p>
                    <p className="text-gray-500 text-xs">Calorias</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl text-center shadow-sm">
                    <p className="font-bold text-xl text-blue-600">{aiResult.protein}g</p>
                    <p className="text-gray-500 text-xs">Proteina</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl text-center shadow-sm">
                    <p className="font-bold text-xl text-green-600">{aiResult.carbs}g</p>
                    <p className="text-gray-500 text-xs">Carbos</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl text-center shadow-sm">
                    <p className="font-bold text-xl text-amber-600">{aiResult.fat}g</p>
                    <p className="text-gray-500 text-xs">Grasas</p>
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-500 text-center">
                  Confianza: <span className="font-medium text-blue-600">{Math.round(aiResult.confidence * 100)}%</span>
                </div>

                <Button
                  onClick={handleAddFood}
                  className="w-full mt-4"
                  variant="success"
                >
                  Agregar comida
                </Button>
              </Card.Body>
            </Card>
          )}
        </div>
      </Modal>
    </div>
  );
}

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_KEY;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Clean AI response to ensure it's valid JSON
 * @param {string} text - Raw response text
 * @returns {Object} Parsed JSON
 */
function parseAIResponse(text) {
  try {
    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error('Failed to parse AI response:', text);
    throw new Error('Formato de respuesta invalido');
  }
}

// Model configurations
export const MODELS = {
  // Fast responses, good for simple tasks
  FLASH: 'gemini-2.0-flash',
  // More capable, better for complex reasoning (using flash as fallback since pro may not be available)
  PRO: 'gemini-2.0-flash',
};

/**
 * Get a Gemini model instance
 * @param {string} modelName - Model to use (default: FLASH)
 * @returns {GenerativeModel}
 */
export function getModel(modelName = MODELS.FLASH) {
  return genAI.getGenerativeModel({ model: modelName });
}

/**
 * Nutritionist AI - Calculate calories and macros
 * @param {string} foodDescription - Food description
 * @returns {Promise<Object>} Nutritional information
 */
export async function calculateNutrition(foodDescription) {
  const model = getModel(MODELS.FLASH);

  const prompt = `Eres un nutricionista experto. Analiza el siguiente alimento y proporciona informacion nutricional estimada.

Alimento: "${foodDescription}"

Responde UNICAMENTE con un JSON valido (sin markdown, sin explicaciones):
{
  "food": "nombre del alimento",
  "portion": "porcion estimada",
  "calories": numero,
  "protein": numero en gramos,
  "carbs": numero en gramos,
  "fat": numero en gramos,
  "fiber": numero en gramos,
  "confidence": numero entre 0 y 1
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return parseAIResponse(text);
  } catch (error) {
    console.error('Error calculating nutrition:', error);
    throw new Error('No se pudo calcular la informacion nutricional');
  }
}

/**
 * Trainer AI - Generate workout recommendations
 * @param {Object} params - User parameters
 * @returns {Promise<Object>} Workout recommendation
 */
export async function getWorkoutRecommendation(params) {
  const model = getModel(MODELS.PRO);

  const { goal, experience, equipment, duration, focusMuscles } = params;

  const prompt = `Eres un entrenador personal experto. Genera una rutina de entrenamiento.

Parametros:
- Objetivo: ${goal}
- Experiencia: ${experience}
- Equipamiento disponible: ${equipment.join(', ')}
- Duracion deseada: ${duration} minutos
- Musculos a trabajar: ${focusMuscles.join(', ')}

Responde UNICAMENTE con un JSON valido (sin markdown):
{
  "name": "nombre de la rutina",
  "description": "descripcion breve",
  "estimatedDuration": numero en minutos,
  "exercises": [
    {
      "name": "nombre del ejercicio",
      "sets": numero,
      "reps": "rango de repeticiones",
      "restSeconds": numero,
      "notes": "notas opcionales"
    }
  ],
  "warmup": ["ejercicio de calentamiento 1", "ejercicio 2"],
  "cooldown": ["ejercicio de vuelta a la calma 1"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return parseAIResponse(text);
  } catch (error) {
    console.error('Error generating workout:', error);
    throw new Error('No se pudo generar la rutina');
  }
}

export default genAI;

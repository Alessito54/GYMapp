const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_KEY;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Usamos Gemma 3 12B: 
 * - Cuota: 14,400 peticiones diarias.
 * - Idioma: Configurado mediante el prompt para responder en español.
 */
const PRIMARY_MODEL = 'gemma-3-12b-it';

/**
 * Realiza la comunicación con la API.
 */
async function callGemini(prompt, model = PRIMARY_MODEL) {
  const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData?.error?.message || response.statusText);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) throw new Error('La IA no devolvió contenido.');
  
  return text;
}

/**
 * Limpieza avanzada para extraer JSON. 
 * Soporta tanto objetos individuales como arrays.
 * Maneja respuestas envueltas en bloques markdown.
 */
function parseAIResponse(text) {
  try {
    // Limpiar bloques de código markdown (```json ... ``` o ``` ... ```)
    let cleanText = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    
    // Intentar parsear directamente primero
    try {
      return JSON.parse(cleanText);
    } catch {
      // Si falla, buscar el JSON dentro del texto
    }
    
    // Buscar un array
    const arrayMatch = cleanText.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }
    
    // Si no hay array, buscar objeto
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No se encontró un formato JSON válido.");
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Error parseando respuesta:', text);
    console.error('Parse error:', err.message);
    throw new Error('La IA falló al generar el formato de datos.');
  }
}

/**
 * Manejador de errores para el usuario.
 */
function parseAPIError(error) {
  const status = error.status;
  if (status === 429) return { message: 'Límite diario alcanzado. Intenta mañana.' };
  if (status === 503) return { message: 'Servidor ocupado. Reintenta en 5 segundos.' };
  return { message: 'Error de conexión con el servicio de entrenamiento.' };
}

/**
 * ENTRENAMIENTO - Generar rutina en ESPAÑOL y sin peso.
 */
export async function getWorkoutRecommendation(params) {
  const { goal, experience, equipment, duration, focusMuscles } = params;

  // Prompt optimizado para español y restricción de peso
  const prompt = `Actúa como un entrenador personal experto de habla hispana. 
  Genera una rutina de entrenamiento basada en los siguientes parámetros:
  - Objetivo: ${goal}
  - Nivel de experiencia: ${experience}
  - Equipo disponible: ${equipment.join(', ')}
  - Duración total: ${duration} minutos
  - Músculos objetivo: ${focusMuscles.join(', ')}

  REGLAS CRÍTICAS:
  1. Responde ÚNICAMENTE con el objeto JSON válido.
  2. TODO el texto debe estar en ESPAÑOL.
  3. NO incluyas peso (kg/lbs) en los ejercicios; el usuario lo elegirá.
  4. NO incluyas explicaciones fuera del JSON.
  5. Cada ejercicio DEBE tener un "muscleGroup" del siguiente listado exacto:
     "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", "Piernas", "Glúteos", "Abdominales", "Cardio", "Full Body"

  Estructura requerida:
  {
    "name": "Título de la Rutina",
    "description": "Explicación breve",
    "estimatedDuration": ${duration},
    "exercises": [
      { 
        "name": "Nombre del ejercicio", 
        "muscleGroup": "Piernas",
        "sets": 3, 
        "reps": "10-12", 
        "restSeconds": 60, 
        "notes": "Consejo técnico de ejecución" 
      }
    ],
    "warmup": ["Ejercicio de calentamiento 1", "Ejercicio 2"],
    "cooldown": ["Estiramiento o vuelta a la calma"]
  }`;

  try {
    const text = await callGemini(prompt);
    return parseAIResponse(text);
  } catch (error) {
    const { message } = parseAPIError(error);
    throw new Error(message);
  }
}

/**
 * NUTRICIÓN - Calcular macros en ESPAÑOL.
 */
export async function calculateNutrition(foodDescription) {
  const prompt = `Analiza el contenido nutricional para: "${foodDescription}".
  
  IMPORTANTE: Si hay múltiples alimentos, SUM TODOS y devuelve UN SOLO objeto con el total.
  Ejemplo: "2 huevos y arroz" → devuelve la suma de ambos en un solo objeto.
  
  Responde ÚNICAMENTE con un objeto JSON válido en ESPAÑOL.
  
  Estructura:
  {
    "food": "descripción resumida de lo consumido",
    "portion": "cantidad total aproximada",
    "calories": 0,
    "protein": 0,
    "carbs": 0,
    "fat": 0,
    "confidence": 0.9
  }`;

  try {
    const text = await callGemini(prompt);
    const result = parseAIResponse(text);
    
    // Si devuelve array, sumar todos los valores
    if (Array.isArray(result)) {
      const combined = result.reduce((acc, item) => ({
        food: result.map(i => i.food).join(' + '),
        portion: 'combinado',
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fat: acc.fat + (item.fat || 0),
        confidence: Math.min(acc.confidence, item.confidence || 0.8)
      }), { calories: 0, protein: 0, carbs: 0, fat: 0, confidence: 1 });
      
      return combined;
    }
    
    // Asegurar que portion existe
    if (!result.portion) {
      result.portion = '1 porción';
    }
    
    return result;
  } catch (error) {
    const { message } = parseAPIError(error);
    throw new Error(message);
  }
}

/**
 * PLAN COMPLETO - Generar meta con múltiples rutinas profesionales.
 */
export async function generateCompletePlan(params) {
  const { goals, weeks, daysPerWeek, preferences, experience } = params;

  const prompt = `Actúa como un entrenador personal profesional certificado de habla hispana.
  
  Un usuario te pide crear un PLAN DE ENTRENAMIENTO COMPLETO basado en:
  - Sus metas: "${goals}"
  - Duración del programa: ${weeks} semanas
  - Días de entrenamiento por semana: ${daysPerWeek}
  - Preferencias especiales: "${preferences || 'Ninguna en particular'}"
  - Nivel de experiencia: ${experience}

  REGLAS CRÍTICAS:
  1. Responde ÚNICAMENTE con el objeto JSON válido.
  2. TODO el texto debe estar en ESPAÑOL.
  3. NO incluyas peso (kg/lbs) en los ejercicios; el usuario lo elegirá.
  4. Crea exactamente ${daysPerWeek} rutinas diferentes, cada una enfocada en grupos musculares específicos.
  5. Cada ejercicio DEBE tener su "muscleGroup" asignado del siguiente listado exacto:
     "Pecho", "Espalda", "Hombros", "Bíceps", "Tríceps", "Piernas", "Glúteos", "Abdominales", "Cardio", "Full Body"
  6. Las rutinas deben ser profesionales y balanceadas.
  7. El campo "planName" es OBLIGATORIO y debe ser descriptivo.
  8. El array "routines" es OBLIGATORIO y debe contener exactamente ${daysPerWeek} rutinas.
  9. Cada rutina DEBE tener al menos 4 ejercicios.

  Estructura requerida:
  {
    "planName": "Nombre descriptivo del plan (OBLIGATORIO)",
    "planDescription": "Descripción del objetivo del plan en 1-2 oraciones",
    "goal": "MUSCLE_GAIN",
    "color": "#3B82F6",
    "routines": [
      {
        "name": "Nombre de la Rutina (ej: Día de Pecho y Tríceps)",
        "description": "Breve descripción del enfoque",
        "focusMuscles": ["Pecho", "Tríceps"],
        "estimatedDuration": 60,
        "exercises": [
          { 
            "name": "Nombre del ejercicio", 
            "muscleGroup": "Pecho",
            "sets": 4, 
            "reps": "10-12", 
            "restSeconds": 90
          }
        ],
        "warmup": ["Rotación de hombros", "Jumping jacks"],
        "cooldown": ["Estiramiento de pecho", "Estiramiento de tríceps"]
      }
    ]
  }`;

  try {
    const text = await callGemini(prompt);
    console.log('[AI Plan] Raw response:', text);
    const plan = parseAIResponse(text);
    
    // Validar y corregir campos obligatorios
    if (!plan.planName || typeof plan.planName !== 'string' || plan.planName.trim() === '') {
      plan.planName = `Plan de ${goals.substring(0, 30)}...`;
    }
    
    if (!plan.routines || !Array.isArray(plan.routines) || plan.routines.length === 0) {
      throw new Error('La IA no generó rutinas válidas. Intenta de nuevo con una descripción más específica.');
    }
    
    // Validar cada rutina
    plan.routines = plan.routines.map((routine, index) => {
      if (!routine.name || routine.name.trim() === '') {
        routine.name = `Rutina ${index + 1}`;
      }
      if (!routine.exercises || !Array.isArray(routine.exercises) || routine.exercises.length === 0) {
        throw new Error(`La rutina "${routine.name}" no tiene ejercicios. Intenta de nuevo.`);
      }
      return routine;
    });
    
    if (!plan.color) plan.color = '#3B82F6';
    if (!plan.goal) plan.goal = 'MUSCLE_GAIN';
    
    return plan;
  } catch (error) {
    console.error('[AI Plan] Error:', error);
    if (error.message.includes('rutina') || error.message.includes('ejercicio')) {
      throw error; // Re-throw validation errors as-is
    }
    const { message } = parseAPIError(error);
    throw new Error(message);
  }
}
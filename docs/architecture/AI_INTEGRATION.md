# FitTrack Pro - Integracion de IA con Gemini

> Arquitectura integrada con Google Gemini AI
> Version: 1.1

---

## 0. Configuracion Actual (Implementada)

**Proveedor:** Google Gemini
**Modelos disponibles:**
- `gemini-1.5-flash` - Respuestas rapidas (calculo nutricional)
- `gemini-1.5-pro` - Razonamiento complejo (planes de entrenamiento)

**Archivo de configuracion:** `src/config/gemini.js`

```javascript
// Uso basico
import { calculateNutrition, getWorkoutRecommendation } from '@/config/gemini';

// Calcular calorias de un alimento
const nutrition = await calculateNutrition('2 huevos revueltos con tostada');
// { food: '...', calories: 320, protein: 18, ... }

// Generar rutina
const workout = await getWorkoutRecommendation({
  goal: 'MUSCLE_GAIN',
  experience: 'INTERMEDIATE',
  equipment: ['barbell', 'dumbbell'],
  duration: 60,
  focusMuscles: ['CHEST', 'TRICEPS']
});
```

---

## 1. Vision General

La arquitectura esta disenada para que la IA funcione como un **microservicio separado**, permitiendo:
- Cambiar el proveedor de IA sin modificar el backend principal
- Escalar el servicio de IA independientemente
- Implementar rate limiting y optimizacion de costos
- Validar y aprobar cambios antes de aplicarlos

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                        ARQUITECTURA DE INTEGRACION IA                                   │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────────────────┐
                    │                 FRONTEND                         │
                    │  ┌───────────────┐   ┌───────────────┐          │
                    │  │ AI Nutriologo │   │ AI Entrenador │          │
                    │  │   Preview     │   │   Preview     │          │
                    │  └───────┬───────┘   └───────┬───────┘          │
                    └──────────┼───────────────────┼──────────────────┘
                               │                   │
                               ▼                   ▼
                    ┌─────────────────────────────────────────────────┐
                    │              BACKEND PRINCIPAL                   │
                    │                                                  │
                    │  ┌─────────────────────────────────────────┐    │
                    │  │           AI GATEWAY MODULE              │    │
                    │  │  - Rate Limiter                          │    │
                    │  │  - Request Queue                         │    │
                    │  │  - Response Cache                        │    │
                    │  │  - Prompt Optimizer                      │    │
                    │  └──────────────────┬──────────────────────┘    │
                    │                     │                            │
                    │  ┌──────────────────▼──────────────────────┐    │
                    │  │         AI ADAPTER INTERFACE             │    │
                    │  │  - validateRequest()                     │    │
                    │  │  - sendToAI()                            │    │
                    │  │  - sanitizeResponse()                    │    │
                    │  │  - parseToSchema()                       │    │
                    │  └──────────────────┬──────────────────────┘    │
                    └─────────────────────┼───────────────────────────┘
                                          │
                    ┌─────────────────────┼───────────────────────────┐
                    │                     │   ADAPTERS                │
                    │    ┌────────────────┼────────────────┐          │
                    │    │                │                │          │
                    │    ▼                ▼                ▼          │
                    │ ┌──────┐      ┌──────────┐     ┌──────────┐    │
                    │ │ Mock │      │  OpenAI  │     │  Custom  │    │
                    │ │(Dev) │      │ Adapter  │     │ AI Svc   │    │
                    │ └──────┘      └──────────┘     └──────────┘    │
                    │                     │                           │
                    └─────────────────────┼───────────────────────────┘
                                          │
                                          ▼
                            ┌───────────────────────────┐
                            │   MICROSERVICIO IA        │
                            │   (Futuro deployment)     │
                            │   - OpenAI API            │
                            │   - Custom models         │
                            │   - Fine-tuned models     │
                            └───────────────────────────┘
```

---

## 2. Interfaces y Contratos

### 2.1 AI Adapter Interface

```typescript
// src/adapters/ai/ai.interface.ts

export interface AIRequestContext {
  userId: string;
  requestType: AIRequestType;
  userProfile: UserProfileForAI;
  previousContext?: string[];  // Historial para contexto
}

export interface UserProfileForAI {
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  age: number;
  weight: number;
  height: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  restrictions?: string[];      // Restricciones alimenticias
  preferences?: string[];       // Preferencias
}

export enum AIRequestType {
  // Nutricion
  GENERATE_MEAL_PLAN = 'GENERATE_MEAL_PLAN',
  CALCULATE_CALORIES = 'CALCULATE_CALORIES',
  ADJUST_MEAL_PLAN = 'ADJUST_MEAL_PLAN',
  SUGGEST_ALTERNATIVES = 'SUGGEST_MEAL_ALTERNATIVES',
  
  // Entrenamiento
  GENERATE_WORKOUT_PLAN = 'GENERATE_WORKOUT_PLAN',
  EVALUATE_SESSION = 'EVALUATE_SESSION',
  SUGGEST_EXERCISE_REPLACEMENT = 'SUGGEST_EXERCISE_REPLACEMENT',
  ADJUST_WORKOUT_PLAN = 'ADJUST_WORKOUT_PLAN',
}

export interface AIRequest {
  id: string;
  context: AIRequestContext;
  type: AIRequestType;
  payload: unknown;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse<T = unknown> {
  id: string;
  requestId: string;
  success: boolean;
  data?: T;
  error?: AIError;
  usage?: AIUsageMetrics;
  cached: boolean;
}

export interface AIError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface AIUsageMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  processingTimeMs: number;
}

// Interface que deben implementar todos los adapters
export interface IAIAdapter {
  name: string;
  
  // Health check
  isAvailable(): Promise<boolean>;
  
  // Requests
  sendRequest<T>(request: AIRequest): Promise<AIResponse<T>>;
  
  // Stream (opcional)
  sendStreamRequest?<T>(
    request: AIRequest,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse<T>>;
  
  // Estimacion de costos
  estimateCost(request: AIRequest): number;
}
```

### 2.2 Response Schemas (Contratos de Respuesta)

```typescript
// src/adapters/ai/schemas/nutrition.schema.ts

import { z } from 'zod';

// Schema para comida individual
const MealItemSchema = z.object({
  name: z.string().max(100),
  portion: z.string().max(50),  // "150g", "1 taza"
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  preparationTips: z.string().optional(),
});

// Schema para dia completo
const DayMealPlanSchema = z.object({
  breakfast: z.object({
    meals: z.array(MealItemSchema),
    totalCalories: z.number(),
  }),
  morningSnack: z.object({
    meals: z.array(MealItemSchema),
    totalCalories: z.number(),
  }).optional(),
  lunch: z.object({
    meals: z.array(MealItemSchema),
    totalCalories: z.number(),
  }),
  afternoonSnack: z.object({
    meals: z.array(MealItemSchema),
    totalCalories: z.number(),
  }).optional(),
  dinner: z.object({
    meals: z.array(MealItemSchema),
    totalCalories: z.number(),
  }),
});

// Schema para plan semanal
export const WeeklyMealPlanSchema = z.object({
  monday: DayMealPlanSchema,
  tuesday: DayMealPlanSchema,
  wednesday: DayMealPlanSchema,
  thursday: DayMealPlanSchema,
  friday: DayMealPlanSchema,
  saturday: DayMealPlanSchema,
  sunday: DayMealPlanSchema,
  
  summary: z.object({
    averageDailyCalories: z.number(),
    averageProtein: z.number(),
    averageCarbs: z.number(),
    averageFat: z.number(),
    estimatedWeeklyCost: z.number().optional(),
    shoppingList: z.array(z.string()).optional(),
  }),
  
  notes: z.string().optional(),
});

// Schema para calculo de calorias de alimento
export const CalorieCalculationSchema = z.object({
  food: z.string(),
  estimatedPortion: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  confidence: z.number().min(0).max(1),  // 0-1 confianza del calculo
  sources: z.array(z.string()).optional(),
});

export type WeeklyMealPlan = z.infer<typeof WeeklyMealPlanSchema>;
export type CalorieCalculation = z.infer<typeof CalorieCalculationSchema>;
```

```typescript
// src/adapters/ai/schemas/workout.schema.ts

import { z } from 'zod';

const ExerciseSchema = z.object({
  exerciseId: z.string(),
  name: z.string(),
  sets: z.number().min(1).max(10),
  reps: z.string(),  // "8-12" o "12"
  restSeconds: z.number().min(0).max(600),
  notes: z.string().optional(),
  order: z.number(),
});

const WorkoutDaySchema = z.object({
  name: z.string(),
  targetMuscles: z.array(z.string()),
  exercises: z.array(ExerciseSchema),
  estimatedDuration: z.number(),
  warmup: z.string().optional(),
  cooldown: z.string().optional(),
});

export const WorkoutPlanSchema = z.object({
  name: z.string(),
  description: z.string(),
  daysPerWeek: z.number().min(1).max(7),
  goal: z.string(),
  
  schedule: z.array(z.object({
    dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
    workout: WorkoutDaySchema.nullable(),  // null = dia de descanso
  })),
  
  progressionNotes: z.string().optional(),
  warnings: z.array(z.string()).optional(),
});

export const SessionEvaluationSchema = z.object({
  score: z.number().min(0).max(100),
  
  analysis: z.object({
    volumeProgress: z.enum(['improved', 'maintained', 'declined']),
    intensityLevel: z.enum(['too_low', 'optimal', 'too_high']),
    restAdequacy: z.enum(['too_short', 'optimal', 'too_long']),
  }),
  
  suggestions: z.array(z.object({
    type: z.enum(['technique', 'volume', 'intensity', 'rest', 'nutrition']),
    message: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
  })),
  
  nextSessionRecommendations: z.string().optional(),
});

export const ExerciseReplacementSchema = z.object({
  originalExercise: z.string(),
  reason: z.string(),
  
  alternatives: z.array(z.object({
    exerciseId: z.string(),
    name: z.string(),
    similarity: z.number().min(0).max(1),  // Que tan similar es
    muscleOverlap: z.array(z.string()),
    equipmentNeeded: z.array(z.string()),
    difficulty: z.string(),
    notes: z.string().optional(),
  })).min(1).max(5),
});

export type WorkoutPlan = z.infer<typeof WorkoutPlanSchema>;
export type SessionEvaluation = z.infer<typeof SessionEvaluationSchema>;
export type ExerciseReplacement = z.infer<typeof ExerciseReplacementSchema>;
```

---

## 3. AI Gateway Service

```typescript
// src/modules/ai/ai.gateway.ts

import { redis } from '@/config/redis';
import { IAIAdapter, AIRequest, AIResponse } from '@/adapters/ai/ai.interface';
import { createHash } from 'crypto';

interface GatewayConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerDay: number;
  cacheTTL: number;
  retryAttempts: number;
  timeout: number;
}

export class AIGateway {
  private adapter: IAIAdapter;
  private config: GatewayConfig;
  private requestQueue: Map<string, Promise<any>> = new Map();
  
  constructor(adapter: IAIAdapter, config: Partial<GatewayConfig> = {}) {
    this.adapter = adapter;
    this.config = {
      maxRequestsPerMinute: 10,
      maxRequestsPerDay: 100,
      cacheTTL: 86400,  // 24 horas
      retryAttempts: 2,
      timeout: 30000,
      ...config,
    };
  }
  
  async sendRequest<T>(request: AIRequest): Promise<AIResponse<T>> {
    const userId = request.context.userId;
    
    // 1. Verificar rate limits
    await this.checkRateLimits(userId);
    
    // 2. Verificar cache
    const cacheKey = this.generateCacheKey(request);
    const cached = await this.getFromCache<T>(cacheKey);
    if (cached) {
      return { ...cached, cached: true };
    }
    
    // 3. Deduplicar requests identicos en vuelo
    const existingRequest = this.requestQueue.get(cacheKey);
    if (existingRequest) {
      return existingRequest;
    }
    
    // 4. Enviar request
    const requestPromise = this.executeRequest<T>(request, cacheKey);
    this.requestQueue.set(cacheKey, requestPromise);
    
    try {
      const response = await requestPromise;
      return response;
    } finally {
      this.requestQueue.delete(cacheKey);
    }
  }
  
  private async executeRequest<T>(
    request: AIRequest,
    cacheKey: string
  ): Promise<AIResponse<T>> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        // Timeout wrapper
        const response = await Promise.race([
          this.adapter.sendRequest<T>(request),
          this.timeout(this.config.timeout),
        ]) as AIResponse<T>;
        
        if (response.success && response.data) {
          // Guardar en cache
          await this.saveToCache(cacheKey, response);
          
          // Incrementar contadores
          await this.incrementUsage(request.context.userId, response.usage);
        }
        
        return { ...response, cached: false };
        
      } catch (error) {
        lastError = error as Error;
        
        // Esperar antes de reintentar
        if (attempt < this.config.retryAttempts) {
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }
    
    return {
      id: '',
      requestId: request.id,
      success: false,
      error: {
        code: 'MAX_RETRIES_EXCEEDED',
        message: lastError?.message || 'Unknown error',
        retryable: false,
      },
      cached: false,
    };
  }
  
  private async checkRateLimits(userId: string): Promise<void> {
    const minuteKey = `ai:ratelimit:${userId}:minute`;
    const dayKey = `ai:ratelimit:${userId}:day`;
    
    const [minuteCount, dayCount] = await Promise.all([
      redis.get(minuteKey),
      redis.get(dayKey),
    ]);
    
    if (parseInt(minuteCount || '0') >= this.config.maxRequestsPerMinute) {
      throw new Error('RATE_LIMIT_MINUTE');
    }
    
    if (parseInt(dayCount || '0') >= this.config.maxRequestsPerDay) {
      throw new Error('RATE_LIMIT_DAY');
    }
    
    // Incrementar contadores
    await Promise.all([
      redis.incr(minuteKey),
      redis.expire(minuteKey, 60),
      redis.incr(dayKey),
      redis.expire(dayKey, 86400),
    ]);
  }
  
  private generateCacheKey(request: AIRequest): string {
    // Crear hash del request para cache
    const payload = JSON.stringify({
      type: request.type,
      payload: request.payload,
      userId: request.context.userId,
    });
    
    return `ai:cache:${createHash('md5').update(payload).digest('hex')}`;
  }
  
  private async getFromCache<T>(key: string): Promise<AIResponse<T> | null> {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  private async saveToCache<T>(key: string, response: AIResponse<T>): Promise<void> {
    await redis.setex(key, this.config.cacheTTL, JSON.stringify(response));
  }
  
  private async incrementUsage(userId: string, usage?: any): Promise<void> {
    if (!usage) return;
    
    // Guardar metricas de uso
    const key = `ai:usage:${userId}:${new Date().toISOString().split('T')[0]}`;
    await redis.hincrby(key, 'requests', 1);
    await redis.hincrby(key, 'tokens', usage.totalTokens || 0);
    await redis.expire(key, 86400 * 30);  // 30 dias
  }
  
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), ms);
    });
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 4. Prompt Optimization

### 4.1 Prompt Templates

```typescript
// src/adapters/ai/prompts/nutrition.prompts.ts

export const nutritionPrompts = {
  generateMealPlan: (context: NutritionPlanContext) => `
Eres un nutriologo profesional. Genera un plan alimenticio semanal personalizado.

PERFIL DEL USUARIO:
- Genero: ${context.gender}
- Edad: ${context.age} anos
- Peso actual: ${context.weight} kg
- Altura: ${context.height} cm
- Nivel de actividad: ${context.activityLevel}
- Objetivo: ${context.goal}
- TDEE calculado: ${context.tdee} calorias/dia
- Calorias objetivo: ${context.targetCalories} calorias/dia

RESTRICCIONES:
${context.restrictions?.length ? context.restrictions.join('\n') : 'Ninguna'}

PRESUPUESTO SEMANAL: ${context.budget ? `$${context.budget}` : 'Sin limite'}

INGREDIENTES DISPONIBLES:
${context.ingredients?.join(', ') || 'Cualquiera'}

INSTRUCCIONES:
1. Crea un plan de 7 dias
2. Incluye 3 comidas principales y 2 snacks opcionales
3. Cada comida debe tener: nombre, porcion, calorias, proteina, carbohidratos, grasa
4. El total diario debe acercarse a ${context.targetCalories} calorias
5. Prioriza variedad y practicidad
6. Si hay presupuesto, sugiere opciones economicas

RESPONDE UNICAMENTE EN FORMATO JSON siguiendo este schema exacto:
${JSON.stringify(WeeklyMealPlanSchema.shape, null, 2)}
`,

  calculateCalories: (food: string, portion?: string) => `
Calcula la informacion nutricional de este alimento.

ALIMENTO: ${food}
PORCION: ${portion || 'porcion tipica'}

Responde SOLO en formato JSON:
{
  "food": "nombre del alimento",
  "estimatedPortion": "porcion estimada (ej: 150g, 1 taza)",
  "calories": numero,
  "protein": gramos,
  "carbs": gramos,
  "fat": gramos,
  "confidence": 0.0-1.0,
  "sources": ["fuente de datos"]
}
`,

  adjustMealPlan: (context: AdjustmentContext) => `
El usuario no pudo seguir el plan original. Ajusta el plan semanal.

COMIDA OMITIDA/CAMBIADA:
- Dia: ${context.day}
- Comida original: ${context.originalMeal}
- Lo que comio en su lugar: ${context.actualMeal}
- Calorias estimadas de lo que comio: ${context.actualCalories}

CALORIAS RESTANTES DEL DIA: ${context.remainingCalories}

PLAN ACTUAL:
${JSON.stringify(context.currentPlan)}

Sugiere ajustes para:
1. Compensar las calorias faltantes o excedentes
2. Mantener el balance de macros
3. Las comidas restantes del dia o dias siguientes

Responde en JSON con los cambios sugeridos.
`,
};
```

### 4.2 Optimizacion de Costos

```typescript
// src/adapters/ai/prompts/optimizer.ts

export class PromptOptimizer {
  // Comprimir prompt removiendo whitespace innecesario
  compress(prompt: string): string {
    return prompt
      .replace(/\s+/g, ' ')
      .replace(/\n\s*/g, '\n')
      .trim();
  }
  
  // Estimar tokens (aproximado)
  estimateTokens(text: string): number {
    // Aproximacion: ~4 caracteres = 1 token
    return Math.ceil(text.length / 4);
  }
  
  // Determinar si usar cache
  shouldUseCache(request: AIRequest): boolean {
    // No cachear requests muy personalizados
    const nonCacheableTypes = [
      AIRequestType.EVALUATE_SESSION,  // Cada sesion es unica
    ];
    
    return !nonCacheableTypes.includes(request.type);
  }
  
  // Seleccionar modelo apropiado
  selectModel(request: AIRequest): string {
    const estimatedTokens = this.estimateTokens(JSON.stringify(request.payload));
    
    // Usar modelo simple para tareas sencillas
    if (request.type === AIRequestType.CALCULATE_CALORIES) {
      return 'gpt-3.5-turbo';  // Mas barato
    }
    
    // Usar modelo avanzado para planes complejos
    if (request.type === AIRequestType.GENERATE_MEAL_PLAN || 
        request.type === AIRequestType.GENERATE_WORKOUT_PLAN) {
      return 'gpt-4';  // Mejor calidad
    }
    
    return 'gpt-3.5-turbo';
  }
  
  // Simplificar contexto de usuario
  simplifyUserContext(profile: UserProfileForAI): UserProfileForAI {
    // Remover datos innecesarios segun el tipo de request
    return {
      gender: profile.gender,
      age: profile.age,
      weight: Math.round(profile.weight),
      height: Math.round(profile.height),
      activityLevel: profile.activityLevel,
      goal: profile.goal,
      // Solo incluir restricciones si existen
      ...(profile.restrictions?.length && { restrictions: profile.restrictions }),
    };
  }
}

export const promptOptimizer = new PromptOptimizer();
```

---

## 5. Sistema de Aprobacion

### 5.1 Flow de Aprobacion

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         FLUJO DE APROBACION DE CAMBIOS IA                               │
└─────────────────────────────────────────────────────────────────────────────────────────┘

  ┌──────────┐        ┌──────────┐        ┌──────────┐        ┌──────────┐
  │ Request  │───────▶│    IA    │───────▶│ Validar  │───────▶│ Preview  │
  │ Usuario  │        │ Genera   │        │ Response │        │ Frontend │
  └──────────┘        └──────────┘        └──────────┘        └──────────┘
                                                                    │
                                                                    ▼
  ┌──────────┐        ┌──────────┐        ┌──────────┐        ┌──────────┐
  │ Aplicar  │◀───────│ Guardar  │◀───────│  APROBAR │◀───────│ Usuario  │
  │ a DB     │        │ en DB    │        │    O     │        │ Revisa   │
  └──────────┘        └──────────┘        │ RECHAZAR │        └──────────┘
                                          └──────────┘
                                               │
                                               │ RECHAZAR
                                               ▼
                                          ┌──────────┐
                                          │ Descartar│
                                          │ Plan     │
                                          └──────────┘
```

### 5.2 Componente de Preview (Frontend)

```typescript
// src/features/ai/components/AIPlanPreview.jsx

import { useState } from 'react';
import { FiCheck, FiX, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi } from '../services/aiApi';

export function AIPlanPreview({ planId, type, planData, onClose }) {
  const queryClient = useQueryClient();
  const [showDetails, setShowDetails] = useState(false);
  
  const approveMutation = useMutation({
    mutationFn: () => aiApi.approvePlan(planId),
    onSuccess: () => {
      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ['nutrition', 'plans'] });
      queryClient.invalidateQueries({ queryKey: ['workouts', 'routines'] });
      onClose();
    },
  });
  
  const rejectMutation = useMutation({
    mutationFn: (reason) => aiApi.rejectPlan(planId, reason),
    onSuccess: onClose,
  });
  
  return (
    <div className="ai-preview-modal">
      <header className="flex items-center gap-2 p-4 border-b">
        <FiInfo className="text-blue-500" />
        <h2 className="text-lg font-semibold">
          Plan generado por IA - Revision requerida
        </h2>
      </header>
      
      <div className="p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <FiAlertTriangle />
            <span className="font-medium">
              Revisa el plan antes de aprobarlo
            </span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            Los cambios solo se aplicaran despues de tu aprobacion.
          </p>
        </div>
        
        {/* Renderizar preview segun tipo */}
        {type === 'NUTRITION_PLAN' && (
          <NutritionPlanPreview data={planData} />
        )}
        
        {type === 'WORKOUT_PLAN' && (
          <WorkoutPlanPreview data={planData} />
        )}
        
        {/* Detalles tecnicos (colapsable) */}
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-gray-500 mt-4"
        >
          {showDetails ? 'Ocultar' : 'Ver'} detalles tecnicos
        </button>
        
        {showDetails && (
          <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-40">
            {JSON.stringify(planData, null, 2)}
          </pre>
        )}
      </div>
      
      <footer className="flex justify-end gap-3 p-4 border-t">
        <button
          onClick={() => rejectMutation.mutate('Usuario rechazo el plan')}
          disabled={rejectMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
        >
          <FiX />
          Rechazar
        </button>
        
        <button
          onClick={() => approveMutation.mutate()}
          disabled={approveMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <FiCheck />
          {approveMutation.isPending ? 'Aplicando...' : 'Aprobar y Aplicar'}
        </button>
      </footer>
    </div>
  );
}
```

### 5.3 Backend - Controller de Aprobacion

```typescript
// src/modules/ai/ai.controller.ts

import { Request, Response } from 'express';
import { aiService } from './ai.service';
import { AIChangeStatus } from '@prisma/client';

export const aiController = {
  // Aprobar plan generado por IA
  async approvePlan(req: Request, res: Response) {
    const { planId } = req.params;
    const userId = req.user.id;
    
    // Verificar que el plan pertenece al usuario y esta pendiente
    const plan = await prisma.aIChangeLog.findFirst({
      where: {
        id: planId,
        userId,
        status: AIChangeStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });
    
    if (!plan) {
      return res.status(404).json({ 
        error: 'Plan not found or expired' 
      });
    }
    
    // Aplicar cambios segun el tipo
    const result = await aiService.applyPlanChanges(plan);
    
    // Marcar como aprobado
    await prisma.aIChangeLog.update({
      where: { id: planId },
      data: {
        status: AIChangeStatus.APPROVED,
        approvedAt: new Date(),
        appliedAt: new Date(),
      },
    });
    
    // Invalidar cache del usuario
    await cacheService.invalidateUser(userId);
    
    res.json({ 
      success: true, 
      message: 'Plan applied successfully',
      result 
    });
  },
  
  // Rechazar plan
  async rejectPlan(req: Request, res: Response) {
    const { planId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;
    
    await prisma.aIChangeLog.update({
      where: { 
        id: planId,
        userId,
        status: AIChangeStatus.PENDING,
      },
      data: {
        status: AIChangeStatus.REJECTED,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });
    
    res.json({ success: true, message: 'Plan rejected' });
  },
  
  // Obtener planes pendientes
  async getPendingPlans(req: Request, res: Response) {
    const userId = req.user.id;
    
    const plans = await prisma.aIChangeLog.findMany({
      where: {
        userId,
        status: AIChangeStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json(plans);
  },
};
```

---

## 6. Mock Adapter para Desarrollo

```typescript
// src/adapters/ai/mock.adapter.ts

import { IAIAdapter, AIRequest, AIResponse } from './ai.interface';
import { WeeklyMealPlan, WorkoutPlan } from './schemas';

export class MockAIAdapter implements IAIAdapter {
  name = 'MockAI';
  
  async isAvailable(): Promise<boolean> {
    return true;
  }
  
  async sendRequest<T>(request: AIRequest): Promise<AIResponse<T>> {
    // Simular delay de red
    await this.sleep(500 + Math.random() * 1000);
    
    let data: unknown;
    
    switch (request.type) {
      case 'GENERATE_MEAL_PLAN':
        data = this.generateMockMealPlan(request);
        break;
      case 'CALCULATE_CALORIES':
        data = this.generateMockCalorieCalc(request);
        break;
      case 'GENERATE_WORKOUT_PLAN':
        data = this.generateMockWorkoutPlan(request);
        break;
      default:
        data = { message: 'Mock response' };
    }
    
    return {
      id: `mock-${Date.now()}`,
      requestId: request.id,
      success: true,
      data: data as T,
      usage: {
        promptTokens: 100,
        completionTokens: 500,
        totalTokens: 600,
        estimatedCost: 0.01,
        processingTimeMs: 750,
      },
      cached: false,
    };
  }
  
  estimateCost(request: AIRequest): number {
    return 0.01;
  }
  
  private generateMockMealPlan(request: AIRequest): WeeklyMealPlan {
    // Generar plan mock basado en los parametros
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    const schedule: any = {};
    for (const day of days) {
      schedule[day] = {
        breakfast: {
          meals: [
            { name: 'Avena con frutas', portion: '250g', calories: 350, protein: 12, carbs: 60, fat: 8 },
          ],
          totalCalories: 350,
        },
        lunch: {
          meals: [
            { name: 'Pollo con arroz', portion: '300g', calories: 550, protein: 40, carbs: 50, fat: 15 },
          ],
          totalCalories: 550,
        },
        dinner: {
          meals: [
            { name: 'Salmon con verduras', portion: '250g', calories: 450, protein: 35, carbs: 20, fat: 25 },
          ],
          totalCalories: 450,
        },
      };
    }
    
    return {
      ...schedule,
      summary: {
        averageDailyCalories: 1350,
        averageProtein: 87,
        averageCarbs: 130,
        averageFat: 48,
      },
    };
  }
  
  private generateMockCalorieCalc(request: AIRequest): any {
    return {
      food: request.payload.food,
      estimatedPortion: '150g',
      calories: Math.floor(150 + Math.random() * 200),
      protein: Math.floor(10 + Math.random() * 20),
      carbs: Math.floor(20 + Math.random() * 30),
      fat: Math.floor(5 + Math.random() * 15),
      confidence: 0.85,
    };
  }
  
  private generateMockWorkoutPlan(request: AIRequest): WorkoutPlan {
    return {
      name: 'Plan de Entrenamiento Personalizado',
      description: 'Plan generado basado en tus objetivos',
      daysPerWeek: 4,
      goal: 'Hipertrofia muscular',
      schedule: [
        {
          dayOfWeek: 'monday',
          workout: {
            name: 'Pecho y Triceps',
            targetMuscles: ['chest', 'triceps'],
            exercises: [
              { exerciseId: 'bench-press', name: 'Press de banca', sets: 4, reps: '8-12', restSeconds: 90, order: 0 },
              { exerciseId: 'incline-press', name: 'Press inclinado', sets: 3, reps: '10-12', restSeconds: 60, order: 1 },
            ],
            estimatedDuration: 60,
          },
        },
        { dayOfWeek: 'tuesday', workout: null },
        // ... mas dias
      ],
    };
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 7. Metricas y Monitoreo

```typescript
// src/modules/ai/ai.metrics.ts

import { redis } from '@/config/redis';

export const aiMetrics = {
  // Obtener uso del usuario
  async getUserUsage(userId: string): Promise<UserAIUsage> {
    const today = new Date().toISOString().split('T')[0];
    const key = `ai:usage:${userId}:${today}`;
    
    const data = await redis.hgetall(key);
    
    return {
      requestsToday: parseInt(data.requests || '0'),
      tokensToday: parseInt(data.tokens || '0'),
      estimatedCostToday: (parseInt(data.tokens || '0') / 1000) * 0.002,
    };
  },
  
  // Obtener estadisticas globales
  async getGlobalStats(): Promise<GlobalAIStats> {
    const keys = await redis.keys('ai:usage:*');
    
    let totalRequests = 0;
    let totalTokens = 0;
    
    for (const key of keys) {
      const data = await redis.hgetall(key);
      totalRequests += parseInt(data.requests || '0');
      totalTokens += parseInt(data.tokens || '0');
    }
    
    return {
      totalRequests,
      totalTokens,
      estimatedCost: (totalTokens / 1000) * 0.002,
    };
  },
  
  // Registrar evento
  async logEvent(event: AIEvent): Promise<void> {
    const key = `ai:events:${Date.now()}`;
    await redis.setex(key, 86400 * 7, JSON.stringify(event));
  },
};

interface UserAIUsage {
  requestsToday: number;
  tokensToday: number;
  estimatedCostToday: number;
}

interface GlobalAIStats {
  totalRequests: number;
  totalTokens: number;
  estimatedCost: number;
}

interface AIEvent {
  type: 'request' | 'success' | 'error' | 'approval' | 'rejection';
  userId: string;
  requestType: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}
```

---

## 8. Estrategias de Optimizacion de Costos

| Estrategia | Descripcion | Ahorro Estimado |
|------------|-------------|-----------------|
| **Cache de respuestas** | Cachear respuestas similares | 40-60% |
| **Modelo apropiado** | GPT-3.5 para tareas simples | 30-50% |
| **Compresion de prompts** | Remover whitespace, simplificar | 10-20% |
| **Deduplicacion** | No procesar requests duplicados | 5-15% |
| **Rate limiting** | Limitar requests por usuario | Variable |
| **Logica deterministica** | Usar calculos locales cuando sea posible | 50-70% |

### 8.1 Cuando NO usar IA

```typescript
// src/features/nutrition/utils/calculations.ts

// Estos calculos son deterministicos - NO necesitan IA

export function calculateBMI(weight: number, height: number): number {
  const heightM = height / 100;
  return weight / (heightM * heightM);
}

export function calculateTDEE(
  weight: number,
  height: number,
  age: number,
  gender: 'MALE' | 'FEMALE',
  activityLevel: ActivityLevel
): number {
  // Harris-Benedict equation
  let bmr: number;
  
  if (gender === 'MALE') {
    bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else {
    bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  }
  
  const multipliers = {
    SEDENTARY: 1.2,
    LIGHTLY_ACTIVE: 1.375,
    MODERATELY_ACTIVE: 1.55,
    VERY_ACTIVE: 1.725,
    EXTRA_ACTIVE: 1.9,
  };
  
  return Math.round(bmr * multipliers[activityLevel]);
}

export function calculateMacros(
  calories: number,
  goal: Goal
): { protein: number; carbs: number; fat: number } {
  // Ratios predefinidos por objetivo
  const ratios = {
    WEIGHT_LOSS: { protein: 0.35, carbs: 0.35, fat: 0.30 },
    MUSCLE_GAIN: { protein: 0.30, carbs: 0.45, fat: 0.25 },
    MAINTENANCE: { protein: 0.25, carbs: 0.50, fat: 0.25 },
    RECOMPOSITION: { protein: 0.35, carbs: 0.40, fat: 0.25 },
  };
  
  const r = ratios[goal];
  
  return {
    protein: Math.round((calories * r.protein) / 4),  // 4 cal/g
    carbs: Math.round((calories * r.carbs) / 4),      // 4 cal/g
    fat: Math.round((calories * r.fat) / 9),          // 9 cal/g
  };
}

export function calculateWaterIntake(weight: number): number {
  // 35ml por kg de peso
  return Math.round(weight * 35);
}
```

---

## 9. Checklist para Conectar IA

Cuando llegue el momento de conectar la IA real:

```markdown
 # Checklist Integracion IA

 ## 1. Configuracion
 - [ ] Obtener API keys del proveedor
 - [ ] Configurar variables de entorno
 - [ ] Implementar adapter real (ej: OpenAIAdapter)
 - [ ] Configurar rate limits segun plan

 ## 2. Testing
 - [ ] Probar con mock adapter primero
 - [ ] Validar schemas de respuesta
 - [ ] Probar casos de error
 - [ ] Verificar cache funciona

 ## 3. Seguridad
 - [ ] Sanitizar todas las respuestas
 - [ ] Validar JSON contra schemas
 - [ ] Implementar timeout
 - [ ] Configurar retry con backoff

 ## 4. Monitoreo
 - [ ] Configurar alertas de costos
 - [ ] Dashboard de uso
 - [ ] Logs de errores
 - [ ] Metricas de latencia

 ## 5. Rollout
 - [ ] Feature flag para habilitar gradualmente
 - [ ] A/B testing de prompts
 - [ ] Feedback de usuarios
 - [ ] Ajustar rate limits segun uso real
```

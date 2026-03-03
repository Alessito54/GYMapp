# FitTrack Pro - Diseno de Base de Datos

> Esquema PostgreSQL + Prisma ORM
> Version: 1.0

---

## 1. Diagrama Entidad-Relacion

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              DIAGRAMA ENTIDAD-RELACION                                  │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────────┐
                                    │      USERS      │
                                    │─────────────────│
                                    │ id (PK)         │
                                    │ firebaseUid     │
                                    │ email           │
                                    │ name            │
                                    │ gender          │
                                    │ birthDate       │
                                    │ weight          │
                                    │ height          │
                                    │ activityLevel   │
                                    │ goal            │
                                    │ profileImageUrl │
                                    │ settings (JSON) │
                                    │ createdAt       │
                                    │ updatedAt       │
                                    └────────┬────────┘
                                             │
           ┌─────────────────────────────────┼─────────────────────────────────┐
           │                                 │                                 │
           ▼                                 ▼                                 ▼
┌─────────────────────┐         ┌─────────────────────┐         ┌─────────────────────┐
│   NUTRITION_PLANS   │         │   WORKOUT_FOLDERS   │         │    WATER_LOGS       │
│─────────────────────│         │─────────────────────│         │─────────────────────│
│ id (PK)             │         │ id (PK)             │         │ id (PK)             │
│ userId (FK)         │         │ userId (FK)         │         │ userId (FK)         │
│ name                │         │ name                │         │ date                │
│ type (enum)         │         │ goal                │         │ targetMl            │
│ targetCalories      │         │ color               │         │ consumedMl          │
│ targetProtein       │         │ order               │         │ glassSize           │
│ targetCarbs         │         │ createdAt           │         │ entries (JSON)      │
│ targetFat           │         │ updatedAt           │         │ createdAt           │
│ budget              │         └──────────┬──────────┘         └─────────────────────┘
│ ingredients (JSON)  │                    │
│ weeklyPlan (JSON)   │                    ▼
│ aiGenerated         │         ┌─────────────────────┐
│ approvedAt          │         │      ROUTINES       │
│ createdAt           │         │─────────────────────│
│ updatedAt           │         │ id (PK)             │
└──────────┬──────────┘         │ folderId (FK)       │
           │                    │ userId (FK)         │
           ▼                    │ name                │
┌─────────────────────┐         │ description         │
│      MEAL_LOGS      │         │ targetMuscles[]     │
│─────────────────────│         │ estimatedDuration   │
│ id (PK)             │         │ restTime (default)  │
│ userId (FK)         │         │ order               │
│ planId (FK)?        │         │ exercises (JSON)    │
│ date                │         │ aiGenerated         │
│ mealType (enum)     │         │ createdAt           │
│ foods (JSON)        │         │ updatedAt           │
│ totalCalories       │         └──────────┬──────────┘
│ totalProtein        │                    │
│ totalCarbs          │                    ▼
│ totalFat            │         ┌─────────────────────┐
│ aiAssistedCalc      │         │   WORKOUT_SESSIONS  │
│ notes               │         │─────────────────────│
│ createdAt           │         │ id (PK)             │
└─────────────────────┘         │ userId (FK)         │
                                │ routineId (FK)      │
                                │ date                │
                                │ startTime           │
                                │ endTime             │
                                │ totalDuration       │
                                │ restDuration        │
                                │ trainingDuration    │
                                │ caloriesBurned      │
                                │ exercises (JSON)    │
                                │ feedback            │
                                │ rating (1-5)        │
                                │ imageUrl            │
                                │ aiScore             │
                                │ notes               │
                                │ createdAt           │
                                └─────────────────────┘

┌─────────────────────┐         ┌─────────────────────┐
│  EXERCISE_CATALOG   │         │   AI_CHANGE_LOG     │
│─────────────────────│         │─────────────────────│
│ id (PK)             │         │ id (PK)             │
│ name                │         │ userId (FK)         │
│ muscleGroup         │         │ type (enum)         │
│ equipment           │         │ requestPayload(JSON)│
│ difficulty          │         │ responsePayload(JSON│
│ instructions (JSON) │         │ status (enum)       │
│ videoUrl            │         │ approvedAt          │
│ imageUrl            │         │ rejectedAt          │
│ calories/min        │         │ appliedAt           │
│ alternatives[]      │         │ createdAt           │
│ tags[]              │         └─────────────────────┘
│ isCustom            │
│ createdBy (FK)?     │         ┌─────────────────────┐
│ createdAt           │         │    DAILY_METRICS    │
└─────────────────────┘         │─────────────────────│
                                │ id (PK)             │
                                │ userId (FK)         │
                                │ date (unique/user)  │
                                │ weight              │
                                │ caloriesConsumed    │
                                │ caloriesBurned      │
                                │ waterConsumed       │
                                │ workoutCompleted    │
                                │ sleepHours          │
                                │ notes               │
                                │ createdAt           │
                                │ updatedAt           │
                                └─────────────────────┘
```

---

## 2. Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==========================================
// ENUMS
// ==========================================

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum ActivityLevel {
  SEDENTARY
  LIGHTLY_ACTIVE
  MODERATELY_ACTIVE
  VERY_ACTIVE
  EXTRA_ACTIVE
}

enum Goal {
  WEIGHT_LOSS      // Definicion
  MUSCLE_GAIN      // Volumen
  MAINTENANCE      // Reposicion
  RECOMPOSITION    // Recomposicion corporal
}

enum MealType {
  BREAKFAST
  MORNING_SNACK
  LUNCH
  AFTERNOON_SNACK
  DINNER
  EVENING_SNACK
}

enum PlanType {
  WEIGHT_LOSS
  MUSCLE_GAIN
  MAINTENANCE
}

enum MuscleGroup {
  CHEST
  BACK
  SHOULDERS
  BICEPS
  TRICEPS
  FOREARMS
  ABS
  QUADRICEPS
  HAMSTRINGS
  GLUTES
  CALVES
  FULL_BODY
  CARDIO
}

enum Difficulty {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
}

enum AIChangeType {
  NUTRITION_PLAN
  WORKOUT_PLAN
  EXERCISE_REPLACEMENT
  MEAL_ADJUSTMENT
}

enum AIChangeStatus {
  PENDING
  APPROVED
  REJECTED
  EXPIRED
}

// ==========================================
// MODELS
// ==========================================

model User {
  id              String    @id @default(cuid())
  firebaseUid     String    @unique
  email           String    @unique
  name            String
  gender          Gender?
  birthDate       DateTime?
  weight          Float?    // kg
  height          Float?    // cm
  activityLevel   ActivityLevel @default(MODERATELY_ACTIVE)
  goal            Goal      @default(MAINTENANCE)
  profileImageUrl String?
  
  // Configuraciones del usuario en JSON flexible
  settings        Json      @default("{}")
  // Ejemplo settings:
  // {
  //   "waterReminder": { "enabled": true, "intervalMinutes": 60 },
  //   "units": { "weight": "kg", "height": "cm" },
  //   "notifications": { "email": true, "push": true },
  //   "theme": "dark"
  // }
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Relaciones
  nutritionPlans  NutritionPlan[]
  mealLogs        MealLog[]
  workoutFolders  WorkoutFolder[]
  routines        Routine[]
  workoutSessions WorkoutSession[]
  waterLogs       WaterLog[]
  dailyMetrics    DailyMetric[]
  aiChangeLogs    AIChangeLog[]
  customExercises ExerciseCatalog[] @relation("CreatedExercises")
  
  @@index([firebaseUid])
  @@index([email])
}

model NutritionPlan {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name            String
  type            PlanType
  
  // Objetivos diarios calculados
  targetCalories  Int
  targetProtein   Float     // gramos
  targetCarbs     Float     // gramos
  targetFat       Float     // gramos
  
  budget          Float?    // presupuesto semanal
  
  // Ingredientes disponibles/preferidos (flexible)
  ingredients     Json      @default("[]")
  // Ejemplo: ["pollo", "arroz", "brocoli", "huevos"]
  
  // Plan semanal generado (puede ser por IA)
  weeklyPlan      Json      @default("{}")
  // Ejemplo estructura:
  // {
  //   "monday": {
  //     "breakfast": { "foods": [...], "calories": 400 },
  //     "lunch": { "foods": [...], "calories": 600 },
  //     ...
  //   },
  //   ...
  // }
  
  aiGenerated     Boolean   @default(false)
  approvedAt      DateTime? // Cuando el usuario aprobo el plan IA
  
  isActive        Boolean   @default(true)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  mealLogs        MealLog[]
  
  @@index([userId])
  @@index([userId, isActive])
}

model MealLog {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  planId          String?
  plan            NutritionPlan? @relation(fields: [planId], references: [id])
  
  date            DateTime  @db.Date
  mealType        MealType
  
  // Alimentos consumidos
  foods           Json      @default("[]")
  // Ejemplo:
  // [
  //   { "name": "Pollo a la plancha", "grams": 150, "calories": 248, "protein": 46, "carbs": 0, "fat": 5.4 },
  //   { "name": "Arroz blanco", "grams": 100, "calories": 130, "protein": 2.7, "carbs": 28, "fat": 0.3 }
  // ]
  
  // Totales calculados
  totalCalories   Int       @default(0)
  totalProtein    Float     @default(0)
  totalCarbs      Float     @default(0)
  totalFat        Float     @default(0)
  
  aiAssistedCalc  Boolean   @default(false) // Si IA ayudo a calcular calorias
  notes           String?
  
  createdAt       DateTime  @default(now())
  
  @@unique([userId, date, mealType])
  @@index([userId, date])
}

model WorkoutFolder {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name            String
  goal            Goal?
  color           String    @default("#3B82F6") // Color para UI
  order           Int       @default(0)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  routines        Routine[]
  
  @@index([userId])
}

model Routine {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  folderId        String?
  folder          WorkoutFolder? @relation(fields: [folderId], references: [id], onDelete: SetNull)
  
  name            String
  description     String?
  targetMuscles   MuscleGroup[]
  
  estimatedDuration Int     @default(60) // minutos
  defaultRestTime   Int     @default(90) // segundos
  
  order           Int       @default(0)
  
  // Ejercicios de la rutina
  exercises       Json      @default("[]")
  // Ejemplo estructura:
  // [
  //   {
  //     "exerciseId": "cuid...",
  //     "name": "Press de banca",
  //     "sets": 4,
  //     "reps": "8-12",
  //     "weight": 60,
  //     "restTime": 90,
  //     "notes": "Control en la bajada",
  //     "order": 0
  //   },
  //   ...
  // ]
  
  aiGenerated     Boolean   @default(false)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  sessions        WorkoutSession[]
  
  @@index([userId])
  @@index([folderId])
}

model WorkoutSession {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  routineId       String?
  routine         Routine?  @relation(fields: [routineId], references: [id], onDelete: SetNull)
  
  date            DateTime  @db.Date
  startTime       DateTime
  endTime         DateTime?
  
  // Tiempos calculados (segundos)
  totalDuration     Int?    // Duracion total
  restDuration      Int?    // Tiempo en descanso
  trainingDuration  Int?    // Tiempo entrenando efectivo
  
  caloriesBurned  Int?      // Registrado manualmente o calculado
  
  // Ejercicios realizados con detalle
  exercises       Json      @default("[]")
  // Ejemplo:
  // [
  //   {
  //     "exerciseId": "...",
  //     "name": "Press de banca",
  //     "sets": [
  //       { "reps": 12, "weight": 50, "completed": true },
  //       { "reps": 10, "weight": 55, "completed": true },
  //       { "reps": 8, "weight": 60, "completed": true },
  //       { "reps": 6, "weight": 60, "completed": false }
  //     ],
  //     "totalVolume": 2030, // kg levantados total
  //     "notes": "Ultimo set muy pesado"
  //   }
  // ]
  
  // Feedback del usuario
  feedback        String?   // "Como sentiste la rutina?"
  rating          Int?      // 1-5 estrellas
  
  // Imagen del entrenamiento
  imageUrl        String?   // URL firmada de S3
  
  // Score de IA (futuro)
  aiScore         Json?     // { score: 85, suggestions: [...] }
  
  notes           String?
  
  createdAt       DateTime  @default(now())
  
  @@index([userId, date])
  @@index([routineId])
}

model WaterLog {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  date            DateTime  @db.Date
  targetMl        Int       // Objetivo del dia en ml
  consumedMl      Int       @default(0) // Total consumido
  glassSize       Int       @default(250) // Tamano del vaso en ml
  
  // Registro detallado de cada ingesta
  entries         Json      @default("[]")
  // Ejemplo: [
  //   { "time": "08:30", "ml": 250 },
  //   { "time": "10:00", "ml": 250 },
  //   { "time": "12:30", "ml": 500 }
  // ]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([userId, date])
  @@index([userId, date])
}

model ExerciseCatalog {
  id              String    @id @default(cuid())
  
  name            String
  nameNormalized  String    // Para busquedas (lowercase, sin acentos)
  
  muscleGroup     MuscleGroup
  secondaryMuscles MuscleGroup[]
  
  equipment       String[]  // ["barbell", "bench"]
  difficulty      Difficulty
  
  // Instrucciones detalladas
  instructions    Json      @default("[]")
  // Ejemplo: ["Acuestate en el banco", "Agarra la barra...", ...]
  
  videoUrl        String?
  imageUrl        String?
  thumbnailUrl    String?
  
  caloriesPerMinute Float?  // Estimacion
  
  // Ejercicios alternativos
  alternatives    String[]  // IDs de ejercicios similares
  
  tags            String[]  // ["compound", "push", "strength"]
  
  // Si es ejercicio personalizado
  isCustom        Boolean   @default(false)
  createdById     String?
  createdBy       User?     @relation("CreatedExercises", fields: [createdById], references: [id])
  
  isActive        Boolean   @default(true)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@index([muscleGroup])
  @@index([nameNormalized])
  @@index([isCustom, createdById])
}

model DailyMetric {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  date            DateTime  @db.Date
  
  weight          Float?    // Peso del dia
  
  // Agregados calculados
  caloriesConsumed Int?
  caloriesBurned   Int?
  waterConsumed    Int?     // ml
  proteinConsumed  Float?
  carbsConsumed    Float?
  fatConsumed      Float?
  
  workoutCompleted Boolean  @default(false)
  workoutDuration  Int?     // minutos
  
  sleepHours      Float?
  
  notes           String?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([userId, date])
  @@index([userId, date])
}

// ==========================================
// AI INTEGRATION (Preparado para futuro)
// ==========================================

model AIChangeLog {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type            AIChangeType
  
  // Request enviado a la IA
  requestPayload  Json
  // Ejemplo para nutricion:
  // {
  //   "type": "nutrition_plan",
  //   "userProfile": { "gender": "MALE", "age": 28, ... },
  //   "goal": "MUSCLE_GAIN",
  //   "budget": 150,
  //   "ingredients": ["pollo", "arroz", ...],
  //   "restrictions": ["sin lactosa"]
  // }
  
  // Respuesta de la IA (sanitizada)
  responsePayload Json?
  // Plan generado que espera aprobacion
  
  status          AIChangeStatus @default(PENDING)
  
  approvedAt      DateTime?
  rejectedAt      DateTime?
  appliedAt       DateTime? // Cuando se aplico a la DB real
  
  // Razon de rechazo si aplica
  rejectionReason String?
  
  // Tokens/costos (para tracking)
  tokensUsed      Int?
  processingTimeMs Int?
  
  createdAt       DateTime  @default(now())
  expiresAt       DateTime  // Los cambios pendientes expiran
  
  @@index([userId, status])
  @@index([userId, type])
}

// ==========================================
// SESSIONS & CACHE (Redis complementa esto)
// ==========================================

model RefreshToken {
  id              String    @id @default(cuid())
  userId          String
  token           String    @unique
  expiresAt       DateTime
  createdAt       DateTime  @default(now())
  
  @@index([userId])
  @@index([expiresAt])
}
```

---

## 3. Indices y Optimizaciones

### 3.1 Indices Recomendados

```sql
-- Indices adicionales para queries comunes

-- Buscar logs de comida por rango de fechas
CREATE INDEX idx_meal_logs_date_range 
ON "MealLog" ("userId", "date" DESC);

-- Buscar sesiones de entrenamiento por mes
CREATE INDEX idx_workout_sessions_month 
ON "WorkoutSession" ("userId", date_trunc('month', "date"));

-- Buscar metricas para graficos
CREATE INDEX idx_daily_metrics_range 
ON "DailyMetric" ("userId", "date" DESC);

-- Full-text search en ejercicios
CREATE INDEX idx_exercises_search 
ON "ExerciseCatalog" USING gin(to_tsvector('spanish', "name"));

-- Buscar cambios IA pendientes
CREATE INDEX idx_ai_pending 
ON "AIChangeLog" ("userId", "status") 
WHERE "status" = 'PENDING';
```

### 3.2 Particionado (Para Escala)

```sql
-- Particionar tablas grandes por fecha (cuando crezca)
-- Ejemplo para MealLog

CREATE TABLE meal_logs_partitioned (
    LIKE "MealLog" INCLUDING ALL
) PARTITION BY RANGE (date);

-- Crear particiones por mes
CREATE TABLE meal_logs_2026_01 PARTITION OF meal_logs_partitioned
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
    
CREATE TABLE meal_logs_2026_02 PARTITION OF meal_logs_partitioned
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- etc...
```

---

## 4. Migraciones y Seeds

### 4.1 Seed de Ejercicios Base

```typescript
// prisma/seed.ts

import { PrismaClient, MuscleGroup, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

const exercisesSeed = [
  {
    name: 'Press de banca con barra',
    nameNormalized: 'press de banca con barra',
    muscleGroup: MuscleGroup.CHEST,
    secondaryMuscles: [MuscleGroup.TRICEPS, MuscleGroup.SHOULDERS],
    equipment: ['barbell', 'bench'],
    difficulty: Difficulty.INTERMEDIATE,
    instructions: [
      'Acuestate en el banco plano con los pies firmes en el suelo',
      'Agarra la barra con las manos un poco mas separadas que el ancho de los hombros',
      'Baja la barra controladamente hasta el pecho',
      'Empuja la barra hacia arriba extendiendo los brazos',
      'Mantén los codos a 45 grados del cuerpo'
    ],
    caloriesPerMinute: 8,
    tags: ['compound', 'push', 'strength', 'chest'],
    alternatives: [],
    isCustom: false
  },
  {
    name: 'Sentadilla con barra',
    nameNormalized: 'sentadilla con barra',
    muscleGroup: MuscleGroup.QUADRICEPS,
    secondaryMuscles: [MuscleGroup.GLUTES, MuscleGroup.HAMSTRINGS],
    equipment: ['barbell', 'squat_rack'],
    difficulty: Difficulty.INTERMEDIATE,
    instructions: [
      'Coloca la barra en la parte superior de la espalda',
      'Pies a la anchura de los hombros, puntas ligeramente hacia afuera',
      'Baja controladamente como si fueras a sentarte',
      'Mantén la espalda recta y el pecho arriba',
      'Baja hasta que los muslos esten paralelos al suelo',
      'Empuja desde los talones para volver arriba'
    ],
    caloriesPerMinute: 10,
    tags: ['compound', 'legs', 'strength', 'squat'],
    alternatives: [],
    isCustom: false
  },
  {
    name: 'Peso muerto convencional',
    nameNormalized: 'peso muerto convencional',
    muscleGroup: MuscleGroup.BACK,
    secondaryMuscles: [MuscleGroup.HAMSTRINGS, MuscleGroup.GLUTES],
    equipment: ['barbell'],
    difficulty: Difficulty.ADVANCED,
    instructions: [
      'Pies a la anchura de las caderas, barra sobre los pies',
      'Agarra la barra con agarre prono o mixto',
      'Espalda recta, pecho arriba, hombros atras',
      'Levanta empujando con las piernas primero',
      'Extiende caderas y rodillas simultaneamente',
      'Baja la barra de forma controlada'
    ],
    caloriesPerMinute: 12,
    tags: ['compound', 'pull', 'strength', 'back', 'posterior_chain'],
    alternatives: [],
    isCustom: false
  },
  // ... mas ejercicios
];

async function main() {
  console.log('Seeding exercises...');
  
  for (const exercise of exercisesSeed) {
    await prisma.exerciseCatalog.upsert({
      where: { 
        id: exercise.nameNormalized.replace(/\s+/g, '-') 
      },
      update: exercise,
      create: {
        id: exercise.nameNormalized.replace(/\s+/g, '-'),
        ...exercise
      }
    });
  }
  
  console.log('Seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 5. Queries Comunes Optimizadas

### 5.1 Dashboard del Usuario

```typescript
// Obtener resumen del dia actual
async function getDailySummary(userId: string, date: Date) {
  return prisma.$transaction([
    // Metricas del dia
    prisma.dailyMetric.findUnique({
      where: { userId_date: { userId, date } }
    }),
    
    // Comidas del dia
    prisma.mealLog.findMany({
      where: { userId, date },
      orderBy: { mealType: 'asc' }
    }),
    
    // Agua del dia
    prisma.waterLog.findUnique({
      where: { userId_date: { userId, date } }
    }),
    
    // Sesion de entrenamiento del dia
    prisma.workoutSession.findFirst({
      where: { userId, date },
      include: { routine: { select: { name: true } } }
    })
  ]);
}
```

### 5.2 Metricas Semanales/Mensuales

```typescript
// Obtener metricas para graficos
async function getMetricsRange(
  userId: string, 
  startDate: Date, 
  endDate: Date
) {
  return prisma.dailyMetric.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      weight: true,
      caloriesConsumed: true,
      caloriesBurned: true,
      waterConsumed: true,
      workoutCompleted: true
    }
  });
}
```

### 5.3 Calendario de Entrenamientos

```typescript
// Obtener dias entrenados del mes
async function getTrainedDays(userId: string, year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return prisma.workoutSession.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    select: {
      date: true,
      totalDuration: true,
      rating: true,
      routine: {
        select: { name: true }
      }
    },
    orderBy: { date: 'asc' }
  });
}
```

---

## 6. Estrategia de Datos con JSONB

### 6.1 Cuando Usar JSONB vs Columnas

| Usar JSONB | Usar Columnas Relacionales |
|------------|---------------------------|
| Datos que varian por usuario (settings) | Datos que se consultan frecuentemente |
| Estructura flexible (plan semanal) | Relaciones entre entidades |
| Historial de sets/reps | Campos para filtrado |
| Metadata de ejercicios | Datos para agregaciones |

### 6.2 Validacion de JSON en Backend

```typescript
// schemas/nutrition.schema.ts
import { z } from 'zod';

const FoodItemSchema = z.object({
  name: z.string().max(100),
  grams: z.number().positive(),
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  fat: z.number().nonnegative()
});

const MealLogFoodsSchema = z.array(FoodItemSchema).max(20);

// Validar antes de guardar
function validateMealFoods(foods: unknown) {
  return MealLogFoodsSchema.parse(foods);
}
```

---

## 7. Soft Deletes y Auditoria

```prisma
// Agregar a modelos principales para auditoria

model User {
  // ... campos existentes
  
  deletedAt     DateTime?  // Soft delete
  
  // Historial de cambios de peso
  weightHistory Json       @default("[]")
  // [{ date: "2026-01-15", weight: 75.5 }, ...]
}

model WorkoutSession {
  // ... campos existentes
  
  // Versioning para historial
  version       Int        @default(1)
}
```

---

## 8. Relacion con Cache Redis

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ESTRATEGIA POSTGRESQL + REDIS                        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐          ┌─────────────────────┐
│     PostgreSQL      │          │       Redis         │
│   (Persistencia)    │          │  (Cache + Sessions) │
├─────────────────────┤          ├─────────────────────┤
│                     │          │                     │
│ - Datos permanentes │          │ - user:{id}:profile │
│ - Historial         │          │ - user:{id}:today   │
│ - Transacciones     │◀────────▶│ - exercises:catalog │
│ - Busquedas         │          │ - session:{token}   │
│ - Reportes          │          │ - water:reminder:{} │
│                     │          │ - ai:cache:{hash}   │
└─────────────────────┘          └─────────────────────┘

Patron de Acceso:
1. Buscar en Redis
2. Si no existe, buscar en PostgreSQL
3. Guardar en Redis con TTL
4. Retornar al cliente

Invalidacion:
- Al actualizar PostgreSQL, invalidar keys relacionadas en Redis
- Usar pub/sub para notificar otros servidores
```

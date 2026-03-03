# FitTrack Pro - Especificacion de API REST

> API Reference v1.0
> Base URL: `https://api.fittrackpro.com/api/v1`

---

## 1. Convencion General

### 1.1 Headers Requeridos

```http
Authorization: Bearer {firebase_id_token}
Content-Type: application/json
Accept: application/json
X-Request-ID: {uuid}  # Opcional, para tracking
```

### 1.2 Formato de Respuesta

**Exito (2xx)**
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

**Error (4xx, 5xx)**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Descripcion del error",
    "details": [
      { "path": "field", "message": "Error especifico" }
    ]
  }
}
```

### 1.3 Codigos de Estado

| Codigo | Uso |
|--------|-----|
| `200` | OK - Request exitoso |
| `201` | Created - Recurso creado |
| `204` | No Content - Eliminacion exitosa |
| `304` | Not Modified - Cache valido (ETag) |
| `400` | Bad Request - Validacion fallida |
| `401` | Unauthorized - Token invalido |
| `403` | Forbidden - Sin permisos |
| `404` | Not Found - Recurso no existe |
| `429` | Too Many Requests - Rate limit |
| `500` | Internal Error - Error del servidor |

---

## 2. Autenticacion

### POST /auth/register
Registrar nuevo usuario (despues de crear cuenta en Firebase).

**Request**
```json
{
  "name": "string",
  "email": "string",
  "gender": "MALE | FEMALE | OTHER",
  "birthDate": "2000-01-15",
  "weight": 70.5,
  "height": 175,
  "activityLevel": "MODERATELY_ACTIVE",
  "goal": "MUSCLE_GAIN"
}
```

**Response** `201 Created`
```json
{
  "data": {
    "id": "cuid...",
    "email": "user@example.com",
    "name": "Usuario",
    "createdAt": "2026-03-01T..."
  }
}
```

### POST /auth/logout
Invalidar sesion actual.

**Response** `204 No Content`

---

## 3. Usuarios

### GET /users/me
Obtener perfil del usuario autenticado.

**Response** `200 OK`
```json
{
  "data": {
    "id": "cuid...",
    "email": "user@example.com",
    "name": "Usuario",
    "gender": "MALE",
    "birthDate": "2000-01-15",
    "weight": 70.5,
    "height": 175,
    "activityLevel": "MODERATELY_ACTIVE",
    "goal": "MUSCLE_GAIN",
    "profileImageUrl": "https://...",
    "settings": {
      "waterReminder": { "enabled": true, "intervalMinutes": 60 },
      "units": { "weight": "kg", "height": "cm" }
    },
    "stats": {
      "bmi": 23.02,
      "tdee": 2450,
      "targetCalories": 2700,
      "macros": { "protein": 200, "carbs": 300, "fat": 75 }
    }
  }
}
```

### PATCH /users/me
Actualizar perfil.

**Request**
```json
{
  "name": "Nuevo nombre",
  "weight": 71.0,
  "goal": "WEIGHT_LOSS"
}
```

**Response** `200 OK`

### PUT /users/me/settings
Actualizar configuraciones.

**Request**
```json
{
  "waterReminder": {
    "enabled": true,
    "intervalMinutes": 45
  },
  "notifications": {
    "email": true,
    "push": false
  }
}
```

---

## 4. Nutricion

### GET /nutrition/plans
Listar planes nutricionales del usuario.

**Query Parameters**
| Param | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| `active` | boolean | - | Solo planes activos |

**Response** `200 OK`
```json
{
  "data": [
    {
      "id": "cuid...",
      "name": "Plan de volumen",
      "type": "MUSCLE_GAIN",
      "targetCalories": 2700,
      "targetProtein": 200,
      "targetCarbs": 300,
      "targetFat": 75,
      "isActive": true,
      "aiGenerated": false,
      "createdAt": "2026-03-01T..."
    }
  ]
}
```

### POST /nutrition/plans
Crear plan nutricional.

**Request**
```json
{
  "name": "Mi plan",
  "type": "MUSCLE_GAIN",
  "targetCalories": 2700,
  "targetProtein": 200,
  "targetCarbs": 300,
  "targetFat": 75,
  "budget": 150,
  "ingredients": ["pollo", "arroz", "huevos"]
}
```

### GET /nutrition/plans/:id
Obtener plan con detalle semanal.

**Response** `200 OK`
```json
{
  "data": {
    "id": "cuid...",
    "name": "Plan de volumen",
    "weeklyPlan": {
      "monday": {
        "breakfast": {
          "meals": [
            { "name": "Avena", "portion": "100g", "calories": 350, ... }
          ],
          "totalCalories": 350
        },
        ...
      },
      ...
    }
  }
}
```

### GET /nutrition/meals
Obtener comidas por rango de fechas.

**Query Parameters**
| Param | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `date` | string | Si* | Fecha especifica (YYYY-MM-DD) |
| `startDate` | string | Si* | Inicio de rango |
| `endDate` | string | Si* | Fin de rango |

**Response** `200 OK`
```json
{
  "data": [
    {
      "id": "cuid...",
      "date": "2026-03-01",
      "mealType": "BREAKFAST",
      "foods": [
        { "name": "Huevos revueltos", "grams": 200, "calories": 280, "protein": 20, "carbs": 2, "fat": 20 }
      ],
      "totalCalories": 280,
      "totalProtein": 20,
      "totalCarbs": 2,
      "totalFat": 20,
      "aiAssistedCalc": false
    }
  ],
  "meta": {
    "dailyTotals": {
      "calories": 1850,
      "protein": 140,
      "carbs": 180,
      "fat": 65
    }
  }
}
```

### POST /nutrition/meals
Registrar comida.

**Request**
```json
{
  "date": "2026-03-01",
  "mealType": "LUNCH",
  "foods": [
    { "name": "Pollo a la plancha", "grams": 150, "calories": 248, "protein": 46, "carbs": 0, "fat": 5.4 },
    { "name": "Arroz integral", "grams": 100, "calories": 111, "protein": 2.6, "carbs": 23, "fat": 0.9 }
  ],
  "notes": "Post-entrenamiento"
}
```

### PUT /nutrition/meals/:id
Actualizar comida.

### DELETE /nutrition/meals/:id
Eliminar comida.

---

## 5. Entrenamientos

### GET /workouts/folders
Listar carpetas de rutinas.

**Response** `200 OK`
```json
{
  "data": [
    {
      "id": "cuid...",
      "name": "Push Pull Legs",
      "goal": "MUSCLE_GAIN",
      "color": "#3B82F6",
      "routineCount": 6
    }
  ]
}
```

### POST /workouts/folders
Crear carpeta.

**Request**
```json
{
  "name": "Nueva carpeta",
  "goal": "MUSCLE_GAIN",
  "color": "#10B981"
}
```

### GET /workouts/routines
Listar rutinas.

**Query Parameters**
| Param | Tipo | Descripcion |
|-------|------|-------------|
| `folderId` | string | Filtrar por carpeta |

**Response** `200 OK`
```json
{
  "data": [
    {
      "id": "cuid...",
      "name": "Push Day",
      "description": "Pecho, hombros, triceps",
      "folderId": "cuid...",
      "targetMuscles": ["CHEST", "SHOULDERS", "TRICEPS"],
      "estimatedDuration": 60,
      "exerciseCount": 6,
      "lastPerformed": "2026-02-28"
    }
  ]
}
```

### GET /workouts/routines/:id
Obtener rutina con ejercicios.

**Response** `200 OK`
```json
{
  "data": {
    "id": "cuid...",
    "name": "Push Day",
    "exercises": [
      {
        "exerciseId": "bench-press",
        "name": "Press de banca",
        "sets": 4,
        "reps": "8-12",
        "weight": 60,
        "restTime": 90,
        "notes": "Control en bajada",
        "order": 0,
        "exercise": {
          "muscleGroup": "CHEST",
          "instructions": ["..."],
          "videoUrl": "https://..."
        }
      }
    ]
  }
}
```

### POST /workouts/routines
Crear rutina.

**Request**
```json
{
  "name": "Leg Day",
  "folderId": "cuid...",
  "targetMuscles": ["QUADRICEPS", "HAMSTRINGS", "CALVES"],
  "defaultRestTime": 120,
  "exercises": [
    {
      "exerciseId": "squat",
      "sets": 4,
      "reps": "6-8",
      "order": 0
    }
  ]
}
```

### POST /workouts/sessions/start
Iniciar sesion de entrenamiento.

**Request**
```json
{
  "routineId": "cuid...",
  "date": "2026-03-01"
}
```

**Response** `201 Created`
```json
{
  "data": {
    "id": "cuid...",
    "routineId": "cuid...",
    "startTime": "2026-03-01T10:00:00Z",
    "status": "active",
    "routine": {
      "name": "Push Day",
      "exercises": [...]
    }
  }
}
```

### PUT /workouts/sessions/:id/complete
Finalizar sesion.

**Request**
```json
{
  "exercises": [
    {
      "exerciseId": "bench-press",
      "name": "Press de banca",
      "sets": [
        { "reps": 12, "weight": 50, "completed": true },
        { "reps": 10, "weight": 55, "completed": true },
        { "reps": 8, "weight": 60, "completed": true },
        { "reps": 6, "weight": 60, "completed": false }
      ]
    }
  ],
  "caloriesBurned": 350,
  "notes": "Buen entrenamiento"
}
```

**Response** `200 OK`
```json
{
  "data": {
    "id": "cuid...",
    "endTime": "2026-03-01T11:15:00Z",
    "totalDuration": 4500,
    "trainingDuration": 3200,
    "restDuration": 1300,
    "caloriesBurned": 350,
    "summary": {
      "exercisesCompleted": 6,
      "setsCompleted": 22,
      "totalVolume": 12500
    }
  }
}
```

### PATCH /workouts/sessions/:id
Actualizar sesion (feedback, imagen).

**Request**
```json
{
  "feedback": "Me senti muy bien, progrese en peso",
  "rating": 5,
  "imageKey": "users/123/workouts/abc123.jpg"
}
```

### GET /workouts/sessions
Historial de sesiones.

**Query Parameters**
| Param | Tipo | Descripcion |
|-------|------|-------------|
| `startDate` | string | Inicio de rango |
| `endDate` | string | Fin de rango |
| `routineId` | string | Filtrar por rutina |
| `limit` | number | Items por pagina (default: 20) |
| `cursor` | string | Cursor para paginacion |

---

## 6. Agua

### GET /water/today
Obtener registro de agua de hoy.

**Response** `200 OK`
```json
{
  "data": {
    "date": "2026-03-01",
    "targetMl": 2500,
    "consumedMl": 1500,
    "glassSize": 250,
    "progress": 0.6,
    "entries": [
      { "time": "08:30", "ml": 250 },
      { "time": "10:00", "ml": 500 }
    ],
    "nextReminderAt": "2026-03-01T12:00:00Z"
  }
}
```

### POST /water/log
Registrar ingesta de agua.

**Request**
```json
{
  "ml": 250,
  "time": "11:30"
}
```

**Response** `200 OK`
```json
{
  "data": {
    "consumedMl": 1750,
    "progress": 0.7,
    "remaining": 750
  }
}
```

### PUT /water/settings
Actualizar configuracion de agua.

**Request**
```json
{
  "targetMl": 3000,
  "glassSize": 300,
  "reminderInterval": 45
}
```

---

## 7. Metricas

### GET /metrics/daily/:date
Obtener metricas de un dia.

**Response** `200 OK`
```json
{
  "data": {
    "date": "2026-03-01",
    "weight": 70.5,
    "caloriesConsumed": 2450,
    "caloriesBurned": 350,
    "waterConsumed": 2500,
    "proteinConsumed": 180,
    "carbsConsumed": 280,
    "fatConsumed": 70,
    "workoutCompleted": true,
    "workoutDuration": 75,
    "calorieBalance": -600
  }
}
```

### GET /metrics/range
Obtener metricas por rango (para graficas).

**Query Parameters**
| Param | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `startDate` | string | Si | Inicio (YYYY-MM-DD) |
| `endDate` | string | Si | Fin (YYYY-MM-DD) |
| `metrics` | string | No | Campos a incluir (comma-separated) |

**Response** `200 OK`
```json
{
  "data": [
    { "date": "2026-03-01", "weight": 70.5, "caloriesConsumed": 2450, ... },
    { "date": "2026-03-02", "weight": 70.3, "caloriesConsumed": 2380, ... }
  ],
  "meta": {
    "averages": {
      "weight": 70.4,
      "caloriesConsumed": 2415
    },
    "trends": {
      "weight": "decreasing",
      "calories": "stable"
    }
  }
}
```

### GET /metrics/calendar/:year/:month
Obtener calendario de actividad.

**Response** `200 OK`
```json
{
  "data": {
    "year": 2026,
    "month": 3,
    "days": [
      { "day": 1, "workoutCompleted": true, "caloriesOnTarget": true, "waterOnTarget": true },
      { "day": 2, "workoutCompleted": false, "caloriesOnTarget": true, "waterOnTarget": false },
      ...
    ],
    "summary": {
      "workoutDays": 12,
      "totalWorkouts": 14,
      "averageRating": 4.2,
      "streak": 5
    }
  }
}
```

### GET /metrics/summary
Obtener resumen por periodo.

**Query Parameters**
| Param | Tipo | Valores |
|-------|------|---------|
| `period` | string | `week`, `month`, `year` |

**Response** `200 OK`
```json
{
  "data": {
    "period": "month",
    "startDate": "2026-03-01",
    "endDate": "2026-03-31",
    "workouts": {
      "total": 16,
      "totalDuration": 1200,
      "caloriesBurned": 5600,
      "mostTrained": ["CHEST", "BACK"]
    },
    "nutrition": {
      "averageCalories": 2420,
      "averageProtein": 175,
      "daysOnTarget": 22
    },
    "water": {
      "averageConsumed": 2350,
      "daysOnTarget": 25
    },
    "weight": {
      "start": 71.0,
      "current": 70.2,
      "change": -0.8
    }
  }
}
```

---

## 8. Ejercicios

### GET /exercises
Obtener catalogo de ejercicios.

**Query Parameters**
| Param | Tipo | Descripcion |
|-------|------|-------------|
| `muscleGroup` | string | Filtrar por grupo muscular |
| `equipment` | string | Filtrar por equipamiento |
| `difficulty` | string | Filtrar por dificultad |
| `search` | string | Buscar por nombre |

**Response** `200 OK`
```json
{
  "data": [
    {
      "id": "bench-press",
      "name": "Press de banca con barra",
      "muscleGroup": "CHEST",
      "secondaryMuscles": ["TRICEPS", "SHOULDERS"],
      "equipment": ["barbell", "bench"],
      "difficulty": "INTERMEDIATE",
      "thumbnailUrl": "https://...",
      "caloriesPerMinute": 8
    }
  ],
  "meta": {
    "total": 150,
    "muscleGroups": ["CHEST", "BACK", ...]
  }
}
```

### GET /exercises/:id
Obtener detalle de ejercicio.

**Response** `200 OK`
```json
{
  "data": {
    "id": "bench-press",
    "name": "Press de banca con barra",
    "muscleGroup": "CHEST",
    "instructions": [
      "Acuestate en el banco plano",
      "Agarra la barra con grip medio",
      ...
    ],
    "videoUrl": "https://...",
    "imageUrl": "https://...",
    "alternatives": [
      { "id": "dumbbell-press", "name": "Press con mancuernas" }
    ],
    "tags": ["compound", "push", "strength"]
  }
}
```

### POST /exercises (Custom)
Crear ejercicio personalizado.

**Request**
```json
{
  "name": "Mi ejercicio",
  "muscleGroup": "CHEST",
  "equipment": ["dumbbell"],
  "difficulty": "INTERMEDIATE",
  "instructions": ["Paso 1", "Paso 2"]
}
```

---

## 9. IA (Preparado para futuro)

### POST /ai/nutrition/plan
Solicitar plan nutricional generado por IA.

**Request**
```json
{
  "budget": 150,
  "ingredients": ["pollo", "arroz", "verduras"],
  "restrictions": ["sin lactosa"],
  "preferences": {
    "mealsPerDay": 5,
    "cookingTimeMax": 30
  }
}
```

**Response** `202 Accepted`
```json
{
  "data": {
    "changeId": "cuid...",
    "status": "PROCESSING",
    "estimatedTime": 30
  }
}
```

### POST /ai/workout/plan
Solicitar plan de entrenamiento generado por IA.

**Request**
```json
{
  "daysPerWeek": 4,
  "sessionDuration": 60,
  "equipment": ["barbell", "dumbbell", "cable"],
  "focus": ["CHEST", "BACK"],
  "experience": "INTERMEDIATE"
}
```

### POST /ai/nutrition/calculate
Calcular calorias de alimento con IA.

**Request**
```json
{
  "food": "Tacos de carnitas con cilantro",
  "portion": "3 tacos"
}
```

**Response** `200 OK`
```json
{
  "data": {
    "food": "Tacos de carnitas",
    "estimatedPortion": "3 tacos (180g)",
    "calories": 450,
    "protein": 25,
    "carbs": 35,
    "fat": 22,
    "confidence": 0.85,
    "cached": true
  }
}
```

### POST /ai/workout/evaluate
Evaluar sesion de entrenamiento.

**Request**
```json
{
  "sessionId": "cuid..."
}
```

### GET /ai/changes/pending
Obtener cambios pendientes de aprobacion.

**Response** `200 OK`
```json
{
  "data": [
    {
      "id": "cuid...",
      "type": "NUTRITION_PLAN",
      "status": "PENDING",
      "preview": { ... },
      "createdAt": "2026-03-01T...",
      "expiresAt": "2026-03-02T..."
    }
  ]
}
```

### POST /ai/changes/:id/approve
Aprobar cambio de IA.

**Response** `200 OK`
```json
{
  "data": {
    "status": "APPROVED",
    "appliedAt": "2026-03-01T..."
  }
}
```

### POST /ai/changes/:id/reject
Rechazar cambio de IA.

**Request**
```json
{
  "reason": "No me gusta el plan"
}
```

---

## 10. Almacenamiento

### GET /storage/upload-url
Obtener URL firmada para subir imagen.

**Query Parameters**
| Param | Tipo | Requerido | Descripcion |
|-------|------|-----------|-------------|
| `fileType` | string | Si | MIME type (image/jpeg, image/png) |
| `fileSize` | number | Si | Tamano en bytes |

**Response** `200 OK`
```json
{
  "data": {
    "uploadUrl": "https://s3.../presigned...",
    "key": "users/123/workouts/abc.jpg",
    "expiresIn": 300
  }
}
```

---

## 11. WebSocket Events

### Conexion

```javascript
const socket = io('wss://api.fittrackpro.com', {
  auth: { token: 'Bearer ...' }
});
```

### Eventos del Servidor -> Cliente

| Evento | Payload | Descripcion |
|--------|---------|-------------|
| `water:reminder` | `{ nextIn: 60 }` | Recordatorio de agua |
| `ai:plan_ready` | `{ changeId: '...' }` | Plan IA listo para revision |
| `ai:processing` | `{ progress: 50 }` | Progreso de generacion IA |
| `sync:conflict` | `{ resource, local, server }` | Conflicto de sincronizacion |

### Eventos del Cliente -> Servidor

| Evento | Payload | Descripcion |
|--------|---------|-------------|
| `water:dismissed` | `{}` | Usuario descarto recordatorio |
| `water:consumed` | `{ ml: 250 }` | Usuario consumio agua |

---

## 12. Rate Limits

| Endpoint | Limite | Ventana |
|----------|--------|---------|
| General | 100 req | 15 min |
| Auth | 10 req | 15 min |
| AI (todas) | 5 req | 1 min |
| AI (total diario) | 50 req | 24 h |
| Upload | 20 req | 1 hora |

Headers de respuesta:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1614556800
```

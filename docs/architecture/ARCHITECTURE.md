# FitTrack Pro - Arquitectura del Sistema

> Documento de Arquitectura de Software v1.0
> Ultima actualizacion: Marzo 2026

---

## 1. Vision General

FitTrack Pro es una aplicacion fitness SaaS disenada con arquitectura de microservicios, optimizada para escalabilidad multiusuario, seguridad avanzada y eficiencia en el consumo de recursos.

### 1.1 Principios Arquitectonicos

| Principio | Descripcion |
|-----------|-------------|
| **Separacion de Responsabilidades** | Backend principal, Microservicio IA, Almacenamiento de imagenes como servicios independientes |
| **Cache Inteligente** | Minimizar peticiones innecesarias mediante cache multinivel |
| **Lazy Loading** | Solo cargar datos cuando sean estrictamente necesarios |
| **Event-Driven** | WebSockets solo para eventos criticos (recordatorios) |
| **Security First** | Validacion en cada capa, sanitizacion de datos |
| **AI-Ready** | Arquitectura preparada para conectar IA sin refactoring |

---

## 2. Stack Tecnologico Recomendado

### 2.1 Frontend
```
React 19 + Vite
├── React Router v7          # Navegacion
├── Zustand                   # Estado global ligero
├── TanStack Query v5         # Cache y sincronizacion servidor
├── React Hook Form + Zod     # Formularios con validacion
├── Tailwind CSS              # Estilos
├── Framer Motion             # Animaciones (botella agua)
├── react-icons               # Iconografia
├── IndexedDB (Dexie.js)      # Cache local persistente
└── Socket.io Client          # WebSocket
```

### 2.2 Backend Principal
```
Node.js 20 LTS + Express
├── TypeScript                # Tipado estatico
├── Prisma ORM                # Acceso a base de datos
├── Redis                     # Cache servidor + sesiones
├── Socket.io                 # WebSockets
├── Zod                       # Validacion schemas
├── Helmet + CORS             # Seguridad HTTP
├── express-rate-limit        # Rate limiting
├── jsonwebtoken              # JWT Auth
└── Winston                   # Logging estructurado
```

### 2.3 Base de Datos
```
PostgreSQL 16
├── Relacional principal
├── JSONB para datos flexibles (ejercicios, planes)
└── Indices optimizados
```

### 2.4 Servicios Externos
```
├── Firebase Auth             # Autenticacion (ya integrado)
├── AWS S3 / Cloudflare R2    # Almacenamiento imagenes
├── Upstash Redis             # Cache serverless (opcional)
└── [Futuro] OpenAI / Custom  # Microservicio IA
```

---

## 3. Arquitectura de Alto Nivel (C4 - Contexto)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USUARIOS                                       │
│                    (Web / Mobile PWA)                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React SPA)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  Modulo      │  │  Modulo      │  │  Modulo      │                  │
│  │  Nutricion   │  │  Rutinas     │  │  Metricas    │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  TanStack Query Cache  │  Zustand  │  IndexedDB (Dexie)       │    │
│  └────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                    │                           │
                    │ REST API (HTTPS)          │ WebSocket
                    ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY / BACKEND                           │
│                          (Node.js + Express)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  Auth        │  │  Rate        │  │  Request     │                  │
│  │  Middleware  │  │  Limiter     │  │  Validator   │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  Nutricion   │  │  Rutinas     │  │  Usuarios    │                  │
│  │  Service     │  │  Service     │  │  Service     │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    Redis Cache Layer                           │    │
│  └────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
         │                    │                         │
         ▼                    ▼                         ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────────────────────┐
│   PostgreSQL   │  │   AWS S3 /     │  │   MICROSERVICIO IA (Futuro)   │
│   (Datos)      │  │   Cloudflare R2│  │   ┌─────────────────────────┐ │
│                │  │   (Imagenes)   │  │   │  AI Gateway             │ │
│                │  │                │  │   │  ├── IA Nutriologo      │ │
│                │  │                │  │   │  └── IA Entrenador      │ │
│                │  │                │  │   └─────────────────────────┘ │
└────────────────┘  └────────────────┘  └────────────────────────────────┘
```

---

## 4. Arquitectura de Contenedores (C4 - Nivel 2)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              FITTRACK PRO SYSTEM                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    WEB APPLICATION CONTAINER                         │    │
│  │                         [React 19 SPA]                               │    │
│  │                                                                      │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │    │
│  │  │   Pages     │ │ Components  │ │   Hooks     │ │  Services   │   │    │
│  │  │             │ │             │ │             │ │             │   │    │
│  │  │ - Dashboard │ │ - UI Kit    │ │ - useAuth   │ │ - api.ts    │   │    │
│  │  │ - Nutrition │ │ - Charts    │ │ - useCache  │ │ - storage   │   │    │
│  │  │ - Workouts  │ │ - Forms     │ │ - useSocket │ │ - socket    │   │    │
│  │  │ - Profile   │ │ - Modals    │ │ - useQuery  │ │ - indexedDB │   │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │    │
│  │                                                                      │    │
│  │  ┌────────────────────────────────────────────────────────────────┐ │    │
│  │  │   STATE MANAGEMENT                                             │ │    │
│  │  │   Zustand (Global) + TanStack Query (Server State)            │ │    │
│  │  └────────────────────────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                      │                                       │
│                    ┌─────────────────┴─────────────────┐                    │
│                    │           HTTPS / WSS             │                    │
│                    └─────────────────┬─────────────────┘                    │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    API SERVER CONTAINER                              │    │
│  │                    [Node.js + Express + TS]                          │    │
│  │                                                                      │    │
│  │  ┌─────────────────────────────────────────────────────────────┐   │    │
│  │  │                    MIDDLEWARE PIPELINE                       │   │    │
│  │  │  Helmet → CORS → RateLimit → Auth → Validate → Handler      │   │    │
│  │  └─────────────────────────────────────────────────────────────┘   │    │
│  │                                                                      │    │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐             │    │
│  │  │    Routes     │ │  Controllers  │ │   Services    │             │    │
│  │  │               │ │               │ │               │             │    │
│  │  │ /api/v1/auth  │ │ AuthCtrl      │ │ AuthService   │             │    │
│  │  │ /api/v1/users │ │ UserCtrl      │ │ UserService   │             │    │
│  │  │ /api/v1/meals │ │ NutritionCtrl │ │ NutritionSvc  │             │    │
│  │  │ /api/v1/      │ │ WorkoutCtrl   │ │ WorkoutSvc    │             │    │
│  │  │   workouts    │ │ MetricsCtrl   │ │ MetricsSvc    │             │    │
│  │  │ /api/v1/      │ │               │ │               │             │    │
│  │  │   metrics     │ │               │ │               │             │    │
│  │  └───────────────┘ └───────────────┘ └───────────────┘             │    │
│  │                                                                      │    │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐             │    │
│  │  │  WebSocket    │ │  AI Adapter   │ │  Storage      │             │    │
│  │  │  Manager      │ │  (Preparado)  │ │  Adapter      │             │    │
│  │  └───────────────┘ └───────────────┘ └───────────────┘             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│          │                    │                    │                         │
│          ▼                    ▼                    ▼                         │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐                  │
│  │    Redis      │   │  PostgreSQL   │   │   S3/R2       │                  │
│  │  [Cache +     │   │  [Persistencia│   │  [Imagenes]   │                  │
│  │   Sessions]   │   │   Principal]  │   │               │                  │
│  └───────────────┘   └───────────────┘   └───────────────┘                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Estructura de Carpetas Propuesta

### 5.1 Frontend (React)
```
src/
├── app/                          # Configuracion app
│   ├── providers.jsx             # Context providers
│   ├── router.jsx                # Rutas
│   └── queryClient.js            # TanStack Query config
│
├── components/                   # Componentes reutilizables
│   ├── ui/                       # UI Kit base
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   └── Card.jsx
│   ├── charts/                   # Graficos
│   │   ├── CaloriesChart.jsx
│   │   └── ProgressChart.jsx
│   ├── water/                    # Modulo agua
│   │   └── WaterBottle.jsx       # Botella animada
│   └── workout/                  # Componentes entrenamiento
│       ├── Timer.jsx
│       └── ExerciseCard.jsx
│
├── features/                     # Modulos por dominio
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── store.js
│   ├── nutrition/
│   │   ├── components/
│   │   │   ├── MealForm.jsx
│   │   │   ├── MacroDisplay.jsx
│   │   │   └── CalorieTracker.jsx
│   │   ├── hooks/
│   │   │   ├── useNutrition.js
│   │   │   └── useMeals.js
│   │   ├── services/
│   │   │   └── nutritionApi.js
│   │   └── utils/
│   │       └── calculations.js   # IMC, calorias, macros
│   ├── workouts/
│   │   ├── components/
│   │   │   ├── RoutineBuilder.jsx
│   │   │   ├── WorkoutSession.jsx
│   │   │   └── ExerciseList.jsx
│   │   ├── hooks/
│   │   ├── services/
│   │   └── data/
│   │       └── exercises.json    # Catalogo ejercicios
│   ├── water/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   ├── metrics/
│   │   ├── components/
│   │   │   ├── Calendar.jsx
│   │   │   └── Summary.jsx
│   │   └── hooks/
│   └── ai/                       # Preparado para IA
│       ├── components/
│       │   ├── AIPlanPreview.jsx # Preview cambios IA
│       │   └── AIApprovalModal.jsx
│       ├── hooks/
│       │   └── useAIService.js   # Hook preparado
│       └── services/
│           └── aiAdapter.js      # Adapter pattern
│
├── hooks/                        # Hooks globales
│   ├── useAuth.js
│   ├── useSocket.js
│   ├── useOfflineSync.js
│   └── useLocalCache.js
│
├── services/                     # Servicios globales
│   ├── api/
│   │   ├── client.js             # Axios/Fetch config
│   │   └── endpoints.js
│   ├── socket/
│   │   └── socketManager.js
│   ├── storage/
│   │   ├── indexedDB.js          # Dexie config
│   │   └── imageUpload.js        # S3 presigned URLs
│   └── cache/
│       └── cacheManager.js
│
├── store/                        # Estado global (Zustand)
│   ├── authStore.js
│   ├── uiStore.js
│   └── syncStore.js              # Estado sincronizacion
│
├── pages/                        # Paginas/Vistas
│   ├── Dashboard.jsx
│   ├── Nutrition.jsx
│   ├── Workouts.jsx
│   ├── Metrics.jsx
│   ├── Profile.jsx
│   └── Settings.jsx
│
├── utils/                        # Utilidades
│   ├── constants.js
│   ├── validators.js
│   └── formatters.js
│
└── types/                        # TypeScript types (opcional)
    └── index.d.ts
```

### 5.2 Backend (Node.js)
```
server/
├── src/
│   ├── config/
│   │   ├── database.ts           # Prisma config
│   │   ├── redis.ts              # Redis config
│   │   ├── firebase.ts           # Firebase Admin
│   │   └── env.ts                # Variables entorno
│   │
│   ├── middleware/
│   │   ├── auth.ts               # Verificar JWT/Firebase
│   │   ├── validate.ts           # Validar schemas Zod
│   │   ├── rateLimit.ts          # Rate limiting
│   │   ├── cache.ts              # Cache middleware
│   │   └── sanitize.ts           # Sanitizar inputs
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.schema.ts
│   │   ├── users/
│   │   │   ├── users.routes.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── users.schema.ts
│   │   ├── nutrition/
│   │   │   ├── nutrition.routes.ts
│   │   │   ├── nutrition.controller.ts
│   │   │   ├── nutrition.service.ts
│   │   │   ├── nutrition.schema.ts
│   │   │   └── nutrition.calculations.ts
│   │   ├── workouts/
│   │   │   ├── workouts.routes.ts
│   │   │   ├── workouts.controller.ts
│   │   │   ├── workouts.service.ts
│   │   │   └── workouts.schema.ts
│   │   ├── water/
│   │   │   ├── water.routes.ts
│   │   │   ├── water.controller.ts
│   │   │   └── water.service.ts
│   │   ├── metrics/
│   │   │   ├── metrics.routes.ts
│   │   │   ├── metrics.controller.ts
│   │   │   └── metrics.service.ts
│   │   └── ai/                   # Preparado para IA
│   │       ├── ai.routes.ts
│   │       ├── ai.controller.ts
│   │       ├── ai.adapter.ts     # Interface para futura IA
│   │       ├── ai.validator.ts   # Validar respuestas IA
│   │       └── ai.queue.ts       # Cola de peticiones
│   │
│   ├── adapters/
│   │   ├── storage/
│   │   │   ├── storage.interface.ts
│   │   │   ├── s3.adapter.ts
│   │   │   └── r2.adapter.ts
│   │   └── ai/
│   │       ├── ai.interface.ts   # Contrato IA
│   │       ├── openai.adapter.ts # Implementacion OpenAI
│   │       └── mock.adapter.ts   # Mock para desarrollo
│   │
│   ├── websocket/
│   │   ├── socket.ts             # Config Socket.io
│   │   ├── handlers/
│   │   │   └── waterReminder.ts
│   │   └── events.ts             # Tipos de eventos
│   │
│   ├── jobs/                     # Tareas programadas
│   │   ├── scheduler.ts
│   │   └── waterNotifications.ts
│   │
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── response.ts           # Response helpers
│   │   └── errors.ts             # Custom errors
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   └── app.ts                    # Entry point
│
├── prisma/
│   ├── schema.prisma             # Modelo de datos
│   └── migrations/
│
├── tests/
│   ├── unit/
│   └── integration/
│
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 6. Flujos de Datos Principales

### 6.1 Flujo de Autenticacion
```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Usuario │────▶│ Firebase │────▶│ Backend  │────▶│  Redis   │
│          │     │   Auth   │     │ Verify   │     │ Session  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                                  │
     │◀────── JWT Token ───────────────┘
     │
     ▼
┌──────────────────────────────────────────────┐
│  Almacenar token en memoria (Zustand)        │
│  NO en localStorage (seguridad)              │
└──────────────────────────────────────────────┘
```

### 6.2 Flujo de Cache Inteligente
```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ESTRATEGIA DE CACHE MULTINIVEL                       │
└─────────────────────────────────────────────────────────────────────────┘

   Peticion
      │
      ▼
┌──────────────┐    HIT     ┌──────────────────────────────────┐
│  TanStack    │───────────▶│  Retornar datos cacheados        │
│  Query Cache │            │  (staleTime configurado)         │
└──────────────┘            └──────────────────────────────────┘
      │ MISS
      ▼
┌──────────────┐    HIT     ┌──────────────────────────────────┐
│  IndexedDB   │───────────▶│  Retornar + Background refetch   │
│  (Offline)   │            │  si esta online                  │
└──────────────┘            └──────────────────────────────────┘
      │ MISS
      ▼
┌──────────────┐    HIT     ┌──────────────────────────────────┐
│  Redis       │───────────▶│  Retornar + Actualizar cliente   │
│  (Servidor)  │            │                                  │
└──────────────┘            └──────────────────────────────────┘
      │ MISS
      ▼
┌──────────────┐            ┌──────────────────────────────────┐
│  PostgreSQL  │───────────▶│  Actualizar todas las caches     │
│  (Origen)    │            │  con TTL apropiado               │
└──────────────┘            └──────────────────────────────────┘
```

### 6.3 Flujo de Peticion IA (Futuro)
```
┌────────────────────────────────────────────────────────────────────────────┐
│  FLUJO DE PETICION A IA CON VALIDACION Y APROBACION                       │
└────────────────────────────────────────────────────────────────────────────┘

┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Frontend │────▶│   Backend    │────▶│  AI Service  │────▶│   OpenAI /   │
│  Request │     │   Validate   │     │   Queue      │     │   Custom AI  │
└──────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                        │                                         │
                        │                                         │
                        ▼                                         ▼
              ┌──────────────────┐                    ┌──────────────────┐
              │  Verificar si    │                    │  Generar plan    │
              │  existe en cache │                    │  en formato JSON │
              └──────────────────┘                    └──────────────────┘
                                                              │
                                                              ▼
                                                    ┌──────────────────┐
                                                    │  Backend valida  │
                                                    │  y sanitiza JSON │
                                                    └──────────────────┘
                                                              │
      ┌───────────────────────────────────────────────────────┘
      ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Enviar preview  │────▶│  Usuario aprueba │────▶│  Persistir en DB │
│  al frontend     │     │  o rechaza       │     │  (confirmado)    │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                               │
                               │ RECHAZO
                               ▼
                    ┌──────────────────┐
                    │  Descartar plan  │
                    │  No se modifica  │
                    │  la base de datos│
                    └──────────────────┘
```

---

## 7. Comunicacion WebSocket

### 7.1 Eventos Definidos
```typescript
// Solo eventos criticos via WebSocket
enum SocketEvents {
  // Recordatorios de agua
  WATER_REMINDER = 'water:reminder',
  WATER_DISMISSED = 'water:dismissed',
  
  // Notificaciones de entrenamiento
  WORKOUT_REMINDER = 'workout:reminder',
  
  // Sincronizacion de datos (cuando hay conflictos)
  SYNC_CONFLICT = 'sync:conflict',
  SYNC_RESOLVED = 'sync:resolved',
  
  // AI (futuro)
  AI_PLAN_READY = 'ai:plan_ready',
  AI_PROCESSING = 'ai:processing'
}
```

### 7.2 Arquitectura WebSocket
```
┌─────────────────────────────────────────────────────────────┐
│                    SERVIDOR SOCKET.IO                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Connection Manager                                  │   │
│  │  - Autenticar conexiones con token                   │   │
│  │  - Asociar socket ID con user ID                     │   │
│  │  - Manejar reconexiones                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Room Management                                     │   │
│  │  - Cada usuario tiene su room (user:{userId})        │   │
│  │  - Permite enviar a usuario especifico               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Event Handlers                                      │   │
│  │  - water:reminder → Enviar cada X minutos            │   │
│  │  - Usar Redis para programar envios                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Proximos Documentos

Este documento se complementa con:

1. **DATABASE.md** - Esquema completo de base de datos
2. **API.md** - Especificacion de endpoints REST
3. **CACHE.md** - Estrategia detallada de cache
4. **AI_INTEGRATION.md** - Preparacion para microservicio IA
5. **SECURITY.md** - Controles de seguridad
6. **DIAGRAMS.md** - Diagramas adicionales (secuencia, flujo)

---

## 9. Decision Records

| ID | Decision | Justificacion |
|----|----------|---------------|
| ADR-001 | PostgreSQL sobre MongoDB | Datos relacionales fuertes, JSONB para flexibilidad |
| ADR-002 | Zustand sobre Redux | Menor boilerplate, mejor DX para equipo pequeno |
| ADR-003 | TanStack Query | Cache automatico, background refetch, devtools |
| ADR-004 | Redis para cache | Persistencia, TTL nativo, pub/sub para WS |
| ADR-005 | Adapter Pattern para IA | Cambiar proveedor sin modificar logica de negocio |
| ADR-006 | Pre-signed URLs S3 | Carga directa desde cliente, reduce carga servidor |
| ADR-007 | Firebase Auth | Ya integrado, OAuth providers incluidos |
| ADR-008 | WebSocket solo eventos criticos | Reducir conexiones abiertas, eficiencia recursos |

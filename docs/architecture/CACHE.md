# FitTrack Pro - Estrategia de Cache y Optimizacion

> Minimizar peticiones innecesarias y optimizar consumo de recursos
> Version: 1.0

---

## 1. Arquitectura de Cache Multinivel

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           CACHE MULTINIVEL FITTRACK PRO                                 │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                    CLIENTE (React)                         SERVIDOR (Node.js)
          ┌─────────────────────────────────┐    ┌─────────────────────────────────┐
          │                                 │    │                                 │
  Request │  ┌─────────────────────────┐   │    │   ┌─────────────────────────┐   │
─────────▶│  │   NIVEL 1: In-Memory    │   │    │   │   NIVEL 3: Redis        │   │
          │  │   (TanStack Query)      │   │    │   │   (Server Cache)        │   │
          │  │   TTL: 5-30 min         │   │    │   │   TTL: 1-24 horas       │   │
          │  └───────────┬─────────────┘   │    │   └───────────┬─────────────┘   │
          │              │ MISS            │    │               │ MISS            │
          │              ▼                 │    │               ▼                 │
          │  ┌─────────────────────────┐   │    │   ┌─────────────────────────┐   │
          │  │   NIVEL 2: IndexedDB    │   │    │   │   NIVEL 4: PostgreSQL   │   │
          │  │   (Dexie.js)            │───┼────┼──▶│   (Source of Truth)     │   │
          │  │   TTL: Persistente      │   │    │   │                         │   │
          │  └─────────────────────────┘   │    │   └─────────────────────────┘   │
          │                                 │    │                                 │
          └─────────────────────────────────┘    └─────────────────────────────────┘
```

---

## 2. Frontend Cache Strategy

### 2.1 TanStack Query Configuration

```typescript
// src/app/queryClient.js

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Datos considerados frescos por 5 minutos
      staleTime: 5 * 60 * 1000,
      
      // Cache en memoria por 30 minutos
      gcTime: 30 * 60 * 1000,
      
      // Reintentar 2 veces en caso de error
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch automatico
      refetchOnWindowFocus: false,  // Desactivado para ahorrar requests
      refetchOnReconnect: true,     // Si cuando hay reconexion
      refetchOnMount: false,        // Usar cache si existe
      
      // Placeholder mientras carga
      placeholderData: (previousData) => previousData,
    },
    mutations: {
      // Reintentar mutaciones fallidas
      retry: 1,
    },
  },
});
```

### 2.2 Cache Keys Strategy

```typescript
// src/services/api/queryKeys.js

export const queryKeys = {
  // Usuario
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    settings: () => [...queryKeys.user.all, 'settings'] as const,
  },
  
  // Nutricion
  nutrition: {
    all: ['nutrition'] as const,
    plans: () => [...queryKeys.nutrition.all, 'plans'] as const,
    plan: (id: string) => [...queryKeys.nutrition.all, 'plan', id] as const,
    meals: (date: string) => [...queryKeys.nutrition.all, 'meals', date] as const,
    mealsRange: (start: string, end: string) => 
      [...queryKeys.nutrition.all, 'meals', 'range', start, end] as const,
  },
  
  // Workouts
  workouts: {
    all: ['workouts'] as const,
    folders: () => [...queryKeys.workouts.all, 'folders'] as const,
    routines: (folderId?: string) => 
      [...queryKeys.workouts.all, 'routines', folderId || 'all'] as const,
    routine: (id: string) => [...queryKeys.workouts.all, 'routine', id] as const,
    sessions: (date: string) => [...queryKeys.workouts.all, 'sessions', date] as const,
    sessionsRange: (start: string, end: string) => 
      [...queryKeys.workouts.all, 'sessions', 'range', start, end] as const,
  },
  
  // Water
  water: {
    all: ['water'] as const,
    today: () => [...queryKeys.water.all, 'today'] as const,
    log: (date: string) => [...queryKeys.water.all, 'log', date] as const,
  },
  
  // Metrics
  metrics: {
    all: ['metrics'] as const,
    daily: (date: string) => [...queryKeys.metrics.all, 'daily', date] as const,
    weekly: (weekStart: string) => [...queryKeys.metrics.all, 'weekly', weekStart] as const,
    monthly: (year: number, month: number) => 
      [...queryKeys.metrics.all, 'monthly', year, month] as const,
    calendar: (year: number, month: number) => 
      [...queryKeys.metrics.all, 'calendar', year, month] as const,
  },
  
  // Exercises
  exercises: {
    all: ['exercises'] as const,
    catalog: () => [...queryKeys.exercises.all, 'catalog'] as const,
    search: (query: string) => [...queryKeys.exercises.all, 'search', query] as const,
    byMuscle: (muscle: string) => [...queryKeys.exercises.all, 'muscle', muscle] as const,
  },
};
```

### 2.3 Custom Hooks con Cache Optimizado

```typescript
// src/features/nutrition/hooks/useMeals.js

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/services/api/queryKeys';
import { nutritionApi } from '../services/nutritionApi';

export function useTodayMeals() {
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: queryKeys.nutrition.meals(today),
    queryFn: () => nutritionApi.getMeals(today),
    staleTime: 10 * 60 * 1000, // 10 minutos fresh
    
    // Sincronizar con IndexedDB
    initialData: () => {
      // Intentar cargar de IndexedDB primero
      return localCache.getMeals(today);
    },
    initialDataUpdatedAt: () => {
      return localCache.getTimestamp(`meals:${today}`);
    },
  });
}

export function useAddMeal() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  
  return useMutation({
    mutationFn: nutritionApi.addMeal,
    
    // Optimistic update
    onMutate: async (newMeal) => {
      // Cancelar queries en progreso
      await queryClient.cancelQueries({ 
        queryKey: queryKeys.nutrition.meals(today) 
      });
      
      // Snapshot del estado actual
      const previousMeals = queryClient.getQueryData(
        queryKeys.nutrition.meals(today)
      );
      
      // Optimistic update
      queryClient.setQueryData(
        queryKeys.nutrition.meals(today),
        (old) => [...(old || []), { ...newMeal, id: 'temp-' + Date.now() }]
      );
      
      return { previousMeals };
    },
    
    // Rollback en caso de error
    onError: (err, newMeal, context) => {
      queryClient.setQueryData(
        queryKeys.nutrition.meals(today),
        context.previousMeals
      );
    },
    
    // Refetch para obtener datos reales
    onSettled: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.nutrition.meals(today) 
      });
      
      // Actualizar metricas diarias
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.metrics.daily(today) 
      });
    },
  });
}
```

### 2.4 IndexedDB (Dexie.js) - Cache Local Persistente

```typescript
// src/services/storage/indexedDB.js

import Dexie from 'dexie';

class FitTrackDB extends Dexie {
  constructor() {
    super('FitTrackProDB');
    
    this.version(1).stores({
      // Cache de datos del servidor
      cache: 'key, data, timestamp, expiresAt',
      
      // Cola de sincronizacion offline
      syncQueue: '++id, type, payload, createdAt, retries',
      
      // Ejercicios (catalogo completo local)
      exercises: 'id, name, muscleGroup, *tags',
      
      // Datos del dia actual (acceso rapido)
      todayData: 'type, data, timestamp',
    });
  }
}

export const db = new FitTrackDB();

// Cache Manager
export const localCache = {
  async set(key, data, ttlMinutes = 60) {
    const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
    await db.cache.put({
      key,
      data: JSON.stringify(data),
      timestamp: Date.now(),
      expiresAt,
    });
  },
  
  async get(key) {
    const entry = await db.cache.get(key);
    if (!entry) return null;
    
    // Verificar expiracion
    if (Date.now() > entry.expiresAt) {
      await db.cache.delete(key);
      return null;
    }
    
    return JSON.parse(entry.data);
  },
  
  async getTimestamp(key) {
    const entry = await db.cache.get(key);
    return entry?.timestamp;
  },
  
  async invalidate(pattern) {
    // Invalidar keys que coincidan con patron
    const keys = await db.cache
      .where('key')
      .startsWith(pattern)
      .primaryKeys();
    await db.cache.bulkDelete(keys);
  },
  
  async clear() {
    await db.cache.clear();
  },
};

// Sync Queue para operaciones offline
export const syncQueue = {
  async add(type, payload) {
    await db.syncQueue.add({
      type,
      payload: JSON.stringify(payload),
      createdAt: Date.now(),
      retries: 0,
    });
  },
  
  async getAll() {
    return db.syncQueue.orderBy('createdAt').toArray();
  },
  
  async remove(id) {
    await db.syncQueue.delete(id);
  },
  
  async incrementRetries(id) {
    await db.syncQueue.update(id, { retries: db.syncQueue.get(id).retries + 1 });
  },
};
```

### 2.5 Sync Manager (Offline Support)

```typescript
// src/services/sync/syncManager.js

import { localCache, syncQueue } from '../storage/indexedDB';
import { api } from '../api/client';

class SyncManager {
  private isOnline = navigator.onLine;
  private syncInProgress = false;
  
  constructor() {
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }
  
  private handleOnline() {
    this.isOnline = true;
    this.processQueue();
  }
  
  private handleOffline() {
    this.isOnline = false;
  }
  
  async processQueue() {
    if (!this.isOnline || this.syncInProgress) return;
    
    this.syncInProgress = true;
    
    try {
      const items = await syncQueue.getAll();
      
      for (const item of items) {
        if (item.retries >= 3) {
          // Mover a dead letter queue o notificar
          await syncQueue.remove(item.id);
          continue;
        }
        
        try {
          const payload = JSON.parse(item.payload);
          await this.processItem(item.type, payload);
          await syncQueue.remove(item.id);
        } catch (error) {
          await syncQueue.incrementRetries(item.id);
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }
  
  private async processItem(type, payload) {
    switch (type) {
      case 'ADD_MEAL':
        await api.post('/nutrition/meals', payload);
        break;
      case 'ADD_WATER':
        await api.post('/water/log', payload);
        break;
      case 'START_WORKOUT':
        await api.post('/workouts/sessions', payload);
        break;
      // ... otros tipos
    }
  }
  
  // Wrapper para operaciones que deben funcionar offline
  async executeOrQueue(type, apiCall, payload) {
    if (this.isOnline) {
      try {
        return await apiCall();
      } catch (error) {
        // Si falla, encolar
        await syncQueue.add(type, payload);
        throw error;
      }
    } else {
      // Offline: encolar directamente
      await syncQueue.add(type, payload);
      return { queued: true };
    }
  }
}

export const syncManager = new SyncManager();
```

---

## 3. Backend Cache Strategy (Redis)

### 3.1 Redis Configuration

```typescript
// src/config/redis.ts

import Redis from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  
  // Connection pool
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
};

export const redis = new Redis(redisConfig);

// Subscriber para pub/sub (invalidacion de cache)
export const redisSub = new Redis(redisConfig);

// Health check
redis.on('connect', () => console.log('Redis connected'));
redis.on('error', (err) => console.error('Redis error:', err));
```

### 3.2 Cache Service

```typescript
// src/services/cache.service.ts

import { redis } from '@/config/redis';

// TTLs por tipo de dato (segundos)
const TTL = {
  USER_PROFILE: 3600,           // 1 hora
  USER_SETTINGS: 3600,          // 1 hora
  EXERCISES_CATALOG: 86400,     // 24 horas
  DAILY_DATA: 300,              // 5 minutos
  WEEKLY_METRICS: 1800,         // 30 minutos
  MONTHLY_METRICS: 3600,        // 1 hora
  AI_RESPONSE: 86400,           // 24 horas (respuestas IA cacheadas)
};

export const cacheService = {
  // Keys namespaced
  keys: {
    userProfile: (userId: string) => `user:${userId}:profile`,
    userSettings: (userId: string) => `user:${userId}:settings`,
    todayData: (userId: string) => `user:${userId}:today`,
    meals: (userId: string, date: string) => `user:${userId}:meals:${date}`,
    water: (userId: string, date: string) => `user:${userId}:water:${date}`,
    workouts: (userId: string, date: string) => `user:${userId}:workouts:${date}`,
    metrics: (userId: string, period: string) => `user:${userId}:metrics:${period}`,
    exercises: () => 'exercises:catalog',
    exercisesByMuscle: (muscle: string) => `exercises:muscle:${muscle}`,
    aiCache: (hash: string) => `ai:cache:${hash}`,
  },
  
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  },
  
  async set(key: string, data: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(data);
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }
  },
  
  async delete(key: string): Promise<void> {
    await redis.del(key);
  },
  
  async deletePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
  
  // Cache-aside pattern
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlSeconds: number
  ): Promise<T> {
    // Intentar obtener de cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    
    // Si no existe, obtener de origen
    const data = await fetchFn();
    
    // Guardar en cache
    await this.set(key, data, ttlSeconds);
    
    return data;
  },
  
  // Invalidar cache de usuario
  async invalidateUser(userId: string): Promise<void> {
    await this.deletePattern(`user:${userId}:*`);
  },
  
  // Invalidar datos de un dia especifico
  async invalidateDay(userId: string, date: string): Promise<void> {
    await Promise.all([
      this.delete(this.keys.meals(userId, date)),
      this.delete(this.keys.water(userId, date)),
      this.delete(this.keys.workouts(userId, date)),
      this.delete(this.keys.todayData(userId)),
    ]);
  },
};

export { TTL };
```

### 3.3 Cache Middleware

```typescript
// src/middleware/cache.ts

import { Request, Response, NextFunction } from 'express';
import { cacheService, TTL } from '@/services/cache.service';
import crypto from 'crypto';

interface CacheOptions {
  ttl: number;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
}

export function cacheMiddleware(options: CacheOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Solo cachear GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    // Verificar condicion
    if (options.condition && !options.condition(req)) {
      return next();
    }
    
    // Generar key
    const key = options.keyGenerator 
      ? options.keyGenerator(req)
      : generateDefaultKey(req);
    
    try {
      // Intentar obtener de cache
      const cached = await cacheService.get(key);
      
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }
      
      // Cache miss - interceptar response
      const originalJson = res.json.bind(res);
      res.json = (data: any) => {
        // Guardar en cache (async, no bloquear response)
        cacheService.set(key, data, options.ttl).catch(console.error);
        
        res.setHeader('X-Cache', 'MISS');
        return originalJson(data);
      };
      
      next();
    } catch (error) {
      // Si Redis falla, continuar sin cache
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

function generateDefaultKey(req: Request): string {
  const userId = req.user?.id || 'anonymous';
  const path = req.path;
  const query = JSON.stringify(req.query);
  
  const hash = crypto
    .createHash('md5')
    .update(`${userId}:${path}:${query}`)
    .digest('hex');
  
  return `cache:${hash}`;
}

// Middleware para invalidar cache despues de mutaciones
export function invalidateCacheMiddleware(patterns: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    
    res.json = async (data: any) => {
      // Invalidar patrones despues de responder
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user?.id;
        
        for (const pattern of patterns) {
          const resolvedPattern = pattern.replace('{userId}', userId || '*');
          await cacheService.deletePattern(resolvedPattern);
        }
      }
      
      return originalJson(data);
    };
    
    next();
  };
}
```

---

## 4. Estrategias por Modulo

### 4.1 Nutricion

```typescript
// Cache strategy para nutricion

const nutritionCacheStrategy = {
  // Comidas del dia - cache corto, cambia frecuentemente
  meals: {
    client: { staleTime: 5 * 60 * 1000 },   // 5 min fresh
    server: { ttl: 300 },                     // 5 min
    indexedDB: { ttl: 60 },                   // 1 hora
  },
  
  // Plan nutricional - cache largo, cambia poco
  plan: {
    client: { staleTime: 30 * 60 * 1000 },   // 30 min
    server: { ttl: 3600 },                    // 1 hora
    indexedDB: { ttl: 1440 },                 // 24 horas
  },
  
  // Calculos (IMC, TDEE) - cache muy largo, solo cambia con peso
  calculations: {
    client: { staleTime: Infinity },          // Siempre usar cache
    server: { ttl: 86400 },                   // 24 horas
    invalidateOn: ['weight_change'],          // Invalidar cuando cambia peso
  },
};
```

### 4.2 Workouts

```typescript
// Cache strategy para workouts

const workoutCacheStrategy = {
  // Catalogo de ejercicios - cache muy largo
  exerciseCatalog: {
    client: { staleTime: 24 * 60 * 60 * 1000 },   // 24 horas
    server: { ttl: 86400 },                        // 24 horas
    indexedDB: { ttl: 43200 },                     // 1 semana
    prefetch: true,                                // Cargar al iniciar app
  },
  
  // Rutinas del usuario - cache medio
  routines: {
    client: { staleTime: 10 * 60 * 1000 },   // 10 min
    server: { ttl: 1800 },                    // 30 min
    indexedDB: { ttl: 1440 },                 // 24 horas
  },
  
  // Sesion activa - no cachear
  activeSession: {
    client: { staleTime: 0 },
    server: { ttl: 0 },
    indexedDB: { persist: true },              // Para recuperar si se cierra app
  },
};
```

### 4.3 Water

```typescript
// Cache strategy para agua

const waterCacheStrategy = {
  // Log del dia - cache corto
  todayLog: {
    client: { staleTime: 1 * 60 * 1000 },    // 1 min
    server: { ttl: 60 },                      // 1 min
    realtime: true,                            // Optimistic updates
  },
  
  // Historial - cache medio
  history: {
    client: { staleTime: 30 * 60 * 1000 },   // 30 min
    server: { ttl: 3600 },                    // 1 hora
  },
};
```

---

## 5. Peticiones Inteligentes

### 5.1 Solo Pedir Cuando es Necesario

```typescript
// src/hooks/useSmartFetch.js

import { useQuery } from '@tanstack/react-query';
import { localCache } from '@/services/storage/indexedDB';

export function useSmartFetch(queryKey, fetchFn, options = {}) {
  const {
    staleTime = 5 * 60 * 1000,
    localTTL = 60,
    shouldRefetch = () => true,
  } = options;
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      // Verificar si realmente necesitamos refetch
      const localData = await localCache.get(queryKey.join(':'));
      const localTimestamp = await localCache.getTimestamp(queryKey.join(':'));
      
      if (localData && !shouldRefetch(localData, localTimestamp)) {
        return localData;
      }
      
      // Fetch del servidor
      const serverData = await fetchFn();
      
      // Guardar en local cache
      await localCache.set(queryKey.join(':'), serverData, localTTL);
      
      return serverData;
    },
    staleTime,
    
    // Usar datos locales como placeholder
    placeholderData: () => localCache.get(queryKey.join(':')),
  });
}

// Uso
function useDashboard() {
  return useSmartFetch(
    ['dashboard', 'today'],
    () => api.get('/dashboard/today'),
    {
      // Solo refetch si han pasado mas de 5 minutos
      shouldRefetch: (data, timestamp) => {
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        return timestamp < fiveMinutesAgo;
      },
    }
  );
}
```

### 5.2 Diff-based Sync

```typescript
// src/services/sync/diffSync.js

// Solo enviar cambios, no datos completos

export async function syncMealChanges(userId, date) {
  // Obtener version local
  const localVersion = await localCache.getVersion(`meals:${date}`);
  
  // Pedir solo cambios desde esa version
  const response = await api.get('/nutrition/meals/changes', {
    params: { date, sinceVersion: localVersion }
  });
  
  if (response.data.hasChanges) {
    // Aplicar cambios incrementales
    await localCache.applyChanges(`meals:${date}`, response.data.changes);
  }
  
  return response.data;
}

// Backend: endpoint de cambios
// GET /nutrition/meals/changes?date=2026-03-01&sinceVersion=5
// Response:
// {
//   hasChanges: true,
//   currentVersion: 7,
//   changes: [
//     { type: 'ADD', data: {...} },
//     { type: 'UPDATE', id: '...', data: {...} },
//     { type: 'DELETE', id: '...' }
//   ]
// }
```

### 5.3 Conditional Requests (ETag)

```typescript
// Backend middleware para ETag

import etag from 'etag';

export function etagMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);
  
  res.json = (data: any) => {
    const dataEtag = etag(JSON.stringify(data));
    res.setHeader('ETag', dataEtag);
    
    // Verificar If-None-Match
    const clientEtag = req.headers['if-none-match'];
    if (clientEtag === dataEtag) {
      return res.status(304).end();
    }
    
    return originalJson(data);
  };
  
  next();
}

// Frontend: incluir ETag en requests
const cachedEtag = await localCache.getEtag(key);
const response = await api.get(url, {
  headers: cachedEtag ? { 'If-None-Match': cachedEtag } : {},
});

if (response.status === 304) {
  // Usar datos locales, no hubo cambios
  return localCache.get(key);
}
```

---

## 6. Prefetch y Predictive Loading

```typescript
// src/services/prefetch/prefetchService.js

import { queryClient } from '@/app/queryClient';
import { queryKeys } from '@/services/api/queryKeys';

export const prefetchService = {
  // Prefetch al cargar la app
  async onAppLoad(userId) {
    await Promise.all([
      // Perfil del usuario (siempre necesario)
      queryClient.prefetchQuery({
        queryKey: queryKeys.user.profile(),
        queryFn: () => api.get('/users/me'),
      }),
      
      // Catalogo de ejercicios (grande pero estatico)
      queryClient.prefetchQuery({
        queryKey: queryKeys.exercises.catalog(),
        queryFn: () => api.get('/exercises'),
        staleTime: Infinity,
      }),
      
      // Datos de hoy
      queryClient.prefetchQuery({
        queryKey: queryKeys.metrics.daily(todayStr),
        queryFn: () => api.get(`/metrics/daily/${todayStr}`),
      }),
    ]);
  },
  
  // Prefetch predictivo basado en navegacion
  async onNavigate(route) {
    switch (route) {
      case '/nutrition':
        await this.prefetchNutrition();
        break;
      case '/workouts':
        await this.prefetchWorkouts();
        break;
      case '/metrics':
        await this.prefetchMetrics();
        break;
    }
  },
  
  async prefetchNutrition() {
    const today = new Date().toISOString().split('T')[0];
    
    // Prefetch comidas de hoy
    await queryClient.prefetchQuery({
      queryKey: queryKeys.nutrition.meals(today),
      queryFn: () => api.get(`/nutrition/meals/${today}`),
    });
    
    // Prefetch plan activo
    await queryClient.prefetchQuery({
      queryKey: queryKeys.nutrition.plans(),
      queryFn: () => api.get('/nutrition/plans'),
    });
  },
  
  async prefetchWorkouts() {
    // Prefetch folders y rutinas
    await queryClient.prefetchQuery({
      queryKey: queryKeys.workouts.folders(),
      queryFn: () => api.get('/workouts/folders'),
    });
  },
  
  async prefetchMetrics() {
    const now = new Date();
    const weekStart = getWeekStart(now);
    
    // Prefetch metricas de la semana
    await queryClient.prefetchQuery({
      queryKey: queryKeys.metrics.weekly(weekStart),
      queryFn: () => api.get(`/metrics/weekly/${weekStart}`),
    });
  },
};

// Hook para prefetch en hover
export function usePrefetchOnHover(route) {
  const prefetch = useCallback(() => {
    prefetchService.onNavigate(route);
  }, [route]);
  
  return {
    onMouseEnter: prefetch,
    onFocus: prefetch,
  };
}
```

---

## 7. Metricas de Cache

```typescript
// src/services/analytics/cacheMetrics.js

class CacheMetrics {
  private hits = 0;
  private misses = 0;
  private errors = 0;
  
  recordHit(source: 'memory' | 'indexeddb' | 'redis') {
    this.hits++;
    // Enviar a analytics si es necesario
  }
  
  recordMiss() {
    this.misses++;
  }
  
  getHitRate() {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  }
  
  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      errors: this.errors,
      hitRate: this.getHitRate(),
    };
  }
  
  reset() {
    this.hits = 0;
    this.misses = 0;
    this.errors = 0;
  }
}

export const cacheMetrics = new CacheMetrics();
```

---

## 8. Resumen de Tiempos de Cache

| Dato | Cliente (Memory) | IndexedDB | Redis | Invalidacion |
|------|------------------|-----------|-------|--------------|
| Perfil usuario | 30 min | 24h | 1h | Al editar perfil |
| Catalogo ejercicios | Infinito | 1 semana | 24h | Manual/deploy |
| Comidas del dia | 5 min | 1h | 5 min | Al agregar/editar |
| Agua del dia | 1 min | 1h | 1 min | Al registrar |
| Rutinas | 10 min | 24h | 30 min | Al modificar |
| Sesion activa | No cache | Persistente | No cache | Al terminar |
| Metricas semana | 30 min | 24h | 1h | Al final del dia |
| Metricas mes | 1h | 1 semana | 1h | Al final del dia |
| Respuestas IA | 24h | 1 semana | 24h | Manual |

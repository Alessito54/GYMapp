# FitTrack Pro - Estrategia de Seguridad

> Arquitectura de seguridad multinivel
> Version: 1.0

---

## 1. Vision General de Seguridad

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                          CAPAS DE SEGURIDAD FITTRACK PRO                                │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                    CAPA 1: PERIMETRO
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  - HTTPS/TLS 1.3 obligatorio                                                            │
│  - Rate limiting por IP                                                                 │
│  - WAF (Web Application Firewall)                                                       │
│  - DDoS protection (Cloudflare/AWS Shield)                                             │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
                    CAPA 2: AUTENTICACION
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  - Firebase Authentication                                                              │
│  - JWT tokens con expiracion corta                                                      │
│  - Refresh tokens seguros                                                               │
│  - Multi-factor authentication (opcional)                                               │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
                    CAPA 3: AUTORIZACION
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  - RBAC (Role-Based Access Control)                                                     │
│  - Verificacion de ownership en cada recurso                                            │
│  - Permisos granulares por endpoint                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
                    CAPA 4: VALIDACION
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  - Input validation (Zod schemas)                                                       │
│  - Sanitizacion de datos                                                                │
│  - Prevencion de inyecciones                                                            │
│  - Validacion de tipos                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
                    CAPA 5: DATOS
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  - Encriptacion en reposo                                                               │
│  - Encriptacion en transito                                                             │
│  - Aislamiento de datos por usuario                                                     │
│  - Backups encriptados                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Autenticacion

### 2.1 Firebase Authentication Setup

```typescript
// src/config/firebase.ts (Backend)

import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const serviceAccount: ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

const app = initializeApp({
  credential: cert(serviceAccount),
});

export const firebaseAuth = getAuth(app);

// Verificar token
export async function verifyFirebaseToken(token: string) {
  try {
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    return {
      valid: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
    };
  } catch (error) {
    return { valid: false, error };
  }
}
```

### 2.2 Auth Middleware

```typescript
// src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import { verifyFirebaseToken } from '@/config/firebase';
import { prisma } from '@/config/database';
import { redis } from '@/config/redis';

// Extender Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        firebaseUid: string;
        email: string;
        role: string;
      };
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // 1. Extraer token del header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // 2. Verificar si esta en blacklist (logout)
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token revoked' });
    }
    
    // 3. Intentar obtener de cache
    const cachedUser = await redis.get(`auth:${token}`);
    if (cachedUser) {
      req.user = JSON.parse(cachedUser);
      return next();
    }
    
    // 4. Verificar con Firebase
    const verification = await verifyFirebaseToken(token);
    if (!verification.valid) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // 5. Obtener usuario de DB
    const user = await prisma.user.findUnique({
      where: { firebaseUid: verification.uid },
      select: {
        id: true,
        firebaseUid: true,
        email: true,
        settings: true,
      },
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // 6. Cachear usuario (5 minutos)
    const userData = {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      role: (user.settings as any)?.role || 'user',
    };
    
    await redis.setex(`auth:${token}`, 300, JSON.stringify(userData));
    
    req.user = userData;
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Middleware para roles especificos
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
}

// Middleware opcional (para rutas publicas que pueden tener auth)
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  
  if (authHeader?.startsWith('Bearer ')) {
    // Intentar autenticar, pero no fallar si no es valido
    try {
      await authMiddleware(req, res, () => {});
    } catch {
      // Ignorar errores
    }
  }
  
  next();
}
```

### 2.3 Frontend Auth Context

```typescript
// src/features/auth/context/AuthContext.jsx

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import { api } from '@/services/api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Obtener token
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);
        
        // Configurar header por defecto
        api.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
        
        // Obtener perfil del backend
        try {
          const { data } = await api.get('/users/me');
          setUser({ ...firebaseUser, profile: data });
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
        setToken(null);
        delete api.defaults.headers.common['Authorization'];
      }
      
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);
  
  // Renovar token automaticamente
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(async () => {
      const newToken = await auth.currentUser?.getIdToken(true);
      if (newToken) {
        setToken(newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      }
    }, 10 * 60 * 1000); // Cada 10 minutos
    
    return () => clearInterval(interval);
  }, [user]);
  
  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };
  
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  };
  
  const logout = async () => {
    // Notificar al backend para invalidar cache
    try {
      await api.post('/auth/logout');
    } catch {
      // Continuar con logout aunque falle
    }
    
    await signOut(auth);
  };
  
  const value = {
    user,
    token,
    loading,
    login,
    loginWithGoogle,
    logout,
    isAuthenticated: !!user,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## 3. Autorizacion

### 3.1 Ownership Verification

```typescript
// src/middleware/ownership.ts

import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';

// Factory para crear middleware de ownership
export function verifyOwnership(
  resourceType: string,
  paramName: string = 'id'
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const resourceId = req.params[paramName];
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    if (!resourceId) {
      return res.status(400).json({ error: 'Resource ID required' });
    }
    
    try {
      let resource;
      
      switch (resourceType) {
        case 'routine':
          resource = await prisma.routine.findUnique({
            where: { id: resourceId },
            select: { userId: true },
          });
          break;
          
        case 'mealLog':
          resource = await prisma.mealLog.findUnique({
            where: { id: resourceId },
            select: { userId: true },
          });
          break;
          
        case 'workoutSession':
          resource = await prisma.workoutSession.findUnique({
            where: { id: resourceId },
            select: { userId: true },
          });
          break;
          
        case 'nutritionPlan':
          resource = await prisma.nutritionPlan.findUnique({
            where: { id: resourceId },
            select: { userId: true },
          });
          break;
          
        // ... otros recursos
        
        default:
          return res.status(500).json({ error: 'Unknown resource type' });
      }
      
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      if (resource.userId !== userId) {
        // Log intento de acceso no autorizado
        console.warn(`Unauthorized access attempt: User ${userId} tried to access ${resourceType} ${resourceId}`);
        return res.status(403).json({ error: 'Access denied' });
      }
      
      next();
      
    } catch (error) {
      console.error('Ownership verification error:', error);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

// Uso en rutas
// router.put('/routines/:id', authMiddleware, verifyOwnership('routine'), updateRoutine);
```

### 3.2 Query Scoping

```typescript
// src/services/base.service.ts

// Todas las queries deben ser scoped al usuario
export class BaseService {
  protected userId: string;
  
  constructor(userId: string) {
    this.userId = userId;
  }
  
  // Helper para asegurar que todas las queries incluyen userId
  protected scopeToUser<T extends { userId?: string }>(query: T): T & { userId: string } {
    return { ...query, userId: this.userId };
  }
}

// Ejemplo de servicio
export class NutritionService extends BaseService {
  async getMeals(date: string) {
    // userId automaticamente incluido
    return prisma.mealLog.findMany({
      where: this.scopeToUser({ date: new Date(date) }),
      orderBy: { mealType: 'asc' },
    });
  }
  
  async createMeal(data: CreateMealInput) {
    return prisma.mealLog.create({
      data: this.scopeToUser(data),
    });
  }
  
  async updateMeal(id: string, data: UpdateMealInput) {
    // Doble verificacion: where incluye userId
    return prisma.mealLog.update({
      where: { 
        id,
        userId: this.userId,  // Previene actualizacion de recursos de otros usuarios
      },
      data,
    });
  }
  
  async deleteMeal(id: string) {
    return prisma.mealLog.delete({
      where: { 
        id,
        userId: this.userId,
      },
    });
  }
}
```

---

## 4. Validacion de Entrada

### 4.1 Zod Schemas

```typescript
// src/modules/nutrition/nutrition.schema.ts

import { z } from 'zod';

// Schema para crear comida
export const CreateMealSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  mealType: z.enum(['BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'DINNER', 'EVENING_SNACK']),
  foods: z.array(z.object({
    name: z.string()
      .min(1, 'Food name required')
      .max(100, 'Food name too long')
      .transform(s => s.trim()),
    grams: z.number().positive().max(10000),
    calories: z.number().nonnegative().max(10000),
    protein: z.number().nonnegative().max(1000),
    carbs: z.number().nonnegative().max(1000),
    fat: z.number().nonnegative().max(1000),
  })).max(20, 'Too many food items'),
  notes: z.string().max(500).optional(),
});

export const UpdateMealSchema = CreateMealSchema.partial();

// Schema para actualizar perfil
export const UpdateProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name too short')
    .max(100, 'Name too long')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Invalid characters in name')
    .optional(),
  weight: z.number().positive().max(500).optional(),
  height: z.number().positive().max(300).optional(),
  birthDate: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  goal: z.enum(['WEIGHT_LOSS', 'MUSCLE_GAIN', 'MAINTENANCE', 'RECOMPOSITION']).optional(),
  activityLevel: z.enum(['SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTRA_ACTIVE']).optional(),
});

// Schema para crear rutina
export const CreateRoutineSchema = z.object({
  name: z.string()
    .min(1)
    .max(100)
    .transform(s => s.trim()),
  description: z.string().max(500).optional(),
  folderId: z.string().cuid().optional(),
  targetMuscles: z.array(z.enum([
    'CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'FOREARMS',
    'ABS', 'QUADRICEPS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'FULL_BODY', 'CARDIO'
  ])).min(1),
  defaultRestTime: z.number().int().min(0).max(600).default(90),
  exercises: z.array(z.object({
    exerciseId: z.string(),
    name: z.string().max(100),
    sets: z.number().int().min(1).max(20),
    reps: z.string().max(20),  // "8-12" o "AMRAP"
    weight: z.number().nonnegative().max(1000).optional(),
    restTime: z.number().int().min(0).max(600).optional(),
    notes: z.string().max(200).optional(),
    order: z.number().int().nonnegative(),
  })).max(50),
});

export type CreateMealInput = z.infer<typeof CreateMealSchema>;
export type UpdateMealInput = z.infer<typeof UpdateMealSchema>;
export type CreateRoutineInput = z.infer<typeof CreateRoutineSchema>;
```

### 4.2 Validation Middleware

```typescript
// src/middleware/validate.ts

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema, property: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[property]);
      req[property] = data;  // Usar datos validados y transformados
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        }));
        
        return res.status(400).json({
          error: 'Validation failed',
          details: errors,
        });
      }
      
      res.status(500).json({ error: 'Validation error' });
    }
  };
}

// Uso
// router.post('/meals', authMiddleware, validate(CreateMealSchema), createMeal);
```

---

## 5. Sanitizacion

### 5.1 JSON Sanitization (especialmente para respuestas de IA)

```typescript
// src/utils/sanitize.ts

import DOMPurify from 'isomorphic-dompurify';

// Sanitizar strings para prevenir XSS
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],  // No permitir HTML
    ALLOWED_ATTR: [],
  }).trim();
}

// Sanitizar objeto recursivamente
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => 
        typeof item === 'object' && item !== null 
          ? sanitizeObject(item as Record<string, unknown>)
          : typeof item === 'string' 
            ? sanitizeString(item)
            : item
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  
  return result as T;
}

// Sanitizar respuesta de IA
export function sanitizeAIResponse<T>(response: unknown, schema: ZodSchema<T>): T {
  // 1. Verificar que es un objeto
  if (typeof response !== 'object' || response === null) {
    throw new Error('Invalid AI response: not an object');
  }
  
  // 2. Sanitizar strings
  const sanitized = sanitizeObject(response as Record<string, unknown>);
  
  // 3. Validar contra schema
  const validated = schema.parse(sanitized);
  
  return validated;
}

// Middleware de sanitizacion
export function sanitizeMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}
```

### 5.2 SQL Injection Prevention

```typescript
// Prisma ORM ya previene SQL injection por defecto
// Pero nunca usar raw queries con input de usuario

// MAL - Vulnerable
const bad = await prisma.$queryRaw`
  SELECT * FROM users WHERE name = '${userInput}'
`;

// BIEN - Parametrizado
const good = await prisma.$queryRaw`
  SELECT * FROM users WHERE name = ${userInput}
`;

// MEJOR - Usar Prisma Client
const best = await prisma.user.findMany({
  where: { name: userInput },
});
```

---

## 6. Rate Limiting

### 6.1 Configuracion

```typescript
// src/middleware/rateLimit.ts

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '@/config/redis';

// Rate limit general
export const generalLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 100,                    // 100 requests por ventana
  message: {
    error: 'Too many requests',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
});

// Rate limit para autenticacion (mas estricto)
export const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 10,  // Solo 10 intentos de login
  message: {
    error: 'Too many login attempts',
    retryAfter: '15 minutes',
  },
});

// Rate limit para IA (muy estricto)
export const aiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:ai:',
  }),
  windowMs: 60 * 1000,  // 1 minuto
  max: 5,                // 5 requests a IA por minuto
  message: {
    error: 'AI rate limit exceeded',
    retryAfter: '1 minute',
  },
});

// Rate limit para uploads
export const uploadLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
    prefix: 'rl:upload:',
  }),
  windowMs: 60 * 60 * 1000,  // 1 hora
  max: 20,                     // 20 uploads por hora
  message: {
    error: 'Upload limit exceeded',
    retryAfter: '1 hour',
  },
});
```

---

## 7. Headers de Seguridad

```typescript
// src/middleware/security.ts

import helmet from 'helmet';
import cors from 'cors';

// Helmet para headers de seguridad
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],  // Ajustar segun necesidades
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.fittrackpro.com", "wss://api.fittrackpro.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: true,
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
});

// CORS configurado
export const corsConfig = cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://fittrackpro.com',
      'https://app.fittrackpro.com',
      // Desarrollo
      ...(process.env.NODE_ENV === 'development' ? ['http://localhost:5173'] : []),
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-RateLimit-Remaining', 'X-Cache'],
  maxAge: 86400,  // Preflight cache 24h
});
```

---

## 8. Almacenamiento Seguro de Imagenes

```typescript
// src/adapters/storage/s3.adapter.ts

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET!;

export const storageAdapter = {
  // Generar URL firmada para subir (cliente sube directamente a S3)
  async getUploadUrl(
    userId: string,
    fileType: string,
    fileSize: number
  ): Promise<{ uploadUrl: string; key: string }> {
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(fileType)) {
      throw new Error('Invalid file type');
    }
    
    // Validar tamano (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (fileSize > maxSize) {
      throw new Error('File too large');
    }
    
    // Generar key unica
    const fileExtension = fileType.split('/')[1];
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const key = `users/${userId}/workouts/${uniqueId}.${fileExtension}`;
    
    // Generar URL firmada (expira en 5 minutos)
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: fileType,
      ContentLength: fileSize,
      // Metadata
      Metadata: {
        'user-id': userId,
        'upload-timestamp': Date.now().toString(),
      },
    });
    
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300,  // 5 minutos
    });
    
    return { uploadUrl, key };
  },
  
  // Generar URL firmada para leer (temporal)
  async getReadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    
    // URL valida por 1 hora
    return getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });
  },
  
  // Eliminar imagen
  async deleteImage(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    
    await s3Client.send(command);
  },
};
```

---

## 9. Logging y Auditoria

```typescript
// src/utils/logger.ts

import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'fittrack-api' },
  transports: [
    // Archivo para errores
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    // Archivo para todo
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
  ],
});

// En desarrollo, tambien log a consola
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

export { logger };

// Audit log para acciones sensibles
export function auditLog(action: string, userId: string, details: Record<string, unknown>) {
  logger.info('AUDIT', {
    action,
    userId,
    ...details,
    timestamp: new Date().toISOString(),
  });
}

// Middleware de logging
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = crypto.randomUUID();
  req.headers['x-request-id'] = requestId;
  
  const start = Date.now();
  
  res.on('finish', () => {
    logger.info('HTTP Request', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: Date.now() - start,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  });
  
  next();
}
```

---

## 10. Checklist de Seguridad

```markdown
# Security Checklist

## Autenticacion
- [x] Firebase Auth integrado
- [x] JWT tokens con expiracion
- [x] Refresh token rotation
- [x] Logout invalida tokens
- [ ] MFA opcional

## Autorizacion
- [x] Verificacion de ownership
- [x] Query scoping por usuario
- [x] RBAC basico
- [ ] Permisos granulares

## Input Validation
- [x] Zod schemas en todos los endpoints
- [x] Sanitizacion de strings
- [x] Validacion de tipos de archivo
- [x] Limites de tamano

## Network
- [x] HTTPS obligatorio
- [x] CORS configurado
- [x] Headers de seguridad (Helmet)
- [x] Rate limiting

## Data
- [x] Prisma ORM (previene SQL injection)
- [x] URLs firmadas para imagenes
- [ ] Encriptacion datos sensibles
- [ ] Backups encriptados

## Monitoring
- [x] Logging estructurado
- [x] Audit logs
- [ ] Alertas de seguridad
- [ ] Intrusion detection

## Infrastructure
- [ ] WAF configurado
- [ ] DDoS protection
- [ ] Secrets management
- [ ] Regular security audits
```

---

## 11. Variables de Entorno Seguras

```bash
# .env.example

# Firebase
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=      # Almacenar en secrets manager
FIREBASE_CLIENT_EMAIL=

# Database
DATABASE_URL=              # Connection string con SSL

# Redis
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=           # Almacenar en secrets manager

# AWS S3
AWS_REGION=
AWS_ACCESS_KEY_ID=        # Usar IAM roles en produccion
AWS_SECRET_ACCESS_KEY=    # Almacenar en secrets manager
S3_BUCKET=

# JWT
JWT_SECRET=               # Almacenar en secrets manager, min 256 bits

# App
NODE_ENV=production
LOG_LEVEL=info
CORS_ORIGIN=https://fittrackpro.com

# AI (futuro)
OPENAI_API_KEY=           # Almacenar en secrets manager
```

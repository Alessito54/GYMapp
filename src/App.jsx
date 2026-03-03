import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { Dashboard, Nutrition, Workouts, Water, Profile, Login } from '@/pages';
import { useAuthStore, useUserStore, useWorkoutStore, useNutritionStore, useWaterStore } from '@/stores';

function PrivateRoute({ children }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

function DataLoader({ children }) {
  const { user } = useAuthStore();
  const { darkMode, loadUserData } = useUserStore();
  const loadWorkoutData = useWorkoutStore((state) => state.loadFromFirebase);
  const loadNutritionData = useNutritionStore((state) => state.loadFromFirebase);
  const loadWaterData = useWaterStore((state) => state.loadFromFirebase);
  const [isLoading, setIsLoading] = useState(true);

  // Synchronize theme state with document class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [darkMode]);

  useEffect(() => {
    const loadAllData = async () => {
      if (user) {
        setIsLoading(true);
        try {
          // Load all data from Firebase in parallel
          // loadUserData also applies dark mode classes from Firebase data
          await Promise.all([
            loadUserData(user.uid),
            loadWorkoutData(user.uid),
            loadNutritionData(user.uid),
            loadWaterData(user.uid)
          ]);
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    loadAllData();
  }, [user, loadUserData, loadWorkoutData, loadNutritionData, loadWaterData]);

  if (isLoading && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Sincronizando datos...</p>
        </div>
      </div>
    );
  }

  return children;
}

export default function App() {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <DataLoader>
              <Layout />
            </DataLoader>
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="nutrition" element={<Nutrition />} />
        <Route path="workouts" element={<Workouts />} />
        <Route path="water" element={<Water />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

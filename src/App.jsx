import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { Dashboard, Nutrition, Workouts, Water, Profile, Login } from '@/pages';
import { useAuthStore, useUserStore, useWorkoutStore, useNutritionStore, useWaterStore } from '@/stores';

function PrivateRoute({ children }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  const { user, initAuth } = useAuthStore();
  const loadUserData = useUserStore((state) => state.loadUserData);
  const loadWorkoutData = useWorkoutStore((state) => state.loadFromFirebase);
  const loadNutritionData = useNutritionStore((state) => state.loadFromFirebase);
  const loadWaterData = useWaterStore((state) => state.loadFromFirebase);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (user) {
      loadUserData(user.uid);
      loadWorkoutData(user.uid);
      loadNutritionData(user.uid);
      loadWaterData(user.uid);
    }
  }, [user, loadUserData, loadWorkoutData, loadNutritionData, loadWaterData]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
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

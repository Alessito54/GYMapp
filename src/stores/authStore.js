import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider } from '@/config/firebase';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      loading: true,
      error: null,

      // Initialize auth listener
      initAuth: () => {
        onAuthStateChanged(auth, (user) => {
          set({ user, loading: false });
        });
      },

      // Email/Password Login
      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const result = await signInWithEmailAndPassword(auth, email, password);
          set({ user: result.user, loading: false });
          return result.user;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Email/Password Register
      register: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const result = await createUserWithEmailAndPassword(auth, email, password);
          set({ user: result.user, loading: false });
          return result.user;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Google Login
      loginWithGoogle: async () => {
        set({ loading: true, error: null });
        try {
          const result = await signInWithPopup(auth, googleProvider);
          set({ user: result.user, loading: false });
          return result.user;
        } catch (error) {
          set({ error: error.message, loading: false });
          throw error;
        }
      },

      // Logout
      logout: async () => {
        try {
          await signOut(auth);
          set({ user: null });
        } catch (error) {
          set({ error: error.message });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

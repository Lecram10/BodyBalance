import { create } from 'zustand';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthState {
  user: User | null;
  isAuthLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // Luister naar auth state veranderingen
  onAuthStateChanged(auth, (user) => {
    set({ user, isAuthLoading: false });
  });

  return {
    user: null,
    isAuthLoading: true,
    error: null,

    login: async (email, password) => {
      set({ error: null });
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (err: any) {
        const messages: Record<string, string> = {
          'auth/invalid-credential': 'Onjuist e-mailadres of wachtwoord',
          'auth/invalid-email': 'Ongeldig e-mailadres',
          'auth/user-disabled': 'Dit account is uitgeschakeld',
          'auth/user-not-found': 'Geen account gevonden met dit e-mailadres',
          'auth/wrong-password': 'Onjuist wachtwoord',
          'auth/too-many-requests': 'Te veel pogingen. Probeer het later opnieuw',
          'auth/network-request-failed': 'Geen internetverbinding',
        };
        set({ error: messages[err.code] || 'Er ging iets mis. Probeer het opnieuw.' });
      }
    },

    register: async (email, password) => {
      set({ error: null });
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (err: any) {
        const messages: Record<string, string> = {
          'auth/email-already-in-use': 'Er bestaat al een account met dit e-mailadres',
          'auth/invalid-email': 'Ongeldig e-mailadres',
          'auth/weak-password': 'Wachtwoord moet minimaal 6 tekens zijn',
          'auth/network-request-failed': 'Geen internetverbinding',
        };
        set({ error: messages[err.code] || 'Er ging iets mis. Probeer het opnieuw.' });
      }
    },

    logout: async () => {
      await signOut(auth);
    },

    clearError: () => set({ error: null }),
  };
});

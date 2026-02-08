import { create } from 'zustand';
import type { MealEntry, MealType } from '../types/food';
import { getMealEntriesForDate, addMealEntry, removeMealEntry } from '../db/database';
import { format } from 'date-fns';

interface MealState {
  entries: MealEntry[];
  selectedDate: string;
  isLoading: boolean;
  setDate: (date: string) => void;
  loadEntries: () => Promise<void>;
  addEntry: (entry: Omit<MealEntry, 'id' | 'dailyLogId' | 'loggedAt'>) => Promise<void>;
  removeEntry: (id: number) => Promise<void>;
  getEntriesByMealType: (mealType: MealType) => MealEntry[];
  getTotalPoints: () => number;
  getPointsByMealType: (mealType: MealType) => number;
}

export const useMealStore = create<MealState>((set, get) => ({
  entries: [],
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  isLoading: false,

  setDate: (date: string) => {
    set({ selectedDate: date });
    get().loadEntries();
  },

  loadEntries: async () => {
    set({ isLoading: true });
    const entries = await getMealEntriesForDate(get().selectedDate);
    set({ entries, isLoading: false });
  },

  addEntry: async (entry) => {
    await addMealEntry(get().selectedDate, entry);
    await get().loadEntries();
  },

  removeEntry: async (id: number) => {
    await removeMealEntry(id);
    await get().loadEntries();
  },

  getEntriesByMealType: (mealType: MealType) => {
    return get().entries.filter((e) => e.mealType === mealType);
  },

  getTotalPoints: () => {
    return get().entries.reduce((sum, e) => sum + e.points, 0);
  },

  getPointsByMealType: (mealType: MealType) => {
    return get()
      .entries.filter((e) => e.mealType === mealType)
      .reduce((sum, e) => sum + e.points, 0);
  },
}));

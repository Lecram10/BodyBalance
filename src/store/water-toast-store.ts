import { create } from 'zustand';

interface WaterToastState {
  visible: boolean;
  waterMl: number;
  drinkName: string;
  percentage: number;
  entryId: number | null;
  /** Show the water-added toast. Auto-hides after 4 seconds. */
  show: (waterMl: number, drinkName: string, percentage: number, entryId?: number) => void;
  /** Hide the toast (used by dismiss / undo). */
  hide: () => void;
}

export const useWaterToastStore = create<WaterToastState>((set) => ({
  visible: false,
  waterMl: 0,
  drinkName: '',
  percentage: 1,
  entryId: null,

  show: (waterMl, drinkName, percentage, entryId) => {
    set({ visible: true, waterMl, drinkName, percentage, entryId: entryId ?? null });
  },

  hide: () => {
    set({ visible: false });
  },
}));

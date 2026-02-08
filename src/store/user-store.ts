import { create } from 'zustand';
import type { UserProfile } from '../types/user';
import { db } from '../db/database';

interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  loadProfile: () => Promise<void>;
  saveProfile: (profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateWeight: (weightKg: number) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  isLoading: true,

  loadProfile: async () => {
    set({ isLoading: true });
    const profiles = await db.userProfiles.toArray();
    const profile = profiles[0] || null;
    set({ profile, isLoading: false });
  },

  saveProfile: async (profileData) => {
    const existing = get().profile;
    const now = new Date();

    if (existing?.id) {
      await db.userProfiles.update(existing.id, {
        ...profileData,
        updatedAt: now,
      });
      set({
        profile: { ...existing, ...profileData, updatedAt: now },
      });
    } else {
      const id = await db.userProfiles.add({
        ...profileData,
        createdAt: now,
        updatedAt: now,
      });
      const profile = await db.userProfiles.get(id);
      set({ profile: profile || null });
    }
  },

  updateWeight: async (weightKg: number) => {
    const profile = get().profile;
    if (!profile?.id) return;

    await db.userProfiles.update(profile.id, {
      currentWeightKg: weightKg,
      updatedAt: new Date(),
    });

    set({
      profile: { ...profile, currentWeightKg: weightKg, updatedAt: new Date() },
    });
  },
}));

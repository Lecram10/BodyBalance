import { create } from 'zustand';
import type { UserProfile } from '../types/user';
import { db } from '../db/database';
import { auth } from '../lib/firebase';
import { pushProfile } from '../lib/firestore-sync';

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
      const updated = { ...existing, ...profileData, updatedAt: now };
      set({ profile: updated });
      // Sync naar Firestore
      const uid = auth.currentUser?.uid;
      if (uid) pushProfile(uid, updated).catch(() => {});
    } else {
      const id = await db.userProfiles.add({
        ...profileData,
        createdAt: now,
        updatedAt: now,
      });
      const profile = await db.userProfiles.get(id);
      set({ profile: profile || null });
      // Sync naar Firestore
      const uid = auth.currentUser?.uid;
      if (uid && profile) pushProfile(uid, profile).catch(() => {});
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

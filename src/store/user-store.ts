import { create } from 'zustand';
import type { UserProfile, Goal } from '../types/user';
import { db } from '../db/database';
import { auth } from '../lib/firebase';
import { pushProfile } from '../lib/firestore-sync';
import { calculateBudget } from '../lib/budget-calculator';

export interface WeightUpdateResult {
  oldDailyBudget: number;
  newDailyBudget: number;
  oldWeeklyBudget: number;
  newWeeklyBudget: number;
  goalReached: boolean;
  goalSwitched: boolean;
}

interface UserState {
  profile: UserProfile | null;
  isLoading: boolean;
  loadProfile: () => Promise<void>;
  saveProfile: (profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateWeight: (weightKg: number) => Promise<WeightUpdateResult | null>;
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
    if (!profile?.id) return null;

    const oldDailyBudget = profile.dailyPointsBudget;
    const oldWeeklyBudget = profile.weeklyPointsBudget;

    // Check of doelgewicht bereikt is
    let newGoal: Goal = profile.goal;
    const goalReached = profile.goal === 'lose' && weightKg <= profile.goalWeightKg;
    const goalSwitched = goalReached;
    if (goalReached) {
      newGoal = 'maintain';
    }

    // Herbereken budget met nieuw gewicht (en eventueel nieuw doel)
    const budget = calculateBudget(
      weightKg,
      profile.heightCm,
      profile.dateOfBirth,
      profile.gender,
      profile.activityLevel,
      newGoal
    );

    const now = new Date();
    const updates: Partial<UserProfile> = {
      currentWeightKg: weightKg,
      dailyPointsBudget: budget.dailyPoints,
      weeklyPointsBudget: budget.weeklyPoints,
      updatedAt: now,
    };

    if (goalSwitched) {
      updates.goal = 'maintain';
    }

    await db.userProfiles.update(profile.id, updates);

    const updatedProfile = { ...profile, ...updates };
    set({ profile: updatedProfile });

    // Sync naar Firestore
    const uid = auth.currentUser?.uid;
    if (uid) pushProfile(uid, updatedProfile).catch(() => {});

    return {
      oldDailyBudget,
      newDailyBudget: budget.dailyPoints,
      oldWeeklyBudget,
      newWeeklyBudget: budget.weeklyPoints,
      goalReached,
      goalSwitched,
    };
  },
}));

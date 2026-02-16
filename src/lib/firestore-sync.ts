/**
 * Firestore Sync Service — offline-first synchronisatie.
 *
 * Strategie:
 * - IndexedDB is de primaire bron (snel, offline)
 * - Na elke lokale schrijfactie → push naar Firestore (fire-and-forget)
 * - Bij login → pull van Firestore en merge met lokaal
 * - Conflict: laatst gewijzigd wint (updatedAt timestamp)
 *
 * Firestore structuur:
 *   users/{userId}/profile          → UserProfile
 *   users/{userId}/days/{date}      → DailyLog + mealEntries[]
 *   users/{userId}/weight/{date}    → WeightEntry
 *   users/{userId}/foods/{localId}  → FoodItem (eigen producten)
 */
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  deleteDoc,
} from 'firebase/firestore';
import { firestore } from './firebase';
import { db } from '../db/database';
import type { UserProfile, WeightEntry } from '../types/user';
import type { FoodItem } from '../types/food';

// ─── Helpers ────────────────────────────────────────────────

function toFirestoreDate(d: Date | string | undefined): string | null {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString();
  return d;
}

function fromFirestoreDate(s: string | null): Date {
  return s ? new Date(s) : new Date();
}

// ─── Push: lokaal → Firestore ───────────────────────────────

/**
 * Push het gebruikersprofiel naar Firestore.
 */
export async function pushProfile(userId: string, profile: UserProfile): Promise<void> {
  try {
    const ref = doc(firestore, 'users', userId, 'profile', 'data');
    await setDoc(ref, {
      ...profile,
      id: undefined,
      createdAt: toFirestoreDate(profile.createdAt),
      updatedAt: toFirestoreDate(profile.updatedAt || new Date()),
    });
  } catch (err) {
    console.warn('[Sync] Push profile failed:', err);
  }
}

/**
 * Push een daglog met alle maaltijden naar Firestore.
 */
export async function pushDay(userId: string, date: string): Promise<void> {
  try {
    const log = await db.dailyLogs.where('date').equals(date).first();
    if (!log) return;

    const entries = log.id
      ? await db.mealEntries.where('dailyLogId').equals(log.id).toArray()
      : [];

    const ref = doc(firestore, 'users', userId, 'days', date);
    await setDoc(ref, {
      date: log.date,
      totalPointsUsed: log.totalPointsUsed,
      weeklyPointsUsed: log.weeklyPointsUsed,
      waterMl: log.waterMl ?? 0,
      meals: entries.map((e) => ({
        foodItem: {
          name: e.foodItem.name,
          brand: e.foodItem.brand || '',
          barcode: e.foodItem.barcode || '',
          nutrition: e.foodItem.nutrition,
          pointsPer100g: e.foodItem.pointsPer100g,
          servingSizeG: e.foodItem.servingSizeG,
          unit: e.foodItem.unit || 'g',
          isZeroPoint: e.foodItem.isZeroPoint,
          source: e.foodItem.source,
        },
        mealType: e.mealType,
        quantityG: e.quantityG,
        quantity: e.quantity ?? 1,
        points: e.points,
        loggedAt: toFirestoreDate(e.loggedAt),
      })),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Sync] Push day failed:', err);
  }
}

/**
 * Push een gewichtsmeting naar Firestore.
 */
export async function pushWeight(userId: string, entry: WeightEntry): Promise<void> {
  try {
    const ref = doc(firestore, 'users', userId, 'weight', entry.date);
    await setDoc(ref, {
      date: entry.date,
      weightKg: entry.weightKg,
      note: entry.note || '',
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Sync] Push weight failed:', err);
  }
}

/**
 * Push een eigen product naar Firestore.
 */
export async function pushFood(userId: string, food: FoodItem): Promise<void> {
  try {
    if (food.source !== 'user' || !food.id) return;
    const ref = doc(firestore, 'users', userId, 'foods', String(food.id));
    await setDoc(ref, {
      name: food.name,
      brand: food.brand || '',
      barcode: food.barcode || '',
      nutrition: food.nutrition,
      pointsPer100g: food.pointsPer100g,
      servingSizeG: food.servingSizeG,
      unit: food.unit || 'g',
      isZeroPoint: food.isZeroPoint,
      isFavorite: food.isFavorite || false,
      source: food.source,
      createdAt: toFirestoreDate(food.createdAt),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Sync] Push food failed:', err);
  }
}

/**
 * Verwijder een gewichtsmeting uit Firestore.
 */
export async function deleteWeight(userId: string, date: string): Promise<void> {
  try {
    const ref = doc(firestore, 'users', userId, 'weight', date);
    await deleteDoc(ref);
  } catch (err) {
    console.warn('[Sync] Delete weight failed:', err);
  }
}

// ─── Pull: Firestore → lokaal ───────────────────────────────

/**
 * Pull alle data van Firestore en merge met lokale IndexedDB.
 * Alleen data die nieuwer is dan lokaal wordt overgenomen.
 */
export async function pullAll(userId: string): Promise<boolean> {
  try {
    let hasChanges = false;

    // 1. Profiel
    const profileRef = doc(firestore, 'users', userId, 'profile', 'data');
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) {
      const remote = profileSnap.data();
      const localProfiles = await db.userProfiles.toArray();
      const local = localProfiles[0];

      const remoteUpdated = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
      const localUpdated = local?.updatedAt ? new Date(local.updatedAt).getTime() : 0;

      if (remoteUpdated > localUpdated) {
        const profileData = {
          name: remote.name,
          gender: remote.gender,
          dateOfBirth: remote.dateOfBirth,
          heightCm: remote.heightCm,
          currentWeightKg: remote.currentWeightKg,
          goalWeightKg: remote.goalWeightKg,
          activityLevel: remote.activityLevel,
          goal: remote.goal,
          dailyPointsBudget: remote.dailyPointsBudget,
          weeklyPointsBudget: remote.weeklyPointsBudget,
          waterGoalMl: remote.waterGoalMl,
          onboardingComplete: remote.onboardingComplete,
          createdAt: fromFirestoreDate(remote.createdAt),
          updatedAt: fromFirestoreDate(remote.updatedAt),
        } as UserProfile;

        if (local?.id) {
          await db.userProfiles.update(local.id, profileData);
        } else {
          await db.userProfiles.add(profileData);
        }
        hasChanges = true;
      }
    }

    // 2. Dagen (logs + maaltijden)
    const daysSnap = await getDocs(collection(firestore, 'users', userId, 'days'));
    for (const dayDoc of daysSnap.docs) {
      const remote = dayDoc.data();
      const date = dayDoc.id;

      const localLog = await db.dailyLogs.where('date').equals(date).first();
      const remoteUpdated = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;

      // Alleen overnemen als er lokaal niets is, of als remote nieuwer is
      const shouldUpdate = !localLog || remoteUpdated > (localLog as any)._syncedAt || 0;

      if (shouldUpdate && remote.meals?.length > 0) {
        // Maak of update daglog
        let logId: number;
        if (localLog?.id) {
          await db.dailyLogs.update(localLog.id, {
            totalPointsUsed: remote.totalPointsUsed,
            weeklyPointsUsed: remote.weeklyPointsUsed,
            waterMl: remote.waterMl ?? 0,
          });
          logId = localLog.id;
          // Verwijder bestaande entries voor deze dag
          const oldEntries = await db.mealEntries.where('dailyLogId').equals(logId).toArray();
          for (const e of oldEntries) {
            if (e.id) await db.mealEntries.delete(e.id);
          }
        } else {
          logId = await db.dailyLogs.add({
            date,
            totalPointsUsed: remote.totalPointsUsed,
            weeklyPointsUsed: remote.weeklyPointsUsed,
            waterMl: remote.waterMl ?? 0,
          });
        }

        // Voeg maaltijden toe
        for (const meal of remote.meals) {
          await db.mealEntries.add({
            dailyLogId: logId,
            foodItem: {
              name: meal.foodItem.name,
              brand: meal.foodItem.brand,
              barcode: meal.foodItem.barcode,
              nutrition: meal.foodItem.nutrition,
              pointsPer100g: meal.foodItem.pointsPer100g,
              servingSizeG: meal.foodItem.servingSizeG,
              unit: meal.foodItem.unit || 'g',
              isZeroPoint: meal.foodItem.isZeroPoint,
              source: meal.foodItem.source,
              createdAt: new Date(),
            },
            mealType: meal.mealType,
            quantityG: meal.quantityG,
            quantity: meal.quantity ?? 1,
            points: meal.points,
            loggedAt: fromFirestoreDate(meal.loggedAt),
          });
        }
        hasChanges = true;
      } else if (shouldUpdate && localLog && !remote.meals?.length) {
        // Update water/points zonder maaltijden te overschrijven
        await db.dailyLogs.update(localLog.id!, {
          waterMl: remote.waterMl ?? localLog.waterMl ?? 0,
        });
      }
    }

    // 3. Gewicht
    const weightSnap = await getDocs(collection(firestore, 'users', userId, 'weight'));
    for (const wDoc of weightSnap.docs) {
      const remote = wDoc.data();
      const date = wDoc.id;
      const local = await db.weightEntries.where('date').equals(date).first();
      if (!local) {
        await db.weightEntries.add({
          date,
          weightKg: remote.weightKg,
          note: remote.note || '',
        });
        hasChanges = true;
      }
    }

    // 4. Eigen producten
    const foodsSnap = await getDocs(collection(firestore, 'users', userId, 'foods'));
    for (const fDoc of foodsSnap.docs) {
      const remote = fDoc.data();
      // Check of dit product lokaal bestaat (op naam)
      const local = await db.foodItems
        .where('name')
        .equalsIgnoreCase(remote.name)
        .first();
      if (!local) {
        await db.foodItems.add({
          name: remote.name,
          brand: remote.brand,
          barcode: remote.barcode,
          nutrition: remote.nutrition,
          pointsPer100g: remote.pointsPer100g,
          servingSizeG: remote.servingSizeG,
          unit: remote.unit || 'g',
          isZeroPoint: remote.isZeroPoint,
          isFavorite: remote.isFavorite || false,
          source: 'user',
          createdAt: fromFirestoreDate(remote.createdAt),
        });
        hasChanges = true;
      }
    }

    console.log(`[Sync] Pull complete. Changes: ${hasChanges}`);
    return hasChanges;
  } catch (err) {
    console.warn('[Sync] Pull failed:', err);
    return false;
  }
}

/**
 * Push ALLE lokale data naar Firestore (initiële sync).
 */
export async function pushAll(userId: string): Promise<void> {
  try {
    // Profiel
    const profiles = await db.userProfiles.toArray();
    if (profiles[0]) {
      await pushProfile(userId, profiles[0]);
    }

    // Alle dagen
    const logs = await db.dailyLogs.toArray();
    for (const log of logs) {
      await pushDay(userId, log.date);
    }

    // Gewicht
    const weights = await db.weightEntries.toArray();
    for (const w of weights) {
      await pushWeight(userId, w);
    }

    // Eigen producten
    const foods = await db.foodItems.where('source').equals('user').toArray();
    for (const f of foods) {
      await pushFood(userId, f);
    }

    console.log('[Sync] Push all complete.');
  } catch (err) {
    console.warn('[Sync] Push all failed:', err);
  }
}

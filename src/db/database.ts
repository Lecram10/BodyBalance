import Dexie, { type Table } from 'dexie';
import type { FoodItem, MealEntry } from '../types/food';
import type { UserProfile, WeightEntry, DailyLog } from '../types/user';

export class BodyBalanceDB extends Dexie {
  userProfiles!: Table<UserProfile, number>;
  foodItems!: Table<FoodItem, number>;
  mealEntries!: Table<MealEntry, number>;
  dailyLogs!: Table<DailyLog, number>;
  weightEntries!: Table<WeightEntry, number>;

  constructor() {
    super('BodyBalanceDB');

    this.version(1).stores({
      userProfiles: '++id, name',
      foodItems: '++id, name, barcode, source',
      mealEntries: '++id, dailyLogId, mealType, loggedAt',
      dailyLogs: '++id, &date',
      weightEntries: '++id, &date',
    });
  }
}

export const db = new BodyBalanceDB();

// Helper: haal of maak de daglog voor vandaag
export async function getOrCreateDailyLog(date: string): Promise<DailyLog> {
  let log = await db.dailyLogs.where('date').equals(date).first();
  if (!log) {
    const id = await db.dailyLogs.add({
      date,
      totalPointsUsed: 0,
      weeklyPointsUsed: 0,
    });
    log = (await db.dailyLogs.get(id))!;
  }
  return log;
}

// Helper: haal alle maaltijden op voor een datum
export async function getMealEntriesForDate(date: string): Promise<MealEntry[]> {
  const log = await db.dailyLogs.where('date').equals(date).first();
  if (!log?.id) return [];
  return db.mealEntries.where('dailyLogId').equals(log.id).toArray();
}

// Helper: voeg maaltijdentry toe en update daglog
export async function addMealEntry(
  date: string,
  entry: Omit<MealEntry, 'id' | 'dailyLogId' | 'loggedAt'>
): Promise<void> {
  const log = await getOrCreateDailyLog(date);

  await db.mealEntries.add({
    ...entry,
    dailyLogId: log.id!,
    loggedAt: new Date(),
  });

  // Herbereken totaal
  const entries = await db.mealEntries
    .where('dailyLogId')
    .equals(log.id!)
    .toArray();
  const totalPoints = entries.reduce((sum, e) => sum + e.points, 0);

  await db.dailyLogs.update(log.id!, {
    totalPointsUsed: totalPoints,
  });
}

// Helper: verwijder maaltijdentry en update daglog
export async function removeMealEntry(entryId: number): Promise<void> {
  const entry = await db.mealEntries.get(entryId);
  if (!entry) return;

  await db.mealEntries.delete(entryId);

  if (entry.dailyLogId) {
    const entries = await db.mealEntries
      .where('dailyLogId')
      .equals(entry.dailyLogId)
      .toArray();
    const totalPoints = entries.reduce((sum, e) => sum + e.points, 0);

    await db.dailyLogs.update(entry.dailyLogId, {
      totalPointsUsed: totalPoints,
    });
  }
}

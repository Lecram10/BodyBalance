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

    // v2: isFavorite index op foodItems
    this.version(2).stores({
      foodItems: '++id, name, barcode, source, isFavorite',
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

// Helper: haal recent gebruikte producten op (uniek, laatste 15)
export async function getRecentFoods(limit = 15): Promise<FoodItem[]> {
  const allEntries = await db.mealEntries
    .orderBy('loggedAt')
    .reverse()
    .toArray();

  const seen = new Set<string>();
  const recentFoods: FoodItem[] = [];

  for (const entry of allEntries) {
    const key = entry.foodItem.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      // Check of dit product een favoriet is in de foodItems tabel
      const stored = await db.foodItems
        .where('name')
        .equalsIgnoreCase(entry.foodItem.name)
        .first();
      recentFoods.push({
        ...entry.foodItem,
        isFavorite: stored?.isFavorite ?? false,
        id: stored?.id ?? entry.foodItem.id,
      });
      if (recentFoods.length >= limit) break;
    }
  }

  return recentFoods;
}

// Helper: haal alle favoriete producten op
export async function getFavoriteFoods(): Promise<FoodItem[]> {
  // Gebruik .filter() i.p.v. indexed query: IndexedDB slaat booleans
  // inconsistent op (true vs 1), .filter() werkt met beide
  return db.foodItems
    .filter(item => !!item.isFavorite)
    .toArray();
}

// Helper: toggle favoriet status voor een product
export async function toggleFavorite(food: FoodItem): Promise<boolean> {
  // Zoek of het product al in de DB staat (altijd op naam zoeken als fallback)
  let existing: FoodItem | undefined;
  if (food.id) {
    existing = await db.foodItems.get(food.id);
  }
  if (!existing) {
    existing = await db.foodItems.where('name').equalsIgnoreCase(food.name).first();
  }

  if (existing?.id) {
    const newStatus = !existing.isFavorite;
    await db.foodItems.update(existing.id, { isFavorite: newStatus });
    return newStatus;
  } else {
    // Sla het product op als nieuw met isFavorite = true
    await db.foodItems.add({
      ...food,
      id: undefined,
      isFavorite: true,
      createdAt: new Date(),
    });
    return true;
  }
}

// Helper: sla een eigen product op
export async function saveCustomFood(food: Omit<FoodItem, 'id' | 'createdAt'>): Promise<FoodItem> {
  const id = await db.foodItems.add({
    ...food,
    createdAt: new Date(),
  });
  return (await db.foodItems.get(id))!;
}

// Helper: haal alle eigen producten op
export async function getUserFoods(): Promise<FoodItem[]> {
  return db.foodItems
    .where('source')
    .equals('user')
    .toArray();
}

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

// Helper: update een bestaande maaltijdentry (aantal, hoeveelheid, punten)
export async function updateMealEntry(
  entryId: number,
  updates: { quantityG: number; quantity?: number; points: number }
): Promise<void> {
  const entry = await db.mealEntries.get(entryId);
  if (!entry) return;

  await db.mealEntries.update(entryId, updates);

  // Herbereken daglog totaal
  if (entry.dailyLogId) {
    const entries = await db.mealEntries
      .where('dailyLogId')
      .equals(entry.dailyLogId)
      .toArray();
    const totalPoints = entries.reduce((sum, e) => sum + (e.id === entryId ? updates.points : e.points), 0);
    await db.dailyLogs.update(entry.dailyLogId, { totalPointsUsed: totalPoints });
  }
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

/**
 * Bereken hoeveel weekpunten er deze week verbruikt zijn.
 * Weekpunten = som van alle dagelijkse overschrijdingen (ma-zo).
 * Als je op een dag 35 eet bij budget 30, kost dat 5 weekpunten.
 * Onder budget blijven kost geen weekpunten (ongebruikte dagpunten tellen niet op).
 */
export async function getWeeklyPointsUsed(
  currentDate: string,
  dailyBudget: number
): Promise<number> {
  // Bepaal maandag van deze week
  const date = new Date(currentDate);
  const dayOfWeek = date.getDay(); // 0=zo, 1=ma, ..., 6=za
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);

  let totalOverage = 0;

  // Loop door elke dag van ma t/m vandaag
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    // Stop als we voorbij de geselecteerde datum zijn
    if (dateStr > currentDate) break;

    const log = await db.dailyLogs.where('date').equals(dateStr).first();
    if (log && log.totalPointsUsed > dailyBudget) {
      totalOverage += log.totalPointsUsed - dailyBudget;
    }
  }

  return totalOverage;
}

/**
 * Haal de waterinname op voor een datum (in ml).
 */
export async function getWaterIntake(date: string): Promise<number> {
  const log = await db.dailyLogs.where('date').equals(date).first();
  return log?.waterMl ?? 0;
}

/**
 * Voeg water toe aan de daglog (in ml). Geeft het nieuwe totaal terug.
 */
export async function addWaterIntake(date: string, ml: number): Promise<number> {
  const log = await getOrCreateDailyLog(date);
  const newTotal = (log.waterMl ?? 0) + ml;
  await db.dailyLogs.update(log.id!, { waterMl: newTotal });
  return newTotal;
}

/**
 * Reset waterinname voor een datum.
 */
export async function resetWaterIntake(date: string): Promise<void> {
  const log = await db.dailyLogs.where('date').equals(date).first();
  if (log?.id) {
    await db.dailyLogs.update(log.id, { waterMl: 0 });
  }
}

/**
 * Kopieer alle maaltijden van een brondag naar een doeldatum.
 * Retourneert het aantal gekopieerde entries.
 */
export async function copyDayEntries(fromDate: string, toDate: string): Promise<number> {
  const sourceEntries = await getMealEntriesForDate(fromDate);
  if (sourceEntries.length === 0) return 0;

  for (const entry of sourceEntries) {
    await addMealEntry(toDate, {
      foodItem: entry.foodItem,
      mealType: entry.mealType,
      quantityG: entry.quantityG,
      quantity: entry.quantity,
      points: entry.points,
    });
  }

  return sourceEntries.length;
}

/**
 * Weekrapport: samenvatting van de vorige week (ma-zo).
 */
export interface WeekSummary {
  weekLabel: string;           // bijv. "Week 6 · 3-9 feb"
  avgPoints: number;           // gemiddelde punten per dag
  dailyBudget: number;
  daysWithinBudget: number;    // dagen onder dagbudget
  totalDays: number;           // dagen met data
  waterDaysOnTarget: number;   // dagen waterdoel gehaald
  waterTotalDays: number;
  weightChange: number | null; // kg verschil (null als geen data)
  bestDay: string | null;      // naam van dag met laagste punten
  bestDayPoints: number;
  weeklyPointsUsed: number;    // weekpunten verbruikt
  weeklyPointsBudget: number;
}

export async function getWeekSummary(
  dailyBudget: number,
  weeklyBudget: number,
  waterGoalMl: number
): Promise<WeekSummary | null> {
  // Vorige week: ma-zo
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=zo, 1=ma
  const daysBack = dayOfWeek === 0 ? 7 : dayOfWeek + 6; // terug naar vorige maandag
  const prevMonday = new Date(now);
  prevMonday.setDate(now.getDate() - daysBack);

  let totalPoints = 0;
  let totalDays = 0;
  let daysWithinBudget = 0;
  let waterDaysOnTarget = 0;
  let waterTotalDays = 0;
  let bestDay: string | null = null;
  let bestDayPoints = Infinity;
  let weeklyOverage = 0;

  const dayNames = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(prevMonday);
    d.setDate(prevMonday.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const log = await db.dailyLogs.where('date').equals(dateStr).first();

    if (log) {
      const pts = log.totalPointsUsed;
      totalPoints += pts;
      totalDays++;
      if (pts <= dailyBudget) daysWithinBudget++;
      if (pts > dailyBudget) weeklyOverage += pts - dailyBudget;
      if (pts < bestDayPoints) {
        bestDayPoints = pts;
        bestDay = dayNames[d.getDay()];
      }
      if ((log.waterMl ?? 0) > 0) waterTotalDays++;
      if ((log.waterMl ?? 0) >= waterGoalMl) waterDaysOnTarget++;
    }
  }

  if (totalDays === 0) return null;

  // Gewichtsverandering
  const mondayStr = prevMonday.toISOString().split('T')[0];
  const sunday = new Date(prevMonday);
  sunday.setDate(prevMonday.getDate() + 6);
  const sundayStr = sunday.toISOString().split('T')[0];

  const weightStart = await db.weightEntries.where('date').aboveOrEqual(mondayStr).and(w => w.date <= sundayStr).first();
  const weightEnd = await db.weightEntries.where('date').belowOrEqual(sundayStr).and(w => w.date >= mondayStr).reverse().first();
  const weightChange = weightStart && weightEnd && weightStart.date !== weightEnd.date
    ? weightEnd.weightKg - weightStart.weightKg
    : null;

  // Week label
  const months = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
  const weekNum = getISOWeekNumber(prevMonday);
  const weekLabel = `Week ${weekNum} · ${prevMonday.getDate()}-${sunday.getDate()} ${months[sunday.getMonth()]}`;

  return {
    weekLabel,
    avgPoints: Math.round(totalPoints / totalDays),
    dailyBudget,
    daysWithinBudget,
    totalDays,
    waterDaysOnTarget,
    waterTotalDays,
    weightChange,
    bestDay,
    bestDayPoints: bestDayPoints === Infinity ? 0 : bestDayPoints,
    weeklyPointsUsed: weeklyOverage,
    weeklyPointsBudget: weeklyBudget,
  };
}

function getISOWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Bereken de huidige streak: aaneengesloten dagen (vanaf gisteren terug)
 * waar minstens 1 maaltijd is gelogd en het dagbudget niet overschreden is.
 */
export async function calculateStreak(dailyBudget: number): Promise<number> {
  let streak = 0;
  const today = new Date();

  // Start bij gisteren (vandaag is nog bezig)
  for (let i = 1; i <= 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const log = await db.dailyLogs.where('date').equals(dateStr).first();

    // Geen log of geen maaltijden → streak gebroken
    if (!log || log.totalPointsUsed === 0) break;

    // Over budget → streak gebroken
    if (log.totalPointsUsed > dailyBudget) break;

    streak++;
  }

  return streak;
}

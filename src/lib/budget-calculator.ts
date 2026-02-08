import type { Gender, ActivityLevel, Goal } from '../types/user';

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

/**
 * Bereken BMR met de Mifflin-St Jeor formule.
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: Gender
): number {
  if (gender === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

/**
 * Bereken leeftijd op basis van geboortedatum.
 */
export function calculateAge(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Bereken TDEE (Total Daily Energy Expenditure).
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_FACTORS[activityLevel];
}

export interface BudgetResult {
  dailyPoints: number;
  weeklyPoints: number;
  bmr: number;
  tdee: number;
  targetCalories: number;
}

/**
 * Bereken het dagelijks en wekelijks puntenbudget.
 */
export function calculateBudget(
  weightKg: number,
  heightCm: number,
  dateOfBirth: string,
  gender: Gender,
  activityLevel: ActivityLevel,
  goal: Goal
): BudgetResult {
  const age = calculateAge(dateOfBirth);
  const bmr = calculateBMR(weightKg, heightCm, age, gender);
  const tdee = calculateTDEE(bmr, activityLevel);

  // Caloriedeficit voor afvallen: 500 kcal/dag ≈ 0.5 kg/week
  let targetCalories = tdee;
  if (goal === 'lose') {
    targetCalories = tdee - 500;
  }

  // Minimum calorieën: 1200 (vrouwen) / 1500 (mannen)
  const minCalories = gender === 'male' ? 1500 : 1200;
  targetCalories = Math.max(targetCalories, minCalories);

  // Omzetting: gemiddeld ~30 calorieën per punt
  const dailyPoints = Math.max(23, Math.round(targetCalories / 30));

  // Weekpunten: extra flexibiliteit
  const weeklyPoints = Math.round(dailyPoints * 1.4);

  return {
    dailyPoints,
    weeklyPoints,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
  };
}

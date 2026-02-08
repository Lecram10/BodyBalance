export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';
export type Goal = 'lose' | 'maintain';

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Zittend (weinig/geen beweging)',
  light: 'Licht actief (1-3 dagen/week)',
  moderate: 'Matig actief (3-5 dagen/week)',
  active: 'Actief (6-7 dagen/week)',
  veryActive: 'Zeer actief (zware training)',
};

export const GOAL_LABELS: Record<Goal, string> = {
  lose: 'Afvallen',
  maintain: 'Gewicht behouden',
};

export interface UserProfile {
  id?: number;
  name: string;
  gender: Gender;
  dateOfBirth: string;
  heightCm: number;
  currentWeightKg: number;
  goalWeightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  dailyPointsBudget: number;
  weeklyPointsBudget: number;
  onboardingComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeightEntry {
  id?: number;
  date: string;
  weightKg: number;
  note?: string;
}

export interface DailyLog {
  id?: number;
  date: string;
  totalPointsUsed: number;
  weeklyPointsUsed: number;
}

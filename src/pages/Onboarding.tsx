import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/user-store';
import { calculateBudget } from '../lib/budget-calculator';
import { Button } from '../components/ui/Button';
import { InputField, SelectField } from '../components/ui/FormField';
import { ACTIVITY_LABELS, GOAL_LABELS } from '../types/user';
import type { Gender, ActivityLevel, Goal } from '../types/user';
import { ChevronRight, Scale, Target, Sparkles } from 'lucide-react';

type Step = 'welcome' | 'profile' | 'result';

export function Onboarding() {
  const navigate = useNavigate();
  const saveProfile = useUserStore((s) => s.saveProfile);
  const [step, setStep] = useState<Step>('welcome');

  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [dateOfBirth, setDateOfBirth] = useState('1990-01-01');
  const [heightCm, setHeightCm] = useState(175);
  const [currentWeightKg, setCurrentWeightKg] = useState(80);
  const [goalWeightKg, setGoalWeightKg] = useState(75);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('light');
  const [goal, setGoal] = useState<Goal>('lose');

  const budget = calculateBudget(currentWeightKg, heightCm, dateOfBirth, gender, activityLevel, goal);

  const handleFinish = async () => {
    await saveProfile({
      name,
      gender,
      dateOfBirth,
      heightCm,
      currentWeightKg,
      goalWeightKg,
      activityLevel,
      goal,
      dailyPointsBudget: budget.dailyPoints,
      weeklyPointsBudget: budget.weeklyPoints,
      onboardingComplete: true,
    });
    navigate('/');
  };

  if (step === 'welcome') {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 animate-fade-in">
        <div className="w-20 h-20 rounded-[28px] bg-primary flex items-center justify-center mb-6 shadow-lg">
          <Scale size={40} color="white" />
        </div>
        <h1 className="text-[34px] font-bold text-ios-text mb-2">BodyBalance</h1>
        <p className="text-[17px] text-ios-secondary text-center mb-2 leading-relaxed">
          Houd je voeding bij met een simpel puntensysteem
        </p>
        <p className="text-[15px] text-ios-secondary text-center mb-10 leading-relaxed">
          Calorieën worden omgezet in punten. Blijf binnen je dagbudget en bereik je streefgewicht.
        </p>
        <Button fullWidth size="lg" onClick={() => setStep('profile')}>
          Aan de slag
          <ChevronRight size={20} className="inline ml-1" />
        </Button>
      </div>
    );
  }

  if (step === 'profile') {
    return (
      <div className="flex flex-col h-full animate-fade-in">
        <div className="px-6 pt-12 pb-4" style={{ paddingTop: 'calc(var(--safe-area-top) + 48px)' }}>
          <h2 className="text-[28px] font-bold text-ios-text mb-1">Jouw profiel</h2>
          <p className="text-[15px] text-ios-secondary">
            We berekenen je dagelijkse puntenbudget
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-32">
          <div className="flex flex-col gap-4">
            <InputField
              label="Naam"
              type="text"
              placeholder="Je naam"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
            />

            <SelectField
              label="Geslacht"
              value={gender}
              onChange={(e) => setGender(e.currentTarget.value as Gender)}
              options={[
                { value: 'male', label: 'Man' },
                { value: 'female', label: 'Vrouw' },
              ]}
            />

            <InputField
              label="Geboortedatum"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.currentTarget.value)}
            />

            <InputField
              label="Lengte"
              type="number"
              suffix="cm"
              value={heightCm}
              onChange={(e) => setHeightCm(Number(e.currentTarget.value))}
              min={100}
              max={250}
            />

            <InputField
              label="Huidig gewicht"
              type="number"
              suffix="kg"
              value={currentWeightKg}
              onChange={(e) => setCurrentWeightKg(Number(e.currentTarget.value))}
              min={30}
              max={300}
            />

            <InputField
              label="Streefgewicht"
              type="number"
              suffix="kg"
              value={goalWeightKg}
              onChange={(e) => setGoalWeightKg(Number(e.currentTarget.value))}
              min={30}
              max={300}
            />

            <SelectField
              label="Activiteitsniveau"
              value={activityLevel}
              onChange={(e) => setActivityLevel(e.currentTarget.value as ActivityLevel)}
              options={Object.entries(ACTIVITY_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />

            <SelectField
              label="Doel"
              value={goal}
              onChange={(e) => setGoal(e.currentTarget.value as Goal)}
              options={Object.entries(GOAL_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </div>
        </div>

        {/* Fixed bottom button */}
        <div
          className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-ios-separator px-6 py-4"
          style={{ paddingBottom: 'calc(var(--safe-area-bottom) + 16px)' }}
        >
          <Button fullWidth size="lg" onClick={() => setStep('result')} disabled={!name}>
            Bereken mijn budget
          </Button>
        </div>
      </div>
    );
  }

  // Result step
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Sparkles size={32} className="text-primary" />
      </div>

      <h2 className="text-[28px] font-bold text-ios-text mb-2">
        Hoi {name}!
      </h2>
      <p className="text-[15px] text-ios-secondary text-center mb-8">
        Je persoonlijke puntenbudget is berekend
      </p>

      <div className="bg-white rounded-3xl shadow-sm p-6 w-full mb-6">
        <div className="text-center mb-6">
          <div className="text-[64px] font-bold text-primary leading-none">
            {budget.dailyPoints}
          </div>
          <div className="text-[15px] text-ios-secondary mt-1">punten per dag</div>
        </div>

        <div className="flex justify-around py-4 border-t border-ios-separator">
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center mb-1">
              <Target size={14} className="text-ios-blue" />
              <span className="text-[13px] text-ios-secondary">Weekpunten</span>
            </div>
            <span className="text-[20px] font-bold">{budget.weeklyPoints}</span>
          </div>
          <div className="text-center">
            <div className="text-[13px] text-ios-secondary mb-1">Calorieën/dag</div>
            <span className="text-[20px] font-bold">~{budget.targetCalories}</span>
          </div>
        </div>
      </div>

      <p className="text-[13px] text-ios-secondary text-center mb-8 leading-relaxed">
        Je dagelijks budget van <strong>{budget.dailyPoints} punten</strong> is gebaseerd op je
        profiel. Daarnaast heb je <strong>{budget.weeklyPoints} weekpunten</strong> voor extra
        flexibiliteit.
      </p>

      <Button fullWidth size="lg" onClick={handleFinish}>
        Start met tracken
      </Button>
    </div>
  );
}

import { useEffect, useRef, useCallback } from 'react';
import { Droplets, Undo2 } from 'lucide-react';
import { useWaterToastStore } from '../../store/water-toast-store';
import { addWaterIntake, clearMealEntryWater } from '../../db/database';
import { useMealStore } from '../../store/meal-store';

const AUTO_HIDE_MS = 4000;

export function WaterToast() {
  const { visible, waterMl, drinkName, percentage, entryId, hide } = useWaterToastStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedDate = useMealStore((s) => s.selectedDate);

  // Auto-hide na 4 seconden
  useEffect(() => {
    if (visible) {
      timerRef.current = setTimeout(hide, AUTO_HIDE_MS);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, hide]);

  const handleUndo = useCallback(async () => {
    // Trek het toegevoegde water weer af
    await addWaterIntake(selectedDate, -waterMl);
    // Wis waterMlAdded op de entry zodat verwijderen niet dubbel aftrekt
    if (entryId) {
      await clearMealEntryWater(entryId);
    }
    // Dispatch event zodat Dashboard water UI bijwerkt
    window.dispatchEvent(new CustomEvent('water-changed'));
    hide();
  }, [waterMl, selectedDate, hide, entryId]);

  if (!visible) return null;

  const label = percentage < 1
    ? `${waterMl}ml toegevoegd aan waterinname (${Math.round(percentage * 100)}% van ${drinkName})`
    : `${waterMl}ml toegevoegd aan waterinname`;

  return (
    <div className="fixed bottom-[80px] left-4 right-4 z-[90] animate-toast-up" style={{ marginBottom: 'var(--safe-area-bottom)' }}>
      <div className="bg-blue-600 text-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg">
        <Droplets size={18} className="flex-shrink-0" />
        <span className="text-[14px] font-medium flex-1 leading-snug">{label}</span>
        <button
          onClick={handleUndo}
          className="flex items-center gap-1 bg-white/20 text-white px-3 py-1.5 rounded-lg text-[13px] font-semibold border-none cursor-pointer active:bg-white/30 flex-shrink-0"
        >
          <Undo2 size={13} />
          Ongedaan
        </button>
      </div>
    </div>
  );
}

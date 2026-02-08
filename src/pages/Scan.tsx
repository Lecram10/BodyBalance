import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { PageLayout } from '../components/layout/PageLayout';
import { AddFoodModal } from '../components/food/AddFoodModal';
import { Card } from '../components/ui/Card';
import { lookupBarcode } from '../lib/food-api';
import { calculatePointsForQuantity } from '../lib/points-calculator';
import { useMealStore } from '../store/meal-store';
import type { FoodItem, MealType } from '../types/food';
import { ScanBarcode, Loader2, AlertCircle } from 'lucide-react';

export function Scan() {
  const [isScanning, setIsScanning] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [foundFood, setFoundFood] = useState<FoodItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const addEntry = useMealStore((s) => s.addEntry);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING
          await scannerRef.current.stop();
        }
      } catch {
        // ignore
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleBarcode = async (barcode: string) => {
    if (barcode === lastBarcode) return;
    setLastBarcode(barcode);

    await stopScanner();
    setIsLookingUp(true);
    setError(null);

    const food = await lookupBarcode(barcode);
    setIsLookingUp(false);

    if (food) {
      setFoundFood(food);
    } else {
      setError(`Product niet gevonden voor barcode: ${barcode}`);
    }
  };

  const startScanner = async () => {
    setError(null);
    setLastBarcode(null);
    setFoundFood(null);

    try {
      const scanner = new Html5Qrcode('scanner-region');
      scannerRef.current = scanner;
      setIsScanning(true);

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleBarcode(decodedText);
        },
        () => {
          // ignore scan errors
        }
      );
    } catch (err) {
      setIsScanning(false);
      if (err instanceof Error && err.message.includes('Permission')) {
        setError('Camera-toegang geweigerd. Sta toegang toe in je instellingen.');
      } else {
        setError('Kan camera niet starten. Controleer of je camera beschikbaar is.');
      }
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const handleAddFood = async (quantityG: number, mealType: MealType) => {
    if (!foundFood) return;
    const points = calculatePointsForQuantity(foundFood.pointsPer100g, quantityG);
    await addEntry({ foodItem: foundFood, mealType, quantityG, points });
    setFoundFood(null);
    setLastBarcode(null);
  };

  return (
    <PageLayout title="Barcode Scanner">
      <div className="flex flex-col items-center gap-4">
        {/* Scanner area */}
        <Card className="w-full overflow-hidden">
          <div
            id="scanner-region"
            className="w-full bg-black"
            style={{ minHeight: isScanning ? 300 : 0 }}
          />

          {!isScanning && !isLookingUp && !foundFood && (
            <div className="flex flex-col items-center py-12 px-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <ScanBarcode size={40} className="text-primary" />
              </div>
              <h3 className="text-[17px] font-semibold mb-1">Scan een barcode</h3>
              <p className="text-[13px] text-ios-secondary text-center mb-6">
                Richt je camera op de barcode van een product om de puntenwaarde te zien
              </p>
              <button
                onClick={startScanner}
                className="px-8 py-3 bg-primary text-white rounded-xl text-[17px] font-semibold border-none cursor-pointer active:bg-primary-dark transition-colors"
              >
                Start scanner
              </button>
            </div>
          )}

          {isLookingUp && (
            <div className="flex flex-col items-center py-12">
              <Loader2 size={40} className="text-primary animate-spin mb-3" />
              <p className="text-[15px] text-ios-secondary">Product opzoeken...</p>
            </div>
          )}
        </Card>

        {/* Error message */}
        {error && (
          <Card className="w-full px-4 py-3 flex items-center gap-3">
            <AlertCircle size={20} className="text-ios-destructive flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[15px] text-ios-text">{error}</p>
            </div>
            <button
              onClick={startScanner}
              className="text-[15px] text-primary font-medium border-none bg-transparent cursor-pointer"
            >
              Opnieuw
            </button>
          </Card>
        )}

        {isScanning && (
          <button
            onClick={stopScanner}
            className="px-6 py-3 bg-ios-destructive text-white rounded-xl text-[15px] font-semibold border-none cursor-pointer"
          >
            Stop scanner
          </button>
        )}
      </div>

      {foundFood && (
        <AddFoodModal
          food={foundFood}
          defaultMealType="snack"
          onAdd={handleAddFood}
          onClose={() => {
            setFoundFood(null);
            setLastBarcode(null);
          }}
        />
      )}
    </PageLayout>
  );
}

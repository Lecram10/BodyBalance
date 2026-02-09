import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { PageLayout } from '../components/layout/PageLayout';
import { AddFoodModal } from '../components/food/AddFoodModal';
import { Card } from '../components/ui/Card';
import { lookupBarcode } from '../lib/food-api';
import { calculatePointsForQuantity } from '../lib/points-calculator';
import { useMealStore } from '../store/meal-store';
import type { FoodItem, MealType } from '../types/food';
import { ScanBarcode, Loader2, AlertCircle, Camera, ShieldAlert } from 'lucide-react';

type CameraState = 'idle' | 'requesting' | 'scanning' | 'denied' | 'unavailable' | 'looking-up';

export function Scan() {
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [foundFood, setFoundFood] = useState<FoodItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const addEntry = useMealStore((s) => s.addEntry);

  // Check basic camera availability on mount
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('unavailable');
    }
    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = useCallback(async () => {
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
    setCameraState('idle');
  }, []);

  const handleBarcode = useCallback(async (barcode: string) => {
    if (barcode === lastBarcode) return;
    setLastBarcode(barcode);

    // Stop scanner before lookup
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) await scannerRef.current.stop();
      } catch { /* ignore */ }
      scannerRef.current = null;
    }

    setCameraState('looking-up');
    setError(null);

    const food = await lookupBarcode(barcode);

    if (food) {
      setFoundFood(food);
      setCameraState('idle');
    } else {
      setError(`Product niet gevonden voor barcode: ${barcode}`);
      setCameraState('idle');
    }
  }, [lastBarcode]);

  const startScanner = async () => {
    setError(null);
    setLastBarcode(null);
    setFoundFood(null);
    setCameraState('requesting');

    // Step 1: Request camera permission via getUserMedia
    // This is the ONLY reliable way on iOS Safari
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      // Permission granted - stop the test stream
      stream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (
        message.includes('NotAllowed') ||
        message.includes('Permission') ||
        message.includes('denied')
      ) {
        setCameraState('denied');
      } else if (
        message.includes('NotFound') ||
        message.includes('DevicesNotFound') ||
        message.includes('NotReadableError')
      ) {
        setCameraState('unavailable');
      } else {
        setCameraState('denied');
      }
      return;
    }

    // Step 2: Start the barcode scanner
    try {
      const scanner = new Html5Qrcode('scanner-region');
      scannerRef.current = scanner;
      setCameraState('scanning');

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
          // ignore individual frame scan failures
        }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('Permission') || message.includes('NotAllowed')) {
        setCameraState('denied');
      } else {
        setError('Kan scanner niet starten. Probeer het opnieuw.');
        setCameraState('idle');
      }
    }
  };

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
        <Card className="w-full overflow-hidden">
          {/* Scanner video region - always present in DOM for html5-qrcode */}
          <div
            id="scanner-region"
            className="w-full bg-black"
            style={{ minHeight: cameraState === 'scanning' ? 300 : 0, display: cameraState === 'scanning' ? 'block' : 'none' }}
          />

          {/* IDLE: Show start button */}
          {cameraState === 'idle' && !foundFood && (
            <div className="flex flex-col items-center py-12 px-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <ScanBarcode size={40} className="text-primary" />
              </div>
              <h3 className="text-[17px] font-semibold mb-1">Scan een barcode</h3>
              <p className="text-[13px] text-ios-secondary text-center mb-6 leading-relaxed">
                Richt je camera op de barcode van een product om de puntenwaarde te zien
              </p>
              <button
                onClick={startScanner}
                className="px-8 py-3 bg-primary text-white rounded-xl text-[17px] font-semibold border-none cursor-pointer active:bg-primary-dark transition-colors"
              >
                Open camera
              </button>
            </div>
          )}

          {/* REQUESTING: Waiting for permission */}
          {cameraState === 'requesting' && (
            <div className="flex flex-col items-center py-12 px-4">
              <Loader2 size={40} className="text-primary animate-spin mb-3" />
              <p className="text-[15px] text-ios-secondary">Camera-toegang aanvragen...</p>
              <p className="text-[12px] text-ios-secondary mt-2 text-center">
                Tik op "Sta toe" als je browser om toestemming vraagt
              </p>
            </div>
          )}

          {/* LOOKING UP: Searching product */}
          {cameraState === 'looking-up' && (
            <div className="flex flex-col items-center py-12">
              <Loader2 size={40} className="text-primary animate-spin mb-3" />
              <p className="text-[15px] text-ios-secondary">Product opzoeken...</p>
            </div>
          )}

          {/* DENIED: Permission denied */}
          {cameraState === 'denied' && (
            <div className="flex flex-col items-center py-12 px-6">
              <div className="w-20 h-20 rounded-full bg-ios-warning/10 flex items-center justify-center mb-4">
                <Camera size={40} className="text-ios-warning" />
              </div>
              <h3 className="text-[17px] font-semibold mb-2 text-center">Camera-toegang geweigerd</h3>
              <p className="text-[13px] text-ios-secondary text-center leading-relaxed mb-4">
                BodyBalance heeft toegang tot je camera nodig om barcodes te scannen. Geef toestemming via je instellingen:
              </p>
              <div className="bg-ios-bg rounded-xl p-4 w-full mb-6">
                <p className="text-[14px] font-medium mb-2">Op iPhone / iPad:</p>
                <ol className="text-[13px] text-ios-secondary leading-relaxed list-decimal list-inside space-y-1">
                  <li>Open <strong>Instellingen</strong></li>
                  <li>Scroll naar <strong>Safari</strong></li>
                  <li>Tik op <strong>Camera</strong></li>
                  <li>Kies <strong>Vraag</strong> of <strong>Sta toe</strong></li>
                  <li>Ga terug naar de app en probeer opnieuw</li>
                </ol>
              </div>
              <button
                onClick={startScanner}
                className="px-8 py-3 bg-primary text-white rounded-xl text-[17px] font-semibold border-none cursor-pointer active:bg-primary-dark transition-colors"
              >
                Opnieuw proberen
              </button>
            </div>
          )}

          {/* UNAVAILABLE: No camera */}
          {cameraState === 'unavailable' && (
            <div className="flex flex-col items-center py-12 px-6">
              <div className="w-20 h-20 rounded-full bg-ios-destructive/10 flex items-center justify-center mb-4">
                <ShieldAlert size={40} className="text-ios-destructive" />
              </div>
              <h3 className="text-[17px] font-semibold mb-2">Camera niet beschikbaar</h3>
              <p className="text-[13px] text-ios-secondary text-center leading-relaxed">
                Je apparaat heeft geen camera of de browser ondersteunt geen camera-toegang.
                Zorg ervoor dat je de app opent via <strong>Safari</strong> op je iPhone.
              </p>
            </div>
          )}
        </Card>

        {/* Error message (product not found etc.) */}
        {error && cameraState === 'idle' && (
          <Card className="w-full px-4 py-3 flex items-center gap-3">
            <AlertCircle size={20} className="text-ios-destructive flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[15px] text-ios-text">{error}</p>
            </div>
            <button
              onClick={startScanner}
              className="text-[15px] text-primary font-medium border-none bg-transparent cursor-pointer flex-shrink-0"
            >
              Opnieuw
            </button>
          </Card>
        )}

        {/* Stop button while scanning */}
        {cameraState === 'scanning' && (
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

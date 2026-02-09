import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { PageLayout } from '../components/layout/PageLayout';
import { AddFoodModal } from '../components/food/AddFoodModal';
import { Card } from '../components/ui/Card';
import { lookupBarcode } from '../lib/food-api';
import { calculatePointsForQuantity } from '../lib/points-calculator';
import { useMealStore } from '../store/meal-store';
import type { FoodItem, MealType } from '../types/food';
import { ScanBarcode, Loader2, AlertCircle, Camera, ShieldAlert } from 'lucide-react';

type CameraPermission = 'unknown' | 'checking' | 'granted' | 'denied' | 'unavailable';

async function checkCameraPermission(): Promise<CameraPermission> {
  // Check if camera API is available (HTTPS required on iOS)
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return 'unavailable';
  }

  // Check permission status via Permissions API (not supported on all iOS versions)
  if (navigator.permissions) {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      if (result.state === 'granted') return 'granted';
      if (result.state === 'denied') return 'denied';
      // 'prompt' means we need to ask
      return 'unknown';
    } catch {
      // Permissions API doesn't support camera query on this browser
    }
  }

  return 'unknown';
}

async function requestCameraAccess(): Promise<boolean> {
  try {
    // This triggers the iOS/browser permission dialog
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });
    // Permission granted - stop the stream immediately
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
}

export function Scan() {
  const [permission, setPermission] = useState<CameraPermission>('checking');
  const [isScanning, setIsScanning] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [foundFood, setFoundFood] = useState<FoodItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const addEntry = useMealStore((s) => s.addEntry);

  // Check camera permission on mount
  useEffect(() => {
    checkCameraPermission().then(setPermission);
    return () => {
      stopScanner();
    };
  }, []);

  const handleRequestPermission = async () => {
    setPermission('checking');
    const granted = await requestCameraAccess();
    setPermission(granted ? 'granted' : 'denied');
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) {
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

    // First ensure we have permission
    if (permission !== 'granted') {
      const granted = await requestCameraAccess();
      if (!granted) {
        setPermission('denied');
        return;
      }
      setPermission('granted');
    }

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
      const message = err instanceof Error ? err.message : String(err);

      if (message.includes('Permission') || message.includes('NotAllowed')) {
        setPermission('denied');
        setError('Camera-toegang is geweigerd.');
      } else if (message.includes('NotFound') || message.includes('DevicesNotFound')) {
        setPermission('unavailable');
        setError('Geen camera gevonden op dit apparaat.');
      } else {
        setError('Kan camera niet starten. Probeer het opnieuw.');
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

  // Render permission request screen
  const renderPermissionScreen = () => {
    if (permission === 'checking') {
      return (
        <div className="flex flex-col items-center py-12 px-4">
          <Loader2 size={40} className="text-primary animate-spin mb-3" />
          <p className="text-[15px] text-ios-secondary">Camera controleren...</p>
        </div>
      );
    }

    if (permission === 'unavailable') {
      return (
        <div className="flex flex-col items-center py-12 px-6">
          <div className="w-20 h-20 rounded-full bg-ios-destructive/10 flex items-center justify-center mb-4">
            <ShieldAlert size={40} className="text-ios-destructive" />
          </div>
          <h3 className="text-[17px] font-semibold mb-2">Camera niet beschikbaar</h3>
          <p className="text-[13px] text-ios-secondary text-center leading-relaxed">
            Je apparaat heeft geen camera of de browser ondersteunt geen camera-toegang.
            Zorg ervoor dat je de app opent via <strong>Safari</strong> en dat je een HTTPS-verbinding gebruikt.
          </p>
        </div>
      );
    }

    if (permission === 'denied') {
      return (
        <div className="flex flex-col items-center py-12 px-6">
          <div className="w-20 h-20 rounded-full bg-ios-warning/10 flex items-center justify-center mb-4">
            <Camera size={40} className="text-ios-warning" />
          </div>
          <h3 className="text-[17px] font-semibold mb-2">Camera-toegang vereist</h3>
          <p className="text-[13px] text-ios-secondary text-center leading-relaxed mb-2">
            BodyBalance heeft toegang tot je camera nodig om barcodes te scannen.
          </p>
          <p className="text-[13px] text-ios-secondary text-center leading-relaxed mb-6">
            Ga naar <strong>Instellingen → Safari → Camera</strong> en stel in op <strong>Vraag</strong> of <strong>Sta toe</strong>.
          </p>
          <button
            onClick={handleRequestPermission}
            className="px-8 py-3 bg-primary text-white rounded-xl text-[17px] font-semibold border-none cursor-pointer active:bg-primary-dark transition-colors"
          >
            Opnieuw proberen
          </button>
        </div>
      );
    }

    // permission === 'unknown' or 'granted' - show start button
    return (
      <div className="flex flex-col items-center py-12 px-4">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <ScanBarcode size={40} className="text-primary" />
        </div>
        <h3 className="text-[17px] font-semibold mb-1">Scan een barcode</h3>
        <p className="text-[13px] text-ios-secondary text-center mb-6 leading-relaxed">
          Richt je camera op de barcode van een product om de puntenwaarde te zien
        </p>
        {permission === 'unknown' && (
          <p className="text-[12px] text-ios-secondary text-center mb-4 px-4">
            Er wordt toestemming gevraagd om je camera te gebruiken
          </p>
        )}
        <button
          onClick={startScanner}
          className="px-8 py-3 bg-primary text-white rounded-xl text-[17px] font-semibold border-none cursor-pointer active:bg-primary-dark transition-colors"
        >
          {permission === 'unknown' ? 'Geef toegang & start' : 'Start scanner'}
        </button>
      </div>
    );
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

          {!isScanning && !isLookingUp && !foundFood && renderPermissionScreen()}

          {isLookingUp && (
            <div className="flex flex-col items-center py-12">
              <Loader2 size={40} className="text-primary animate-spin mb-3" />
              <p className="text-[15px] text-ios-secondary">Product opzoeken...</p>
            </div>
          )}
        </Card>

        {/* Error message */}
        {error && permission !== 'denied' && (
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

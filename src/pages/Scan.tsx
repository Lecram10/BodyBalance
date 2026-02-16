import { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { PageLayout } from '../components/layout/PageLayout';
import { AddFoodModal } from '../components/food/AddFoodModal';
import { Card } from '../components/ui/Card';
import { lookupBarcode } from '../lib/food-api';
import { calculatePointsPer100g, calculatePointsForQuantity } from '../lib/points-calculator';
import { saveCustomFood } from '../db/database';
import { recognizeFoodFromImage, getAISettings } from '../lib/ai-service';
import { useMealStore } from '../store/meal-store';
import type { FoodItem, MealType, NutritionPer100g } from '../types/food';
import { ScanBarcode, Loader2, AlertCircle, Camera, ShieldAlert, ImagePlus } from 'lucide-react';

type ScanTab = 'barcode' | 'photo';
type CameraState = 'idle' | 'requesting' | 'scanning' | 'denied' | 'unavailable' | 'looking-up';

export function Scan() {
  const [activeTab, setActiveTab] = useState<ScanTab>('barcode');
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [foundFood, setFoundFood] = useState<FoodItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const addEntry = useMealStore((s) => s.addEntry);

  // AI Photo state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recognizedFoods, setRecognizedFoods] = useState<FoodItem[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraState('unavailable');
    }
    return () => { stopScanner(); };
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) await scannerRef.current.stop();
      } catch { /* ignore */ }
      scannerRef.current = null;
    }
    setCameraState('idle');
  }, []);

  const handleBarcode = useCallback(async (barcode: string) => {
    if (barcode === lastBarcode) return;
    setLastBarcode(barcode);
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
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      stream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('NotAllowed') || message.includes('Permission') || message.includes('denied')) {
        setCameraState('denied');
      } else if (message.includes('NotFound') || message.includes('DevicesNotFound') || message.includes('NotReadableError')) {
        setCameraState('unavailable');
      } else {
        setCameraState('denied');
      }
      return;
    }
    try {
      const scanner = new Html5Qrcode('scanner-region');
      scannerRef.current = scanner;
      setCameraState('scanning');
      // Wacht tot React de DOM heeft bijgewerkt (div zichtbaar)
      await new Promise((r) => requestAnimationFrame(r));
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0 },
        (decodedText) => { handleBarcode(decodedText); },
        () => {}
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

  // AI Photo handlers
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);
    setRecognizedFoods([]);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setPhotoPreview(dataUrl);

      const settings = await getAISettings();
      if (!settings?.apiKey) {
        setPhotoError('Geen API-sleutel ingesteld. Ga naar Profiel → AI Instellingen.');
        return;
      }

      setIsAnalyzing(true);
      try {
        const base64 = dataUrl.split(',')[1];
        const mediaType = file.type || 'image/jpeg';
        const response = await recognizeFoodFromImage(base64, mediaType);

        // Parse JSON response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const items = JSON.parse(jsonMatch[0]) as Array<{
            naam: string;
            hoeveelheid_g: number;
            per_100g: { calories: number; protein: number; fat: number; saturatedFat: number; carbs: number; sugar: number; fiber: number };
          }>;

          const foods: FoodItem[] = items.map((item) => {
            const nutrition: NutritionPer100g = {
              calories: item.per_100g.calories || 0,
              protein: item.per_100g.protein || 0,
              fat: item.per_100g.fat || 0,
              saturatedFat: item.per_100g.saturatedFat || 0,
              unsaturatedFat: Math.max(0, (item.per_100g.fat || 0) - (item.per_100g.saturatedFat || 0)),
              carbs: item.per_100g.carbs || 0,
              sugar: item.per_100g.sugar || 0,
              addedSugar: 0,
              fiber: item.per_100g.fiber || 0,
            };
            const pointsPer100g = calculatePointsPer100g(nutrition);
            return {
              name: item.naam,
              nutrition,
              pointsPer100g,
              servingSizeG: item.hoeveelheid_g || 100,
              isZeroPoint: pointsPer100g === 0,
              source: 'user' as const,
              createdAt: new Date(),
            };
          });
          setRecognizedFoods(foods);
        } else {
          setPhotoError('Kon geen voedsel herkennen op de foto. Probeer een andere foto.');
        }
      } catch (err) {
        setPhotoError(err instanceof Error ? err.message : 'Fout bij analyseren');
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddRecognizedFood = async (food: FoodItem) => {
    const saved = await saveCustomFood({
      name: food.name,
      nutrition: food.nutrition,
      pointsPer100g: food.pointsPer100g,
      servingSizeG: food.servingSizeG,
      isZeroPoint: food.isZeroPoint,
      isFavorite: false,
      source: 'user',
    });
    setFoundFood(saved);
  };

  const handleTabChange = (tab: ScanTab) => {
    if (tab === 'barcode' && activeTab === 'photo') {
      // Reset photo state
      setPhotoPreview(null);
      setRecognizedFoods([]);
      setPhotoError(null);
    } else if (tab === 'photo' && activeTab === 'barcode') {
      stopScanner();
    }
    setActiveTab(tab);
  };

  return (
    <PageLayout title="Scanner">
      <div className="flex flex-col items-center gap-4">
        {/* Tab bar */}
        <div className="flex gap-1 bg-ios-bg rounded-xl p-1 w-full">
          <button
            onClick={() => handleTabChange('barcode')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-medium border-none cursor-pointer transition-colors ${
              activeTab === 'barcode' ? 'bg-white text-primary shadow-sm' : 'bg-transparent text-ios-secondary'
            }`}
          >
            <ScanBarcode size={14} />
            Barcode
          </button>
          <button
            onClick={() => handleTabChange('photo')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[13px] font-medium border-none cursor-pointer transition-colors ${
              activeTab === 'photo' ? 'bg-white text-primary shadow-sm' : 'bg-transparent text-ios-secondary'
            }`}
          >
            <ImagePlus size={14} />
            AI Foto
          </button>
        </div>

        {/* Barcode tab */}
        {activeTab === 'barcode' && (
          <>
            <Card className="w-full overflow-hidden">
              <div
                id="scanner-region"
                className="w-full bg-black overflow-hidden"
                style={{ minHeight: cameraState === 'scanning' ? 300 : 0, transition: 'min-height 0.2s ease' }}
              />
              {cameraState === 'idle' && !foundFood && (
                <div className="flex flex-col items-center py-12 px-4">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <ScanBarcode size={40} className="text-primary" />
                  </div>
                  <h3 className="text-[17px] font-semibold mb-1">Scan een barcode</h3>
                  <p className="text-[13px] text-ios-secondary text-center mb-6 leading-relaxed">
                    Richt je camera op de barcode van een product
                  </p>
                  <button onClick={startScanner} className="px-8 py-3 bg-primary text-white rounded-xl text-[17px] font-semibold border-none cursor-pointer active:bg-primary-dark transition-colors">
                    Open camera
                  </button>
                </div>
              )}
              {cameraState === 'requesting' && (
                <div className="flex flex-col items-center py-12 px-4">
                  <Loader2 size={40} className="text-primary animate-spin mb-3" />
                  <p className="text-[15px] text-ios-secondary">Camera-toegang aanvragen...</p>
                  <p className="text-[12px] text-ios-secondary mt-2 text-center">Tik op &quot;Sta toe&quot; als je browser om toestemming vraagt</p>
                </div>
              )}
              {cameraState === 'looking-up' && (
                <div className="flex flex-col items-center py-12">
                  <Loader2 size={40} className="text-primary animate-spin mb-3" />
                  <p className="text-[15px] text-ios-secondary">Product opzoeken...</p>
                </div>
              )}
              {cameraState === 'denied' && (
                <div className="flex flex-col items-center py-12 px-6">
                  <div className="w-20 h-20 rounded-full bg-ios-warning/10 flex items-center justify-center mb-4">
                    <Camera size={40} className="text-ios-warning" />
                  </div>
                  <h3 className="text-[17px] font-semibold mb-2 text-center">Camera-toegang geweigerd</h3>
                  <p className="text-[13px] text-ios-secondary text-center leading-relaxed mb-4">
                    Geef toestemming via je instellingen:
                  </p>
                  <div className="bg-ios-bg rounded-xl p-4 w-full mb-6">
                    <p className="text-[14px] font-medium mb-2">Op iPhone / iPad:</p>
                    <ol className="text-[13px] text-ios-secondary leading-relaxed list-decimal list-inside space-y-1">
                      <li>Open <strong>Instellingen</strong></li>
                      <li>Scroll naar <strong>Safari</strong></li>
                      <li>Tik op <strong>Camera</strong></li>
                      <li>Kies <strong>Sta toe</strong></li>
                    </ol>
                  </div>
                  <button onClick={startScanner} className="px-8 py-3 bg-primary text-white rounded-xl text-[17px] font-semibold border-none cursor-pointer active:bg-primary-dark transition-colors">
                    Opnieuw proberen
                  </button>
                </div>
              )}
              {cameraState === 'unavailable' && (
                <div className="flex flex-col items-center py-12 px-6">
                  <div className="w-20 h-20 rounded-full bg-ios-destructive/10 flex items-center justify-center mb-4">
                    <ShieldAlert size={40} className="text-ios-destructive" />
                  </div>
                  <h3 className="text-[17px] font-semibold mb-2">Camera niet beschikbaar</h3>
                  <p className="text-[13px] text-ios-secondary text-center leading-relaxed">
                    Open de app via <strong>Safari</strong> op je iPhone.
                  </p>
                </div>
              )}
            </Card>
            {error && cameraState === 'idle' && (
              <Card className="w-full px-4 py-3 flex items-center gap-3">
                <AlertCircle size={20} className="text-ios-destructive flex-shrink-0" />
                <div className="flex-1"><p className="text-[15px] text-ios-text">{error}</p></div>
                <button onClick={startScanner} className="text-[15px] text-primary font-medium border-none bg-transparent cursor-pointer flex-shrink-0">Opnieuw</button>
              </Card>
            )}
            {cameraState === 'scanning' && (
              <button onClick={stopScanner} className="px-6 py-3 bg-ios-destructive text-white rounded-xl text-[15px] font-semibold border-none cursor-pointer">
                Stop scanner
              </button>
            )}
          </>
        )}

        {/* AI Photo tab */}
        {activeTab === 'photo' && (
          <>
            <Card className="w-full">
              {!photoPreview ? (
                <div className="flex flex-col items-center py-12 px-4">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <ImagePlus size={40} className="text-primary" />
                  </div>
                  <h3 className="text-[17px] font-semibold mb-1">Herken voedsel via foto</h3>
                  <p className="text-[13px] text-ios-secondary text-center mb-6 leading-relaxed">
                    Maak een foto van je maaltijd en AI herkent de producten met voedingswaarden
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-8 py-3 bg-primary text-white rounded-xl text-[17px] font-semibold border-none cursor-pointer active:bg-primary-dark transition-colors"
                  >
                    Maak foto
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div>
                  <img src={photoPreview} alt="Foto" className="w-full h-48 object-cover" />
                  {isAnalyzing && (
                    <div className="flex flex-col items-center py-6">
                      <Loader2 size={32} className="text-primary animate-spin mb-2" />
                      <p className="text-[15px] text-ios-secondary">AI analyseert je foto...</p>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {photoError && (
              <Card className="w-full px-4 py-3 flex items-center gap-3">
                <AlertCircle size={20} className="text-ios-destructive flex-shrink-0" />
                <p className="text-[14px] text-ios-text flex-1">{photoError}</p>
              </Card>
            )}

            {recognizedFoods.length > 0 && (
              <Card className="w-full">
                <div className="px-4 py-3 border-b border-ios-separator">
                  <p className="text-[15px] font-semibold">Herkende producten</p>
                </div>
                {recognizedFoods.map((food, i) => (
                  <div key={`${food.name}-${i}`} className={`flex items-center justify-between px-4 py-3 ${i < recognizedFoods.length - 1 ? 'border-b border-ios-separator' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-medium">{food.name}</div>
                      <div className="text-[13px] text-ios-secondary">{food.servingSizeG}g — {food.pointsPer100g} pt/100g</div>
                    </div>
                    <button
                      onClick={() => handleAddRecognizedFood(food)}
                      className="px-3 py-1.5 bg-primary text-white rounded-lg text-[13px] font-medium border-none cursor-pointer"
                    >
                      Toevoegen
                    </button>
                  </div>
                ))}
              </Card>
            )}

            {photoPreview && !isAnalyzing && (
              <button
                onClick={() => { setPhotoPreview(null); setRecognizedFoods([]); setPhotoError(null); fileInputRef.current?.click(); }}
                className="px-6 py-3 bg-white text-primary rounded-xl text-[15px] font-semibold border border-ios-separator cursor-pointer"
              >
                Nieuwe foto
              </button>
            )}
          </>
        )}
      </div>

      {foundFood && (
        <AddFoodModal
          food={foundFood}
          defaultMealType="snack"
          onAdd={handleAddFood}
          onClose={() => { setFoundFood(null); setLastBarcode(null); }}
        />
      )}
    </PageLayout>
  );
}

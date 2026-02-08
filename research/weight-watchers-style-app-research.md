# BodyBalance - Weight Watchers-stijl App Research

## 1. Overzicht: Wat is het Weight Watchers (WW) Systeem?

Weight Watchers (nu "WeightWatchers" of "WW") is een gewichtsverlies-programma dat complexe voedingsinformatie omzet naar **een enkel getal: Points**. In plaats van calorieën te tellen, krijgt elke gebruiker een dagelijks puntenbudget. Elk voedingsmiddel heeft een puntenwaarde. Het doel is om binnen je budget te blijven.

### Kernprincipes
- **Eenvoud**: Complexe voedingsdata → één getal (Points)
- **Personalisatie**: Budget afgestemd op leeftijd, lengte, gewicht, geslacht en doelen
- **Flexibiliteit**: Weekpunten voor speciale gelegenheden
- **ZeroPoint-voedingsmiddelen**: 350+ voedingsmiddelen die je niet hoeft te tracken
- **Gezonde keuzes stimuleren**: Eiwitrijk/vezelrijk voedsel = minder punten, suiker/verzadigd vet = meer punten

---

## 2. Het Puntensysteem - Hoe werkt het?

### 2.1 Punten per voedingsmiddel (SmartPoints formule)

WW houdt de exacte formule geheim, maar de bekende **SmartPoints-formule** (~2015-2021) is:

```
Points = (Calorieën × 0.0305) + (Verzadigd vet × 0.275) + (Suiker × 0.12) - (Eiwit × 0.098)
```

**Vuistregels:**
| Factor | Impact |
|---|---|
| Per 100 calorieën | +3 punten |
| Per 4g verzadigd vet | +1 punt |
| Per 8g suiker | +1 punt |
| Per 10g eiwit | -1 punt |

### 2.2 Nieuwe formule (2022+)

De nieuwere formule is gebaseerd op **zes factoren**:

**Verhogen punten:**
- Calorieën
- Verzadigd vet
- Toegevoegde suikers

**Verlagen punten:**
- Eiwit
- Vezels
- Onverzadigde vetten

### 2.3 Dagelijks puntenbudget

Het dagelijks budget wordt berekend op basis van het **metabolisme** van de gebruiker:

**Invoer:**
- Leeftijd
- Lengte
- Gewicht
- Geslacht (bij geboorte toegewezen)
- Activiteitsniveau
- Gewichtsdoel (afvallen / handhaven)

**Typisch bereik:** 23-71 punten per dag (minimum is 23)

**Vereenvoudigde formule (Points Plus):**
```
Dagelijks budget = (Gewicht/10) + (Lengte/10) - (Leeftijd/5) + Geslachtsfactor
```

**Alternatieve formule (voor mannen):**
```
Dagelijkse punten = 10 + (6.23 × gewicht in pounds) + (12.7 × lengte in inches) - (6.8 × leeftijd)
```

Het budget is ontworpen met een **caloriedeficit** ingebouwd, zodat gebruikers 0.5-1 kg per week afvallen.

**Extra weekpunten:** Naast dagelijkse punten ontvangen gebruikers ook weekpunten voor flexibiliteit.

### 2.4 ZeroPoint-voedingsmiddelen

350+ voedingsmiddelen die je onbeperkt mag eten zonder tracken:
- Fruit
- Groenten
- Mager vlees (kipfilet, kalkoen)
- Vis en zeevruchten
- Eieren
- Vetvrije yoghurt
- Bonen en peulvruchten

De combinatie van eiwit, vezels en water in deze voedingsmiddelen beperkt van nature hoeveel je ervan eet.

---

## 3. App Features (WeightWatchers App Analyse)

### 3.1 Must-have Features

| Feature | Beschrijving | Prioriteit |
|---|---|---|
| **Puntenteller** | Dagelijks dashboard met gebruikt/resterend budget | P0 (Essentieel) |
| **Voedsel zoeken** | Database met voedingsmiddelen + puntenwaarden | P0 |
| **Barcode scanner** | Scan productbarcode → toon puntenwaarde | P0 |
| **Gebruikersprofiel** | Leeftijd, lengte, gewicht, geslacht, doel | P0 |
| **Maaltijd logging** | Ontbijt, lunch, diner, snacks tracken | P0 |
| **Puntenbudget calculator** | Automatisch dagelijks budget berekenen | P0 |
| **Voortgangsoverzicht** | Gewichtsverloop, punten historie | P1 |
| **Recepten** | Recepten met automatische puntenberekening | P1 |
| **Watertracker** | Dagelijkse waterinname bijhouden | P2 |

### 3.2 Nice-to-have Features

| Feature | Beschrijving | Prioriteit |
|---|---|---|
| **AI Voedselscanner** | Foto van maaltijd → automatisch herkennen | P2 |
| **Maaltijdplanner** | Vooruit plannen van maaltijden | P2 |
| **Activiteitstracker** | Beweging loggen, extra punten verdienen | P2 |
| **Sociale features** | Community, uitdagingen, vrienden | P3 |
| **Wearable integratie** | Apple Health, Google Fit, Fitbit | P3 |
| **Recept importeren** | URL van recept → ingrediënten importeren | P3 |
| **Push notificaties** | Herinneringen om te loggen | P2 |
| **Offline modus** | App werkt zonder internet | P3 |

---

## 4. Technische Architectuur

### 4.1 Aanbevolen Tech Stack

#### Frontend (Mobile App)
| Optie | Voordelen | Nadelen |
|---|---|---|
| **React Native** | Grote community, hergebruik web-kennis, cross-platform | Performance iets minder dan native |
| **Flutter** | Uitstekende performance, mooie UI, cross-platform | Dart learning curve |
| **Swift + Kotlin** | Beste performance, native UX | Dubbel werk (2 codebases) |

**Aanbeveling:** **React Native** of **Flutter** voor cross-platform development.

#### Backend
| Optie | Voordelen | Nadelen |
|---|---|---|
| **Node.js + Express** | Snel, schaalbaar, groot ecosysteem | Callback complexity |
| **Python + Django/FastAPI** | AI/ML integratie, leesbare code | Minder real-time performance |
| **Firebase** | Serverless, snel opzetten, real-time | Vendor lock-in, kosten bij schalen |

**Aanbeveling:** **Node.js + Express** of **Firebase** voor snelle MVP.

#### Database
| Optie | Gebruik |
|---|---|
| **PostgreSQL** | Gebruikersdata, voedsellogboek, doelen |
| **MongoDB** | Flexibele voedingsmiddeldata, recepten |
| **Firebase Realtime DB** | Real-time sync, snelle setup |
| **Redis** | Caching voor voedingsmiddel-lookups |

**Aanbeveling:** **PostgreSQL** voor productie, **Firebase** voor MVP.

### 4.2 Systeemarchitectuur

```
┌─────────────────────────────────────────────────┐
│                  Mobile App                      │
│  (React Native / Flutter)                        │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Dashboard │ │ Tracker  │ │ Barcode Scanner  │ │
│  │ (Punten)  │ │ (Loggen) │ │ (Camera)         │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
└────────────────────┬────────────────────────────┘
                     │ REST API / GraphQL
┌────────────────────▼────────────────────────────┐
│                Backend Server                    │
│  (Node.js + Express / FastAPI)                   │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Auth     │ │ Points   │ │ Food Service     │ │
│  │ Service  │ │ Engine   │ │ (DB + API proxy) │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
└────────────────────┬────────────────────────────┘
                     │
        ┌────────────┼────────────────┐
        ▼            ▼                ▼
┌──────────┐  ┌──────────────┐  ┌──────────────┐
│PostgreSQL│  │ Open Food    │  │ NEVO         │
│ / Firebase│ │ Facts API    │  │ (NL data)    │
│ (User DB) │ │ (Barcode)    │  │              │
└──────────┘  └──────────────┘  └──────────────┘
```

---

## 5. Voedingsmiddelen Databases

### 5.1 Open Food Facts (Aanbevolen - Primaire bron)
- **Type:** Open-source, gratis REST API
- **Dekking:** 2.8+ miljoen producten uit 150+ landen, inclusief NL
- **Features:** Barcode lookup, voedingswaarden, Nutri-Score, ingrediënten
- **NL toegang:** `nl.openfoodfacts.org` voor Nederlandse producten
- **API:** `https://world.openfoodfacts.org/api/v2/product/{barcode}`
- **Licentie:** Open Database License (gratis)
- **Ideaal voor:** Barcode scanning, merkproducten

### 5.2 NEVO - Nederlandse Voedingsmiddelendatabase (Secundaire bron)
- **Type:** Officiële NL database, downloadbaar (geen live API)
- **Beheerder:** RIVM (Rijksinstituut voor Volksgezondheid en Milieu)
- **Dekking:** 2.300+ voedingsmiddelen, 130+ nutriënten
- **Taal:** Nederlands + Engels
- **Toegang:** Gratis download (Excel/CSV) na akkoord met voorwaarden
- **Ideaal voor:** Generieke Nederlandse voedingsmiddelen, hoge kwaliteit data

### 5.3 USDA FoodData Central (Aanvullende bron)
- **Type:** Gratis REST API van de Amerikaanse overheid
- **Dekking:** Uitgebreide database van voedingsmiddelen
- **Ideaal voor:** Aanvullende data, wetenschappelijk gevalideerd

### Integratiestrategie
1. **Barcode scan** → Open Food Facts API (primair)
2. **Handmatig zoeken** → Lokale database (gevuld met NEVO + Open Food Facts)
3. **Fallback** → USDA FoodData Central
4. **Gebruikers-bijdragen** → Eigen database uitbreiden

---

## 6. Puntenberekening - Implementatie

### 6.1 Punten per Voedingsmiddel

```javascript
/**
 * Bereken punten voor een voedingsmiddel (SmartPoints-stijl)
 *
 * @param {number} calories - Calorieën (kcal)
 * @param {number} saturatedFat - Verzadigd vet (g)
 * @param {number} sugar - Suiker (g)
 * @param {number} protein - Eiwit (g)
 * @returns {number} Puntenwaarde (minimaal 0)
 */
function calculatePoints(calories, saturatedFat, sugar, protein) {
  const points = (calories * 0.0305)
               + (saturatedFat * 0.275)
               + (sugar * 0.12)
               - (protein * 0.098);
  return Math.max(0, Math.round(points));
}
```

### 6.2 Verbeterde Formule (inclusief vezels en onverzadigd vet)

```javascript
/**
 * Verbeterde puntenberekening (2022+ stijl)
 *
 * @param {Object} nutrition - Voedingswaarden
 * @returns {number} Puntenwaarde
 */
function calculatePointsV2(nutrition) {
  const {
    calories,
    saturatedFat,
    addedSugar,
    protein,
    fiber,
    unsaturatedFat
  } = nutrition;

  const points = (calories * 0.03)
               + (saturatedFat * 0.28)
               + (addedSugar * 0.12)
               - (protein * 0.10)
               - (fiber * 0.10)
               - (unsaturatedFat * 0.05);

  return Math.max(0, Math.round(points));
}
```

### 6.3 Dagelijks Puntenbudget

```javascript
/**
 * Bereken dagelijks puntenbudget op basis van gebruikersprofiel
 *
 * @param {Object} profile - Gebruikersprofiel
 * @returns {Object} Budget informatie
 */
function calculateDailyBudget(profile) {
  const { age, heightCm, weightKg, gender, activityLevel, goal } = profile;

  // Stap 1: Bereken BMR (Mifflin-St Jeor)
  let bmr;
  if (gender === 'male') {
    bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5;
  } else {
    bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161;
  }

  // Stap 2: Activiteitsfactor
  const activityFactors = {
    sedentary: 1.2,      // Weinig/geen beweging
    light: 1.375,        // Lichte beweging 1-3 dagen/week
    moderate: 1.55,       // Matige beweging 3-5 dagen/week
    active: 1.725,        // Zware beweging 6-7 dagen/week
    veryActive: 1.9       // Zeer zware beweging
  };
  const tdee = bmr * (activityFactors[activityLevel] || 1.375);

  // Stap 3: Deficiet voor gewichtsverlies (500 kcal = ~0.5 kg/week)
  let targetCalories = tdee;
  if (goal === 'lose') {
    targetCalories = tdee - 500;
  } else if (goal === 'maintain') {
    targetCalories = tdee;
  }

  // Stap 4: Calorieën → Punten (gemiddeld ~30 cal per punt)
  const dailyPoints = Math.max(23, Math.round(targetCalories / 30));

  // Stap 5: Weekpunten (typisch 28-49 extra)
  const weeklyPoints = Math.round(dailyPoints * 1.5);

  return {
    dailyPoints,
    weeklyPoints,
    estimatedCalories: targetCalories,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee)
  };
}
```

---

## 7. Datamodel

### 7.1 Database Schema (Conceptueel)

```
Users
├── id (PK)
├── email
├── password_hash
├── name
├── gender
├── date_of_birth
├── height_cm
├── current_weight_kg
├── goal_weight_kg
├── activity_level
├── daily_points_budget
├── weekly_points_budget
├── created_at
└── updated_at

FoodItems
├── id (PK)
├── name_nl
├── name_en
├── barcode (nullable, indexed)
├── brand (nullable)
├── calories_per_100g
├── protein_per_100g
├── fat_per_100g
├── saturated_fat_per_100g
├── unsaturated_fat_per_100g
├── carbs_per_100g
├── sugar_per_100g
├── added_sugar_per_100g
├── fiber_per_100g
├── points_per_100g (berekend)
├── serving_size_g
├── is_zero_point
├── source (NEVO / OpenFoodFacts / user)
└── created_at

DailyLog
├── id (PK)
├── user_id (FK → Users)
├── date
├── total_points_used
├── weekly_points_used
└── notes

MealEntries
├── id (PK)
├── daily_log_id (FK → DailyLog)
├── food_item_id (FK → FoodItems)
├── meal_type (breakfast / lunch / dinner / snack)
├── quantity_g
├── points
├── logged_at
└── notes

WeightLog
├── id (PK)
├── user_id (FK → Users)
├── date
├── weight_kg
└── notes

Recipes
├── id (PK)
├── user_id (FK → Users)
├── name
├── servings
├── total_points
├── points_per_serving
├── instructions
└── created_at

RecipeIngredients
├── id (PK)
├── recipe_id (FK → Recipes)
├── food_item_id (FK → FoodItems)
├── quantity_g
└── points
```

---

## 8. Juridische en Ethische Overwegingen

### 8.1 Intellectueel Eigendom
- **Merknaam:** "Weight Watchers", "WW", "Points" en "SmartPoints" zijn geregistreerde handelsmerken. Gebruik deze **niet** in de app.
- **Puntensysteem:** De exacte WW-formule is eigendom. Gebruik een **eigen puntensysteem** gebaseerd op publiek beschikbare voedingswetenschap.
- **Naamgeving:** Gebruik een eigen naam zoals "BodyBalance Points" of "BalancePunten".

### 8.2 Privacywetgeving
- **AVG/GDPR:** Gezondheidsdata is een speciale categorie. Vereist:
  - Expliciete toestemming
  - Data Protection Impact Assessment (DPIA)
  - Recht op verwijdering
  - Duidelijk privacybeleid
- **ePrivacy:** Cookie/tracking consent
- **Medische disclaimer:** De app is géén medisch advies

### 8.3 Gezondheidsrichtlijnen
- Minimaal 1200 kcal/dag voor vrouwen, 1500 kcal/dag voor mannen
- Waarschuwing bij te snel gewichtsverlies
- Doorverwijzing naar professional bij eetstoornis-signalen

---

## 9. MVP Scope (Minimum Viable Product)

### Fase 1: MVP (4-8 weken)
1. **Gebruikersregistratie en profiel** - Leeftijd, lengte, gewicht, geslacht, doel
2. **Dagelijks puntbudget berekening** - Op basis van profiel
3. **Voedingsmiddelen database** - NEVO data + Open Food Facts
4. **Voedsel zoeken en loggen** - Per maaltijd (ontbijt, lunch, diner, snack)
5. **Dagelijks dashboard** - Punten gebruikt/resterend
6. **Barcode scanner** - Via Open Food Facts API
7. **Gewicht bijhouden** - Wekelijks wegen en grafiek

### Fase 2: Verbeteringen (4-6 weken)
8. Recepten aanmaken met automatische puntenberekening
9. Weekpunten systeem
10. Voortgangsgrafieken en statistieken
11. ZeroPoint voedingsmiddelen lijst
12. Push notificaties

### Fase 3: Geavanceerd (6-8 weken)
13. AI-gebaseerde voedselherkenning (foto)
14. Maaltijdplanning
15. Sociale features / community
16. Wearable integraties
17. Offline modus

---

## 10. Verschil met Weight Watchers (USP voor BodyBalance)

Om ons te onderscheiden van WW:

| Aspect | Weight Watchers | BodyBalance (voorstel) |
|---|---|---|
| **Prijs** | €23-44/maand | Gratis / freemium |
| **Focus** | Globaal | Nederlandse markt |
| **Database** | Eigen (gesloten) | Open (NEVO + OpenFoodFacts) |
| **Formule** | Geheim | Transparant |
| **Taal** | Nederlands (vertaald) | Nederlands (native) |
| **Coaching** | Betaald (WW coaches) | Community-gedreven |
| **Open source** | Nee | Mogelijk |

---

## 11. Bronnen

- [Weight Watchers Points Calculator - Calculator.net](https://www.calculator.net/weight-watchers-points-calculator.html)
- [How to Calculate Weight Watchers Smart Points - Clean Eatz Kitchen](https://www.cleaneatzkitchen.com/a/blog/how-to-calculate-weight-watchers-smart-points-2023)
- [Weight Watchers Points Calculator - Omnicalculator](https://www.omnicalculator.com/health/weight-watchers-points)
- [How WeightWatchers Points Work - WW Australia](https://www.weightwatchers.com/au/how-it-works/points)
- [Breaking Down the WeightWatchers Points System - U.S. News](https://health.usnews.com/wellness/food/articles/breaking-down-the-weightwatchers-points-system)
- [WW Points Allowance Calculator - WatchersPoint](https://www.watcherspoint.com/allowance-calculator)
- [Daily Points Plus Allowance Calculator - Laaloosh](https://www.laaloosh.com/how-to-calculate-daily-weight-watchers-points-plus-allowance/)
- [Open Food Facts API Documentation](https://openfoodfacts.github.io/openfoodfacts-server/api/)
- [Open Food Facts Data & SDKs](https://world.openfoodfacts.org/data)
- [NEVO - Nederlandse Voedingsmiddelendatabase (RIVM)](https://www.rivm.nl/en/dutch-food-composition-database)
- [NEVO Dataset Download](https://www.rivm.nl/en/dutch-food-composition-database/use-of-nevo-online/request-dataset)
- [USDA FoodData Central](https://github.com/littlebunch/fdc-api)
- [Diet/Nutrition App Development Guide - Stormotion](https://stormotion.io/blog/diet-and-nutrition-app-development/)
- [Top Nutrition APIs for Developers - SpikeAPI](https://www.spikeapi.com/blog/top-nutrition-apis-for-developers-2026)
- [WeightWatchers Food Scanner](https://www.weightwatchers.com/us/blog/app-features/weightwatchers-food-scanner)
- [WeightWatchers App - App Store](https://apps.apple.com/us/app/weightwatchers-program/id331308914)
- [Simple Calorie Tracker (React Native) - GitHub](https://github.com/antomanc/simple-calorie-tracker)

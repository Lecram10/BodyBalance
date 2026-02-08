# BodyBalance - Fase 1: MVP Technisch Plan

## 1. Kan de app draaien in een GitHub-omgeving?

**Ja!** De beste aanpak is een **Progressive Web App (PWA)** gehost op **GitHub Pages**.

### Waarom PWA?

| Voordeel | Toelichting |
|---|---|
| **Geen App Store nodig** | Geen Apple Developer Account ($99/jaar), geen review-proces |
| **Gratis hosting** | GitHub Pages is gratis met HTTPS (vereist voor PWA) |
| **iPhone compatibel** | Werkt in Safari, installeerbaar op homescreen |
| **Cross-platform** | Werkt op iPhone, Android, desktop vanuit 1 codebase |
| **Geen native build tools** | Geen Xcode, geen macOS vereist voor ontwikkeling |
| **Direct updates** | Push naar GitHub → app is meteen bijgewerkt |

### GitHub-omgeving Setup

```
GitHub Repository (Lecram10/BodyBalance)
├── Source code (React + TypeScript)
├── GitHub Actions (CI/CD → automatisch builden en deployen)
└── GitHub Pages (hosting van de PWA)
```

**Workflow:**
1. Code pushen naar `main` branch
2. GitHub Actions bouwt de app automatisch
3. Resultaat wordt gedeployed naar GitHub Pages
4. App is beschikbaar op `https://lecram10.github.io/BodyBalance/`

---

## 2. iPhone Compatibiliteit (PWA op iOS)

### Wat werkt op iPhone

- Installeren op homescreen (via Safari → Deel → Zet op beginscherm)
- Volledig scherm modus (geen Safari-balk)
- Offline caching (beperkt tot 50MB)
- Camera toegang (voor barcode scanner)
- Push notificaties (iOS 16.4+, alleen als app op homescreen staat)
- Dark mode ondersteuning
- Touch/swipe gestures

### Beperkingen op iPhone

| Beperking | Impact | Workaround |
|---|---|---|
| Alleen via Safari te installeren | Gebruikers moeten weten hoe | In-app installatie-instructies tonen |
| Max 50MB offline opslag | Voedingsmiddelen-database moet slim laden | Alleen recent gebruikte items cachen |
| Geen automatische install-prompt | Minder ontdekbaarheid | Banner tonen: "Voeg toe aan beginscherm" |
| Data kan verloren gaan na 7 dagen inactiviteit | Gebruiker verliest lokale data | Backend database als primaire opslag |
| Geen App Store | Minder vindbaarheid | Marketing via website/social media |

### Design-richtlijnen voor iPhone

- **Safe area's** respecteren (notch, Dynamic Island, home indicator)
- **Minimaal 44x44px** voor touch targets (Apple HIG)
- **Haptic feedback** waar mogelijk
- **Pull-to-refresh** patronen
- **Bottom navigation** (duim-bereik optimalisatie)
- Testen op iPhone SE (klein scherm) t/m iPhone 15 Pro Max

---

## 3. Tech Stack - Fase 1

### Frontend

| Technologie | Versie | Waarom |
|---|---|---|
| **React** | 18+ | Grootste community, veel PWA-resources |
| **TypeScript** | 5+ | Type safety, minder bugs |
| **Vite** | 5+ | Snelle build tool, PWA plugin beschikbaar |
| **vite-plugin-pwa** | latest | Service worker + manifest generatie |
| **Tailwind CSS** | 3+ | Snel responsive UI bouwen |
| **React Router** | 6+ | Client-side navigatie |
| **Zustand** | 4+ | Lichtgewicht state management |

### Data & APIs

| Technologie | Doel |
|---|---|
| **Open Food Facts API** | Barcode scanning, producten zoeken |
| **LocalStorage / IndexedDB** | Offline data opslag op het apparaat |
| **Dexie.js** | Gebruiksvriendelijke IndexedDB wrapper |

### Backend (Fase 1 = Minimaal)

Voor de MVP draaien we **zonder eigen backend server**. Alle data wordt lokaal op het apparaat opgeslagen via IndexedDB. Dit houdt het simpel en gratis.

| Component | Oplossing |
|---|---|
| **Gebruikersdata** | IndexedDB (lokaal op apparaat) |
| **Voedingsmiddelen** | Open Food Facts API (extern) + lokale cache |
| **Authenticatie** | Niet nodig in fase 1 (lokale app) |
| **Hosting** | GitHub Pages (gratis, HTTPS) |

> **Opmerking:** In fase 2 kan een backend (Firebase/Supabase) worden toegevoegd voor cloud sync, accounts en social features.

### Build & Deploy

| Technologie | Doel |
|---|---|
| **GitHub Actions** | Automatische build bij elke push |
| **GitHub Pages** | Gratis hosting met HTTPS |
| **Lighthouse CI** | PWA-kwaliteit bewaken |

---

## 4. Projectstructuur

```
BodyBalance/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions: build + deploy
├── public/
│   ├── icons/                      # App iconen (192x192, 512x512)
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── assets/                     # Afbeeldingen, fonts
│   ├── components/                 # Herbruikbare UI componenten
│   │   ├── ui/                     # Basis componenten (Button, Card, Input)
│   │   ├── layout/                 # Layout componenten (Header, BottomNav)
│   │   ├── food/                   # Voedsel-gerelateerde componenten
│   │   │   ├── FoodSearch.tsx
│   │   │   ├── FoodItem.tsx
│   │   │   ├── BarcodeScanner.tsx
│   │   │   └── MealEntry.tsx
│   │   ├── points/                 # Punten componenten
│   │   │   ├── PointsBudget.tsx
│   │   │   ├── PointsRing.tsx
│   │   │   └── DailyOverview.tsx
│   │   └── profile/                # Profiel componenten
│   │       ├── ProfileForm.tsx
│   │       └── WeightLogger.tsx
│   ├── pages/                      # Pagina's / schermen
│   │   ├── Dashboard.tsx           # Hoofdscherm met dagelijks overzicht
│   │   ├── Track.tsx               # Maaltijd loggen
│   │   ├── Search.tsx              # Voedsel zoeken + barcode scan
│   │   ├── Profile.tsx             # Profiel en instellingen
│   │   ├── Progress.tsx            # Voortgang en gewicht
│   │   └── Onboarding.tsx          # Eerste keer setup
│   ├── hooks/                      # Custom React hooks
│   │   ├── usePoints.ts            # Puntenberekening logica
│   │   ├── useFoodSearch.ts        # Voedsel zoeken
│   │   ├── useBarcode.ts           # Barcode scanner
│   │   └── useProfile.ts           # Profiel data
│   ├── lib/                        # Business logica
│   │   ├── points-calculator.ts    # Puntenberekening engine
│   │   ├── budget-calculator.ts    # Dagelijks budget berekenen
│   │   ├── food-api.ts             # Open Food Facts API client
│   │   └── zero-point-foods.ts     # ZeroPoint voedingsmiddelen lijst
│   ├── store/                      # State management (Zustand)
│   │   ├── user-store.ts           # Gebruikersprofiel state
│   │   ├── food-store.ts           # Voedsel log state
│   │   └── meal-store.ts           # Maaltijden state
│   ├── db/                         # Lokale database (IndexedDB via Dexie)
│   │   ├── database.ts             # Database schema en setup
│   │   └── seed-data.ts            # Basis voedingsmiddelen data
│   ├── types/                      # TypeScript type definities
│   │   ├── food.ts
│   │   ├── user.ts
│   │   └── meal.ts
│   ├── App.tsx                     # Root component
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Global styles + Tailwind
├── index.html
├── vite.config.ts                  # Vite + PWA configuratie
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 5. Fase 1 Features - Gedetailleerd

### 5.1 Onboarding (Eerste keer)

**Scherm 1: Welkom**
- App naam en logo
- Korte uitleg: "BodyBalance zet calorieën om in simpele punten"
- Knop: "Aan de slag"

**Scherm 2: Profiel invullen**
- Geslacht (man/vrouw)
- Geboortedatum (of leeftijd)
- Lengte (cm)
- Huidig gewicht (kg)
- Streefgewicht (kg)
- Activiteitsniveau (dropdown: zittend / licht actief / matig actief / zeer actief)

**Scherm 3: Je budget**
- Toon berekend dagelijks puntenbudget
- Toon weekpunten
- Korte uitleg hoe punten werken
- Knop: "Start met tracken"

### 5.2 Dashboard (Hoofdscherm)

```
┌─────────────────────────────────┐
│  BodyBalance        [profiel]   │
│                                 │
│       ╭───────────╮             │
│       │    12     │             │
│       │  ───────  │  Punten     │
│       │    28     │  ring       │
│       ╰───────────╯             │
│    12 gebruikt / 28 budget      │
│                                 │
│  Weekpunten: 35 resterend       │
│                                 │
│  ┌─ Ontbijt ──────────── 4 pt ┐│
│  │ Havermout         2 pt      ││
│  │ Banaan            0 pt      ││
│  │ Melk              2 pt      ││
│  └─────────────────────────────┘│
│  ┌─ Lunch ─────────── + voeg  ┐│
│  │ Nog niets gelogd           ││
│  └─────────────────────────────┘│
│  ┌─ Diner ─────────── + voeg  ┐│
│  │ Nog niets gelogd           ││
│  └─────────────────────────────┘│
│  ┌─ Snacks ────────── + voeg  ┐│
│  │ Nog niets gelogd           ││
│  └─────────────────────────────┘│
│                                 │
│  [Home] [Zoek] [Scan] [Profiel] │
└─────────────────────────────────┘
```

### 5.3 Voedsel Zoeken & Loggen

- Zoekbalk met autocomplete
- Zoekt in Open Food Facts API
- Toont per resultaat: naam, merk, punten per portie
- Bij selectie: kies portiegrootte → punten worden berekend
- Kies maaltijdtype (ontbijt/lunch/diner/snack)
- "Voeg toe" knop

### 5.4 Barcode Scanner

- Camera opent via `navigator.mediaDevices.getUserMedia()`
- Gebruikt **QuaggaJS** of **html5-qrcode** library voor barcode detectie
- Scant EAN-13 / EAN-8 barcodes (standaard in Nederland)
- Zoekt barcode op via Open Food Facts API
- Toont product info + berekende punten
- Mogelijkheid om direct toe te voegen aan maaltijd

### 5.5 Profiel & Instellingen

- Profiel gegevens aanpassen
- Dagelijks budget wordt automatisch herberekend
- Gewicht loggen (met datum)
- Eenheid voorkeuren (metrisch)
- Data exporteren / wissen

### 5.6 Gewichtstracker

- Wekelijks gewicht invoeren
- Simpele lijn-grafiek met verloop
- Verschil t.o.v. startgewicht en streefgewicht tonen

---

## 6. Benodigde npm Packages

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "zustand": "^4.4.0",
    "dexie": "^3.2.0",
    "dexie-react-hooks": "^1.1.0",
    "html5-qrcode": "^2.3.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.300.0",
    "date-fns": "^3.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vite-plugin-pwa": "^0.17.0",
    "vitest": "^1.0.0"
  }
}
```

| Package | Grootte | Doel |
|---|---|---|
| **react + react-dom** | ~40KB | UI framework |
| **react-router-dom** | ~15KB | Pagina navigatie |
| **zustand** | ~1KB | State management (veel lichter dan Redux) |
| **dexie** | ~25KB | IndexedDB wrapper voor lokale data opslag |
| **html5-qrcode** | ~50KB | Barcode scanner via camera |
| **recharts** | ~60KB | Grafieken (gewichtsverloop) |
| **lucide-react** | ~5KB (tree-shaken) | Iconen |
| **date-fns** | ~10KB (tree-shaken) | Datumformattering |
| **vite-plugin-pwa** | build-only | PWA service worker + manifest |
| **tailwindcss** | build-only | CSS utility framework |

---

## 7. PWA Configuratie

### manifest.json (automatisch gegenereerd door vite-plugin-pwa)

```json
{
  "name": "BodyBalance",
  "short_name": "BodyBalance",
  "description": "Houd je voeding bij met een simpel puntensysteem",
  "start_url": "/BodyBalance/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#22c55e",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/BodyBalance/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/BodyBalance/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/BodyBalance/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### Service Worker Strategie

- **App shell**: Cache bij installatie (HTML, CSS, JS, iconen)
- **API responses**: Network-first met cache fallback
- **Afbeeldingen**: Cache-first met netwerk fallback

---

## 8. GitHub Actions Deploy Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --run

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        uses: actions/deploy-pages@v4
```

---

## 9. Ontwikkelstappen (Volgorde)

### Week 1-2: Project Setup & Core
1. [ ] Vite + React + TypeScript project opzetten
2. [ ] Tailwind CSS configureren
3. [ ] PWA configuratie (vite-plugin-pwa)
4. [ ] GitHub Actions deploy pipeline
5. [ ] Basis routing (React Router)
6. [ ] Bottom navigation component
7. [ ] Lokale database setup (Dexie/IndexedDB)

### Week 3-4: Punten Engine & Profiel
8. [ ] Puntenberekening engine (`points-calculator.ts`)
9. [ ] Budget calculator (`budget-calculator.ts`)
10. [ ] Onboarding flow (profiel invullen)
11. [ ] Profiel opslaan in IndexedDB
12. [ ] ZeroPoint voedingsmiddelen lijst

### Week 5-6: Voedsel & Tracking
13. [ ] Open Food Facts API integratie
14. [ ] Voedsel zoeken component
15. [ ] Maaltijd logging (toevoegen aan dag)
16. [ ] Dashboard met punten-ring
17. [ ] Dagelijks overzicht per maaltijdtype

### Week 7-8: Barcode & Polish
18. [ ] Barcode scanner implementatie
19. [ ] Gewichtstracker met grafiek
20. [ ] Weekpunten systeem
21. [ ] Install-prompt voor iPhone
22. [ ] Testen op iPhone Safari
23. [ ] Performance optimalisatie (Lighthouse score)
24. [ ] Bug fixes en polish

---

## 10. Kosten Overzicht

| Item | Kosten |
|---|---|
| GitHub Pages hosting | **Gratis** |
| Open Food Facts API | **Gratis** |
| GitHub Actions (2000 min/maand) | **Gratis** |
| Apple Developer Account | **Niet nodig** (PWA) |
| Domein (optioneel) | ~€10/jaar |
| **Totaal** | **€0** (of €10/jaar met eigen domein) |

---

## 11. Alternatief: Later naar App Store?

Mocht je later alsnog naar de App Store willen, dan kan de React PWA omgezet worden naar een native app via:

| Optie | Moeite | Voordeel |
|---|---|---|
| **Capacitor** (Ionic) | Laag | Hergebruik 95% van de PWA code |
| **React Native** | Hoog | Betere native integratie |
| **TWA (Android)** | Laag | PWA in Play Store wrapper |

**Aanbeveling:** Start met PWA, valideer het concept, en wrap later met Capacitor als App Store aanwezigheid gewenst is.

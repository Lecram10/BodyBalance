/**
 * Drankherkenning voor automatische waterinname-berekening.
 *
 * Categorieën:
 *   1.0 (100%) — Thee, koffie (zwart/met melk), zero-sugar frisdrank, bouillon
 *   0.5 (50%)  — Cappuccino, latte, melk, sap, frisdrank met suiker, smoothie
 *   0.0 (0%)   — Alcohol, energiedranken
 */

/** Keywords die 100% van het volume als water meetellen. */
const FULL_WATER_KEYWORDS = [
  // Thee
  'thee', 'kruidenthee', 'groene thee', 'muntthee', 'rooibos', 'kamillethee',
  'gemberthee', 'earl grey',
  'tea', 'green tea', 'herbal tea', 'mint tea', 'chamomile tea',
  // Koffie (zwart / met melk, geen latte/cappuccino)
  'koffie zwart', 'koffie met melk', 'koffie met suiker', 'espresso', 'americano',
  'filterkoffie', 'coffee', 'black coffee',
  // Zero-sugar frisdrank
  'cola zero', 'cola light', 'pepsi max', 'pepsi light',
  'fanta zero', 'sprite zero', 'seven up free', '7up free', '7-up free',
  'fernandes zero', 'rivella light',
  'diet coke', 'zero sugar', 'sugar free',
  // Bouillon / soep
  'bouillon', 'heldere soep', 'consommé', 'broth', 'clear soup',
  // Water met smaak
  'spa touch', 'bar le duc', 'water met smaak', 'flavored water', 'infused water',
  'sourcy', 'vitaminewater zero',
];

/** Keywords die 50% van het volume als water meetellen. */
const HALF_WATER_KEYWORDS = [
  // Melkkoffie
  'cappuccino', 'latte macchiato', 'latte', 'koffie verkeerd', 'flat white',
  'café au lait', 'mocha', 'mokka',
  // Melk
  'melk', 'halfvolle melk', 'volle melk', 'magere melk', 'karnemelk',
  'havermelk', 'sojamelk', 'amandelmelk', 'rijstmelk', 'kokosmelk',
  'milk', 'whole milk', 'skim milk', 'oat milk', 'soy milk', 'almond milk',
  // Sap
  'sinaasappelsap', 'appelsap', 'jus d\'orange', 'vruchtensap', 'fruitsap',
  'perensap', 'tomatensap', 'wortelsap', 'druivensap', 'cranberrysap',
  'orange juice', 'apple juice', 'fruit juice', 'tomato juice',
  // Frisdrank met suiker
  'cola', 'fanta', 'sprite', 'sinas', 'cassis', 'frisdrank', 'limonade',
  'tonic', 'bitter lemon', 'ginger ale', 'ginger beer',
  'rivella', 'fernandes', 'ice tea', 'ijsthee',
  'soda', 'lemonade', 'soft drink', 'iced tea',
  // Sportdrank
  'sportdrank', 'aa drink', 'aquarius', 'isostar', 'gatorade', 'powerade',
  'extran', 'sports drink',
  // Chocolademelk
  'chocolademelk', 'chocomel', 'cacaodrank', 'warme chocolademelk',
  'chocolate milk', 'cocoa drink', 'hot chocolate',
  // Smoothie
  'smoothie', 'fruitsmoothie', 'groene smoothie',
  // Vitaminewater
  'vitaminewater', 'vitamin water',
  // Drinkontbijt / drinkmaaltijd
  'drinkontbijt', 'drinkmaaltijd',
];

/** Keywords die NIET als water mogen meetellen (0%). Gecontroleerd vóór de andere lijsten. */
const EXCLUDE_KEYWORDS = [
  // Alcohol
  'bier', 'pils', 'witbier', 'ipa', 'stout', 'porter', 'radler', 'weizen',
  'beer', 'ale', 'lager',
  'wijn', 'rode wijn', 'witte wijn', 'rosé', 'prosecco', 'champagne', 'cava',
  'wine', 'red wine', 'white wine',
  'wodka', 'vodka', 'rum', 'gin', 'whisky', 'whiskey', 'jenever', 'cognac',
  'brandewijn', 'tequila', 'likeur', 'amaretto', 'baileys',
  'cocktail', 'mojito', 'martini', 'sangria', 'glühwein', 'port',
  // Energiedrank
  'energiedrank', 'energy drink', 'energy',
  'red bull', 'monster', 'bullit', 'golden power', 'burn',
];

/**
 * Bouw een regex die matcht op een keyword als heel woord (of als start/einde van een woord).
 * Gebruikt \b voor woordgrenzen, case-insensitive.
 */
function buildRegex(keywords: string[]): RegExp {
  // Sorteer langste keywords eerst (zodat "cola zero" matcht vóór "cola")
  const sorted = [...keywords].sort((a, b) => b.length - a.length);
  const escaped = sorted.map(kw => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`\\b(?:${escaped.join('|')})\\b`, 'i');
}

const excludeRegex = buildRegex(EXCLUDE_KEYWORDS);
const fullWaterRegex = buildRegex(FULL_WATER_KEYWORDS);
const halfWaterRegex = buildRegex(HALF_WATER_KEYWORDS);

/**
 * Bepaal welk percentage van het drankvolume als water meetelt.
 *
 * @param name — Naam van het voedingsmiddel (bijv. "Cappuccino", "Cola Zero")
 * @returns 1.0, 0.5, of 0 (niet meetellen / geen drank)
 */
export function getDrinkWaterPercentage(name: string): number {
  // Eerst: check uitsluitingen (alcohol, energiedrank)
  if (excludeRegex.test(name)) return 0;

  // Dan: 100% check
  if (fullWaterRegex.test(name)) return 1;

  // Dan: 50% check
  if (halfWaterRegex.test(name)) return 0.5;

  // Koffie als generiek woord → 100% (vangnet voor "Koffie" zonder verdere specificatie)
  if (/\bkoffie\b/i.test(name) || /\bcoffee\b/i.test(name)) return 1;

  return 0;
}

/**
 * Bereken hoeveel ml water moet worden toegevoegd voor een drank.
 *
 * @param name — Naam van het voedingsmiddel
 * @param volumeMl — Volume in ml (quantityG × quantity)
 * @returns Aantal ml toe te voegen aan waterinname (0 als het geen drank is)
 */
export function calculateDrinkWaterMl(name: string, volumeMl: number): number {
  const pct = getDrinkWaterPercentage(name);
  if (pct === 0) return 0;
  return Math.round(volumeMl * pct);
}

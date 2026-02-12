/**
 * ZeroPoint voedingsmiddelen - voedingsmiddelen die 0 punten kosten.
 * Gebaseerd op het WW-systeem: vezelrijk, eiwitrijk, natuurlijke voedingsmiddelen.
 */

export interface ZeroPointCategory {
  name: string;
  icon: string;
  items: string[];
}

export const ZERO_POINT_CATEGORIES: ZeroPointCategory[] = [
  {
    name: 'Fruit',
    icon: '🍎',
    items: [
      'Appel', 'Banaan', 'Sinaasappel', 'Mandarijn', 'Druiven',
      'Aardbei', 'Blauwe bes', 'Framboos', 'Watermeloen', 'Mango',
      'Ananas', 'Kiwi', 'Peer', 'Perzik', 'Pruim', 'Grapefruit',
    ],
  },
  {
    name: 'Groenten',
    icon: '🥦',
    items: [
      'Broccoli', 'Sperziebonen', 'Spinazie', 'Tomaat', 'Komkommer',
      'Wortel', 'Paprika', 'Courgette', 'Bloemkool', 'Sla',
      'Champignon', 'Ui', 'Aubergine', 'Boerenkool', 'Andijvie',
      'Spruitjes', 'Asperge', 'Selderij', 'Radijs', 'Prei',
    ],
  },
  {
    name: 'Eiwit',
    icon: '🍗',
    items: [
      'Kipfilet', 'Kalkoenfilet', 'Ei', 'Gekookt ei',
      'Tonijn (in water)', 'Garnalen', 'Kabeljauw', 'Zalm',
      'Tilapia', 'Pangasius',
    ],
  },
  {
    name: 'Zuivel',
    icon: '🥛',
    items: [
      'Magere yoghurt', 'Magere kwark', 'Skyr', 'Cottage cheese',
    ],
  },
  {
    name: 'Peulvruchten',
    icon: '🫘',
    items: [
      'Kidneybonen', 'Kikkererwten', 'Linzen',
      'Zwarte bonen', 'Witte bonen', 'Tuinbonen',
    ],
  },
];

/** Platte lijst van alle zero-point namen (backwards compatible) */
export const ZERO_POINT_FOODS: string[] = ZERO_POINT_CATEGORIES.flatMap((c) => c.items);

export function isZeroPointFood(name: string): boolean {
  const lower = name.toLowerCase();
  return ZERO_POINT_FOODS.some((food) => {
    const escaped = food.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`).test(lower);
  });
}

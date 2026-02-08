/**
 * ZeroPoint voedingsmiddelen - voedingsmiddelen die 0 punten kosten.
 * Gebaseerd op het WW-systeem: vezelrijk, eiwitrijk, natuurlijke voedingsmiddelen.
 */
export const ZERO_POINT_FOODS: string[] = [
  // Fruit
  'Appel',
  'Banaan',
  'Sinaasappel',
  'Mandarijn',
  'Druiven',
  'Aardbei',
  'Blauwe bes',
  'Framboos',
  'Watermeloen',
  'Mango',
  'Ananas',
  'Kiwi',
  'Peer',
  'Perzik',
  'Pruim',
  'Grapefruit',

  // Groenten
  'Broccoli',
  'Sperziebonen',
  'Spinazie',
  'Tomaat',
  'Komkommer',
  'Wortel',
  'Paprika',
  'Courgette',
  'Bloemkool',
  'Sla',
  'Champignon',
  'Ui',
  'Aubergine',
  'Boerenkool',
  'Andijvie',
  'Spruitjes',
  'Asperge',
  'Selderij',
  'Radijs',
  'Prei',

  // Eiwit
  'Kipfilet',
  'Kalkoenfilet',
  'Ei',
  'Gekookt ei',
  'Tonijn (in water)',
  'Garnalen',
  'Kabeljauw',
  'Zalm',
  'Tilapia',
  'Pangasius',

  // Zuivel
  'Magere yoghurt',
  'Magere kwark',
  'Skyr',
  'Cottage cheese',

  // Peulvruchten
  'Kidneybonen',
  'Kikkererwten',
  'Linzen',
  'Zwarte bonen',
  'Witte bonen',
  'Tuinbonen',
];

export function isZeroPointFood(name: string): boolean {
  const lower = name.toLowerCase();
  return ZERO_POINT_FOODS.some((food) => lower.includes(food.toLowerCase()));
}

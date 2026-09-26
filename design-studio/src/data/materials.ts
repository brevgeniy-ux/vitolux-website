export type FloorPattern = 'planks' | 'herringbone' | 'tiles' | 'concrete' | 'marble' | 'carpet';

export interface FloorMaterial {
  id: string;
  name: string;
  pattern: FloorPattern;
  base: string;
  accent: string;
  /** Размер модуля текстуры, м */
  tile: number;
  roughness: number;
  pricePerM2: number;
  unit: string;
}

export const FLOORS: FloorMaterial[] = [
  { id: 'oak-light', name: 'Инженерная доска, дуб светлый', pattern: 'planks', base: '#d9bf98', accent: '#c4a57a', tile: 1.2, roughness: 0.6, pricePerM2: 1650, unit: 'м²' },
  { id: 'oak-natural', name: 'Паркет «ёлочка», дуб натуральный', pattern: 'herringbone', base: '#c49a6c', accent: '#a97d52', tile: 0.6, roughness: 0.55, pricePerM2: 2400, unit: 'м²' },
  { id: 'walnut', name: 'Инженерная доска, орех', pattern: 'planks', base: '#7a5236', accent: '#5f3e28', tile: 1.2, roughness: 0.5, pricePerM2: 2100, unit: 'м²' },
  { id: 'ash-grey', name: 'Ламинат 33 кл., ясень серый', pattern: 'planks', base: '#b9b3aa', accent: '#a09a91', tile: 1.2, roughness: 0.65, pricePerM2: 720, unit: 'м²' },
  { id: 'microcement', name: 'Микроцемент', pattern: 'concrete', base: '#a8a49e', accent: '#95918b', tile: 2, roughness: 0.8, pricePerM2: 1900, unit: 'м²' },
  { id: 'porcelain-grey', name: 'Керамогранит 60×60, серый', pattern: 'tiles', base: '#b8b8b4', accent: '#8f8f8b', tile: 0.6, roughness: 0.4, pricePerM2: 980, unit: 'м²' },
  { id: 'porcelain-white', name: 'Керамогранит 60×120, белый', pattern: 'tiles', base: '#e8e6e1', accent: '#c9c7c2', tile: 0.6, roughness: 0.3, pricePerM2: 1250, unit: 'м²' },
  { id: 'marble', name: 'Керамогранит под мрамор 120×60', pattern: 'marble', base: '#eeebe6', accent: '#b8b2aa', tile: 1.2, roughness: 0.15, pricePerM2: 1600, unit: 'м²' },
  { id: 'terrazzo', name: 'Плитка терраццо 30×30', pattern: 'tiles', base: '#d6d0c6', accent: '#a79f94', tile: 0.3, roughness: 0.45, pricePerM2: 1350, unit: 'м²' },
  { id: 'carpet', name: 'Ковролин, шерсть', pattern: 'carpet', base: '#c9c0b3', accent: '#bdb3a5', tile: 1, roughness: 0.95, pricePerM2: 890, unit: 'м²' },
  { id: 'deck', name: 'Террасная доска ДПК', pattern: 'planks', base: '#8c6a4c', accent: '#735539', tile: 1.5, roughness: 0.7, pricePerM2: 1100, unit: 'м²' },
];

export const floorById = (id: string) => FLOORS.find((f) => f.id === id) ?? FLOORS[0];

/** Цены на черновые/отделочные материалы и работы для сметы, грн */
export const RATES = {
  paintPerLiter: 420,
  paintConsumption: 0.15, // л/м² на 2 слоя
  primerPerM2: 25,
  wallTilePerM2: 1100,
  baseboardPerM: 180,
  ceilingPerM2: 450, // натяжной/ГКЛ с покраской
  doorUnit: 9500,
  windowSillPerM: 900,
  works: {
    wallsPerM2: 380,
    floorPerM2: 450,
    tilePerM2: 900,
    ceilingPerM2: 350,
    electricPoint: 450,
    lightInstall: 350,
  },
};

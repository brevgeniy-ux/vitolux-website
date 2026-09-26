export type LightModel = 'spot' | 'pendant' | 'chandelier' | 'panel' | 'track' | 'sconce' | 'floorLamp' | 'strip';

export interface LightDef {
  id: string;
  name: string;
  model: LightModel;
  category: string;
  /** Световой поток, лм */
  lumens: number;
  watts: number;
  price: number;
  /** Высота подвеса от потолка (для подвесов) или высота установки (для бра/торшеров), м */
  drop: number;
  ip: number;
  /** Размер на плане, м */
  size: number;
}

// Каталог освещения Vitolux — ориентировочные цены, грн
export const LIGHTS: LightDef[] = [
  { id: 'spot-gu10', name: 'Точечный светильник встраиваемый GU10, 7 Вт', model: 'spot', category: 'Точечные', lumens: 600, watts: 7, price: 420, drop: 0, ip: 20, size: 0.09 },
  { id: 'spot-ip44', name: 'Точечный светильник влагозащищённый, 7 Вт', model: 'spot', category: 'Точечные', lumens: 580, watts: 7, price: 560, drop: 0, ip: 44, size: 0.09 },
  { id: 'spot-surface', name: 'Накладной светильник-цилиндр, 12 Вт', model: 'spot', category: 'Точечные', lumens: 1000, watts: 12, price: 980, drop: 0.12, ip: 20, size: 0.1 },
  { id: 'panel-600', name: 'LED-панель 600×600, 36 Вт', model: 'panel', category: 'Панели', lumens: 3600, watts: 36, price: 1150, drop: 0, ip: 20, size: 0.6 },
  { id: 'pendant-dome', name: 'Подвесной светильник «купол» Ø35, E27', model: 'pendant', category: 'Подвесные', lumens: 1055, watts: 12, price: 2900, drop: 0.8, ip: 20, size: 0.35 },
  { id: 'pendant-linear', name: 'Линейный подвес 1,2 м, 40 Вт', model: 'pendant', category: 'Подвесные', lumens: 4200, watts: 40, price: 5400, drop: 0.7, ip: 20, size: 1.2 },
  { id: 'chandelier', name: 'Люстра 6 плафонов, 6×E14', model: 'chandelier', category: 'Люстры', lumens: 3000, watts: 36, price: 8900, drop: 0.55, ip: 20, size: 0.7 },
  { id: 'track-3', name: 'Трековая система 2 м + 4 прожектора', model: 'track', category: 'Трековые', lumens: 3600, watts: 40, price: 6200, drop: 0.05, ip: 20, size: 2 },
  { id: 'sconce', name: 'Бра настенное, 6 Вт', model: 'sconce', category: 'Настенные', lumens: 450, watts: 6, price: 1650, drop: 1.7, ip: 20, size: 0.2 },
  { id: 'sconce-ip44', name: 'Бра для ванной у зеркала IP44, 10 Вт', model: 'sconce', category: 'Настенные', lumens: 800, watts: 10, price: 2100, drop: 1.8, ip: 44, size: 0.3 },
  { id: 'floor-lamp', name: 'Торшер, E27', model: 'floorLamp', category: 'Напольные', lumens: 800, watts: 9, price: 3800, drop: 1.6, ip: 20, size: 0.4 },
  { id: 'strip-5m', name: 'LED-лента 5 м в профиле, 14 Вт/м', model: 'strip', category: 'Подсветка', lumens: 5000, watts: 70, price: 2600, drop: 0, ip: 20, size: 2.5 },
];

export const lightById = (id: string) => LIGHTS.find((l) => l.id === id);

import type { RoomType } from '../types';

export type FurnitureModel =
  | 'sofa'
  | 'cornerSofa'
  | 'armchair'
  | 'coffeeTable'
  | 'tvUnit'
  | 'bed'
  | 'nightstand'
  | 'wardrobe'
  | 'dresser'
  | 'diningTable'
  | 'chair'
  | 'desk'
  | 'officeChair'
  | 'bookshelf'
  | 'kitchen'
  | 'island'
  | 'fridge'
  | 'bathtub'
  | 'shower'
  | 'toilet'
  | 'vanity'
  | 'washer'
  | 'rug'
  | 'plant'
  | 'shoeCabinet'
  | 'bench';

export type ColorRole = 'wood' | 'fabric' | 'accent' | 'metal' | 'white';

export interface FurnitureDef {
  id: string;
  name: string;
  model: FurnitureModel;
  category: string;
  /** Габариты: ширина (X), глубина (Y плана), высота, м */
  w: number;
  d: number;
  h: number;
  price: number;
  colorRole: ColorRole;
  rooms: RoomType[];
}

export const FURNITURE: FurnitureDef[] = [
  // Гостиная
  { id: 'sofa-3', name: 'Диван 3-местный', model: 'sofa', category: 'Мягкая мебель', w: 2.2, d: 0.95, h: 0.8, price: 38000, colorRole: 'fabric', rooms: ['living'] },
  { id: 'sofa-corner', name: 'Диван угловой', model: 'cornerSofa', category: 'Мягкая мебель', w: 2.8, d: 1.7, h: 0.8, price: 56000, colorRole: 'fabric', rooms: ['living'] },
  { id: 'armchair', name: 'Кресло', model: 'armchair', category: 'Мягкая мебель', w: 0.85, d: 0.85, h: 0.8, price: 16500, colorRole: 'accent', rooms: ['living', 'bedroom', 'office'] },
  { id: 'coffee-table', name: 'Журнальный стол', model: 'coffeeTable', category: 'Столы', w: 1.1, d: 0.6, h: 0.4, price: 8900, colorRole: 'wood', rooms: ['living'] },
  { id: 'tv-unit', name: 'ТВ-тумба с панелью', model: 'tvUnit', category: 'Корпусная мебель', w: 2.0, d: 0.45, h: 0.5, price: 21000, colorRole: 'wood', rooms: ['living', 'bedroom'] },
  { id: 'rug-l', name: 'Ковёр 2×3 м', model: 'rug', category: 'Текстиль', w: 3.0, d: 2.0, h: 0.01, price: 12000, colorRole: 'fabric', rooms: ['living', 'bedroom'] },
  { id: 'plant', name: 'Растение в кашпо', model: 'plant', category: 'Декор', w: 0.5, d: 0.5, h: 1.3, price: 3500, colorRole: 'accent', rooms: ['living', 'office', 'hall', 'dining'] },
  { id: 'bookshelf', name: 'Стеллаж', model: 'bookshelf', category: 'Корпусная мебель', w: 1.2, d: 0.35, h: 2.0, price: 14500, colorRole: 'wood', rooms: ['living', 'office', 'kids'] },

  // Спальня
  { id: 'bed-160', name: 'Кровать 160×200', model: 'bed', category: 'Кровати', w: 1.75, d: 2.15, h: 1.0, price: 42000, colorRole: 'fabric', rooms: ['bedroom'] },
  { id: 'bed-180', name: 'Кровать 180×200', model: 'bed', category: 'Кровати', w: 1.95, d: 2.15, h: 1.05, price: 52000, colorRole: 'fabric', rooms: ['bedroom'] },
  { id: 'bed-90', name: 'Кровать 90×200', model: 'bed', category: 'Кровати', w: 1.0, d: 2.05, h: 0.8, price: 18500, colorRole: 'accent', rooms: ['kids'] },
  { id: 'nightstand', name: 'Прикроватная тумба', model: 'nightstand', category: 'Корпусная мебель', w: 0.5, d: 0.4, h: 0.5, price: 5200, colorRole: 'wood', rooms: ['bedroom'] },
  { id: 'wardrobe', name: 'Шкаф-купе 2,0 м', model: 'wardrobe', category: 'Системы хранения', w: 2.0, d: 0.6, h: 2.4, price: 36000, colorRole: 'white', rooms: ['bedroom', 'hall', 'wardrobe'] },
  { id: 'wardrobe-s', name: 'Шкаф 1,2 м', model: 'wardrobe', category: 'Системы хранения', w: 1.2, d: 0.6, h: 2.2, price: 21000, colorRole: 'white', rooms: ['kids', 'hall', 'office'] },
  { id: 'dresser', name: 'Комод', model: 'dresser', category: 'Корпусная мебель', w: 1.2, d: 0.45, h: 0.85, price: 15000, colorRole: 'wood', rooms: ['bedroom', 'kids'] },

  // Кухня / столовая
  { id: 'kitchen-3', name: 'Кухонный гарнитур 3,0 м', model: 'kitchen', category: 'Кухня', w: 3.0, d: 0.62, h: 2.2, price: 115000, colorRole: 'white', rooms: ['kitchen'] },
  { id: 'kitchen-2', name: 'Кухонный гарнитур 2,2 м', model: 'kitchen', category: 'Кухня', w: 2.2, d: 0.62, h: 2.2, price: 82000, colorRole: 'white', rooms: ['kitchen'] },
  { id: 'island', name: 'Кухонный остров', model: 'island', category: 'Кухня', w: 1.8, d: 0.9, h: 0.92, price: 54000, colorRole: 'wood', rooms: ['kitchen'] },
  { id: 'fridge', name: 'Холодильник встраиваемый', model: 'fridge', category: 'Техника', w: 0.62, d: 0.65, h: 2.0, price: 48000, colorRole: 'metal', rooms: ['kitchen'] },
  { id: 'dining-4', name: 'Обеденная группа на 4', model: 'diningTable', category: 'Столы', w: 1.4, d: 0.85, h: 0.75, price: 29000, colorRole: 'wood', rooms: ['kitchen', 'dining', 'living'] },
  { id: 'dining-6', name: 'Обеденная группа на 6', model: 'diningTable', category: 'Столы', w: 2.0, d: 0.95, h: 0.75, price: 46000, colorRole: 'wood', rooms: ['dining', 'living'] },
  { id: 'chair', name: 'Стул', model: 'chair', category: 'Стулья', w: 0.45, d: 0.5, h: 0.85, price: 3900, colorRole: 'fabric', rooms: ['kitchen', 'dining', 'office'] },

  // Кабинет / детская
  { id: 'desk', name: 'Письменный стол', model: 'desk', category: 'Столы', w: 1.4, d: 0.7, h: 0.75, price: 12500, colorRole: 'wood', rooms: ['office', 'kids', 'bedroom'] },
  { id: 'office-chair', name: 'Рабочее кресло', model: 'officeChair', category: 'Стулья', w: 0.6, d: 0.6, h: 1.1, price: 9800, colorRole: 'metal', rooms: ['office', 'kids'] },

  // Санузлы
  { id: 'bathtub', name: 'Ванна 170×75', model: 'bathtub', category: 'Сантехника', w: 1.7, d: 0.75, h: 0.6, price: 24000, colorRole: 'white', rooms: ['bathroom'] },
  { id: 'shower', name: 'Душевая 90×90 со стеклом', model: 'shower', category: 'Сантехника', w: 0.9, d: 0.9, h: 2.0, price: 19000, colorRole: 'white', rooms: ['bathroom', 'wc'] },
  { id: 'toilet', name: 'Унитаз подвесной с инсталляцией', model: 'toilet', category: 'Сантехника', w: 0.4, d: 0.55, h: 0.8, price: 16500, colorRole: 'white', rooms: ['bathroom', 'wc'] },
  { id: 'vanity', name: 'Тумба с раковиной 80 см', model: 'vanity', category: 'Сантехника', w: 0.8, d: 0.48, h: 0.85, price: 17500, colorRole: 'wood', rooms: ['bathroom', 'wc'] },
  { id: 'washer', name: 'Стиральная машина', model: 'washer', category: 'Техника', w: 0.6, d: 0.6, h: 0.85, price: 21000, colorRole: 'white', rooms: ['bathroom', 'laundry'] },

  // Прихожая / прочее
  { id: 'shoe-cabinet', name: 'Обувница с сиденьем', model: 'shoeCabinet', category: 'Системы хранения', w: 1.0, d: 0.38, h: 0.5, price: 7600, colorRole: 'wood', rooms: ['hall'] },
  { id: 'bench', name: 'Скамья', model: 'bench', category: 'Мягкая мебель', w: 1.2, d: 0.4, h: 0.45, price: 6400, colorRole: 'fabric', rooms: ['hall', 'balcony', 'bedroom'] },
];

export const furnitureById = (id: string) => FURNITURE.find((f) => f.id === id);

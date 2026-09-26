import type { RoomType } from '../types';

export interface RoomTypeInfo {
  label: string;
  /** Нормативная освещённость, лк (ориентир по ДБН В.2.5-28 / СП 52.13330) */
  lux: number;
  planColor: string;
  wet: boolean;
}

export const ROOM_TYPES: Record<RoomType, RoomTypeInfo> = {
  living: { label: 'Гостиная', lux: 150, planColor: '#f3e7d3', wet: false },
  kitchen: { label: 'Кухня', lux: 250, planColor: '#e8f0dc', wet: true },
  dining: { label: 'Столовая', lux: 200, planColor: '#f1ead9', wet: false },
  bedroom: { label: 'Спальня', lux: 120, planColor: '#e4e8f3', wet: false },
  kids: { label: 'Детская', lux: 200, planColor: '#f6e2e6', wet: false },
  office: { label: 'Кабинет', lux: 300, planColor: '#e7e2f2', wet: false },
  bathroom: { label: 'Ванная', lux: 200, planColor: '#dcecf2', wet: true },
  wc: { label: 'Санузел', lux: 150, planColor: '#d9e8ee', wet: true },
  hall: { label: 'Прихожая / холл', lux: 100, planColor: '#ece8e1', wet: false },
  wardrobe: { label: 'Гардеробная', lux: 150, planColor: '#ebe4dc', wet: false },
  laundry: { label: 'Постирочная', lux: 150, planColor: '#dfe9ea', wet: true },
  balcony: { label: 'Балкон / терраса', lux: 50, planColor: '#e6efe6', wet: false },
};

export const ROOM_TYPE_LIST = Object.keys(ROOM_TYPES) as RoomType[];

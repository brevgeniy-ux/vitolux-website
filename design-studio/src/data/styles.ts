import type { Project, Room, RoomType, StyleId } from '../types';

export interface StyleDef {
  id: StyleId;
  name: string;
  description: string;
  /** Цвет стен по умолчанию и по типам помещений */
  walls: string;
  wallsByRoom: Partial<Record<RoomType, string>>;
  floor: string;
  floorByRoom: Partial<Record<RoomType, string>>;
  /** Палитра мебели: корпус, текстиль, акцент, металл */
  wood: string;
  fabric: string;
  accent: string;
  metal: string;
  ceiling: string;
  /** Цветовая температура света, K */
  cct: number;
  palette: string[];
}

export const STYLES: Record<StyleId, StyleDef> = {
  scandi: {
    id: 'scandi',
    name: 'Скандинавский',
    description: 'Светлые стены, натуральное дерево, текстиль и много рассеянного света. Функционально и уютно.',
    walls: '#f2f0eb',
    wallsByRoom: { bedroom: '#e3e6e1', kids: '#efe6dc' },
    floor: 'oak-light',
    floorByRoom: { bathroom: 'porcelain-white', wc: 'porcelain-white', kitchen: 'oak-light', hall: 'porcelain-grey', laundry: 'porcelain-white', balcony: 'deck' },
    wood: '#d8bf98',
    fabric: '#cfcac1',
    accent: '#7a9a8a',
    metal: '#2b2b2b',
    ceiling: '#fafafa',
    cct: 3000,
    palette: ['#f2f0eb', '#d8bf98', '#cfcac1', '#7a9a8a', '#2b2b2b'],
  },
  minimal: {
    id: 'minimal',
    name: 'Минимализм',
    description: 'Чистые плоскости, скрытое хранение, монохромная палитра и архитектурный свет без лишних деталей.',
    walls: '#f4f4f2',
    wallsByRoom: {},
    floor: 'porcelain-white',
    floorByRoom: { bedroom: 'oak-light', living: 'oak-light', office: 'oak-light', balcony: 'porcelain-grey' },
    wood: '#e9e6e0',
    fabric: '#bdbab4',
    accent: '#1e1e1e',
    metal: '#9a9a9a',
    ceiling: '#ffffff',
    cct: 3500,
    palette: ['#ffffff', '#f4f4f2', '#bdbab4', '#9a9a9a', '#1e1e1e'],
  },
  loft: {
    id: 'loft',
    name: 'Лофт',
    description: 'Бетон, тёмный металл, кирпич и открытые коммуникации. Трековый свет и акцентные подвесы.',
    walls: '#b9b4ac',
    wallsByRoom: { living: '#9d6b52', bedroom: '#8e8a84' },
    floor: 'microcement',
    floorByRoom: { bedroom: 'walnut', living: 'walnut', office: 'walnut', balcony: 'deck' },
    wood: '#6e4a31',
    fabric: '#5b5a55',
    accent: '#b4572e',
    metal: '#1c1c1c',
    ceiling: '#6d6a66',
    cct: 2700,
    palette: ['#b9b4ac', '#9d6b52', '#6e4a31', '#b4572e', '#1c1c1c'],
  },
  neoclassic: {
    id: 'neoclassic',
    name: 'Неоклассика',
    description: 'Симметрия, молдинги, мрамор и паркет «ёлочка». Благородные оттенки и латунь.',
    walls: '#ece4d8',
    wallsByRoom: { bedroom: '#dfe3e6', office: '#c9d1c7' },
    floor: 'oak-natural',
    floorByRoom: { bathroom: 'marble', wc: 'marble', hall: 'marble', kitchen: 'marble', laundry: 'porcelain-white', balcony: 'terrazzo' },
    wood: '#f1ece3',
    fabric: '#b7a790',
    accent: '#3f5a63',
    metal: '#b8964f',
    ceiling: '#fbf8f2',
    cct: 3000,
    palette: ['#ece4d8', '#f1ece3', '#b7a790', '#3f5a63', '#b8964f'],
  },
  japandi: {
    id: 'japandi',
    name: 'Джапанди',
    description: 'Японская сдержанность и скандинавский уют: низкая мебель, тёплое дерево, глина и лён.',
    walls: '#e7e1d6',
    wallsByRoom: { bedroom: '#ddd4c6' },
    floor: 'oak-natural',
    floorByRoom: { bathroom: 'microcement', wc: 'microcement', hall: 'terrazzo', laundry: 'microcement', balcony: 'deck' },
    wood: '#a47b53',
    fabric: '#d7cdbd',
    accent: '#58634b',
    metal: '#3a3631',
    ceiling: '#f5f1ea',
    cct: 2700,
    palette: ['#e7e1d6', '#d7cdbd', '#a47b53', '#58634b', '#3a3631'],
  },
  modern: {
    id: 'modern',
    name: 'Современный',
    description: 'Контрастные акценты, орех и графит, комбинированный сценарный свет и умные системы.',
    walls: '#e6e3de',
    wallsByRoom: { living: '#d4d0ca', bedroom: '#4c5358' },
    floor: 'walnut',
    floorByRoom: { bathroom: 'porcelain-grey', wc: 'porcelain-grey', kitchen: 'porcelain-grey', hall: 'porcelain-grey', laundry: 'porcelain-grey', balcony: 'deck' },
    wood: '#6b4a34',
    fabric: '#8d8d8a',
    accent: '#c08a3e',
    metal: '#2e3236',
    ceiling: '#f7f7f7',
    cct: 3000,
    palette: ['#e6e3de', '#8d8d8a', '#6b4a34', '#c08a3e', '#2e3236'],
  },
};

export const STYLE_LIST = Object.values(STYLES);

export function wallColorFor(style: StyleId, type: RoomType, override?: string) {
  const s = STYLES[style];
  return override ?? s.wallsByRoom[type] ?? s.walls;
}

export function floorIdFor(style: StyleId, type: RoomType, override?: string) {
  const s = STYLES[style];
  return override ?? s.floorByRoom[type] ?? s.floor;
}

/** Стиль проекта с учётом собственной палитры */
export function styleOf(project: Pick<Project, 'style' | 'custom'>): StyleDef {
  const base = STYLES[project.style];
  const c = project.custom;
  if (!c) return base;
  const merged: StyleDef = {
    ...base,
    name: c.name || base.name,
    walls: c.walls ?? base.walls,
    wallsByRoom: c.walls ? {} : base.wallsByRoom,
    floor: c.floor ?? base.floor,
    wood: c.wood ?? base.wood,
    fabric: c.fabric ?? base.fabric,
    accent: c.accent ?? base.accent,
    metal: c.metal ?? base.metal,
    ceiling: c.ceiling ?? base.ceiling,
    cct: c.cct ?? base.cct,
  };
  merged.palette = [merged.walls, merged.wood, merged.fabric, merged.accent, merged.metal];
  return merged;
}

export function wallColorOf(project: Pick<Project, 'style' | 'custom'>, room: Pick<Room, 'type' | 'wallColor'>) {
  const s = styleOf(project);
  return room.wallColor ?? s.wallsByRoom[room.type] ?? s.walls;
}

export function floorIdOf(project: Pick<Project, 'style' | 'custom'>, room: Pick<Room, 'type' | 'floorId'>) {
  const s = styleOf(project);
  return room.floorId ?? s.floorByRoom[room.type] ?? s.floor;
}

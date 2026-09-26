// Все размеры — в метрах. Ось X — вправо, ось Y плана — вниз (в 3D это ось Z).

export type ProjectKind = 'apartment' | 'house';

export type RoomType =
  | 'living'
  | 'kitchen'
  | 'bedroom'
  | 'kids'
  | 'office'
  | 'bathroom'
  | 'wc'
  | 'hall'
  | 'dining'
  | 'wardrobe'
  | 'laundry'
  | 'balcony';

export type WallSide = 'n' | 's' | 'e' | 'w';

export type StyleId =
  | 'scandi'
  | 'minimal'
  | 'loft'
  | 'neoclassic'
  | 'japandi'
  | 'modern';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  level: number;
  x: number;
  y: number;
  w: number;
  d: number;
  /** Переопределения отделки (иначе берутся из стиля) */
  wallColor?: string;
  floorId?: string;
}

export interface Opening {
  id: string;
  roomId: string;
  wall: WallSide;
  kind: 'door' | 'window';
  /** Смещение от начала стены (левый/верхний угол), м */
  offset: number;
  width: number;
  height: number;
  sill: number;
}

export interface FurnitureItem {
  id: string;
  catalogId: string;
  level: number;
  x: number;
  y: number;
  /** Поворот в градусах, по часовой на плане */
  rotation: number;
  color?: string;
}

export interface LightItem {
  id: string;
  catalogId: string;
  level: number;
  x: number;
  y: number;
  rotation: number;
}

export interface Render {
  id: string;
  title: string;
  dataUrl: string;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  address: string;
  kind: ProjectKind;
  style: StyleId;
  ceilingHeight: number;
  levels: number;
  notes: string;
  concept: string;
  rooms: Room[];
  openings: Opening[];
  furniture: FurnitureItem[];
  lights: LightItem[];
  renders: Render[];
  createdAt: number;
  updatedAt: number;
}

export type Selection =
  | { kind: 'room'; id: string }
  | { kind: 'opening'; id: string }
  | { kind: 'furniture'; id: string }
  | { kind: 'light'; id: string }
  | null;

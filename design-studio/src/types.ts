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
  /** Отделка стен (каталог WALL_FINISHES), по умолчанию — покраска */
  wallFinish?: string;
  /** Акцентная стена с отдельной отделкой */
  accentWall?: { side: WallSide; finish: string; color?: string };
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

/** Загруженное изображение планировки, подложенное под план этажа */
export interface Underlay {
  id: string;
  level: number;
  dataUrl: string;
  /** Размер изображения в пикселях */
  pxW: number;
  pxH: number;
  /** Положение левого верхнего угла изображения на плане, м */
  x: number;
  y: number;
  /** Метров в одном пикселе */
  mPerPx: number;
  opacity: number;
  visible: boolean;
  /** Масштаб задан пользователем или вычислен */
  calibrated?: boolean;
  /** Рамка вокруг самого плана на изображении, px */
  crop?: { x0: number; y0: number; x1: number; y1: number };
  /** Текст исходной страницы (экспликация помещений) */
  text?: string;
  /** Общая площадь по экспликации, м² — для масштаба, если текста нет */
  totalArea?: number;
}

/** Страница материала (PDF-страница или изображение), приведённая к картинке */
export interface MaterialPage {
  dataUrl: string;
  w: number;
  h: number;
  /** Текст страницы (для PDF) — экспликация, подписи */
  text?: string;
}

/** Материал от заказчика или прошлого дизайнера */
export interface Material {
  id: string;
  name: string;
  kind: 'pdf' | 'image' | 'text' | 'reference';
  pages: MaterialPage[];
  /** Извлечённый текст (PDF, текстовые файлы) */
  text: string;
  addedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  /** Приложенные к сообщению изображения (id материалов-референсов) */
  attachments?: string[];
  /** Что ассистент изменил в проекте */
  actions?: string[];
  /** Предложенные варианты, которые можно создать одним кликом */
  variants?: { name: string; style: StyleId; idea: string }[];
  error?: boolean;
  at: number;
}

export interface CustomDesign {
  name?: string;
  walls?: string;
  wood?: string;
  fabric?: string;
  accent?: string;
  metal?: string;
  ceiling?: string;
  floor?: string;
  cct?: number;
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
  underlays?: Underlay[];
  /** Собственная палитра поверх пресета стиля (например, подобранная ИИ по референсам) */
  custom?: CustomDesign;
  /** Какие исходные данные подтверждены заказчиком или найдены на чертеже */
  facts?: { ceilingHeight?: boolean; residents?: string; budget?: string };
  materials?: Material[];
  chat?: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export type Selection =
  | { kind: 'room'; id: string }
  | { kind: 'opening'; id: string }
  | { kind: 'furniture'; id: string }
  | { kind: 'light'; id: string }
  | null;

import type { Opening, Project, ProjectKind, Room, RoomType, StyleId, WallSide } from '../types';
import { ROOM_TYPES } from '../data/rooms';
import { clamp, isExteriorWall, neighborsOnWall, round2, uid } from './geometry';

export interface ProgramItem {
  type: RoomType;
  name?: string;
  area: number;
  level?: number;
}

export function emptyProject(kind: ProjectKind = 'apartment', style: StyleId = 'scandi'): Project {
  const now = Date.now();
  return {
    id: uid(),
    name: 'Новый проект',
    client: '',
    address: '',
    kind,
    style,
    ceilingHeight: kind === 'house' ? 2.9 : 2.7,
    levels: 1,
    notes: '',
    concept: '',
    rooms: [],
    openings: [],
    furniture: [],
    lights: [],
    renders: [],
    createdAt: now,
    updatedAt: now,
  };
}

// ---------- Шаблоны планировок ----------

type Def = [name: string, type: RoomType, level: number, x: number, y: number, w: number, d: number];
type Op = [roomIdx: number, kind: 'door' | 'window', wall: WallSide, offset: number, width: number];

interface Template {
  id: string;
  name: string;
  kind: ProjectKind;
  description: string;
  rooms: Def[];
  openings: Op[];
}

export const TEMPLATES: Template[] = [
  {
    id: 'apt-1',
    name: '1-комнатная квартира',
    kind: 'apartment',
    description: 'Прихожая, совмещённый санузел, кухня, гостиная-спальня, гардеробная',
    rooms: [
      ['Прихожая', 'hall', 0, 0, 0, 2.2, 3.4],
      ['Ванная', 'bathroom', 0, 0, 3.4, 2.2, 2.6],
      ['Гостиная-спальня', 'living', 0, 2.2, 0, 5.4, 3.6],
      ['Кухня', 'kitchen', 0, 2.2, 3.6, 3.4, 2.8],
      ['Гардеробная', 'wardrobe', 0, 5.6, 3.6, 2.0, 2.8],
    ],
    openings: [
      [0, 'door', 'w', 1.2, 0.9],
      [0, 'door', 'e', 1.4, 0.9],
      [0, 'door', 's', 0.7, 0.7],
      [2, 'window', 'n', 1.6, 1.8],
      [2, 'door', 's', 1.0, 0.9],
      [2, 'door', 's', 4.0, 0.7],
      [3, 'window', 's', 1.1, 1.4],
    ],
  },
  {
    id: 'apt-2',
    name: '2-комнатная квартира',
    kind: 'apartment',
    description: 'Гостиная, кухня, спальня, детская/кабинет, ванная, прихожая',
    rooms: [
      ['Прихожая', 'hall', 0, 0, 0, 2.4, 4.0],
      ['Ванная', 'bathroom', 0, 0, 4.0, 2.4, 3.0],
      ['Гостиная', 'living', 0, 2.4, 0, 5.2, 4.0],
      ['Кухня', 'kitchen', 0, 7.6, 0, 3.0, 4.0],
      ['Спальня', 'bedroom', 0, 2.4, 4.0, 4.2, 3.4],
      ['Детская', 'kids', 0, 6.6, 4.0, 4.0, 3.4],
    ],
    openings: [
      [0, 'door', 'w', 1.4, 0.9],
      [0, 'door', 'e', 1.3, 0.9],
      [0, 'door', 's', 0.8, 0.7],
      [2, 'window', 'n', 1.7, 1.8],
      [2, 'door', 'e', 1.4, 1.2],
      [3, 'window', 'n', 0.8, 1.4],
      [4, 'door', 'n', 0.5, 0.8],
      [4, 'window', 's', 1.4, 1.5],
      [5, 'door', 'n', 0.1, 0.8],
      [5, 'window', 's', 1.3, 1.5],
    ],
  },
  {
    id: 'apt-3',
    name: '3-комнатная квартира',
    kind: 'apartment',
    description: 'Гостиная, кухня, 2 спальни, кабинет, ванная, гостевой санузел, коридор',
    rooms: [
      ['Гостиная', 'living', 0, 0, 0, 5.2, 4.2],
      ['Кухня-столовая', 'kitchen', 0, 5.2, 0, 3.6, 4.2],
      ['Детская', 'kids', 0, 8.8, 0, 3.4, 4.2],
      ['Коридор', 'hall', 0, 0, 4.2, 12.2, 1.5],
      ['Ванная', 'bathroom', 0, 0, 5.7, 2.4, 3.4],
      ['Санузел', 'wc', 0, 2.4, 5.7, 1.6, 3.4],
      ['Спальня', 'bedroom', 0, 4.0, 5.7, 4.4, 3.4],
      ['Кабинет', 'office', 0, 8.4, 5.7, 3.8, 3.4],
    ],
    openings: [
      [3, 'door', 'w', 0.3, 0.9],
      [3, 'door', 'n', 2.0, 1.2],
      [3, 'door', 'n', 6.2, 0.9],
      [3, 'door', 'n', 9.6, 0.8],
      [3, 'door', 's', 0.8, 0.7],
      [3, 'door', 's', 2.8, 0.7],
      [3, 'door', 's', 5.0, 0.8],
      [3, 'door', 's', 9.0, 0.8],
      [0, 'window', 'n', 1.6, 2.0],
      [1, 'window', 'n', 1.0, 1.5],
      [2, 'window', 'n', 1.0, 1.4],
      [6, 'window', 's', 1.4, 1.6],
      [7, 'window', 's', 1.2, 1.4],
    ],
  },
  {
    id: 'house-2',
    name: 'Дом в 2 этажа',
    kind: 'house',
    description: '1 эт.: гостиная, кухня, холл, санузел, постирочная, кабинет. 2 эт.: 3 спальни, ванная, гардеробная',
    rooms: [
      ['Гостиная', 'living', 0, 0, 0, 6.0, 5.0],
      ['Кухня-столовая', 'kitchen', 0, 6.0, 0, 4.4, 5.0],
      ['Холл', 'hall', 0, 0, 5.0, 3.4, 3.4],
      ['Санузел', 'wc', 0, 3.4, 5.0, 1.8, 3.4],
      ['Постирочная', 'laundry', 0, 5.2, 5.0, 1.8, 3.4],
      ['Кабинет', 'office', 0, 7.0, 5.0, 3.4, 3.4],
      ['Спальня', 'bedroom', 1, 0, 0, 4.4, 4.6],
      ['Ванная', 'bathroom', 1, 4.4, 0, 2.6, 4.6],
      ['Детская', 'kids', 1, 7.0, 0, 3.4, 4.6],
      ['Холл 2 эт.', 'hall', 1, 0, 4.6, 10.4, 1.4],
      ['Гостевая спальня', 'bedroom', 1, 0, 6.0, 4.2, 2.4],
      ['Гардеробная', 'wardrobe', 1, 4.2, 6.0, 2.4, 2.4],
      ['Детская 2', 'kids', 1, 6.6, 6.0, 3.8, 2.4],
    ],
    openings: [
      [2, 'door', 's', 1.0, 1.0],
      [2, 'door', 'n', 1.2, 1.4],
      [2, 'door', 'e', 1.2, 0.7],
      [0, 'door', 'e', 1.6, 1.6],
      [0, 'window', 'n', 1.0, 2.4],
      [0, 'window', 'w', 1.2, 2.0],
      [1, 'window', 'n', 1.4, 1.6],
      [1, 'window', 'e', 1.6, 1.4],
      [4, 'door', 'n', 0.5, 0.8],
      [5, 'door', 'n', 0.6, 0.8],
      [5, 'window', 's', 1.2, 1.4],
      [5, 'window', 'e', 1.0, 1.2],
      [9, 'door', 'n', 1.6, 0.9],
      [9, 'door', 'n', 4.7, 0.8],
      [9, 'door', 'n', 8.0, 0.8],
      [9, 'door', 's', 1.6, 0.8],
      [9, 'door', 's', 4.9, 0.8],
      [9, 'door', 's', 7.8, 0.8],
      [6, 'window', 'n', 1.4, 1.8],
      [6, 'window', 'w', 1.6, 1.2],
      [7, 'window', 'n', 0.9, 0.8],
      [8, 'window', 'n', 1.0, 1.4],
      [10, 'window', 's', 1.4, 1.4],
      [12, 'window', 's', 1.2, 1.4],
    ],
  },
];

function openingDefaults(kind: 'door' | 'window', wall: WallSide, roomId: string, offset: number, width: number): Opening {
  return kind === 'door'
    ? { id: uid(), roomId, wall, kind, offset, width, height: 2.1, sill: 0 }
    : { id: uid(), roomId, wall, kind, offset, width, height: 1.5, sill: 0.8 };
}

export function projectFromTemplate(tplId: string, style: StyleId): Project {
  const tpl = TEMPLATES.find((t) => t.id === tplId) ?? TEMPLATES[0];
  const p = emptyProject(tpl.kind, style);
  p.name = tpl.name;
  p.rooms = tpl.rooms.map(([name, type, level, x, y, w, d]) => ({ id: uid(), name, type, level, x, y, w, d }));
  p.openings = tpl.openings.map(([ri, kind, wall, offset, width]) => openingDefaults(kind, wall, p.rooms[ri].id, offset, width));
  p.levels = Math.max(...p.rooms.map((r) => r.level)) + 1;
  return p;
}

// ---------- Генератор планировки по программе помещений ----------

const UPPER_TYPES: RoomType[] = ['bedroom', 'kids', 'bathroom', 'wardrobe'];
const NO_WINDOW: RoomType[] = ['wc', 'wardrobe', 'laundry', 'hall'];

/**
 * Раскладывает помещения на каждом уровне в два ряда вдоль центрального коридора.
 * Результат — прямоугольная, технически корректная планировка, которую затем можно править вручную.
 */
export function generateLayout(program: ProgramItem[], kind: ProjectKind): { rooms: Room[]; openings: Opening[] } {
  const items = program.filter((p) => p.type !== 'hall' && p.area > 0);
  const hallItems = program.filter((p) => p.type === 'hall');
  const twoLevels = kind === 'house' && (items.some((i) => (i.level ?? 0) > 0) || items.length > 6);

  const byLevel = new Map<number, ProgramItem[]>();
  for (const it of items) {
    const lvl = it.level ?? (twoLevels && UPPER_TYPES.includes(it.type) ? 1 : 0);
    if (!byLevel.has(lvl)) byLevel.set(lvl, []);
    byLevel.get(lvl)!.push(it);
  }
  const levels = [...byLevel.keys()].sort();

  const rooms: Room[] = [];
  const openings: Opening[] = [];
  // Ширина дома одинакова на всех уровнях — считаем по самому «тяжёлому» уровню
  const widths = levels.map((l) => {
    const total = byLevel.get(l)!.reduce((s, i) => s + i.area, 0);
    return Math.sqrt(total * 1.5);
  });
  const W = round2(clamp(Math.max(...widths), 6, 24));

  for (const level of levels) {
    const list = [...byLevel.get(level)!].sort((a, b) => b.area - a.area);
    const top: ProgramItem[] = [];
    const bottom: ProgramItem[] = [];
    let sTop = 0;
    let sBot = 0;
    for (const it of list) {
      // гостиная и кухня — на «фасадный» ряд
      const prefersTop = it.type === 'living' || it.type === 'kitchen';
      if ((prefersTop && sTop <= sBot + it.area) || (!prefersTop && sTop < sBot)) {
        top.push(it);
        sTop += it.area;
      } else {
        bottom.push(it);
        sBot += it.area;
      }
    }
    const corridorD = 1.5;
    const rowD = (s: number) => round2(clamp(s / W, 2.4, 6.5));
    const dTop = rowD(sTop);
    const dBot = bottom.length ? rowD(sBot) : 0;

    const placeRow = (row: ProgramItem[], y: number, d: number, side: 'top' | 'bottom') => {
      const total = row.reduce((s, i) => s + i.area, 0) || 1;
      // ширины пропорционально площади, но не уже 1,5 м; излишек забираем у широких помещений
      const MIN_W = 1.5;
      const widths = row.map((it) => Math.max(MIN_W, (it.area / total) * W));
      let excess = widths.reduce((s, w) => s + w, 0) - W;
      for (let guard = 0; excess > 1e-6 && guard < 10; guard++) {
        const flex = widths.map((w) => Math.max(0, w - MIN_W));
        const pool = flex.reduce((s, f) => s + f, 0);
        if (pool <= 0) break;
        const take = Math.min(excess, pool);
        widths.forEach((_, i) => (widths[i] -= (flex[i] / pool) * take));
        excess -= take;
      }
      let x = 0;
      row.forEach((it, idx) => {
        const w = idx === row.length - 1 ? round2(W - x) : Math.round(widths[idx] * 20) / 20;
        const room: Room = {
          id: uid(),
          name: it.name || ROOM_TYPES[it.type].label,
          type: it.type,
          level,
          x: round2(x),
          y,
          w,
          d,
        };
        rooms.push(room);
        // дверь в коридор
        const doorW = it.type === 'living' || it.type === 'kitchen' ? 1.0 : it.type === 'wc' || it.type === 'bathroom' ? 0.7 : 0.8;
        const doorWall: WallSide = side === 'top' ? 's' : 'n';
        openings.push(openingDefaults('door', doorWall, room.id, round2(clamp(0.3, 0.15, Math.max(0.15, room.w - doorW - 0.15))), doorW));
        // окно на наружной стене
        if (!NO_WINDOW.includes(it.type)) {
          const winWall: WallSide = side === 'top' ? 'n' : 's';
          const ww = it.type === 'bathroom' ? 0.8 : round2(clamp(room.w * 0.45, 0.9, 2.4));
          const win = openingDefaults('window', winWall, room.id, round2((room.w - ww) / 2), ww);
          if (it.type === 'bathroom') {
            win.sill = 1.4;
            win.height = 0.7;
          }
          openings.push(win);
        }
        x += w;
      });
    };

    placeRow(top, 0, dTop, 'top');
    const hallName = hallItems.find((h) => (h.level ?? 0) === level)?.name ?? (level === 0 ? 'Прихожая-коридор' : `Холл ${level + 1} эт.`);
    const corridor: Room = { id: uid(), name: hallName, type: 'hall', level, x: 0, y: dTop, w: W, d: corridorD };
    rooms.push(corridor);
    if (level === 0) openings.push(openingDefaults('door', 'w', corridor.id, 0.3, 0.9));
    if (bottom.length) placeRow(bottom, round2(dTop + corridorD), dBot, 'bottom');
  }

  // дверь у помещения должна выходить в коридор: сдвигаем, если попала на стык
  const proj = { rooms, openings } as unknown as Project;
  for (const o of openings) {
    const r = rooms.find((rr) => rr.id === o.roomId)!;
    if (o.kind !== 'door' || r.type === 'hall') continue;
    const n = neighborsOnWall(proj, r, o.wall).find((nb) => nb.room.type === 'hall');
    if (!n) continue;
    const base = o.wall === 'n' || o.wall === 's' ? r.x : r.y;
    o.offset = round2(clamp(n.a - base + 0.2, 0.1, r.w - o.width - 0.1));
  }
  // убираем окна, попавшие на внутренние стены
  const cleaned = openings.filter((o) => {
    if (o.kind !== 'window') return true;
    const r = rooms.find((rr) => rr.id === o.roomId)!;
    return isExteriorWall(proj, r, o.wall);
  });
  return { rooms, openings: cleaned };
}

export function projectFromProgram(program: ProgramItem[], kind: ProjectKind, style: StyleId, name = 'Новый проект'): Project {
  const p = emptyProject(kind, style);
  p.name = name;
  const { rooms, openings } = generateLayout(program, kind);
  p.rooms = rooms;
  p.openings = openings;
  p.levels = Math.max(0, ...rooms.map((r) => r.level)) + 1;
  return p;
}

export const DEFAULT_PROGRAM: ProgramItem[] = [
  { type: 'living', area: 22 },
  { type: 'kitchen', area: 12 },
  { type: 'bedroom', area: 14 },
  { type: 'kids', area: 11 },
  { type: 'bathroom', area: 5 },
  { type: 'wc', area: 2.5 },
];

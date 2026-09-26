import type { Opening, Project, Room, WallSide } from '../types';

/** Толщина стены, уходящая внутрь каждого помещения, м */
export const WALL_T = 0.1;
export const EPS = 0.02;

export const uid = () => Math.random().toString(36).slice(2, 10);
export const round2 = (v: number) => Math.round(v * 100) / 100;
export const snap = (v: number, step = 0.05) => Math.round(v / step) * step;
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export interface WallLine {
  side: WallSide;
  axis: 'h' | 'v';
  /** координата линии стены (y для горизонтальной, x для вертикальной) */
  line: number;
  a: number;
  b: number;
}

export function wallLine(room: Room, side: WallSide): WallLine {
  switch (side) {
    case 'n':
      return { side, axis: 'h', line: room.y, a: room.x, b: room.x + room.w };
    case 's':
      return { side, axis: 'h', line: room.y + room.d, a: room.x, b: room.x + room.w };
    case 'w':
      return { side, axis: 'v', line: room.x, a: room.y, b: room.y + room.d };
    case 'e':
      return { side, axis: 'v', line: room.x + room.w, a: room.y, b: room.y + room.d };
  }
}

export const wallLength = (room: Room, side: WallSide) => (side === 'n' || side === 's' ? room.w : room.d);

export interface OpeningWorld {
  opening: Opening;
  axis: 'h' | 'v';
  line: number;
  a: number;
  b: number;
}

export function openingWorld(o: Opening, room: Room): OpeningWorld {
  const wl = wallLine(room, o.wall);
  return { opening: o, axis: wl.axis, line: wl.line, a: wl.a + o.offset, b: wl.a + o.offset + o.width };
}

export interface WallGap {
  start: number;
  end: number;
  sill: number;
  top: number;
  kind: 'door' | 'window';
  openingId: string;
  own: boolean;
}

/** Все проёмы, которые прорезают данную стену помещения (включая проёмы соседних помещений на общей стене). */
export function wallGaps(project: Project, room: Room, side: WallSide): WallGap[] {
  const wl = wallLine(room, side);
  const gaps: WallGap[] = [];
  for (const o of project.openings) {
    const r = project.rooms.find((rr) => rr.id === o.roomId);
    if (!r || r.level !== room.level) continue;
    const ow = openingWorld(o, r);
    if (ow.axis !== wl.axis || Math.abs(ow.line - wl.line) > EPS) continue;
    const s = Math.max(ow.a, wl.a);
    const e = Math.min(ow.b, wl.b);
    if (e - s < 0.05) continue;
    gaps.push({
      start: s - wl.a,
      end: e - wl.a,
      sill: o.kind === 'door' ? 0 : o.sill,
      top: (o.kind === 'door' ? 0 : o.sill) + o.height,
      kind: o.kind,
      openingId: o.id,
      own: r.id === room.id,
    });
  }
  return gaps.sort((x, y) => x.start - y.start);
}

/** Является ли стена наружной (не граничит ни с одним помещением того же уровня) */
export function isExteriorWall(project: Project, room: Room, side: WallSide): boolean {
  const wl = wallLine(room, side);
  let covered = 0;
  for (const r of project.rooms) {
    if (r.id === room.id || r.level !== room.level) continue;
    for (const s of ['n', 's', 'e', 'w'] as WallSide[]) {
      const ol = wallLine(r, s);
      if (ol.axis !== wl.axis || Math.abs(ol.line - wl.line) > EPS) continue;
      covered += Math.max(0, Math.min(ol.b, wl.b) - Math.max(ol.a, wl.a));
    }
  }
  return covered < (wl.b - wl.a) * 0.5;
}

/** Соседние помещения, с которыми у стены есть общий участок */
export function neighborsOnWall(project: Project, room: Room, side: WallSide) {
  const wl = wallLine(room, side);
  const res: { room: Room; side: WallSide; a: number; b: number }[] = [];
  for (const r of project.rooms) {
    if (r.id === room.id || r.level !== room.level) continue;
    for (const s of ['n', 's', 'e', 'w'] as WallSide[]) {
      const ol = wallLine(r, s);
      if (ol.axis !== wl.axis || Math.abs(ol.line - wl.line) > EPS) continue;
      const a = Math.max(ol.a, wl.a);
      const b = Math.min(ol.b, wl.b);
      if (b - a > 0.3) res.push({ room: r, side: s, a, b });
    }
  }
  return res;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const rectsOverlap = (a: Rect, b: Rect, pad = 0) =>
  a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

/** Осевой прямоугольник предмета на плане с учётом поворота (кратного 90°) */
export function itemRect(x: number, y: number, w: number, d: number, rotation: number): Rect {
  const r = ((Math.round(rotation / 90) % 4) + 4) % 4;
  const [ww, dd] = r % 2 === 0 ? [w, d] : [d, w];
  return { x: x - ww / 2, y: y - dd / 2, w: ww, h: dd };
}

/** Направление «вперёд» предмета на плане (локальная ось +Y) */
export function frontDir(rotation: number) {
  const t = (rotation * Math.PI) / 180;
  return { x: -Math.sin(t), y: Math.cos(t) };
}

export const roomArea = (r: Room) => Math.max(0, r.w - 2 * WALL_T) * Math.max(0, r.d - 2 * WALL_T);
export const roomPerimeter = (r: Room) => 2 * (Math.max(0, r.w - 2 * WALL_T) + Math.max(0, r.d - 2 * WALL_T));

export function roomAt(project: Project, level: number, x: number, y: number) {
  // последнее помещение сверху
  for (let i = project.rooms.length - 1; i >= 0; i--) {
    const r = project.rooms[i];
    if (r.level === level && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.d) return r;
  }
  return undefined;
}

export function levelBounds(project: Project, level?: number) {
  const rooms = project.rooms.filter((r) => level === undefined || r.level === level);
  if (!rooms.length) return { x: 0, y: 0, w: 10, h: 8 };
  const x0 = Math.min(...rooms.map((r) => r.x));
  const y0 = Math.min(...rooms.map((r) => r.y));
  const x1 = Math.max(...rooms.map((r) => r.x + r.w));
  const y1 = Math.max(...rooms.map((r) => r.y + r.d));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** Ближайшая стена помещения к точке */
export function nearestWall(room: Room, x: number, y: number): { side: WallSide; t: number; dist: number } {
  const cands: { side: WallSide; t: number; dist: number }[] = [
    { side: 'n', t: x - room.x, dist: Math.abs(y - room.y) },
    { side: 's', t: x - room.x, dist: Math.abs(y - (room.y + room.d)) },
    { side: 'w', t: y - room.y, dist: Math.abs(x - room.x) },
    { side: 'e', t: y - room.y, dist: Math.abs(x - (room.x + room.w)) },
  ];
  return cands.sort((a, b) => a.dist - b.dist)[0];
}

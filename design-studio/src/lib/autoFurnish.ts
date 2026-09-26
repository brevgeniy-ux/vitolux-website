import type { FurnitureItem, Project, Room, WallSide } from '../types';
import { furnitureById, type FurnitureDef } from '../data/furniture';
import { WALL_T, frontDir, itemRect, rectsOverlap, roomArea, round2, uid, wallGaps, wallLength, type Rect } from './geometry';

const SIDES: WallSide[] = ['n', 'e', 's', 'w'];
const ROT: Record<WallSide, number> = { n: 0, e: 90, s: 180, w: 270 };
const OPPOSITE: Record<WallSide, WallSide> = { n: 's', s: 'n', e: 'w', w: 'e' };

interface Ctx {
  project: Project;
  room: Room;
  occupied: Rect[];
  blocked: Rect[];
  items: FurnitureItem[];
}

interface Placed {
  item: FurnitureItem;
  def: FurnitureDef;
  side?: WallSide;
  rect: Rect;
}

/** Зоны перед дверями и «запрет» высоких предметов у окон */
function buildBlocked(project: Project, room: Room) {
  const doorZones: Rect[] = [];
  const windowBands: { side: WallSide; start: number; end: number; sill: number }[] = [];
  for (const side of SIDES) {
    for (const g of wallGaps(project, room, side)) {
      if (g.kind === 'window') {
        windowBands.push({ side, start: g.start - 0.1, end: g.end + 0.1, sill: g.sill });
        continue;
      }
      const depth = Math.max(0.9, g.end - g.start + 0.1);
      const s = g.start - 0.15;
      const len = g.end - g.start + 0.3;
      if (side === 'n') doorZones.push({ x: room.x + s, y: room.y, w: len, h: depth });
      if (side === 's') doorZones.push({ x: room.x + s, y: room.y + room.d - depth, w: len, h: depth });
      if (side === 'w') doorZones.push({ x: room.x, y: room.y + s, w: depth, h: len });
      if (side === 'e') doorZones.push({ x: room.x + room.w - depth, y: room.y + s, w: depth, h: len });
    }
  }
  return { doorZones, windowBands };
}

function inside(room: Room, r: Rect) {
  const e = 0.03;
  return r.x >= room.x + WALL_T - e && r.y >= room.y + WALL_T - e && r.x + r.w <= room.x + room.w - WALL_T + e && r.y + r.h <= room.y + room.d - WALL_T + e;
}

function makeItem(ctx: Ctx, def: FurnitureDef, x: number, y: number, rotation: number): FurnitureItem {
  return { id: uid(), catalogId: def.id, level: ctx.room.level, x: round2(x), y: round2(y), rotation };
}

function fits(ctx: Ctx, rect: Rect, ignoreCollisions = false) {
  if (!inside(ctx.room, rect)) return false;
  if (ctx.blocked.some((b) => rectsOverlap(rect, b))) return false;
  if (!ignoreCollisions && ctx.occupied.some((o) => rectsOverlap(rect, o, 0.02))) return false;
  return true;
}

/** Поставить предмет спинкой к стене */
function placeAgainstWall(
  ctx: Ctx,
  windows: ReturnType<typeof buildBlocked>['windowBands'],
  defId: string,
  opts: { sides?: WallSide[]; align?: 'center' | 'start' | 'end' | 'corner'; allowWindow?: boolean } = {},
): Placed | null {
  const def = furnitureById(defId);
  if (!def) return null;
  const { room } = ctx;
  const sides = opts.sides ?? [...SIDES].sort((a, b) => wallLength(room, b) - wallLength(room, a));
  for (const side of sides) {
    const L = wallLength(room, side) - 2 * WALL_T;
    if (L < def.w) continue;
    const cands: number[] = [];
    for (let t = 0; t <= L - def.w + 1e-6; t += 0.05) cands.push(t);
    const mid = (L - def.w) / 2;
    const score = (t: number) => {
      switch (opts.align) {
        case 'start':
          return t;
        case 'end':
          return L - def.w - t;
        case 'corner':
          return Math.min(t, L - def.w - t);
        default:
          return Math.abs(t - mid);
      }
    };
    cands.sort((a, b) => score(a) - score(b));
    for (const t of cands) {
      // проверка окон: высокие предметы не перекрывают окна
      const tWall = t + WALL_T;
      if (!opts.allowWindow || def.h > 1.0) {
        const hit = windows.some((wb) => wb.side === side && tWall < wb.end && tWall + def.w > wb.start && def.h > wb.sill - 0.05);
        if (hit) continue;
      }
      const rot = ROT[side];
      let cx = 0;
      let cy = 0;
      if (side === 'n') [cx, cy] = [room.x + tWall + def.w / 2, room.y + WALL_T + def.d / 2];
      if (side === 's') [cx, cy] = [room.x + room.w - tWall - def.w / 2, room.y + room.d - WALL_T - def.d / 2];
      if (side === 'w') [cx, cy] = [room.x + WALL_T + def.d / 2, room.y + room.d - tWall - def.w / 2];
      if (side === 'e') [cx, cy] = [room.x + room.w - WALL_T - def.d / 2, room.y + tWall + def.w / 2];
      const rect = itemRect(cx, cy, def.w, def.d, rot);
      if (!fits(ctx, rect)) continue;
      const item = makeItem(ctx, def, cx, cy, rot);
      commit(ctx, item, def, rect);
      return { item, def, side, rect };
    }
  }
  return null;
}

function commit(ctx: Ctx, item: FurnitureItem, def: FurnitureDef, rect: Rect, collide = true) {
  ctx.items.push(item);
  if (collide) ctx.occupied.push(rect);
  void def;
}

/** Поставить предмет относительно другого (перед ним / рядом) */
function placeRelative(ctx: Ctx, defId: string, anchor: Placed, mode: 'front' | 'left' | 'right', gap: number, rotation?: number, collide = true): Placed | null {
  const def = furnitureById(defId);
  if (!def) return null;
  const f = frontDir(anchor.item.rotation);
  const side = { x: -f.y, y: f.x }; // «вправо» от предмета, если смотреть ему в лицо — зеркально
  let cx = anchor.item.x;
  let cy = anchor.item.y;
  const rot = rotation ?? anchor.item.rotation;
  if (mode === 'front') {
    const dist = anchor.def.d / 2 + gap + def.d / 2;
    cx += f.x * dist;
    cy += f.y * dist;
  } else {
    const s = mode === 'left' ? -1 : 1;
    const dist = anchor.def.w / 2 + gap + def.w / 2;
    cx += side.x * dist * s;
    cy += side.y * dist * s;
    // выравниваем по задней стенке
    const back = anchor.def.d / 2 - def.d / 2;
    cx -= f.x * back;
    cy -= f.y * back;
  }
  const rect = itemRect(cx, cy, def.w, def.d, rot);
  if (!fits(ctx, rect, !collide)) return null;
  const item = makeItem(ctx, def, cx, cy, rot);
  commit(ctx, item, def, rect, collide);
  return { item, def, rect };
}

/** Свободное место ближе к центру комнаты (для обеденного стола, острова) */
function placeCenter(ctx: Ctx, defId: string, clearance: number, prefer?: { x: number; y: number }): Placed | null {
  const def = furnitureById(defId);
  if (!def) return null;
  const { room } = ctx;
  const rot = room.w >= room.d ? 0 : 90;
  const target = prefer ?? { x: room.x + room.w / 2, y: room.y + room.d / 2 };
  let best: { x: number; y: number; r: number; dist: number } | null = null;
  for (const r of [rot, (rot + 90) % 180]) {
    for (let x = room.x; x <= room.x + room.w; x += 0.05) {
      for (let y = room.y; y <= room.y + room.d; y += 0.05) {
        const rect = itemRect(x, y, def.w, def.d, r);
        const padded = { x: rect.x - clearance, y: rect.y - clearance, w: rect.w + 2 * clearance, h: rect.h + 2 * clearance };
        if (!inside(room, padded)) continue;
        if (ctx.blocked.some((b) => rectsOverlap(rect, b))) continue;
        if (ctx.occupied.some((o) => rectsOverlap(padded, o))) continue;
        const dist = Math.hypot(x - target.x, y - target.y) + (r === rot ? 0 : 0.3);
        if (!best || dist < best.dist) best = { x, y, r, dist };
      }
    }
  }
  if (!best) return null;
  const rect = itemRect(best.x, best.y, def.w, def.d, best.r);
  const item = makeItem(ctx, def, best.x, best.y, best.r);
  commit(ctx, item, def, { x: rect.x - clearance / 2, y: rect.y - clearance / 2, w: rect.w + clearance, h: rect.h + clearance });
  return { item, def, rect };
}

function doorSides(project: Project, room: Room) {
  return SIDES.filter((s) => wallGaps(project, room, s).some((g) => g.kind === 'door'));
}

function windowSides(project: Project, room: Room) {
  return SIDES.filter((s) => wallGaps(project, room, s).some((g) => g.kind === 'window'));
}

export function furnishRoom(project: Project, room: Room): FurnitureItem[] {
  const { doorZones, windowBands } = buildBlocked(project, room);
  const ctx: Ctx = { project, room, occupied: [], blocked: doorZones, items: [] };
  const area = roomArea(room);
  const byLen = [...SIDES].sort((a, b) => wallLength(room, b) - wallLength(room, a));
  const noDoorFirst = [...byLen].sort((a, b) => Number(doorSides(project, room).includes(a)) - Number(doorSides(project, room).includes(b)));
  const wall = (id: string, o: Parameters<typeof placeAgainstWall>[3] = {}) => placeAgainstWall(ctx, windowBands, id, o);

  switch (room.type) {
    case 'living': {
      const sofa = wall(area > 22 ? 'sofa-corner' : 'sofa-3', { sides: noDoorFirst, allowWindow: true }) ?? wall('sofa-3', { allowWindow: true });
      if (sofa?.side) {
        const opp = OPPOSITE[sofa.side];
        wall('tv-unit', { sides: [opp, ...byLen], allowWindow: false });
        const table = placeRelative(ctx, 'coffee-table', sofa, 'front', 0.4);
        if (table) placeRelative(ctx, 'rug-l', table, 'front', -table.def.d / 2 - 1.0, undefined, false);
        placeRelative(ctx, 'armchair', sofa, 'right', 0.3);
      }
      if (area > 16) wall('bookshelf', { align: 'corner' });
      wall('plant', { align: 'corner', allowWindow: true });
      if (area > 26) placeCenter(ctx, 'dining-4', 0.7);
      break;
    }
    case 'kitchen': {
      const k = wall(wallLength(room, byLen[0]) - 0.2 >= 3.6 ? 'kitchen-3' : 'kitchen-2', { sides: noDoorFirst, align: 'corner', allowWindow: false }) ?? wall('kitchen-2', { align: 'corner', allowWindow: true });
      if (k) (placeRelative(ctx, 'fridge', k, 'right', 0.02) ?? placeRelative(ctx, 'fridge', k, 'left', 0.02)) || wall('fridge', { align: 'corner' });
      if (area > 16) placeCenter(ctx, 'island', 0.9);
      placeCenter(ctx, area > 18 ? 'dining-6' : 'dining-4', 0.6);
      break;
    }
    case 'dining':
      placeCenter(ctx, area > 14 ? 'dining-6' : 'dining-4', 0.7);
      wall('plant', { align: 'corner', allowWindow: true });
      break;
    case 'bedroom': {
      const bedId = area > 14 ? 'bed-180' : 'bed-160';
      const ws = windowSides(project, room);
      const ds = doorSides(project, room);
      const pref = [...byLen].sort((a, b) => Number(ws.includes(a) || ds.includes(a)) - Number(ws.includes(b) || ds.includes(b)));
      const bed = wall(bedId, { sides: pref }) ?? wall('bed-160', { allowWindow: true }) ?? wall('bed-90');
      if (bed) {
        placeRelative(ctx, 'nightstand', bed, 'left', 0.05);
        placeRelative(ctx, 'nightstand', bed, 'right', 0.05);
        if (area > 14) placeRelative(ctx, 'bench', bed, 'front', 0.05, undefined, true);
      }
      wall('wardrobe', { align: 'corner' }) ?? wall('wardrobe-s', { align: 'corner' });
      if (area > 12) wall('dresser', { allowWindow: true });
      if (area > 16) wall('armchair', { align: 'corner', allowWindow: true });
      break;
    }
    case 'kids': {
      wall('bed-90', { align: 'corner' });
      const desk = wall('desk', { sides: [...windowSides(project, room), ...byLen], allowWindow: true });
      if (desk) placeRelative(ctx, 'office-chair', desk, 'front', -0.15, (desk.item.rotation + 180) % 360, false);
      wall('wardrobe-s', { align: 'corner' });
      wall('bookshelf', { align: 'corner' });
      break;
    }
    case 'office': {
      const desk = wall('desk', { sides: [...windowSides(project, room), ...byLen], allowWindow: true });
      if (desk) placeRelative(ctx, 'office-chair', desk, 'front', -0.15, (desk.item.rotation + 180) % 360, false);
      wall('bookshelf', { align: 'corner' });
      if (area > 10) wall('armchair', { align: 'corner', allowWindow: true });
      wall('plant', { align: 'corner', allowWindow: true });
      break;
    }
    case 'bathroom': {
      if (area >= 4.2) wall('bathtub', { align: 'corner', sides: [...SIDES].sort((a, b) => wallLength(room, a) - wallLength(room, b)).filter((s) => wallLength(room, s) - 0.2 >= 1.7), allowWindow: true }) ?? wall('shower', { align: 'corner' });
      else wall('shower', { align: 'corner' });
      wall('vanity', { allowWindow: false });
      wall('toilet', { align: 'corner' });
      if (area >= 5) wall('washer', { align: 'corner' });
      break;
    }
    case 'wc':
      wall('toilet', { sides: [...SIDES].sort((a, b) => Number(doorSides(project, room).includes(a)) - Number(doorSides(project, room).includes(b))) });
      wall('vanity');
      break;
    case 'hall':
      wall('wardrobe', { align: 'corner' }) ?? wall('wardrobe-s', { align: 'corner' });
      wall('shoe-cabinet');
      if (area > 8) wall('plant', { align: 'corner' });
      break;
    case 'wardrobe':
      wall('wardrobe', { align: 'corner' });
      wall('wardrobe', { align: 'corner' }) ?? wall('wardrobe-s', { align: 'corner' });
      break;
    case 'laundry':
      wall('washer', { align: 'corner' });
      wall('washer', { align: 'corner' });
      break;
    case 'balcony':
      wall('bench', { allowWindow: true });
      wall('plant', { align: 'corner', allowWindow: true });
      break;
  }
  return ctx.items;
}

export function furnishProject(project: Project, roomIds?: string[]): FurnitureItem[] {
  const target = project.rooms.filter((r) => !roomIds || roomIds.includes(r.id));
  const keep = project.furniture.filter((f) => !target.some((r) => r.level === f.level && f.x >= r.x && f.x <= r.x + r.w && f.y >= r.y && f.y <= r.y + r.d));
  const added = target.flatMap((r) => furnishRoom(project, r));
  return [...keep, ...added];
}

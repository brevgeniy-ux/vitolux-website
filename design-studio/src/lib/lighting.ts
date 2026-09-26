import type { LightItem, Project, Room } from '../types';
import { ROOM_TYPES } from '../data/rooms';
import { lightById } from '../data/lights';
import { furnitureById } from '../data/furniture';
import { WALL_T, frontDir, roomArea, round2, uid } from './geometry';

/** Коэффициент использования светового потока и коэффициент запаса (метод коэффициента использования) */
export const UF = 0.5;
export const MF = 0.8;

export function lightsInRoom(project: Project, room: Room) {
  return project.lights.filter((l) => l.level === room.level && l.x >= room.x && l.x <= room.x + room.w && l.y >= room.y && l.y <= room.y + room.d);
}

export function furnitureInRoom(project: Project, room: Room) {
  return project.furniture.filter((f) => f.level === room.level && f.x >= room.x && f.x <= room.x + room.w && f.y >= room.y && f.y <= room.y + room.d);
}

export interface LuxResult {
  room: Room;
  area: number;
  norm: number;
  lumens: number;
  watts: number;
  lux: number;
  count: number;
  ok: boolean;
}

export function luxReport(project: Project, room: Room): LuxResult {
  const area = roomArea(room);
  const lights = lightsInRoom(project, room);
  let lumens = 0;
  let watts = 0;
  for (const l of lights) {
    const def = lightById(l.catalogId);
    if (!def) continue;
    // торшеры и бра дают в основном локальный свет — учитываем половину
    const k = def.model === 'floorLamp' || def.model === 'sconce' || def.model === 'strip' ? 0.5 : 1;
    lumens += def.lumens * k;
    watts += def.watts;
  }
  const lux = area > 0 ? (lumens * UF * MF) / area : 0;
  const norm = ROOM_TYPES[room.type].lux;
  return { room, area, norm, lumens: Math.round(lumens), watts, lux: Math.round(lux), count: lights.length, ok: lux >= norm * 0.9 };
}

function add(list: LightItem[], room: Room, catalogId: string, x: number, y: number, rotation = 0) {
  list.push({ id: uid(), catalogId, level: room.level, x: round2(x), y: round2(y), rotation });
}

/** Автоматическая схема освещения: декоративный + общий свет по нормативу */
export function lightRoom(project: Project, room: Room): LightItem[] {
  const out: LightItem[] = [];
  const style = project.style;
  const area = roomArea(room);
  const cx = room.x + room.w / 2;
  const cy = room.y + room.d / 2;
  const furn = furnitureInRoom(project, room).map((f) => ({ f, def: furnitureById(f.catalogId)! })).filter((x) => x.def);
  const find = (...models: string[]) => furn.find((x) => models.includes(x.def.model));
  const wet = ROOM_TYPES[room.type].wet && room.type !== 'kitchen';
  let decorative = 0;

  const addDecor = (id: string, x: number, y: number, rot = 0) => {
    add(out, room, id, x, y, rot);
    const def = lightById(id)!;
    decorative += def.model === 'floorLamp' || def.model === 'sconce' || def.model === 'strip' ? def.lumens * 0.5 : def.lumens;
  };

  switch (room.type) {
    case 'living': {
      const table = find('coffeeTable');
      const px = table ? table.f.x : cx;
      const py = table ? table.f.y : cy;
      if (style === 'neoclassic') addDecor('chandelier', px, py);
      else if (style === 'loft') addDecor('track-3', cx, cy, room.w >= room.d ? 0 : 90);
      else if (style === 'minimal' || style === 'modern') addDecor('pendant-linear', px, py, room.w >= room.d ? 0 : 90);
      else addDecor('pendant-dome', px, py);
      const chair = find('armchair');
      if (chair) {
        // торшер сбоку от кресла, ближе к стене
        const f = frontDir(chair.f.rotation);
        const sx = -f.y;
        const sy = f.x;
        const side = chair.def.w / 2 + 0.25;
        const back = chair.def.d / 2 - 0.2;
        const cands = [1, -1].map((k) => ({ x: chair.f.x + sx * side * k - f.x * back, y: chair.f.y + sy * side * k - f.y * back }));
        const inside = (p: { x: number; y: number }) => p.x > room.x + WALL_T + 0.15 && p.x < room.x + room.w - WALL_T - 0.15 && p.y > room.y + WALL_T + 0.15 && p.y < room.y + room.d - WALL_T - 0.15;
        const pos = cands.find(inside);
        if (pos) addDecor('floor-lamp', pos.x, pos.y);
      }
      const dining = find('diningTable');
      if (dining) addDecor('pendant-dome', dining.f.x, dining.f.y);
      break;
    }
    case 'kitchen':
    case 'dining': {
      const island = find('island');
      if (island) addDecor('pendant-linear', island.f.x, island.f.y, island.f.rotation % 180);
      const dining = find('diningTable');
      if (dining) addDecor(style === 'neoclassic' ? 'chandelier' : 'pendant-dome', dining.f.x, dining.f.y);
      const kit = find('kitchen');
      if (kit) {
        const f = frontDir(kit.f.rotation);
        addDecor('strip-5m', kit.f.x + f.x * 0.05, kit.f.y + f.y * 0.05, kit.f.rotation);
      }
      break;
    }
    case 'bedroom': {
      const bed = find('bed');
      addDecor(style === 'neoclassic' ? 'chandelier' : style === 'loft' ? 'track-3' : 'pendant-dome', cx, cy, room.w >= room.d ? 0 : 90);
      if (bed) {
        const f = frontDir(bed.f.rotation);
        const sx = -f.y;
        const sy = f.x;
        const back = bed.def.d / 2 - 0.12;
        for (const s of [-1, 1]) {
          const d = bed.def.w / 2 + 0.25;
          addDecor('sconce', bed.f.x + sx * d * s - f.x * back, bed.f.y + sy * d * s - f.y * back, bed.f.rotation);
        }
      }
      break;
    }
    case 'kids':
      addDecor('pendant-dome', cx, cy);
      break;
    case 'office': {
      const desk = find('desk');
      if (desk) addDecor('pendant-linear', desk.f.x, desk.f.y, desk.f.rotation % 180);
      const chair = find('armchair');
      if (chair) {
        const f = frontDir(chair.f.rotation);
        addDecor('floor-lamp', chair.f.x - f.y * (chair.def.w / 2 + 0.25), chair.f.y + f.x * (chair.def.w / 2 + 0.25));
      }
      break;
    }
    case 'bathroom':
    case 'wc': {
      const v = find('vanity');
      if (v) {
        const f = frontDir(v.f.rotation);
        addDecor('sconce-ip44', v.f.x - f.x * (v.def.d / 2 - 0.1), v.f.y - f.y * (v.def.d / 2 - 0.1), v.f.rotation);
      }
      break;
    }
  }

  // Общий свет — сетка точечных светильников на недостающий световой поток
  const norm = ROOM_TYPES[room.type].lux;
  const spotId = wet ? 'spot-ip44' : style === 'loft' ? 'spot-surface' : 'spot-gu10';
  const spot = lightById(spotId)!;
  const need = (norm * area) / (UF * MF) - decorative;
  const n = Math.max(0, Math.ceil(need / spot.lumens));
  if (n > 0) {
    const iw = room.w - 2 * WALL_T;
    const id = room.d - 2 * WALL_T;
    let cols = Math.max(1, Math.round(Math.sqrt((n * iw) / id)));
    let rows = Math.max(1, Math.ceil(n / cols));
    if (cols * rows < n) cols++;
    // минимальный шаг 0,7 м
    cols = Math.min(cols, Math.max(1, Math.floor(iw / 0.7)));
    rows = Math.min(rows, Math.max(1, Math.floor(id / 0.7)));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = room.x + WALL_T + (iw / cols) * (c + 0.5);
        const y = room.y + WALL_T + (id / rows) * (r + 0.5);
        // не ставим точку прямо в подвес
        if (out.some((l) => Math.hypot(l.x - x, l.y - y) < 0.45 && lightById(l.catalogId)!.model !== 'strip')) continue;
        add(out, room, spotId, x, y);
      }
    }
  }
  return out;
}

export function lightProject(project: Project, roomIds?: string[]): LightItem[] {
  const target = project.rooms.filter((r) => !roomIds || roomIds.includes(r.id));
  const keep = project.lights.filter((l) => !target.some((r) => r.level === l.level && l.x >= r.x && l.x <= r.x + r.w && l.y >= r.y && l.y <= r.y + r.d));
  return [...keep, ...target.flatMap((r) => lightRoom(project, r))];
}

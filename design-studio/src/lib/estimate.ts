import type { Project, Room, WallSide } from '../types';
import { ROOM_TYPES } from '../data/rooms';
import { floorById, RATES } from '../data/materials';
import { floorIdFor, wallColorFor } from '../data/styles';
import { furnitureById } from '../data/furniture';
import { lightById } from '../data/lights';
import { roomArea, roomPerimeter, wallGaps } from './geometry';

export interface RoomFinish {
  room: Room;
  area: number;
  perimeter: number;
  wallArea: number;
  paintArea: number;
  tileArea: number;
  floorName: string;
  floorId: string;
  wallColor: string;
  baseboard: number;
  doors: number;
  windowsWidth: number;
}

export function roomFinish(project: Project, room: Room): RoomFinish {
  const area = roomArea(room);
  const perimeter = roomPerimeter(room);
  const H = project.ceilingHeight;
  let openingsArea = 0;
  let doorWidth = 0;
  let doors = 0;
  let windowsWidth = 0;
  for (const side of ['n', 's', 'e', 'w'] as WallSide[]) {
    for (const g of wallGaps(project, room, side)) {
      openingsArea += (g.end - g.start) * (g.top - g.sill);
      if (g.kind === 'door') {
        doorWidth += g.end - g.start;
        doors++;
      } else windowsWidth += g.end - g.start;
    }
  }
  const wallArea = Math.max(0, perimeter * H - openingsArea);
  const info = ROOM_TYPES[room.type];
  let tileArea = 0;
  if (info.wet && room.type !== 'kitchen') tileArea = wallArea;
  else if (room.type === 'kitchen') tileArea = Math.min(wallArea, 3.2 * 0.65);
  const floorId = floorIdFor(project.style, room.type, room.floorId);
  const floor = floorById(floorId);
  const tiled = floor.pattern === 'tiles' || floor.pattern === 'marble';
  return {
    room,
    area,
    perimeter,
    wallArea,
    paintArea: wallArea - tileArea,
    tileArea,
    floorName: floor.name,
    floorId,
    wallColor: wallColorFor(project.style, room.type, room.wallColor),
    baseboard: tiled && info.wet ? 0 : Math.max(0, perimeter - doorWidth),
    doors,
    windowsWidth,
  };
}

export interface EstimateLine {
  section: string;
  name: string;
  unit: string;
  qty: number;
  price: number;
  total: number;
}

const SOCKETS: Record<string, number> = { living: 8, kitchen: 10, dining: 3, bedroom: 6, kids: 6, office: 8, bathroom: 3, wc: 1, hall: 3, wardrobe: 1, laundry: 3, balcony: 1 };

export function buildEstimate(project: Project) {
  const lines: EstimateLine[] = [];
  const push = (section: string, name: string, unit: string, qty: number, price: number) => {
    if (qty <= 0) return;
    const q = Math.round(qty * 100) / 100;
    lines.push({ section, name, unit, qty: q, price, total: Math.round(q * price) });
  };
  const finishes = project.rooms.map((r) => roomFinish(project, r));

  // Отделочные материалы
  const floors = new Map<string, number>();
  for (const f of finishes) floors.set(f.floorId, (floors.get(f.floorId) ?? 0) + f.area);
  for (const [id, a] of floors) {
    const fl = floorById(id);
    const reserve = fl.pattern === 'herringbone' || fl.pattern === 'tiles' || fl.pattern === 'marble' ? 1.12 : 1.08;
    push('Отделочные материалы', `${fl.name} (+${Math.round((reserve - 1) * 100)}% запас)`, 'м²', a * reserve, fl.pricePerM2);
  }
  const paintArea = finishes.reduce((s, f) => s + f.paintArea, 0);
  const tileArea = finishes.reduce((s, f) => s + f.tileArea, 0);
  const ceiling = finishes.reduce((s, f) => s + f.area, 0);
  const baseboard = finishes.reduce((s, f) => s + f.baseboard, 0);
  push('Отделочные материалы', 'Краска интерьерная моющаяся (2 слоя)', 'л', paintArea * RATES.paintConsumption, RATES.paintPerLiter);
  push('Отделочные материалы', 'Грунтовка, шпаклёвка, расходники', 'м²', paintArea, RATES.primerPerM2);
  push('Отделочные материалы', 'Настенная плитка (+10% запас)', 'м²', tileArea * 1.1, RATES.wallTilePerM2);
  push('Отделочные материалы', 'Плинтус скрытый/МДФ', 'м.п.', baseboard * 1.05, RATES.baseboardPerM);
  push('Отделочные материалы', 'Потолок (ГКЛ/натяжной) с отделкой', 'м²', ceiling, RATES.ceilingPerM2);
  const doorCount = project.openings.filter((o) => o.kind === 'door').length;
  push('Двери и окна', 'Межкомнатная/входная дверь с фурнитурой', 'шт', doorCount, RATES.doorUnit);
  const sills = project.openings.filter((o) => o.kind === 'window').reduce((s, o) => s + o.width + 0.1, 0);
  push('Двери и окна', 'Подоконники', 'м.п.', sills, RATES.windowSillPerM);

  // Мебель
  const furn = new Map<string, number>();
  for (const f of project.furniture) furn.set(f.catalogId, (furn.get(f.catalogId) ?? 0) + 1);
  for (const [id, n] of furn) {
    const d = furnitureById(id);
    if (d) push('Мебель и сантехника', d.name, 'шт', n, d.price);
  }
  // Свет
  const lts = new Map<string, number>();
  for (const l of project.lights) lts.set(l.catalogId, (lts.get(l.catalogId) ?? 0) + 1);
  for (const [id, n] of lts) {
    const d = lightById(id);
    if (d) push('Освещение (Vitolux)', d.name, 'шт', n, d.price);
  }

  // Работы
  const floorTiled = finishes.filter((f) => ['tiles', 'marble'].includes(floorById(f.floorId).pattern)).reduce((s, f) => s + f.area, 0);
  const floorOther = ceiling - floorTiled;
  push('Работы', 'Подготовка и окраска стен', 'м²', paintArea, RATES.works.wallsPerM2);
  push('Работы', 'Укладка плитки (стены)', 'м²', tileArea, RATES.works.tilePerM2);
  push('Работы', 'Укладка плитки/керамогранита (пол)', 'м²', floorTiled, RATES.works.tilePerM2);
  push('Работы', 'Стяжка и укладка напольного покрытия', 'м²', floorOther, RATES.works.floorPerM2);
  push('Работы', 'Монтаж потолка', 'м²', ceiling, RATES.works.ceilingPerM2);
  const sockets = project.rooms.reduce((s, r) => s + (SOCKETS[r.type] ?? 2), 0);
  push('Работы', 'Электромонтаж: розетки, выключатели, выводы', 'точка', sockets + project.lights.length, RATES.works.electricPoint);
  push('Работы', 'Монтаж светильников', 'шт', project.lights.length, RATES.works.lightInstall);

  const sections = [...new Set(lines.map((l) => l.section))].map((s) => ({
    name: s,
    lines: lines.filter((l) => l.section === s),
    total: lines.filter((l) => l.section === s).reduce((a, l) => a + l.total, 0),
  }));
  const total = lines.reduce((a, l) => a + l.total, 0);
  return { lines, sections, total, finishes, sockets, area: ceiling };
}

export const money = (v: number) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(v) + ' ₴';
export const num = (v: number, d = 2) => new Intl.NumberFormat('ru-RU', { maximumFractionDigits: d, minimumFractionDigits: 0 }).format(v);

export function toCSV(project: Project) {
  const { lines, total } = buildEstimate(project);
  const esc = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
  const rows = [['Раздел', 'Наименование', 'Ед.', 'Кол-во', 'Цена, грн', 'Сумма, грн'].map(esc).join(';')];
  for (const l of lines) rows.push([l.section, l.name, l.unit, l.qty, l.price, l.total].map(esc).join(';'));
  rows.push(['', 'ИТОГО', '', '', '', total].map(esc).join(';'));
  return '﻿' + rows.join('\n');
}

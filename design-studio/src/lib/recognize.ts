// Загрузка изображения планировки и её распознавание Claude (vision) в прямоугольные помещения.
import type { Opening, Project, ProjectKind, Room, RoomType, StyleId, Underlay, WallSide } from '../types';
import { ROOM_TYPES, ROOM_TYPE_LIST } from '../data/rooms';
import { emptyProject } from './layout';
import { clamp, round2, uid, wallLength } from './geometry';
import { artifactSample, inArtifact, sampleErrorText } from './platform';

export interface PreparedImage {
  dataUrl: string;
  blob: Blob;
  w: number;
  h: number;
  name: string;
}

/** Максимум ~1,15 Мп: такое изображение Claude получает без дополнительного уменьшения */
const MAX_PIXELS = 1_150_000;

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith('image/')) throw new Error(`«${file.name}» — не изображение. Загрузите JPG, PNG или WebP (PDF сохраните как картинку или сделайте скриншот).`);
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error(`Не удалось открыть «${file.name}»`));
      i.src = url;
    });
    const k = Math.min(1, Math.sqrt(MAX_PIXELS / (img.naturalWidth * img.naturalHeight)));
    const w = Math.max(1, Math.round(img.naturalWidth * k));
    const h = Math.max(1, Math.round(img.naturalHeight * k));
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const g = cv.getContext('2d')!;
    g.fillStyle = '#fff';
    g.fillRect(0, 0, w, h);
    g.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob>((res) => cv.toBlob((b) => res(b!), 'image/jpeg', 0.9));
    return { dataUrl: cv.toDataURL('image/jpeg', 0.9), blob, w, h, name: file.name };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function makeUnderlay(img: PreparedImage, level: number, planWidthM?: number): Underlay {
  // без калибровки считаем, что изображение покрывает ~12 м по ширине
  const mPerPx = (planWidthM ?? 12) / img.w;
  return { id: uid(), level, dataUrl: img.dataUrl, pxW: img.w, pxH: img.h, x: 0, y: 0, mPerPx, opacity: 0.6, visible: true };
}

// ---------- Ответ модели ----------

export interface RecognizedPlan {
  name?: string;
  planBox: { x0: number; y0: number; x1: number; y1: number };
  width: number;
  depth: number;
  rooms: { name: string; type: RoomType; x: number; y: number; w: number; d: number }[];
  openings: { room: number; kind: 'door' | 'window'; wall: WallSide; offset: number; width: number }[];
  notes?: string;
}

export const RECOGNIZE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'planBox', 'width', 'depth', 'rooms', 'openings', 'notes'],
  properties: {
    name: { type: 'string' },
    planBox: {
      type: 'object',
      additionalProperties: false,
      required: ['x0', 'y0', 'x1', 'y1'],
      properties: { x0: { type: 'number' }, y0: { type: 'number' }, x1: { type: 'number' }, y1: { type: 'number' } },
    },
    width: { type: 'number' },
    depth: { type: 'number' },
    rooms: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'type', 'x', 'y', 'w', 'd'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ROOM_TYPE_LIST },
          x: { type: 'number' },
          y: { type: 'number' },
          w: { type: 'number' },
          d: { type: 'number' },
        },
      },
    },
    openings: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['room', 'kind', 'wall', 'offset', 'width'],
        properties: {
          room: { type: 'integer' },
          kind: { type: 'string', enum: ['door', 'window'] },
          wall: { type: 'string', enum: ['n', 's', 'e', 'w'] },
          offset: { type: 'number' },
          width: { type: 'number' },
        },
      },
    },
    notes: { type: 'string' },
  },
};

export function recognizePrompt(kind: ProjectKind, hint: string, w: number, h: number) {
  return `На изображении (${w}×${h} px) — планировка ${kind === 'house' ? 'этажа частного дома' : 'квартиры'}: чертёж, скан, фото или эскиз от руки. Восстанови её как набор прямоугольных помещений в метрах.

Правила:
- Система координат плана: x вправо, y вниз, (0,0) — левый верхний угол наружного контура. Координаты и размеры помещений — по осям стен, в метрах, с точностью 0,05.
- Смежные помещения должны иметь ОДИНАКОВЫЕ координаты общей стены: без зазоров и нахлёстов. Помещения покрывают весь контур, включая коридоры и прихожую.
- Г-образные и сложные помещения разбей на 2 прямоугольника с одинаковым названием или аппроксимируй одним.
- Масштаб бери из размерных линий и подписей площадей на чертеже. Если их нет — оцени по типовым элементам: межкомнатная дверь 0,8 м, входная 0,9 м, кровать 1,6×2,0 м, ванна 1,7 м, высота потолка не нужна.
- type — назначение помещения из списка: ${ROOM_TYPE_LIST.map((t) => `${t} (${ROOM_TYPES[t].label})`).join(', ')}. Балкон и лоджию указывай как balcony.
- openings — двери и окна: room — индекс помещения в массиве rooms, wall — стена этого помещения (n — верхняя, s — нижняя, w — левая, e — правая), offset — расстояние от левого (для n/s) или верхнего (для w/e) угла помещения до начала проёма, width — ширина проёма. Дверь между двумя помещениями указывай один раз.
- planBox — где на изображении находится наружный контур: доли ширины и высоты изображения от 0 до 1 (x0,y0 — левый верхний угол контура, x1,y1 — правый нижний).
- width и depth — габариты наружного контура в метрах.
- notes — кратко по-русски: что распознано уверенно, что пришлось додумать.${hint ? `\n\nДополнительно от заказчика: ${hint}` : ''}`;
}

const JSON_SHAPE = `Ответь только JSON-объектом:
{"name": "Квартира …", "planBox": {"x0": 0.05, "y0": 0.08, "x1": 0.95, "y1": 0.9}, "width": 10.6, "depth": 7.4,
 "rooms": [{"name": "Гостиная", "type": "living", "x": 0, "y": 0, "w": 5.2, "d": 4}],
 "openings": [{"room": 0, "kind": "window", "wall": "n", "offset": 1.5, "width": 1.8}], "notes": "…"}`;

export async function recognizePlan(img: PreparedImage, kind: ProjectKind, hint: string): Promise<RecognizedPlan> {
  if (inArtifact()) {
    const sample = await artifactSample();
    if (!sample) throw new Error('Claude недоступен на этой странице — обведите планировку вручную');
    const s = sample as unknown as { json: <T>(i: string, o?: object) => Promise<T>; limits?: () => Promise<{ images?: unknown }> };
    const lim = await s.limits?.().catch(() => null);
    if (lim && !lim.images) throw new Error('Отправка изображений Claude недоступна в этом окне — обведите планировку вручную');
    try {
      return await s.json<RecognizedPlan>(recognizePrompt(kind, hint, img.w, img.h) + '\n\n' + JSON_SHAPE, { images: img.blob, modelTier: 'complex', cache: false });
    } catch (e) {
      throw new Error(sampleErrorText(e));
    }
  }
  const r = await fetch('/api/recognize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: img.dataUrl.split(',')[1], mediaType: 'image/jpeg', prompt: recognizePrompt(kind, hint, img.w, img.h), schema: RECOGNIZE_SCHEMA }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Ошибка сервера (${r.status})`);
  return j as RecognizedPlan;
}

// ---------- Преобразование в помещения проекта ----------

/** Сводит близкие координаты стен к общему значению, чтобы соседние помещения стыковались */
function snapEdges(values: number[], tol = 0.2) {
  const sorted = [...new Set(values.map((v) => round2(v)))].sort((a, b) => a - b);
  const clusters: number[][] = [];
  for (const v of sorted) {
    const last = clusters[clusters.length - 1];
    if (last && v - last[last.length - 1] <= tol) last.push(v);
    else clusters.push([v]);
  }
  const map = new Map<number, number>();
  for (const c of clusters) {
    const m = Math.round((c.reduce((s, v) => s + v, 0) / c.length) * 20) / 20;
    for (const v of c) map.set(v, m);
  }
  return (v: number) => map.get(round2(v)) ?? Math.round(v * 20) / 20;
}

export function planToRooms(plan: RecognizedPlan, level: number): { rooms: Room[]; openings: Opening[] } {
  const raw = (plan.rooms ?? []).filter((r) => ROOM_TYPE_LIST.includes(r.type) && r.w > 0.5 && r.d > 0.5);
  const sx = snapEdges(raw.flatMap((r) => [r.x, r.x + r.w]));
  const sy = snapEdges(raw.flatMap((r) => [r.y, r.y + r.d]));
  const idMap = new Map<number, string>();
  const rooms: Room[] = [];
  (plan.rooms ?? []).forEach((r, i) => {
    if (!raw.includes(r)) return;
    const x0 = sx(r.x);
    const y0 = sy(r.y);
    const w = round2(sx(r.x + r.w) - x0);
    const d = round2(sy(r.y + r.d) - y0);
    if (w < 0.5 || d < 0.5) return;
    const room: Room = { id: uid(), name: r.name || ROOM_TYPES[r.type].label, type: r.type, level, x: x0, y: y0, w, d };
    idMap.set(i, room.id);
    rooms.push(room);
  });
  const openings: Opening[] = [];
  for (const o of plan.openings ?? []) {
    const roomId = idMap.get(o.room);
    const room = rooms.find((r) => r.id === roomId);
    if (!room || !['n', 's', 'e', 'w'].includes(o.wall)) continue;
    const L = wallLength(room, o.wall);
    const width = clamp(round2(o.width || (o.kind === 'door' ? 0.8 : 1.4)), 0.5, L - 0.1);
    if (L < 0.7) continue;
    const offset = round2(clamp(o.offset ?? 0, 0.05, L - width - 0.05));
    openings.push(
      o.kind === 'door'
        ? { id: uid(), roomId: room.id, wall: o.wall, kind: 'door', offset, width, height: 2.1, sill: 0 }
        : { id: uid(), roomId: room.id, wall: o.wall, kind: 'window', offset, width, height: 1.5, sill: 0.8 },
    );
  }
  return { rooms, openings };
}

/** Подложка, совмещённая с распознанными помещениями */
export function alignedUnderlay(img: PreparedImage, plan: RecognizedPlan, level: number): Underlay {
  const b = plan.planBox;
  const valid = b && b.x1 > b.x0 && b.y1 > b.y0 && plan.width > 0;
  if (!valid) return makeUnderlay(img, level, plan.width > 0 ? plan.width * 1.2 : undefined);
  const mPerPx = plan.width / ((b.x1 - b.x0) * img.w);
  return { id: uid(), level, dataUrl: img.dataUrl, pxW: img.w, pxH: img.h, x: round2(-b.x0 * img.w * mPerPx), y: round2(-b.y0 * img.h * mPerPx), mPerPx, opacity: 0.45, visible: true };
}

export function projectFromUploads(kind: ProjectKind, style: StyleId, name: string, floors: { img: PreparedImage; plan?: RecognizedPlan }[]): { project: Project; notes: string[] } {
  const p = emptyProject(kind, style);
  p.name = name || floors.find((f) => f.plan?.name)?.plan?.name || 'Планировка заказчика';
  p.underlays = [];
  const notes: string[] = [];
  floors.forEach((f, level) => {
    if (f.plan) {
      const { rooms, openings } = planToRooms(f.plan, level);
      p.rooms.push(...rooms);
      p.openings.push(...openings);
      p.underlays!.push(alignedUnderlay(f.img, f.plan, level));
      if (f.plan.notes) notes.push((floors.length > 1 ? `${level + 1} эт.: ` : '') + f.plan.notes);
    } else {
      p.underlays!.push(makeUnderlay(f.img, level));
    }
  });
  p.levels = Math.max(1, floors.length);
  if (notes.length) p.notes = 'Распознавание планировки: ' + notes.join(' ');
  return { project: p, notes };
}

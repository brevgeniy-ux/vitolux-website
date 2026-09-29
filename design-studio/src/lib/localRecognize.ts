// Распознавание планировки без ИИ: стены — тёмные пиксели, помещения — замкнутые светлые области.
// Масштаб и названия берутся из экспликации (текст PDF) или из калибровки подложки.
import type { Opening, Project, Room, RoomType, Underlay, WallSide } from '../types';
import { ROOM_TYPES } from '../data/rooms';
import { planToRooms, type RecognizedPlan } from './recognize';
import { clamp, isExteriorWall, round2, uid, wallLength } from './geometry';

export interface ExplicationRow {
  no: number;
  name: string;
  area: number;
}

const TYPE_WORDS: [RoomType, RegExp][] = [
  ['kitchen', /кухн|kitchen/i],
  ['living', /вітал|гостин|зал\b|living|салон/i],
  ['dining', /їдал|столов|dining/i],
  ['bedroom', /спал|спаль|bedroom/i],
  ['kids', /дит|дет|kids|child/i],
  ['office', /кабін|кабин|office|робоч|рабоч/i],
  ['bathroom', /ванн|душ|bath/i],
  ['wc', /с\/?в|с\/?у|санв|сануз|туал|убор|wc|toilet/i],
  ['wardrobe', /гардер|шаф|кладов|комор|wardrobe|storage/i],
  ['laundry', /прал|пост|котел|технич|техніч|laundry/i],
  ['balcony', /балк|лодж|терас|веранд|balcon|terrace/i],
  ['hall', /перед|прих|кор|хол|тамб|hall|corridor|вестиб/i],
];

export function typeFromName(name: string): RoomType | null {
  for (const [t, re] of TYPE_WORDS) if (re.test(name)) return t;
  return null;
}

/** Строки экспликации «№ Наименование Площадь» из текста страницы */
export function parseExplication(text: string): ExplicationRow[] {
  const rows: ExplicationRow[] = [];
  const re = /(?:^|\s)(\d{1,2})[.)]?\s+([A-Za-zА-Яа-яЁёІіЇїЄєҐґ'’ʼ\-/.]+(?:\s+[A-Za-zА-Яа-яЁёІіЇїЄєҐґ'’ʼ\-/.№\d]+){0,4}?)\s+(\d{1,3}[.,]\d{1,2})(?=\s|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const area = parseFloat(m[3].replace(',', '.'));
    const name = m[2].trim().replace(/\s+/g, ' ');
    if (area >= 0.8 && area <= 250 && /[A-Za-zА-Яа-яІіЇїЄєҐґ]{3}/.test(name) && !/площ|всього|всего|итого|разом|total/i.test(name)) rows.push({ no: Number(m[1]), name, area });
  }
  // убираем дубликаты по номеру
  const seen = new Set<number>();
  return rows.filter((r) => (seen.has(r.no) ? false : (seen.add(r.no), true)));
}

async function loadImageData(dataUrl: string, crop: { x0: number; y0: number; x1: number; y1: number }, maxSide: number) {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error('не удалось прочитать изображение'));
    i.src = dataUrl;
  });
  const cw = crop.x1 - crop.x0;
  const ch = crop.y1 - crop.y0;
  const k = Math.min(1, maxSide / Math.max(cw, ch));
  const w = Math.max(1, Math.round(cw * k));
  const h = Math.max(1, Math.round(ch * k));
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const g = cv.getContext('2d', { willReadFrequently: true })!;
  g.fillStyle = '#fff';
  g.fillRect(0, 0, w, h);
  g.drawImage(img, crop.x0, crop.y0, cw, ch, 0, 0, w, h);
  return { data: g.getImageData(0, 0, w, h).data, w, h, k };
}

/** Квадратная дилатация радиуса r (сепарабельно) */
function dilate(src: Uint8Array, w: number, h: number, r: number) {
  if (r <= 0) return src;
  const tmp = new Uint8Array(w * h);
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    // проход слева направо и справа налево
    let last = -1e9;
    for (let x = 0; x < w; x++) {
      if (src[y * w + x]) last = x;
      if (x - last <= r) tmp[y * w + x] = 1;
    }
    last = 1e9;
    for (let x = w - 1; x >= 0; x--) {
      if (src[y * w + x]) last = x;
      if (last - x <= r) tmp[y * w + x] = 1;
    }
  }
  for (let x = 0; x < w; x++) {
    let last = -1e9;
    for (let y = 0; y < h; y++) {
      if (tmp[y * w + x]) last = y;
      if (y - last <= r) out[y * w + x] = 1;
    }
    last = 1e9;
    for (let y = h - 1; y >= 0; y--) {
      if (tmp[y * w + x]) last = y;
      if (last - y <= r) out[y * w + x] = 1;
    }
  }
  return out;
}

function erode(src: Uint8Array, w: number, h: number, r: number) {
  const inv = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) inv[i] = src[i] ? 0 : 1;
  const d = dilate(inv, w, h, r);
  for (let i = 0; i < w * h; i++) inv[i] = d[i] ? 0 : 1;
  return inv;
}

/** Удаляет связные компоненты маски, чей габарит меньше maxSide */
function removeSmall(m: Uint8Array, w: number, h: number, maxSide: number) {
  const seen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  const comp: number[] = [];
  for (let i = 0; i < w * h; i++) {
    if (!m[i] || seen[i]) continue;
    let sp = 0;
    stack[sp++] = i;
    seen[i] = 1;
    comp.length = 0;
    let x0 = w, y0 = h, x1 = 0, y1 = 0;
    while (sp) {
      const p = stack[--sp];
      comp.push(p);
      const x = p % w;
      const y = (p - x) / w;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      for (const q of [p - 1, p + 1, p - w, p + w]) {
        if (q < 0 || q >= w * h || seen[q] || !m[q]) continue;
        if ((q === p - 1 && x === 0) || (q === p + 1 && x === w - 1)) continue;
        seen[q] = 1;
        stack[sp++] = q;
      }
    }
    if (Math.max(x1 - x0, y1 - y0) < maxSide) for (const p of comp) m[p] = 0;
  }
}

interface Region {
  id: number;
  count: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Связные свободные области, не касающиеся края */
function label(wall: Uint8Array, w: number, h: number) {
  const lab = new Int32Array(w * h);
  const regions: Region[] = [];
  const stack = new Int32Array(w * h);
  let next = 1;
  for (let i = 0; i < w * h; i++) {
    if (wall[i] || lab[i]) continue;
    let sp = 0;
    stack[sp++] = i;
    lab[i] = next;
    const r: Region = { id: next, count: 0, x0: w, y0: h, x1: 0, y1: 0 };
    let border = false;
    while (sp) {
      const p = stack[--sp];
      const x = p % w;
      const y = (p - x) / w;
      r.count++;
      if (x < r.x0) r.x0 = x;
      if (x > r.x1) r.x1 = x;
      if (y < r.y0) r.y0 = y;
      if (y > r.y1) r.y1 = y;
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) border = true;
      if (x > 0 && !wall[p - 1] && !lab[p - 1]) (lab[p - 1] = next), (stack[sp++] = p - 1);
      if (x < w - 1 && !wall[p + 1] && !lab[p + 1]) (lab[p + 1] = next), (stack[sp++] = p + 1);
      if (y > 0 && !wall[p - w] && !lab[p - w]) (lab[p - w] = next), (stack[sp++] = p - w);
      if (y < h - 1 && !wall[p + w] && !lab[p + w]) (lab[p + w] = next), (stack[sp++] = p + w);
    }
    if (!border) regions.push(r);
    next++;
  }
  return { lab, regions };
}

/** Наибольший прямоугольник внутри области (метод гистограмм) */
function largestRect(mask: (x: number, y: number) => boolean, x0: number, y0: number, x1: number, y1: number) {
  const W = x1 - x0 + 1;
  const heights = new Int32Array(W);
  let best = { area: 0, x0: 0, y0: 0, x1: 0, y1: 0 };
  for (let y = y0; y <= y1; y++) {
    for (let i = 0; i < W; i++) heights[i] = mask(x0 + i, y) ? heights[i] + 1 : 0;
    const st: number[] = [];
    for (let i = 0; i <= W; i++) {
      const hh = i === W ? 0 : heights[i];
      while (st.length && heights[st[st.length - 1]] >= hh) {
        const top = st.pop()!;
        const height = heights[top];
        const left = st.length ? st[st.length - 1] + 1 : 0;
        const area = height * (i - left);
        if (area > best.area) best = { area, x0: x0 + left, y0: y - height + 1, x1: x0 + i - 1, y1: y };
      }
      st.push(i);
    }
  }
  return best;
}

export interface LocalResult {
  plan: RecognizedPlan;
  mPerPx: number;
  notes: string;
}

/**
 * Распознаёт помещения на подложке. Координаты — в метрах в системе плана (с учётом положения подложки).
 */
export async function recognizeLocally(u: Underlay): Promise<LocalResult> {
  const crop = u.crop ?? { x0: 0, y0: 0, x1: u.pxW, y1: u.pxH };
  const { data, w, h, k } = await loadImageData(u.dataUrl, crop, 900);
  // стены: тёмные и насыщенно-серые пиксели
  const raw = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < w * h; i++, p += 4) {
    const lum = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
    raw[i] = lum < 165 ? 1 : 0;
  }
  // штриховка стен сливается, затем «открытие» убирает тонкие линии: текст, дуги дверей, размерные линии
  const closed = erode(dilate(raw, w, h, 1), w, h, 1);
  // отдельно стоящие мелкие элементы (подписи, площади, значки) — не стены
  removeSmall(closed, w, h, Math.max(w, h) * 0.2);
  const ro = Math.max(2, Math.round(Math.max(w, h) * 0.003));
  const wall = dilate(erode(closed, w, h, ro), w, h, ro);

  const minArea = w * h * 0.003;
  const target = parseExplication(u.text ?? '').length;
  const rMax = Math.max(4, Math.round(Math.max(w, h) * 0.05));
  let best: { r: number; regions: Region[]; lab: Int32Array; score: number } | null = null;
  for (let r = 1; r <= rMax; r++) {
    const d = dilate(wall, w, h, r);
    const { lab, regions } = label(d, w, h);
    const rooms = regions.filter((g) => g.count >= minArea && g.count <= w * h * 0.6);
    // если известно число помещений из экспликации — первый радиус, при котором оно достигнуто;
    // иначе — наибольшее число помещений при наименьшем радиусе
    const score = target ? -Math.abs(rooms.length - target) : rooms.length;
    if (!best || score > best.score) best = { r, regions: rooms, lab, score };
    if (target && rooms.length === target) break;
  }
  if (!best || best.regions.length === 0) throw new Error('Не удалось найти замкнутые помещения. Обведите рамкой только сам план (без штампа и таблиц) или обведите помещения вручную.');

  // прямоугольники помещений (Г-образные — двумя частями); координаты — по чистовым граням стен
  const r = best.r;
  const parts: { region: Region; x0: number; y0: number; x1: number; y1: number; part: number }[] = [];
  for (const g of best.regions) {
    const inside = (x: number, y: number) => best!.lab[y * w + x] === g.id;
    const a = largestRect(inside, g.x0, g.y0, g.x1, g.y1);
    parts.push({ region: g, x0: a.x0 - r, y0: a.y0 - r, x1: a.x1 + r, y1: a.y1 + r, part: 1 });
    const rest = g.count - a.area;
    if (rest > g.count * 0.3 && rest > minArea) {
      const inRest = (x: number, y: number) => inside(x, y) && !(x >= a.x0 && x <= a.x1 && y >= a.y0 && y <= a.y1);
      const b = largestRect(inRest, g.x0, g.y0, g.x1, g.y1);
      if (b.area > minArea * 0.6) parts.push({ region: g, x0: b.x0 - r, y0: b.y0 - r, x1: b.x1 + r, y1: b.y1 + r, part: 2 });
    }
  }
  const pxArea = (id: number) => parts.filter((p) => p.region.id === id).reduce((s, p) => s + (p.x1 - p.x0 + 1) * (p.y1 - p.y0 + 1), 0);

  // масштаб
  const rows = parseExplication(u.text ?? '');
  const regionsSorted = [...best.regions].sort((a, b) => pxArea(b.id) - pxArea(a.id));
  let mPerPxSmall: number;
  let notes: string;
  if (rows.length >= 2 && Math.abs(rows.length - regionsSorted.length) <= Math.max(2, rows.length * 0.4)) {
    const n = Math.min(rows.length, regionsSorted.length);
    const areasM = [...rows].sort((a, b) => b.area - a.area).slice(0, n).reduce((s, x) => s + x.area, 0);
    const areasPx = regionsSorted.slice(0, n).reduce((s, g) => s + pxArea(g.id), 0);
    mPerPxSmall = Math.sqrt(areasM / areasPx);
    notes = `Масштаб определён по экспликации (${rows.length} помещений в таблице, ${regionsSorted.length} найдено на чертеже).`;
  } else if (u.calibrated) {
    mPerPxSmall = u.mPerPx / k;
    notes = 'Масштаб взят из калибровки подложки.';
  } else {
    throw new Error('Не удалось определить масштаб: в PDF нет таблицы площадей. Нажмите «Масштаб», кликните по концам размера с известной длиной, затем распознайте снова.');
  }

  // имена по экспликации: ближайшая площадь
  const rowsByArea = [...rows].sort((a, b) => b.area - a.area);
  const nameOf = new Map<number, ExplicationRow>();
  if (rows.length) {
    const used = new Set<number>();
    for (const g of regionsSorted) {
      const areaM = pxArea(g.id) * mPerPxSmall * mPerPxSmall;
      let bi = -1;
      let bd = Infinity;
      rowsByArea.forEach((row, i) => {
        if (used.has(i)) return;
        const d = Math.abs(row.area - areaM) / row.area;
        if (d < bd) [bd, bi] = [d, i];
      });
      if (bi >= 0 && bd < 0.45) {
        used.add(bi);
        nameOf.set(g.id, rowsByArea[bi]);
      }
    }
  }

  // в метры: пиксели уменьшенного кадра → пиксели изображения → план
  const mPerPx = mPerPxSmall * k; // метров на пиксель исходного изображения
  const toX = (px: number) => u.x + (crop.x0 + px / k) * mPerPx;
  const toY = (py: number) => u.y + (crop.y0 + py / k) * mPerPx;
  const half = 0.1 / mPerPxSmall; // до оси стены (у нас стена 0,1 м внутри помещения)
  const planRooms: RecognizedPlan['rooms'] = parts.map((p) => {
    const row = nameOf.get(p.region.id);
    const areaGuess = pxArea(p.region.id) * mPerPxSmall * mPerPxSmall;
    const type: RoomType = (row && typeFromName(row.name)) || (areaGuess < 3 ? 'wc' : areaGuess < 6 ? 'hall' : 'living');
    const name = row ? row.name.charAt(0).toUpperCase() + row.name.slice(1) : ROOM_TYPES[type].label;
    return { name: p.part === 2 ? `${name} (часть 2)` : name, type, x: toX(p.x0 - half), y: toY(p.y0 - half), w: (p.x1 - p.x0 + 1 + 2 * half) * mPerPxSmall, d: (p.y1 - p.y0 + 1 + 2 * half) * mPerPxSmall };
  });
  return { plan: { planBox: { x0: 0, y0: 0, x1: 1, y1: 1 }, width: 0, depth: 0, rooms: planRooms, openings: [] }, mPerPx, notes };
}

/** Двери между соседними помещениями и окна на наружных стенах — чтобы модель была проходной */
export function autoOpenings(rooms: { id: string; type: RoomType; x: number; y: number; w: number; d: number; level: number }[]) {
  const out: { roomId: string; wall: WallSide; kind: 'door' | 'window'; offset: number; width: number }[] = [];
  const EPS = 0.06;
  const shared = (a: (typeof rooms)[0], b: (typeof rooms)[0]) => {
    const res: { side: WallSide; from: number; to: number }[] = [];
    if (Math.abs(a.x + a.w - b.x) < EPS) res.push({ side: 'e', from: Math.max(a.y, b.y), to: Math.min(a.y + a.d, b.y + b.d) });
    if (Math.abs(b.x + b.w - a.x) < EPS) res.push({ side: 'w', from: Math.max(a.y, b.y), to: Math.min(a.y + a.d, b.y + b.d) });
    if (Math.abs(a.y + a.d - b.y) < EPS) res.push({ side: 's', from: Math.max(a.x, b.x), to: Math.min(a.x + a.w, b.x + b.w) });
    if (Math.abs(b.y + b.d - a.y) < EPS) res.push({ side: 'n', from: Math.max(a.x, b.x), to: Math.min(a.x + a.w, b.x + b.w) });
    return res.filter((s) => s.to - s.from >= 1.0);
  };
  const hub: RoomType[] = ['hall', 'living', 'kitchen', 'dining'];
  const connected = new Set<string>();
  for (const a of rooms) {
    if (a.type === 'hall') continue;
    // дверь в соседнее «проходное» помещение с наибольшей общей стеной
    let bestS: { b: (typeof rooms)[0]; side: WallSide; from: number; to: number } | null = null;
    for (const b of rooms) {
      if (b.id === a.id || b.level !== a.level) continue;
      for (const s of shared(a, b)) {
        const score = (s.to - s.from) * (hub.includes(b.type) ? 3 : 1) * (b.type === 'hall' ? 2 : 1);
        const cur = bestS ? (bestS.to - bestS.from) * (hub.includes(bestS.b.type) ? 3 : 1) * (bestS.b.type === 'hall' ? 2 : 1) : -1;
        if (score > cur) bestS = { b, ...s };
      }
    }
    if (!bestS) continue;
    const key = [a.id, bestS.b.id].sort().join();
    if (connected.has(key)) continue;
    connected.add(key);
    const width = a.type === 'wc' || a.type === 'bathroom' ? 0.7 : a.type === 'living' || a.type === 'kitchen' ? 0.9 : 0.8;
    const base = bestS.side === 'n' || bestS.side === 's' ? a.x : a.y;
    const mid = (bestS.from + bestS.to) / 2;
    out.push({ roomId: a.id, wall: bestS.side, kind: 'door', offset: Math.max(0.1, mid - width / 2 - base), width });
  }
  return out;
}

const NO_WINDOW: RoomType[] = ['hall', 'wc', 'wardrobe', 'laundry'];

/** Полный цикл без ИИ: помещения, двери, окна и уточнённый масштаб подложки */
export async function buildFromUnderlay(u: Underlay, level: number): Promise<{ rooms: Room[]; openings: Opening[]; mPerPx: number; notes: string }> {
  const res = await recognizeLocally(u);
  const { rooms } = planToRooms(res.plan, level);
  if (!rooms.length) throw new Error('Помещения не найдены — обведите рамкой сам план или нарисуйте помещения вручную');
  const openings: Opening[] = autoOpenings(rooms).map((o) => ({ id: uid(), roomId: o.roomId, wall: o.wall, kind: o.kind, offset: round2(o.offset), width: o.width, height: 2.1, sill: 0 }));
  const proj = { rooms, openings } as unknown as Project;
  for (const r of rooms) {
    if (NO_WINDOW.includes(r.type)) continue;
    const sides = (['n', 's', 'e', 'w'] as WallSide[]).filter((sd) => isExteriorWall(proj, r, sd)).sort((a, b) => wallLength(r, b) - wallLength(r, a));
    if (!sides.length) continue;
    const L = wallLength(r, sides[0]);
    const width = round2(clamp(L * 0.45, 0.8, 2.0));
    if (L < width + 0.4) continue;
    openings.push({ id: uid(), roomId: r.id, wall: sides[0], kind: 'window', offset: round2((L - width) / 2), width, height: r.type === 'bathroom' ? 0.7 : 1.5, sill: r.type === 'bathroom' ? 1.4 : 0.8 });
  }
  return { rooms, openings, mPerPx: res.mPerPx, notes: res.notes };
}

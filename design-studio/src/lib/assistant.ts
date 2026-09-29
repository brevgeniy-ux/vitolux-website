// ИИ-ассистент дизайнера: контекст проекта, действия над проектом, диалог и доработка проекта по материалам.
import type { ChatMessage, Material, Project, RoomType, StyleId, WallSide } from '../types';
import { useStore } from '../store';
import { ROOM_TYPES, ROOM_TYPE_LIST } from '../data/rooms';
import { STYLE_LIST, STYLES, floorIdOf, styleOf, wallColorOf } from '../data/styles';
import { FLOORS, WALL_FINISHES } from '../data/materials';
import { FURNITURE, furnitureById } from '../data/furniture';
import { LIGHTS, lightById } from '../data/lights';
import { aiJson, aiMaxImages, type AiTurn } from './ai';
import { clamp, roomArea, round2, snap, uid, wallLength } from './geometry';
import { furnishProject } from './autoFurnish';
import { furnitureInRoom, lightProject, lightsInRoom, luxReport } from './lighting';
import { generateLayout } from './layout';
import { alignedUnderlay, makeUnderlay, planToRooms, recognizePlan } from './recognize';
import { buildFromUnderlay } from './localRecognize';
import { buildEstimate } from './estimate';
import { pageBlob } from './materials';

const STYLE_IDS = STYLE_LIST.map((s) => s.id);

// ---------- Контекст для модели ----------

function pageKeys(materials: Material[]) {
  const out: { key: string; label: string; m: Material; i: number }[] = [];
  let n = 0;
  for (const m of materials) m.pages.forEach((_, i) => out.push({ key: `p${++n}`, label: `${m.kind === 'reference' ? 'референс' : 'материал'} «${m.name}», стр. ${i + 1}`, m, i }));
  return out;
}

export function projectContext(p: Project): string {
  const st = styleOf(p);
  const est = buildEstimate(p);
  const rooms = p.rooms.map((r) => {
    const lux = luxReport(p, r);
    const op = p.openings.filter((o) => o.roomId === r.id).map((o) => `${o.kind === 'door' ? 'дверь' : 'окно'} ${o.wall} ${o.offset}+${o.width}`);
    const furn = furnitureInRoom(p, r).map((f) => f.catalogId + (f.color ? `(${f.color})` : ''));
    return {
      id: r.id,
      name: r.name,
      type: r.type,
      level: r.level,
      x: r.x,
      y: r.y,
      w: r.w,
      d: r.d,
      area: round2(roomArea(r)),
      walls: wallColorOf(p, r),
      wallFinish: r.wallFinish ?? 'paint',
      accentWall: r.accentWall ?? null,
      floor: floorIdOf(p, r),
      openings: op,
      furniture: furn,
      lights: lightsInRoom(p, r).length,
      lux: `${lux.lux}/${lux.norm}`,
    };
  });
  return JSON.stringify({
    name: p.name,
    kind: p.kind,
    ceilingHeight: p.ceilingHeight,
    ceilingHeightConfirmed: Boolean(p.facts?.ceilingHeight),
    residents: p.facts?.residents || 'не известно',
    budget: p.facts?.budget || 'не известно',
    levels: p.levels,
    style: p.style,
    palette: { walls: st.walls, wood: st.wood, fabric: st.fabric, accent: st.accent, metal: st.metal, ceiling: st.ceiling, cct: st.cct, custom: Boolean(p.custom) },
    concept: p.concept.slice(0, 1500),
    rooms,
    totalArea: round2(est.area),
    estimateTotalUah: Math.round(est.total),
  });
}

function catalogs() {
  return [
    `Типы помещений: ${ROOM_TYPE_LIST.map((t) => `${t} (${ROOM_TYPES[t].label})`).join(', ')}.`,
    `Стили: ${STYLE_LIST.map((s) => `${s.id} (${s.name})`).join(', ')}.`,
    `Отделка стен (wallFinish): ${WALL_FINISHES.map((f) => `${f.id} — ${f.name}, ${f.pricePerM2} грн/м²`).join('; ')}.`,
    `Покрытия пола (floorId): ${FLOORS.map((f) => `${f.id} — ${f.name}`).join('; ')}.`,
    `Мебель (catalogId, Ш×Г м): ${FURNITURE.map((f) => `${f.id} — ${f.name} ${f.w}×${f.d}`).join('; ')}.`,
    `Светильники (catalogId): ${LIGHTS.map((l) => `${l.id} — ${l.name}`).join('; ')}.`,
  ].join('\n');
}

const TOOLS_DOC = `Действия (actions), которыми ты меняешь проект. args — JSON-строка с параметрами. Помещение (room) указывай по id или названию.
- set_style {style} — пресет стиля (сбрасывает свою палитру)
- set_palette {walls?, wood?, fabric?, accent?, metal?, ceiling?, floor?, cct?, name?} — своя палитра в HEX поверх стиля (например, по референсам); floor — floorId по умолчанию; cct — цветовая температура света, K; name — название своего стиля
- set_project {name?, client?, address?, kind?, ceilingHeight?, residents?, budget?} — ceilingHeight указывай, только когда заказчик назвал высоту (она станет подтверждённой); residents — кто живёт; budget — бюджет словами
- set_concept {text} — текст концепции (абзацы через \\n)
- generate_layout {rooms:[{type, name, area, level?}]} — построить новую планировку по списку помещений (заменяет текущую)
- add_room {name, type, level?, x, y, w, d} — прямоугольник по осям стен, м; соседние помещения должны иметь общие координаты стен
- update_room {room, name?, type?, x?, y?, w?, d?, level?, wallColor?, floorId?, wallFinish?, accentWall?: {side: n|s|e|w, finish, color?} | null}
- delete_room {room}
- add_opening {room, kind: door|window, wall: n|s|e|w, offset, width}
- delete_openings {room, wall?, kind?}
- furnish {rooms?:[room]} — авторасстановка мебели (без rooms — во всех помещениях)
- light {rooms?:[room]} — авторасчёт освещения по нормам
- add_furniture {catalogId, room, x?, y?, rotation?, color?} — x,y — центр в координатах плана; без них — в центре помещения
- remove_furniture {room?, catalogId?}
- recolor_furniture {room?, catalogId?, color}
- add_light {catalogId, room, x?, y?}
- remove_lights {room?, catalogId?}
- recognize_plan {page} — распознать планировку со страницы материалов (page — ключ вида p3) и заменить помещения этажа
- create_variant {name, style, idea, palette?} — создать отдельный проект-вариант с другим стилем/палитрой (текущий не меняется)`;

const ROLE = `Ты — ИИ-дизайнер интерьеров студии Vitolux (Украина), встроенный в редактор дизайн-проектов квартир и домов. Ты ведёшь проект вместе с заказчиком: разбираешь присланные референсы (скриншоты из Pinterest, фото интерьеров) и материалы прошлого дизайнера, задаёшь уточняющие вопросы, рекомендуешь решения и сразу вносишь согласованные изменения в проект через actions.

Как вести диалог:
- Пиши по-русски, коротко и по делу, как опытный дизайнер. Без маркдауна-заголовков; списки — строками с «•».
- По референсам называй конкретно, что видишь: стиль, цвета (с HEX), материалы, мебель, свет, настроение, и как это перенести в проект.
- Если информации мало — задай 1–3 конкретных вопроса (состав семьи, сценарии жизни, хранение, бюджет, что оставить от прежнего проекта), но не откладывай всё на потом: предложи стартовое решение.
- Следи за полнотой исходных данных. Если ceilingHeightConfirmed = false — выясни высоту потолков (она влияет на свет, мебель и смету). Если неизвестны состав семьи, бюджет, назначение неуверенно распознанных помещений — спроси. Спрашивай не всё сразу: 2–4 самых важных вопроса за раз. Ответы записывай через set_project.
- Меняй проект, когда пользователь просит или соглашается; при явной просьбе «сделай/собери/примени» — сразу действуй. Не удаляй и не перестраивай планировку без явного согласия.
- Если заказчик прислал планировку (изображение или страницу PDF), а в проекте ещё нет помещений или он просит взять её за основу — вызови recognize_plan для этой страницы (ключ pN из списка материалов).
- После изменений кратко скажи, что сделано и что предлагаешь дальше.
- variants — 2–3 альтернативы, когда уместно предложить выбор (разные стили или палитры); пользователь создаст их кнопкой.

${TOOLS_DOC}`;

const CHAT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['reply', 'actions', 'variants'],
  properties: {
    reply: { type: 'string' },
    actions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['tool', 'args'],
        properties: {
          tool: {
            type: 'string',
            enum: ['set_style', 'set_palette', 'set_project', 'set_concept', 'generate_layout', 'add_room', 'update_room', 'delete_room', 'add_opening', 'delete_openings', 'furnish', 'light', 'add_furniture', 'remove_furniture', 'recolor_furniture', 'add_light', 'remove_lights', 'recognize_plan', 'create_variant'],
          },
          args: { type: 'string' },
        },
      },
    },
    variants: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'style', 'idea'],
        properties: { name: { type: 'string' }, style: { type: 'string', enum: STYLE_IDS }, idea: { type: 'string' } },
      },
    },
  },
};

const CHAT_EXAMPLE = `{"reply": "…", "actions": [{"tool": "set_palette", "args": "{\\"walls\\": \\"#E9E4DA\\", \\"accent\\": \\"#6B7B5A\\"}"}], "variants": [{"name": "Тёплый минимализм", "style": "minimal", "idea": "…"}]}`;

interface ChatReply {
  reply: string;
  actions: { tool: string; args: string }[];
  variants: { name: string; style: StyleId; idea: string }[];
}

// ---------- Исполнение действий ----------

function findRoom(p: Project, ref: unknown) {
  const s = String(ref ?? '').trim().toLowerCase();
  if (!s) return undefined;
  return p.rooms.find((r) => r.id === s) ?? p.rooms.find((r) => r.name.toLowerCase() === s) ?? p.rooms.find((r) => r.name.toLowerCase().includes(s) || s.includes(r.name.toLowerCase()));
}

const isHex = (v: unknown) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
const inRoom = (r: { x: number; y: number; w: number; d: number; level: number }) => (o: { x: number; y: number; level: number }) => o.level === r.level && o.x >= r.x && o.x <= r.x + r.w && o.y >= r.y && o.y <= r.y + r.d;

function variantOf(p: Project, name: string, style: StyleId, palette?: Project['custom']): Project {
  const v: Project = structuredClone(p);
  v.id = uid();
  v.name = `${p.name} — ${name}`;
  v.style = STYLES[style] ? style : p.style;
  v.custom = palette && Object.keys(palette).length ? palette : undefined;
  v.chat = [];
  v.renders = [];
  v.rooms.forEach((r) => {
    delete r.wallColor;
    delete r.floorId;
  });
  v.furniture = furnishProject(v);
  v.lights = lightProject(v);
  v.createdAt = v.updatedAt = Date.now();
  return v;
}

/** Выполняет действия ассистента над текущим проектом, возвращает описание сделанного */
export async function runActions(actions: { tool: string; args: string }[]): Promise<string[]> {
  const done: string[] = [];
  const st = useStore.getState();
  for (const a of actions) {
    let args: Record<string, unknown> = {};
    try {
      args = a.args ? JSON.parse(a.args) : {};
    } catch {
      done.push(`⚠ ${a.tool}: не разобраны параметры`);
      continue;
    }
    const p = useStore.getState().project;
    if (!p) break;
    try {
      const note = await runOne(a.tool, args, p);
      if (note) done.push(note);
    } catch (e) {
      done.push(`⚠ ${a.tool}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  void st;
  return done;
}

async function runOne(tool: string, a: Record<string, unknown>, p: Project): Promise<string | null> {
  const { mutate, addProject, level } = useStore.getState();
  const roomOrThrow = (ref: unknown) => {
    const r = findRoom(p, ref);
    if (!r) throw new Error(`помещение «${String(ref)}» не найдено`);
    return r;
  };
  const roomIds = (list: unknown) => (Array.isArray(list) && list.length ? list.map((x) => roomOrThrow(x).id) : undefined);
  switch (tool) {
    case 'set_style': {
      const s = String(a.style) as StyleId;
      if (!STYLES[s]) throw new Error('неизвестный стиль');
      mutate((pr) => {
        pr.style = s;
        delete pr.custom;
      });
      return `Стиль: ${STYLES[s].name}`;
    }
    case 'set_palette': {
      const c: NonNullable<Project['custom']> = {};
      for (const k of ['walls', 'wood', 'fabric', 'accent', 'metal', 'ceiling'] as const) if (isHex(a[k])) c[k] = String(a[k]);
      if (typeof a.floor === 'string' && FLOORS.some((f) => f.id === a.floor)) c.floor = a.floor;
      if (Number(a.cct) >= 2200 && Number(a.cct) <= 6500) c.cct = Number(a.cct);
      if (typeof a.name === 'string') c.name = a.name.slice(0, 60);
      if (!Object.keys(c).length) throw new Error('нет корректных цветов');
      mutate((pr) => void (pr.custom = { ...pr.custom, ...c }));
      return `Палитра обновлена${c.name ? `: «${c.name}»` : ''}`;
    }
    case 'set_project':
      mutate((pr) => {
        if (typeof a.name === 'string') pr.name = a.name;
        if (typeof a.client === 'string') pr.client = a.client;
        if (typeof a.address === 'string') pr.address = a.address;
        if (a.kind === 'apartment' || a.kind === 'house') pr.kind = a.kind;
        if (Number(a.ceilingHeight) >= 2.2 && Number(a.ceilingHeight) <= 6) {
          pr.ceilingHeight = Number(a.ceilingHeight);
          pr.facts = { ...pr.facts, ceilingHeight: true };
        }
        if (typeof a.residents === 'string') pr.facts = { ...pr.facts, residents: a.residents };
        if (typeof a.budget === 'string') pr.facts = { ...pr.facts, budget: a.budget };
      });
      return 'Параметры проекта обновлены';
    case 'set_concept':
      mutate((pr) => void (pr.concept = String(a.text ?? '')));
      return 'Концепция записана';
    case 'generate_layout': {
      const rooms = (Array.isArray(a.rooms) ? a.rooms : []) as { type: RoomType; name?: string; area: number; level?: number }[];
      const prog = rooms.filter((r) => ROOM_TYPE_LIST.includes(r.type) && Number(r.area) > 0).map((r) => ({ type: r.type, name: r.name, area: Number(r.area), level: r.level }));
      if (!prog.length) throw new Error('пустой список помещений');
      const lay = generateLayout(prog, p.kind);
      mutate((pr) => {
        pr.rooms = lay.rooms;
        pr.openings = lay.openings;
        pr.levels = Math.max(1, ...lay.rooms.map((r) => r.level + 1));
        pr.furniture = [];
        pr.lights = [];
        pr.furniture = furnishProject(pr);
        pr.lights = lightProject(pr);
      });
      return `Построена планировка: ${lay.rooms.length} помещений, мебель и свет расставлены`;
    }
    case 'add_room': {
      const type = (ROOM_TYPE_LIST.includes(a.type as RoomType) ? a.type : 'living') as RoomType;
      const w = Number(a.w);
      const d = Number(a.d);
      if (!(w >= 1 && d >= 1)) throw new Error('размеры помещения должны быть не меньше 1 м');
      mutate((pr) => {
        pr.rooms.push({ id: uid(), name: String(a.name || ROOM_TYPES[type].label), type, level: Number(a.level ?? level) || 0, x: snap(Number(a.x) || 0), y: snap(Number(a.y) || 0), w: snap(w), d: snap(d) });
        pr.levels = Math.max(pr.levels, (Number(a.level) || 0) + 1);
      });
      return `Добавлено помещение «${String(a.name || ROOM_TYPES[type].label)}»`;
    }
    case 'update_room': {
      const r = roomOrThrow(a.room);
      mutate((pr) => {
        const x = pr.rooms.find((y) => y.id === r.id)!;
        if (typeof a.name === 'string') x.name = a.name;
        if (ROOM_TYPE_LIST.includes(a.type as RoomType)) x.type = a.type as RoomType;
        for (const k of ['x', 'y'] as const) if (Number.isFinite(Number(a[k])) && a[k] !== undefined) x[k] = snap(Number(a[k]));
        for (const k of ['w', 'd'] as const) if (Number(a[k]) >= 1) x[k] = snap(Number(a[k]));
        if (Number.isInteger(Number(a.level)) && a.level !== undefined) x.level = Math.max(0, Number(a.level));
        if (isHex(a.wallColor)) x.wallColor = String(a.wallColor);
        if (typeof a.floorId === 'string' && FLOORS.some((f) => f.id === a.floorId)) x.floorId = a.floorId;
        if (typeof a.wallFinish === 'string' && WALL_FINISHES.some((f) => f.id === a.wallFinish)) {
          if (a.wallFinish === 'paint') delete x.wallFinish;
          else x.wallFinish = a.wallFinish;
        }
        if (a.accentWall === null) delete x.accentWall;
        else if (a.accentWall && typeof a.accentWall === 'object') {
          const aw = a.accentWall as { side?: string; finish?: string; color?: string };
          if (['n', 's', 'e', 'w'].includes(String(aw.side)) && WALL_FINISHES.some((f) => f.id === aw.finish))
            x.accentWall = { side: aw.side as WallSide, finish: String(aw.finish), color: isHex(aw.color) ? aw.color : undefined };
        }
        for (const o of pr.openings.filter((oo) => oo.roomId === x.id)) {
          const L = wallLength(x, o.wall);
          o.width = Math.min(o.width, L - 0.1);
          o.offset = round2(clamp(o.offset, 0.05, L - o.width - 0.05));
        }
      });
      return `Изменено помещение «${r.name}»`;
    }
    case 'delete_room': {
      const r = roomOrThrow(a.room);
      mutate((pr) => {
        const f = inRoom(r);
        pr.rooms = pr.rooms.filter((x) => x.id !== r.id);
        pr.openings = pr.openings.filter((o) => o.roomId !== r.id);
        pr.furniture = pr.furniture.filter((x) => !f(x));
        pr.lights = pr.lights.filter((x) => !f(x));
      });
      return `Удалено помещение «${r.name}»`;
    }
    case 'add_opening': {
      const r = roomOrThrow(a.room);
      const wall = (['n', 's', 'e', 'w'].includes(String(a.wall)) ? a.wall : 'n') as WallSide;
      const kind = a.kind === 'window' ? 'window' : 'door';
      const L = wallLength(r, wall);
      const width = clamp(Number(a.width) || (kind === 'door' ? 0.8 : 1.4), 0.5, L - 0.1);
      mutate((pr) =>
        void pr.openings.push({ id: uid(), roomId: r.id, wall, kind, offset: round2(clamp(Number(a.offset) || 0.3, 0.05, L - width - 0.05)), width, height: kind === 'door' ? 2.1 : 1.5, sill: kind === 'door' ? 0 : 0.8 }),
      );
      return `${kind === 'door' ? 'Дверь' : 'Окно'} в «${r.name}»`;
    }
    case 'delete_openings': {
      const r = roomOrThrow(a.room);
      mutate((pr) => void (pr.openings = pr.openings.filter((o) => !(o.roomId === r.id && (!a.wall || o.wall === a.wall) && (!a.kind || o.kind === a.kind)))));
      return `Проёмы удалены в «${r.name}»`;
    }
    case 'furnish': {
      const ids = roomIds(a.rooms);
      mutate((pr) => void (pr.furniture = furnishProject(pr, ids)));
      return ids ? `Мебель расставлена: ${ids.length} пом.` : 'Мебель расставлена во всех помещениях';
    }
    case 'light': {
      const ids = roomIds(a.rooms);
      mutate((pr) => void (pr.lights = lightProject(pr, ids)));
      return ids ? `Освещение рассчитано: ${ids.length} пом.` : 'Освещение рассчитано по нормам';
    }
    case 'add_furniture': {
      const def = furnitureById(String(a.catalogId));
      if (!def) throw new Error(`нет в каталоге: ${String(a.catalogId)}`);
      const r = roomOrThrow(a.room);
      const x = Number.isFinite(Number(a.x)) && a.x !== undefined ? Number(a.x) : r.x + r.w / 2;
      const y = Number.isFinite(Number(a.y)) && a.y !== undefined ? Number(a.y) : r.y + r.d / 2;
      mutate((pr) => void pr.furniture.push({ id: uid(), catalogId: def.id, level: r.level, x: snap(x), y: snap(y), rotation: ((Math.round(Number(a.rotation) || 0) % 360) + 360) % 360, color: isHex(a.color) ? String(a.color) : undefined }));
      return `${def.name} → «${r.name}»`;
    }
    case 'remove_furniture': {
      const r = a.room ? roomOrThrow(a.room) : undefined;
      const before = p.furniture.length;
      mutate((pr) => void (pr.furniture = pr.furniture.filter((f) => !((!r || inRoom(r)(f)) && (!a.catalogId || f.catalogId === a.catalogId)))));
      const n = before - (useStore.getState().project?.furniture.length ?? before);
      return `Убрано предметов мебели: ${n}`;
    }
    case 'recolor_furniture': {
      if (!isHex(a.color)) throw new Error('цвет нужен в HEX');
      const r = a.room ? roomOrThrow(a.room) : undefined;
      mutate((pr) => {
        for (const f of pr.furniture) if ((!r || inRoom(r)(f)) && (!a.catalogId || f.catalogId === a.catalogId)) f.color = String(a.color);
      });
      return `Цвет мебели: ${String(a.color)}`;
    }
    case 'add_light': {
      const def = lightById(String(a.catalogId));
      if (!def) throw new Error(`нет в каталоге: ${String(a.catalogId)}`);
      const r = roomOrThrow(a.room);
      const x = a.x !== undefined ? Number(a.x) : r.x + r.w / 2;
      const y = a.y !== undefined ? Number(a.y) : r.y + r.d / 2;
      mutate((pr) => void pr.lights.push({ id: uid(), catalogId: def.id, level: r.level, x: snap(x), y: snap(y), rotation: 0 }));
      return `${def.name} → «${r.name}»`;
    }
    case 'remove_lights': {
      const r = a.room ? roomOrThrow(a.room) : undefined;
      mutate((pr) => void (pr.lights = pr.lights.filter((l) => !((!r || inRoom(r)(l)) && (!a.catalogId || l.catalogId === a.catalogId)))));
      return 'Светильники убраны';
    }
    case 'recognize_plan': {
      const pk = pageKeys(p.materials ?? []).find((x) => x.key === String(a.page));
      if (!pk) throw new Error(`страница ${String(a.page)} не найдена`);
      const pg = pk.m.pages[pk.i];
      const img = { dataUrl: pg.dataUrl, blob: await pageBlob(pg), w: pg.w, h: pg.h, name: pk.label };
      const lvl = useStore.getState().level;
      if ((await aiMaxImages()) < 1) {
        // ИИ не видит изображений — распознаём по линиям чертежа
        const u = { ...makeUnderlay({ ...img, text: pg.text }, lvl), calibrated: false };
        const res = await buildFromUnderlay(u, lvl);
        mutate((pr) => {
          const old = new Set(pr.rooms.filter((r) => r.level === lvl).map((r) => r.id));
          pr.rooms = pr.rooms.filter((r) => !old.has(r.id)).concat(res.rooms);
          pr.openings = pr.openings.filter((o) => !old.has(o.roomId)).concat(res.openings);
          pr.underlays = (pr.underlays ?? []).filter((x) => x.level !== lvl).concat({ ...u, mPerPx: res.mPerPx, calibrated: true, opacity: 0.45 });
          pr.furniture = furnishProject(pr, res.rooms.map((r) => r.id));
          pr.lights = lightProject(pr, res.rooms.map((r) => r.id));
        });
        return `Распознана планировка по линиям чертежа (${pk.label}): ${res.rooms.length} помещений. ${res.notes}`;
      }
      const plan = await recognizePlan(img, p.kind, '');
      const { rooms, openings } = planToRooms(plan, lvl);
      if (!rooms.length) throw new Error('помещения на странице не найдены');
      mutate((pr) => {
        const old = new Set(pr.rooms.filter((r) => r.level === lvl).map((r) => r.id));
        pr.rooms = pr.rooms.filter((r) => !old.has(r.id)).concat(rooms);
        pr.openings = pr.openings.filter((o) => !old.has(o.roomId)).concat(openings);
        pr.underlays = (pr.underlays ?? []).filter((u) => u.level !== lvl).concat(alignedUnderlay(img, plan, lvl));
        pr.furniture = pr.furniture.filter((f) => f.level !== lvl);
        pr.lights = pr.lights.filter((l) => l.level !== lvl);
        pr.furniture = furnishProject(pr);
        pr.lights = lightProject(pr);
      });
      return `Распознана планировка (${pk.label}): ${rooms.length} помещений, ${openings.length} проёмов`;
    }
    case 'create_variant': {
      const style = (STYLES[a.style as StyleId] ? a.style : p.style) as StyleId;
      const pal = (a.palette && typeof a.palette === 'object' ? a.palette : undefined) as Project['custom'];
      const v = variantOf(p, String(a.name || STYLES[style].name), style, pal);
      if (a.idea) v.concept = String(a.idea) + (p.concept ? '\n' + p.concept : '');
      addProject(v);
      return `Создан вариант «${v.name}» — он в списке проектов`;
    }
  }
  throw new Error('неизвестное действие');
}

export function createVariant(name: string, style: StyleId, idea: string) {
  const p = useStore.getState().project;
  if (!p) return null;
  const v = variantOf(p, name, style);
  v.concept = idea + (p.concept ? '\n' + p.concept : '');
  useStore.getState().addProject(v);
  return v;
}

// ---------- Диалог ----------

function materialsContext(p: Project) {
  const mats = p.materials ?? [];
  if (!mats.length) return 'Материалов и референсов пока нет.';
  const keys = pageKeys(mats);
  const lines = mats.map((m) => {
    const ks = keys.filter((k) => k.m.id === m.id).map((k) => k.key);
    return `• ${m.kind === 'reference' ? 'Референс' : 'Материал'} «${m.name}»${ks.length ? `, страницы ${ks.join(', ')}` : ''}${m.text ? `\n  Текст: ${m.text.slice(0, 3000)}` : ''}`;
  });
  return lines.join('\n').slice(0, 20000);
}

function chatHistory(p: Project): AiTurn[] {
  const turns: AiTurn[] = [];
  for (const m of (p.chat ?? []).slice(-16)) {
    if (m.error) continue;
    const text = m.text + (m.actions?.length ? `\n[Выполнено: ${m.actions.join('; ')}]` : '') + (m.attachments?.length ? `\n[Приложено изображений: ${m.attachments.length}]` : '');
    turns.push({ role: m.role, content: text });
  }
  while (turns.length && turns[0].role !== 'user') turns.shift();
  return turns;
}

function push(msg: Omit<ChatMessage, 'id' | 'at'>) {
  const m: ChatMessage = { ...msg, id: uid(), at: Date.now() };
  useStore.getState().mutate((pr) => void (pr.chat = [...(pr.chat ?? []), m]), { history: false });
  return m;
}

/** Изображения для запроса: приложенные к сообщению + отмеченные страницы материалов */
async function collectImages(p: Project, attachmentIds: string[], extraKeys: string[]) {
  const max = await aiMaxImages();
  const out: { blob: Blob; label: string }[] = [];
  const mats = p.materials ?? [];
  for (const id of attachmentIds) {
    const m = mats.find((x) => x.id === id);
    for (const [i, pg] of (m?.pages ?? []).entries()) out.push({ blob: await pageBlob(pg), label: `вложение «${m!.name}»${m!.pages.length > 1 ? ` стр. ${i + 1}` : ''}` });
  }
  const keys = pageKeys(mats);
  for (const k of extraKeys) {
    const [mid, idx] = k.split(':');
    const m = mats.find((x) => x.id === mid);
    const pg = m?.pages[Number(idx)];
    const key = keys.find((x) => x.m.id === mid && x.i === Number(idx));
    if (pg) out.push({ blob: await pageBlob(pg), label: `${key?.key ?? ''} ${key?.label ?? ''}` });
  }
  return { images: out.slice(0, Math.max(0, max)), dropped: Math.max(0, out.length - max) };
}

export async function sendChat(text: string, attachments: string[] = []) {
  const st = useStore.getState();
  const p = st.project;
  if (!p) return;
  push({ role: 'user', text, attachments });
  const project = useStore.getState().project!;
  const { images, dropped } = await collectImages(project, attachments, st.aiPages);
  const imageNote = images.length ? `\n\nК сообщению приложены изображения по порядку: ${images.map((im, i) => `${i + 1}) ${im.label}`).join('; ')}.` : '';
  const system = `${ROLE}\n\nКаталоги:\n${catalogs()}\n\nТекущий проект (координаты в метрах, x вправо, y вниз):\n${projectContext(project)}\n\nМатериалы проекта:\n${materialsContext(project)}`;
  const turns = chatHistory(project);
  const noVision = dropped > 0 && images.length === 0 && (await aiMaxImages()) === 0;
  const dropNote = noVision
    ? `\n(Служебно: пользователь приложил ${dropped} изображений, но в этом окне ты их не видишь. Честно скажи об этом и попроси описать словами, что нравится: цвета, материалы, мебель, настроение. Планировку можно распознать кнопкой «Распознать помещения» на вкладке «План».)`
    : dropped
      ? `\n(Ещё ${dropped} изображений не поместились в запрос.)`
      : '';
  turns[turns.length - 1] = { role: 'user', content: turns[turns.length - 1].content + imageNote + dropNote };
  try {
    const res = await aiJson<ChatReply>({ system, turns, images: images.map((i) => i.blob), schema: CHAT_SCHEMA, example: CHAT_EXAMPLE, depth: images.length ? 'deep' : 'normal' });
    const actions = Array.isArray(res.actions) ? res.actions.filter((a) => a && typeof a.tool === 'string') : [];
    const done = actions.length ? await runActions(actions) : [];
    push({ role: 'assistant', text: String(res.reply || 'Готово.'), actions: done, variants: (res.variants ?? []).filter((v) => STYLES[v.style]).slice(0, 3) });
  } catch (e) {
    push({ role: 'assistant', text: e instanceof Error ? e.message : String(e), error: true });
  }
}

// ---------- Доделать проект по материалам ----------

interface Analysis {
  summary: string;
  done: string[];
  missing: string[];
  planPage: string;
  kind: 'apartment' | 'house';
  style: StyleId;
  palette: { walls: string; wood: string; fabric: string; accent: string; metal: string };
  concept: string;
  rooms: { type: RoomType; name: string; area: number; level: number }[];
  questions: string[];
  variants: { name: string; style: StyleId; idea: string }[];
}

const ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'done', 'missing', 'planPage', 'kind', 'style', 'palette', 'concept', 'rooms', 'questions', 'variants'],
  properties: {
    summary: { type: 'string' },
    done: { type: 'array', items: { type: 'string' } },
    missing: { type: 'array', items: { type: 'string' } },
    planPage: { type: 'string' },
    kind: { type: 'string', enum: ['apartment', 'house'] },
    style: { type: 'string', enum: STYLE_IDS },
    palette: {
      type: 'object',
      additionalProperties: false,
      required: ['walls', 'wood', 'fabric', 'accent', 'metal'],
      properties: { walls: { type: 'string' }, wood: { type: 'string' }, fabric: { type: 'string' }, accent: { type: 'string' }, metal: { type: 'string' } },
    },
    concept: { type: 'string' },
    rooms: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'name', 'area', 'level'],
        properties: { type: { type: 'string', enum: ROOM_TYPE_LIST }, name: { type: 'string' }, area: { type: 'number' }, level: { type: 'integer' } },
      },
    },
    questions: { type: 'array', items: { type: 'string' } },
    variants: CHAT_SCHEMA.properties.variants,
  },
};

const ANALYSIS_EXAMPLE = `{"summary": "…", "done": ["…"], "missing": ["…"], "planPage": "p2", "kind": "apartment", "style": "japandi",
 "palette": {"walls": "#E7E1D6", "wood": "#A47B53", "fabric": "#D7CDBD", "accent": "#58634B", "metal": "#3A3631"},
 "concept": "…", "rooms": [{"type": "living", "name": "Гостиная", "area": 20, "level": 0}], "questions": ["…"], "variants": [{"name": "…", "style": "minimal", "idea": "…"}]}`;

/** Анализирует все материалы и референсы, достраивает проект и пишет отчёт в чат */
export async function completeFromMaterials(onStep?: (s: string) => void) {
  const p0 = useStore.getState().project;
  if (!p0) return;
  const mats = p0.materials ?? [];
  if (!mats.length) {
    push({ role: 'assistant', text: 'Сначала загрузите материалы: PDF, картинки или скриншоты — во вкладке «Материалы» или прямо в чат.', error: true });
    return;
  }
  push({ role: 'user', text: 'Проанализируй все материалы и доделай проект до конца.' });
  const keys = pageKeys(mats);
  const max = await aiMaxImages();
  // равномерно выбираем страницы, если их больше лимита
  const step = keys.length > max && max > 0 ? keys.length / max : 1;
  const chosen = max > 0 ? Array.from({ length: Math.min(keys.length, max) }, (_, i) => keys[Math.floor(i * step)]) : [];
  try {
    onStep?.('Изучаю материалы…');
    const images = await Promise.all(chosen.map((k) => pageBlob(k.m.pages[k.i])));
    const a = await aiJson<Analysis>({
      system: `${ROLE}\n\nКаталоги:\n${catalogs()}`,
      turns: [
        {
          role: 'user',
          content: `Мне достались материалы незавершённого дизайн-проекта (от прошлого дизайнера) и/или референсы, которые нравятся заказчику. Изучи их и подготовь данные, чтобы довести проект до конца.

Изображения приложены в порядке: ${chosen.map((k, i) => `${i + 1}) ${k.key} — ${k.label}`).join('; ') || 'нет'}.
Все материалы и извлечённый текст:
${materialsContext(p0)}

Текущее состояние проекта: ${projectContext(p0)}

Верни:
- summary — что это за объект и проект, 2–4 предложения;
- done — что уже сделано прежним дизайнером; missing — чего не хватает до полного проекта;
- planPage — ключ страницы (p1, p2…) с самой полной и точной планировкой, или "" если планировки нет;
- kind, style — ближайший пресет; palette — HEX-цвета, извлечённые из материалов/референсов (стены, дерево, текстиль, акцент, металл);
- concept — текст концепции 3–5 абзацев (через \\n), продолжающий идеи прежнего дизайнера и пожелания из референсов;
- rooms — программа помещений с площадями (для построения планировки, если planPage пуст);
- questions — 2–4 вопроса заказчику, ответы на которые улучшат проект;
- variants — 2–3 альтернативных направления дизайна.`,
        },
      ],
      images,
      schema: ANALYSIS_SCHEMA,
      example: ANALYSIS_EXAMPLE,
      depth: 'deep',
    });

    const done: string[] = [];
    const { mutate } = useStore.getState();
    const pal: NonNullable<Project['custom']> = {};
    for (const k of ['walls', 'wood', 'fabric', 'accent', 'metal'] as const) if (isHex(a.palette?.[k])) pal[k] = a.palette[k];
    mutate((pr) => {
      if (a.kind === 'house' || a.kind === 'apartment') pr.kind = a.kind;
      if (STYLES[a.style]) pr.style = a.style;
      pr.custom = Object.keys(pal).length ? { ...pal, name: 'По материалам проекта' } : undefined;
      if (a.concept) pr.concept = a.concept;
    });
    done.push(`Стиль: ${STYLES[a.style]?.name ?? '—'}, палитра из материалов`);

    let planDone = false;
    if (a.planPage && keys.some((k) => k.key === a.planPage)) {
      onStep?.('Распознаю планировку…');
      const res = await runActions([{ tool: 'recognize_plan', args: JSON.stringify({ page: a.planPage }) }]);
      done.push(...res);
      planDone = !res.some((r) => r.startsWith('⚠'));
    }
    if (!planDone && !useStore.getState().project!.rooms.length && a.rooms?.length) {
      onStep?.('Строю планировку…');
      done.push(...(await runActions([{ tool: 'generate_layout', args: JSON.stringify({ rooms: a.rooms }) }])));
    }
    onStep?.('Расставляю мебель и свет…');
    mutate((pr) => {
      pr.furniture = furnishProject(pr);
      pr.lights = lightProject(pr);
    });
    done.push('Мебель расставлена, освещение рассчитано по нормам');

    const text = [
      a.summary,
      a.done?.length ? `\nУже было сделано:\n${a.done.map((x) => '• ' + x).join('\n')}` : '',
      a.missing?.length ? `\nЧего не хватало — доделал:\n${a.missing.map((x) => '• ' + x).join('\n')}` : '',
      a.questions?.length ? `\nЧтобы довести проект до идеала, ответьте, пожалуйста:\n${a.questions.map((x) => '• ' + x).join('\n')}` : '',
      a.variants?.length ? '\nНиже — альтернативные направления, каждое можно создать отдельным проектом.' : '',
    ]
      .filter(Boolean)
      .join('\n');
    push({ role: 'assistant', text, actions: done, variants: (a.variants ?? []).filter((v) => STYLES[v.style]).slice(0, 3) });
  } catch (e) {
    push({ role: 'assistant', text: e instanceof Error ? e.message : String(e), error: true });
  }
}

/** Приветствие для нового диалога */
export function greeting(p: Project): string {
  const hasRooms = p.rooms.length > 0;
  return hasRooms
    ? `Здравствуйте! Я ИИ-дизайнер проекта «${p.name}». Могу поменять стиль и палитру, переставить мебель, пересчитать свет, предложить варианты. Пришлите скриншоты интерьеров, которые вам нравятся (Pinterest, фото) — разберу их и перенесу идеи в проект.`
    : `Здравствуйте! Я ИИ-дизайнер Vitolux. Давайте соберём проект вместе. Пришлите скриншоты интерьеров, которые вам нравятся, и расскажите об объекте: квартира или дом, площадь, сколько комнат, кто будет жить. Если есть план или материалы прошлого дизайнера — загрузите их, я всё изучу.`;
}

/** Проверка проекта после загрузки: ИИ сам изучает, чего не хватает, и задаёт вопросы */
export async function reviewProject(reason: string) {
  const project = useStore.getState().project;
  if (!project) return;
  const system = `${ROLE}\n\nКаталоги:\n${catalogs()}\n\nТекущий проект (координаты в метрах, x вправо, y вниз):\n${projectContext(project)}\n\nМатериалы проекта:\n${materialsContext(project)}`;
  const turns: AiTurn[] = [
    ...chatHistory(project),
    {
      role: 'user',
      content: `[Служебно, не цитируй] ${reason} Изучи проект и материалы. Коротко поприветствуй заказчика, в 2–3 предложениях скажи, что получилось (сколько помещений, площадь, что распознано неуверенно). Затем задай 2–4 самых важных вопроса о недостающих данных — в первую очередь высоту потолков, если ceilingHeightConfirmed = false, затем кто будет жить и сценарии, пожелания по стилю (попроси прислать скриншоты интерьеров, которые нравятся), бюджет. Проект пока не меняй, кроме явных ошибок распознавания (например, неверный тип помещения).`,
    },
  ];
  while (turns.length && turns[0].role !== 'user') turns.shift();
  try {
    const res = await aiJson<ChatReply>({ system, turns, schema: CHAT_SCHEMA, example: CHAT_EXAMPLE });
    const actions = Array.isArray(res.actions) ? res.actions.filter((a) => a && typeof a.tool === 'string') : [];
    const done = actions.length ? await runActions(actions) : [];
    push({ role: 'assistant', text: String(res.reply || ''), actions: done });
  } catch (e) {
    push({ role: 'assistant', text: e instanceof Error ? e.message : String(e), error: true });
  }
}

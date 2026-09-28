import type { ProjectKind, RoomType, StyleId } from '../types';
import { ROOM_TYPE_LIST } from '../data/rooms';
import { STYLES } from '../data/styles';
import { artifactSample, inArtifact, sampleErrorText } from './platform';

export interface AiConcept {
  name: string;
  kind: ProjectKind;
  style: StyleId;
  ceilingHeight: number;
  concept: string;
  rooms: { type: RoomType; name: string; area: number; level: number }[];
}

async function serverAi(): Promise<boolean> {
  try {
    const r = await fetch('/api/health');
    if (!r.ok) return false;
    const j = await r.json();
    return Boolean(j.ai);
  } catch {
    return false;
  }
}

/** Доступен ли AI: сервер с ключом API или Claude через страницу-артефакт */
export async function aiStatus(): Promise<boolean> {
  if (inArtifact()) return (await artifactSample()) !== null;
  return serverAi();
}

const PROMPT = (brief: string, kind: ProjectKind, area: number | null) => `Ты — ведущий дизайнер интерьеров студии Vitolux (Украина). По брифу заказчика сформируй исходные данные дизайн-проекта.

Правила:
- выбери один стиль: scandi (скандинавский), minimal (минимализм), loft (лофт), neoclassic (неоклассика), japandi (джапанди), modern (современный);
- составь программу помещений с реалистичными площадями (спальня 12–18 м², детская 9–14, кухня 8–16, гостиная 16–30, санузел 3–6, гардеробная 3–6). Прихожую/коридор (hall) можно не указывать — коридор строится автоматически;
- типы помещений только из списка: ${ROOM_TYPE_LIST.join(', ')};
- для дома распредели помещения по этажам (level 0 или 1), для квартиры все level = 0;
- если указана общая площадь, сумма площадей помещений на 12–15% меньше неё;
- концепция на русском, 3–5 абзацев, разделённых \\n: идея, настроение, палитра и материалы, сценарии освещения, функциональные решения. Без маркдауна.

Ответь только JSON-объектом такого вида:
{"name": "Короткое название", "kind": "apartment", "style": "scandi", "ceilingHeight": 2.7, "concept": "…", "rooms": [{"type": "living", "name": "Гостиная", "area": 20, "level": 0}]}

Тип объекта: ${kind === 'house' ? 'частный дом (kind = "house")' : 'квартира (kind = "apartment")'}.${area ? ` Общая площадь: ${area} м².` : ''}

Бриф заказчика:
${brief.slice(0, 6000)}`;

function normalize(raw: Partial<AiConcept>, kind: ProjectKind): AiConcept {
  const rooms = (Array.isArray(raw.rooms) ? raw.rooms : [])
    .filter((r) => r && ROOM_TYPE_LIST.includes(r.type) && Number(r.area) > 0)
    .map((r) => ({ type: r.type, name: String(r.name || ''), area: Number(r.area), level: kind === 'house' ? Math.max(0, Math.min(3, Math.round(Number(r.level) || 0))) : 0 }));
  if (!rooms.length) throw new Error('AI не вернул список помещений — попробуйте ещё раз');
  return {
    name: String(raw.name || 'Новый проект'),
    kind,
    style: raw.style && raw.style in STYLES ? raw.style : 'scandi',
    ceilingHeight: Math.min(3.5, Math.max(2.5, Number(raw.ceilingHeight) || (kind === 'house' ? 2.9 : 2.7))),
    concept: String(raw.concept || ''),
    rooms,
  };
}

export async function aiConcept(brief: string, kind: ProjectKind, area: number | null): Promise<AiConcept> {
  if (inArtifact()) {
    const sample = await artifactSample();
    if (!sample) throw new Error('Claude недоступен на этой странице');
    try {
      const raw = await sample.json<Partial<AiConcept>>(PROMPT(brief, kind, area), { cache: false });
      return normalize(raw, kind);
    } catch (e) {
      throw new Error(sampleErrorText(e));
    }
  }
  const r = await fetch('/api/concept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brief, kind, area }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Ошибка сервера (${r.status})`);
  return normalize(j, kind);
}

// Единый транспорт к Claude: сервер (/api/ai, ключ ANTHROPIC_API_KEY) или страница-артефакт claude.ai (capability sample).
import { artifactSample, inArtifact, sampleErrorText } from './platform';

export interface AiTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiRequest {
  /** Постоянные инструкции */
  system: string;
  /** Диалог, заканчивается репликой пользователя */
  turns: AiTurn[];
  /** Изображения к последней реплике пользователя (JPEG) */
  images?: Blob[];
  /** JSON Schema ответа (строго соблюдается на сервере) */
  schema: object;
  /** Пример ответа — подсказка формата для артефакта */
  example: string;
  /** Глубина размышлений */
  depth?: 'normal' | 'deep';
}

type SampleFn = {
  json: <T>(input: AiTurn[], opts?: object) => Promise<T>;
  limits?: () => Promise<{ images?: { maxCount: number } }>;
};

let serverState: Promise<boolean> | null = null;
async function serverAi() {
  if (!serverState)
    serverState = fetch('/api/health')
      .then((r) => (r.ok ? r.json() : { ai: false }))
      .then((j) => Boolean(j.ai))
      .catch(() => false);
  return serverState;
}

export async function aiAvailable(): Promise<boolean> {
  if (inArtifact()) return (await artifactSample()) !== null;
  return serverAi();
}

/** Сколько изображений можно приложить к одному запросу */
export async function aiMaxImages(): Promise<number> {
  if (inArtifact()) {
    const s = (await artifactSample()) as unknown as SampleFn | null;
    const lim = await s?.limits?.().catch(() => null);
    return lim?.images?.maxCount ?? 0;
  }
  return 20;
}

async function toBase64(b: Blob) {
  const buf = new Uint8Array(await b.arrayBuffer());
  let s = '';
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(s);
}

export async function aiJson<T>(req: AiRequest): Promise<T> {
  if (inArtifact()) {
    const sample = (await artifactSample()) as unknown as SampleFn | null;
    if (!sample) throw new Error('Claude недоступен на этой странице');
    const turns = req.turns.map((t) => ({ ...t }));
    // инструкции — ведущей репликой пользователя, формат — в последней
    turns.unshift({ role: 'user', content: req.system });
    turns[turns.length - 1].content += `\n\nОтветь только JSON-объектом такого вида:\n${req.example}`;
    try {
      return await sample.json<T>(turns, {
        cache: false,
        modelTier: req.depth === 'deep' ? 'complex' : 'default',
        ...(req.images?.length ? { images: req.images } : {}),
      });
    } catch (e) {
      throw new Error(sampleErrorText(e));
    }
  }
  const images = await Promise.all((req.images ?? []).map(async (b) => ({ data: await toBase64(b), mediaType: 'image/jpeg' })));
  const r = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system: req.system, turns: req.turns, images, schema: req.schema, effort: req.depth === 'deep' ? 'high' : 'medium' }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Ошибка сервера (${r.status})`);
  return j as T;
}

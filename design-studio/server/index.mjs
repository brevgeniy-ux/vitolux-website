// Сервер Design Studio: AI-концепция (Claude) + раздача собранного фронтенда в production.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

const PORT = Number(process.env.PORT || 8787);
const MODEL = process.env.CLAUDE_MODEL || 'claude-opus-5';
const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const hasKey = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
const client = hasKey ? new Anthropic() : null;

const ROOM_TYPES = ['living', 'kitchen', 'dining', 'bedroom', 'kids', 'office', 'bathroom', 'wc', 'hall', 'wardrobe', 'laundry', 'balcony'];
const STYLES = ['scandi', 'minimal', 'loft', 'neoclassic', 'japandi', 'modern'];

const CONCEPT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'kind', 'style', 'ceilingHeight', 'concept', 'rooms'],
  properties: {
    name: { type: 'string', description: 'Короткое название проекта' },
    kind: { type: 'string', enum: ['apartment', 'house'] },
    style: { type: 'string', enum: STYLES },
    ceilingHeight: { type: 'number', description: 'Высота потолка, м (2.5–3.5)' },
    concept: { type: 'string', description: 'Текст концепции интерьера, 3–5 абзацев через \\n' },
    rooms: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'name', 'area', 'level'],
        properties: {
          type: { type: 'string', enum: ROOM_TYPES },
          name: { type: 'string' },
          area: { type: 'number', description: 'Площадь, м²' },
          level: { type: 'integer', description: 'Этаж: 0 — первый' },
        },
      },
    },
  },
};

const SYSTEM = `Ты — ведущий дизайнер интерьеров студии Vitolux (Украина). По брифу заказчика формируешь исходные данные дизайн-проекта:
- выбираешь один стиль из списка: scandi (скандинавский), minimal (минимализм), loft (лофт), neoclassic (неоклассика), japandi (джапанди), modern (современный);
- составляешь программу помещений с реалистичными площадями по украинским нормам и эргономике (спальня 12–18 м², детская 9–14, кухня 8–16, гостиная 16–30, санузел 3–6, гардеробная 3–6). Прихожую/коридор (hall) можно не указывать — коридор генерируется автоматически;
- для дома распределяешь помещения по этажам (level 0/1), для квартиры все level = 0;
- если указана общая площадь, сумма площадей помещений должна быть примерно на 12–15% меньше неё (остальное — коридоры и стены);
- пишешь концепцию на русском: идея, настроение, палитра и материалы, сценарии освещения, функциональные решения для этой семьи. Без маркдауна.`;

async function concept(body) {
  const { brief, kind, area } = body ?? {};
  if (typeof brief !== 'string' || brief.trim().length < 10) throw Object.assign(new Error('Слишком короткий бриф'), { status: 400 });
  const user = `Тип объекта: ${kind === 'house' ? 'частный дом' : 'квартира'}.${area ? ` Общая площадь: ${area} м².` : ''}\n\nБриф заказчика:\n${brief.slice(0, 6000)}`;
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: CONCEPT_SCHEMA } },
    // при отказе модели запрос автоматически повторяется на рекомендованной резервной модели
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SYSTEM,
    messages: [{ role: 'user', content: user }],
  });
  if (response.stop_reason === 'refusal') throw Object.assign(new Error('Модель отклонила запрос. Переформулируйте бриф.'), { status: 422 });
  if (response.stop_reason === 'max_tokens') throw Object.assign(new Error('Ответ модели оборвался, попробуйте ещё раз.'), { status: 502 });
  const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  const data = JSON.parse(text);
  data.rooms = (data.rooms || []).filter((r) => ROOM_TYPES.includes(r.type) && r.area > 0).map((r) => ({ ...r, level: kind === 'house' ? Math.max(0, Math.min(3, r.level | 0)) : 0 }));
  if (!data.rooms.length) throw Object.assign(new Error('AI не вернул список помещений'), { status: 502 });
  return data;
}

// Универсальный запрос: диалог + изображения + JSON Schema ответа (для чата-ассистента, анализа материалов, распознавания планов)
async function ai(body) {
  const { system, turns, images = [], schema, effort = 'medium' } = body ?? {};
  if (typeof system !== 'string' || !Array.isArray(turns) || !turns.length || typeof schema !== 'object') throw Object.assign(new Error('Некорректный запрос'), { status: 400 });
  if (images.length > 20) throw Object.assign(new Error('Не больше 20 изображений за запрос'), { status: 400 });
  const messages = turns.slice(-30).map((t, i, arr) => {
    const role = t.role === 'assistant' ? 'assistant' : 'user';
    const text = String(t.content ?? '').slice(0, 60000) || '…';
    if (i === arr.length - 1 && role === 'user' && images.length)
      return {
        role,
        content: [
          ...images.map((im) => ({ type: 'image', source: { type: 'base64', media_type: ['image/jpeg', 'image/png', 'image/webp'].includes(im.mediaType) ? im.mediaType : 'image/jpeg', data: String(im.data) } })),
          { type: 'text', text },
        ],
      };
    return { role, content: text };
  });
  if (messages[messages.length - 1].role !== 'user') throw Object.assign(new Error('Последняя реплика должна быть от пользователя'), { status: 400 });
  const response = await client.beta.messages
    .stream({
      model: MODEL,
      max_tokens: 64000,
      thinking: { type: 'adaptive' },
      output_config: { effort: effort === 'high' ? 'high' : 'medium', format: { type: 'json_schema', schema } },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: system.slice(0, 60000),
      messages,
    })
    .finalMessage();
  if (response.stop_reason === 'refusal') throw Object.assign(new Error('Модель отклонила запрос. Переформулируйте его.'), { status: 422 });
  if (response.stop_reason === 'max_tokens') throw Object.assign(new Error('Ответ модели оборвался, попробуйте разбить задачу на части.'), { status: 502 });
  return JSON.parse(response.content.filter((b) => b.type === 'text').map((b) => b.text).join(''));
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon' };

async function serveStatic(req, res) {
  const url = new URL(req.url, 'http://x');
  let file = normalize(join(DIST, decodeURIComponent(url.pathname)));
  if (!file.startsWith(DIST)) return send(res, 403, { error: 'forbidden' });
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
  } catch {
    file = join(DIST, 'index.html');
  }
  try {
    const buf = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(buf);
  } catch {
    res.writeHead(404).end('Сначала выполните npm run build');
  }
}

function send(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let s = '';
    req.on('data', (c) => {
      s += c;
      if (s.length > 40e6) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(s ? JSON.parse(s) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

http
  .createServer(async (req, res) => {
    try {
      if (req.url === '/api/health') return send(res, 200, { ok: true, ai: hasKey, model: MODEL });
      if (req.url === '/api/concept' && req.method === 'POST') {
        if (!client) return send(res, 503, { error: 'AI не настроен: задайте ANTHROPIC_API_KEY' });
        return send(res, 200, await concept(await readJson(req)));
      }
      if (req.url === '/api/ai' && req.method === 'POST') {
        if (!client) return send(res, 503, { error: 'AI не настроен: задайте ANTHROPIC_API_KEY' });
        return send(res, 200, await ai(await readJson(req)));
      }
      if (req.url.startsWith('/api/')) return send(res, 404, { error: 'not found' });
      return serveStatic(req, res);
    } catch (e) {
      console.error(e);
      const status = e.status && e.status < 600 ? e.status : 500;
      return send(res, status, { error: e.message || 'Ошибка сервера' });
    }
  })
  .listen(PORT, () => console.log(`Design Studio API: http://localhost:${PORT}  (AI: ${hasKey ? MODEL : 'выключен'})`));

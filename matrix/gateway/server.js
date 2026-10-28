// Шлюз заявок: POST /hook/<slug> -> сообщение в комнату Matrix от имени бота проекта.
// Без зависимостей, Node 20+.

import http from 'node:http';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { formatLead } from './format.js';

const PORT = Number(process.env.PORT || 8080);
const PROJECTS_FILE = process.env.PROJECTS_FILE || '/data/projects.json';
const HOMESERVER_URL = (process.env.HOMESERVER_URL || 'http://synapse:8008').replace(/\/$/, '');
const MAX_BODY = 256 * 1024;

let config = { projects: {} };

function loadConfig() {
  try {
    const raw = JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
    if (!raw.projects || typeof raw.projects !== 'object') throw new Error('нет поля projects');
    config = raw;
    console.log(`[gateway] загружено проектов: ${Object.keys(config.projects).length}`);
  } catch (e) {
    console.error(`[gateway] не удалось прочитать ${PROJECTS_FILE}: ${e.message}`);
  }
}
loadConfig();
// Перечитываем конфиг при изменении (bootstrap добавил проект) без перезапуска
try { fs.watchFile(PROJECTS_FILE, { interval: 2000 }, loadConfig); } catch {}

function safeEqual(a, b) {
  const ab = Buffer.from(String(a)); const bb = Buffer.from(String(b));
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

function extractSecret(req, url) {
  const h = req.headers['x-hook-secret'];
  if (h) return String(h);
  const auth = req.headers['authorization'];
  if (auth && /^Bearer\s+/i.test(auth)) return auth.replace(/^Bearer\s+/i, '').trim();
  return url.searchParams.get('key') || '';
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) { reject(Object.assign(new Error('payload too large'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function parsePayload(contentType, raw) {
  if (!raw.trim()) return {};
  if (/application\/x-www-form-urlencoded/i.test(contentType || '')) {
    return Object.fromEntries(new URLSearchParams(raw));
  }
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw Object.assign(new Error('ожидается JSON-объект'), { status: 400 });
  return parsed;
}

async function sendToMatrix(project, roomId, content) {
  const txn = `${Date.now()}-${crypto.randomUUID()}`;
  const url = `${HOMESERVER_URL}/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/send/m.room.message/${txn}`;
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${project.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
        signal: AbortSignal.timeout(10_000),
      });
      if (res.ok) return await res.json();
      const text = await res.text();
      lastErr = new Error(`matrix ${res.status}: ${text.slice(0, 200)}`);
      if (res.status === 429) {
        let wait = 1000 * (attempt + 1);
        try { wait = JSON.parse(text).retry_after_ms || wait; } catch {}
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      if (res.status >= 500) { await new Promise((r) => setTimeout(r, 500 * (attempt + 1))); continue; }
      throw lastErr;
    } catch (e) {
      lastErr = e;
      if (attempt === 3) break;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastErr;
}

function json(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && (url.pathname === '/health' || url.pathname === '/hook-health')) {
    return json(res, 200, { ok: true, projects: Object.keys(config.projects).length });
  }

  const m = url.pathname.match(/^\/hook\/([a-z0-9][a-z0-9_-]*)\/?$/i);
  if (!m) return json(res, 404, { error: 'not found' });
  if (req.method !== 'POST') return json(res, 405, { error: 'use POST' });

  const slug = m[1].toLowerCase();
  const project = config.projects[slug];
  if (!project || !project.secret || !safeEqual(extractSecret(req, url), project.secret)) {
    // Одинаковый ответ для неизвестного проекта и неверного ключа
    return json(res, 401, { error: 'unauthorized' });
  }

  try {
    const raw = await readBody(req);
    const payload = parsePayload(req.headers['content-type'], raw);

    const channel = payload.channel ? String(payload.channel) : 'default';
    const roomId = (project.rooms && project.rooms[channel]) || (project.rooms && project.rooms.default) || project.room_id;
    if (!roomId) return json(res, 500, { error: 'у проекта не настроена комната' });

    const { body, formatted_body } = formatLead(payload, project);
    const result = await sendToMatrix(project, roomId, {
      msgtype: 'm.text',
      body,
      format: 'org.matrix.custom.html',
      formatted_body,
      // Сырые данные заявки едут вместе с сообщением: пригодятся кнопкам и поиску
      'ua.vitolux.lead': payload,
    });
    console.log(`[gateway] ${slug}/${channel} -> ${result.event_id}`);
    return json(res, 200, { ok: true, event_id: result.event_id, room_id: roomId });
  } catch (e) {
    const status = e.status || (e instanceof SyntaxError ? 400 : 502);
    if (status >= 500) console.error(`[gateway] ${slug}: ${e.message}`);
    return json(res, status, { error: status === 400 ? 'bad request: ' + e.message : 'delivery failed' });
  }
});

server.listen(PORT, () => console.log(`[gateway] слушаю порт ${PORT}, homeserver ${HOMESERVER_URL}`));

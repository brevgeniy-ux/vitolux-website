// Тесты шлюза: поднимаем фальшивый Matrix и проверяем авторизацию, формат и доставку.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { formatLead, escapeHtml } from './format.js';

const received = [];
let fake, gateway, gwPort;

before(async () => {
  fake = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      received.push({ url: req.url, auth: req.headers.authorization, body: JSON.parse(body) });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ event_id: '$evt' + received.length }));
    });
  });
  await new Promise((r) => fake.listen(0, '127.0.0.1', r));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gw-'));
  const projects = path.join(dir, 'projects.json');
  fs.writeFileSync(projects, JSON.stringify({ projects: {
    naos: { name: 'Наос', secret: 's3cret', access_token: 'tok-naos', rooms: { default: '!naos:x', calls: '!calls:x' } },
  } }));
  gwPort = 20000 + Math.floor(Math.random() * 10000);
  gateway = spawn(process.execPath, ['server.js'], {
    env: { ...process.env, PORT: String(gwPort), PROJECTS_FILE: projects, HOMESERVER_URL: `http://127.0.0.1:${fake.address().port}` },
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  await new Promise((r) => gateway.stdout.on('data', (d) => { if (String(d).includes('слушаю')) r(); }));
});
after(() => { gateway.kill(); fake.close(); });

const post = (p, body, headers = {}) => fetch(`http://127.0.0.1:${gwPort}${p}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body),
});

test('formatLead экранирует HTML и собирает поля', () => {
  const { body, formatted_body } = formatLead({ title: 'Заявка <b>', fields: { Имя: 'Иван' }, phone: '+380' }, { name: 'X' });
  assert.match(body, /Заявка <b>/);
  assert.match(body, /Имя: Иван/);
  assert.match(body, /phone: \+380/);
  assert.match(formatted_body, /Заявка &lt;b&gt;/);
  assert.equal(escapeHtml('<a>"'), '&lt;a&gt;&quot;');
});

test('без секрета или с неверным секретом 401', async () => {
  assert.equal((await post('/hook/naos', { text: 'x' })).status, 401);
  assert.equal((await post('/hook/naos', { text: 'x' }, { 'X-Hook-Secret': 'wrong' })).status, 401);
  assert.equal((await post('/hook/unknown', { text: 'x' }, { 'X-Hook-Secret': 's3cret' })).status, 401);
});

test('заявка доставляется в комнату по умолчанию от имени бота', async () => {
  const res = await post('/hook/naos', { title: 'Новая заявка', fields: { Телефон: '+380501234567' } }, { 'X-Hook-Secret': 's3cret' });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.room_id, '!naos:x');
  const last = received.at(-1);
  assert.match(last.url, /\/rooms\/!naos%3Ax\/send\/m\.room\.message\//);
  assert.equal(last.auth, 'Bearer tok-naos');
  assert.equal(last.body.msgtype, 'm.text');
  assert.match(last.body.body, /Телефон: \+380501234567/);
  assert.match(last.body.formatted_body, /<b>Телефон:<\/b> \+380501234567/);
});

test('channel направляет в другую комнату, ключ можно передать в query', async () => {
  const res = await post('/hook/naos?key=s3cret', { channel: 'calls', text: 'Пропущенный звонок' });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).room_id, '!calls:x');
});

test('form-urlencoded тоже принимается', async () => {
  const res = await fetch(`http://127.0.0.1:${gwPort}/hook/naos`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: 'Bearer s3cret' },
    body: 'name=Олена&phone=%2B380',
  });
  assert.equal(res.status, 200);
  assert.match(received.at(-1).body.body, /name: Олена/);
});

test('битый JSON даёт 400', async () => {
  assert.equal((await post('/hook/naos', '{oops', { 'X-Hook-Secret': 's3cret' })).status, 400);
});

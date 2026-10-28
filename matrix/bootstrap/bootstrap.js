// Первичная настройка сервера: админ, боты, пространства, комнаты, секреты вебхуков.
// Идемпотентен: повторный запуск досоздаёт только то, чего не хватает.
// Запуск: docker compose run --rm bootstrap   (или node bootstrap.js на хосте с нужными env)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const HS = (process.env.HOMESERVER_URL || 'http://localhost:8008').replace(/\/$/, '');
const DOMAIN = required('MATRIX_DOMAIN');
const REG_SECRET = required('REGISTRATION_SHARED_SECRET');
const ADMIN_USER = required('ADMIN_USER').toLowerCase();
const ADMIN_PASSWORD = required('ADMIN_PASSWORD');
const INPUT = process.env.PROJECTS_INPUT || './projects.json';
const OUTPUT = process.env.PROJECTS_OUTPUT || '../data/gateway/projects.json';

function required(name) {
  const v = process.env[name];
  if (!v) { console.error(`Не задана переменная окружения ${name}`); process.exit(1); }
  return v;
}

const randomSecret = (bytes = 24) => crypto.randomBytes(bytes).toString('base64url');
const mxid = (localpart) => `@${localpart}:${DOMAIN}`;

async function api(method, p, { token, body, raw } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !raw) headers['Content-Type'] = 'application/json';
  let res, text, data;
  for (let attempt = 0; ; attempt++) {
    res = await fetch(HS + p, { method, headers, body: raw ? body : body && JSON.stringify(body) });
    text = await res.text();
    data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    // Synapse ограничивает частоту запросов: ждём, сколько он просит, и повторяем
    if (res.status === 429 && attempt < 10) {
      await new Promise((r) => setTimeout(r, (data.retry_after_ms || 2000) + 100));
      continue;
    }
    break;
  }
  if (!res.ok) {
    const err = new Error(`${method} ${p} -> ${res.status} ${data.errcode || ''} ${data.error || text.slice(0, 200)}`);
    err.status = res.status; err.errcode = data.errcode;
    throw err;
  }
  return data;
}

// Регистрация через registration_shared_secret (открытая регистрация выключена)
async function registerUser(localpart, password, admin = false) {
  const { nonce } = await api('GET', '/_synapse/admin/v1/register');
  const mac = crypto.createHmac('sha1', REG_SECRET)
    .update(nonce).update('\0').update(localpart).update('\0').update(password).update('\0')
    .update(admin ? 'admin' : 'notadmin').digest('hex');
  return api('POST', '/_synapse/admin/v1/register', { body: { nonce, username: localpart, password, admin, mac } });
}

async function login(localpart, password) {
  return api('POST', '/_matrix/client/v3/login', {
    body: { type: 'm.login.password', identifier: { type: 'm.id.user', user: localpart }, password, initial_device_display_name: 'bootstrap' },
  });
}

// Возвращает access_token; создаёт пользователя, если его нет
async function ensureUser(localpart, password, admin = false) {
  try {
    const r = await registerUser(localpart, password, admin);
    console.log(`  + пользователь ${mxid(localpart)} создан`);
    return r.access_token;
  } catch (e) {
    if (e.errcode !== 'M_USER_IN_USE') throw e;
    const r = await login(localpart, password);
    return r.access_token;
  }
}

async function setProfile(token, userId, displayname, avatarFile) {
  await api('PUT', `/_matrix/client/v3/profile/${encodeURIComponent(userId)}/displayname`, { token, body: { displayname } });
  if (avatarFile) {
    const file = path.resolve(path.dirname(INPUT), avatarFile);
    if (!fs.existsSync(file)) { console.warn(`  ! аватар ${file} не найден, пропускаю`); return; }
    const ext = path.extname(file).toLowerCase();
    const type = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    const res = await fetch(`${HS}/_matrix/media/v3/upload?filename=${encodeURIComponent(path.basename(file))}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': type }, body: fs.readFileSync(file),
    });
    if (!res.ok) { console.warn(`  ! не удалось загрузить аватар: ${res.status}`); return; }
    const { content_uri } = await res.json();
    await api('PUT', `/_matrix/client/v3/profile/${encodeURIComponent(userId)}/avatar_url`, { token, body: { avatar_url: content_uri } });
  }
}

// Бот приглашает пользователя в комнату (ошибки "уже там" игнорируем)
async function invite(botToken, roomId, userId) {
  try {
    await api('POST', `/_matrix/client/v3/rooms/${encodeURIComponent(roomId)}/invite`, { token: botToken, body: { user_id: userId } });
  } catch (e) {
    if (!/already in the room|already invited|M_FORBIDDEN/i.test(e.message)) throw e;
  }
}

// Администратор принимает приглашение сам (у нас есть его токен)
async function joinAsAdmin(adminToken, roomId) {
  await api('POST', `/_matrix/client/v3/join/${encodeURIComponent(roomId)}`, { token: adminToken, body: {} });
}

// Админский API добавляет сотрудника в комнату без его участия.
// Требует, чтобы администратор уже был в комнате, поэтому его добавляем первым.
async function forceJoin(adminToken, roomId, userId) {
  try {
    await api('POST', `/_synapse/admin/v1/join/${encodeURIComponent(roomId)}`, { token: adminToken, body: { user_id: userId } });
  } catch (e) {
    if (!/already in the room/i.test(e.message)) throw e;
  }
}

async function ensureMembers(botToken, adminToken, roomId, adminId, memberIds) {
  // Сначала пробуем войти (сработает, если админ уже в комнате или приглашён),
  // приглашение шлём только при отказе: повторные приглашения Synapse жёстко лимитирует
  try { await joinAsAdmin(adminToken, roomId); }
  catch { await invite(botToken, roomId, adminId); await joinAsAdmin(adminToken, roomId); }
  for (const u of memberIds) await forceJoin(adminToken, roomId, u);
}

async function createSpace(botToken, name, admins) {
  const r = await api('POST', '/_matrix/client/v3/createRoom', {
    token: botToken,
    body: {
      name, preset: 'private_chat', visibility: 'private',
      creation_content: { type: 'm.space' },
      power_level_content_override: { users: Object.fromEntries(admins.map((u) => [u, 100])) },
      initial_state: [
        { type: 'm.room.history_visibility', state_key: '', content: { history_visibility: 'shared' } },
      ],
    },
  });
  return r.room_id;
}

async function createRoom(botToken, name, spaceId, admins) {
  const r = await api('POST', '/_matrix/client/v3/createRoom', {
    token: botToken,
    body: {
      name, preset: 'private_chat', visibility: 'private',
      power_level_content_override: { users: Object.fromEntries(admins.map((u) => [u, 100])) },
      initial_state: [
        { type: 'm.room.history_visibility', state_key: '', content: { history_visibility: 'shared' } },
        { type: 'm.space.parent', state_key: spaceId, content: { via: [DOMAIN], canonical: true } },
        // Участники пространства могут войти в комнату сами
        { type: 'm.room.join_rules', state_key: '', content: { join_rule: 'restricted', allow: [{ type: 'm.room_membership', room_id: spaceId }] } },
      ],
    },
  });
  await api('PUT', `/_matrix/client/v3/rooms/${encodeURIComponent(spaceId)}/state/m.space.child/${encodeURIComponent(r.room_id)}`, {
    token: botToken, body: { via: [DOMAIN], suggested: true },
  });
  return r.room_id;
}

function loadJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}

async function main() {
  const input = loadJson(INPUT, null);
  if (!input || !Array.isArray(input.projects)) { console.error(`Не удалось прочитать ${INPUT}`); process.exit(1); }

  const state = loadJson(OUTPUT, { homeserver: `https://${DOMAIN}`, users: {}, projects: {} });
  state.users ||= {}; state.projects ||= {};
  const save = () => {
    fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
    fs.writeFileSync(OUTPUT, JSON.stringify(state, null, 2));
    try { fs.chmodSync(OUTPUT, 0o600); } catch {}
  };

  console.log(`Сервер: ${HS} (${DOMAIN})`);
  console.log('Администратор:');
  const adminToken = await ensureUser(ADMIN_USER, ADMIN_PASSWORD, true);
  const adminId = mxid(ADMIN_USER);
  const newUsers = [];

  for (const p of input.projects) {
    if (!/^[a-z0-9][a-z0-9_-]*$/.test(p.slug || '')) { console.error(`Некорректный slug: ${p.slug}`); process.exit(1); }
    console.log(`\nПроект «${p.name}» (${p.slug})`);
    const st = state.projects[p.slug] ||= {};
    st.name = p.name;
    st.secret ||= randomSecret();
    st.rooms ||= {};

    // Бот проекта
    const botLocal = (p.bot || `${p.slug}-bot`).toLowerCase();
    st.bot_user_id = mxid(botLocal);
    st.bot_password ||= randomSecret();
    let botToken = st.access_token;
    if (botToken) {
      try { await api('GET', '/_matrix/client/v3/account/whoami', { token: botToken }); }
      catch { botToken = null; }
    }
    if (!botToken) { botToken = await ensureUser(botLocal, st.bot_password); st.access_token = botToken; }
    await setProfile(botToken, st.bot_user_id, p.bot_name || `${p.name} · Заявки`, p.avatar);
    save();

    // Сотрудники проекта
    const memberIds = [];
    for (const m of p.members || []) {
      const local = String(m).replace(/^@/, '').split(':')[0].toLowerCase();
      if (local === ADMIN_USER) continue;
      if (!state.users[local]) {
        const password = randomSecret(12);
        await ensureUser(local, password);
        state.users[local] = { user_id: mxid(local), initial_password: password };
        newUsers.push([mxid(local), password]);
        save();
      }
      memberIds.push(mxid(local));
    }

    // Пространство
    if (!st.space_id) {
      st.space_id = await createSpace(botToken, p.name, [adminId]);
      console.log(`  + пространство ${st.space_id}`);
      save();
    }
    await ensureMembers(botToken, adminToken, st.space_id, adminId, memberIds);

    // Комнаты
    for (const [key, roomName] of Object.entries(p.rooms || { default: 'Все заявки' })) {
      if (!st.rooms[key]) {
        st.rooms[key] = await createRoom(botToken, roomName, st.space_id, [adminId]);
        console.log(`  + комната «${roomName}» (${key}) ${st.rooms[key]}`);
        save();
      }
      await ensureMembers(botToken, adminToken, st.rooms[key], adminId, memberIds);
    }
    st.room_id = st.rooms.default || Object.values(st.rooms)[0];
    save();
  }

  console.log('\n=== Вебхуки для ваших систем ===');
  for (const [slug, st] of Object.entries(state.projects)) {
    console.log(`\n${st.name}`);
    console.log(`  URL:    https://${DOMAIN}/hook/${slug}`);
    console.log(`  Секрет: ${st.secret}`);
    console.log(`  Каналы: ${Object.keys(st.rooms).join(', ')}`);
  }
  if (newUsers.length) {
    console.log('\n=== Новые сотрудники (пароль показывается один раз, попросите сменить) ===');
    for (const [u, pw] of newUsers) console.log(`  ${u}  ${pw}`);
  }
  console.log(`\nПример отправки заявки:\n  curl -X POST https://${DOMAIN}/hook/${input.projects[0].slug} \\\n    -H "X-Hook-Secret: ${state.projects[input.projects[0].slug].secret}" \\\n    -H "Content-Type: application/json" \\\n    -d '{"title":"Заявка с сайта","fields":{"Имя":"Иван","Телефон":"+380...","Комментарий":"Перезвоните"}}'`);
  console.log(`\nКонфиг шлюза сохранён: ${OUTPUT}`);
}

main().catch((e) => { console.error('\nОшибка:', e.message); process.exit(1); });

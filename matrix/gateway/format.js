// Превращает произвольный JSON заявки в текст и HTML для сообщения Matrix.
// Поддерживаемые поля (все необязательны):
//   title   - заголовок, например "Новая заявка с сайта"
//   text    - готовый текст (переводы строк сохраняются)
//   html    - готовый HTML (если задан, text используется как fallback)
//   fields  - объект "подпись: значение", выводится списком
//   url     - ссылка на заявку в вашей системе
//   source  - откуда пришла заявка (сайт, звонок, форма)
// Все остальные поля верхнего уровня выводятся как "ключ: значение".

const RESERVED = new Set(['title', 'text', 'html', 'fields', 'url', 'source', 'channel']);

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stringify(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function collectFields(payload) {
  const fields = [];
  if (payload.fields && typeof payload.fields === 'object' && !Array.isArray(payload.fields)) {
    for (const [k, v] of Object.entries(payload.fields)) fields.push([k, stringify(v)]);
  }
  for (const [k, v] of Object.entries(payload)) {
    if (!RESERVED.has(k)) fields.push([k, stringify(v)]);
  }
  return fields.filter(([, v]) => v !== '');
}

export function formatLead(payload, project) {
  const title = payload.title ? String(payload.title) : `Новая заявка · ${project.name}`;
  const fields = collectFields(payload);
  const stamp = new Date().toLocaleString('ru-RU', { timeZone: project.timezone || 'Europe/Kyiv' });

  const textLines = [title];
  if (payload.source) textLines.push(`Источник: ${payload.source}`);
  textLines.push('');
  if (payload.text) textLines.push(String(payload.text), '');
  for (const [k, v] of fields) textLines.push(`${k}: ${v}`);
  if (payload.url) textLines.push('', String(payload.url));
  textLines.push('', stamp);
  const body = textLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();

  const html = [];
  html.push(`<h4>${escapeHtml(title)}</h4>`);
  if (payload.source) html.push(`<p><em>Источник: ${escapeHtml(payload.source)}</em></p>`);
  if (payload.html) html.push(String(payload.html));
  else if (payload.text) html.push(`<p>${escapeHtml(payload.text).replace(/\n/g, '<br>')}</p>`);
  if (fields.length) {
    html.push('<ul>' + fields.map(([k, v]) => `<li><b>${escapeHtml(k)}:</b> ${escapeHtml(v)}</li>`).join('') + '</ul>');
  }
  if (payload.url) {
    const u = escapeHtml(payload.url);
    html.push(`<p><a href="${u}">Открыть заявку</a></p>`);
  }
  html.push(`<p><sub>${escapeHtml(stamp)}</sub></p>`);

  return { body, formatted_body: html.join('') };
}

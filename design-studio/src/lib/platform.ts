// Работа в двух окружениях: обычный браузер (npm run dev / npm start) и страница-артефакт claude.ai,
// где скачивание файлов и обращение к Claude идут через window.claude.use(...).

type ClaudeRuntime = { use: (name: string) => Promise<unknown> };

const runtime = (): ClaudeRuntime | null => {
  const c = (window as unknown as { claude?: ClaudeRuntime }).claude;
  return c && typeof c.use === 'function' ? c : null;
};

/** Страница открыта внутри просмотрщика claude.ai */
export const inArtifact = () => runtime() !== null;

export async function capability<T>(name: string): Promise<T | null> {
  const r = runtime();
  if (!r) return null;
  try {
    return ((await r.use(name)) as T) ?? null;
  } catch {
    return null;
  }
}

type Downloads = { save: (req: { filename: string; data: Blob | string }) => Promise<unknown> };

/** Сохранить файл: через capability downloads в артефакте, иначе обычной ссылкой */
export async function saveFile(filename: string, blob: Blob): Promise<void> {
  if (inArtifact()) {
    const dl = await capability<Downloads>('downloads');
    if (!dl) throw new Error('Скачивание файлов недоступно в этом окне');
    try {
      await dl.save({ filename, data: blob });
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === 'declined') return;
      throw new Error(code === 'rate_limited' ? 'Уже открыт запрос на сохранение — подтвердите его' : 'Не удалось сохранить файл');
    }
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// ---------- ZIP без сжатия (для форматов, которые нельзя отдать напрямую, напр. .glb) ----------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Uint8Array) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export async function zipSingle(name: string, data: Blob): Promise<Blob> {
  const bytes = new Uint8Array(await data.arrayBuffer());
  const nameBytes = new TextEncoder().encode(name);
  const crc = crc32(bytes);
  const local = new DataView(new ArrayBuffer(30));
  local.setUint32(0, 0x04034b50, true);
  local.setUint16(4, 20, true);
  local.setUint16(6, 0x0800, true); // UTF-8 имена
  local.setUint32(14, crc, true);
  local.setUint32(18, bytes.length, true);
  local.setUint32(22, bytes.length, true);
  local.setUint16(26, nameBytes.length, true);
  const central = new DataView(new ArrayBuffer(46));
  central.setUint32(0, 0x02014b50, true);
  central.setUint16(4, 20, true);
  central.setUint16(6, 20, true);
  central.setUint16(8, 0x0800, true);
  central.setUint32(16, crc, true);
  central.setUint32(20, bytes.length, true);
  central.setUint32(24, bytes.length, true);
  central.setUint16(28, nameBytes.length, true);
  const cdOffset = 30 + nameBytes.length + bytes.length;
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, 1, true);
  end.setUint16(10, 1, true);
  end.setUint32(12, 46 + nameBytes.length, true);
  end.setUint32(16, cdOffset, true);
  return new Blob([local, nameBytes, bytes, central, nameBytes, end], { type: 'application/zip' });
}

// ---------- Claude внутри артефакта ----------

type Sample = { json: <T>(input: string, opts?: { modelTier?: string; cache?: boolean }) => Promise<T> };

export async function artifactSample(): Promise<Sample | null> {
  const s = await capability<Sample>('sample');
  return s && typeof s.json === 'function' ? s : null;
}

export function sampleErrorText(e: unknown): string {
  const code = (e as { code?: string })?.code;
  switch (code) {
    case 'not_granted':
    case 'sampling_disabled':
      return 'Доступ к Claude для этой страницы не разрешён';
    case 'rate_limited':
      return 'Слишком много запросов — попробуйте через минуту';
    case 'refused':
      return 'Claude отклонил запрос — переформулируйте бриф';
    case 'invalid_json':
      return 'Ответ не удалось разобрать — нажмите «Создать проект» ещё раз';
    case 'session_expired':
      return 'Войдите в claude.ai заново';
    default:
      return e instanceof Error ? e.message : 'Не удалось получить ответ Claude, попробуйте ещё раз';
  }
}

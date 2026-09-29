import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import type { Material } from '../types';
import { STYLES } from '../data/styles';
import { aiAvailable, aiMaxImages } from '../lib/ai';
import { completeFromMaterials, createVariant, greeting, sendChat } from '../lib/assistant';
import { prepareImage } from '../lib/recognize';
import { ACCEPT_MATERIALS, importMaterial } from '../lib/materials';
import { uid } from '../lib/geometry';
import { inArtifact } from '../lib/platform';

const CHIPS = [
  'Предложи 3 варианта дизайна',
  'Какие данные по проекту ещё нужны?',
  'Сделай гостиную уютнее',
  'Проверь освещение и эргономику',
  'Подбери отделку стен во всех помещениях',
];

/** Чат с ИИ-дизайнером: референсы, вопросы, рекомендации и правки проекта */
export function AssistantPanel() {
  const project = useStore((s) => s.project)!;
  const aiPages = useStore((s) => s.aiPages);
  const { setAssistantOpen, mutate, open } = useStore.getState();
  const [text, setText] = useState('');
  const [pending, setPending] = useState<Material[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [ai, setAi] = useState<boolean | null>(null);
  const [over, setOver] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const chat = project.chat ?? [];
  const mats = project.materials ?? [];

  const [vision, setVision] = useState(true);
  useEffect(() => {
    aiAvailable().then(setAi);
    aiMaxImages().then((n) => setVision(n > 0)).catch(() => setVision(false));
  }, []);
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat.length, busy]);

  const addImages = async (files: FileList | File[]) => {
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image/')) {
        // PDF и тексты — как материалы проекта (планировки, альбомы)
        try {
          setBusy(`Читаю «${f.name}»…`);
          const m = await importMaterial(f, (msg) => setBusy(msg));
          setPending((l) => [...l, m]);
        } catch (e) {
          setNote(e instanceof Error ? e.message : String(e));
        } finally {
          setBusy(null);
        }
        continue;
      }
      try {
        const img = await prepareImage(f);
        setPending((l) => [...l, { id: uid(), name: f.name && f.name !== 'image.png' ? f.name : `Референс ${mats.length + l.length + 1}`, kind: 'reference', pages: [{ dataUrl: img.dataUrl, w: img.w, h: img.h }], text: '', addedAt: Date.now() }]);
      } catch {
        /* не изображение — пропускаем */
      }
    }
  };

  const send = async (msg?: string) => {
    const body =
      (msg ?? text).trim() ||
      (pending.some((m) => m.kind !== 'reference') ? 'Вот материалы по проекту (планировка/документы). Изучите их и предложите, как действовать.' : pending.length ? 'Мне нравится вот это. Что скажете и как перенести это в мой проект?' : '');
    if (!body || busy) return;
    const att = pending;
    setText('');
    setPending([]);
    if (att.length) mutate((p) => void (p.materials = [...(p.materials ?? []), ...att]), { history: false });
    setBusy(att.length ? 'Рассматриваю изображения…' : 'Думаю…');
    try {
      await sendChat(body, att.map((m) => m.id));
    } finally {
      setBusy(null);
    }
  };

  const complete = async () => {
    setBusy('Изучаю материалы…');
    try {
      await completeFromMaterials((s) => setBusy(s));
    } finally {
      setBusy(null);
    }
  };

  return (
    <aside
      className={'panel assistant' + (over ? ' over' : '')}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        addImages(e.dataTransfer.files);
      }}
    >
      <header className="assistant-head">
        <b>ИИ-дизайнер</b>
        <span className="muted small">Claude</span>
        <div className="grow" />
        {chat.length > 0 && (
          <button className="link" onClick={() => mutate((p) => void (p.chat = []), { history: false })} title="Очистить диалог">
            очистить
          </button>
        )}
        <button className="close" onClick={() => setAssistantOpen(false)} title="Закрыть">
          ×
        </button>
      </header>

      <div className="chat" ref={listRef}>
        <div className="msg assistant">{greeting(project)}</div>
        {ai === false && (
          <div className="hint warn">
            {inArtifact() ? 'Claude недоступен на этой странице.' : 'ИИ не подключён: запустите сервер с ANTHROPIC_API_KEY (см. .env.example).'}
          </div>
        )}
        {ai && !vision && (
          <div className="hint">
            В этом окне ИИ не видит изображения. Опишите словами, что нравится на скриншотах (цвета, материалы, мебель), а планировку распознайте кнопкой «Распознать помещения» на вкладке «План» — она работает без ИИ.
          </div>
        )}
        {mats.some((m) => m.kind !== 'reference') && (
          <button className="btn full primary" disabled={!!busy || !ai} onClick={complete}>
            Доделать проект по материалам
          </button>
        )}
        {chat.map((m) => (
          <div key={m.id} className={`msg ${m.role}${m.error ? ' error' : ''}`}>
            {m.attachments?.length ? (
              <div className="msg-images">
                {m.attachments.map((id) => {
                  const mat = mats.find((x) => x.id === id);
                  return mat?.pages[0] ? <img key={id} src={mat.pages[0].dataUrl} alt={mat.name} /> : null;
                })}
              </div>
            ) : null}
            <div className="msg-text">{m.text}</div>
            {m.actions?.length ? (
              <ul className="msg-actions">
                {m.actions.map((a, i) => (
                  <li key={i} className={a.startsWith('⚠') ? 'warn' : ''}>
                    {a}
                  </li>
                ))}
              </ul>
            ) : null}
            {m.variants?.length ? (
              <div className="msg-variants">
                {m.variants.map((v, i) => (
                  <div key={i} className="variant">
                    <div className="swatches">
                      {STYLES[v.style].palette.map((c) => (
                        <i key={c} style={{ background: c }} />
                      ))}
                    </div>
                    <b>{v.name}</b>
                    <span className="small">{v.idea}</span>
                    <VariantButton onCreate={() => createVariant(v.name, v.style, v.idea)} onOpen={(id) => open(id)} />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {busy && <div className="msg assistant typing">{busy}</div>}
      </div>

      <div className="chips">
        {CHIPS.map((c) => (
          <button key={c} className="chip" disabled={!!busy || !ai} onClick={() => send(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="composer">
        {pending.length > 0 && (
          <div className="pending">
            {pending.map((m) => (
              <figure key={m.id}>
                {m.pages[0] ? <img src={m.pages[0].dataUrl} alt="" /> : <span className="file-chip">{m.name.slice(0, 10)}</span>}
                {m.pages.length > 1 && <em className="page-count">{m.pages.length} стр.</em>}
                <button onClick={() => setPending((l) => l.filter((x) => x.id !== m.id))}>×</button>
              </figure>
            ))}
          </div>
        )}
        {note && <div className="hint warn">{note}</div>}
        {aiPages.length > 0 && <div className="muted small">+ отмеченных страниц материалов: {aiPages.length}</div>}
        <textarea
          id="assistant-input"
          rows={3}
          value={text}
          disabled={!ai}
          placeholder="Напишите пожелание, вставьте скриншот (Ctrl+V) или перетащите PDF…"
          onChange={(e) => setText(e.target.value)}
          onPaste={(e) => {
            const files = [...e.clipboardData.files];
            if (files.length) {
              e.preventDefault();
              addImages(files);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <div className="composer-row">
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPT_MATERIALS}
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) addImages(e.target.files);
              e.target.value = '';
            }}
          />
          <button className="btn sm" onClick={() => fileRef.current?.click()} disabled={!ai} title="Приложить скриншоты интерьеров, планировку или материалы (PDF)">
            📎 Файлы
          </button>
          <div className="grow" />
          <button className="btn sm primary" onClick={() => send()} disabled={!!busy || !ai || (!text.trim() && !pending.length)}>
            Отправить
          </button>
        </div>
      </div>
    </aside>
  );
}

function VariantButton({ onCreate, onOpen }: { onCreate: () => { id: string } | null; onOpen: (id: string) => void }) {
  const [id, setId] = useState<string | null>(null);
  return id ? (
    <button className="btn sm" onClick={() => onOpen(id)}>
      Открыть вариант
    </button>
  ) : (
    <button className="btn sm" onClick={() => setId(onCreate()?.id ?? null)}>
      Создать вариант
    </button>
  );
}

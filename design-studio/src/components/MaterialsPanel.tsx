import { useRef, useState } from 'react';
import { useStore } from '../store';
import { ACCEPT_MATERIALS, importMaterial } from '../lib/materials';
import { makeUnderlay } from '../lib/recognize';
import { runActions } from '../lib/assistant';

/** Материалы проекта: работы прошлого дизайнера, планы, референсы */
export function MaterialsPanel() {
  const project = useStore((s) => s.project)!;
  const level = useStore((s) => s.level);
  const aiPages = useStore((s) => s.aiPages);
  const { mutate, toggleAiPage, setAssistantOpen } = useStore.getState();
  const mats = project.materials ?? [];
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ text: string; warn?: boolean } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (files: FileList | File[]) => {
    setBusy(true);
    const errors: string[] = [];
    for (const f of Array.from(files)) {
      try {
        const m = await importMaterial(f, (msg) => setStatus({ text: msg }));
        mutate((p) => void (p.materials = [...(p.materials ?? []), m]), { history: false });
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }
    setBusy(false);
    setStatus(errors.length ? { text: errors.join(' '), warn: true } : { text: 'Материалы загружены. Отметьте страницы, которые нужно показать ИИ, или попросите ИИ доделать проект.' });
  };

  const asUnderlay = (mid: string, i: number) => {
    const m = mats.find((x) => x.id === mid)!;
    const pg = m.pages[i];
    mutate((p) => {
      p.underlays = (p.underlays ?? []).filter((u) => u.level !== level);
      p.underlays.push(makeUnderlay({ dataUrl: pg.dataUrl, blob: new Blob(), w: pg.w, h: pg.h, name: m.name }, level));
    });
    useStore.getState().setTool('calibrate');
    setStatus({ text: 'Страница поставлена подложкой на вкладке «План». Задайте масштаб по известному размеру.' });
  };

  const recognize = async (mid: string, i: number) => {
    const keyIndex = mats.slice(0, mats.findIndex((x) => x.id === mid)).reduce((s, m) => s + m.pages.length, 0) + i + 1;
    setBusy(true);
    setStatus({ text: 'Claude распознаёт планировку… обычно 30–90 секунд.' });
    const res = await runActions([{ tool: 'recognize_plan', args: JSON.stringify({ page: `p${keyIndex}` }) }]);
    setBusy(false);
    setStatus({ text: res.join(' '), warn: res.some((r) => r.startsWith('⚠')) });
  };

  return (
    <div className="panel-scroll">
      <input ref={fileRef} type="file" accept={ACCEPT_MATERIALS} multiple hidden onChange={(e) => {
          if (e.target.files) upload(e.target.files);
          e.target.value = '';
        }} />
      <div
        className="upload-drop small-drop"
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          upload(e.dataTransfer.files);
        }}
      >
        <b>Загрузить материалы</b>
        <br />
        <span className="small">PDF, картинки, скриншоты, тексты — всё от прошлого дизайнера и референсы</span>
      </div>
      {busy && <div className="hint">{status?.text ?? 'Загрузка…'}</div>}
      {!busy && status && <div className={'hint' + (status.warn ? ' warn' : '')}>{status.text}</div>}
      {mats.length > 0 && (
        <button className="btn full primary" onClick={() => setAssistantOpen(true)}>
          Обсудить с ИИ-дизайнером
        </button>
      )}
      {mats.map((m) => (
        <div key={m.id} className="material">
          <div className="material-head">
            <b title={m.name}>{m.kind === 'reference' ? '★ ' : ''}{m.name}</b>
            <button className="link danger" onClick={() => mutate((p) => void (p.materials = (p.materials ?? []).filter((x) => x.id !== m.id)), { history: false })}>
              ×
            </button>
          </div>
          {m.kind === 'text' && <p className="muted small clamp">{m.text.slice(0, 240)}</p>}
          <div className="pages">
            {m.pages.map((pg, i) => {
              const key = `${m.id}:${i}`;
              const sel = aiPages.includes(key);
              return (
                <figure key={i} className={sel ? 'sel' : ''}>
                  <img src={pg.dataUrl} alt="" onClick={() => setPreview(pg.dataUrl)} />
                  <figcaption>
                    <label title="Показать эту страницу ИИ в следующем сообщении">
                      <input type="checkbox" checked={sel} onChange={() => toggleAiPage(key)} /> ИИ
                    </label>
                    <span>{i + 1}</span>
                  </figcaption>
                  <div className="page-actions">
                    <button className="link" onClick={() => asUnderlay(m.id, i)}>подложка</button>
                    <button className="link" disabled={busy} onClick={() => recognize(m.id, i)}>план</button>
                  </div>
                </figure>
              );
            })}
          </div>
        </div>
      ))}
      {preview && (
        <div className="modal-back" onClick={() => setPreview(null)}>
          <img className="preview-img" src={preview} alt="" />
        </div>
      )}
    </div>
  );
}

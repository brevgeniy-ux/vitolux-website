import { useEffect, useRef, useState } from 'react';
import type { Project, ProjectKind, RoomType, StyleId } from '../types';
import { useStore } from '../store';
import { STYLE_LIST } from '../data/styles';
import { ROOM_TYPES, ROOM_TYPE_LIST } from '../data/rooms';
import { DEFAULT_PROGRAM, TEMPLATES, emptyProject, projectFromProgram, projectFromTemplate, type ProgramItem } from '../lib/layout';
import { furnishProject } from '../lib/autoFurnish';
import { lightProject } from '../lib/lighting';
import { aiConcept, aiStatus } from '../lib/api';
import { aiMaxImages } from '../lib/ai';
import { buildFromUnderlay } from '../lib/localRecognize';
import { inArtifact } from '../lib/platform';
import { ACCEPT_MATERIALS, fileToImages, importMaterial } from '../lib/materials';
import { completeFromMaterials, reviewProject, sendChat } from '../lib/assistant';
import type { Material } from '../types';
import { projectFromUploads, recognizePlan, type PreparedImage, type RecognizedPlan } from '../lib/recognize';

type Mode = 'chat' | 'upload' | 'materials' | 'template' | 'program' | 'ai' | 'blank';

export function finalize(p: Project, furnish: boolean, light: boolean) {
  if (furnish) p.furniture = furnishProject(p);
  if (light) p.lights = lightProject(p);
  return p;
}

export function NewProjectWizard({ onClose }: { onClose: () => void }) {
  const create = useStore((s) => s.create);
  const [mode, setMode] = useState<Mode>('chat');
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [kind, setKind] = useState<ProjectKind>('apartment');
  const [style, setStyle] = useState<StyleId>('scandi');
  const [tpl, setTpl] = useState(TEMPLATES[1].id);
  const [program, setProgram] = useState<ProgramItem[]>(DEFAULT_PROGRAM);
  const [brief, setBrief] = useState('');
  const [area, setArea] = useState<string>('');
  const [furnish, setFurnish] = useState(true);
  const [light, setLight] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [aiOk, setAiOk] = useState<boolean | null>(null);
  const [aiImages, setAiImages] = useState(false);
  const [images, setImages] = useState<PreparedImage[]>([]);
  const [autoRecognize, setAutoRecognize] = useState(true);
  const [progress, setProgress] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [materials, setMaterials] = useState<Material[]>([]);

  const addMaterials = async (files: FileList | File[]) => {
    setErr(null);
    for (const f of Array.from(files)) {
      try {
        const m = await importMaterial(f, (msg) => setProgress(msg));
        if (mode === 'chat' && m.kind === 'image') m.kind = 'reference';
        setMaterials((l) => [...l, m]);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    }
    setProgress(null);
  };

  const addFiles = async (files: FileList | File[]) => {
    setErr(null);
    for (const f of Array.from(files)) {
      try {
        const imgs = await fileToImages(f, (msg) => setProgress(msg));
        setImages((l) => [...l, ...imgs]);
        setProgress(null);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    }
  };

  useEffect(() => {
    aiStatus().then(setAiOk);
    aiMaxImages().then((n) => setAiImages(n > 0)).catch(() => setAiImages(false));
  }, []);

  const submit = async () => {
    setErr(null);
    let p: Project;
    try {
      if (mode === 'upload') {
        if (!images.length) throw new Error('Загрузите хотя бы одно изображение планировки');
        setBusy(true);
        const floors: { img: PreparedImage; plan?: RecognizedPlan }[] = [];
        const failed: string[] = [];
        for (let i = 0; i < images.length; i++) {
          let plan: RecognizedPlan | undefined;
          if (autoRecognize && aiOk && aiImages) {
            setProgress(images.length > 1 ? `Распознаю ${i + 1} этаж из ${images.length}… обычно 30–90 секунд` : 'Распознаю планировку… обычно 30–90 секунд');
            try {
              plan = await recognizePlan(images[i], kind, brief);
              if (!plan.rooms?.length) throw new Error('помещения не найдены');
            } catch (e) {
              plan = undefined;
              failed.push(`${images.length > 1 ? `${i + 1} эт.: ` : ''}${e instanceof Error ? e.message : String(e)}`);
            }
          }
          floors.push({ img: images[i], plan });
        }
        const res = projectFromUploads(kind, style, name, floors);
        p = res.project;
        if (failed.length) p.notes = (p.notes ? p.notes + ' ' : '') + 'Не распознано автоматически: ' + failed.join('; ');
        p.client = client;
        const recognized = floors.some((f) => f.plan);
        create(finalize(p, furnish && recognized, light && recognized));
        const st = useStore.getState();
        st.setView('plan');
        onClose();
        if (!recognized) {
          // распознавание по линиям чертежа — без ИИ
          for (const u of p.underlays ?? []) {
            try {
              const res = await buildFromUnderlay(u, u.level);
              st.mutate((pr) => {
                pr.rooms = pr.rooms.filter((r) => r.level !== u.level).concat(res.rooms);
                pr.openings = pr.openings.concat(res.openings);
                const x = pr.underlays?.find((y) => y.id === u.id);
                if (x) Object.assign(x, { mPerPx: res.mPerPx, calibrated: true, crop: res.crop, opacity: 0.45 });
                pr.furniture = furnishProject(pr);
                pr.lights = lightProject(pr);
              });
            } catch {
              /* масштаб или помещения не определились — пользователь продолжит в блоке «Планировка заказчика» */
            }
          }
          st.setView('split');
        }
        if (aiOk && recognized) {
          st.setAssistantOpen(true);
          reviewProject('Проект только что создан из загруженной заказчиком планировки.');
        }
        return;
      } else if (mode === 'materials') {
        if (!materials.length) throw new Error('Загрузите материалы: PDF, изображения или тексты');
        p = emptyProject(kind, style);
        p.name = name || 'Проект по материалам';
        p.client = client;
        p.materials = materials;
        create(p);
        const st = useStore.getState();
        st.setAssistantOpen(true);
        onClose();
        if (aiOk) completeFromMaterials();
        return;
      } else if (mode === 'chat') {
        p = emptyProject(kind, style);
        p.name = name || 'Новый проект';
        p.client = client;
        p.materials = materials;
        create(p);
        const st = useStore.getState();
        st.setAssistantOpen(true);
        onClose();
        if (aiOk) {
          const refs = materials.filter((m) => m.kind === 'reference');
          const docs = materials.filter((m) => m.kind !== 'reference');
          (async () => {
            // планировка и документы — полный разбор с распознаванием плана, затем диалог
            if (docs.length) await completeFromMaterials();
            if (brief.trim() || refs.length) await sendChat(brief.trim() || 'Вот интерьеры, которые мне нравятся. Что скажете и как перенести это в проект?', refs.map((m) => m.id));
          })();
        }
        return;
      } else if (mode === 'template') {
        p = projectFromTemplate(tpl, style);
      } else if (mode === 'program') {
        if (!program.length) throw new Error('Добавьте хотя бы одно помещение');
        p = projectFromProgram(program, kind, style);
        p.kind = kind;
      } else if (mode === 'ai') {
        if (brief.trim().length < 10) throw new Error('Опишите задачу подробнее');
        setBusy(true);
        const c = await aiConcept(brief, kind, area ? parseFloat(area) : null);
        p = projectFromProgram(c.rooms, c.kind, c.style, c.name);
        p.concept = c.concept;
        p.ceilingHeight = c.ceilingHeight || p.ceilingHeight;
        p.notes = brief;
      } else {
        p = emptyProject(kind, style);
      }
      if (name) p.name = name;
      p.client = client;
      create(finalize(p, furnish && mode !== 'blank', light && mode !== 'blank'));
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const totalArea = program.reduce((s, r) => s + r.area, 0);

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>Новый дизайн-проект</h2>
          <button className="close" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="modal-body">
          <div className="row2">
            <label className="field">
              <span>Название проекта</span>
              <input value={name} placeholder="Например: Квартира на Печерске" onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="field">
              <span>Заказчик</span>
              <input value={client} onChange={(e) => setClient(e.target.value)} />
            </label>
          </div>

          <div className="seg">
            {(
              [
                ['chat', 'Диалог с ИИ'],
                ['upload', 'Своя планировка'],
                ['materials', 'Материалы дизайнера'],
                ['template', 'Типовая'],
                ['program', 'По списку'],
                ['ai', 'Бриф'],
                ['blank', 'С нуля'],
              ] as [Mode, string][]
            ).map(([m, l]) => (
              <button key={m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>
                {l}
              </button>
            ))}
          </div>

          {(mode === 'chat' || mode === 'materials') && (
            <div>
              <p className="muted small" style={{ marginTop: 0 }}>
                {mode === 'chat'
                  ? 'Расскажите об объекте и приложите скриншоты интерьеров, которые нравятся (Pinterest, фото), и планировку — картинкой или PDF. ИИ-дизайнер разберёт всё, задаст вопросы и будет строить проект вместе с вами.'
                  : 'Загрузите всё, что осталось от прежнего дизайнера: PDF-альбомы, планы, коллажи, визуализации, тексты ТЗ. ИИ изучит материалы, распознает планировку, продолжит концепцию, доделает проект и предложит варианты.'}
              </p>
              <div
                className={'upload-drop' + (over ? ' over' : '')}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(true);
                }}
                onDragLeave={() => setOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setOver(false);
                  addMaterials(e.dataTransfer.files);
                }}
              >
                <b>{mode === 'chat' ? 'Перетащите скриншоты, планировку или PDF сюда' : 'Перетащите материалы сюда'}</b> или нажмите, чтобы выбрать
                <br />
                <span className="small">{mode === 'chat' ? 'Скриншоты (JPG, PNG, WebP), планировка или материалы в PDF' : 'PDF, JPG, PNG, WebP, TXT — можно много файлов сразу'}</span>
              </div>
              <input ref={fileRef} type="file" accept={ACCEPT_MATERIALS} multiple hidden onChange={(e) => {
                  if (e.target.files) addMaterials(e.target.files);
                  e.target.value = '';
                }} />
              {materials.length > 0 && (
                <div className="upload-list">
                  {materials.map((m) => (
                    <figure key={m.id}>
                      {m.pages[0] ? <img src={m.pages[0].dataUrl} alt={m.name} /> : <div className="text-thumb">{m.text.slice(0, 120)}</div>}
                      <figcaption>
                        <span title={m.name}>
                          {m.pages.length > 1 ? `${m.pages.length} стр. · ` : ''}
                          {m.name.slice(0, 22)}
                        </span>
                        <button className="link danger" onClick={() => setMaterials((l) => l.filter((x) => x.id !== m.id))}>
                          ×
                        </button>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
              {mode === 'chat' && (
                <label className="field" style={{ marginTop: 12 }}>
                  <span>Первое сообщение ИИ-дизайнеру</span>
                  <textarea rows={3} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Квартира 72 м² в новостройке, живём вдвоём с собакой, хочется светло и тепло, как на скриншотах…" />
                </label>
              )}
              {aiOk === false && <div className="hint warn">ИИ недоступен{inArtifact() ? ' на этой странице' : ': запустите сервер с ANTHROPIC_API_KEY'} — проект создастся, но без анализа.</div>}
            </div>
          )}

          {mode === 'upload' && (
            <div>
              <div
                className={'upload-drop' + (over ? ' over' : '')}
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(true);
                }}
                onDragLeave={() => setOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setOver(false);
                  addFiles(e.dataTransfer.files);
                }}
              >
                <b>Перетащите сюда изображение планировки</b> или нажмите, чтобы выбрать файл
                <br />
                <span className="small">Чертёж БТИ, план от застройщика, скан, фото или рисунок от руки · PDF, JPG, PNG, WebP · для дома — по странице на этаж (лишние страницы PDF удалите крестиком)</span>
              </div>
              <input ref={fileRef} type="file" accept="application/pdf,.pdf,image/*" multiple hidden onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = '';
                }} />
              {images.length > 0 && (
                <div className="upload-list">
                  {images.map((im, i) => (
                    <figure key={i}>
                      <img src={im.dataUrl} alt={im.name} />
                      <figcaption>
                        <span>{images.length > 1 ? `${i + 1} этаж` : im.name}</span>
                        <button className="link danger" onClick={() => setImages((l) => l.filter((_, j) => j !== i))}>
                          ×
                        </button>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              )}
              <label className="field" style={{ marginTop: 12 }}>
                <span>Подсказка для распознавания (необязательно)</span>
                <input value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Например: общая площадь 64 м², ширина гостиной 4,2 м" />
              </label>
              {aiOk && aiImages ? (
                <label className="check">
                  <input type="checkbox" checked={autoRecognize} onChange={(e) => setAutoRecognize(e.target.checked)} /> Распознать помещения, двери и окна автоматически (Claude)
                </label>
              ) : (
                <p className="muted small">
                  {aiOk ? 'ИИ в этом окне не может смотреть изображения, поэтому' : 'ИИ не подключён, поэтому'} план распознается по линиям чертежа: система сама найдёт план на листе, масштаб и названия возьмёт из экспликации в PDF. Если таблицы площадей нет, после создания попросит ввести общую площадь.
                </p>
              )}
              <p className="muted small">После создания изображение остаётся подложкой под планом — по нему удобно проверить и поправить размеры.</p>
            </div>
          )}

          {mode === 'template' && (
            <div className="tpl-grid">
              {TEMPLATES.map((t) => (
                <button key={t.id} className={'tpl' + (tpl === t.id ? ' active' : '')} onClick={() => setTpl(t.id)}>
                  <b>{t.name}</b>
                  <span>{t.description}</span>
                </button>
              ))}
            </div>
          )}

          {mode !== 'template' && (
            <div className="seg small">
              <button className={kind === 'apartment' ? 'active' : ''} onClick={() => setKind('apartment')}>
                Квартира
              </button>
              <button className={kind === 'house' ? 'active' : ''} onClick={() => setKind('house')}>
                Дом
              </button>
            </div>
          )}

          {mode === 'program' && (
            <div className="program">
              {program.map((it, i) => (
                <div key={i} className="program-row">
                  <select value={it.type} onChange={(e) => setProgram((p) => p.map((x, j) => (j === i ? { ...x, type: e.target.value as RoomType } : x)))}>
                    {ROOM_TYPE_LIST.map((t) => (
                      <option key={t} value={t}>
                        {ROOM_TYPES[t].label}
                      </option>
                    ))}
                  </select>
                  <input type="number" value={it.area} min={1} step={0.5} onChange={(e) => setProgram((p) => p.map((x, j) => (j === i ? { ...x, area: parseFloat(e.target.value) || 0 } : x)))} />
                  <em>м²</em>
                  {kind === 'house' && (
                    <select value={it.level ?? ''} onChange={(e) => setProgram((p) => p.map((x, j) => (j === i ? { ...x, level: e.target.value === '' ? undefined : +e.target.value } : x)))}>
                      <option value="">этаж — авто</option>
                      <option value="0">1 этаж</option>
                      <option value="1">2 этаж</option>
                    </select>
                  )}
                  <button className="link" onClick={() => setProgram((p) => p.filter((_, j) => j !== i))}>
                    ×
                  </button>
                </div>
              ))}
              <div className="program-foot">
                <button className="btn sm" onClick={() => setProgram((p) => [...p, { type: 'bedroom', area: 12 }])}>
                  + помещение
                </button>
                <span className="muted small">Жилые и подсобные: {totalArea.toFixed(1)} м² + коридор генерируется автоматически</span>
              </div>
            </div>
          )}

          {mode === 'ai' && (
            <div>
              {aiOk === false && (
                <div className="hint warn">
                  {inArtifact() ? (
                    'Claude недоступен на этой странице.'
                  ) : (
                    <>
                      AI-сервер недоступен. Запустите <code>npm run dev</code> (или <code>npm start</code>) с переменной окружения <code>ANTHROPIC_API_KEY</code>.
                    </>
                  )}
                </div>
              )}
              <label className="field">
                <span>Опишите объект и пожелания</span>
                <textarea
                  rows={6}
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  placeholder="Семья из 4 человек, двое детей 6 и 10 лет. Хотим светлый интерьер с деревом, кабинет для удалённой работы, большую кухню-гостиную для гостей, гардеробную у спальни. Бюджет средний…"
                />
              </label>
              <label className="field inline">
                <span>Общая площадь (необязательно)</span>
                <input type="number" value={area} onChange={(e) => setArea(e.target.value)} style={{ width: 100 }} />
              </label>
              <p className="muted small">{inArtifact() ? 'Запрос выполняется от вашего аккаунта Claude. ' : ''}AI (Claude) подберёт стиль, состав и площади помещений и напишет текст концепции. Планировка, мебель и свет строятся автоматически.</p>
            </div>
          )}

          {mode !== 'ai' && mode !== 'chat' && mode !== 'materials' && (
            <>
              <h4>Стиль</h4>
              <div className="style-grid">
                {STYLE_LIST.map((s) => (
                  <button key={s.id} className={'style-chip' + (s.id === style ? ' active' : '')} onClick={() => setStyle(s.id)}>
                    <span className="swatches">
                      {s.palette.map((c) => (
                        <i key={c} style={{ background: c }} />
                      ))}
                    </span>
                    {s.name}
                  </button>
                ))}
              </div>
            </>
          )}

          {mode !== 'blank' && mode !== 'chat' && mode !== 'materials' && (
            <div className="checks">
              <label>
                <input type="checkbox" checked={furnish} onChange={(e) => setFurnish(e.target.checked)} /> Автоматически расставить мебель
              </label>
              <label>
                <input type="checkbox" checked={light} onChange={(e) => setLight(e.target.checked)} /> Рассчитать освещение по нормам
              </label>
            </div>
          )}
          {progress && <div className="hint">{progress}</div>}
          {err && <div className="hint warn">{err}</div>}
        </div>
        <footer>
          <button className="btn" onClick={onClose}>
            Отмена
          </button>
          <button className="btn primary" disabled={busy} onClick={submit}>
            {busy ? (mode === 'upload' ? 'Распознаю…' : 'AI готовит концепцию…') : 'Создать проект'}
          </button>
        </footer>
      </div>
    </div>
  );
}

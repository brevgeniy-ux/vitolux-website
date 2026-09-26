import { useEffect, useState } from 'react';
import type { Project, ProjectKind, RoomType, StyleId } from '../types';
import { useStore } from '../store';
import { STYLE_LIST } from '../data/styles';
import { ROOM_TYPES, ROOM_TYPE_LIST } from '../data/rooms';
import { DEFAULT_PROGRAM, TEMPLATES, emptyProject, projectFromProgram, projectFromTemplate, type ProgramItem } from '../lib/layout';
import { furnishProject } from '../lib/autoFurnish';
import { lightProject } from '../lib/lighting';
import { aiConcept, aiStatus } from '../lib/api';

type Mode = 'template' | 'program' | 'ai' | 'blank';

export function finalize(p: Project, furnish: boolean, light: boolean) {
  if (furnish) p.furniture = furnishProject(p);
  if (light) p.lights = lightProject(p);
  return p;
}

export function NewProjectWizard({ onClose }: { onClose: () => void }) {
  const create = useStore((s) => s.create);
  const [mode, setMode] = useState<Mode>('template');
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

  useEffect(() => {
    aiStatus().then(setAiOk);
  }, []);

  const submit = async () => {
    setErr(null);
    let p: Project;
    try {
      if (mode === 'template') {
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
                ['template', 'Типовая планировка'],
                ['program', 'По списку помещений'],
                ['ai', 'AI-бриф'],
                ['blank', 'С нуля'],
              ] as [Mode, string][]
            ).map(([m, l]) => (
              <button key={m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>
                {l}
              </button>
            ))}
          </div>

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

          {(mode === 'program' || mode === 'ai' || mode === 'blank') && (
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
                  AI-сервер недоступен. Запустите <code>npm run dev</code> (или <code>npm start</code>) с переменной окружения <code>ANTHROPIC_API_KEY</code>.
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
              <p className="muted small">AI (Claude) подберёт стиль, состав и площади помещений и напишет текст концепции. Планировка, мебель и свет строятся автоматически.</p>
            </div>
          )}

          {mode !== 'ai' && (
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

          {mode !== 'blank' && (
            <div className="checks">
              <label>
                <input type="checkbox" checked={furnish} onChange={(e) => setFurnish(e.target.checked)} /> Автоматически расставить мебель
              </label>
              <label>
                <input type="checkbox" checked={light} onChange={(e) => setLight(e.target.checked)} /> Рассчитать освещение по нормам
              </label>
            </div>
          )}
          {err && <div className="hint warn">{err}</div>}
        </div>
        <footer>
          <button className="btn" onClick={onClose}>
            Отмена
          </button>
          <button className="btn primary" disabled={busy} onClick={submit}>
            {busy ? 'AI готовит концепцию…' : 'Создать проект'}
          </button>
        </footer>
      </div>
    </div>
  );
}

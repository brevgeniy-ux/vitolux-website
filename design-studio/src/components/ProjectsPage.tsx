import { useRef, useState } from 'react';
import { useStore } from '../store';
import type { Project } from '../types';
import { STYLES } from '../data/styles';
import { buildEstimate, money, num } from '../lib/estimate';
import { uid } from '../lib/geometry';
import { NewProjectWizard, finalize } from './NewProjectWizard';
import { Plan } from './Plan';
import { projectFromTemplate } from '../lib/layout';

export function ProjectsPage() {
  const projects = useStore((s) => s.projects);
  const { open, remove, duplicate, create } = useStore.getState();
  const [wizard, setWizard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const importFile = async (f: File) => {
    try {
      const p = JSON.parse(await f.text()) as Project;
      if (!Array.isArray(p.rooms)) throw new Error('bad');
      create({ ...p, id: uid(), updatedAt: Date.now() });
    } catch {
      setError('Не удалось прочитать файл проекта: нужен .json, сохранённый в Design Studio');
    }
  };

  return (
    <div className="projects-page">
      <header className="hero">
        <div>
          <div className="brand-lg">
            <span className="logo">◆</span> Vitolux <b>Design Studio</b>
          </div>
          <h1>Дизайн-проекты квартир и домов с 3D-визуализацией</h1>
          <p>
            Планировка → автоматическая расстановка мебели → расчёт освещения по нормам → 3D-рендеры → альбом чертежей, спецификации и смета. Всё в одном месте.
          </p>
          <div className="btn-row">
            <button className="btn primary lg" onClick={() => setWizard(true)}>
              + Новый проект
            </button>
            <button
              className="btn lg"
              onClick={() => {
                const p = finalize(projectFromTemplate('apt-2', 'japandi'), true, true);
                p.name = 'Демо: 2-комнатная, джапанди';
                create(p);
              }}
            >
              Открыть демо
            </button>
            <button className="btn lg" onClick={() => fileRef.current?.click()}>
              Импорт JSON
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
          </div>
        </div>
        <ol className="steps">
          <li>
            <b>Планировка</b>шаблон, список помещений, AI-бриф или ручное черчение
          </li>
          <li>
            <b>Наполнение</b>мебель и сантехника по эргономике, 6 стилей
          </li>
          <li>
            <b>Свет</b>светотехнический расчёт, каталог Vitolux
          </li>
          <li>
            <b>3D</b>день/вечер, виды из помещений, рендеры, экспорт GLB
          </li>
          <li>
            <b>Документация</b>альбом листов А4 → PDF, смета CSV
          </li>
        </ol>
      </header>

      {error && <div className="hint warn">{error}</div>}
      <section className="project-grid">
        {projects.length === 0 && <div className="empty">Проектов пока нет — создайте первый или откройте демо.</div>}
        {projects.map((p) => {
          const est = buildEstimate(p);
          return (
            <article key={p.id} className="project-card" onClick={() => open(p.id)}>
              <div className="card-img">{p.renders[0] ? <img src={p.renders[0].dataUrl} alt="" /> : <Plan project={p} level={0} mode="furniture" fixedViewBox />}</div>
              <div className="card-body">
                <b>{p.name}</b>
                <span className="muted small">
                  {p.kind === 'house' ? 'Дом' : 'Квартира'} · {num(est.area, 1)} м² · {STYLES[p.style].name}
                </span>
                <span className="muted small">
                  {money(est.total)} · изм. {new Date(p.updatedAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
              <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                <button className="link" onClick={() => duplicate(p.id)}>
                  копия
                </button>
                {confirmId === p.id ? (
                  <>
                    <button className="link danger" onClick={() => remove(p.id)}>
                      да, удалить
                    </button>
                    <button className="link" onClick={() => setConfirmId(null)}>
                      отмена
                    </button>
                  </>
                ) : (
                  <button className="link danger" onClick={() => setConfirmId(p.id)}>
                    удалить
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>
      {wizard && <NewProjectWizard onClose={() => setWizard(false)} />}
    </div>
  );
}

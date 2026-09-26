import type { ReactNode } from 'react';
import { useStore } from '../store';
import type { Project } from '../types';
import { STYLES } from '../data/styles';
import { furnitureById } from '../data/furniture';
import { lightById } from '../data/lights';
import { floorById } from '../data/materials';
import { buildEstimate, money, num, toCSV, type EstimateLine } from '../lib/estimate';
import { luxReport, lightsInRoom, UF, MF } from '../lib/lighting';
import { Plan, type PlanMode } from './Plan';
import { LightSymbol } from './PlanSymbols';
import { download } from './View3D';

let sheetNo = 0;

function Sheet({ project, title, children, total }: { project: Project; title: string; children: ReactNode; total: number }) {
  sheetNo++;
  return (
    <section className="sheet">
      <div className="sheet-content">{children}</div>
      <footer className="stamp">
        <div className="stamp-brand">
          VITOLUX
          <br />
          <small>Design Studio</small>
        </div>
        <div className="stamp-project">
          <small>Объект</small>
          {project.name}
          {project.address && <small>{project.address}</small>}
        </div>
        <div className="stamp-title">
          <small>Лист</small>
          {title}
        </div>
        <div className="stamp-no">
          <small>№</small>
          {sheetNo} / {total}
        </div>
        <div className="stamp-date">
          <small>Дата</small>
          {new Date(project.updatedAt).toLocaleDateString('ru-RU')}
        </div>
      </footer>
    </section>
  );
}

const PLAN_SHEETS: { mode: PlanMode; title: string; note: string }[] = [
  { mode: 'measure', title: 'Обмерный план', note: 'Размеры помещений даны по осям стен, площади — по внутреннему контуру. Толщина перегородок условно 100 мм.' },
  { mode: 'furniture', title: 'План расстановки мебели', note: 'Габариты мебели и оборудования указаны в спецификации. Перед заказом корпусной мебели выполнить контрольный обмер.' },
  { mode: 'lighting', title: 'План освещения', note: 'Высота установки подвесных светильников — от уровня чистого пола. Группы включения согласовать с заказчиком.' },
  { mode: 'floors', title: 'План напольных покрытий', note: 'Раскладку плитки и направление укладки доски уточнить по месту. Порожки на стыках покрытий — скрытые.' },
];

export function ProjectDoc() {
  const project = useStore((s) => s.project)!;
  const mutate = useStore((s) => s.mutate);
  const style = STYLES[project.style];
  const est = buildEstimate(project);
  const levels = [...new Set(project.rooms.map((r) => r.level))].sort();
  const totalArea = est.area;
  const renders = project.renders;
  const renderPages = Math.ceil(renders.length / 2);
  type EstRow = { kind: 'section'; name: string; total: number } | { kind: 'line'; line: EstimateLine } | { kind: 'sum'; name: string; total: number; bold: boolean };
  const estRows: EstRow[] = [
    ...est.sections.flatMap((sec): EstRow[] => [{ kind: 'section', name: sec.name, total: sec.total }, ...sec.lines.map((line): EstRow => ({ kind: 'line', line }))]),
    { kind: 'sum', name: 'ИТОГО по проекту', total: est.total, bold: true },
    { kind: 'sum', name: 'Стоимость на 1 м²', total: est.total / Math.max(1, est.area), bold: false },
  ];
  const ROWS_PER_SHEET = 27;
  const estChunks = Array.from({ length: Math.ceil(estRows.length / ROWS_PER_SHEET) }, (_, i) => estRows.slice(i * ROWS_PER_SHEET, (i + 1) * ROWS_PER_SHEET));
  const total = 2 + levels.length * PLAN_SHEETS.length + 1 + 1 + 1 + estChunks.length + renderPages;
  sheetNo = 0;

  const furnGroups = new Map<string, number>();
  for (const f of project.furniture) furnGroups.set(f.catalogId, (furnGroups.get(f.catalogId) ?? 0) + 1);
  const lightGroups = new Map<string, number>();
  for (const l of project.lights) lightGroups.set(l.catalogId, (lightGroups.get(l.catalogId) ?? 0) + 1);
  const totalWatts = project.lights.reduce((s, l) => s + (lightById(l.catalogId)?.watts ?? 0), 0);

  const concept =
    project.concept ||
    `Интерьер выполнен в стиле «${style.name.toLowerCase()}». ${style.description} Цветовая температура основного света — ${style.cct} K, ` +
      `что создаёт ${style.cct <= 2700 ? 'тёплую, камерную' : style.cct <= 3000 ? 'тёплую и уютную' : 'нейтральную, рабочую'} атмосферу. ` +
      `Общая площадь помещений — ${num(totalArea, 1)} м². Освещение спроектировано многоуровневым: общий свет по нормативу, ` +
      `акцентный и декоративный свет для создания сценариев.`;

  return (
    <div className="docs">
      <div className="docs-toolbar no-print">
        <b>Альбом дизайн-проекта</b> · {total} листов
        <span className="sep" />
        <button className="btn sm primary" onClick={() => window.print()}>
          Печать / сохранить PDF
        </button>
        <button className="btn sm" onClick={() => download(`${project.name}-смета.csv`, new Blob([toCSV(project)], { type: 'text/csv;charset=utf-8' }))}>
          Смета CSV (Excel)
        </button>
        <button className="btn sm" onClick={() => download(`${project.name}.json`, new Blob([JSON.stringify(project)], { type: 'application/json' }))}>
          Файл проекта JSON
        </button>
      </div>

      <Sheet project={project} title="Титульный лист" total={total}>
        <div className="cover">
          <div className="cover-text">
            <div className="kicker">Дизайн-проект интерьера</div>
            <h1>{project.name}</h1>
            <p>
              {project.kind === 'house' ? 'Жилой дом' : 'Квартира'} · {num(totalArea, 1)} м² · {project.rooms.length} помещений
              {levels.length > 1 ? ` · ${levels.length} этажа` : ''}
            </p>
            <p>Стиль: {style.name}</p>
            {project.client && <p>Заказчик: {project.client}</p>}
            {project.address && <p>Адрес: {project.address}</p>}
            <ol className="toc">
              <li>Концепция и цветовая палитра</li>
              <li>Обмерный план, план мебели, план освещения, план полов</li>
              <li>Экспликация и ведомость отделки</li>
              <li>Спецификации мебели и освещения</li>
              <li>Смета</li>
              <li>3D-визуализации</li>
            </ol>
          </div>
          <div className="cover-img">{renders[0] ? <img src={renders[0].dataUrl} alt="" /> : <div className="plan-box">
                <Plan project={project} level={levels[0] ?? 0} mode="furniture" fixedViewBox className="doc-plan" />
              </div>}</div>
        </div>
      </Sheet>

      <Sheet project={project} title="Концепция" total={total}>
        <h2>Концепция интерьера</h2>
        <div className="concept">
          <div>
            {concept.split('\n').map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div>
            <h3>Цветовая палитра</h3>
            <div className="palette">
              {style.palette.map((c) => (
                <div key={c}>
                  <i style={{ background: c }} />
                  <span>{c.toUpperCase()}</span>
                </div>
              ))}
            </div>
            <h3>Материалы</h3>
            <ul className="materials">
              {[...new Set(est.finishes.map((f) => f.floorId))].map((id) => {
                const f = floorById(id);
                return (
                  <li key={id}>
                    <i style={{ background: f.base }} />
                    {f.name}
                  </li>
                );
              })}
            </ul>
            <h3>Свет</h3>
            <p>
              Цветовая температура {style.cct} K, индекс цветопередачи Ra ≥ 90. Установленная мощность освещения — {totalWatts} Вт ({num(totalWatts / Math.max(1, totalArea), 1)} Вт/м²).
            </p>
          </div>
        </div>
      </Sheet>

      {levels.flatMap((lvl) =>
        PLAN_SHEETS.map((ps) => (
          <Sheet key={`${lvl}-${ps.mode}`} project={project} title={`${ps.title}${levels.length > 1 ? `, ${lvl + 1} этаж` : ''}`} total={total}>
            <h2>
              {ps.title}
              {levels.length > 1 ? ` — ${lvl + 1} этаж` : ''}
            </h2>
            <div className={ps.mode === 'lighting' ? 'plan-with-table' : 'plan-only'}>
              <div className="plan-box">
                <Plan project={project} level={lvl} mode={ps.mode} fixedViewBox className="doc-plan" />
              </div>
              {ps.mode === 'lighting' && (
                <table className="tbl small">
                  <thead>
                    <tr>
                      <th>Помещение</th>
                      <th>Норма, лк</th>
                      <th>Расчёт, лк</th>
                      <th>Вт</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.rooms
                      .filter((r) => r.level === lvl)
                      .map((r) => {
                        const lx = luxReport(project, r);
                        return (
                          <tr key={r.id} className={lx.ok ? '' : 'warn'}>
                            <td>{r.name}</td>
                            <td>{lx.norm}</td>
                            <td>{lx.lux}</td>
                            <td>{lx.watts}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
            {ps.mode === 'lighting' && (
              <div className="legend">
                {[...new Set(project.lights.filter((l) => l.level === lvl).map((l) => l.catalogId))].map((id) => (
                  <span key={id}>
                    <svg viewBox="-0.3 -0.3 0.6 0.6" width={20} height={20}>
                      <g transform={`scale(${Math.min(2.5, 0.45 / Math.max(0.2, lightById(id)!.size))})`}>
                        <LightSymbol def={lightById(id)!} />
                      </g>
                    </svg>
                    {lightById(id)!.name}
                  </span>
                ))}
              </div>
            )}
            <p className="note">{ps.note}</p>
          </Sheet>
        )),
      )}

      <Sheet project={project} title="Экспликация и ведомость отделки" total={total}>
        <h2>Экспликация помещений и ведомость отделки</h2>
        <table className="tbl">
          <thead>
            <tr>
              <th>№</th>
              <th>Помещение</th>
              <th>Этаж</th>
              <th>Площадь, м²</th>
              <th>Периметр, м</th>
              <th>Стены</th>
              <th>Окраска, м²</th>
              <th>Плитка, м²</th>
              <th>Пол</th>
              <th>Плинтус, м</th>
            </tr>
          </thead>
          <tbody>
            {est.finishes.map((f, i) => (
              <tr key={f.room.id}>
                <td>{i + 1}</td>
                <td>{f.room.name}</td>
                <td>{f.room.level + 1}</td>
                <td>{num(f.area)}</td>
                <td>{num(f.perimeter)}</td>
                <td>
                  <i className="dot" style={{ background: f.wallColor }} /> {f.wallColor.toUpperCase()}
                </td>
                <td>{num(f.paintArea)}</td>
                <td>{num(f.tileArea)}</td>
                <td>{f.floorName}</td>
                <td>{num(f.baseboard)}</td>
              </tr>
            ))}
            <tr className="total">
              <td colSpan={3}>Итого</td>
              <td>{num(totalArea)}</td>
              <td>{num(est.finishes.reduce((s, f) => s + f.perimeter, 0))}</td>
              <td />
              <td>{num(est.finishes.reduce((s, f) => s + f.paintArea, 0))}</td>
              <td>{num(est.finishes.reduce((s, f) => s + f.tileArea, 0))}</td>
              <td />
              <td>{num(est.finishes.reduce((s, f) => s + f.baseboard, 0))}</td>
            </tr>
          </tbody>
        </table>
        <p className="note">Потолки — {STYLES[project.style].ceiling.toUpperCase()}, высота {num(project.ceilingHeight)} м. Площади стен даны за вычетом проёмов.</p>
      </Sheet>

      <Sheet project={project} title="Спецификация мебели" total={total}>
        <h2>Спецификация мебели и оборудования</h2>
        <table className="tbl">
          <thead>
            <tr>
              <th>№</th>
              <th>Наименование</th>
              <th>Категория</th>
              <th>Габариты Ш×Г×В, см</th>
              <th>Кол-во</th>
              <th>Цена</th>
              <th>Сумма</th>
            </tr>
          </thead>
          <tbody>
            {[...furnGroups].map(([id, n], i) => {
              const d = furnitureById(id)!;
              return (
                <tr key={id}>
                  <td>{i + 1}</td>
                  <td>{d.name}</td>
                  <td>{d.category}</td>
                  <td>
                    {Math.round(d.w * 100)}×{Math.round(d.d * 100)}×{Math.round(d.h * 100)}
                  </td>
                  <td>{n}</td>
                  <td>{money(d.price)}</td>
                  <td>{money(d.price * n)}</td>
                </tr>
              );
            })}
            <tr className="total">
              <td colSpan={6}>Итого</td>
              <td>{money([...furnGroups].reduce((s, [id, n]) => s + furnitureById(id)!.price * n, 0))}</td>
            </tr>
          </tbody>
        </table>
      </Sheet>

      <Sheet project={project} title="Спецификация освещения" total={total}>
        <h2>Спецификация светильников</h2>
        <table className="tbl">
          <thead>
            <tr>
              <th>№</th>
              <th>Наименование</th>
              <th>Тип</th>
              <th>Поток, лм</th>
              <th>Мощн., Вт</th>
              <th>IP</th>
              <th>Кол-во</th>
              <th>Цена</th>
              <th>Сумма</th>
            </tr>
          </thead>
          <tbody>
            {[...lightGroups].map(([id, n], i) => {
              const d = lightById(id)!;
              return (
                <tr key={id}>
                  <td>{i + 1}</td>
                  <td>{d.name}</td>
                  <td>{d.category}</td>
                  <td>{d.lumens}</td>
                  <td>{d.watts}</td>
                  <td>IP{d.ip}</td>
                  <td>{n}</td>
                  <td>{money(d.price)}</td>
                  <td>{money(d.price * n)}</td>
                </tr>
              );
            })}
            <tr className="total">
              <td colSpan={4}>Итого</td>
              <td>{totalWatts}</td>
              <td />
              <td>{project.lights.length}</td>
              <td />
              <td>{money([...lightGroups].reduce((s, [id, n]) => s + lightById(id)!.price * n, 0))}</td>
            </tr>
          </tbody>
        </table>
        <h3>Светотехнический расчёт по помещениям</h3>
        <table className="tbl small">
          <thead>
            <tr>
              <th>Помещение</th>
              <th>Площадь, м²</th>
              <th>Светильников</th>
              <th>Поток, лм</th>
              <th>E расч., лк</th>
              <th>E норм., лк</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {project.rooms.map((r) => {
              const lx = luxReport(project, r);
              return (
                <tr key={r.id} className={lx.ok ? '' : 'warn'}>
                  <td>{r.name}</td>
                  <td>{num(lx.area)}</td>
                  <td>{lightsInRoom(project, r).length}</td>
                  <td>{lx.lumens}</td>
                  <td>{lx.lux}</td>
                  <td>{lx.norm}</td>
                  <td>{lx.ok ? 'соответствует' : 'ниже нормы'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="note">
          Расчёт методом коэффициента использования: E = Φ·η·Kз / S, η = {UF}, Kз = {MF}. Нормы освещённости — по ДБН В.2.5-28. Бра, торшеры и LED-ленты учтены с коэффициентом 0,5.
        </p>
      </Sheet>

      {estChunks.map((rows, ci) => (
        <Sheet key={'est' + ci} project={project} title={estChunks.length > 1 ? `Смета (${ci + 1}/${estChunks.length})` : 'Смета'} total={total}>
          <h2>Сводная смета{ci > 0 ? ' (продолжение)' : ''}</h2>
          <table className="tbl small">
            <thead>
              <tr>
                <th>Наименование</th>
                <th>Ед.</th>
                <th>Кол-во</th>
                <th>Цена</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) =>
                r.kind === 'section' ? (
                  <tr key={i} className="section">
                    <td colSpan={4}>{r.name}</td>
                    <td>{money(r.total)}</td>
                  </tr>
                ) : r.kind === 'line' ? (
                  <tr key={i}>
                    <td>{r.line.name}</td>
                    <td>{r.line.unit}</td>
                    <td>{num(r.line.qty)}</td>
                    <td>{money(r.line.price)}</td>
                    <td>{money(r.line.total)}</td>
                  </tr>
                ) : (
                  <tr key={i} className={r.bold ? 'total' : ''}>
                    <td colSpan={4}>{r.name}</td>
                    <td>{money(r.total)}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
          {ci === estChunks.length - 1 && <p className="note">Цены ориентировочные, в гривнах. Итоговая стоимость уточняется после выбора конкретных позиций и замера.</p>}
        </Sheet>
      ))}

      {Array.from({ length: renderPages }).map((_, i) => (
        <Sheet key={'r' + i} project={project} title="Визуализации" total={total}>
          <h2>3D-визуализации</h2>
          <div className="renders">
            {renders.slice(i * 2, i * 2 + 2).map((r) => (
              <figure key={r.id}>
                <img src={r.dataUrl} alt={r.title} />
                <figcaption>
                  <input className="caption-input" value={r.title} onChange={(e) => mutate((p) => void (p.renders.find((x) => x.id === r.id)!.title = e.target.value), { history: false })} />
                  <button className="link no-print" onClick={() => mutate((p) => void (p.renders = p.renders.filter((x) => x.id !== r.id)))}>
                    удалить
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        </Sheet>
      ))}
      {renders.length === 0 && (
        <div className="empty-renders no-print">
          Визуализаций пока нет. Откройте 3D-вид, выберите ракурс и нажмите <b>📷 Рендер</b> — изображение попадёт в альбом.
        </div>
      )}
    </div>
  );
}

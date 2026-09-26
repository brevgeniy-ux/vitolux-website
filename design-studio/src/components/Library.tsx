import { useState } from 'react';
import { useStore, type Tool } from '../store';
import { FURNITURE, type FurnitureDef } from '../data/furniture';
import { LIGHTS, type LightDef } from '../data/lights';
import { ROOM_TYPES } from '../data/rooms';
import { money, num } from '../lib/estimate';
import { roomArea } from '../lib/geometry';
import { FurnitureSymbol, LightSymbol } from './PlanSymbols';

const TOOLS: { id: Tool; label: string; hint: string }[] = [
  { id: 'select', label: 'Выбор', hint: 'Выбор и перемещение (V)' },
  { id: 'room', label: 'Помещение', hint: 'Нарисовать помещение протяжкой (M)' },
  { id: 'door', label: 'Дверь', hint: 'Клик по стене помещения (D)' },
  { id: 'window', label: 'Окно', hint: 'Клик по стене помещения (W)' },
];

function Thumb({ def }: { def: FurnitureDef }) {
  const s = Math.max(def.w, def.d) * 1.15;
  return (
    <svg viewBox={`${-s / 2} ${-s / 2} ${s} ${s}`} className="thumb">
      <FurnitureSymbol def={def} />
    </svg>
  );
}

function LThumb({ def }: { def: LightDef }) {
  const s = Math.max(0.3, def.size * 1.2);
  return (
    <svg viewBox={`${-s / 2} ${-s / 2} ${s} ${s}`} className="thumb">
      <LightSymbol def={def} />
    </svg>
  );
}

export function Library() {
  const [tab, setTab] = useState<'plan' | 'furniture' | 'light'>('plan');
  const [q, setQ] = useState('');
  const project = useStore((s) => s.project)!;
  const tool = useStore((s) => s.tool);
  const level = useStore((s) => s.level);
  const placing = useStore((s) => s.placing);
  const selection = useStore((s) => s.selection);
  const { setTool, setPlacing, select } = useStore.getState();

  const furn = FURNITURE.filter((f) => !q || f.name.toLowerCase().includes(q.toLowerCase()) || f.category.toLowerCase().includes(q.toLowerCase()));
  const cats = [...new Set(furn.map((f) => f.category))];

  return (
    <aside className="panel left">
      <div className="tabs">
        <button className={tab === 'plan' ? 'active' : ''} onClick={() => setTab('plan')}>
          План
        </button>
        <button className={tab === 'furniture' ? 'active' : ''} onClick={() => setTab('furniture')}>
          Мебель
        </button>
        <button className={tab === 'light' ? 'active' : ''} onClick={() => setTab('light')}>
          Свет
        </button>
      </div>

      {tab === 'plan' && (
        <div className="panel-scroll">
          <div className="tool-grid">
            {TOOLS.map((t) => (
              <button key={t.id} title={t.hint} className={'tool' + (tool === t.id && !placing ? ' active' : '')} onClick={() => setTool(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          <p className="muted small">
            {tool === 'room' && 'Протяните мышью прямоугольник на плане. Края притягиваются к соседним помещениям.'}
            {tool === 'door' && 'Кликните внутри помещения рядом с нужной стеной.'}
            {tool === 'window' && 'Кликните внутри помещения рядом с наружной стеной.'}
            {tool === 'select' && 'Перетаскивайте помещения, мебель и проёмы. Колесо — масштаб, Shift/ПКМ + тянуть — сдвиг плана.'}
          </p>
          <h4>Помещения</h4>
          <ul className="room-list">
            {project.rooms
              .filter((r) => r.level === level)
              .map((r) => (
                <li key={r.id} className={selection?.kind === 'room' && selection.id === r.id ? 'active' : ''} onClick={() => select({ kind: 'room', id: r.id })}>
                  <i style={{ background: ROOM_TYPES[r.type].planColor }} />
                  <span>{r.name}</span>
                  <em>{num(roomArea(r), 1)} м²</em>
                </li>
              ))}
          </ul>
          <div className="muted small">
            Итого на этаже: <b>{num(project.rooms.filter((r) => r.level === level).reduce((s, r) => s + roomArea(r), 0), 1)} м²</b>
          </div>
        </div>
      )}

      {tab === 'furniture' && (
        <div className="panel-scroll">
          <input className="search" placeholder="Поиск…" value={q} onChange={(e) => setQ(e.target.value)} />
          {placing?.kind === 'furniture' && <div className="hint">Кликните на плане, чтобы поставить предмет. Esc — отмена.</div>}
          {cats.map((c) => (
            <div key={c}>
              <h4>{c}</h4>
              <div className="cat-grid">
                {furn
                  .filter((f) => f.category === c)
                  .map((f) => (
                    <button key={f.id} className={'cat-item' + (placing?.catalogId === f.id ? ' active' : '')} onClick={() => setPlacing({ kind: 'furniture', catalogId: f.id })} title={`${f.name}\n${Math.round(f.w * 100)}×${Math.round(f.d * 100)} см`}>
                      <Thumb def={f} />
                      <span>{f.name}</span>
                      <em>{money(f.price)}</em>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'light' && (
        <div className="panel-scroll">
          {placing?.kind === 'light' && <div className="hint">Кликните на плане, чтобы установить светильник.</div>}
          <div className="cat-grid">
            {LIGHTS.map((l) => (
              <button key={l.id} className={'cat-item' + (placing?.catalogId === l.id ? ' active' : '')} onClick={() => setPlacing({ kind: 'light', catalogId: l.id })} title={l.name}>
                <LThumb def={l} />
                <span>{l.name}</span>
                <em>
                  {l.lumens} лм · {money(l.price)}
                </em>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

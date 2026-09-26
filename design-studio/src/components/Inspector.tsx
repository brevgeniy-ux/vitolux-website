import type { FurnitureItem, LightItem, Opening, Project, Room, RoomType, StyleId } from '../types';
import { useStore } from '../store';
import { ROOM_TYPES, ROOM_TYPE_LIST } from '../data/rooms';
import { STYLE_LIST, STYLES, floorIdFor, wallColorFor } from '../data/styles';
import { FLOORS } from '../data/materials';
import { furnitureById } from '../data/furniture';
import { lightById } from '../data/lights';
import { roomArea, round2, wallLength } from '../lib/geometry';
import { luxReport } from '../lib/lighting';
import { furnishProject } from '../lib/autoFurnish';
import { lightProject } from '../lib/lighting';
import { money, num } from '../lib/estimate';
import { deleteSelection, duplicateSelection, rotateSelection } from './PlanEditor';

function Num({ label, value, onChange, step = 0.05, min, max, suffix = 'м' }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number; suffix?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="num">
        <input
          type="number"
          value={round2(value)}
          step={step}
          min={min}
          max={max}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!Number.isNaN(v)) onChange(v);
          }}
        />
        <em>{suffix}</em>
      </div>
    </label>
  );
}

function ProjectProps({ project }: { project: Project }) {
  const mutate = useStore((s) => s.mutate);
  const style = STYLES[project.style];
  return (
    <div className="inspector-body">
      <h3>Проект</h3>
      <label className="field">
        <span>Название</span>
        <input value={project.name} onChange={(e) => mutate((p) => void (p.name = e.target.value), { history: false })} />
      </label>
      <label className="field">
        <span>Заказчик</span>
        <input value={project.client} onChange={(e) => mutate((p) => void (p.client = e.target.value), { history: false })} />
      </label>
      <label className="field">
        <span>Адрес объекта</span>
        <input value={project.address} onChange={(e) => mutate((p) => void (p.address = e.target.value), { history: false })} />
      </label>
      <label className="field">
        <span>Тип объекта</span>
        <select value={project.kind} onChange={(e) => mutate((p) => void (p.kind = e.target.value as Project['kind']))}>
          <option value="apartment">Квартира</option>
          <option value="house">Дом</option>
        </select>
      </label>
      <Num label="Высота потолка" value={project.ceilingHeight} min={2.3} max={5} onChange={(v) => mutate((p) => void (p.ceilingHeight = v))} />

      <h3>Стиль интерьера</h3>
      <div className="style-grid">
        {STYLE_LIST.map((s) => (
          <button key={s.id} className={'style-chip' + (s.id === project.style ? ' active' : '')} onClick={() => mutate((p) => void (p.style = s.id as StyleId))}>
            <span className="swatches">
              {s.palette.map((c) => (
                <i key={c} style={{ background: c }} />
              ))}
            </span>
            {s.name}
          </button>
        ))}
      </div>
      <p className="muted small">{style.description}</p>

      <h3>Автоматизация</h3>
      <div className="btn-col">
        <button className="btn" onClick={() => mutate((p) => void (p.furniture = furnishProject(p)))}>
          Расставить мебель во всех помещениях
        </button>
        <button className="btn" onClick={() => mutate((p) => void (p.lights = lightProject(p)))}>
          Рассчитать освещение по нормам
        </button>
      </div>

      <h3>Концепция / заметки</h3>
      <textarea rows={6} value={project.concept} placeholder="Описание концепции, пожелания заказчика…" onChange={(e) => mutate((p) => void (p.concept = e.target.value), { history: false })} />
    </div>
  );
}

export function Inspector() {
  const project = useStore((s) => s.project)!;
  const selection = useStore((s) => s.selection);
  const mutate = useStore((s) => s.mutate);

  if (!selection) return <ProjectProps project={project} />;

  if (selection.kind === 'room') {
    const room = project.rooms.find((r) => r.id === selection.id);
    if (!room) return <ProjectProps project={project} />;
    const up = (fn: (r: Room) => void, history = true) =>
      mutate((p) => {
        const r = p.rooms.find((x) => x.id === room.id);
        if (r) fn(r);
      }, { history });
    const lux = luxReport(project, room);
    const floorId = floorIdFor(project.style, room.type, room.floorId);
    return (
      <div className="inspector-body">
        <h3>Помещение</h3>
        <label className="field">
          <span>Название</span>
          <input value={room.name} onChange={(e) => up((r) => void (r.name = e.target.value), false)} />
        </label>
        <label className="field">
          <span>Назначение</span>
          <select
            value={room.type}
            onChange={(e) =>
              up((r) => {
                const t = e.target.value as RoomType;
                if (r.name === ROOM_TYPES[r.type].label) r.name = ROOM_TYPES[t].label;
                r.type = t;
              })
            }
          >
            {ROOM_TYPE_LIST.map((t) => (
              <option key={t} value={t}>
                {ROOM_TYPES[t].label}
              </option>
            ))}
          </select>
        </label>
        <div className="row2">
          <Num label="X" value={room.x} onChange={(v) => up((r) => void (r.x = v))} />
          <Num label="Y" value={room.y} onChange={(v) => up((r) => void (r.y = v))} />
          <Num label="Ширина (по осям)" value={room.w} min={1} onChange={(v) => up((r) => void (r.w = Math.max(1, v)))} />
          <Num label="Глубина (по осям)" value={room.d} min={1} onChange={(v) => up((r) => void (r.d = Math.max(1, v)))} />
        </div>
        {project.levels > 1 || project.kind === 'house' ? (
          <Num label="Этаж" value={room.level + 1} step={1} min={1} max={4} suffix="" onChange={(v) => up((r) => void (r.level = Math.max(0, Math.round(v) - 1)))} />
        ) : null}
        <div className="stat-row">
          <div>
            <b>{num(roomArea(room))}</b> м²
          </div>
          <div className={lux.ok ? 'ok' : 'warn'}>
            <b>{lux.lux}</b> / {lux.norm} лк
          </div>
        </div>

        <h3>Отделка</h3>
        <label className="field">
          <span>Цвет стен</span>
          <div className="color-row">
            <input type="color" value={wallColorFor(project.style, room.type, room.wallColor)} onChange={(e) => up((r) => void (r.wallColor = e.target.value), false)} />
            {STYLES[project.style].palette.map((c) => (
              <button key={c} className="swatch" style={{ background: c }} onClick={() => up((r) => void (r.wallColor = c))} />
            ))}
            {room.wallColor && (
              <button className="link" onClick={() => up((r) => void delete r.wallColor)}>
                по стилю
              </button>
            )}
          </div>
        </label>
        <label className="field">
          <span>Напольное покрытие</span>
          <select value={floorId} onChange={(e) => up((r) => void (r.floorId = e.target.value))}>
            {FLOORS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} — {money(f.pricePerM2)}/м²
              </option>
            ))}
          </select>
        </label>

        <div className="btn-col">
          <button className="btn" onClick={() => mutate((p) => void (p.furniture = furnishProject(p, [room.id])))}>
            Авторасстановка мебели
          </button>
          <button className="btn" onClick={() => mutate((p) => void (p.lights = lightProject(p, [room.id])))}>
            Авторасчёт освещения
          </button>
          <button className="btn danger" onClick={deleteSelection}>
            Удалить помещение
          </button>
        </div>
      </div>
    );
  }

  if (selection.kind === 'opening') {
    const o = project.openings.find((x) => x.id === selection.id);
    const room = o && project.rooms.find((r) => r.id === o.roomId);
    if (!o || !room) return <ProjectProps project={project} />;
    const L = wallLength(room, o.wall);
    const up = (fn: (x: Opening) => void) =>
      mutate((p) => {
        const x = p.openings.find((y) => y.id === o.id);
        if (x) fn(x);
      });
    return (
      <div className="inspector-body">
        <h3>{o.kind === 'door' ? 'Дверной проём' : 'Окно'}</h3>
        <p className="muted small">
          {room.name}, стена {{ n: 'северная', s: 'южная', e: 'восточная', w: 'западная' }[o.wall]} ({num(L)} м)
        </p>
        <label className="field">
          <span>Тип</span>
          <select value={o.kind} onChange={(e) => up((x) => {
            x.kind = e.target.value as 'door' | 'window';
            if (x.kind === 'door') [x.sill, x.height] = [0, 2.1];
            else [x.sill, x.height] = [0.8, 1.5];
          })}>
            <option value="door">Дверь</option>
            <option value="window">Окно</option>
          </select>
        </label>
        <div className="row2">
          <Num label="Отступ от угла" value={o.offset} onChange={(v) => up((x) => void (x.offset = Math.max(0, Math.min(v, L - x.width))))} />
          <Num label="Ширина" value={o.width} onChange={(v) => up((x) => void (x.width = Math.max(0.4, Math.min(v, L - x.offset))))} />
          <Num label="Высота" value={o.height} onChange={(v) => up((x) => void (x.height = Math.max(0.3, Math.min(v, project.ceilingHeight - x.sill))))} />
          {o.kind === 'window' && <Num label="Подоконник" value={o.sill} onChange={(v) => up((x) => void (x.sill = Math.max(0, v)))} />}
        </div>
        <button className="btn danger" onClick={deleteSelection}>
          Удалить проём
        </button>
      </div>
    );
  }

  if (selection.kind === 'furniture') {
    const f = project.furniture.find((x) => x.id === selection.id);
    const def = f && furnitureById(f.catalogId);
    if (!f || !def) return <ProjectProps project={project} />;
    const style = STYLES[project.style];
    const up = (fn: (x: FurnitureItem) => void, history = true) =>
      mutate((p) => {
        const x = p.furniture.find((y) => y.id === f.id);
        if (x) fn(x);
      }, { history });
    return (
      <div className="inspector-body">
        <h3>{def.name}</h3>
        <p className="muted small">
          {def.category} · {Math.round(def.w * 100)}×{Math.round(def.d * 100)}×{Math.round(def.h * 100)} см · {money(def.price)}
        </p>
        <div className="row2">
          <Num label="X" value={f.x} onChange={(v) => up((x) => void (x.x = v))} />
          <Num label="Y" value={f.y} onChange={(v) => up((x) => void (x.y = v))} />
        </div>
        <Num label="Поворот" value={f.rotation} step={15} suffix="°" onChange={(v) => up((x) => void (x.rotation = ((v % 360) + 360) % 360))} />
        <label className="field">
          <span>Цвет / обивка</span>
          <div className="color-row">
            <input type="color" value={f.color ?? (def.colorRole === 'white' ? '#f3f2ef' : (style as unknown as Record<string, string>)[def.colorRole])} onChange={(e) => up((x) => void (x.color = e.target.value), false)} />
            {style.palette.map((c) => (
              <button key={c} className="swatch" style={{ background: c }} onClick={() => up((x) => void (x.color = c))} />
            ))}
          </div>
        </label>
        <div className="btn-row">
          <button className="btn" onClick={() => rotateSelection(90)}>
            ↻ 90°
          </button>
          <button className="btn" onClick={duplicateSelection}>
            Дублировать
          </button>
          <button className="btn danger" onClick={deleteSelection}>
            Удалить
          </button>
        </div>
      </div>
    );
  }

  const l = project.lights.find((x) => x.id === selection.id);
  const def = l && lightById(l.catalogId);
  if (!l || !def) return <ProjectProps project={project} />;
  const up = (fn: (x: LightItem) => void) =>
    mutate((p) => {
      const x = p.lights.find((y) => y.id === l.id);
      if (x) fn(x);
    });
  return (
    <div className="inspector-body">
      <h3>{def.name}</h3>
      <p className="muted small">
        {def.category} · {def.lumens} лм · {def.watts} Вт · IP{def.ip} · {money(def.price)}
      </p>
      <div className="row2">
        <Num label="X" value={l.x} onChange={(v) => up((x) => void (x.x = v))} />
        <Num label="Y" value={l.y} onChange={(v) => up((x) => void (x.y = v))} />
      </div>
      <Num label="Поворот" value={l.rotation} step={15} suffix="°" onChange={(v) => up((x) => void (x.rotation = ((v % 360) + 360) % 360))} />
      <div className="btn-row">
        <button className="btn" onClick={() => rotateSelection(90)}>
          ↻ 90°
        </button>
        <button className="btn danger" onClick={deleteSelection}>
          Удалить
        </button>
      </div>
    </div>
  );
}

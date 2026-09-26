import { useRef, useState } from 'react';
import type { Project, Room } from '../types';
import { useStore } from '../store';
import { Plan, type Handle, type Pt } from './Plan';
import { furnitureById } from '../data/furniture';
import { ROOM_TYPES } from '../data/rooms';
import { clamp, nearestWall, round2, snap, uid, wallLength } from '../lib/geometry';

type Drag =
  | { kind: 'room'; id: string; start: Pt; orig: Room; furn: { id: string; x: number; y: number }[]; lights: { id: string; x: number; y: number }[] }
  | { kind: 'resize'; id: string; handle: Handle; start: Pt; orig: Room }
  | { kind: 'furniture' | 'light'; id: string; start: Pt; orig: Pt }
  | { kind: 'opening'; id: string; start: Pt; orig: number }
  | { kind: 'draw'; start: Pt; cur: Pt };

/** Притягивание к краям соседних помещений */
function magnet(project: Project, room: Room, x: number, y: number, w: number, d: number) {
  const others = project.rooms.filter((r) => r.id !== room.id && r.level === room.level);
  const xs = others.flatMap((r) => [r.x, r.x + r.w]);
  const ys = others.flatMap((r) => [r.y, r.y + r.d]);
  const T = 0.18;
  let bx = x;
  let best = T;
  for (const e of xs) {
    if (Math.abs(e - x) < best) [best, bx] = [Math.abs(e - x), e];
    if (Math.abs(e - (x + w)) < best) [best, bx] = [Math.abs(e - (x + w)), e - w];
  }
  let by = y;
  best = T;
  for (const e of ys) {
    if (Math.abs(e - y) < best) [best, by] = [Math.abs(e - y), e];
    if (Math.abs(e - (y + d)) < best) [best, by] = [Math.abs(e - (y + d)), e - d];
  }
  return { x: round2(bx), y: round2(by) };
}

function magnetEdge(project: Project, room: Room, v: number, axis: 'x' | 'y') {
  const others = project.rooms.filter((r) => r.id !== room.id && r.level === room.level);
  const edges = axis === 'x' ? others.flatMap((r) => [r.x, r.x + r.w]) : others.flatMap((r) => [r.y, r.y + r.d]);
  let best = 0.18;
  let out = v;
  for (const e of edges)
    if (Math.abs(e - v) < best) {
      best = Math.abs(e - v);
      out = e;
    }
  return round2(out);
}

export function PlanEditor() {
  const project = useStore((s) => s.project)!;
  const level = useStore((s) => s.level);
  const selection = useStore((s) => s.selection);
  const tool = useStore((s) => s.tool);
  const placing = useStore((s) => s.placing);
  const { mutate, checkpoint, select, setTool, setPlacing } = useStore.getState();
  const drag = useRef<Drag | null>(null);
  const [draft, setDraft] = useState<{ a: Pt; b: Pt } | null>(null);

  const capture = (e: React.PointerEvent) => {
    const el = e.currentTarget as Element;
    const svg = el instanceof SVGSVGElement ? el : (el as SVGElement).ownerSVGElement;
    svg?.setPointerCapture(e.pointerId);
  };

  const placeAt = (p: Pt) => {
    if (!placing) return false;
    const id = uid();
    mutate((pr) => {
      if (placing.kind === 'furniture') pr.furniture.push({ id, catalogId: placing.catalogId, level, x: snap(p.x), y: snap(p.y), rotation: 0 });
      else pr.lights.push({ id, catalogId: placing.catalogId, level, x: snap(p.x), y: snap(p.y), rotation: 0 });
    });
    select({ kind: placing.kind, id });
    setPlacing(null);
    return true;
  };

  const addOpening = (room: Room, p: Pt) => {
    const kind = tool === 'door' ? 'door' : 'window';
    const nw = nearestWall(room, p.x, p.y);
    const L = wallLength(room, nw.side);
    const width = kind === 'door' ? 0.9 : 1.4;
    if (L < width + 0.2) return;
    const id = uid();
    mutate((pr) => {
      pr.openings.push({
        id,
        roomId: room.id,
        wall: nw.side,
        kind,
        offset: round2(clamp(snap(nw.t - width / 2), 0.1, L - width - 0.1)),
        width,
        height: kind === 'door' ? 2.1 : 1.5,
        sill: kind === 'door' ? 0 : 0.8,
      });
    });
    select({ kind: 'opening', id });
  };

  return (
    <Plan
      project={project}
      level={level}
      mode="edit"
      selection={selection}
      interactive
      className={`plan-svg tool-${placing ? 'place' : tool}`}
      extra={
        draft && (
          <rect
            x={Math.min(draft.a.x, draft.b.x)}
            y={Math.min(draft.a.y, draft.b.y)}
            width={Math.abs(draft.b.x - draft.a.x)}
            height={Math.abs(draft.b.y - draft.a.y)}
            fill="rgba(224,138,0,0.12)"
            stroke="#e08a00"
            strokeWidth={0.03}
            strokeDasharray="0.1 0.06"
          />
        )
      }
      handlers={{
        onBackgroundDown: (p, e) => {
          if (placeAt(p)) return e.preventDefault();
          if (tool === 'room') {
            e.preventDefault();
            capture(e);
            const s = { x: snap(p.x, 0.1), y: snap(p.y, 0.1) };
            drag.current = { kind: 'draw', start: s, cur: s };
            setDraft({ a: s, b: s });
            return;
          }
          select(null);
        },
        onRoomDown: (room, p, e) => {
          if (e.button !== 0 || e.shiftKey) return;
          e.stopPropagation();
          if (placeAt(p)) return;
          if (tool === 'door' || tool === 'window') return addOpening(room, p);
          capture(e);
          if (tool === 'room') {
            const s = { x: snap(p.x, 0.1), y: snap(p.y, 0.1) };
            drag.current = { kind: 'draw', start: s, cur: s };
            setDraft({ a: s, b: s });
            return;
          }
          select({ kind: 'room', id: room.id });
          checkpoint();
          const inRoom = (o: { x: number; y: number; level: number }) => o.level === room.level && o.x >= room.x && o.x <= room.x + room.w && o.y >= room.y && o.y <= room.y + room.d;
          drag.current = {
            kind: 'room',
            id: room.id,
            start: p,
            orig: { ...room },
            furn: project.furniture.filter(inRoom).map((f) => ({ id: f.id, x: f.x, y: f.y })),
            lights: project.lights.filter(inRoom).map((l) => ({ id: l.id, x: l.x, y: l.y })),
          };
        },
        onHandleDown: (room, handle, p, e) => {
          e.stopPropagation();
          capture(e);
          checkpoint();
          drag.current = { kind: 'resize', id: room.id, handle, start: p, orig: { ...room } };
        },
        onOpeningDown: (o, p, e) => {
          if (e.button !== 0 || tool !== 'select' || placing) return;
          e.stopPropagation();
          capture(e);
          select({ kind: 'opening', id: o.id });
          checkpoint();
          drag.current = { kind: 'opening', id: o.id, start: p, orig: o.offset };
        },
        onFurnitureDown: (id, p, e) => {
          if (e.button !== 0 || tool !== 'select' || placing) return;
          e.stopPropagation();
          capture(e);
          select({ kind: 'furniture', id });
          checkpoint();
          const f = project.furniture.find((x) => x.id === id)!;
          drag.current = { kind: 'furniture', id, start: p, orig: { x: f.x, y: f.y } };
        },
        onLightDown: (id, p, e) => {
          if (e.button !== 0 || tool !== 'select' || placing) return;
          e.stopPropagation();
          capture(e);
          select({ kind: 'light', id });
          checkpoint();
          const l = project.lights.find((x) => x.id === id)!;
          drag.current = { kind: 'light', id, start: p, orig: { x: l.x, y: l.y } };
        },
        onMove: (p) => {
          const d = drag.current;
          if (!d) return;
          const dx = p.x - (d.kind === 'draw' ? 0 : d.start.x);
          const dy = p.y - (d.kind === 'draw' ? 0 : d.start.y);
          switch (d.kind) {
            case 'draw': {
              d.cur = { x: snap(p.x, 0.1), y: snap(p.y, 0.1) };
              setDraft({ a: d.start, b: d.cur });
              break;
            }
            case 'room': {
              const m = magnet(project, d.orig, snap(d.orig.x + dx), snap(d.orig.y + dy), d.orig.w, d.orig.d);
              const ddx = m.x - d.orig.x;
              const ddy = m.y - d.orig.y;
              mutate(
                (pr) => {
                  const r = pr.rooms.find((x) => x.id === d.id)!;
                  r.x = m.x;
                  r.y = m.y;
                  for (const f of d.furn) {
                    const it = pr.furniture.find((x) => x.id === f.id);
                    if (it) [it.x, it.y] = [round2(f.x + ddx), round2(f.y + ddy)];
                  }
                  for (const l of d.lights) {
                    const it = pr.lights.find((x) => x.id === l.id);
                    if (it) [it.x, it.y] = [round2(l.x + ddx), round2(l.y + ddy)];
                  }
                },
                { history: false },
              );
              break;
            }
            case 'resize': {
              const o = d.orig;
              let { x, y, w, d: dd } = o;
              const h = d.handle;
              if (h.includes('e')) w = Math.max(1, magnetEdge(project, o, snap(o.x + o.w + dx), 'x') - o.x);
              if (h.includes('s')) dd = Math.max(1, magnetEdge(project, o, snap(o.y + o.d + dy), 'y') - o.y);
              if (h.includes('w')) {
                const nx = Math.min(o.x + o.w - 1, magnetEdge(project, o, snap(o.x + dx), 'x'));
                w = o.x + o.w - nx;
                x = nx;
              }
              if (h.includes('n')) {
                const ny = Math.min(o.y + o.d - 1, magnetEdge(project, o, snap(o.y + dy), 'y'));
                dd = o.y + o.d - ny;
                y = ny;
              }
              mutate(
                (pr) => {
                  const r = pr.rooms.find((xx) => xx.id === d.id)!;
                  Object.assign(r, { x: round2(x), y: round2(y), w: round2(w), d: round2(dd) });
                  // проёмы остаются в пределах стен
                  for (const op of pr.openings.filter((oo) => oo.roomId === r.id)) {
                    const L = wallLength(r, op.wall);
                    op.width = Math.min(op.width, L - 0.1);
                    op.offset = round2(clamp(op.offset, 0.05, L - op.width - 0.05));
                  }
                },
                { history: false },
              );
              break;
            }
            case 'furniture':
            case 'light': {
              mutate(
                (pr) => {
                  const list = d.kind === 'furniture' ? pr.furniture : pr.lights;
                  const it = list.find((x) => x.id === d.id)!;
                  it.x = snap(d.orig.x + dx);
                  it.y = snap(d.orig.y + dy);
                },
                { history: false },
              );
              break;
            }
            case 'opening': {
              mutate(
                (pr) => {
                  const op = pr.openings.find((x) => x.id === d.id)!;
                  const r = pr.rooms.find((x) => x.id === op.roomId)!;
                  const delta = op.wall === 'n' || op.wall === 's' ? dx : dy;
                  op.offset = round2(clamp(snap(d.orig + delta), 0.05, wallLength(r, op.wall) - op.width - 0.05));
                },
                { history: false },
              );
              break;
            }
          }
        },
        onUp: () => {
          const d = drag.current;
          drag.current = null;
          if (d?.kind === 'draw') {
            setDraft(null);
            const x = Math.min(d.start.x, d.cur.x);
            const y = Math.min(d.start.y, d.cur.y);
            const w = Math.abs(d.cur.x - d.start.x);
            const dd = Math.abs(d.cur.y - d.start.y);
            if (w >= 1 && dd >= 1) {
              const id = uid();
              mutate((pr) => {
                const n = pr.rooms.filter((r) => r.type === 'living').length;
                pr.rooms.push({ id, name: ROOM_TYPES.living.label + (n ? ` ${n + 1}` : ''), type: 'living', level, x: round2(x), y: round2(y), w: round2(w), d: round2(dd) });
                pr.levels = Math.max(pr.levels, level + 1);
              });
              select({ kind: 'room', id });
              setTool('select');
            }
          }
        },
      }}
    />
  );
}

/** Удаление выбранного объекта */
export function deleteSelection() {
  const { selection, mutate, select } = useStore.getState();
  if (!selection) return;
  mutate((p) => {
    if (selection.kind === 'room') {
      const room = p.rooms.find((r) => r.id === selection.id);
      p.rooms = p.rooms.filter((r) => r.id !== selection.id);
      p.openings = p.openings.filter((o) => o.roomId !== selection.id);
      if (room) {
        const inRoom = (o: { x: number; y: number; level: number }) => o.level === room.level && o.x >= room.x && o.x <= room.x + room.w && o.y >= room.y && o.y <= room.y + room.d;
        p.furniture = p.furniture.filter((f) => !inRoom(f));
        p.lights = p.lights.filter((l) => !inRoom(l));
      }
    }
    if (selection.kind === 'opening') p.openings = p.openings.filter((o) => o.id !== selection.id);
    if (selection.kind === 'furniture') p.furniture = p.furniture.filter((o) => o.id !== selection.id);
    if (selection.kind === 'light') p.lights = p.lights.filter((o) => o.id !== selection.id);
  });
  select(null);
}

export function rotateSelection(delta = 90) {
  const { selection, mutate } = useStore.getState();
  if (!selection || (selection.kind !== 'furniture' && selection.kind !== 'light')) return;
  mutate((p) => {
    const list = selection.kind === 'furniture' ? p.furniture : p.lights;
    const it = list.find((x) => x.id === selection.id);
    if (it) it.rotation = (((it.rotation + delta) % 360) + 360) % 360;
  });
}

export function nudgeSelection(dx: number, dy: number) {
  const { selection, mutate } = useStore.getState();
  if (!selection) return;
  mutate((p) => {
    if (selection.kind === 'furniture' || selection.kind === 'light') {
      const it = (selection.kind === 'furniture' ? p.furniture : p.lights).find((x) => x.id === selection.id);
      if (it) [it.x, it.y] = [round2(it.x + dx), round2(it.y + dy)];
    }
    if (selection.kind === 'room') {
      const r = p.rooms.find((x) => x.id === selection.id);
      if (r) [r.x, r.y] = [round2(r.x + dx), round2(r.y + dy)];
    }
  });
}

export function duplicateSelection() {
  const { selection, mutate, select } = useStore.getState();
  if (!selection || selection.kind !== 'furniture') return;
  const id = uid();
  mutate((p) => {
    const f = p.furniture.find((x) => x.id === selection.id);
    const def = f && furnitureById(f.catalogId);
    if (f && def) p.furniture.push({ ...f, id, x: round2(f.x + 0.3), y: round2(f.y + 0.3) });
  });
  select({ kind: 'furniture', id });
}

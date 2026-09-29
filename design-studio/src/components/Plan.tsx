import { useEffect, useMemo, useRef, useState } from 'react';
import type { Opening, Project, Room, Selection, WallSide } from '../types';
import { ROOM_TYPES } from '../data/rooms';
import { furnitureById } from '../data/furniture';
import { lightById } from '../data/lights';
import { floorById } from '../data/materials';
import { floorIdOf } from '../data/styles';
import { WALL_T, levelBounds, openingWorld, roomArea, wallGaps, wallLength } from '../lib/geometry';
import { FurnitureSymbol, LightSymbol } from './PlanSymbols';

export type PlanMode = 'edit' | 'measure' | 'furniture' | 'lighting' | 'floors';

export interface PlanHandlers {
  onBackgroundDown?: (p: Pt, e: React.PointerEvent) => void;
  onRoomDown?: (room: Room, p: Pt, e: React.PointerEvent) => void;
  onHandleDown?: (room: Room, handle: Handle, p: Pt, e: React.PointerEvent) => void;
  onOpeningDown?: (o: Opening, p: Pt, e: React.PointerEvent) => void;
  onFurnitureDown?: (id: string, p: Pt, e: React.PointerEvent) => void;
  onLightDown?: (id: string, p: Pt, e: React.PointerEvent) => void;
  onMove?: (p: Pt, e: React.PointerEvent) => void;
  onUp?: (p: Pt, e: React.PointerEvent) => void;
}

export type Pt = { x: number; y: number };
export type Handle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const fmt = (v: number) => v.toFixed(2).replace('.', ',');

function WallsOfRoom({ project, room }: { project: Project; room: Room }) {
  const parts: JSX.Element[] = [];
  for (const side of ['n', 's', 'e', 'w'] as WallSide[]) {
    const L = wallLength(room, side);
    const gaps = wallGaps(project, room, side);
    let cur = 0;
    const segs: [number, number][] = [];
    for (const g of gaps) {
      if (g.start > cur) segs.push([cur, g.start]);
      cur = Math.max(cur, g.end);
    }
    if (cur < L) segs.push([cur, L]);
    segs.forEach(([a, b], i) => {
      let r: { x: number; y: number; w: number; h: number };
      if (side === 'n') r = { x: room.x + a, y: room.y, w: b - a, h: WALL_T };
      else if (side === 's') r = { x: room.x + a, y: room.y + room.d - WALL_T, w: b - a, h: WALL_T };
      else if (side === 'w') r = { x: room.x, y: room.y + a, w: WALL_T, h: b - a };
      else r = { x: room.x + room.w - WALL_T, y: room.y + a, w: WALL_T, h: b - a };
      parts.push(<rect key={side + i} x={r.x} y={r.y} width={r.w} height={r.h} fill="#2d3138" pointerEvents="none" />);
    });
  }
  return <>{parts}</>;
}

function OpeningSymbol({ project, o, selected, onDown }: { project: Project; o: Opening; selected: boolean; onDown?: (e: React.PointerEvent) => void }) {
  const room = project.rooms.find((r) => r.id === o.roomId);
  if (!room) return null;
  const ow = openingWorld(o, room);
  const color = selected ? '#e08a00' : '#2d3138';
  // направление внутрь помещения
  const inward = o.wall === 'n' ? { x: 0, y: 1 } : o.wall === 's' ? { x: 0, y: -1 } : o.wall === 'w' ? { x: 1, y: 0 } : { x: -1, y: 0 };
  const along = ow.axis === 'h' ? { x: 1, y: 0 } : { x: 0, y: 1 };
  const p0 = ow.axis === 'h' ? { x: ow.a, y: ow.line } : { x: ow.line, y: ow.a };
  const len = ow.b - ow.a;
  const hit =
    ow.axis === 'h'
      ? { x: ow.a, y: ow.line - 0.15, w: len, h: 0.3 }
      : { x: ow.line - 0.15, y: ow.a, w: 0.3, h: len };
  if (o.kind === 'window') {
    const lines = [0.02, 0.05, 0.08].map((t) => {
      const off = { x: inward.x * t, y: inward.y * t };
      return (
        <line key={t} x1={p0.x + off.x} y1={p0.y + off.y} x2={p0.x + off.x + along.x * len} y2={p0.y + off.y + along.y * len} stroke={color} strokeWidth={0.012} />
      );
    });
    return (
      <g onPointerDown={onDown} style={{ cursor: onDown ? 'grab' : undefined }}>
        <rect x={hit.x} y={hit.y} width={hit.w} height={hit.h} fill="transparent" />
        {ow.axis === 'h' ? (
          <rect x={ow.a} y={ow.line + (o.wall === 'n' ? 0 : -WALL_T)} width={len} height={WALL_T} fill="#fff" stroke={color} strokeWidth={0.012} />
        ) : (
          <rect x={ow.line + (o.wall === 'w' ? 0 : -WALL_T)} y={ow.a} width={WALL_T} height={len} fill="#fff" stroke={color} strokeWidth={0.012} />
        )}
        {lines}
      </g>
    );
  }
  // дверь: полотно + дуга открывания
  const hinge = { x: p0.x, y: p0.y };
  const leafEnd = { x: hinge.x + inward.x * len, y: hinge.y + inward.y * len };
  const arcEnd = { x: p0.x + along.x * len, y: p0.y + along.y * len };
  const cross = along.x * inward.y - along.y * inward.x;
  return (
    <g onPointerDown={onDown} style={{ cursor: onDown ? 'grab' : undefined }}>
      <rect x={hit.x} y={hit.y} width={hit.w} height={hit.h} fill="transparent" />
      <line x1={hinge.x} y1={hinge.y} x2={leafEnd.x} y2={leafEnd.y} stroke={color} strokeWidth={0.025} />
      <path d={`M${leafEnd.x} ${leafEnd.y} A${len} ${len} 0 0 ${cross > 0 ? 0 : 1} ${arcEnd.x} ${arcEnd.y}`} fill="none" stroke={color} strokeWidth={0.01} strokeDasharray="0.05 0.03" />
    </g>
  );
}

function DimLine({ x1, y1, x2, y2, label, off }: { x1: number; y1: number; x2: number; y2: number; label: string; off: Pt }) {
  const ax = x1 + off.x;
  const ay = y1 + off.y;
  const bx = x2 + off.x;
  const by = y2 + off.y;
  const horizontal = Math.abs(y1 - y2) < 1e-6;
  return (
    <g stroke="#6b7280" strokeWidth={0.01} fontSize={0.22} fill="#374151">
      <line x1={x1} y1={y1} x2={ax} y2={ay} strokeDasharray="0.03 0.03" />
      <line x1={x2} y1={y2} x2={bx} y2={by} strokeDasharray="0.03 0.03" />
      <line x1={ax} y1={ay} x2={bx} y2={by} />
      <line x1={ax - 0.06} y1={ay + 0.06} x2={ax + 0.06} y2={ay - 0.06} strokeWidth={0.02} />
      <line x1={bx - 0.06} y1={by + 0.06} x2={bx + 0.06} y2={by - 0.06} strokeWidth={0.02} />
      <text
        x={(ax + bx) / 2}
        y={(ay + by) / 2 - (horizontal ? 0.07 : 0)}
        textAnchor="middle"
        stroke="none"
        transform={horizontal ? undefined : `rotate(-90 ${(ax + bx) / 2 - 0.07} ${(ay + by) / 2})`}
      >
        {label}
      </text>
    </g>
  );
}

export function Plan({
  project,
  level,
  mode = 'edit',
  selection,
  handlers,
  className,
  interactive = false,
  extra,
  fixedViewBox,
}: {
  project: Project;
  level: number;
  mode?: PlanMode;
  selection?: Selection;
  handlers?: PlanHandlers;
  className?: string;
  interactive?: boolean;
  extra?: React.ReactNode;
  fixedViewBox?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const underlays = interactive ? (project.underlays ?? []).filter((u) => u.level === level && u.visible) : [];
  const roomBounds = levelBounds(project, level);
  const hasRooms = project.rooms.some((r) => r.level === level);
  // при пустом этаже с подложкой показываем подложку целиком
  const ul = (project.underlays ?? []).find((u) => u.level === level);
  const bounds =
    interactive && ul && !hasRooms ? { x: ul.x, y: ul.y, w: ul.pxW * ul.mPerPx, h: ul.pxH * ul.mPerPx } : roomBounds;
  const pad = 1.4;
  const initial = useMemo(() => ({ x: bounds.x - pad, y: bounds.y - pad, w: bounds.w + pad * 2, h: bounds.h + pad * 2 }), [project.id, level, ul?.id, hasRooms]); // eslint-disable-line react-hooks/exhaustive-deps
  const [vb, setVb] = useState(initial);
  useEffect(() => setVb(initial), [initial]);
  const view = fixedViewBox ? { x: bounds.x - pad, y: bounds.y - pad, w: bounds.w + pad * 2, h: bounds.h + pad * 2 } : vb;
  const panRef = useRef<{ sx: number; sy: number; vb: typeof vb } | null>(null);

  const toWorld = (e: { clientX: number; clientY: number }): Pt => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const m = svg.getScreenCTM();
    if (!m) return { x: 0, y: 0 };
    const r = pt.matrixTransform(m.inverse());
    return { x: r.x, y: r.y };
  };

  const rooms = project.rooms.filter((r) => r.level === level);
  const furniture = project.furniture.filter((f) => f.level === level);
  const lights = project.lights.filter((l) => l.level === level);
  const openings = project.openings.filter((o) => rooms.some((r) => r.id === o.roomId));
  const sel = selection ?? null;
  const showFurniture = mode === 'edit' || mode === 'furniture' || mode === 'lighting';
  const furnitureFaded = mode === 'lighting';
  const showLights = mode === 'edit' || mode === 'lighting';

  useEffect(() => {
    if (!interactive || fixedViewBox) return;
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = toWorld(e);
      const k = Math.exp(e.deltaY * 0.0012);
      setVb((v) => {
        const w = Math.min(80, Math.max(2, v.w * k));
        const h = (v.h / v.w) * w;
        return { x: p.x - ((p.x - v.x) / v.w) * w, y: p.y - ((p.y - v.y) / v.h) * h, w, h };
      });
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [interactive, fixedViewBox]);

  const selectedRoom = sel?.kind === 'room' ? rooms.find((r) => r.id === sel.id) : undefined;
  const hs = Math.max(0.12, view.w / 90);

  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ touchAction: 'none', userSelect: 'none', background: '#fbfaf8' }}
      onPointerDown={(e) => {
        if (!interactive) return;
        const p = toWorld(e);
        if (e.button === 1 || e.button === 2 || e.shiftKey) {
          panRef.current = { sx: e.clientX, sy: e.clientY, vb };
          (e.target as Element).setPointerCapture?.(e.pointerId);
          return;
        }
        if (e.target === svgRef.current || (e.target as Element).getAttribute('data-bg')) {
          handlers?.onBackgroundDown?.(p, e);
          if (!e.defaultPrevented) {
            panRef.current = { sx: e.clientX, sy: e.clientY, vb };
          }
        }
      }}
      onPointerMove={(e) => {
        if (!interactive) return;
        if (panRef.current) {
          const svg = svgRef.current!;
          const rect = svg.getBoundingClientRect();
          const scale = Math.max(panRef.current.vb.w / rect.width, panRef.current.vb.h / rect.height);
          setVb({ ...panRef.current.vb, x: panRef.current.vb.x - (e.clientX - panRef.current.sx) * scale, y: panRef.current.vb.y - (e.clientY - panRef.current.sy) * scale });
          return;
        }
        handlers?.onMove?.(toWorld(e), e);
      }}
      onPointerUp={(e) => {
        if (!interactive) return;
        if (panRef.current) {
          panRef.current = null;
          return;
        }
        handlers?.onUp?.(toWorld(e), e);
      }}
      onContextMenu={(e) => interactive && e.preventDefault()}
    >
      <defs>
        <pattern id="grid" width="0.5" height="0.5" patternUnits="userSpaceOnUse">
          <path d="M0.5 0 L0 0 0 0.5" fill="none" stroke="#e7e4de" strokeWidth={0.01} />
        </pattern>
        <pattern id="grid5" width="1" height="1" patternUnits="userSpaceOnUse">
          <rect width="1" height="1" fill="url(#grid)" />
          <path d="M1 0 L0 0 0 1" fill="none" stroke="#d9d5cd" strokeWidth={0.015} />
        </pattern>
      </defs>
      {interactive && <rect data-bg="1" x={view.x - 100} y={view.y - 100} width={view.w + 200} height={view.h + 200} fill="url(#grid5)" />}

      {underlays.map((u) => (
        <g key={u.id} pointerEvents="none">
          <image href={u.dataUrl} x={u.x} y={u.y} width={u.pxW * u.mPerPx} height={u.pxH * u.mPerPx} opacity={u.opacity} preserveAspectRatio="none" />
          {u.crop && (
            <rect
              x={u.x + u.crop.x0 * u.mPerPx}
              y={u.y + u.crop.y0 * u.mPerPx}
              width={(u.crop.x1 - u.crop.x0) * u.mPerPx}
              height={(u.crop.y1 - u.crop.y0) * u.mPerPx}
              fill="none"
              stroke="#2563eb"
              strokeWidth={Math.max(0.03, u.mPerPx * 3)}
              strokeDasharray={`${u.mPerPx * 12} ${u.mPerPx * 8}`}
            />
          )}
        </g>
      ))}

      {/* Помещения */}
      {rooms.map((r) => {
        const floor = floorById(floorIdOf(project, r));
        const fill = mode === 'floors' ? floor.base : ROOM_TYPES[r.type].planColor;
        const isSel = sel?.kind === 'room' && sel.id === r.id;
        return (
          <g key={r.id}>
            <rect
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.d}
              fill={fill}
              opacity={mode === 'floors' ? 0.85 : underlays.length ? 0.55 : 1}
              stroke={isSel ? '#e08a00' : 'none'}
              strokeWidth={0.04}
              onPointerDown={(e) => handlers?.onRoomDown?.(r, toWorld(e), e)}
              style={{ cursor: interactive ? 'move' : undefined }}
            />
          </g>
        );
      })}
      {rooms.map((r) => (
        <WallsOfRoom key={r.id} project={project} room={r} />
      ))}

      {/* Мебель */}
      {showFurniture &&
        furniture.map((f) => {
          const def = furnitureById(f.catalogId);
          if (!def) return null;
          const isSel = sel?.kind === 'furniture' && sel.id === f.id;
          return (
            <g
              key={f.id}
              transform={`translate(${f.x} ${f.y}) rotate(${f.rotation})`}
              opacity={furnitureFaded ? 0.35 : 1}
              onPointerDown={(e) => handlers?.onFurnitureDown?.(f.id, toWorld(e), e)}
              style={{ cursor: interactive ? 'move' : undefined }}
            >
              <FurnitureSymbol def={def} fill={isSel ? '#fff1d6' : undefined} />
              {isSel && <rect x={-def.w / 2 - 0.04} y={-def.d / 2 - 0.04} width={def.w + 0.08} height={def.d + 0.08} fill="none" stroke="#e08a00" strokeWidth={0.03} strokeDasharray="0.08 0.05" />}
            </g>
          );
        })}

      {openings.map((o) => (
        <OpeningSymbol
          key={o.id}
          project={project}
          o={o}
          selected={sel?.kind === 'opening' && sel.id === o.id}
          onDown={handlers?.onOpeningDown ? (e) => handlers.onOpeningDown!(o, toWorld(e), e) : undefined}
        />
      ))}

      {/* Подписи помещений */}
      {rooms.map((r) => {
        const fs = Math.min(0.26, Math.max(0.14, Math.min(r.w, r.d) / 9));
        return (
          <g key={'l' + r.id} pointerEvents="none" textAnchor="middle" fill="#1f2937">
            <text x={r.x + r.w / 2} y={r.y + r.d / 2 - fs * 0.4} fontSize={fs} fontWeight={600}>
              {r.name}
            </text>
            <text x={r.x + r.w / 2} y={r.y + r.d / 2 + fs * 0.9} fontSize={fs * 0.85} fill="#4b5563">
              {fmt(roomArea(r))} м²{mode === 'measure' || mode === 'edit' ? ` · ${fmt(r.w - 2 * WALL_T)}×${fmt(r.d - 2 * WALL_T)}` : ''}
            </text>
            {mode === 'floors' && (
              <text x={r.x + r.w / 2} y={r.y + r.d / 2 + fs * 2} fontSize={fs * 0.7} fill="#374151">
                {floorById(floorIdOf(project, r)).name}
              </text>
            )}
          </g>
        );
      })}

      {/* Светильники */}
      {showLights &&
        lights.map((l) => {
          const def = lightById(l.catalogId);
          if (!def) return null;
          const isSel = sel?.kind === 'light' && sel.id === l.id;
          return (
            <g
              key={l.id}
              transform={`translate(${l.x} ${l.y}) rotate(${l.rotation})`}
              onPointerDown={(e) => handlers?.onLightDown?.(l.id, toWorld(e), e)}
              style={{ cursor: interactive ? 'move' : undefined }}
            >
              <circle r={Math.max(0.16, def.size / 2 + 0.05)} fill="transparent" />
              <LightSymbol def={def} color={isSel ? '#c2410c' : '#d98a00'} />
              {isSel && <circle r={Math.max(0.15, def.size / 2 + 0.06)} fill="none" stroke="#c2410c" strokeWidth={0.02} strokeDasharray="0.05 0.04" />}
            </g>
          );
        })}

      {/* Габаритные размеры */}
      {(mode === 'measure' || mode === 'edit') && rooms.length > 0 && (
        <>
          <DimLine x1={bounds.x} y1={bounds.y} x2={bounds.x + bounds.w} y2={bounds.y} off={{ x: 0, y: -0.7 }} label={fmt(bounds.w)} />
          <DimLine x1={bounds.x} y1={bounds.y} x2={bounds.x} y2={bounds.y + bounds.h} off={{ x: -0.7, y: 0 }} label={fmt(bounds.h)} />
          {mode === 'measure' &&
            rooms
              .filter((r) => Math.abs(r.y - bounds.y) < 0.02)
              .map((r) => <DimLine key={'dn' + r.id} x1={r.x} y1={r.y} x2={r.x + r.w} y2={r.y} off={{ x: 0, y: -0.35 }} label={fmt(r.w)} />)}
          {mode === 'measure' &&
            rooms
              .filter((r) => Math.abs(r.x - bounds.x) < 0.02)
              .map((r) => <DimLine key={'dw' + r.id} x1={r.x} y1={r.y} x2={r.x} y2={r.y + r.d} off={{ x: -0.35, y: 0 }} label={fmt(r.d)} />)}
        </>
      )}

      {/* Ручки изменения размера */}
      {interactive && selectedRoom && (
        <g>
          {(
            [
              ['n', selectedRoom.x + selectedRoom.w / 2, selectedRoom.y],
              ['s', selectedRoom.x + selectedRoom.w / 2, selectedRoom.y + selectedRoom.d],
              ['w', selectedRoom.x, selectedRoom.y + selectedRoom.d / 2],
              ['e', selectedRoom.x + selectedRoom.w, selectedRoom.y + selectedRoom.d / 2],
              ['nw', selectedRoom.x, selectedRoom.y],
              ['ne', selectedRoom.x + selectedRoom.w, selectedRoom.y],
              ['sw', selectedRoom.x, selectedRoom.y + selectedRoom.d],
              ['se', selectedRoom.x + selectedRoom.w, selectedRoom.y + selectedRoom.d],
            ] as [Handle, number, number][]
          ).map(([h, x, y]) => (
            <rect
              key={h}
              x={x - hs / 2}
              y={y - hs / 2}
              width={hs}
              height={hs}
              fill="#fff"
              stroke="#e08a00"
              strokeWidth={0.025}
              style={{ cursor: h === 'n' || h === 's' ? 'ns-resize' : h === 'e' || h === 'w' ? 'ew-resize' : h === 'ne' || h === 'sw' ? 'nesw-resize' : 'nwse-resize' }}
              onPointerDown={(e) => handlers?.onHandleDown?.(selectedRoom, h, toWorld(e), e)}
            />
          ))}
        </g>
      )}

      {/* Стрелка севера */}
      <g transform={`translate(${view.x + view.w - 0.7} ${view.y + 0.9})`} pointerEvents="none">
        <circle r={0.32} fill="#fff" stroke="#6b7280" strokeWidth={0.015} />
        <path d="M0 -0.26 L0.1 0.1 L0 0.03 L-0.1 0.1 Z" fill="#374151" />
        <text y={-0.38} fontSize={0.2} textAnchor="middle" fill="#374151">С</text>
      </g>
      {extra}
    </svg>
  );
}

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { Project, Room, WallSide } from '../types';
import { floorIdOf, styleOf, wallColorOf } from '../data/styles';
import { floorById, wallFinishById, type WallFinish } from '../data/materials';
import { furnitureById } from '../data/furniture';
import { lightById } from '../data/lights';
import { WALL_T, itemRect, levelBounds, wallGaps, type WallGap } from '../lib/geometry';
import { lightsInRoom } from '../lib/lighting';
import { floorTexture, wallTexture } from './textures';
import { FurnitureModel, type Palette } from './FurnitureModel';
import { LightFixture } from './LightFixture';

export interface ViewOptions {
  night: boolean;
  ceiling: boolean;
  cutaway: boolean;
  exposure: number;
  allLevels: boolean;
}

export interface CameraRequest {
  key: number;
  fov?: number;
  position: [number, number, number];
  target: [number, number, number];
}

export interface SceneApi {
  capture: (scale?: number) => string;
  exportGLB: () => Promise<Blob>;
}

export const SLAB = 0.3;
export const levelY = (p: Project, level: number) => level * (p.ceilingHeight + SLAB);

// ---------- Стены ----------

function WallPieces({ room, side, H, gaps, color, cut, finish }: { room: Room; side: WallSide; H: number; gaps: WallGap[]; color: string; cut: number; finish: WallFinish }) {
  const horizontal = side === 'n' || side === 's';
  const L = horizontal ? room.w : room.d;
  const pieces: { s: number; e: number; b: number; t: number }[] = [];
  let cursor = 0;
  for (const g of gaps) {
    if (g.start > cursor) pieces.push({ s: cursor, e: g.start, b: 0, t: H });
    if (g.sill > 0) pieces.push({ s: g.start, e: g.end, b: 0, t: g.sill });
    if (g.top < H) pieces.push({ s: g.start, e: g.end, b: g.top, t: H });
    cursor = Math.max(cursor, g.end);
  }
  if (cursor < L) pieces.push({ s: cursor, e: L, b: 0, t: H });

  return (
    <>
      {pieces.map((p, i) => {
        const b = p.b;
        const t = Math.min(p.t, cut);
        if (t - b <= 0.001) return null;
        const len = p.e - p.s;
        const mid = (p.s + p.e) / 2;
        let pos: [number, number, number];
        let size: [number, number, number];
        if (side === 'n') [pos, size] = [[room.x + mid, (b + t) / 2, room.y + WALL_T / 2], [len, t - b, WALL_T]];
        else if (side === 's') [pos, size] = [[room.x + mid, (b + t) / 2, room.y + room.d - WALL_T / 2], [len, t - b, WALL_T]];
        else if (side === 'w') [pos, size] = [[room.x + WALL_T / 2, (b + t) / 2, room.y + mid], [WALL_T, t - b, len]];
        else [pos, size] = [[room.x + room.w - WALL_T / 2, (b + t) / 2, room.y + mid], [WALL_T, t - b, len]];
        return <WallBox key={i} pos={pos} size={size} len={len} h={t - b} color={color} finish={finish} />;
      })}
    </>
  );
}

function WallBox({ pos, size, len, h, color, finish }: { pos: [number, number, number]; size: [number, number, number]; len: number; h: number; color: string; finish: WallFinish }) {
  const tex = useMemo(() => wallTexture(finish, color, len, h), [finish, color, len, h]);
  useEffect(() => () => tex?.dispose(), [tex]);
  return (
    <mesh position={pos} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial key={tex ? tex.uuid : 'plain'} color={tex ? '#ffffff' : color} map={tex ?? undefined} roughness={finish.roughness} />
    </mesh>
  );
}

/** Окна и двери в проёмах помещения */
function OpeningFills({ room, side, gaps, frame }: { room: Room; side: WallSide; gaps: WallGap[]; frame: string }) {
  return (
    <>
      {gaps
        .filter((g) => g.own)
        .map((g) => {
          const len = g.end - g.start;
          const along = (g.start + g.end) / 2;
          // локальная система: X вдоль стены, Z — внутрь комнаты
          let pos: [number, number, number];
          let rotY = 0;
          if (side === 'n') [pos, rotY] = [[room.x + along, 0, room.y + WALL_T / 2], 0];
          else if (side === 's') [pos, rotY] = [[room.x + along, 0, room.y + room.d - WALL_T / 2], Math.PI];
          else if (side === 'w') [pos, rotY] = [[room.x + WALL_T / 2, 0, room.y + along], Math.PI / 2];
          else [pos, rotY] = [[room.x + room.w - WALL_T / 2, 0, room.y + along], -Math.PI / 2];
          const h = g.top - g.sill;
          if (g.kind === 'window') {
            return (
              <group key={g.openingId} position={pos} rotation={[0, rotY, 0]}>
                <mesh position={[0, g.sill + h / 2, 0]}>
                  <boxGeometry args={[len, h, 0.02]} />
                  <meshPhysicalMaterial color="#cfe6f5" transparent opacity={0.18} roughness={0.02} metalness={0} />
                </mesh>
                {[
                  [0, g.sill + 0.025, len, 0.05],
                  [0, g.top - 0.025, len, 0.05],
                  [-len / 2 + 0.025, g.sill + h / 2, 0.05, h],
                  [len / 2 - 0.025, g.sill + h / 2, 0.05, h],
                  [0, g.sill + h / 2, 0.04, h],
                ].map(([x, y, w, hh], i) => (
                  <mesh key={i} position={[x, y, 0]} castShadow>
                    <boxGeometry args={[w, hh, WALL_T * 0.6]} />
                    <meshStandardMaterial color={frame} roughness={0.5} />
                  </mesh>
                ))}
                <mesh position={[0, g.sill - 0.02, WALL_T / 2 + 0.08]} receiveShadow>
                  <boxGeometry args={[len + 0.1, 0.03, 0.2]} />
                  <meshStandardMaterial color="#f3f1ec" roughness={0.4} />
                </mesh>
              </group>
            );
          }
          // дверь: полотно, приоткрытое на 70°
          return (
            <group key={g.openingId} position={pos} rotation={[0, rotY, 0]}>
              <group position={[-len / 2 + 0.03, 0, WALL_T / 2]} rotation={[0, -1.2, 0]}>
                <mesh position={[len / 2 - 0.03, h / 2, 0.02]} castShadow>
                  <boxGeometry args={[len - 0.06, h - 0.02, 0.04]} />
                  <meshStandardMaterial color={frame} roughness={0.45} />
                </mesh>
                <mesh position={[len - 0.14, 1.0, 0.06]}>
                  <boxGeometry args={[0.12, 0.02, 0.02]} />
                  <meshStandardMaterial color="#9c9c9c" metalness={0.8} roughness={0.3} />
                </mesh>
              </group>
              {[
                [-len / 2 + 0.02, h / 2, 0.04, h],
                [len / 2 - 0.02, h / 2, 0.04, h],
                [0, h - 0.02, len, 0.04],
              ].map(([x, y, w, hh], i) => (
                <mesh key={i} position={[x, y, 0]}>
                  <boxGeometry args={[w, hh, WALL_T + 0.02]} />
                  <meshStandardMaterial color={frame} roughness={0.5} />
                </mesh>
              ))}
            </group>
          );
        })}
    </>
  );
}

function RoomMesh({ project, room, opts, selected }: { project: Project; room: Room; opts: ViewOptions; selected: boolean }) {
  const style = styleOf(project);
  const H = project.ceilingHeight;
  const floor = floorById(floorIdOf(project, room));
  const tex = useMemo(() => floorTexture(floor, room.w, room.d), [floor, room.w, room.d]);
  useEffect(() => () => tex.dispose(), [tex]);
  const wallColor = wallColorOf(project, room);
  const cut = opts.cutaway ? 1.1 : H;
  const frame = project.style === 'loft' || project.style === 'modern' ? '#2b2d30' : '#f4f2ee';

  return (
    <group>
      <mesh position={[room.x + room.w / 2, 0.001, room.y + room.d / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[room.w, room.d]} />
        <meshStandardMaterial map={tex} roughness={floor.roughness} color={selected ? '#ffe7b0' : '#ffffff'} />
      </mesh>
      <mesh position={[room.x + room.w / 2, -SLAB / 2, room.y + room.d / 2]} receiveShadow>
        <boxGeometry args={[room.w, SLAB - 0.004, room.d]} />
        <meshStandardMaterial color="#bdb8b0" roughness={1} />
      </mesh>
      {(['n', 's', 'e', 'w'] as WallSide[]).map((side) => {
        const gaps = wallGaps(project, room, side);
        return (
          <group key={side}>
            <WallPieces
              room={room}
              side={side}
              H={H}
              gaps={gaps}
              color={room.accentWall?.side === side ? room.accentWall.color ?? wallColor : wallColor}
              finish={wallFinishById(room.accentWall?.side === side ? room.accentWall.finish : room.wallFinish)}
              cut={cut}
            />
            <OpeningFills room={room} side={side} gaps={gaps} frame={frame} />
          </group>
        );
      })}
      {opts.ceiling && !opts.cutaway && (
        <mesh position={[room.x + room.w / 2, H, room.y + room.d / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[room.w, room.d]} />
          <meshStandardMaterial color={style.ceiling} roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function RoomLight({ project, room, night }: { project: Project; room: Room; night: boolean }) {
  const lights = lightsInRoom(project, room);
  const lumens = lights.reduce((s, l) => s + (lightById(l.catalogId)?.lumens ?? 0), 0);
  if (!lumens) return null;
  const cct = styleOf(project).cct;
  const color = cct <= 2700 ? '#ffd8a8' : cct <= 3000 ? '#ffe2bd' : '#fff0dc';
  // лм → кд (изотропный источник) с поправкой на отражения и экспозицию
  const intensity = (lumens / (4 * Math.PI)) * (night ? 0.03 : 0.008);
  return <pointLight position={[room.x + room.w / 2, project.ceilingHeight - 0.35, room.y + room.d / 2]} intensity={intensity} color={color} distance={0} decay={2} />;
}

function Capture({ apiRef }: { apiRef: React.MutableRefObject<SceneApi | null> }) {
  const { gl, scene, camera, size } = useThree();
  useEffect(() => {
    apiRef.current = {
      capture: (scale = 2) => {
        const prev = gl.getPixelRatio();
        gl.setPixelRatio(scale);
        gl.setSize(size.width, size.height, false);
        gl.render(scene, camera);
        const url = gl.domElement.toDataURL('image/jpeg', 0.92);
        gl.setPixelRatio(prev);
        gl.setSize(size.width, size.height, false);
        gl.render(scene, camera);
        return url;
      },
      exportGLB: () =>
        new Promise((resolve, reject) => {
          const exporter = new GLTFExporter();
          const root = scene.getObjectByName('project-root') ?? scene;
          exporter.parse(
            root,
            (res) => resolve(new Blob([res as ArrayBuffer], { type: 'model/gltf-binary' })),
            (err) => reject(err),
            { binary: true },
          );
        }),
    };
  }, [gl, scene, camera, size, apiRef]);
  return null;
}

function CameraRig({ request }: { request: CameraRequest | null }) {
  const { camera, controls } = useThree();
  useEffect(() => {
    if (!request) return;
    const pc = camera as THREE.PerspectiveCamera;
    pc.fov = request.fov ?? 50;
    pc.updateProjectionMatrix();
    camera.position.set(...request.position);
    const c = controls as unknown as OrbitControlsImpl | null;
    if (c) {
      c.target.set(...request.target);
      c.update();
    } else camera.lookAt(...request.target);
  }, [request, camera, controls]);
  return null;
}

export function overviewCamera(project: Project, level: number, key: number): CameraRequest {
  const b = levelBounds(project, level);
  const cx = b.x + b.w / 2;
  const cz = b.y + b.h / 2;
  const s = Math.max(b.w, b.h);
  const y0 = levelY(project, level);
  return { key, position: [cx + s * 0.55, y0 + s * 1.05, cz + s * 1.05], target: [cx, y0, cz] };
}

export function roomCamera(project: Project, room: Room, n: number, key: number): CameraRequest {
  const y0 = levelY(project, room.level);
  const inset = 0.4;
  const corners = [
    [room.x + inset, room.y + inset],
    [room.x + room.w - inset, room.y + inset],
    [room.x + room.w - inset, room.y + room.d - inset],
    [room.x + inset, room.y + room.d - inset],
  ];
  // угол, свободный от высокой мебели, — лучшая точка съёмки
  const tall = project.furniture
    .filter((f) => f.level === room.level)
    .map((f) => ({ f, def: furnitureById(f.catalogId) }))
    .filter((x) => x.def && x.def.h > 0.9)
    .map((x) => itemRect(x.f.x, x.f.y, x.def!.w, x.def!.d, x.f.rotation));
  const clearance = (cx: number, cy: number) =>
    Math.min(10, ...tall.map((r) => Math.hypot(Math.max(r.x - cx, 0, cx - (r.x + r.w)), Math.max(r.y - cy, 0, cy - (r.y + r.h)))));
  const ranked = [...corners].sort((a, b) => clearance(b[0], b[1]) - clearance(a[0], a[1]));
  const [px, pz] = ranked[n % 4];
  const cx = room.x + room.w / 2;
  const cz = room.y + room.d / 2;
  return {
    key,
    fov: 72,
    position: [px, y0 + Math.min(1.6, project.ceilingHeight - 0.4), pz],
    target: [cx + (cx - px) * 0.25, y0 + 0.95, cz + (cz - pz) * 0.25],
  };
}

export function Scene3D({
  project,
  level,
  opts,
  camera,
  apiRef,
  selectedId,
  selectedRoomId,
  onSelectFurniture,
}: {
  project: Project;
  level: number;
  opts: ViewOptions;
  camera: CameraRequest | null;
  apiRef: React.MutableRefObject<SceneApi | null>;
  selectedId?: string;
  selectedRoomId?: string;
  onSelectFurniture: (id: string | null) => void;
}) {
  const style = styleOf(project);
  const pal: Palette = { main: style.fabric, wood: style.wood, fabric: style.fabric, accent: style.accent, metal: style.metal, white: '#f3f2ef' };
  const visible = (l: number) => (opts.allLevels ? true : l <= level);
  const rooms = project.rooms.filter((r) => visible(r.level));
  const b = levelBounds(project);
  const center: [number, number, number] = [b.x + b.w / 2, 0, b.y + b.h / 2];
  const span = Math.max(b.w, b.h) + 6;
  const initial = useRef(overviewCamera(project, level, 0));

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ preserveDrawingBuffer: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: opts.exposure }}
      camera={{ position: initial.current.position, fov: 50, near: 0.05, far: 500 }}
      onPointerMissed={() => onSelectFurniture(null)}
    >
      <ExposureSync exposure={opts.exposure} />
      <color attach="background" args={[opts.night ? '#0d1117' : '#dfe6ec']} />
      <hemisphereLight args={[opts.night ? '#2a3348' : '#f4f7ff', opts.night ? '#1a1612' : '#b9ab98', opts.night ? 0.4 : 1.1]} />
      {!opts.night && (
        <directionalLight
          position={[center[0] - span * 0.6, span * 1.1, center[2] - span * 0.8]}
          intensity={2.6}
          color="#fff4e2"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-span}
          shadow-camera-right={span}
          shadow-camera-top={span}
          shadow-camera-bottom={-span}
          shadow-camera-far={span * 4}
          shadow-bias={-0.0004}
          target-position={center}
        />
      )}
      <ambientLight intensity={opts.night ? 0.12 : 0.25} />

      <group name="project-root">
        {rooms.map((r) => (
          <group key={r.id} position={[0, levelY(project, r.level), 0]}>
            <RoomMesh project={project} room={r} opts={opts} selected={r.id === selectedRoomId} />
            {r.level === level && <RoomLight project={project} room={r} night={opts.night} />}
          </group>
        ))}
        {project.furniture
          .filter((f) => visible(f.level))
          .map((f) => {
            const def = furnitureById(f.catalogId);
            if (!def) return null;
            const main = f.color ?? pal[def.colorRole === 'white' ? 'white' : def.colorRole];
            return (
              <group
                key={f.id}
                position={[f.x, levelY(project, f.level), f.y]}
                rotation={[0, (-f.rotation * Math.PI) / 180, 0]}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectFurniture(f.id);
                }}
              >
                <FurnitureModel def={def} pal={{ ...pal, main }} />
                {selectedId === f.id && (
                  <mesh position={[0, def.h / 2, 0]}>
                    <boxGeometry args={[def.w + 0.04, def.h + 0.04, def.d + 0.04]} />
                    <meshBasicMaterial color="#f5b642" wireframe />
                  </mesh>
                )}
              </group>
            );
          })}
        {project.lights
          .filter((l) => visible(l.level))
          .map((l) => {
            const def = lightById(l.catalogId);
            if (!def) return null;
            return (
              <group key={l.id} position={[l.x, levelY(project, l.level), l.y]} rotation={[0, (-l.rotation * Math.PI) / 180, 0]}>
                <LightFixture def={def} H={project.ceilingHeight} night={opts.night} metal={style.metal} showCeilingParts={!opts.cutaway} />
              </group>
            );
          })}
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center[0], -SLAB - 0.01, center[2]]} receiveShadow>
        <planeGeometry args={[span * 6, span * 6]} />
        <meshStandardMaterial color={opts.night ? '#151a14' : '#c9d3c0'} roughness={1} />
      </mesh>

      <OrbitControls makeDefault target={initial.current.target} maxPolarAngle={Math.PI * 0.495} enableDamping dampingFactor={0.12} />
      <CameraRig request={camera} />
      <Capture apiRef={apiRef} />
    </Canvas>
  );
}

function ExposureSync({ exposure }: { exposure: number }) {
  const { gl } = useThree();
  useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [gl, exposure]);
  return null;
}

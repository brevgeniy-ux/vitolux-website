import { useRef, useState } from 'react';
import { useStore } from '../store';
import { Scene3D, overviewCamera, roomCamera, type CameraRequest, type SceneApi, type ViewOptions } from '../three/Scene3D';
import { uid } from '../lib/geometry';

export function download(name: string, blob: Blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function View3D() {
  const project = useStore((s) => s.project)!;
  const level = useStore((s) => s.level);
  const selection = useStore((s) => s.selection);
  const { select, mutate } = useStore.getState();
  const [opts, setOpts] = useState<ViewOptions>({ night: false, ceiling: false, cutaway: false, exposure: 1, allLevels: false });
  const [cam, setCam] = useState<CameraRequest | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const corner = useRef(0);
  const lastRoom = useRef<string | null>(null);
  const apiRef = useRef<SceneApi | null>(null);
  const roomsOnLevel = project.rooms.filter((r) => r.level === level);
  const selRoom = selection?.kind === 'room' ? project.rooms.find((r) => r.id === selection.id) : undefined;

  const toggle = (k: keyof ViewOptions) => setOpts((o) => ({ ...o, [k]: !o[k] }));

  const goRoom = (id: string) => {
    const r = project.rooms.find((x) => x.id === id);
    if (!r) return;
    corner.current = lastRoom.current === id ? (corner.current + 1) % 4 : 0;
    lastRoom.current = id;
    setOpts((o) => ({ ...o, ceiling: true, cutaway: false }));
    setCam(roomCamera(project, r, corner.current, Date.now()));
  };

  const capture = () => {
    const api = apiRef.current;
    if (!api) return;
    const url = api.capture(2);
    const title = (cam && selRoom ? selRoom.name : 'Общий вид') + (opts.night ? ' — вечер' : ' — день');
    mutate((p) => void p.renders.push({ id: uid(), title, dataUrl: url, createdAt: Date.now() }));
    setFlash('Рендер сохранён в проект');
    setTimeout(() => setFlash(null), 1800);
  };

  const exportGlb = async () => {
    const api = apiRef.current;
    if (!api) return;
    const blob = await api.exportGLB();
    download(`${project.name || 'project'}.glb`, blob);
  };

  return (
    <div className="view3d">
      <div className="toolbar3d">
        <button className="btn sm" onClick={() => setCam(overviewCamera(project, level, Date.now()))}>
          Общий вид
        </button>
        <select
          className="sm"
          value=""
          onChange={(e) => {
            if (e.target.value) goRoom(e.target.value);
          }}
        >
          <option value="">Камера в помещении…</option>
          {roomsOnLevel.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        {selRoom && (
          <button className="btn sm" onClick={() => goRoom(selRoom.id)} title="Каждое нажатие — следующий угол">
            Вид из «{selRoom.name}»
          </button>
        )}
        <span className="sep" />
        <button className={'btn sm' + (opts.night ? ' active' : '')} onClick={() => toggle('night')}>
          {opts.night ? 'Вечер' : 'День'}
        </button>
        <button className={'btn sm' + (opts.ceiling ? ' active' : '')} onClick={() => toggle('ceiling')}>
          Потолок
        </button>
        <button className={'btn sm' + (opts.cutaway ? ' active' : '')} onClick={() => toggle('cutaway')}>
          Срез стен
        </button>
        {project.levels > 1 && (
          <button className={'btn sm' + (opts.allLevels ? ' active' : '')} onClick={() => toggle('allLevels')}>
            Все этажи
          </button>
        )}
        <label className="exposure" title="Экспозиция">
          ☀
          <input type="range" min={0.4} max={2} step={0.05} value={opts.exposure} onChange={(e) => setOpts((o) => ({ ...o, exposure: parseFloat(e.target.value) }))} />
        </label>
        <span className="sep" />
        <button className="btn sm primary" onClick={capture}>
          📷 Рендер
        </button>
        <button className="btn sm" onClick={exportGlb} title="3D-модель для Blender / SketchUp / 3ds Max">
          GLB
        </button>
      </div>
      <div className="canvas-wrap">
        <Scene3D
          project={project}
          level={level}
          opts={opts}
          camera={cam}
          apiRef={apiRef}
          selectedId={selection?.kind === 'furniture' ? selection.id : undefined}
          selectedRoomId={selRoom?.id}
          onSelectFurniture={(id) => select(id ? { kind: 'furniture', id } : null)}
        />
        {flash && <div className="flash">{flash}</div>}
      </div>
    </div>
  );
}

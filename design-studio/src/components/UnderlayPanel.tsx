import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { alignedUnderlay, makeUnderlay, planToRooms, prepareImage, recognizePlan, type PreparedImage } from '../lib/recognize';
import { aiStatus } from '../lib/api';
import { round2 } from '../lib/geometry';

/** Подложка этажа: загрузка изображения планировки, калибровка масштаба, распознавание */
export function UnderlayPanel() {
  const project = useStore((s) => s.project)!;
  const level = useStore((s) => s.level);
  const tool = useStore((s) => s.tool);
  const calib = useStore((s) => s.calib);
  const { mutate, setTool, setCalib } = useStore.getState();
  const u = (project.underlays ?? []).find((x) => x.level === level);
  const fileRef = useRef<HTMLInputElement>(null);
  const [len, setLen] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; warn?: boolean } | null>(null);
  const [ai, setAi] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const roomsOnLevel = project.rooms.filter((r) => r.level === level).length;

  useEffect(() => {
    aiStatus().then(setAi);
  }, []);

  const upload = async (file: File) => {
    setMsg(null);
    try {
      const img = await prepareImage(file);
      mutate((p) => {
        p.underlays = (p.underlays ?? []).filter((x) => x.level !== level);
        p.underlays.push(makeUnderlay(img, level));
      });
      setTool('calibrate');
      setMsg({ text: 'Подложка загружена. Укажите масштаб: кликните по двум концам известного размера (например, стены с размерной линией).' });
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : String(e), warn: true });
    }
  };

  const measured = calib.length === 2 ? Math.hypot(calib[1].x - calib[0].x, calib[1].y - calib[0].y) : 0;

  const applyCalib = () => {
    const real = parseFloat(len.replace(',', '.'));
    if (!u || !measured || !(real > 0)) return;
    const k = real / measured;
    const a = calib[0];
    mutate((p) => {
      const x = p.underlays!.find((y) => y.id === u.id)!;
      // масштабируем относительно первой точки, чтобы она осталась на месте
      x.mPerPx *= k;
      x.x = round2(a.x - (a.x - x.x) * k);
      x.y = round2(a.y - (a.y - x.y) * k);
    });
    setCalib([]);
    setLen('');
    setTool('room');
    setMsg({ text: `Масштаб задан. Теперь обводите помещения инструментом «Помещение» — края притягиваются к соседним.` });
  };

  const recognize = async () => {
    if (!u) return;
    setConfirmReplace(false);
    setBusy(true);
    setMsg({ text: 'Claude распознаёт планировку… обычно 30–90 секунд.' });
    try {
      const blob = await (await fetch(u.dataUrl)).blob();
      const img: PreparedImage = { dataUrl: u.dataUrl, blob, w: u.pxW, h: u.pxH, name: 'plan.jpg' };
      const plan = await recognizePlan(img, project.kind, '');
      const { rooms, openings } = planToRooms(plan, level);
      if (!rooms.length) throw new Error('На изображении не удалось найти помещения — обведите их вручную');
      mutate((p) => {
        const old = new Set(p.rooms.filter((r) => r.level === level).map((r) => r.id));
        p.rooms = p.rooms.filter((r) => !old.has(r.id)).concat(rooms);
        p.openings = p.openings.filter((o) => !old.has(o.roomId)).concat(openings);
        p.furniture = p.furniture.filter((f) => f.level !== level);
        p.lights = p.lights.filter((l) => l.level !== level);
        const nu = alignedUnderlay(img, plan, level);
        const x = p.underlays!.find((y) => y.id === u.id)!;
        Object.assign(x, { x: nu.x, y: nu.y, mPerPx: nu.mPerPx, opacity: 0.45 });
      });
      setMsg({ text: `Распознано помещений: ${rooms.length}, проёмов: ${openings.length}. ${plan.notes ?? ''} Проверьте размеры и поправьте при необходимости.` });
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : String(e), warn: true });
    } finally {
      setBusy(false);
    }
  };

  const set = (patch: Partial<NonNullable<typeof u>>) =>
    mutate((p) => {
      const x = p.underlays?.find((y) => y.id === u?.id);
      if (x) Object.assign(x, patch);
    }, { history: false });

  return (
    <div className="underlay-panel">
      <h4>Планировка заказчика{project.levels > 1 ? ` · ${level + 1} эт.` : ''}</h4>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      {!u ? (
        <>
          <button className="btn full" onClick={() => fileRef.current?.click()}>
            Загрузить изображение плана
          </button>
          <p className="muted small">Чертёж, скан, фото или рисунок от руки (JPG, PNG). Его можно распознать автоматически или обвести вручную.</p>
        </>
      ) : (
        <>
          <div className="row-inline">
            <label className="check">
              <input type="checkbox" checked={u.visible} onChange={(e) => set({ visible: e.target.checked })} /> показать
            </label>
            <input type="range" min={0.1} max={1} step={0.05} value={u.opacity} onChange={(e) => set({ opacity: parseFloat(e.target.value) })} title="Прозрачность" />
          </div>
          <div className="tool-grid">
            <button className={'tool' + (tool === 'calibrate' ? ' active' : '')} onClick={() => setTool(tool === 'calibrate' ? 'select' : 'calibrate')}>
              Масштаб
            </button>
            <button className={'tool' + (tool === 'underlay' ? ' active' : '')} onClick={() => setTool(tool === 'underlay' ? 'select' : 'underlay')}>
              Сдвинуть
            </button>
          </div>
          {tool === 'calibrate' && (
            <div className="calib">
              {calib.length < 2 ? (
                <span className="muted small">Кликните по {calib.length === 0 ? 'первому' : 'второму'} концу отрезка известной длины.</span>
              ) : (
                <>
                  <span className="small">Сейчас: {measured.toFixed(2)} м. Реальная длина:</span>
                  <div className="row-inline">
                    <input autoFocus value={len} onChange={(e) => setLen(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyCalib()} placeholder="напр. 4,2" style={{ width: 90 }} />
                    <span className="small">м</span>
                    <button className="btn sm primary" onClick={applyCalib}>
                      Применить
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          {tool === 'underlay' && <span className="muted small">Перетащите план мышью, чтобы совместить подложку с помещениями.</span>}
          {ai && (
            <>
              {confirmReplace ? (
                <div className="hint">
                  Помещения этажа ({roomsOnLevel}) будут заменены распознанными, мебель и свет этажа удалятся.
                  <div className="row-inline">
                    <button className="btn sm primary" onClick={recognize}>
                      Заменить
                    </button>
                    <button className="btn sm" onClick={() => setConfirmReplace(false)}>
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <button className="btn full" disabled={busy} onClick={() => (roomsOnLevel ? setConfirmReplace(true) : recognize())}>
                  {busy ? 'Распознаю…' : 'Распознать помещения (AI)'}
                </button>
              )}
            </>
          )}
          <div className="row-inline">
            <button className="link" onClick={() => fileRef.current?.click()}>
              заменить изображение
            </button>
            <button className="link danger" onClick={() => mutate((p) => void (p.underlays = (p.underlays ?? []).filter((x) => x.id !== u.id)))}>
              убрать
            </button>
          </div>
        </>
      )}
      {msg && <div className={'hint' + (msg.warn ? ' warn' : '')}>{msg.text}</div>}
    </div>
  );
}

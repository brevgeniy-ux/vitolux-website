import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { alignedUnderlay, makeUnderlay, planToRooms, recognizePlan, type PreparedImage } from '../lib/recognize';
import { buildFromUnderlay, parseExplication } from '../lib/localRecognize';
import { aiMaxImages } from '../lib/ai';
import { furnishProject } from '../lib/autoFurnish';
import { lightProject } from '../lib/lighting';
import type { Opening, Room, Underlay } from '../types';
import { dataUrlToBlob, fileToImages } from '../lib/materials';
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
  const [confirmReplace, setConfirmReplace] = useState<'auto' | 'local' | null>(null);
  const roomsOnLevel = project.rooms.filter((r) => r.level === level).length;

  useEffect(() => {
    aiStatus().then(setAi);
  }, []);

  const upload = async (file: File) => {
    setMsg(null);
    try {
      setMsg({ text: `Читаю «${file.name}»…` });
      const img = (await fileToImages(file, (m) => setMsg({ text: m })))[0];
      mutate((p) => {
        p.underlays = (p.underlays ?? []).filter((x) => x.level !== level);
        p.underlays.push(makeUnderlay(img, level));
      });
      setTool('crop');
      const rows = parseExplication(img.text ?? '');
      setMsg({
        text:
          'Подложка загружена. Шаг 1: обведите мышью рамкой сам план (без штампа, таблиц и картинок). Шаг 2: нажмите «Распознать помещения».' +
          (rows.length ? ` Найдена экспликация (${rows.length} помещ.) — масштаб и названия определятся автоматически.` : ' Если на листе нет таблицы площадей, перед распознаванием задайте «Масштаб».'),
      });
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
      x.calibrated = true;
      x.x = round2(a.x - (a.x - x.x) * k);
      x.y = round2(a.y - (a.y - x.y) * k);
    });
    setCalib([]);
    setLen('');
    setTool('room');
    setMsg({ text: `Масштаб задан. Теперь обводите помещения инструментом «Помещение» — края притягиваются к соседним.` });
  };

  const applyRooms = (rooms: Room[], openings: Opening[], patch: Partial<Underlay>) =>
    mutate((p) => {
      const old = new Set(p.rooms.filter((r) => r.level === level).map((r) => r.id));
      p.rooms = p.rooms.filter((r) => !old.has(r.id)).concat(rooms);
      p.openings = p.openings.filter((o) => !old.has(o.roomId)).concat(openings);
      p.furniture = p.furniture.filter((f) => f.level !== level);
      p.lights = p.lights.filter((l) => l.level !== level);
      const x = p.underlays!.find((y) => y.id === u!.id)!;
      Object.assign(x, patch, { opacity: 0.45 });
      p.furniture = furnishProject(p, rooms.map((r) => r.id));
      p.lights = lightProject(p, rooms.map((r) => r.id));
    });

  const recognizeLocal = async (prefix = '') => {
    const res = await buildFromUnderlay(u!, level);
    applyRooms(res.rooms, res.openings, { mPerPx: res.mPerPx, calibrated: true });
    setMsg({ text: `${prefix}Распознано помещений: ${res.rooms.length}, дверей и окон: ${res.openings.length}. ${res.notes} Мебель и свет расставлены. Проверьте размеры и назначение помещений и поправьте при необходимости.` });
  };

  const recognize = async (mode: 'auto' | 'local') => {
    if (!u) return;
    setConfirmReplace(null);
    setBusy(true);
    try {
      const withAi = mode === 'auto' && ai && (await aiMaxImages()) > 0;
      if (!withAi) {
        setMsg({ text: 'Ищу стены и помещения на чертеже…' });
        await recognizeLocal();
        return;
      }
      setMsg({ text: 'Claude распознаёт планировку… обычно 30–90 секунд.' });
      try {
        const blob = dataUrlToBlob(u.dataUrl);
        const img: PreparedImage = { dataUrl: u.dataUrl, blob, w: u.pxW, h: u.pxH, name: 'plan.jpg' };
        const plan = await recognizePlan(img, project.kind, u.text ? `Текст с листа: ${u.text.slice(0, 1500)}` : '');
        const { rooms, openings } = planToRooms(plan, level);
        if (!rooms.length) throw new Error('помещения не найдены');
        const nu = alignedUnderlay(img, plan, level);
        applyRooms(rooms, openings, { x: nu.x, y: nu.y, mPerPx: nu.mPerPx, calibrated: true });
        setMsg({ text: `Распознано помещений: ${rooms.length}, проёмов: ${openings.length}. ${plan.notes ?? ''} Проверьте размеры и поправьте при необходимости.` });
      } catch (e) {
        // ИИ не справился — пробуем без него
        await recognizeLocal(`ИИ: ${e instanceof Error ? e.message : String(e)}. Распознал без ИИ. `);
      }
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
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,.pdf,image/*"
        hidden
        onChange={(e) => {
          if (e.target.files?.[0]) upload(e.target.files[0]);
          e.target.value = '';
        }}
      />
      {!u ? (
        <>
          <button className="btn full" onClick={() => fileRef.current?.click()}>
            Загрузить изображение плана
          </button>
          <p className="muted small">Чертёж, скан, фото или рисунок от руки (PDF — берётся первая страница, JPG, PNG). Его можно распознать автоматически или обвести вручную.</p>
        </>
      ) : (
        <>
          <div className="row-inline">
            <label className="check">
              <input type="checkbox" checked={u.visible} onChange={(e) => set({ visible: e.target.checked })} /> показать
            </label>
            <input type="range" min={0.1} max={1} step={0.05} value={u.opacity} onChange={(e) => set({ opacity: parseFloat(e.target.value) })} title="Прозрачность" />
          </div>
          <div className="tool-grid three">
            <button className={'tool' + (tool === 'crop' ? ' active' : '')} onClick={() => setTool(tool === 'crop' ? 'select' : 'crop')} title="Обвести рамкой сам план на листе">
              Рамка
            </button>
            <button className={'tool' + (tool === 'calibrate' ? ' active' : '')} onClick={() => setTool(tool === 'calibrate' ? 'select' : 'calibrate')}>
              Масштаб
            </button>
            <button className={'tool' + (tool === 'underlay' ? ' active' : '')} onClick={() => setTool(tool === 'underlay' ? 'select' : 'underlay')}>
              Сдвинуть
            </button>
          </div>
          {tool === 'crop' && <span className="muted small">Протяните мышью рамку вокруг самого плана — без штампа, таблицы и картинок.</span>}
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
          {confirmReplace ? (
            <div className="hint">
              Помещения этажа ({roomsOnLevel}) будут заменены распознанными, мебель и свет этажа — расставлены заново.
              <div className="row-inline">
                <button className="btn sm primary" onClick={() => recognize(confirmReplace)}>
                  Заменить
                </button>
                <button className="btn sm" onClick={() => setConfirmReplace(null)}>
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <>
              <button className="btn full primary" disabled={busy} onClick={() => (roomsOnLevel ? setConfirmReplace('auto') : recognize('auto'))}>
                {busy ? 'Распознаю…' : 'Распознать помещения'}
              </button>
              {ai && (
                <button className="link" disabled={busy} onClick={() => (roomsOnLevel ? setConfirmReplace('local') : recognize('local'))}>
                  распознать без ИИ (по линиям чертежа)
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

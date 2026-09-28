import { useEffect } from 'react';
import { useStore, type View } from '../store';
import { PlanEditor, deleteSelection, duplicateSelection, nudgeSelection, rotateSelection } from './PlanEditor';
import { Library } from './Library';
import { Inspector } from './Inspector';
import { View3D } from './View3D';
import { ProjectDoc } from './ProjectDoc';
import { AssistantPanel } from './AssistantPanel';
import { buildEstimate, money, num } from '../lib/estimate';

const VIEWS: [View, string][] = [
  ['plan', 'План'],
  ['split', 'План + 3D'],
  ['3d', '3D'],
  ['docs', 'Альбом проекта'],
];

export function Workspace() {
  const project = useStore((s) => s.project)!;
  const view = useStore((s) => s.view);
  const level = useStore((s) => s.level);
  const assistantOpen = useStore((s) => s.assistantOpen);
  const past = useStore((s) => s.past.length);
  const future = useStore((s) => s.future.length);
  const { setView, setLevel, undo, redo, open, mutate, setTool, setPlacing, select } = useStore.getState();
  const est = buildEstimate(project);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelection();
      } else if (e.key === 'Delete' || e.key === 'Backspace') deleteSelection();
      else if (e.key === 'Escape') {
        setPlacing(null);
        setTool('select');
        select(null);
      } else if (e.key.toLowerCase() === 'r') rotateSelection(e.shiftKey ? -90 : 90);
      else if (e.key.toLowerCase() === 'v') setTool('select');
      else if (e.key.toLowerCase() === 'm') setTool('room');
      else if (e.key.toLowerCase() === 'd') setTool('door');
      else if (e.key.toLowerCase() === 'w') setTool('window');
      else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        const s = e.shiftKey ? 0.5 : 0.05;
        const [dx, dy] = { ArrowLeft: [-s, 0], ArrowRight: [s, 0], ArrowUp: [0, -s], ArrowDown: [0, s] }[e.key] ?? [0, 0];
        nudgeSelection(dx, dy);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, setPlacing, setTool, select]);

  const levels = Math.max(project.levels, ...project.rooms.map((r) => r.level + 1));

  return (
    <div className="workspace">
      <header className="topbar no-print">
        <button className="brand" onClick={() => open(null)} title="К списку проектов">
          <span className="logo">◆</span> Vitolux <b>Design Studio</b>
        </button>
        <input className="title-input" value={project.name} onChange={(e) => mutate((p) => void (p.name = e.target.value), { history: false })} />
        <div className="seg">
          {VIEWS.map(([v, l]) => (
            <button key={v} className={view === v ? 'active' : ''} onClick={() => setView(v)}>
              {l}
            </button>
          ))}
        </div>
        {(levels > 1 || project.kind === 'house') && (
          <div className="seg small">
            {Array.from({ length: levels }).map((_, i) => (
              <button key={i} className={level === i ? 'active' : ''} onClick={() => setLevel(i)}>
                {i + 1} эт.
              </button>
            ))}
            {project.kind === 'house' && (
              <button
                title="Добавить этаж"
                onClick={() => {
                  mutate((p) => void (p.levels = levels + 1));
                  setLevel(levels);
                }}
              >
                +
              </button>
            )}
          </div>
        )}
        <div className="grow" />
        <button className={'ai-btn' + (assistantOpen ? ' active' : '')} onClick={() => useStore.getState().setAssistantOpen(!assistantOpen)}>
          ✦ ИИ-дизайнер
        </button>
        <button className="icon-btn" disabled={!past} onClick={undo} title="Отменить (Ctrl+Z)">
          ↶
        </button>
        <button className="icon-btn" disabled={!future} onClick={redo} title="Повторить (Ctrl+Y)">
          ↷
        </button>
        <div className="summary">
          <span>{num(est.area, 1)} м²</span>
          <span>{money(est.total)}</span>
        </div>
      </header>

      {view === 'docs' ? (
        <main className={'docs-wrap' + (assistantOpen ? ' with-ai' : '')}>
          <div className="docs-scroll">
            <ProjectDoc />
          </div>
          {assistantOpen && <AssistantPanel />}
        </main>
      ) : (
        <main className={'main' + (assistantOpen ? ' with-ai' : '')}>
          <Library />
          <section className={'stage ' + view}>
            {view !== '3d' && (
              <div className="stage-plan">
                <PlanEditor />
              </div>
            )}
            {view !== 'plan' && (
              <div className="stage-3d">
                <View3D />
              </div>
            )}
          </section>
          <aside className="panel right">
            <Inspector />
          </aside>
          {assistantOpen && <AssistantPanel />}
        </main>
      )}
    </div>
  );
}

import { create } from 'zustand';
import type { Project, Selection } from './types';
import { db } from './lib/db';

export type Tool = 'select' | 'room' | 'door' | 'window';
export type View = 'plan' | '3d' | 'split' | 'docs';

interface State {
  projects: Project[];
  loaded: boolean;
  project: Project | null;
  selection: Selection;
  level: number;
  tool: Tool;
  view: View;
  /** Каталог-предмет, который будет поставлен кликом на плане */
  placing: { kind: 'furniture' | 'light'; catalogId: string } | null;
  past: Project[];
  future: Project[];

  load: () => Promise<void>;
  open: (id: string | null) => void;
  create: (p: Project) => void;
  remove: (id: string) => Promise<void>;
  duplicate: (id: string) => void;
  /** Изменение проекта с записью в историю */
  mutate: (fn: (p: Project) => void, opts?: { history?: boolean }) => void;
  /** Зафиксировать текущее состояние в истории (перед серией «тихих» изменений, напр. перетаскивания) */
  checkpoint: () => void;
  undo: () => void;
  redo: () => void;
  select: (s: Selection) => void;
  setLevel: (l: number) => void;
  setTool: (t: Tool) => void;
  setView: (v: View) => void;
  setPlacing: (p: State['placing']) => void;
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;
function scheduleSave(p: Project) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    db.put(p).catch((e) => console.error('Не удалось сохранить проект', e));
  }, 400);
}

export const useStore = create<State>((set, get) => ({
  projects: [],
  loaded: false,
  project: null,
  selection: null,
  level: 0,
  tool: 'select',
  view: 'split',
  placing: null,
  past: [],
  future: [],

  load: async () => {
    try {
      const projects = (await db.all()).sort((a, b) => b.updatedAt - a.updatedAt);
      set({ projects, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
  open: (id) => {
    const p = id ? get().projects.find((x) => x.id === id) ?? null : null;
    set({ project: p ? structuredClone(p) : null, selection: null, level: 0, past: [], future: [], placing: null, tool: 'select' });
  },
  create: (p) => {
    set((s) => ({ projects: [p, ...s.projects], project: structuredClone(p), selection: null, level: 0, past: [], future: [], view: 'split' }));
    db.put(p);
  },
  remove: async (id) => {
    await db.remove(id);
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id), project: s.project?.id === id ? null : s.project }));
  },
  duplicate: (id) => {
    const src = get().projects.find((p) => p.id === id);
    if (!src) return;
    const copy: Project = { ...structuredClone(src), id: Math.random().toString(36).slice(2, 10), name: src.name + ' (копия)', createdAt: Date.now(), updatedAt: Date.now() };
    set((s) => ({ projects: [copy, ...s.projects] }));
    db.put(copy);
  },
  mutate: (fn, opts) => {
    const cur = get().project;
    if (!cur) return;
    const next = structuredClone(cur);
    fn(next);
    next.updatedAt = Date.now();
    const history = opts?.history ?? true;
    set((s) => ({
      project: next,
      past: history ? [...s.past.slice(-60), cur] : s.past,
      future: history ? [] : s.future,
      projects: s.projects.map((p) => (p.id === next.id ? next : p)),
    }));
    scheduleSave(next);
  },
  checkpoint: () => {
    const cur = get().project;
    if (cur) set((s) => ({ past: [...s.past.slice(-60), structuredClone(cur)], future: [] }));
  },
  undo: () => {
    const { past, project } = get();
    if (!past.length || !project) return;
    const prev = past[past.length - 1];
    set((s) => ({ project: prev, past: s.past.slice(0, -1), future: [project, ...s.future], projects: s.projects.map((p) => (p.id === prev.id ? prev : p)) }));
    scheduleSave(prev);
  },
  redo: () => {
    const { future, project } = get();
    if (!future.length || !project) return;
    const next = future[0];
    set((s) => ({ project: next, future: s.future.slice(1), past: [...s.past, project], projects: s.projects.map((p) => (p.id === next.id ? next : p)) }));
    scheduleSave(next);
  },
  select: (selection) => set({ selection }),
  setLevel: (level) => set({ level, selection: null }),
  setTool: (tool) => set({ tool, placing: null }),
  setView: (view) => set({ view }),
  setPlacing: (placing) => set({ placing, tool: 'select' }),
}));

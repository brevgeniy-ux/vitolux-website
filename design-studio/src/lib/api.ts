import type { ProjectKind, RoomType, StyleId } from '../types';

export interface AiConcept {
  name: string;
  kind: ProjectKind;
  style: StyleId;
  ceilingHeight: number;
  concept: string;
  rooms: { type: RoomType; name: string; area: number; level: number }[];
}

export async function aiStatus(): Promise<boolean> {
  try {
    const r = await fetch('/api/health');
    if (!r.ok) return false;
    const j = await r.json();
    return Boolean(j.ai);
  } catch {
    return false;
  }
}

export async function aiConcept(brief: string, kind: ProjectKind, area: number | null): Promise<AiConcept> {
  const r = await fetch('/api/concept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brief, kind, area }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `Ошибка сервера (${r.status})`);
  return j as AiConcept;
}

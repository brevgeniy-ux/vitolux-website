// Импорт материалов: PDF (страницы → изображения + текст), изображения, текстовые файлы.
import type { Material, MaterialPage } from '../types';
import { uid } from './geometry';
import { prepareImage, type PreparedImage } from './recognize';

const MAX_PDF_PAGES = 40;
const PAGE_PIXELS = 1_150_000;

let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;

/** pdf.js с воркером из blob: — работает и локально, и на странице-артефакте */
function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const [pdfjs, worker] = await Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?raw')]);
      const url = URL.createObjectURL(new Blob([worker.default], { type: 'text/javascript' }));
      pdfjs.GlobalWorkerOptions.workerPort = new Worker(url, { type: 'module' });
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}

export async function pdfToPages(file: File, onProgress?: (done: number, total: number) => void): Promise<{ pages: MaterialPage[]; text: string; total: number }> {
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const total = doc.numPages;
  const n = Math.min(total, MAX_PDF_PAGES);
  const pages: MaterialPage[] = [];
  const texts: string[] = [];
  for (let i = 1; i <= n; i++) {
    const page = await doc.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(3, Math.sqrt(PAGE_PIXELS / (base.width * base.height)));
    const vp = page.getViewport({ scale });
    const cv = document.createElement('canvas');
    cv.width = Math.round(vp.width);
    cv.height = Math.round(vp.height);
    const g = cv.getContext('2d')!;
    g.fillStyle = '#fff';
    g.fillRect(0, 0, cv.width, cv.height);
    await page.render({ canvasContext: g, viewport: vp }).promise;
    pages.push({ dataUrl: cv.toDataURL('image/jpeg', 0.85), w: cv.width, h: cv.height });
    const tc = await page.getTextContent();
    const t = tc.items
      .map((it) => ('str' in it ? it.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (t) texts.push(`[стр. ${i}] ${t}`);
    onProgress?.(i, n);
  }
  await doc.destroy();
  return { pages, text: texts.join('\n'), total };
}

export async function importMaterial(file: File, onProgress?: (msg: string) => void): Promise<Material> {
  const name = file.name;
  const lower = name.toLowerCase();
  if (file.type === 'application/pdf' || lower.endsWith('.pdf')) {
    const { pages, text, total } = await pdfToPages(file, (d, t) => onProgress?.(`${name}: страница ${d} из ${t}`));
    if (!pages.length) throw new Error(`В «${name}» нет страниц`);
    return { id: uid(), name: total > pages.length ? `${name} (первые ${pages.length} из ${total} стр.)` : name, kind: 'pdf', pages, text, addedAt: Date.now() };
  }
  if (file.type.startsWith('image/')) {
    const img = await prepareImage(file);
    return { id: uid(), name, kind: 'image', pages: [{ dataUrl: img.dataUrl, w: img.w, h: img.h }], text: '', addedAt: Date.now() };
  }
  if (file.type.startsWith('text/') || /\.(txt|md|csv|json)$/.test(lower)) {
    const text = (await file.text()).slice(0, 60_000);
    return { id: uid(), name, kind: 'text', pages: [], text, addedAt: Date.now() };
  }
  throw new Error(`«${name}»: формат не поддерживается. Загрузите PDF, JPG/PNG/WebP или текстовый файл (DOCX сохраните в PDF).`);
}

/** Файл → изображения для распознавания планировки (PDF — по картинке на страницу) */
export async function fileToImages(file: File, onProgress?: (msg: string) => void): Promise<PreparedImage[]> {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    const { pages } = await pdfToPages(file, (d, t) => onProgress?.(`${file.name}: страница ${d} из ${t}`));
    return Promise.all(pages.map(async (p, i) => ({ dataUrl: p.dataUrl, blob: await pageBlob(p), w: p.w, h: p.h, name: `${file.name}, стр. ${i + 1}` })));
  }
  return [await prepareImage(file)];
}

export async function pageBlob(p: MaterialPage): Promise<Blob> {
  return (await fetch(p.dataUrl)).blob();
}

/** Все страницы материалов в виде плоского списка с подписями */
export function allPages(materials: Material[]) {
  return materials.flatMap((m) => m.pages.map((p, i) => ({ material: m, page: p, index: i, label: `${m.name}, стр. ${i + 1}` })));
}

export const ACCEPT_MATERIALS = 'application/pdf,.pdf,image/*,text/plain,.txt,.md';

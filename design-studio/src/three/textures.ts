import * as THREE from 'three';
import type { FloorMaterial, WallFinish } from '../data/materials';

const cache = new Map<string, THREE.CanvasTexture>();

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function shade(hex: string, k: number) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, k);
  return '#' + c.getHexString();
}

function draw(fm: FloorMaterial): HTMLCanvasElement {
  const S = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d')!;
  const r = rng(fm.id.split('').reduce((a, c) => a + c.charCodeAt(0), 7));
  g.fillStyle = fm.base;
  g.fillRect(0, 0, S, S);

  const grain = (x: number, y: number, w: number, h: number, horizontal: boolean) => {
    for (let i = 0; i < 18; i++) {
      g.strokeStyle = shade(fm.accent, (r() - 0.5) * 0.08);
      g.globalAlpha = 0.25 + r() * 0.2;
      g.lineWidth = 0.6 + r() * 1.2;
      g.beginPath();
      if (horizontal) {
        const yy = y + r() * h;
        g.moveTo(x, yy);
        g.bezierCurveTo(x + w * 0.3, yy + (r() - 0.5) * 6, x + w * 0.7, yy + (r() - 0.5) * 6, x + w, yy);
      } else {
        const xx = x + r() * w;
        g.moveTo(xx, y);
        g.bezierCurveTo(xx + (r() - 0.5) * 6, y + h * 0.3, xx + (r() - 0.5) * 6, y + h * 0.7, xx, y + h);
      }
      g.stroke();
    }
    g.globalAlpha = 1;
  };

  switch (fm.pattern) {
    case 'planks': {
      const rows = 6;
      const h = S / rows;
      for (let i = 0; i < rows; i++) {
        let x = -r() * S * 0.5;
        while (x < S) {
          const w = S * (0.45 + r() * 0.5);
          g.fillStyle = shade(fm.base, (r() - 0.5) * 0.07);
          g.fillRect(x, i * h, w, h);
          grain(x, i * h, w, h, true);
          g.strokeStyle = shade(fm.accent, -0.12);
          g.lineWidth = 1.5;
          g.strokeRect(x, i * h, w, h);
          x += w;
        }
      }
      break;
    }
    case 'herringbone': {
      const L = S / 4;
      const W = L / 4;
      g.save();
      for (let row = -2; row < 10; row++) {
        for (let col = -2; col < 10; col++) {
          const ox = col * L - row * 0;
          const oy = row * L;
          for (let k = 0; k < 4; k++) {
            g.fillStyle = shade(fm.base, (r() - 0.5) * 0.08);
            g.save();
            g.translate(ox + k * W, oy + k * W);
            g.rotate(Math.PI / 4);
            g.fillRect(0, 0, L, W);
            g.strokeStyle = shade(fm.accent, -0.1);
            g.strokeRect(0, 0, L, W);
            g.restore();
            g.save();
            g.translate(ox + k * W + W * 0.7, oy + k * W + W * 0.7);
            g.rotate(-Math.PI / 4);
            g.fillStyle = shade(fm.base, (r() - 0.5) * 0.08);
            g.fillRect(0, 0, L, W);
            g.strokeStyle = shade(fm.accent, -0.1);
            g.strokeRect(0, 0, L, W);
            g.restore();
          }
        }
      }
      g.restore();
      break;
    }
    case 'tiles': {
      const n = 2;
      const t = S / n;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          g.fillStyle = shade(fm.base, (r() - 0.5) * 0.04);
          g.fillRect(i * t, j * t, t, t);
          for (let k = 0; k < 300; k++) {
            g.fillStyle = shade(fm.accent, (r() - 0.5) * 0.2);
            g.globalAlpha = 0.15;
            g.fillRect(i * t + r() * t, j * t + r() * t, 2 + r() * 3, 2 + r() * 3);
          }
          g.globalAlpha = 1;
        }
      g.strokeStyle = fm.accent;
      g.lineWidth = 3;
      for (let i = 0; i <= n; i++) {
        g.beginPath();
        g.moveTo(i * t, 0);
        g.lineTo(i * t, S);
        g.moveTo(0, i * t);
        g.lineTo(S, i * t);
        g.stroke();
      }
      break;
    }
    case 'concrete':
    case 'carpet': {
      const n = fm.pattern === 'carpet' ? 9000 : 4000;
      for (let k = 0; k < n; k++) {
        g.fillStyle = shade(fm.accent, (r() - 0.5) * 0.25);
        g.globalAlpha = fm.pattern === 'carpet' ? 0.35 : 0.12;
        const s = fm.pattern === 'carpet' ? 2 : 2 + r() * 10;
        g.beginPath();
        g.arc(r() * S, r() * S, s, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
      break;
    }
    case 'marble': {
      for (let k = 0; k < 14; k++) {
        g.strokeStyle = shade(fm.accent, (r() - 0.5) * 0.2);
        g.globalAlpha = 0.25 + r() * 0.35;
        g.lineWidth = 0.5 + r() * 2.5;
        g.beginPath();
        let x = r() * S;
        let y = 0;
        g.moveTo(x, y);
        while (y < S) {
          x += (r() - 0.5) * 60;
          y += 20 + r() * 40;
          g.lineTo(x, y);
        }
        g.stroke();
      }
      g.globalAlpha = 1;
      g.strokeStyle = shade(fm.accent, 0.1);
      g.lineWidth = 2;
      g.strokeRect(0, 0, S, S / 2);
      g.strokeRect(0, S / 2, S, S / 2);
      break;
    }
  }
  return cv;
}

export function floorTexture(fm: FloorMaterial, w: number, d: number): THREE.Texture {
  let base = cache.get(fm.id);
  if (!base) {
    base = new THREE.CanvasTexture(draw(fm));
    base.colorSpace = THREE.SRGBColorSpace;
    base.anisotropy = 8;
    cache.set(fm.id, base);
  }
  const t = base.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(w / fm.tile, d / fm.tile);
  t.needsUpdate = true;
  return t;
}

// ---------- Отделка стен ----------

const wallCache = new Map<string, THREE.CanvasTexture>();

function drawWall(f: WallFinish, base: string): HTMLCanvasElement {
  const S = 512;
  const cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d')!;
  const r = rng(f.id.split('').reduce((a, c) => a + c.charCodeAt(0), 11));
  const accent = f.tinted ? shade(base, -0.06) : f.accent;
  g.fillStyle = base;
  g.fillRect(0, 0, S, S);
  const noise = (n: number, size: number, alpha: number, k = 0.12) => {
    for (let i = 0; i < n; i++) {
      g.fillStyle = shade(base, (r() - 0.5) * k);
      g.globalAlpha = alpha;
      g.beginPath();
      g.arc(r() * S, r() * S, size * (0.4 + r()), 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  };
  switch (f.pattern) {
    case 'paint':
      noise(600, 3, 0.05, 0.04);
      break;
    case 'plaster':
    case 'microcement':
      noise(f.pattern === 'plaster' ? 1800 : 2600, f.pattern === 'plaster' ? 16 : 10, 0.08, 0.14);
      break;
    case 'wallpaper': {
      noise(900, 2, 0.12, 0.08);
      g.strokeStyle = accent;
      g.globalAlpha = 0.35;
      const stripes = f.id.includes('stripe') ? 16 : 0;
      for (let i = 0; i < stripes; i++) {
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo((i + 0.5) * (S / stripes), 0);
        g.lineTo((i + 0.5) * (S / stripes), S);
        g.stroke();
      }
      g.globalAlpha = 0.18;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(1, 0);
      g.lineTo(1, S);
      g.stroke();
      g.globalAlpha = 1;
      break;
    }
    case 'brick': {
      g.fillStyle = f.accent;
      g.fillRect(0, 0, S, S);
      const rows = 8;
      const h = S / rows;
      for (let i = 0; i < rows; i++) {
        const off = i % 2 ? S / 4 : 0;
        for (let x = -off; x < S; x += S / 2) {
          g.fillStyle = shade(base, (r() - 0.5) * 0.14);
          g.fillRect(x + 3, i * h + 3, S / 2 - 6, h - 6);
          for (let k = 0; k < 40; k++) {
            g.fillStyle = shade(base, (r() - 0.5) * 0.25);
            g.globalAlpha = 0.3;
            g.fillRect(x + 3 + r() * (S / 2 - 8), i * h + 3 + r() * (h - 8), 3, 2);
          }
          g.globalAlpha = 1;
        }
      }
      break;
    }
    case 'slats': {
      g.fillStyle = f.accent;
      g.fillRect(0, 0, S, S);
      const n = 8;
      const w = S / n;
      for (let i = 0; i < n; i++) {
        g.fillStyle = shade(base, (r() - 0.5) * 0.08);
        g.fillRect(i * w + 6, 0, w - 12, S);
        for (let k = 0; k < 6; k++) {
          g.strokeStyle = shade(base, -0.08);
          g.globalAlpha = 0.35;
          g.beginPath();
          const xx = i * w + 8 + r() * (w - 16);
          g.moveTo(xx, 0);
          g.lineTo(xx + (r() - 0.5) * 4, S);
          g.stroke();
        }
        g.globalAlpha = 1;
      }
      break;
    }
    case 'panels': {
      noise(400, 3, 0.05, 0.04);
      g.strokeStyle = shade(base, -0.12);
      g.lineWidth = 5;
      g.strokeRect(60, 60, S - 120, S * 0.55 - 60);
      g.strokeRect(60, S * 0.62, S - 120, S * 0.3);
      g.strokeStyle = shade(base, 0.08);
      g.lineWidth = 2;
      g.strokeRect(66, 66, S - 132, S * 0.55 - 72);
      break;
    }
    case 'tile': {
      const n = f.tile <= 0.3 ? 4 : 2;
      const t = S / n;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          g.fillStyle = shade(base, (r() - 0.5) * (f.id.includes('zellige') ? 0.18 : 0.03));
          g.fillRect(i * t, j * t, t, t);
        }
      g.strokeStyle = f.tinted ? f.accent : accent;
      g.lineWidth = 4;
      for (let i = 0; i <= n; i++) {
        g.beginPath();
        g.moveTo(i * t, 0);
        g.lineTo(i * t, S);
        g.moveTo(0, i * t);
        g.lineTo(S, i * t);
        g.stroke();
      }
      break;
    }
    case 'stone': {
      for (let k = 0; k < 12; k++) {
        g.strokeStyle = shade(f.accent, (r() - 0.5) * 0.2);
        g.globalAlpha = 0.2 + r() * 0.3;
        g.lineWidth = 0.5 + r() * 2.5;
        g.beginPath();
        let x = 0;
        let y = r() * S;
        g.moveTo(x, y);
        while (x < S) {
          x += 20 + r() * 40;
          y += (r() - 0.5) * 50;
          g.lineTo(x, y);
        }
        g.stroke();
      }
      g.globalAlpha = 1;
      if (f.id.includes('travertine')) noise(1500, 2, 0.35, 0.3);
      g.strokeStyle = shade(base, -0.1);
      g.lineWidth = 2;
      g.strokeRect(0, 0, S, S);
      break;
    }
  }
  return cv;
}

/** Текстура отделки стены для участка длиной len и высотой h (м) */
export function wallTexture(f: WallFinish, color: string, len: number, h: number): THREE.Texture | null {
  if (f.pattern === 'paint') return null;
  const base = f.tinted ? color : f.color;
  const key = f.id + base;
  let t = wallCache.get(key);
  if (!t) {
    t = new THREE.CanvasTexture(drawWall(f, base));
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    wallCache.set(key, t);
  }
  const c = t.clone();
  c.wrapS = c.wrapT = THREE.RepeatWrapping;
  c.repeat.set(len / f.tile, h / f.tile);
  c.needsUpdate = true;
  return c;
}

/** Базовый цвет отделки (для плана и ведомости) */
export const finishColor = (f: WallFinish, wallColor: string) => (f.tinted ? wallColor : f.color);

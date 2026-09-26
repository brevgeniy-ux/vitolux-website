import * as THREE from 'three';
import type { FloorMaterial } from '../data/materials';

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

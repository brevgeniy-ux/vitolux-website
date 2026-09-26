import type { FurnitureDef } from '../data/furniture';

export interface Palette {
  main: string;
  wood: string;
  fabric: string;
  accent: string;
  metal: string;
  white: string;
}

type V3 = [number, number, number];

/** Прямоугольный блок: pos — центр по X/Z и НИЗ по Y */
function B({ p, s, c, r = 0.7, m = 0, o = 1 }: { p: V3; s: V3; c: string; r?: number; m?: number; o?: number }) {
  return (
    <mesh position={[p[0], p[1] + s[1] / 2, p[2]]} castShadow receiveShadow>
      <boxGeometry args={s} />
      <meshStandardMaterial color={c} roughness={r} metalness={m} transparent={o < 1} opacity={o} />
    </mesh>
  );
}

function Cyl({ p, rad, h, c, r = 0.6, m = 0, seg = 24, rt }: { p: V3; rad: number; h: number; c: string; r?: number; m?: number; seg?: number; rt?: number }) {
  return (
    <mesh position={[p[0], p[1] + h / 2, p[2]]} castShadow receiveShadow>
      <cylinderGeometry args={[rt ?? rad, rad, h, seg]} />
      <meshStandardMaterial color={c} roughness={r} metalness={m} />
    </mesh>
  );
}

function Legs({ w, d, h, c, inset = 0.05, rad = 0.02 }: { w: number; d: number; h: number; c: string; inset?: number; rad?: number }) {
  const xs = [-w / 2 + inset, w / 2 - inset];
  const zs = [-d / 2 + inset, d / 2 - inset];
  return (
    <>
      {xs.flatMap((x) => zs.map((z) => <Cyl key={`${x}${z}`} p={[x, 0, z]} rad={rad} h={h} c={c} m={0.3} r={0.4} seg={10} />))}
    </>
  );
}

function Chair({ x, z, rot, pal }: { x: number; z: number; rot: number; pal: Palette }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <Legs w={0.42} d={0.42} h={0.45} c={pal.metal} rad={0.012} />
      <B p={[0, 0.45, 0]} s={[0.44, 0.05, 0.44]} c={pal.fabric} r={0.9} />
      <B p={[0, 0.5, -0.2]} s={[0.44, 0.4, 0.04]} c={pal.fabric} r={0.9} />
    </group>
  );
}

export function FurnitureModel({ def, pal }: { def: FurnitureDef; pal: Palette }) {
  const { w, d, h } = def;
  const main = pal.main;
  switch (def.model) {
    case 'sofa':
      return (
        <group>
          <B p={[0, 0.05, 0]} s={[w, 0.35, d]} c={main} r={0.95} />
          <B p={[0, 0.05, -d / 2 + 0.1]} s={[w, h - 0.05, 0.2]} c={main} r={0.95} />
          <B p={[-w / 2 + 0.1, 0.05, 0]} s={[0.2, 0.6, d]} c={main} r={0.95} />
          <B p={[w / 2 - 0.1, 0.05, 0]} s={[0.2, 0.6, d]} c={main} r={0.95} />
          {[-1, 0, 1].map((i) => (
            <B key={i} p={[i * (w - 0.4) / 3, 0.4, 0.08]} s={[(w - 0.44) / 3, 0.12, d - 0.3]} c={main} r={1} />
          ))}
          <B p={[-w / 2 + 0.45, 0.52, -d / 2 + 0.28]} s={[0.4, 0.35, 0.12]} c={pal.accent} r={1} />
          <Legs w={w} d={d} h={0.05} c={pal.metal} />
        </group>
      );
    case 'cornerSofa':
      return (
        <group>
          <B p={[0, 0.05, -d / 2 + 0.475]} s={[w, 0.35, 0.95]} c={main} r={0.95} />
          <B p={[w / 2 - 0.475, 0.05, 0.475]} s={[0.95, 0.35, d - 0.95]} c={main} r={0.95} />
          <B p={[0, 0.05, -d / 2 + 0.1]} s={[w, h - 0.05, 0.2]} c={main} r={0.95} />
          <B p={[-w / 2 + 0.1, 0.05, -d / 2 + 0.475]} s={[0.2, 0.6, 0.95]} c={main} r={0.95} />
          <B p={[w / 2 - 0.1, 0.05, 0]} s={[0.2, h - 0.05, d]} c={main} r={0.95} />
          <B p={[-w / 2 + 0.5, 0.52, -d / 2 + 0.28]} s={[0.42, 0.36, 0.12]} c={pal.accent} r={1} />
        </group>
      );
    case 'armchair':
      return (
        <group>
          <B p={[0, 0.1, 0]} s={[w, 0.32, d]} c={main} r={0.95} />
          <B p={[0, 0.1, -d / 2 + 0.09]} s={[w, h - 0.1, 0.18]} c={main} r={0.95} />
          <B p={[-w / 2 + 0.08, 0.1, 0]} s={[0.16, 0.55, d]} c={main} r={0.95} />
          <B p={[w / 2 - 0.08, 0.1, 0]} s={[0.16, 0.55, d]} c={main} r={0.95} />
          <Legs w={w} d={d} h={0.1} c={pal.wood} />
        </group>
      );
    case 'coffeeTable':
      return (
        <group>
          <B p={[0, h - 0.04, 0]} s={[w, 0.04, d]} c={main} r={0.4} />
          <B p={[0, 0.12, 0]} s={[w - 0.1, 0.02, d - 0.1]} c={main} r={0.5} />
          <Legs w={w} d={d} h={h - 0.04} c={pal.metal} rad={0.015} />
          <Cyl p={[0.2, h, 0]} rad={0.06} h={0.14} c={pal.accent} r={0.3} />
        </group>
      );
    case 'tvUnit':
      return (
        <group>
          <B p={[0, 0.12, 0]} s={[w, h - 0.12, d]} c={main} r={0.5} />
          {[-1, 0, 1].map((i) => (
            <B key={i} p={[i * w / 3, 0.15, d / 2]} s={[w / 3 - 0.02, h - 0.18, 0.01]} c={main} r={0.4} />
          ))}
          <B p={[0, 1.05, -d / 2 + 0.05]} s={[1.4, 0.8, 0.04]} c="#121417" r={0.2} m={0.5} />
        </group>
      );
    case 'bed':
      return (
        <group>
          <B p={[0, 0, 0.05]} s={[w, 0.35, d - 0.1]} c={pal.wood} r={0.6} />
          <B p={[0, 0.35, 0.08]} s={[w - 0.06, 0.2, d - 0.2]} c="#f4f2ee" r={0.95} />
          <B p={[0, 0, -d / 2 + 0.05]} s={[w + 0.1, h, 0.1]} c={main} r={0.95} />
          {(w > 1.2 ? [-w / 4, w / 4] : [0]).map((x) => (
            <B key={x} p={[x, 0.55, -d / 2 + 0.3]} s={[Math.min(0.7, w / 2 - 0.1), 0.14, 0.4]} c="#fbfaf8" r={1} />
          ))}
          <B p={[0, 0.55, d / 2 - 0.55]} s={[w - 0.02, 0.05, 0.9]} c={pal.accent} r={1} />
        </group>
      );
    case 'nightstand':
      return (
        <group>
          <B p={[0, 0.08, 0]} s={[w, h - 0.08, d]} c={main} r={0.5} />
          <Legs w={w} d={d} h={0.08} c={pal.metal} rad={0.012} />
          <B p={[0, 0.3, d / 2]} s={[w - 0.04, 0.005, 0.01]} c={pal.metal} />
        </group>
      );
    case 'wardrobe':
      return (
        <group>
          <B p={[0, 0, 0]} s={[w, h, d]} c={main} r={0.45} />
          {Array.from({ length: Math.max(2, Math.round(w / 0.6)) }).map((_, i, arr) => (
            <B key={i} p={[-w / 2 + (w / arr.length) * (i + 0.5), 0.05, d / 2]} s={[w / arr.length - 0.01, h - 0.1, 0.01]} c={main} r={0.35} />
          ))}
          {Array.from({ length: Math.max(2, Math.round(w / 0.6)) }).map((_, i, arr) => (
            <B key={'h' + i} p={[-w / 2 + (w / arr.length) * (i + 0.5) + (i % 2 ? -1 : 1) * (w / arr.length / 2 - 0.05), 0.9, d / 2 + 0.01]} s={[0.015, 0.3, 0.02]} c={pal.metal} m={0.6} r={0.3} />
          ))}
        </group>
      );
    case 'dresser':
      return (
        <group>
          <B p={[0, 0.1, 0]} s={[w, h - 0.1, d]} c={main} r={0.5} />
          {[0, 1, 2].map((i) => (
            <B key={i} p={[0, 0.14 + i * 0.24, d / 2]} s={[w - 0.04, 0.22, 0.01]} c={main} r={0.4} />
          ))}
          <Legs w={w} d={d} h={0.1} c={pal.metal} rad={0.012} />
          <Cyl p={[w / 3, h, 0]} rad={0.08} h={0.25} rt={0.03} c={pal.accent} r={0.3} />
        </group>
      );
    case 'diningTable': {
      const seats = w > 1.7 ? 3 : 2;
      return (
        <group>
          <B p={[0, h - 0.04, 0]} s={[w, 0.04, d]} c={main} r={0.45} />
          <Legs w={w} d={d} h={h - 0.04} c={pal.metal} inset={0.08} rad={0.025} />
          {Array.from({ length: seats }).map((_, i) => {
            const x = -w / 2 + (w / seats) * (i + 0.5);
            return (
              <group key={i}>
                <Chair x={x} z={-d / 2 - 0.12} rot={0} pal={pal} />
                <Chair x={x} z={d / 2 + 0.12} rot={Math.PI} pal={pal} />
              </group>
            );
          })}
        </group>
      );
    }
    case 'chair':
      return <Chair x={0} z={0} rot={0} pal={{ ...pal, fabric: main }} />;
    case 'desk':
      return (
        <group>
          <B p={[0, h - 0.03, 0]} s={[w, 0.03, d]} c={main} r={0.45} />
          <B p={[w / 2 - 0.22, 0, 0]} s={[0.4, h - 0.03, d - 0.05]} c={main} r={0.5} />
          <Legs w={w} d={d} h={h - 0.03} c={pal.metal} rad={0.015} />
          <B p={[-0.2, h, -d / 2 + 0.15]} s={[0.55, 0.35, 0.02]} c="#15171a" r={0.2} />
        </group>
      );
    case 'officeChair':
      return (
        <group>
          <Cyl p={[0, 0, 0]} rad={0.28} h={0.04} c={pal.metal} seg={5} />
          <Cyl p={[0, 0.04, 0]} rad={0.025} h={0.4} c={pal.metal} m={0.6} />
          <B p={[0, 0.44, 0]} s={[0.5, 0.07, 0.48]} c="#2c2d30" r={0.9} />
          <B p={[0, 0.5, -0.22]} s={[0.46, 0.55, 0.05]} c="#2c2d30" r={0.9} />
        </group>
      );
    case 'bookshelf':
      return (
        <group>
          <B p={[-w / 2 + 0.015, 0, 0]} s={[0.03, h, d]} c={main} />
          <B p={[w / 2 - 0.015, 0, 0]} s={[0.03, h, d]} c={main} />
          {[0, 1, 2, 3, 4].map((i) => (
            <group key={i}>
              <B p={[0, i * (h - 0.03) / 4, 0]} s={[w, 0.03, d]} c={main} />
              {i < 4 &&
                Array.from({ length: 6 }).map((_, k) => (
                  <B key={k} p={[-w / 2 + 0.1 + k * 0.13 + (i % 2) * 0.1, i * (h - 0.03) / 4 + 0.03, 0]} s={[0.05, 0.22 + ((k * 7 + i) % 4) * 0.03, d * 0.7]} c={[pal.accent, '#e8e2d6', '#3b3f45', pal.fabric][(k + i) % 4]} r={0.8} />
                ))}
            </group>
          ))}
        </group>
      );
    case 'kitchen': {
      const counter = 0.9;
      return (
        <group>
          <B p={[0, 0.1, 0.02]} s={[w, counter - 0.14, d - 0.04]} c={main} r={0.4} />
          <B p={[0, 0, 0.05]} s={[w, 0.1, d - 0.12]} c="#2a2a2a" r={0.8} />
          <B p={[0, counter - 0.04, 0]} s={[w, 0.04, d]} c="#e9e6e1" r={0.25} />
          {Array.from({ length: Math.round(w / 0.6) }).map((_, i, arr) => (
            <B key={i} p={[-w / 2 + (w / arr.length) * (i + 0.5), 0.12, d / 2 - 0.01]} s={[w / arr.length - 0.01, counter - 0.18, 0.01]} c={main} r={0.35} />
          ))}
          <B p={[-w / 4, counter, 0.02]} s={[0.5, 0.01, 0.4]} c="#b8bcc0" m={0.8} r={0.3} />
          <B p={[w / 4, counter, 0.02]} s={[0.6, 0.01, 0.5]} c="#101010" r={0.2} />
          <B p={[0, 1.45, -d / 2 + 0.18]} s={[w, 0.72, 0.35]} c={main} r={0.4} />
          <B p={[0, counter, -d / 2 + 0.005]} s={[w, 0.55, 0.01]} c={pal.accent} r={0.3} />
        </group>
      );
    }
    case 'island':
      return (
        <group>
          <B p={[0, 0.08, 0]} s={[w - 0.1, h - 0.12, d - 0.1]} c={main} r={0.45} />
          <B p={[0, h - 0.04, 0]} s={[w, 0.04, d]} c="#ebe8e3" r={0.2} />
          {[-0.5, 0, 0.5].map((x) => (
            <group key={x} position={[x, 0, d / 2 + 0.2]}>
              <Cyl p={[0, 0, 0]} rad={0.02} h={0.65} c={pal.metal} />
              <Cyl p={[0, 0.65, 0]} rad={0.18} h={0.05} c={pal.fabric} />
            </group>
          ))}
        </group>
      );
    case 'fridge':
      return (
        <group>
          <B p={[0, 0, 0]} s={[w, h, d]} c={pal.white} r={0.3} />
          <B p={[0, 0.02, d / 2]} s={[w - 0.02, h * 0.6, 0.01]} c={pal.white} r={0.25} />
          <B p={[w / 2 - 0.05, h * 0.3, d / 2 + 0.02]} s={[0.02, 0.4, 0.02]} c={pal.metal} m={0.7} />
        </group>
      );
    case 'bathtub':
      return (
        <group>
          <B p={[0, 0, 0]} s={[w, h, d]} c="#fafafa" r={0.15} />
          <mesh position={[0, h - 0.005, 0]}>
            <boxGeometry args={[w - 0.14, 0.01, d - 0.14]} />
            <meshStandardMaterial color="#cfe3ea" roughness={0.05} metalness={0.1} />
          </mesh>
          <Cyl p={[-w / 2 + 0.1, h, 0]} rad={0.02} h={0.2} c="#c9ccd0" m={0.9} r={0.2} />
        </group>
      );
    case 'shower':
      return (
        <group>
          <B p={[0, 0, 0]} s={[w, 0.05, d]} c="#f2f2f2" r={0.3} />
          <B p={[0, 0.05, d / 2 - 0.01]} s={[w, h - 0.05, 0.01]} c="#cfe7f0" r={0.05} o={0.25} />
          <B p={[w / 2 - 0.01, 0.05, 0]} s={[0.01, h - 0.05, d]} c="#cfe7f0" r={0.05} o={0.25} />
          <Cyl p={[0, h - 0.05, -d / 2 + 0.25]} rad={0.12} h={0.01} c="#c9ccd0" m={0.9} r={0.2} />
        </group>
      );
    case 'toilet':
      return (
        <group>
          <B p={[0, 0.25, -d / 2 + 0.03]} s={[0.5, 0.5, 0.06]} c="#f1f1f1" r={0.3} />
          <mesh position={[0, 0.35, 0.02]} castShadow scale={[1, 1, 1.35]}>
            <cylinderGeometry args={[0.18, 0.15, 0.2, 24]} />
            <meshStandardMaterial color="#fbfbfb" roughness={0.15} />
          </mesh>
          <B p={[0.06, 0.85, -d / 2 + 0.06]} s={[0.2, 0.01, 0.12]} c="#c9ccd0" m={0.8} />
        </group>
      );
    case 'vanity':
      return (
        <group>
          <B p={[0, 0.3, 0]} s={[w, 0.5, d]} c={main} r={0.5} />
          <B p={[0, 0.8, 0]} s={[w, 0.05, d]} c="#f7f7f7" r={0.15} />
          <Cyl p={[0, 0.85, 0.05]} rad={0.17} h={0.1} c="#ffffff" r={0.1} />
          <B p={[0, 1.05, -d / 2 + 0.01]} s={[w * 0.8, 0.8, 0.02]} c="#dfe9ee" m={0.9} r={0.02} />
        </group>
      );
    case 'washer':
      return (
        <group>
          <B p={[0, 0, 0]} s={[w, h, d]} c={pal.white} r={0.3} />
          <mesh position={[0, h * 0.45, d / 2 + 0.005]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.02, 32]} />
            <meshStandardMaterial color="#6b7a86" roughness={0.1} metalness={0.3} />
          </mesh>
        </group>
      );
    case 'rug':
      return (
        <group>
          <B p={[0, 0, 0]} s={[w, 0.012, d]} c={main} r={1} />
          <B p={[0, 0.001, 0]} s={[w - 0.2, 0.012, d - 0.2]} c={pal.accent} r={1} o={0.6} />
        </group>
      );
    case 'plant':
      return (
        <group>
          <Cyl p={[0, 0, 0]} rad={0.18} rt={0.22} h={0.4} c={main} r={0.8} />
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[Math.cos(i * 1.3) * 0.12, 0.7 + i * 0.12, Math.sin(i * 1.3) * 0.12]} castShadow>
              <sphereGeometry args={[0.2 - i * 0.02, 10, 8]} />
              <meshStandardMaterial color={['#4f7a4a', '#5f8d57', '#3f6a3d'][i % 3]} roughness={0.9} />
            </mesh>
          ))}
          <Cyl p={[0, 0.4, 0]} rad={0.015} h={0.5} c="#4d3b2a" />
        </group>
      );
    case 'shoeCabinet':
      return (
        <group>
          <B p={[0, 0.05, 0]} s={[w, h - 0.1, d]} c={main} r={0.5} />
          <B p={[0, h - 0.05, 0]} s={[w, 0.05, d]} c={pal.fabric} r={0.95} />
          <B p={[0, 1.4, -d / 2 + 0.01]} s={[0.6, 0.9, 0.02]} c="#dfe9ee" m={0.9} r={0.02} />
        </group>
      );
    case 'bench':
      return (
        <group>
          <B p={[0, h - 0.08, 0]} s={[w, 0.08, d]} c={main} r={0.95} />
          <Legs w={w} d={d} h={h - 0.08} c={pal.wood} rad={0.02} />
        </group>
      );
  }
  return <B p={[0, 0, 0]} s={[w, h, d]} c={main} />;
}

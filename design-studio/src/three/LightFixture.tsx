import type { LightDef } from '../data/lights';

const WARM = '#ffe0b0';

function Glow({ night, strength = 1 }: { night: boolean; strength?: number }) {
  return <meshStandardMaterial color="#fffaf0" emissive={WARM} emissiveIntensity={(night ? 2 : 0.3) * strength} roughness={0.4} toneMapped={false} />;
}

export function LightFixture({ def, H, night, metal, showCeilingParts }: { def: LightDef; H: number; night: boolean; metal: string; showCeilingParts: boolean }) {
  const ceilingY = H - 0.005;
  switch (def.model) {
    case 'spot':
      if (!showCeilingParts) return null;
      return (
        <group position={[0, ceilingY - def.drop, 0]}>
          {def.drop > 0 && (
            <mesh position={[0, def.drop / 2, 0]}>
              <cylinderGeometry args={[def.size / 2, def.size / 2, def.drop, 20]} />
              <meshStandardMaterial color={metal} roughness={0.5} />
            </mesh>
          )}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[def.size / 2 - 0.01, 20]} />
            <Glow night={night} />
          </mesh>
        </group>
      );
    case 'panel':
      if (!showCeilingParts) return null;
      return (
        <mesh position={[0, ceilingY - 0.01, 0]}>
          <boxGeometry args={[def.size, 0.02, def.size]} />
          <Glow night={night} strength={0.6} />
        </mesh>
      );
    case 'pendant': {
      if (!showCeilingParts) return null;
      const y = H - def.drop;
      const linear = def.size > 0.8;
      return (
        <group>
          {(linear ? [-def.size / 2 + 0.1, def.size / 2 - 0.1] : [0]).map((x) => (
            <mesh key={x} position={[x, y + def.drop / 2, 0]}>
              <cylinderGeometry args={[0.003, 0.003, def.drop, 4]} />
              <meshStandardMaterial color="#222" />
            </mesh>
          ))}
          {linear ? (
            <group position={[0, y, 0]}>
              <mesh castShadow>
                <boxGeometry args={[def.size, 0.05, 0.06]} />
                <meshStandardMaterial color={metal} roughness={0.4} metalness={0.4} />
              </mesh>
              <mesh position={[0, -0.026, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[def.size - 0.02, 0.04]} />
                <Glow night={night} />
              </mesh>
            </group>
          ) : (
            <group position={[0, y, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[def.size / 2, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color={metal} roughness={0.35} metalness={0.3} side={2} />
              </mesh>
              <mesh position={[0, 0.02, 0]}>
                <sphereGeometry args={[0.05, 12, 8]} />
                <Glow night={night} />
              </mesh>
            </group>
          )}
        </group>
      );
    }
    case 'chandelier': {
      if (!showCeilingParts) return null;
      const y = H - def.drop;
      return (
        <group position={[0, y, 0]}>
          <mesh position={[0, def.drop / 2, 0]}>
            <cylinderGeometry args={[0.008, 0.008, def.drop, 6]} />
            <meshStandardMaterial color={metal} metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[def.size / 2 - 0.05, 0.012, 8, 40]} />
            <meshStandardMaterial color={metal} metalness={0.8} roughness={0.25} />
          </mesh>
          {Array.from({ length: 6 }).map((_, i) => {
            const a = (i / 6) * Math.PI * 2;
            const r = def.size / 2 - 0.05;
            return (
              <group key={i} position={[Math.cos(a) * r, 0.06, Math.sin(a) * r]}>
                <mesh>
                  <cylinderGeometry args={[0.035, 0.05, 0.1, 16, 1, true]} />
                  <meshStandardMaterial color="#f7f1e6" roughness={0.6} side={2} emissive={WARM} emissiveIntensity={night ? 1.2 : 0.1} />
                </mesh>
                <mesh position={[0, -0.02, 0]}>
                  <sphereGeometry args={[0.02, 8, 6]} />
                  <Glow night={night} />
                </mesh>
              </group>
            );
          })}
        </group>
      );
    }
    case 'track': {
      if (!showCeilingParts) return null;
      return (
        <group position={[0, H - def.drop, 0]}>
          <mesh>
            <boxGeometry args={[def.size, 0.035, 0.035]} />
            <meshStandardMaterial color={metal} roughness={0.4} />
          </mesh>
          {[-0.75, -0.25, 0.25, 0.75].map((x, i) => (
            <group key={x} position={[x * def.size * 0.5, -0.08, 0]} rotation={[i % 2 ? 0.5 : -0.5, 0, 0]}>
              <mesh>
                <cylinderGeometry args={[0.035, 0.035, 0.13, 16]} />
                <meshStandardMaterial color={metal} roughness={0.35} />
              </mesh>
              <mesh position={[0, -0.066, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.03, 16]} />
                <Glow night={night} />
              </mesh>
            </group>
          ))}
        </group>
      );
    }
    case 'sconce':
      return (
        <group position={[0, def.drop, 0]}>
          <mesh position={[0, 0, 0.02]}>
            <boxGeometry args={[0.08, 0.14, 0.02]} />
            <meshStandardMaterial color={metal} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.02, 0.1]}>
            <cylinderGeometry args={[0.05, 0.07, 0.12, 20, 1, true]} />
            <meshStandardMaterial color="#f4ede1" side={2} emissive={WARM} emissiveIntensity={night ? 1.5 : 0.1} />
          </mesh>
        </group>
      );
    case 'floorLamp':
      return (
        <group>
          <mesh position={[0, 0.01, 0]} castShadow>
            <cylinderGeometry args={[0.14, 0.14, 0.02, 24]} />
            <meshStandardMaterial color={metal} />
          </mesh>
          <mesh position={[0, def.drop / 2, 0]} castShadow>
            <cylinderGeometry args={[0.012, 0.012, def.drop, 8]} />
            <meshStandardMaterial color={metal} metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh position={[0, def.drop, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.2, 0.28, 24, 1, true]} />
            <meshStandardMaterial color="#efe6d6" side={2} emissive={WARM} emissiveIntensity={night ? 1.4 : 0.1} roughness={0.9} />
          </mesh>
        </group>
      );
    case 'strip':
      return (
        <mesh position={[0, 1.43, 0]}>
          <boxGeometry args={[def.size, 0.012, 0.02]} />
          <Glow night={night} strength={0.8} />
        </mesh>
      );
  }
  return null;
}

import type { FurnitureDef } from '../data/furniture';
import type { LightDef } from '../data/lights';

const S = { stroke: '#3b3f46', strokeWidth: 0.015, fill: '#ffffff' };
const thin = { stroke: '#3b3f46', strokeWidth: 0.01, fill: 'none' };

/** Условное обозначение мебели на плане. Локальные координаты: центр в 0, «перед» — +Y. */
export function FurnitureSymbol({ def, fill }: { def: FurnitureDef; fill?: string }) {
  const { w, d } = def;
  const x0 = -w / 2;
  const y0 = -d / 2;
  const base = <rect x={x0} y={y0} width={w} height={d} {...S} fill={fill ?? S.fill} rx={0.02} />;
  switch (def.model) {
    case 'sofa':
    case 'armchair':
      return (
        <g>
          {base}
          <rect x={x0} y={y0} width={w} height={0.18} {...thin} />
          <rect x={x0} y={y0} width={0.16} height={d} {...thin} />
          <rect x={w / 2 - 0.16} y={y0} width={0.16} height={d} {...thin} />
          {def.model === 'sofa' && [1, 2].map((i) => <line key={i} x1={x0 + 0.16 + ((w - 0.32) / 3) * i} y1={y0 + 0.18} x2={x0 + 0.16 + ((w - 0.32) / 3) * i} y2={d / 2} {...thin} />)}
        </g>
      );
    case 'cornerSofa':
      return (
        <g>
          <path d={`M${x0} ${y0} H${w / 2} V${d / 2} H${w / 2 - 0.95} V${y0 + 0.95} H${x0} Z`} {...S} fill={fill ?? S.fill} />
          <path d={`M${x0} ${y0 + 0.2} H${w / 2 - 0.2} V${d / 2}`} {...thin} />
        </g>
      );
    case 'bed':
      return (
        <g>
          {base}
          <rect x={x0} y={y0} width={w} height={0.1} {...thin} fill="#3b3f46" />
          {(w > 1.2 ? [-w / 4, w / 4] : [0]).map((x) => (
            <rect key={x} x={x - Math.min(0.35, w / 4 - 0.05)} y={y0 + 0.15} width={Math.min(0.7, w / 2 - 0.1)} height={0.35} rx={0.05} {...thin} />
          ))}
          <path d={`M${x0} ${y0 + 0.65} H${w / 2}`} {...thin} />
          <path d={`M${x0} ${y0 + 0.65} L${x0 + 0.4} ${y0 + 0.95} H${w / 2}`} {...thin} />
        </g>
      );
    case 'diningTable': {
      const seats = w > 1.7 ? 3 : 2;
      return (
        <g>
          {Array.from({ length: seats }).flatMap((_, i) => {
            const x = x0 + (w / seats) * (i + 0.5);
            return [
              <rect key={'a' + i} x={x - 0.21} y={y0 - 0.4} width={0.42} height={0.42} rx={0.04} {...S} />,
              <rect key={'b' + i} x={x - 0.21} y={d / 2 - 0.02} width={0.42} height={0.42} rx={0.04} {...S} />,
            ];
          })}
          {base}
        </g>
      );
    }
    case 'coffeeTable':
    case 'desk':
    case 'nightstand':
    case 'dresser':
    case 'tvUnit':
    case 'shoeCabinet':
    case 'bench':
    case 'island':
      return (
        <g>
          {base}
          <rect x={x0 + 0.03} y={y0 + 0.03} width={w - 0.06} height={d - 0.06} {...thin} />
        </g>
      );
    case 'wardrobe':
    case 'bookshelf':
      return (
        <g>
          {base}
          <line x1={x0} y1={0} x2={w / 2} y2={0} {...thin} />
          <line x1={x0} y1={y0} x2={w / 2} y2={d / 2} {...thin} />
        </g>
      );
    case 'kitchen':
      return (
        <g>
          {base}
          <line x1={x0} y1={y0 + 0.35} x2={w / 2} y2={y0 + 0.35} {...thin} strokeDasharray="0.06 0.04" />
          <rect x={-w / 4 - 0.25} y={y0 + 0.1} width={0.5} height={0.4} rx={0.05} {...thin} />
          {[0, 1].flatMap((i) => [0, 1].map((j) => <circle key={`${i}${j}`} cx={w / 4 - 0.14 + i * 0.28} cy={y0 + 0.18 + j * 0.26} r={0.09} {...thin} />))}
        </g>
      );
    case 'fridge':
    case 'washer':
      return (
        <g>
          {base}
          {def.model === 'washer' ? <circle cx={0} cy={0} r={Math.min(w, d) * 0.32} {...thin} /> : <text x={0} y={0.05} fontSize={0.14} textAnchor="middle" fill="#3b3f46">ХЛ</text>}
        </g>
      );
    case 'bathtub':
      return (
        <g>
          <rect x={x0} y={y0} width={w} height={d} rx={0.08} {...S} fill={fill ?? S.fill} />
          <rect x={x0 + 0.08} y={y0 + 0.08} width={w - 0.16} height={d - 0.16} rx={0.25} {...thin} />
          <circle cx={x0 + 0.25} cy={0} r={0.03} {...thin} />
        </g>
      );
    case 'shower':
      return (
        <g>
          {base}
          <line x1={x0} y1={y0} x2={w / 2} y2={d / 2} {...thin} />
          <line x1={w / 2} y1={y0} x2={x0} y2={d / 2} {...thin} />
        </g>
      );
    case 'toilet':
      return (
        <g>
          <rect x={-0.22} y={y0} width={0.44} height={0.14} {...S} fill={fill ?? S.fill} />
          <ellipse cx={0} cy={y0 + 0.14 + 0.2} rx={0.18} ry={0.22} {...S} fill={fill ?? S.fill} />
        </g>
      );
    case 'vanity':
      return (
        <g>
          {base}
          <ellipse cx={0} cy={0.02} rx={w * 0.25} ry={d * 0.3} {...thin} />
        </g>
      );
    case 'rug':
      return <rect x={x0} y={y0} width={w} height={d} fill="none" stroke="#9aa0a8" strokeWidth={0.012} strokeDasharray="0.08 0.05" />;
    case 'plant':
      return (
        <g>
          <circle cx={0} cy={0} r={w / 2} {...S} fill={fill ?? '#eef5ec'} />
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={Math.cos(i * 1.26) * w * 0.22} cy={Math.sin(i * 1.26) * w * 0.22} r={w * 0.16} {...thin} />
          ))}
        </g>
      );
    case 'officeChair':
    case 'chair':
      return (
        <g>
          <rect x={x0 + 0.04} y={y0 + 0.04} width={w - 0.08} height={d - 0.08} rx={0.08} {...S} fill={fill ?? S.fill} />
          <rect x={x0 + 0.04} y={y0 + 0.04} width={w - 0.08} height={0.08} {...thin} />
        </g>
      );
  }
  return base;
}

export function LightSymbol({ def, color = '#d98a00' }: { def: LightDef; color?: string }) {
  const st = { stroke: color, strokeWidth: 0.018, fill: '#fff' };
  const r = 0.09;
  switch (def.model) {
    case 'spot':
      return (
        <g>
          <circle r={r} {...st} />
          <path d={`M${-r * 0.7} ${-r * 0.7} L${r * 0.7} ${r * 0.7} M${r * 0.7} ${-r * 0.7} L${-r * 0.7} ${r * 0.7}`} stroke={color} strokeWidth={0.014} />
        </g>
      );
    case 'panel':
      return (
        <g>
          <rect x={-def.size / 2} y={-def.size / 2} width={def.size} height={def.size} {...st} />
          <path d={`M${-def.size / 2} ${-def.size / 2} L${def.size / 2} ${def.size / 2} M${def.size / 2} ${-def.size / 2} L${-def.size / 2} ${def.size / 2}`} stroke={color} strokeWidth={0.012} />
        </g>
      );
    case 'pendant':
      if (def.size > 0.8)
        return (
          <g>
            <rect x={-def.size / 2} y={-0.05} width={def.size} height={0.1} {...st} />
            <line x1={-def.size / 2} y1={0} x2={def.size / 2} y2={0} stroke={color} strokeWidth={0.012} />
          </g>
        );
      return (
        <g>
          <circle r={def.size / 2} {...st} />
          <circle r={0.04} fill={color} />
        </g>
      );
    case 'chandelier':
      return (
        <g>
          <circle r={def.size / 2} {...st} />
          {Array.from({ length: 6 }).map((_, i) => (
            <circle key={i} cx={Math.cos((i / 6) * Math.PI * 2) * def.size * 0.35} cy={Math.sin((i / 6) * Math.PI * 2) * def.size * 0.35} r={0.04} fill={color} />
          ))}
        </g>
      );
    case 'track':
      return (
        <g>
          <line x1={-def.size / 2} y1={0} x2={def.size / 2} y2={0} stroke={color} strokeWidth={0.04} />
          {[-0.75, -0.25, 0.25, 0.75].map((x) => (
            <circle key={x} cx={(x * def.size) / 2} cy={0} r={0.06} {...st} />
          ))}
        </g>
      );
    case 'sconce':
      return (
        <g>
          <path d={`M${-r} 0 A${r} ${r} 0 0 0 ${r} 0 Z`} {...st} transform="scale(1,-1)" />
          <line x1={-r * 1.3} y1={0} x2={r * 1.3} y2={0} stroke={color} strokeWidth={0.02} />
        </g>
      );
    case 'floorLamp':
      return (
        <g>
          <circle r={def.size / 2} {...st} />
          <circle r={def.size / 4} {...st} />
        </g>
      );
    case 'strip':
      return <line x1={-def.size / 2} y1={0} x2={def.size / 2} y2={0} stroke={color} strokeWidth={0.03} strokeDasharray="0.1 0.05" />;
  }
  return <circle r={r} {...st} />;
}

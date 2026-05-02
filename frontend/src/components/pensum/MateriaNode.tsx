import { Handle, Position } from '@xyflow/react';

type EstadoMateria = 'aprobada' | 'reprobada' | 'en_curso' | 'pendiente';

export interface MateriaNodeData {
  id: string;
  nombre: string;
  codigo: string | null;
  creditos: number | null;
  estado: EstadoMateria;
  notaDefinitiva: number | null;
  semestre: number;
  isHighlighted?: boolean;
  isDimmed?: boolean;
}

const ESTADO_CONFIG: Record<EstadoMateria, { color: string; bg: string; label: string; glow: string }> = {
  aprobada: {
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.1)',
    glow: 'rgba(34, 197, 94, 0.4)',
    label: 'Aprobada'
  },
  en_curso: {
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
    glow: 'rgba(245, 158, 11, 0.4)',
    label: 'En curso'
  },
  reprobada: {
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    glow: 'rgba(239, 68, 68, 0.4)',
    label: 'Reprobada'
  },
  pendiente: {
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.05)',
    glow: 'transparent',
    label: 'Pendiente'
  },
};

export const MateriaNode = ({ data }: { data: MateriaNodeData }) => {
  const cfg = ESTADO_CONFIG[data.estado] || ESTADO_CONFIG.pendiente;
  
  const opacity = data.isDimmed ? 0.3 : 1;
  const scale = data.isHighlighted ? 1.05 : 1;
  const boxShadow = data.isHighlighted 
    ? `0 0 20px ${cfg.glow}, 0 0 5px ${cfg.color}` 
    : `0 4px 12px rgba(0,0,0,0.5)`;

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '12px',
        background: '#1a1f26',
        border: `2px solid ${data.isHighlighted ? cfg.color : (data.estado === 'pendiente' ? '#2d3a4d' : cfg.color)}`,
        color: '#f1f5f9',
        width: '180px',
        textAlign: 'center',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: boxShadow,
        opacity: opacity,
        transform: `scale(${scale})`,
        cursor: 'pointer',
      }}
    >
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ background: cfg.color, border: 'none', width: '8px', height: '8px' }} 
      />
      
      <div
        style={{
          position: 'absolute',
          top: '-10px',
          right: '-10px',
          background: cfg.color,
          color: '#fff',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 'bold',
          border: '3px solid #0c0f14',
          boxShadow: `0 0 10px ${cfg.glow}`,
          zIndex: 10,
        }}
      >
        {data.semestre}
      </div>

      <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px', lineHeight: '1.2' }}>
        {data.nombre}
      </div>
      
      <div style={{ fontSize: '10px', color: '#94a3b8', opacity: 0.8 }}>
        {data.codigo ? `${data.codigo} • ` : ''}{data.creditos} CR
      </div>

      {data.notaDefinitiva !== null && (
        <div style={{ fontSize: '11px', fontWeight: '700', color: cfg.color, marginTop: '4px' }}>
          {data.notaDefinitiva.toFixed(2)}
        </div>
      )}

      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ background: cfg.color, border: 'none', width: '8px', height: '8px' }} 
      />
    </div>
  );
};

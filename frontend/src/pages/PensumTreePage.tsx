import { useCallback, useEffect, useMemo, useState } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  Panel, 
  useNodesState, 
  useEdgesState,
  MarkerType
} from '@xyflow/react';
import type { Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useAuth } from '../auth/AuthContext';
import { getApiUrl } from '../lib/config';
import { MateriaNode } from '../components/pensum/MateriaNode';

import './pages.css';

/* ─── Tipos ─────────────────────────────────────────────────── */
type EstadoMateria = 'aprobada' | 'reprobada' | 'en_curso' | 'pendiente';

type MateriaNodeRaw = {
  id: string;
  nombre: string;
  codigo: string | null;
  creditos: number | null;
  estado: EstadoMateria;
  notaDefinitiva: number | null;
  prerrequisitos: { id: string; nombre: string }[];
};

type Semestre = {
  numero: number;
  materias: MateriaNodeRaw[];
};

type PensumData = {
  pensum: { id: string; nombre: string };
  semestres: Semestre[];
};

const nodeTypes = {
  materia: MateriaNode,
};

const ESTADO_COLORS: Record<EstadoMateria, string> = {
  aprobada: '#22c55e',
  en_curso: '#f59e0b',
  reprobada: '#ef4444',
  pendiente: '#64748b',
};

/* ─── Página principal ───────────────────────────────────────── */
export function PensumTreePage() {
  const { token, logout } = useAuth();
  const api = getApiUrl();

  const [data, setData]       = useState<PensumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`${api}/perfiles/mi-pensum`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) { logout(); return; }
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { message?: string };
      setError(body.message ?? 'No se pudo cargar el pensum');
      setLoading(false);
      return;
    }
    const json = await res.json() as PensumData;
    setData(json);
    
    // Transformar a Nodes y Edges
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    json.semestres.forEach((sem) => {
      sem.materias.forEach((m, idx) => {
        newNodes.push({
          id: m.id,
          type: 'materia',
          position: { x: (sem.numero - 1) * 280, y: idx * 140 },
          data: {
            ...m,
            semestre: sem.numero,
            isHighlighted: false,
            isDimmed: false,
          } as any as Record<string, unknown>,
        });

        m.prerrequisitos.forEach((pre) => {
          newEdges.push({
            id: `e-${pre.id}-${m.id}`,
            source: pre.id,
            target: m.id,
            style: { strokeWidth: 2, stroke: '#2d3a4d', transition: 'stroke 0.3s' },
            animated: false,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#2d3a4d',
            },
          });
        });
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
    setLoading(false);
  }, [api, token, logout, setNodes, setEdges]);

  useEffect(() => { void load(); }, [load]);

  // Lógica de resaltado
  const handleMouseEnter = useCallback((_event: React.MouseEvent, node: Node) => {
    setHoveredNode(node.id);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);

  const { highlightedNodes, highlightedEdges } = useMemo(() => {
    if (!hoveredNode) return { highlightedNodes: new Set<string>(), highlightedEdges: new Set<string>() };

    const nodesToHighlight = new Set<string>([hoveredNode]);
    const edgesToHighlight = new Set<string>();

    // Recursivamente encontrar dependencias (hacia adelante y hacia atrás)
    const findConnections = (id: string, direction: 'source' | 'target') => {
      edges.forEach((edge) => {
        const sourceOrTarget = direction === 'source' ? edge.source : edge.target;
        if (sourceOrTarget === id) {
          const nextId = direction === 'source' ? edge.target : edge.source;
          if (!nodesToHighlight.has(nextId)) {
            nodesToHighlight.add(nextId);
            edgesToHighlight.add(edge.id);
            findConnections(nextId, direction);
          }
        }
      });
    };

    findConnections(hoveredNode, 'source'); // Dependientes
    findConnections(hoveredNode, 'target'); // Prerrequisitos

    return { highlightedNodes: nodesToHighlight, highlightedEdges: edgesToHighlight };
  }, [hoveredNode, edges]);

  // Aplicar resaltado a los nodos y edges
  const processedNodes = useMemo(() => {
    return nodes.map((n) => ({
      ...n,
      data: {
        ...n.data as any,
        isHighlighted: highlightedNodes.has(n.id),
        isDimmed: hoveredNode !== null && !highlightedNodes.has(n.id),
      },
    }));
  }, [nodes, highlightedNodes, hoveredNode]);

  const processedEdges = useMemo(() => {
    return edges.map((e) => {
      const isHighlighted = highlightedEdges.has(e.id);
      const sourceNode = nodes.find(n => n.id === e.source);
      const estado = (sourceNode?.data as any)?.estado as EstadoMateria;
      const color = isHighlighted ? (ESTADO_COLORS[estado] || '#14b8a6') : '#2d3a4d';
      
      return {
        ...e,
        animated: isHighlighted,
        style: { 
          ...e.style, 
          stroke: color,
          strokeWidth: isHighlighted ? 3 : 2,
          opacity: hoveredNode && !isHighlighted ? 0.1 : 1
        },
        markerEnd: typeof e.markerEnd === 'object' ? {
          ...e.markerEnd,
          color: color,
        } : e.markerEnd
      };
    });
  }, [edges, highlightedEdges, nodes, hoveredNode]);

  /* Stats rápidas */
  const stats = data ? (() => {
    let ap = 0, rc = 0, ec = 0, pe = 0;
    data.semestres.forEach(s => s.materias.forEach(m => {
      if (m.estado === 'aprobada')  ap++;
      else if (m.estado === 'reprobada') rc++;
      else if (m.estado === 'en_curso') ec++;
      else pe++;
    }));
    const total = ap + rc + ec + pe;
    return { ap, rc, ec, pe, total, pct: total > 0 ? Math.round((ap / total) * 100) : 0 };
  })() : null;

  return (
    <DashboardLayout>
      <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem 0 0 0' }}>
          <h1 style={{ marginBottom: '0.25rem' }}>Mi Pensum</h1>
          {data && (
            <p className="gradum-lead" style={{ marginBottom: '1rem' }}>
              {data.pensum.nombre}
            </p>
          )}

          {/* Stats resumidas */}
          {stats && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div className="gradum-badge" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid #22c55e' }}>
                {stats.ap} Aprobadas
              </div>
              <div className="gradum-badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid #f59e0b' }}>
                {stats.ec} En curso
              </div>
              <div className="gradum-badge" style={{ background: 'rgba(20,184,166,0.1)', color: '#14b8a6', border: '1px solid #14b8a6' }}>
                {stats.pct}% Completado
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="gradum-error gradum-error--block" role="alert">{error}</p>
        )}

        <div style={{ flex: 1, position: 'relative', border: '1px solid var(--gradum-border)', borderRadius: '12px', overflow: 'hidden', background: '#0c0f14' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--gradum-muted)' }}>
              Cargando pensum interactivo…
            </div>
          ) : (
            <ReactFlow
              nodes={processedNodes}
              edges={processedEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              onNodeMouseEnter={handleMouseEnter}
              onNodeMouseLeave={handleMouseLeave}
              fitView
              minZoom={0.2}
              maxZoom={1.5}
            >
              <Background color="#1e293b" gap={20} />
              <Controls showInteractive={false} />
              <Panel position="top-right" style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '10px', borderRadius: '8px', border: '1px solid #2d3a4d', color: '#94a3b8', fontSize: '12px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#f1f5f9' }}>Atajos</div>
                <div>• Scroll para Zoom</div>
                <div>• Arrastrar para Paneo</div>
                <div>• Hover para ver dependencias</div>
              </Panel>
            </ReactFlow>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

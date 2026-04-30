import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Materia {
  id: string;
  nombre: string;
  codigo?: string | null;
  semestreNumero: number;
}

interface SortableItemProps {
  id: string;
  nombre: string;
  codigo?: string | null;
  semestre?: number;
  /** Si se proporciona, muestra el link al plan de evaluación */
  inscripcionId?: string;
  /** Estado de la inscripción para mostrar badge de color */
  estado?: 'en_curso' | 'aprobada' | 'reprobada';
  /** Nota definitiva calculada por el backend */
  notaDefinitiva?: string | null;
}

const SortableItem: React.FC<SortableItemProps> = (props) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.id });

  // Mapa de estados a etiquetas y colores para el badge de la tarjeta
  const estadoConfig: Record<string, { label: string; color: string }> = {
    aprobada:  { label: 'Aprobada',  color: '#5eead4' },
    reprobada: { label: 'Reprobada', color: '#fca5a5' },
    en_curso:  { label: 'En curso',  color: '#fcd34d' },
  };
  const ec = props.estado ? estadoConfig[props.estado] : null;

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
    padding: '0.6rem 0.8rem',
    marginTop: '0.4rem',
    border: '1px solid var(--gradum-border)',
    fontSize: '0.85rem'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="gradum-dash-card gradum-dash-card--compact"
    >
      {/* Nombre de la materia */}
      <div style={{ fontWeight: 600 }}>{props.nombre}</div>

      {/* Semestre y código */}
      <div style={{ fontSize: '0.7rem', color: 'var(--gradum-muted)' }}>
        Semestre {props.semestre} {props.codigo && `(${props.codigo})`}
      </div>

      {/* Badge de estado + nota definitiva (solo en inscritas) */}
      {ec && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.45rem',
            borderRadius: '999px', border: `1px solid ${ec.color}44`,
            background: `${ec.color}18`, color: ec.color
          }}>
            {ec.label}
          </span>
          {props.notaDefinitiva != null && (
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gradum-primary)' }}>
              {parseFloat(props.notaDefinitiva).toFixed(2)}
            </span>
          )}
        </div>
      )}

    </div>
  );
};

const DroppableColumn: React.FC<{ id: string; title: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ id, title, children, style }) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} style={{ ...style, transition: 'opacity 0.2s', opacity: isOver ? 0.8 : 1 }}>
      <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>{title}</h4>
      {children}
    </div>
  );
};

interface SemesterDndProps {
  disponibles: Materia[];
  inscritas: any[];
  onEnroll: (materiaId: string) => Promise<void>;
  onUnenroll: (id: string) => Promise<void>;
}

export const SemesterEnrollmentDnd: React.FC<SemesterDndProps> = ({ disponibles, inscritas, onEnroll, onUnenroll }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeContainer = active.data.current?.sortable?.containerId;
    const overContainer = over.data.current?.sortable?.containerId || over.id;

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    if (activeContainer === 'disponibles' && overContainer === 'inscritas') {
      await onEnroll(active.id as string);
    } else if (activeContainer === 'inscritas' && overContainer === 'disponibles') {
      await onUnenroll(active.id as string);
    }
  };

  const activeMateria = useMemo(() => {
    return disponibles.find(m => m.id === activeId) || inscritas.find(i => i.id === activeId)?.materia;
  }, [activeId, disponibles, inscritas]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => setActiveId(e.active.id as string)} onDragEnd={handleDragEnd}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        
        <DroppableColumn id="disponibles" title="Disponibles" style={{ background: 'var(--gradum-surface-elevated)', padding: '1rem', borderRadius: '0.75rem', minHeight: '200px' }}>
          <SortableContext id="disponibles" items={disponibles.map(m => m.id)} strategy={verticalListSortingStrategy}>
            {disponibles.map(m => <SortableItem key={m.id} id={m.id} nombre={m.nombre} semestre={m.semestreNumero} />)}
          </SortableContext>
        </DroppableColumn>
        
        <DroppableColumn id="inscritas" title="Seleccionadas" style={{ border: '2px dashed var(--gradum-primary)', padding: '1rem', borderRadius: '0.75rem', minHeight: '200px' }}>
          <SortableContext id="inscritas" items={inscritas.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {inscritas.map(i => (
              <SortableItem
                key={i.id}
                id={i.id}
                nombre={i.materia.nombre}
                semestre={i.materia.semestreNumero}
                inscripcionId={i.id}
                // Pasa el estado y la nota definitiva para mostrar el badge y la calificación
                estado={i.estado}
                notaDefinitiva={i.notaDefinitiva}
              />
            ))}
          </SortableContext>
        </DroppableColumn>

      </div>
      <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
        {activeId && activeMateria ? (
          <div className="gradum-dash-card gradum-dash-card--compact" style={{ padding: '0.6rem 0.8rem', border: '2px solid var(--gradum-primary)', width: '200px' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{activeMateria.nombre}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

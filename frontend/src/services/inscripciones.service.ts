import { api } from './api';

export interface Materia {
  id: string;
  nombre: string;
  codigo: string | null;
  semestreNumero: number;
}

export interface Inscripcion {
  id: string;
  usuarioId: string;
  materiaId: string;
  semestreEtiqueta: string;
  /** Estado calculado por el backend al recalcular la nota definitiva */
  estado: 'en_curso' | 'aprobada' | 'reprobada';
  /** Nota definitiva calculada (string decimal) o null si aún no hay datos suficientes */
  notaDefinitiva: string | null;
  materia: Materia;
}

export const inscripcionesService = {
  /** Lista todas las inscripciones del usuario, filtradas opcionalmente por semestre */
  getInscripciones: (semestre?: string) =>
    api.get<Inscripcion[]>(`/inscripciones${semestre ? `?semestre=${semestre}` : ''}`),

  /** Retorna una inscripción por ID (usada en PlanEvaluacionPage para el encabezado) */
  getInscripcion: (id: string) =>
    api.get<Inscripcion>(`/inscripciones/${id}`),

  /** Lista las materias disponibles para inscribir en el semestre dado */
  getMateriasDisponibles: (semestre: string) =>
    api.get<any[]>(`/inscripciones/disponibles?semestre=${semestre}`),

  /** Inscribe al usuario en la materia para el semestre indicado */
  createInscripcion: (materiaId: string, semestreEtiqueta: string) =>
    api.post<Inscripcion>(`/inscripciones`, { materiaId, semestre_etiqueta: semestreEtiqueta }),

  /** Elimina la inscripción (solo si el estado lo permite) */
  removeInscripcion: (id: string) =>
    api.delete(`/inscripciones/${id}`),
};

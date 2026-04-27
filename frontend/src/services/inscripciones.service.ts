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
  estado: 'en_curso' | 'aprobada' | 'reprobada';
  materia: Materia;
}

export const inscripcionesService = {
  getInscripciones: (semestre?: string) => 
    api.get<Inscripcion[]>(`/inscripciones${semestre ? `?semestre=${semestre}` : ''}`),

  getMateriasDisponibles: (semestre: string) => 
    api.get<any[]>(`/inscripciones/disponibles?semestre=${semestre}`),

  createInscripcion: (materiaId: string, semestreEtiqueta: string) => 
    api.post<Inscripcion>(`/inscripciones`, { materiaId, semestre_etiqueta: semestreEtiqueta }),

  removeInscripcion: (id: string) => 
    api.delete(`/inscripciones/${id}`),
};

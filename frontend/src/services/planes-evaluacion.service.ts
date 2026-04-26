import { api } from './api';

// ——— Tipos ———

export interface Evaluacion {
  id: string;
  planEvaluacionId: string;
  fechaLimite: string | null;
  observacion: string | null;
  notaEsperada: string | null;
  notaReal: string | null;
  archivos: string[] | null;
  creadoEn: string;
}

export interface PlanEvaluacion {
  id: string;
  inscripcionSemestreId: string;
  nombre: string;
  porcentaje: string;
  orden: number;
  evaluaciones: Evaluacion[];
}

export interface CreatePlanDto {
  nombre: string;
  porcentaje: number;
  orden?: number;
}

export interface UpdatePlanDto {
  nombre?: string;
  porcentaje?: number;
  orden?: number;
}

export interface CreateEvaluacionDto {
  fechaLimite?: string;
  observacion?: string;
  notaEsperada?: number;
  notaReal?: number;
  archivos?: string[];
}

export interface UpdateEvaluacionDto {
  fechaLimite?: string;
  observacion?: string;
  notaEsperada?: number | null;
  notaReal?: number | null;
  archivos?: string[];
}

// ——— Planes ———

const planesBase = (inscripcionId: string) =>
  `/inscripciones/${inscripcionId}/planes-evaluacion`;

export const planesEvaluacionService = {
  getPlanes: (inscripcionId: string) =>
    api.get<PlanEvaluacion[]>(planesBase(inscripcionId)),

  createPlan: (inscripcionId: string, dto: CreatePlanDto) =>
    api.post<PlanEvaluacion>(planesBase(inscripcionId), dto),

  updatePlan: (inscripcionId: string, planId: string, dto: UpdatePlanDto) =>
    api.patch<PlanEvaluacion>(`${planesBase(inscripcionId)}/${planId}`, dto),

  deletePlan: (inscripcionId: string, planId: string) =>
    api.delete(`${planesBase(inscripcionId)}/${planId}`),

  // ——— Evaluaciones ———

  createEvaluacion: (inscripcionId: string, planId: string, dto: CreateEvaluacionDto) =>
    api.post<Evaluacion>(`${planesBase(inscripcionId)}/${planId}/evaluaciones`, dto),

  updateEvaluacion: (
    inscripcionId: string,
    planId: string,
    evaluacionId: string,
    dto: UpdateEvaluacionDto,
  ) =>
    api.patch<Evaluacion>(
      `${planesBase(inscripcionId)}/${planId}/evaluaciones/${evaluacionId}`,
      dto,
    ),

  deleteEvaluacion: (inscripcionId: string, planId: string, evaluacionId: string) =>
    api.delete(`${planesBase(inscripcionId)}/${planId}/evaluaciones/${evaluacionId}`),
};

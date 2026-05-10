import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePerfilDto } from './dto/create-perfil.dto';

@Injectable()
export class PerfilesService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Crea el perfil del estudiante luego de que fue aprobado por el admin.
   *
   * Pasos internos:
   * 1. Valida que el usuario no tenga ya un perfil.
   * 2. Valida que la carrera exista y esté activa.
   * 3. Resuelve el pensumId: usa el que envió el cliente o busca el vigente de la carrera.
   * 4. Crea el PerfilEstudiante.
   * 5. Si tipoIngreso === 'primer_semestre', inscribe automáticamente todas las
   *    materias del semestre 1 del pensum elegido.
   */
  async create(userId: string, dto: CreatePerfilDto) {
    // 1. Verificar que no exista perfil previo
    const perfilExistente = await this.prisma.perfilEstudiante.findUnique({
      where: { usuarioId: userId },
    });
    if (perfilExistente) {
      throw new ConflictException('El usuario ya tiene un perfil creado');
    }

    // 2. Verificar que la carrera exista y esté activa
    const carrera = await this.prisma.degree.findUnique({
      where: { id: dto.carreraId },
    });
    if (!carrera) {
      throw new NotFoundException(`Carrera con ID ${dto.carreraId} no encontrada`);
    }
    if (!carrera.activa) {
      throw new BadRequestException('La carrera seleccionada no está activa');
    }

    // 3. Resolver pensumId
    let pensumId = dto.pensumId;

    if (pensumId) {
      // El cliente envió un pensumId explícito: validar que pertenezca a la carrera
      const pensum = await this.prisma.pensum.findUnique({
        where: { id: pensumId },
      });
      if (!pensum) {
        throw new NotFoundException(`Pensum con ID ${pensumId} no encontrado`);
      }
      if (pensum.carreraId !== dto.carreraId) {
        throw new BadRequestException(
          'El pensum seleccionado no pertenece a la carrera indicada',
        );
      }
    } else {
      // Asignar automáticamente el pensum vigente de la carrera
      const pensumVigente = await this.prisma.pensum.findFirst({
        where: { carreraId: dto.carreraId, vigente: true },
      });
      if (!pensumVigente) {
        throw new BadRequestException(
          'La carrera seleccionada no tiene un pensum vigente. Contacta a un administrador.',
        );
      }
      pensumId = pensumVigente.id;
    }

    // pensumId está garantizado como string desde aquí
    const resolvedPensumId: string = pensumId as string;

    // 4 + 5. Crear perfil e inscripciones en una transacción atómica
    const result = await this.prisma.$transaction(async (tx) => {
      // 4. Crear el PerfilEstudiante
      const perfil = await tx.perfilEstudiante.create({
        data: {
          usuarioId: userId,
          carreraId: dto.carreraId,
          pensumId: resolvedPensumId,
          tipoIngreso: dto.tipoIngreso,
          semestreActual: dto.semestreActual,
        },
      });

      // 5. Autoinscripción para primer semestre
      let inscripcionesCreadas = 0;
      if (dto.tipoIngreso === 'primer_semestre') {
        const materiasSem1 = await tx.materia.findMany({
          where: { pensumId: resolvedPensumId, semestreNumero: 1 },
          orderBy: { orden: 'asc' },
        });

        if (materiasSem1.length > 0) {
          await tx.inscripcionSemestre.createMany({
            data: materiasSem1.map((m: any) => ({
              usuarioId: userId,
              materiaId: m.id,
              semestreEtiqueta: dto.semestreActual,
              estado: 'en_curso',
            })),
            skipDuplicates: true,
          });
          inscripcionesCreadas = materiasSem1.length;
        }
      } else if (dto.tipoIngreso === 'avanzado' && dto.materiaIds && dto.materiaIds.length > 0) {
        await tx.inscripcionSemestre.createMany({
          data: dto.materiaIds.map((id: string) => ({
            usuarioId: userId,
            materiaId: id,
            semestreEtiqueta: dto.semestreActual,
            estado: 'en_curso',
          })),
          skipDuplicates: true,
        });
        inscripcionesCreadas = dto.materiaIds.length;
      }

      return { perfil, inscripcionesCreadas };
    });

    // Consultar carrera y pensum por separado para el response (los includes en tx no infieren bien)
    const carreraInfo = await this.prisma.degree.findUnique({
      where: { id: dto.carreraId },
      select: { nombre: true },
    });
    const pensumInfo = await this.prisma.pensum.findUnique({
      where: { id: resolvedPensumId },
      select: { nombre: true, version: true, vigente: true },
    });

    return {
      id: result.perfil.id,
      carrera: carreraInfo?.nombre ?? dto.carreraId,
      pensum: {
        id: resolvedPensumId,
        nombre: pensumInfo?.nombre ?? '',
        version: pensumInfo?.version ?? null,
        vigente: pensumInfo?.vigente ?? false,
      },
      tipoIngreso: result.perfil.tipoIngreso,
      semestreActual: result.perfil.semestreActual,
      inscripcionesAutomaticas: result.inscripcionesCreadas,
    };
  }

  /**
   * Retorna el perfil del estudiante autenticado (si existe).
   * Útil para que el frontend sepa si debe redirigir al onboarding.
   */
  async getMiPerfil(userId: string) {
    const perfil = await this.prisma.perfilEstudiante.findUnique({
      where: { usuarioId: userId },
      include: {
        carrera: { select: { id: true, nombre: true, codigo: true } },
        pensum: { select: { id: true, nombre: true, version: true, vigente: true } },
      },
    });

    if (!perfil) {
      return null; // El controlador devolverá 404
    }

    return {
      id: perfil.id,
      carrera: perfil.carrera,
      pensum: perfil.pensum,
      tipoIngreso: perfil.tipoIngreso,
      semestreActual: perfil.semestreActual,
    };
  }

  /**
   * Obtiene el pensum completo del estudiante, con el estado de cada materia
   * basado en sus inscripciones actuales o históricas.
   */
  async getMiPensum(userId: string) {
    const perfil = await this.prisma.perfilEstudiante.findUnique({
      where: { usuarioId: userId },
      include: { pensum: true },
    });

    if (!perfil) {
      throw new NotFoundException('El usuario no tiene perfil asignado');
    }

    const materias = await this.prisma.materia.findMany({
      where: { pensumId: perfil.pensumId },
      include: {
        prerrequisitosDe: {
          include: { materiaPrerrequisito: true },
        },
      },
      orderBy: [{ semestreNumero: 'asc' }, { orden: 'asc' }, { nombre: 'asc' }],
    });

    const inscripciones = await this.prisma.inscripcionSemestre.findMany({
      where: { usuarioId: userId },
    });

    const semestresMap = new Map<number, any>();

    for (const materia of materias) {
      let inscripcion = inscripciones.find((i) => i.materiaId === materia.id);
      
      const materiaFormat = {
        id: materia.id,
        nombre: materia.nombre,
        codigo: materia.codigo,
        creditos: materia.creditos,
        estado: inscripcion ? inscripcion.estado : 'pendiente',
        notaDefinitiva: inscripcion?.notaDefinitiva ? Number(inscripcion.notaDefinitiva) : null,
        prerrequisitos: materia.prerrequisitosDe.map((p) => ({
          id: p.materiaPrerrequisito.id,
          nombre: p.materiaPrerrequisito.nombre,
        })),
      };

      const semNum = materia.semestreNumero;
      if (!semestresMap.has(semNum)) {
        semestresMap.set(semNum, {
          numero: semNum,
          materias: [],
        });
      }
      semestresMap.get(semNum).materias.push(materiaFormat);
    }

    return {
      pensum: {
        id: perfil.pensum.id,
        nombre: perfil.pensum.nombre,
      },
      semestres: Array.from(semestresMap.values()).sort((a, b) => a.numero - b.numero),
    };
  }

  /**
   * Obtiene todas las evaluaciones del estudiante que tienen fecha límite,
   * estructuradas para alimentar el calendario del frontend.
   */
  async getCalendario(userId: string) {
    const inscripciones = await this.prisma.inscripcionSemestre.findMany({
      where: { usuarioId: userId },
      include: {
        materia: true,
        planesEvaluacion: {
          include: {
            evaluaciones: {
              where: { fechaLimite: { not: null } },
            },
          },
        },
      },
    });

    const eventos: any[] = [];

    for (const insc of inscripciones) {
      for (const plan of insc.planesEvaluacion) {
        for (const ev of plan.evaluaciones) {
          eventos.push({
            id: ev.id,
            titulo: `${insc.materia.nombre} — ${plan.nombre}`,
            fechaLimite: ev.fechaLimite,
            observacion: ev.observacion,
            notaEsperada: ev.notaEsperada ? Number(ev.notaEsperada) : null,
            notaReal: ev.notaReal ? Number(ev.notaReal) : null,
            planId: plan.id,
            inscripcionId: insc.id,
            materiaNombre: insc.materia.nombre,
            planNombre: plan.nombre,
            porcentajePlan: Number(plan.porcentaje),
          });
        }
      }
    }

    return eventos;
  }
}

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
  constructor(private readonly prisma: PrismaService) {}

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
}

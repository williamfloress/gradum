import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInscripcioneDto } from './dto/create-inscripcione.dto';
import { UpdateInscripcioneDto } from './dto/update-inscripcione.dto';

@Injectable()
export class InscripcionesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateInscripcioneDto) {
    // 1. Validar que el usuario tenga un perfil
    const perfil = await this.prisma.perfilEstudiante.findUnique({
      where: { usuarioId: userId },
    });
    if (!perfil) {
      throw new BadRequestException('El usuario no tiene un perfil configurado');
    }

    // 2. Validar que la materia pertenezca al pensum del estudiante
    const materia = await this.prisma.materia.findUnique({
      where: { id: dto.materiaId },
      include: { prerrequisitosDe: true },
    });

    if (!materia || materia.pensumId !== perfil.pensumId) {
      throw new NotFoundException('La materia no pertenece a tu pensum');
    }

    // 3. Validar si ya está inscrita en este semestre
    const existe = await this.prisma.inscripcionSemestre.findUnique({
      where: {
        usuarioId_materiaId_semestreEtiqueta: {
          usuarioId: userId,
          materiaId: dto.materiaId,
          semestreEtiqueta: dto.semestre_etiqueta,
        },
      },
    });
    if (existe) {
      throw new BadRequestException('Ya estás inscrito en esta materia para este semestre');
    }

    // 4. Validar prerrequisitos (deben estar aprobados)
    if (materia.prerrequisitosDe.length > 0) {
      const idsPrereq = materia.prerrequisitosDe.map(p => p.materiaPrerrequisitoId);
      const inscripcionesPrereq = await this.prisma.inscripcionSemestre.findMany({
        where: {
          usuarioId: userId,
          materiaId: { in: idsPrereq },
          estado: 'aprobada',
        },
      });

      if (inscripcionesPrereq.length !== idsPrereq.length) {
        throw new BadRequestException('No cumples con los prerrequisitos aprobados para esta materia');
      }
    }

    return this.prisma.inscripcionSemestre.create({
      data: {
        usuarioId: userId,
        materiaId: dto.materiaId,
        semestreEtiqueta: dto.semestre_etiqueta,
        estado: 'en_curso',
      },
      include: { materia: true },
    });
  }

  async findAll(userId: string, semestre?: string) {
    return this.prisma.inscripcionSemestre.findMany({
      where: {
        usuarioId: userId,
        ...(semestre ? { semestreEtiqueta: semestre } : {}),
      },
      include: { materia: true },
      orderBy: { materia: { semestreNumero: 'asc' } },
    });
  }

  async findOne(userId: string, id: string) {
    const inscripcion = await this.prisma.inscripcionSemestre.findUnique({
      where: { id },
      include: { materia: true },
    });

    if (!inscripcion) throw new NotFoundException('Inscripción no encontrada');
    if (inscripcion.usuarioId !== userId) throw new ForbiddenException('No tienes permiso para ver esta inscripción');

    return inscripcion;
  }

  async update(userId: string, id: string, dto: UpdateInscripcioneDto) {
    const inscripcion = await this.findOne(userId, id);
    return this.prisma.inscripcionSemestre.update({
      where: { id: inscripcion.id },
      data: { ...dto },
    });
  }

  async remove(userId: string, id: string) {
    const inscripcion = await this.findOne(userId, id);
    
    // Solo permitir borrar si está "en_curso"
    if (inscripcion.estado !== 'en_curso') {
      throw new BadRequestException('Solo puedes eliminar inscripciones que estén en curso');
    }

    return this.prisma.inscripcionSemestre.delete({
      where: { id: inscripcion.id },
    });
  }

  async getMateriasDisponibles(userId: string, semestre: string) {
    const perfil = await this.prisma.perfilEstudiante.findUnique({
      where: { usuarioId: userId },
    });
    if (!perfil) throw new BadRequestException('Perfil no encontrado');

    // 1. Todas las materias del pensum
    const todasMaterias = await this.prisma.materia.findMany({
      where: { pensumId: perfil.pensumId },
      include: { prerrequisitosDe: true },
    });

    // 2. Historial del estudiante
    const historial = await this.prisma.inscripcionSemestre.findMany({
      where: { usuarioId: userId },
    });

    const aprobadasIds = new Set(historial.filter(h => h.estado === 'aprobada').map(h => h.materiaId));
    const cursandoEnSemestreActual = new Set(historial.filter(h => h.semestreEtiqueta === semestre).map(h => h.materiaId));
    const cursandoEnOtrosSemestres = new Set(historial.filter(h => h.estado === 'en_curso' && h.semestreEtiqueta !== semestre).map(h => h.materiaId));

    // 3. Filtrar disponibles
    return todasMaterias.filter(m => {
      // Ya aprobada o ya inscrita
      if (aprobadasIds.has(m.id) || cursandoEnSemestreActual.has(m.id) || cursandoEnOtrosSemestres.has(m.id)) return false;

      // Cumple prerrequisitos?
      return m.prerrequisitosDe.every(p => aprobadasIds.has(p.materiaPrerrequisitoId));
    });
  }
}

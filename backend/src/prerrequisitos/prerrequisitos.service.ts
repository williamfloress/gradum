import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePrerrequisitoDto } from './dto/update-prerrequisito.dto';

@Injectable()
export class PrerrequisitosService {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * Crea una relación de prerrequisito.
   */
  async create(materiaId: string, materiaPrerrequisitoId: string) {
    await this.validateDependency(materiaId, materiaPrerrequisitoId);

    return this.prisma.prerrequisito.upsert({
      where: {
        materiaId_materiaPrerrequisitoId: { materiaId, materiaPrerrequisitoId },
      },
      update: {},
      create: { materiaId, materiaPrerrequisitoId },
    });
  }

  /**
   * Actualiza una relación existente.
   */
  async update(materiaId: string, materiaPrerrequisitoId: string, updateData: UpdatePrerrequisitoDto,) {
    const nuevaPrerreqId = updateData.materiaPrerrequisitoId;

    if (!nuevaPrerreqId || nuevaPrerreqId === materiaPrerrequisitoId) {
      return this.prisma.prerrequisito.findUnique({
        where: {
          materiaId_materiaPrerrequisitoId: { materiaId, materiaPrerrequisitoId },
        },
      });
    }

    const existente = await this.prisma.prerrequisito.findUnique({
      where: {
        materiaId_materiaPrerrequisitoId: { materiaId, materiaPrerrequisitoId },
      },
    });
    if (!existente)
      throw new NotFoundException('Relación de prerrequisito no encontrada');

    await this.validateDependency(materiaId, nuevaPrerreqId);

    return this.prisma.prerrequisito.update({
      where: {
        materiaId_materiaPrerrequisitoId: { materiaId, materiaPrerrequisitoId },
      },
      data: { materiaPrerrequisitoId: nuevaPrerreqId },
    });
  }

  /**
   * Obtiene todos los prerrequisitos de una materia.
   */
  async findAll(materiaId: string) {
    return this.prisma.prerrequisito.findMany({
      where: { materiaId },
      include: { materiaPrerrequisito: true },
    });
  }

  /**
   * Elimina una relación de prerrequisito.
   */
  async remove(materiaId: string, materiaPrerrequisitoId: string) {
    return this.prisma.prerrequisito.delete({
      where: {
        materiaId_materiaPrerrequisitoId: { materiaId, materiaPrerrequisitoId },
      },
    });
  }

  /**
   * Centraliza las validaciones de negocio.
   */
  private async validateDependency(materiaId: string, prerreqId: string) {
    if (materiaId === prerreqId) {
      throw new BadRequestException(
        'Una materia no puede ser prerrequisito de sí misma',
      );
    }

    const [materia, prerreq] = await Promise.all([
      this.prisma.materia.findUnique({ where: { id: materiaId } }),
      this.prisma.materia.findUnique({ where: { id: prerreqId } }),
    ]);

    if (!materia) throw new NotFoundException(`Materia base no encontrada`);
    if (!prerreq)
      throw new NotFoundException(`Materia prerrequisito no encontrada`);

    if (materia.pensumId !== prerreq.pensumId) {
      throw new BadRequestException(
        'Ambas materias deben pertenecer al mismo Pensum',
      );
    }

    if (await this.wouldCreateCycle(materiaId, prerreqId)) {
      throw new BadRequestException(
        'Esta relación crearía un ciclo de prerrequisitos',
      );
    }
  }

  /**
   * Algoritmo DFS para detectar ciclos.
   */
  private async wouldCreateCycle(targetId: string, startId: string): Promise<boolean> {
    const visited = new Set<string>();
    const stack = [startId];

    while (stack.length > 0) {
      const currentId = stack.pop()!;

      if (currentId === targetId) return true;
      if (visited.has(currentId)) continue;

      visited.add(currentId);

      const dependencies = await this.prisma.prerrequisito.findMany({
        where: { materiaId: currentId },
        select: { materiaPrerrequisitoId: true },
      });

      for (const dep of dependencies) {
        if (!visited.has(dep.materiaPrerrequisitoId)) {
          stack.push(dep.materiaPrerrequisitoId);
        }
      }
    }

    return false;
  }
}

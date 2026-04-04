import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CreateMateriaDto } from './dto/create-materia.dto';
import { UpdateMateriaDto } from './dto/update-materia.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MateriaService {
  constructor(private readonly prisma: PrismaService) { }

  // Crear una materia asociada a un pensum
  async create(pensumId: string, createMateriaDto: CreateMateriaDto) {
    // Validar que el pensum exista
    const pensum = await this.prisma.pensum.findUnique({
      where: { id: pensumId }
    });

    if (!pensum) {
      throw new NotFoundException(`Pensum con ID ${pensumId} no encontrado`);
    }

    // Validar que el código no esté duplicado (si se proporciona)
    if (createMateriaDto.codigo) {
      const materiaExistente = await this.prisma.materia.findFirst({
        where: { codigo: createMateriaDto.codigo },
      });

      if (materiaExistente) {
        throw new ConflictException(`El código de materia '${createMateriaDto.codigo}' ya existe`);
      }
    }

    // Crear la materia
    return this.prisma.materia.create({
      data: {
        pensumId,
        ...createMateriaDto,
      },
    });
  }

  // Obtener todas las materias de un pensum
  async findAll(pensumId: string) {
    // Validar que el pensum exista
    const pensum = await this.prisma.pensum.findUnique({
      where: { id: pensumId }
    });

    if (!pensum) {
      throw new NotFoundException(`Pensum con ID ${pensumId} no encontrado`);
    }

    // No hay materias registradas
    const materias = await this.prisma.materia.findMany({
      where: {
        pensumId,
      },
    });

    if (materias.length === 0) {
      throw new NotFoundException(`No hay materias registradas para el pensum con ID ${pensumId}`);
    }

    return materias;
  }

  // Actualizar una materia
  async update(id: string, updateMateriaDto: UpdateMateriaDto) {
    // Validar que la materia exista
    const materia = await this.prisma.materia.findUnique({
      where: { id }
    });

    if (!materia) {
      throw new NotFoundException(`Materia con ID ${id} no encontrada`);
    }

    // Validar que el código no esté duplicado (si se proporciona)
    if (updateMateriaDto.codigo) {
      const materiaExistente = await this.prisma.materia.findFirst({
        where: { codigo: updateMateriaDto.codigo },
      });

      if (materiaExistente) {
        throw new ConflictException(`El código de materia '${updateMateriaDto.codigo}' ya existe`);
      }
    }

    return this.prisma.materia.update({
      where: {
        id,
      },
      data: updateMateriaDto,
    });
  }

  // Eliminar una materia
  async remove(id: string) {
    // Validar que la materia exista
    const materia = await this.prisma.materia.findUnique({
      where: { id }
    });

    if (!materia) {
      throw new NotFoundException(`Materia con ID ${id} no encontrada`);
    }

    return this.prisma.materia.delete({
      where: {
        id,
      },
    });
  }
}
